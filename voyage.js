// Diatonic degrees are relative to each place's tonic. Rhythm patterns use
// twenty-four divisions of a measure, allowing duple and compound metres.
const worlds = {
  herbarium: {
    title:'花窗行旅', metre:'four', bars:64, bpm:86, tonic:0, color:0,
    cells:[[0,2,4,3,1],[0,1,3,2,0],[0,3,2,4,1]],
    harmony:[[0,3,5,4],[0,5,3,4],[3,1,4,0]], weather:['clear','rain','wind','snow'],
    places:[['温室开窗','露水花径'],['篱笆来信','雨棚下的种子'],['白蝶翻过山坡','花田尽头'],['沿着花香归来','回到玻璃花房']]
  },
  harbor: {
    title:'沿风信港出航', metre:'six', bars:72, bpm:48, tonic:4, color:-1,
    cells:[[0,4,2,3,0],[0,2,1,4,2],[0,-2,1,3,1]],
    harmony:[[0,6,3,0],[0,3,1,4],[5,6,3,0]], weather:['wind','clear','rain','snow'],
    places:[['解开缆绳','灯塔前的号音'],['贴着防波堤','过蓝色浮标'],['越过海峡','向海鸟答礼'],['港灯初亮','木栈桥迎船']]
  },
  fair: {
    title:'风车与旋木', metre:'three', bars:80, bpm:80, tonic:3, color:1,
    cells:[[0,2,4,6,4],[0,3,1,4,2],[0,4,3,5,2]],
    harmony:[[0,1,4,0],[0,5,1,4],[3,0,1,4]], weather:['clear','wind','snow','rain'],
    places:[['旋木启程','拱门亮灯'],['糖纸小巷','木偶的舞步'],['摩天轮顶','彩车过桥'],['最后一圈圆舞','晚灯谢幕']]
  },
  tide: {
    title:'月下潮汐书', metre:'four', bars:48, bpm:64, tonic:5, color:-1,
    cells:[[0,2,4,6,3],[0,-2,1,2,-1],[0,3,2,0,-2]],
    harmony:[[0,5,2,6],[0,3,5,4],[5,6,3,0]], weather:['rain','clear','snow','wind'],
    places:[['潮池苏醒','贝壳初鸣'],['潜过珊瑚','海草深处'],['月色漫堤','灯水母上浮'],['退潮的回音','潮线留白']]
  },
  grove: {
    title:'沿林间小路', metre:'three', bars:64, bpm:64, tonic:1, color:-1,
    cells:[[0,1,3,2,0],[0,-1,2,4,3],[0,2,5,3,1]],
    harmony:[[0,3,6,0],[0,2,3,0],[3,1,4,0]], weather:['rain','wind','clear','snow'],
    places:[['走入林间','苔径早钟'],['穿过细竹','树根间的脚步'],['林梢回应','峡谷展叶'],['杉影收拢','木门前的晚风']]
  },
  alpine: {
    title:'循山脊而行', metre:'four', bars:64, bpm:85, tonic:4, color:0,
    cells:[[0,4,3,1,4],[0,2,5,4,2],[0,-3,0,4,2]],
    harmony:[[0,3,6,0],[0,5,3,4],[3,0,4,0]], weather:['snow','clear','wind','rain'],
    places:[['雪线朝阳','山脚出发'],['走向石隘','岩羊小径'],['山脊上相望','越过垭口'],['远山的回声','木屋晚钟']]
  },
  canal: {
    title:'水巷摇船曲', metre:'six', bars:80, bpm:53, tonic:2, color:-1,
    cells:[[0,1,3,2,-1],[0,-2,0,1,3],[0,3,1,0,-1]],
    harmony:[[0,1,3,0],[0,5,1,0],[3,6,1,0]], weather:['rain','clear','wind','snow'],
    places:[['推船入巷','桥头晨雾'],['拱桥下的歌','穿过窄河湾'],['水塔与桨声','运河交汇处'],['泊在石阶旁','返航的慢桨']]
  },
  sky: {
    title:'云上的航线', metre:'three', bars:80, bpm:79, tonic:3, color:1,
    cells:[[0,2,3,6,4],[0,3,5,4,2],[0,4,2,5,3]],
    harmony:[[0,1,2,4],[0,5,1,0],[1,4,0,0]], weather:['wind','snow','clear','rain'],
    places:[['离开云台','云帆升起'],['绕过云岛','听风标唱歌'],['登上晴空','飞越虹桥'],['云巢回航','天边的降落灯']]
  }
};

