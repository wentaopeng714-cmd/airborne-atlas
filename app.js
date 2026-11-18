import { InstrumentDock, SoundEngine } from './instruments.js';
import { createScoreScene } from './score-stage.js';
import { AirHands } from './gesture.js';
import { themes, icon, demos, getDemo, improvise, randomSeed } from './catalog.js';

import { NoteFlights } from './flight.js';
import { makeVoyage, extendVoyage, sectionAt } from './voyage.js';
import { weathers, lights, weatherIcon, freeClimate, discoveries } from './field.js';
import { LandscapeSound } from './soundscape.js';

const $=id=>document.getElementById(id);
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const timeLabel=t=>Math.floor(Math.max(0,t)/60)+':'+String(Math.floor(Math.max(0,t)%60)).padStart(2,'0');
const prefix='airborne-atlas.v1.';
function read(key,otherwise=null){try{return JSON.parse(localStorage.getItem(prefix+key))??otherwise}catch{return otherwise}}
function write(key,data){try{localStorage.setItem(prefix+key,JSON.stringify(data));return true}catch{return false}}
function parseScore(raw){
 if(raw?.format!=='airborne-atlas/1'||!Object.hasOwn(themes,raw.theme)||!Array.isArray(raw.events)||raw.events.length>100000)throw Error('这份文件没有可读取的浮音谱页。');
 if(!Number.isInteger(raw.seed)||typeof raw.title!=='string')throw Error('谱页缺少种子或曲名。');
 let last=0;
 const events=raw.events.map(e=>{
   if(!Number.isInteger(e?.m)||e.m<60||e.m>84||!Number.isFinite(e.t)||e.t<last||e.t>604800||!Number.isFinite(e.v)||!Number.isInteger(e.s))throw Error('谱页中的音符数据不完整。');
   last=e.t;return {m:e.m,t:e.t,v:clamp(e.v,.04,1),s:e.s>>>0,...(Number.isInteger(e.site)&&e.site>=0&&e.site<100000?{site:e.site}:{}),...(e.landmark===true?{landmark:true}:{}),...(e.live===true?{live:true}:{})};
 });
 const parsed={format:'airborne-atlas/1',title:raw.title.trim().slice(0,48)||'未命名谱页',theme:raw.theme,seed:raw.seed>>>0,night:raw.night===true,
   weather:Object.hasOwn(weathers,raw.weather)?raw.weather:'auto',light:Object.hasOwn(lights,raw.light)?raw.light:(raw.night?'night':'auto'),events};
 const cue=raw.climateCue;
 if(cue&&Number.isInteger(cue.phase)&&cue.phase>=0&&Object.hasOwn(weatherIcon,cue.weather)&&cue.weather!=='auto'&&Object.hasOwn(lights,cue.light)&&cue.light!=='auto'){
   parsed.climateCue={phase:cue.phase,weather:cue.weather,light:cue.light};
 }
 if(raw.voyage){
   const v=raw.voyage;
   if(!Number.isInteger(v.chapter)||v.chapter<0||!Number.isInteger(v.seed)||!Array.isArray(v.sections)||v.sections.length!==4*(v.chapter+1))throw Error('漫游乐章资料不完整。');
   let end=0;
   const sections=v.sections.map((r,i)=>{
     if(r?.chapter!==Math.floor(i/4)+1||r.section!==i%4+1||r.start!==end||!Number.isFinite(r.end)||r.end<=end||!Object.hasOwn(weatherIcon,r.weather)||r.weather==='auto'||typeof r.label!=='string')throw Error('漫游段落时间或天气无法读取。');
     end=r.end;return {chapter:r.chapter,section:r.section,start:r.start,end,weather:r.weather,...(Object.hasOwn(lights,r.light)&&r.light!=='auto'?{light:r.light}:{}),label:r.label.slice(0,30)};
   });
   if(end!==v.endsAt||end+0.01<last)throw Error('漫游时长与谱页不一致。');
   parsed.voyage={seed:v.seed>>>0,chapter:v.chapter,endsAt:end,sections,...(Number.isInteger(v.built)?{built:clamp(v.built,0,events.length)}:{})};
 }
 return parsed;
}
let score;
try{score=parseScore(read('draft'))}catch{score=makeVoyage('herbarium',randomSeed())}
const pref=read('settings',{}), options={volume:clamp(Number(pref.volume??.76),0,1),speed:[.65,.85,1,1.25,1.5].includes(pref.speed)?pref.speed:1,follow:pref.follow!==false,fx:pref.fx!==false,ambient:pref.ambient!==false,sensitivity:['light','normal','firm'].includes(pref.sensitivity)?pref.sensitivity:'normal'};
let collection=read('collection',[]);
if(!Array.isArray(collection))collection=[];
collection=collection.flatMap(item=>{try{return [{id:String(item.id),at:Number(item.at)||0,score:parseScore(item.score)}]}catch{return []}});
let pendingSave,toastClock,oldRecordTime=null,recordBase=0,selectionTab='demo';
let playback='idle',pos=0,origin=0,cursor=0,frame=0,partial=false;
const history=[];
const openingSites=12;
const placed=new Map();
let guidedSlot=-1;
const sound=new SoundEngine();
sound.setVolume(options.volume);
const scene=createScoreScene($('score'));
const dock=new InstrumentDock($('instrument'),strike);
const flights=new NoteFlights($('flight-layer'),dock,scene,$('score'));
const atmosphere=new LandscapeSound(sound);
let effectiveWeather=null,effectiveLight=null,regionKey='',notesForMotif=[],lastMarkCount=-10,liveCount=0;
let ambienceUntil=0, ambienceTimer;
const found=new Set((Array.isArray(read('finds',[]))?read('finds',[]):[]).filter(value=>typeof value==='string'));
const hands=new AirHands({weatherControl:true,lightControl:true,sensitivity:options.sensitivity,video:$('video'),canvas:$('hand-overlay'),
 onHover:(slot,x)=>dock.hover(slot,$('panel').open?null:x),
 onStrike:(slot,x,v)=>{if(!$('panel').open){const m=dock.midiAtX(x);if(Number.isFinite(m)){dock.flash(m);strike(m,v)}}},
 onCommandHover:(slot,command)=>showAirTarget(slot,command),
 onCommand:(_slot,command)=>runAirCommand(command),
 onStatus:cameraStatus
});
const themeEntries=Object.entries(themes);
const airHover=new Map();
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastClock);toastClock=setTimeout(()=>el.classList.remove('show'),2200)}
function saveDraft(){clearTimeout(pendingSave);pendingSave=setTimeout(flush,180)}
function flush(){
 clearTimeout(pendingSave);write('draft',score);
 write('bookmark',score.voyage?{seed:score.voyage.seed,at:pos}:null);
}
function settingsChanged(){write('settings',options)}
function climateAt(count){
 const r=sectionAt(pos,score),cue=score.climateCue;
 const free=cue&&cue.phase===Math.floor(Math.max(0,count-1)/16)?cue:freeClimate(score.seed,count);
 return {weather:score.weather&&score.weather!=='auto'?score.weather:(r?.weather||free.weather),
   light:score.light&&score.light!=='auto'?score.light:(r?(r.light||['dawn','day','dusk','night'][r.section-1]):free.light),region:r};
}
function sceneOptions(){
 const c=climateAt(partial?cursor:score.events.length);
 return {theme:score.theme,seed:score.seed,night:c.light==='night',light:c.light,weather:c.weather,title:score.title};
}
function syncClimate(count,force=false){
 const c=climateAt(count),region=c.region;
 if(force||effectiveWeather!==c.weather||effectiveLight!==c.light){
   effectiveWeather=c.weather;effectiveLight=c.light;
   scene.setWeather(c.weather);scene.setLight(c.light);
   document.documentElement.dataset.night=String(c.light==='night');document.documentElement.dataset.weather=c.weather;
   $('climate-icon').innerHTML=icon(weatherIcon[c.weather]);$('climate-label').textContent=lights[c.light]+' · '+weathers[c.weather];
   $('day-mode').setAttribute('aria-pressed',String(c.light==='day'));$('night-mode').setAttribute('aria-pressed',String(c.light==='night'));
   refreshAmbience();
 }
 const key=region?region.chapter+'.'+region.section+':'+region.label:'';
 if(force||key!==regionKey){
   regionKey=key;$('journey-label').textContent=region?'漫游 · 第 '+region.chapter+' 章 · '+region.label:'无尽漫游';
   $('journey-label').dataset.compact=region?'第'+region.chapter+'章 · '+region.label:'无尽漫游';
   $('journey').setAttribute('aria-label',$('journey-label').textContent);
   $('journey').setAttribute('aria-pressed',String(Boolean(region)));$('journey').title=region?'漫游进度与自由演奏':'开启无尽漫游，可跟随合奏';
 }
}
function refreshAmbience(){atmosphere.ambience(effectiveWeather||'clear',options.ambient&&!document.hidden&&(playback==='playing'||performance.now()<ambienceUntil))}
function clearFlight(){flights.clear();atmosphere.cancel()}
function landscapeCount(){
 return score.voyage?Math.min(score.events.length,Math.max(score.voyage.built??openingSites,cursor)):score.events.length;
}
function restoreLandscape(focusEvent=null){
 const count=landscapeCount(),sites=score.events.slice(0,count);
 // An overdub behind the playhead keeps its musical time, but acquires new land
 // at the growing end. Existing buildings retain their plot when the take reopens.
 sites.sort((a,b)=>(a.site??Number.MAX_SAFE_INTEGER)-(b.site??Number.MAX_SAFE_INTEGER));
 placed.clear();guidedSlot=-1;
 sites.forEach((event,i)=>{placed.set(event,i);event.site=i});
 if(score.voyage)score.voyage.built=count;
 const settings=sceneOptions();
 if(focusEvent&&options.follow){settings.focusIndex=placed.get(focusEvent);guidedSlot=settings.focusIndex??-1}
 scene.setScore(sites,settings);
}
function drawScore(){clearFlight();partial=false;restoreLandscape();syncClimate(score.events.length,true)}
function duration(){return score.voyage?.endsAt??(score.events.length?score.events.at(-1).t+1.45:0)}
function snapshot(){return {...score,...(score.voyage?{voyage:{...score.voyage}}:{}),events:score.events.slice()}}
function remember(entry={before:snapshot()}){history.push(entry);if(history.length>100)history.shift();$('undo').disabled=false}
function syncHeader(){
 const t=themes[score.theme];document.documentElement.dataset.theme=score.theme;
 $('selected-art').src='./art/landmark-'+score.theme+'.png';$('mobile-theme-name').textContent=t.name;
 $('instrument-name').textContent=t.instrument;$('score-name').textContent=score.title;
 dock.setTheme(t.dock||score.theme);syncClimate(partial?cursor:score.events.length,true);updateStats();
}
function updateStats(){
 $('note-count').textContent=score.events.length+' 个音';$('undo').disabled=!history.length;$('play').disabled=!score.events.length;$('position').disabled=!score.events.length;
 updateTransport();
}
function updateTransport(){
 const d=duration();
 const time=timeLabel(pos)+' / '+timeLabel(Math.ceil(d));if($('clock').textContent!==time)$('clock').textContent=time;
 $('position').value=d?Math.round(clamp(pos/d,0,1)*1000):0;
 const isPlaying=playback==='playing', label=isPlaying?'暂停':score.voyage?(playback==='paused'?'继续漫游':'开始漫游'):(playback==='paused'?'继续回放':'回放');
 if($('play-state').textContent!==label)$('play-state').textContent=label;
 const key=isPlaying?'pause':'play';if($('play').dataset.icon!==key){$('play').innerHTML=icon(key);$('play').dataset.icon=key}
 $('play').setAttribute('aria-label',isPlaying?'暂停回放':'播放乐谱');
}
function halt(restore=true){
 cancelAnimationFrame(frame);frame=0;
 if(playback!=='idle')sound.stop();clearFlight();
 ambienceUntil=0;atmosphere.ambience(effectiveWeather,false);
 playback='idle';pos=0;cursor=0;notesForMotif=[];lastMarkCount=-10;liveCount=0;
 if(restore&&partial)drawScore();
 partial=false;oldRecordTime=null;updateTransport();
}
function replace(newScore,{play=false}={}){
 remember();halt(false);score=newScore;drawScore();syncHeader();saveDraft();if(play)beginPlayback();
}
function changeScenery(change){
 remember();clearFlight();notesForMotif=[];lastMarkCount=-10;
 if(change.theme&&change.theme!==score.theme)sound.stop();
 score={...score,...change};
 if(partial){
   restoreLandscape(score.events[Math.max(0,cursor-1)]);
 }else drawScore();
 syncHeader();saveDraft();
}
function switchTheme(id){
 if(id===score.theme)return;
 if(!score.voyage){changeScenery({theme:id});return}
 const incoming=makeVoyage(id,score.voyage.seed);
 if(playback==='idle'&&pos===0&&score.voyage.chapter===0&&!score.events.some(e=>e.live)){
   incoming.seed=score.seed;incoming.light=score.light;incoming.weather=score.weather;
   replace(incoming);return;
 }
 // Changing a landscape during a take keeps the performance and bar boundaries.
 const sections=score.voyage.sections.map(r=>({...r,label:incoming.voyage.sections[r.section-1].label}));
 changeScenery({theme:id,voyage:{...score.voyage,sections}});
}
function reseed(){
 changeScenery({seed:randomSeed()});
 toast('旋律已保留，景物重新生长');
}
function plant(event,index,playAudio=true,alreadyPlayed=false){
 const planted=placed.has(event),slot=planted?placed.get(event):placed.size;
 if(!planted){placed.set(event,slot);event.site=slot;if(score.voyage)score.voyage.built=placed.size}
 const followExisting=planted&&(!score.voyage||slot>=guidedSlot);
 if(!planted||followExisting)guidedSlot=slot;
 if(!playAudio){if(followExisting)scene.focusNote(slot);else if(!planted)scene.addNote(event,slot,0);return 0}
 if(!alreadyPlayed)sound.play(event.m,event.v,themes[score.theme].dock||score.theme);
 dock.flash(event.m);
 const delay=flights.launch(event,slot,{theme:score.theme,weather:effectiveWeather});
 if(planted){if(followExisting)scene.focusNote(slot);scene.pulse(slot,delay)}else scene.addNote(event,slot,delay);
 if(options.fx)atmosphere.note(event,delay,effectiveWeather,event.landmark);
 return delay;
}
function takeDiscovery(event){
 liveCount++;notesForMotif.push(event.m);if(notesForMotif.length>3)notesForMotif.shift();
 const d=discoveries[score.theme];
 if(notesForMotif.length<3||liveCount-lastMarkCount<7||!d.match(...notesForMotif))return;
 lastMarkCount=liveCount;event.landmark=true;
 const mark=score.theme+'-'+effectiveWeather;
 if(!found.has(mark)){found.add(mark);write('finds',[...found]);return weathers[effectiveWeather]+'里的'+d.name+' · 已记入采风手记'}
 return d.name+'在谱上展开';
}
function strike(midi,velocity){
 if($('panel').open)return;
 if(!score.voyage&&(playback!=='idle'||pos>0||partial))halt(true);
 sound.play(midi,velocity,themes[score.theme].dock||score.theme);
 if(score.voyage&&playback!=='playing')beginPlayback();
 const now=performance.now(),moment=now/1000;
 let t,index;
 if(score.voyage){
   pos=Math.max(pos,(now-origin)*options.speed/1000);appendIfNeeded(pos);playThrough(pos);
   t=pos;index=cursor;
 }else{
   if(oldRecordTime===null){recordBase=score.events.length?score.events.at(-1).t+.48:0;oldRecordTime=moment}
   t=recordBase+moment-oldRecordTime;index=score.events.length;
 }
 const event={m:midi,v:clamp(velocity,.04,1),t:Number(t.toFixed(4)),s:randomSeed(),live:true};
 if(score.events[index-1])event.t=Math.max(event.t,score.events[index-1].t);
 if(score.events[index])event.t=Math.min(event.t,score.events[index].t);
 syncClimate(index+1);const message=takeDiscovery(event);remember({remove:event});
 score.events.splice(index,0,event);const arrival=plant(event,index,true,true);
 if(message){const theme=score.theme;setTimeout(()=>{if(score.theme===theme&&scene.events[placed.get(event)]===event)toast(message)},arrival+90)}
 if(score.voyage)cursor++;
 ambienceUntil=now+4800;refreshAmbience();clearTimeout(ambienceTimer);ambienceTimer=setTimeout(refreshAmbience,4900);
 updateStats();saveDraft();
}
function undo(){
 if(!history.length)return;
 const last=history.pop();
 if(last.remove&&score.voyage&&partial){
   const time=pos,playing=playback==='playing',i=score.events.indexOf(last.remove);
   if(i>=0){score.events.splice(i,1);score.voyage.built=Math.max(0,score.voyage.built-1)}
   rebuildAt(time);if(playing)origin=performance.now()-time*1000/options.speed;
   updateStats();
 }else{
   halt(false);
   if(last.remove){const i=score.events.indexOf(last.remove);if(i>=0)score.events.splice(i,1)}else score=last.before;
   drawScore();scene.home();syncHeader();
 }
 saveDraft();toast('已撤销');
}
function newPage(){
 replace({format:'airborne-atlas/1',theme:score.theme,title:'无题手记',night:score.night,weather:score.weather||'auto',light:score.light||'auto',seed:randomSeed(),events:[]});
 toast('空白谱页已展开，弹一个音开始');
}
function rebuildAt(seconds){
 clearFlight();partial=true;pos=clamp(seconds,0,duration());
 cursor=score.events.findIndex(e=>e.t>=pos-.00001);if(cursor<0)cursor=score.events.length;
 restoreLandscape(score.events[Math.max(0,cursor-1)]);syncClimate(cursor,true);
}
function playThrough(at){
 while(cursor<score.events.length&&score.events[cursor].t<=at+.00005){
   const e=score.events[cursor];syncClimate(cursor+1);plant(e,cursor,at-e.t<.24);cursor++;
 }
}
function appendIfNeeded(at){
 if(score.voyage&&at>=duration()){
   score=extendVoyage(score);updateStats();saveDraft();
   toast('新乐章展开 · 第 '+(score.voyage.chapter+1)+' 章');
 }
}
function advance(now){
 if(playback!=='playing')return;
 const at=(now-origin)*options.speed/1000;appendIfNeeded(at);pos=Math.min(duration(),at);
 playThrough(pos);syncClimate(cursor);
 if(pos>=duration()){playback='idle';partial=false;oldRecordTime=null;refreshAmbience();updateTransport();return}
 updateTransport();frame=requestAnimationFrame(advance);
}
function beginPlayback(){
 if(!score.events.length)return;
 sound.unlock();oldRecordTime=null;
 if(playback==='playing'){pausePlayback();return}
 if(score.voyage&&pos>=duration()){appendIfNeeded(pos);rebuildAt(pos)}else if(playback!=='paused'||pos>=duration()){
   clearFlight();partial=true;pos=0;cursor=0;syncClimate(0,true);
   const first=placed.get(score.events[0]);if(first!==undefined&&options.follow){guidedSlot=first;scene.focusNote(first,true)}
 }
 playback='playing';refreshAmbience();origin=performance.now()-pos*1000/options.speed;advance(performance.now());
}
function pausePlayback(){
 if(playback!=='playing')return;cancelAnimationFrame(frame);frame=0;
 pos=Math.min(duration(),(performance.now()-origin)*options.speed/1000);playback='paused';sound.stop();refreshAmbience();updateTransport();
}
function seek(){
 if(!score.events.length)return;
 const playing=playback==='playing';cancelAnimationFrame(frame);sound.stop();rebuildAt(Number($('position').value)/1000*duration());
 playback=playing?'playing':'paused';origin=performance.now()-pos*1000/options.speed;
 if(playing)advance(performance.now());else updateTransport();
}
function showPanel(title,html,pause=true){
 if(pause&&playback==='playing')pausePlayback();
 oldRecordTime=null;$('panel-title').textContent=title;$('panel-body').innerHTML=html;
 hands.setInputEnabled?.(false);
 if(!$('panel').open)$('panel').showModal();
}
function closePanel(){$('panel').close()}
$('close').onclick=closePanel;
$('panel').addEventListener('close',()=>hands.setInputEnabled?.(true));
$('panel').addEventListener('click',e=>{if(e.target!==$('panel'))return;const r=$('panel').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closePanel()});
function libraryRow(name,info,theme,action){
 return '<button class="library-row" data-action="'+action+'"><span class="library-art" ><img src="./art/landmark-'+theme+'.png" alt=""></span><span class="row-copy"><b>'+esc(name)+'</b><small>'+esc(info)+'</small></span>'+icon('arrow')+'</button>';
}
function showLibrary(tab=selectionTab){
 selectionTab=tab;const isDemo=tab==='demo';
 const rows=isDemo?demos.map((d,i)=>libraryRow(d.name,themes[d.theme].name+' · '+themes[d.theme].instrument,d.theme,i)).join(''):
 collection.map((item,i)=>libraryRow(item.score.title,themes[item.score.theme].name+' · '+item.score.events.length+' 个音 · '+new Date(item.at).toLocaleDateString('zh-CN'),item.score.theme,i)).join('')||'<p class="empty">谱册里还没有作品。演奏后点「保存乐谱」，就能把这一页留下。</p>';
 showPanel('曲目与谱册','<div class="tabs" aria-label="曲目类型"><button id="tab-demo" aria-selected="'+isDemo+'">示范曲</button><button id="tab-saved" aria-selected="'+!isDemo+'">我的谱册</button></div>'+rows+'<div class="dialog-actions">'+(isDemo?'<button class="text-btn" id="compose">'+icon('shuffle')+'即兴生成一首</button><button class="secondary-btn" id="library-voyage">开启无尽漫游</button>':'')+'<button class="secondary-btn" id="import">导入谱页文件</button></div>');
 $('tab-demo').onclick=()=>showLibrary('demo');$('tab-saved').onclick=()=>showLibrary('saved');
 $('import').onclick=()=>$('file-open').click();
 if(isDemo)$('library-voyage').onclick=startJourney;
 if(isDemo)$('compose').onclick=()=>{closePanel();replace(improvise(score.theme),{play:true})};
 $('panel-body').querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{
   const i=Number(b.dataset.action);const next=isDemo?getDemo(i):parseScore(collection[i].score);
   closePanel();replace(next,{play:isDemo});if(!isDemo)toast('已打开谱页');
 });
}
function showThemes(){
 const cards=themeEntries.map(([id,t])=>'<button class="scene-card" data-pick="'+id+'" aria-pressed="'+(score.theme===id)+'"><img src="./art/landmark-'+id+'.png" alt=""><b>'+t.name+'</b><small>'+t.instrument+'</small></button>').join('');
 showPanel('选择声景','<div class="dialog-themes">'+cards+'</div>',false);
 $('panel-body').querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{closePanel();switchTheme(b.dataset.pick)});
}
function choice(group,values,current){
 return '<div class="choices" role="group" aria-label="'+(group==='weather'?'天气':'时段')+'">'+Object.entries(values).map(([id,label])=>{
   const art=group==='weather'?icon(weatherIcon[id]):'<span class="light-swatch light-'+id+'"></span>';
   return '<button data-group="'+group+'" data-choice="'+id+'" aria-label="'+label+'" aria-pressed="'+(id===current)+'">'+art+'<span>'+(id==='auto'?'随演奏':label)+'</span></button>';
 }).join('')+'</div>';
}
function chooseLight(light){
 score.light=light;score.night=light==='night';syncClimate(partial?cursor:score.events.length,true);saveDraft();
}
$('day-mode').onclick=()=>chooseLight('day');$('night-mode').onclick=()=>chooseLight('night');
function showClimate(){
 showPanel('天气与时段','<h3 class="setting-title">天气</h3>'+choice('weather',weathers,score.weather||'auto')+'<h3 class="setting-title">光线</h3>'+choice('light',lights,score.light||(score.night?'night':'auto'))+'<p class="reading">选择「随演奏」，自由演奏每 16 个音换一景，漫游则跟随乐句进入下一段天气。</p><div class="dialog-actions"><button id="reseed" class="text-btn">'+icon('shuffle')+'用新种子换景</button></div>',false);
 $('panel-body').querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{
   const key=b.dataset.group;score[key]=b.dataset.choice;if(key==='light')score.night=score.light==='night';
   syncClimate(partial?cursor:score.events.length,true);saveDraft();closePanel();
 });
 $('reseed').onclick=()=>{closePanel();reseed()};
}
function showJournal(){
 const id=score.theme,d=discoveries[id],weatherIds=['clear','rain','wind','snow'];
 const stamps='<div class="stamps">'+weatherIds.map(w=>'<span class="'+(found.has(id+'-'+w)?'marked':'')+'" title="'+weathers[w]+(found.has(id+'-'+w)?'已采集':'待采集')+'">'+icon(weatherIcon[w])+'</span>').join('')+'</div>';
 const entries=themeEntries.map(([k,t])=>'<button data-jump="'+k+'"><img src="./art/landmark-'+k+'.png" alt=""><span>'+t.name+'</span><span>'+weatherIds.filter(w=>found.has(k+'-'+w)).length+'/4</span></button>').join('');
 showPanel('采风手记','<div class="field-feature"><img src="./art/landmark-'+id+'.png" alt=""><div><b>'+d.name+'</b><p>'+d.hint+'，让地标在谱上出现。</p>'+stamps+'</div></div><p class="reading">在不同天气亲手奏出地标乐句，就能收下对应的天气印记。已收集 '+found.size+' / 32 枚。</p><div class="field-index">'+entries+'</div>',false);
 $('panel-body').querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>{switchTheme(b.dataset.jump);showJournal()});
}
function startJourney(){
 if($('panel').open)closePanel();
 if(score.voyage){if(playback!=='playing')beginPlayback();return}
 const previous=snapshot(),next=makeVoyage(previous.theme,previous.seed);
 const lead=previous.events.length?previous.events.at(-1).t+.48:0;
 next.events=previous.events.concat(next.events.map(e=>({...e,t:e.t+lead})));
 next.voyage.sections=next.voyage.sections.map((r,i)=>({...r,start:i===0?0:r.start+lead,end:r.end+lead}));
 next.voyage.endsAt+=lead;next.voyage.built=previous.events.length;
 if(previous.events.length){next.voyage.sections[0].weather=effectiveWeather;next.voyage.sections[0].light=effectiveLight}
 next.light=previous.light||'auto';next.weather=previous.weather||'auto';next.night=previous.night;
 remember();halt(false);score=next;cursor=previous.events.length;partial=true;pos=lead;
 restoreLandscape(previous.events.at(-1));syncHeader();playback='paused';beginPlayback();saveDraft();
 toast('漫游沿当前长卷继续');
}
function journeyButton(){
 if(!score.voyage){startJourney();return}
 if(playback==='idle'&&pos===0){beginPlayback();toast('漫游开始 · 弹键或捏合即可加入');return}
 const r=sectionAt(pos,score);
 showPanel('无尽漫游','<div class="field-feature"><img src="./art/landmark-'+score.theme+'.png" alt=""><div><b>'+esc(r.label)+'</b><p>第 '+r.chapter+' 章 · 第 '+r.section+' / 4 段 · '+weathers[effectiveWeather]+'</p></div></div><p class="reading">每章约三分钟。下一章的旋律会沿着这张长卷继续生长。向下拖动可以回看走过的地方。</p><div class="dialog-actions"><button class="air-btn" id="resume-journey">继续合奏</button><button class="secondary-btn" id="leave-journey">回到自由演奏</button></div>');
 $('resume-journey').onclick=()=>{closePanel();beginPlayback()};
 $('leave-journey').onclick=()=>{
   const free={...score,title:'漫游手记',events:score.events.filter(e=>placed.has(e))};
   free.climateCue={phase:Math.floor(Math.max(0,free.events.length-1)/16),weather:effectiveWeather,light:effectiveLight};
   delete free.voyage;closePanel();replace(free);toast('继续在这张长卷上自由演奏');
 };
}
function showSettings(){
 showPanel('演奏设置','<label class="option">音量<input id="volume" type="range" min="0" max="100" value="'+Math.round(options.volume*100)+'"></label>'+
 '<label class="option">演奏速度<select id="speed">'+[.65,.85,1,1.25,1.5].map(v=>'<option value="'+v+'" '+(v===options.speed?'selected':'')+'>'+v+' ×</option>').join('')+'</select></label>'+
 '<label class="option">捏合手感<select id="sensitivity">'+[['light','轻捏'],['normal','标准'],['firm','收紧']].map(([v,name])=>'<option value="'+v+'" '+(v===options.sensitivity?'selected':'')+'>'+name+'</option>').join('')+'</select></label>'+
 '<label class="option">音符飞行与落点声<input id="fx" type="checkbox" '+(options.fx?'checked':'')+'></label><label class="option">天气环境声<input id="ambient" type="checkbox" '+(options.ambient?'checked':'')+'></label><label class="option">跟随新生景物<input id="follow" type="checkbox" '+(options.follow?'checked':'')+'></label>'+
 '<p class="reading">触屏轻点或滑奏，电脑可按 A、S、D 等键弹奏。轻点谱上的景物可重听这个音。上下拖动可沿长卷回看，左右拖动环看景物，双指开合缩放。点「回到生长位置」继续跟随。</p><p class="reading">打开隔空演奏后，左右移手选音，拇指和食指捏合发声。指尖在镜头顶栏停半秒再捏合，可从左到右控制回放、声景、天气、昼夜和换景。镜头画面在本机处理。</p>');
 $('volume').oninput=e=>{options.volume=e.target.value/100;sound.setVolume(options.volume);settingsChanged()};
 $('speed').onchange=e=>{options.speed=Number(e.target.value);settingsChanged()};
 $('sensitivity').onchange=e=>{options.sensitivity=e.target.value;hands.setSensitivity(options.sensitivity);settingsChanged()};
 $('follow').onchange=e=>{options.follow=e.target.checked;scene.setFollow(options.follow);settingsChanged()};
 $('fx').onchange=e=>{options.fx=e.target.checked;if(!options.fx)atmosphere.cancel();settingsChanged()};
 $('ambient').onchange=e=>{options.ambient=e.target.checked;refreshAmbience();settingsChanged()};
}
function download(blob,name){
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name.replace(/[\\/:*?"<>|]/g,'_');document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
function makeMidi(s){
 const track=[0,255,81,3,7,161,32,0,192,{herbarium:0,harbor:75,fair:13,tide:46}[themes[s.theme].dock||s.theme]],messages=[];
 const lastByNote=new Map();
 for(const e of s.events){
   const tick=Math.round(e.t*960),off=lastByNote.get(e.m);
   if(off&&off.tick>tick)off.tick=tick;
   const release={tick:tick+Math.round((.27+e.v*.15)*960),order:0,status:128,note:e.m,data:0};
   messages.push({tick,order:1,status:144,note:e.m,data:Math.round(e.v*126)+1},release);lastByNote.set(e.m,release);
 }
 messages.sort((a,b)=>a.tick-b.tick||a.order-b.order);
 let prev=0;for(const m of messages){let v=m.tick-prev;const bytes=[v&127];while((v=Math.floor(v/128))>0)bytes.unshift((v&127)|128);track.push(...bytes,m.status,m.note,m.data);prev=m.tick}
 track.push(0,255,47,0);const len=track.length;
 return new Blob([new Uint8Array([77,84,104,100,0,0,0,6,0,0,0,1,1,224,77,84,114,107,(len>>>24)&255,(len>>>16)&255,(len>>>8)&255,len&255]),new Uint8Array(track)],{type:'audio/midi'});
}
function showSave(){
 showPanel('保存乐谱','<label class="field">曲名<input id="piece-title" type="text" maxlength="48" value="'+esc(score.title)+'"></label><p class="panel-note">音高、节奏、声景和生长种子会一起保存。在其他设备上可导入谱页文件，重现这次演奏。</p><div class="dialog-actions"><button class="air-btn" id="keep">'+icon('book')+'存入我的谱册</button><button id="export-file" class="secondary-btn">下载谱页</button><button id="midi" class="secondary-btn">导出 MIDI</button></div><p id="save-error" role="status" class="panel-note"></p>');
 const titled=()=>({...snapshot(),title:$('piece-title').value.trim()||'无题手记'});
 const rename=s=>{if(score.title!==s.title){score.title=s.title;$('score-name').textContent=s.title;if(partial)rebuildAt(pos);else drawScore();saveDraft()}};
 $('keep').onclick=()=>{const s=titled(),entry={id:String(randomSeed()),at:Date.now(),score:s};const list=[entry,...collection];if(!write('collection',list)){$('save-error').textContent='浏览器存储空间不足，可下载谱页保存。';return}collection=list;rename(s);closePanel();toast('已存入我的谱册')};
 $('export-file').onclick=()=>{const s=titled();rename(s);download(new Blob([JSON.stringify(s)],{type:'application/json'}),s.title+'.airfolio.json')};
 $('midi').onclick=()=>{const s=titled();download(makeMidi(s),s.title+'.mid')};
 $('piece-title').onkeydown=e=>{if(e.key==='Enter')$('keep').click()};
}
$('file-open').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;try{if(file.size>8e6)throw Error('文件过大，请选择 8 MB 以内的浮音谱页。');const imported=parseScore(JSON.parse(await file.text()));closePanel();replace(imported);toast('谱页已导入')}catch(err){showPanel('无法导入谱页','<p class="panel-note">'+esc(err instanceof SyntaxError?'请选择通过「下载谱页」保存的 JSON 文件。':err.message)+'</p>')}};

function runAirCommand(command){
 if($('panel').open)return;
 if(command==='play'){if(score.events.length)beginPlayback();else toast('先弹一个音，就能回放');return}
 if(command==='theme'){const ids=Object.keys(themes);switchTheme(ids[(ids.indexOf(score.theme)+1)%ids.length]);toast(themes[score.theme].name+' · '+themes[score.theme].instrument);return}
 if(command==='weather'){
   const cycle=['clear','rain','wind','snow','auto'];
   const current=score.weather&&score.weather!=='auto'?score.weather:effectiveWeather;
   score.weather=cycle[(cycle.indexOf(current)+1)%cycle.length];
   syncClimate(partial?cursor:score.events.length,true);saveDraft();toast('天气 · '+weathers[score.weather]);return;
 }
 if(command==='light'){chooseLight(effectiveLight==='night'?'day':'night');toast(lights[score.light]);return}
 if(command==='seed')reseed();
}
function showAirTarget(slot,command){
 if(command)airHover.set(slot,command);else airHover.delete(slot);
 updateAirHint();
}
function updateAirHint(){
 const active=['ready','tracking'].includes(hands.state);
 const command=Array.from(airHover.values()).at(-1);
 const labels={play:playback==='playing'?'暂停回放':'回放乐谱',theme:'下个声景',weather:'切换天气',light:'切换昼夜',seed:'重绘景物'};
 const hint=active?(command?'捏合 · '+labels[command]:'横移选音 · 捏合奏响'):null;
 if(active&&hint)$('cam-state').textContent=hint;
}

function cameraStatus(state,detail){
 updateAirHint();
 const active=['ready','tracking','loading'].includes(state);
 $('hand-guide').hidden=!active;$('camera-view').hidden=!active;$('cam-state').textContent=detail;
 $('camera').classList.toggle('active',active);$('camera').setAttribute('aria-pressed',String(active));
 $('camera-label').textContent=state==='loading'?'取消开启':active?'关闭镜头':'隔空演奏';$('camera').setAttribute('aria-label',$('camera-label').textContent);
 if(state==='error')showPanel('摄像头未连接','<p class="panel-note">'+esc(detail)+'</p><p class="panel-note">也可以直接触碰乐器，或用电脑键盘弹奏。</p><div class="dialog-actions"><button class="air-btn" id="retry-camera">重新连接</button><button class="secondary-btn" id="return-desk">回到演奏台</button></div>');
 if(state==='error'){$('retry-camera').onclick=()=>{closePanel();activateCamera()};$('return-desk').onclick=closePanel}
}
function activateCamera(){if(['loading','tracking','ready'].includes(hands.state)){hands.stop();return}sound.unlock();hands.start()}
$('camera').onclick=activateCamera;$('library').onclick=()=>showLibrary();$('mobile-theme').onclick=showThemes;$('settings').onclick=showSettings;$('save').onclick=showSave;
$('play').onclick=beginPlayback;$('undo').onclick=undo;$('new').onclick=newPage;$('position').oninput=seek;
$('zoom-in').onclick=()=>scene.zoomBy(1.15);$('zoom-out').onclick=()=>scene.zoomBy(1/1.15);$('home').onclick=()=>scene.home();$('climate').onclick=showClimate;$('journal').onclick=showJournal;$('journey').onclick=journeyButton;
// A short tap on a settled miniature replays just that note.
const scoreTouches=new Set();
let inspection=null;
$('score').addEventListener('pointerdown',e=>{
 scoreTouches.add(e.pointerId);
 inspection=scoreTouches.size===1?{id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now()}:null;
});
$('score').addEventListener('pointermove',e=>{
 if(inspection&&Math.hypot(e.clientX-inspection.x,e.clientY-inspection.y)>6)inspection=null;
});
$('score').addEventListener('pointercancel',e=>{scoreTouches.delete(e.pointerId);inspection=null});
$('score').addEventListener('pointerup',e=>{
 scoreTouches.delete(e.pointerId);const tap=inspection;inspection=null;
 if(!tap||e.pointerId!==tap.id||performance.now()-tap.t>470)return;
 const rect=$('score').getBoundingClientRect(),index=scene.pickNoteAt(e.clientX-rect.left,e.clientY-rect.top);
 if(index<0)return;
 const note=scene.events[index];sound.play(note.m,note.v,themes[score.theme].dock||score.theme);
 dock.flash(note.m);scene.pulse(index);
 const names=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
 toast(scene.describeNote(index)+' · '+names[note.m%12]+(Math.floor(note.m/12)-1));
});
window.addEventListener('keydown',e=>{if($('panel').open||e.isComposing||e.repeat||/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName))return;
 if((e.metaKey||e.ctrlKey)&&!e.shiftKey&&e.code==='KeyZ'){e.preventDefault();undo()}
 if(e.code==='Space'&&!e.altKey&&!e.ctrlKey&&!e.metaKey&&e.target.tagName!=='BUTTON'){e.preventDefault();beginPlayback()}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden){pausePlayback();ambienceUntil=0;refreshAmbience();oldRecordTime=null;flush()}});
window.addEventListener('pagehide',()=>{pausePlayback();hands.stop();flush()});
scene.setFollow(options.follow);syncHeader();drawScore();
const bookmark=read('bookmark');
if(score.voyage&&bookmark?.seed===score.voyage.seed&&Number.isFinite(bookmark.at)&&bookmark.at>0){
 rebuildAt(bookmark.at);playback='paused';updateTransport();
}