const rhythms = {
  four: [
    [[0,12],[0,9,18],[3,12],[0,15],[0,6,15]],
    [[0,6,12,21],[0,9,12,18],[3,6,15,18],[0,6,15],[0,9,18,21]],
    [[0,3,9,12,18],[0,6,9,15,21],[3,6,12,15,18],[0,6,12,18,21]]
  ],
  three: [
    [[0,12],[0,8,16],[4,16],[0,16],[0,8,20]],
    [[0,8,12,16],[0,4,12,16],[4,8,16,20],[0,8,16],[0,12,16,20]],
    [[0,4,8,16,20],[0,8,12,16,20],[0,4,12,16],[4,8,12,16]]
  ],
  six: [
    [[0,12],[0,8,12],[4,12],[0,16],[0,12,20]],
    [[0,8,12,16],[0,4,12,20],[4,8,12,20],[0,12,16],[0,4,12,16]],
    [[0,4,8,12,20],[0,8,12,16,20],[0,4,8,16,20],[4,8,12,16]]
  ]
};
const naturals = [60,62,64,65,67,69,71,72,74,76,77,79,81,83,84];
const keyList = Object.keys(worlds);
const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
const mod = (n,m) => ((n%m)+m)%m;
const rounded = (v) => Number(v.toFixed(4));

function mix(n) {
  n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
  n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
  return (n ^ (n >>> 16)) >>> 0;
}
function generator(seed) {
  let state = seed >>> 0;
  return () => mix(state = (state + 0x9e3779b9) >>> 0) / 4294967296;
}
const pick = (array,random) => array[Math.floor(random()*array.length)];

function chordTone(tonic, chord, target, low = 3, high = 14, offsets = [0,2,4]) {
  let chosen = low, distance = Infinity;
  for (let degree = low; degree <= high; degree++) {
    if (!offsets.includes(mod(degree-tonic-chord,7))) continue;
    const error = Math.abs(degree-target);
    if (error < distance) {chosen=degree; distance=error;}
  }
  return chosen;
}

function chapterPlan(world, chapter, seed, themeIndex, random) {
  // Four-bar phrases leave enough room for a question and its answer.
  const phrases = world.bars / 4;
  const unit = Math.floor(phrases / 4);
  const shift = (chapter + Math.floor(random()*3)) % 3;
  const lengths = [unit-1,unit+1,unit,unit];
  for (let i=0;i<phrases%4;i++) lengths[[2,3,1][i]]++;
  if (shift===1) [lengths[1],lengths[2]]=[lengths[2],lengths[1]];
  if (shift===2) [lengths[0],lengths[3]]=[lengths[3],lengths[0]];
  const start = mod((mix(seed+themeIndex) % 4) + chapter,4);
  const order = [world.weather[start]];
  const rest = world.weather.filter(w=>w!==order[0]);
  while (rest.length) order.push(rest.splice(Math.floor(random()*rest.length),1)[0]);
  return lengths.map((bars,i)=>({
    bars:bars*4,weather:order[i],label:world.places[i][(chapter + (random()>.53?1:0))%2],
    energy:[0,1,2,0][i], pace:[.98,1.045,1.06,.96][i]
  }));
}

function appendChapter(theme, seed, chapter, start) {
  const world=worlds[theme];
  const themeIndex=keyList.indexOf(theme);
  const chapterSeed=mix(seed ^ Math.imul(chapter+1,0x85ebca6b) ^ Math.imul(themeIndex+1,0x9e3779b9));
  const random=generator(chapterSeed), scenery=generator(chapterSeed ^ 0x14f3c269);
  const plan=chapterPlan(world,chapter,seed,themeIndex,random);
  const bpm=world.bpm*(.974+random()*.052);
  const beatsPerBar={four:4,three:3,six:2}[world.metre];
  const barLength=60*beatsPerBar/bpm;
  const homeCell=mod(mix(seed+themeIndex*7)%3+chapter,3);
  const events=[], sections=[];
  let clock=start, previous=7+world.color;

  for (let part=0;part<plan.length;part++) {
    const {bars,energy,weather,label,pace}=plan[part];
    const sectionStart=rounded(clock);
    const phraseCount=bars/4;
    for (let phrase=0;phrase<phraseCount;phrase++) {
      const bookend=phrase===0 || phrase===phraseCount-1;
      const cellId=(part===0 || part===3) && bookend ? homeCell :
        mod(homeCell + phrase + part + Math.floor(random()*2),3);
      const cell=world.cells[cellId];
      const harmony=world.harmony[(phrase+part+homeCell+Math.floor(random()*2)) % world.harmony.length];
      const turn=part===1 && phrase%3===1 ? -1 : 1;
      const lift=[0,1,2,0][part] + world.color;
      // Related bars recur as calls and altered answers; the rhythmic anchor
      // returns in bar three. Cadences intentionally leave room for a breath.
      const template=pick(rhythms[world.metre][energy],random);
      for (let bar=0;bar<4;bar++) {
        const finalBar=phrase===phraseCount-1 && bar===3;
        const closing=bar===3;
        const root=finalBar && (part===0||part===3) ? 0 : harmony[bar];
        const register=7+lift + (bar===2?1:0) + (phrase%3===2?1:0);
        const anchor=chordTone(world.tonic,root,register*.72+previous*.28,4,12);
        let pattern=bar===0 || (bar===2 && phrase%2===0) ? template :
          pick(rhythms[world.metre][energy],random);
        if (closing) pattern=finalBar ? [0,world.metre==='three'?16:12] :
          pick([[0,12],[0,8,16],[0,6,12]],random);
        else if (weather==='snow' && phrase%2===1 && bar===1) pattern=pattern.filter((_,i)=>i%2===0);
        else if (weather==='rain' && bar===2 && pattern.at(-1)<20) pattern=[...pattern,20];
        // Phrase-ending relaxation is applied to the whole bar so the next
        // section and its weather arrive on the downbeat.
        const relaxation=finalBar?1.065:closing?1.026:1;
        const length=barLength/pace*relaxation;
        const startBeat=clock;
        const timing=new Map();
        const onset=slot=>{
          if (!timing.has(slot)) {
            const wobble=slot===0?0:(random()-.5)*.030;
            timing.set(slot,rounded(startBeat+length*slot/24+wobble));
          }
          return timing.get(slot);
        };
        const add=(degree,slot,velocity)=>{
          events.push({m:naturals[degree],t:onset(slot),v:rounded(clamp(velocity,.30,.96)),s:Math.floor(scenery()*4294967296)});
        };
        const melodyAt=new Map();
        for (let j=0;j<pattern.length;j++) {
          const slot=pattern[j];
          const offset=bar===1?cell.length-1-j:bar===2?j+1:j;
          let degree=clamp(anchor+turn*cell[mod(offset,cell.length)],3,14);
          if (j===0) degree=anchor;
          if (bar===2 && j===pattern.length-1) degree=chordTone(world.tonic,root,degree+1,4,14);
          if (closing && j===pattern.length-1) {
            const cadenceTone=finalBar && part===3?[0]:[0,2];
            degree=chordTone(world.tonic,root,anchor-.7,3,13,cadenceTone);
          }
          // A boundary near the top of the keyboard answers downward.
          if (j>0 && degree===previous && degree>=12 && !closing) degree=clamp(degree-2,3,14);
          const accent=slot===0?.10:slot===12?.055:0;
          const arc=Math.sin(Math.PI*(phrase+.5)/phraseCount)*.046;
          const dynamics=.55+energy*.057+accent+arc+(random()-.5)*.080;
          add(degree,slot,dynamics);
          melodyAt.set(slot,degree);
          previous=degree;
        }
        // The lower voice answers on selected bars. Shared onsets remain
        // exactly simultaneous for the score, the instrument and MIDI export.
        const bassSlots=[];
        if (bar===0 || finalBar || (bar===2 && (energy>0 || phrase%2===0))) bassSlots.push(0);
        if (bar===1 && (phrase+part)%3!==1) bassSlots.push(world.metre==='three'?16:12);
        if (energy===2 && bar===2 && phrase%2===1) bassSlots.push(world.metre==='six'?16:12);
        for (const slot of bassSlots) {
          const lead=melodyAt.get(slot)??anchor;
          const ceiling=Math.min(7,lead-2);
          if (ceiling<1) continue;
          const bass=chordTone(world.tonic,root,slot===0?2.1:3.2,0,ceiling,slot===0?[0,4]:[0,2,4]);
          if (mod(bass-world.tonic-root,7)===0 || [2,4].includes(mod(bass-world.tonic-root,7))) {
            add(bass,slot,.37+energy*.037+(slot===0?.045:0)+random()*.045);
          }
        }
        clock+=length;
      }
    }
    sections.push({chapter:chapter+1,section:part+1,start:sectionStart,end:rounded(clock),weather,label});
  }
  events.sort((a,b)=>a.t-b.t || a.m-b.m);
  return {events,sections,endsAt:rounded(clock)};
}

export function makeVoyage(theme='herbarium', seed=0) {
  if (!Object.hasOwn(worlds,theme)) theme='herbarium';
  seed=seed>>>0;
  const {events,sections,endsAt}=appendChapter(theme,seed,0,0);
  return {
    format:'airborne-atlas/1',title:worlds[theme].title,theme,seed,night:false,events,
    voyage:{seed,chapter:0,endsAt,sections}
  };
}

export function extendVoyage(score) {
  const previous=score.voyage;
  const chapter=previous.chapter+1;
  const start=Math.max(previous.endsAt,score.events.at(-1)?.t??0);
  const next=appendChapter(score.theme,previous.seed,chapter,start);
  return {
    ...score,events:score.events.concat(next.events),
    voyage:{...previous,chapter,endsAt:next.endsAt,sections:previous.sections.concat(next.sections)}
  };
}

export function sectionAt(seconds, score) {
  const sections=score?.voyage?.sections;
  if (!sections?.length) return null;
  const value=Number.isFinite(seconds)?Math.max(0,seconds):0;
  let left=0, right=sections.length-1;
  while (left<right) {
    const mid=(left+right)>>>1;
    if (value>=sections[mid].end) left=mid+1;
    else right=mid;
  }
  const region=sections[left];
  const first=left-region.section+1;
  const chapterStart=sections[first].start, chapterEnd=sections[first+3].end;
  return {
    chapter:region.chapter,section:region.section,weather:region.weather,label:region.label,
    progress:clamp((value-chapterStart)/(chapterEnd-chapterStart),0,1),
    sectionProgress:clamp((value-region.start)/(region.end-region.start),0,1)
  };
}
