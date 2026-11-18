import {siteFor,SPAN,NOTES} from './ensemble.js';
import {createLandscape} from './landscape.js';
import * as T from './vendor/three/three.module.min.js';
import {ScoreDistribution,hash,random} from './score-distribution.js';
import {ScoreScene} from './scene.js';
import {MiniatureBuilder,makeMaterials,assemblyMaterials} from './model-workshop.js';
import {natureModel} from './models-nature.js';
import {builtModel} from './models-built.js';
import {makeFolio,folios,scrollHead,canvasTexture,radialInk} from './folio.js';

const clamp=T.MathUtils.clamp,rad=T.MathUtils.degToRad,TAU=Math.PI*2;
const nature=new Set(['herbarium','grove','sky','tide']);
const illumination={
  dawn:{sky:'#ffe4ce',ground:'#847e82',sun:'#ffcf9c',power:2.2,fill:1.46,rim:'#dcefee',side:1.1,dir:[-9,8,2],lamps:.16},
  day:{sky:'#fffae5',ground:'#8a9895',sun:'#fff0cf',power:2.48,fill:1.36,rim:'#d1edff',side:1.0,dir:[-5,11,6],lamps:.03},
  dusk:{sky:'#e2cbea',ground:'#756278',sun:'#ffad72',power:1.92,fill:1.1,rim:'#b0d4f2',side:1.15,dir:[9,6,-3],lamps:.96},
  night:{sky:'#a5b2df',ground:'#61657b',sun:'#bcdaff',power:1.25,fill:.79,rim:'#739cd5',side:.88,dir:[7,10,-6],lamps:2.35}
};
const shadowSlots=160;

function woven(){
  const c=document.createElement('canvas');c.width=c.height=256;
  const ctx=c.getContext('2d'),im=ctx.createImageData(256,256),r=random(813);
  for(let y=0,i=0;y<256;y++)for(let x=0;x<256;x++,i+=4){
    const thread=Math.cos(x*Math.PI*.5)*5+Math.sin(y*Math.PI*.5)*4+Math.sin(x*.049+y*.025)*2;
    const n=Math.round(221+thread+(r()-.5)*16);im.data[i]=n;im.data[i+1]=n;im.data[i+2]=n;im.data[i+3]=255;
  }
  ctx.putImageData(im,0,0);const tex=canvasTexture(c);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(29,29);return tex;
}
function lightingState(light,weather){
  const l=illumination[light],cloud=weather==='rain'?.70:weather==='snow'?.85:1;
  return {sky:new T.Color(l.sky),ground:new T.Color(l.ground),sun:new T.Color(l.sun),rim:new T.Color(l.rim),
    power:l.power*cloud,fill:l.fill*(2-cloud),side:l.side,lamps:l.lamps,dir:new T.Vector3(...l.dir)};
}
function mixState(a,b,t){
  const mix=(x,y)=>x+(y-x)*t;
  return {sky:a.sky.clone().lerp(b.sky,t),ground:a.ground.clone().lerp(b.ground,t),sun:a.sun.clone().lerp(b.sun,t),rim:a.rim.clone().lerp(b.rim,t),
    dir:a.dir.clone().lerp(b.dir,t),power:mix(a.power,b.power),side:mix(a.side,b.side),fill:mix(a.fill,b.fill),lamps:mix(a.lamps,b.lamps)};
}
function stageLayout(w,h){
  const width=clamp(9.4+(w-440)*.0055,9.4,13.4);
  const depth=clamp(width/(w/h)*1.30,6.5,15.7);
  return {width,depth};
}
function printedNote(){
  const c=document.createElement('canvas');c.width=80;c.height=136;
  const ink=c.getContext('2d');ink.fillStyle=ink.strokeStyle='#343227';ink.lineCap='round';
  ink.beginPath();ink.ellipse(38,105,21,13,-.37,0,TAU);ink.fill();
  ink.lineWidth=4.4;ink.beginPath();ink.moveTo(56,102);ink.lineTo(56,29);ink.stroke();
  const geo=new T.PlaneGeometry(.39,.66);geo.rotateX(-Math.PI/2);
  const mesh=new T.InstancedMesh(geo,new T.MeshBasicMaterial({map:canvasTexture(c),transparent:true,opacity:.78,depthWrite:false}),shadowSlots);
  mesh.frustumCulled=false;mesh.count=0;mesh.renderOrder=1;return mesh;
}
function precipitation(){
  const particles=96,r=random(801),phases=[];
  for(let i=0;i<particles;i++)phases.push([r(),r(),r(),r(),r()]);
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(particles*6),3));
  const mat=new T.LineBasicMaterial({color:0xc8dce1,transparent:true,opacity:.48,depthWrite:false});
  const streaks=new T.LineSegments(geo,mat);streaks.frustumCulled=false;
  const fluff=new T.InstancedMesh(new T.IcosahedronGeometry(.031,0),new T.MeshBasicMaterial({color:'#fff4dc'}),particles);
  fluff.frustumCulled=false;
  return {streaks,fluff,phases,pose:new T.Object3D()};
}
export class SculptureScore extends ScoreDistribution{
  constructor(canvas,renderer){
    super();this.canvas=canvas;this.renderer=renderer;this.world=new T.Scene();this.camera=new T.PerspectiveCamera(29,1,.1,210);
    this.theme='herbarium';this.seed=1;this.weather='clear';this.light='day';this.events=[];this.land=new Map();this.center=0;this.targetCenter=0;
    this.front=-.02;this.goalFront=-.02;this.settled=new Set();this.trailHead=-1;this.browsing=false;this.renderer.localClippingEnabled=true;
    this.follow=true;this.zoom=1;this.yaw=rad(-4);this.pitch=rad(45);this.births=new Map();this.pulses=new Map();this.items=new Map();this.models=new Map();
    this.reduced=matchMedia('(prefers-reduced-motion:reduce)');this.materials=makeMaterials();this.workbench=[];this.ray=new T.Raycaster();this.pointer=new T.Vector2();
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate=false;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.06;
    this.hemi=new T.HemisphereLight();this.key=new T.DirectionalLight();this.rim=new T.DirectionalLight();this.rim.position.set(2,6,-9);
    this.key.castShadow=true;const shadow=this.key.shadow;shadow.mapSize.set(1024,1024);shadow.normalBias=.018;shadow.bias=-.00022;shadow.camera.near=.1;shadow.camera.far=55;
    this.world.add(this.hemi,this.key,this.key.target,this.rim);
    this.practicals=Array.from({length:3},()=>{const lamp=new T.PointLight('#ffc26e',0,3.1,1.6);this.world.add(lamp);return lamp});
    const weave=woven();this.table=new T.Mesh(new T.PlaneGeometry(130,130),new T.MeshStandardMaterial({color:'#687b67',map:weave,roughness:1}));
    this.table.rotation.x=-Math.PI/2;this.table.position.y=-.37;this.table.receiveShadow=true;this.world.add(this.table);
    const groundGeo=new T.PlaneGeometry();groundGeo.rotateX(-Math.PI/2);
    this.contact=new T.InstancedMesh(groundGeo,new T.MeshBasicMaterial({map:radialInk(),transparent:true,depthWrite:false}),shadowSlots);
    this.lampPools=new T.InstancedMesh(groundGeo,new T.MeshBasicMaterial({map:radialInk(true),transparent:true,depthWrite:false,blending:T.AdditiveBlending}),shadowSlots);
    this.contact.count=this.lampPools.count=0;this.contact.frustumCulled=this.lampPools.frustumCulled=false;this.contact.renderOrder=1;this.lampPools.renderOrder=2;
    this.ink=printedNote();this.world.add(this.ink,this.contact,this.lampPools);this.air=precipitation();this.world.add(this.air.streaks,this.air.fluff);
    this.pose=new T.Object3D();this.lastAir=0;this.draw=t=>this.render(t);this.lighting=lightingState('day','clear');this.applyLighting(this.lighting);
    this.bindInput();this.resize();new ResizeObserver(()=>this.resize()).observe(canvas);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)this.invalidate()});
    canvas.dataset.renderer='webgl';canvas.addEventListener('webglcontextrestored',()=>{this.renderer.shadowMap.enabled=true;this.shadowDirty();this.invalidate()});
  }
  resize(){
    const {width,height}=this.canvas.getBoundingClientRect();
    const w=Math.round(width),h=Math.round(height);if(w<2||h<2||w===this.W&&h===this.H)return;
    const nearStart=!this.layout||this.center<this.beginCenter()+.05;this.W=w;this.H=h;this.camera.aspect=w/h;
    if(!this.hasFramed){this.pitch=rad(w<650?52:44);this.hasFramed=true}
    this.key.shadow.mapSize.set(w<650?1024:1536,w<650?1024:1536);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,w<650?1.65:1.45));this.renderer.setSize(w,h,false);
    this.layout=stageLayout(w,h);this.siteCache=new Map();this.clearLand();
    this.goalFront=this.front=this.builtFront();
    this.center=this.targetCenter=nearStart?this.beginCenter():clamp(this.center,this.beginCenter(),this.endCenter());
    this.windowKey='';
    this.refreshFolio();this.refreshItems();this.positionCamera();this.shiftWorld();this.invalidate();
  }
  setScore(events,options={}){
    const theme=options.theme||this.theme,seed=options.seed??this.seed;
    const fresh=theme!==this.theme||seed!==this.seed;
    const differentWeather=this.weather!==(options.weather||'clear');
    this.events=events.slice();this.theme=theme;this.seed=seed;
    this.weather=options.weather||'clear';this.light=options.light||(options.night?'night':'day');
    this.siteCache.clear();this.births.clear();this.settled.clear();this.pulses.clear();
    if(fresh){this.clearItems();this.clearLand();this.trailHead=-1;this.browsing=false}
    else if(differentWeather)this.clearLand();
    this.goalFront=this.front=this.builtFront();
    if(fresh)this.center=this.targetCenter=this.beginCenter();
    this.center=clamp(this.center,this.beginCenter(),this.endCenter());this.targetCenter=clamp(this.targetCenter,this.beginCenter(),this.endCenter());
    for(const it of this.items.values())this.finishAssembly(it);
    if(Number.isInteger(options.focusIndex))this.focusNote(options.focusIndex,true);
    this.windowKey='';this.refreshFolio();this.refreshItems();this.positionCamera();this.shiftWorld();
    this.setIllumination(false);this.invalidate();
  }
  beginCenter(){return scrollHead+this.layout.depth*.5}
  endCenter(){return Math.max(this.beginCenter(),this.goalFront-this.layout.depth*.12)}
  builtFront(now=performance.now()){
    if(!this.events.length)return -.02;
    let end=this.events.length-1;
    while(end>=0&&(this.births.get(end)??0)>now)end--;
    if(end<0)return -.02;
    const block=Math.floor(end/NOTES),first=Math.max(0,(block-1)*NOTES);
    let z=block>0?block*SPAN-.43:-.02;
    for(let i=first;i<=end;i++)if((this.births.get(i)??0)<=now)z=Math.max(z,this.site(i).z+.87);
    return z;
  }
  clearLand(){for(const mesh of this.land.values()){this.world.remove(mesh);mesh.userData.dispose()}this.land.clear()}
  refreshFolio(){
    if(!this.layout)return;
    const {width,depth}=this.layout,key=width+'-'+this.theme;
    if(this.paperKey!==key){
      if(this.paper){this.world.remove(this.paper);this.paper.userData.dispose()}
      this.paper=makeFolio(width,this.theme);this.world.add(this.paper);this.paperKey=key;
      this.table.material.color.set(folios[this.theme][4]).lerp(new T.Color('#a3a68a'),.30);
    }
    this.paper.userData.frame(this.center,depth,Math.max(scrollHead+depth,this.front+1.16));
    const extent=Math.max(width,depth)*.88;
    Object.assign(this.key.shadow.camera,{left:-extent,right:extent,top:extent,bottom:-extent});this.key.shadow.camera.updateProjectionMatrix();this.shadowDirty();
  }
  site(index,event=this.events[index]){
    const stored=this.siteCache.get(index);
    if(stored?.event===event&&stored?.site)return stored.site;
    const site=siteFor(this.theme,this.seed,index,event,this.layout.width,this.weather);
    if(event===this.events[index])this.siteCache.set(index,{event,site});
    return site;
  }
  range(){
    const l=this.layout,extra=(Math.abs(Math.sin(this.yaw))*l.width*.57+2.35)/this.zoom;
    const span=l.depth*.68/this.zoom+extra,first=Math.max(0,Math.floor((this.center-span)/SPAN));
    const last=this.events.length?Math.max(Math.ceil(this.events.length/NOTES),Math.ceil((Math.max(this.front,this.goalFront)+.72)/SPAN)):0;
    const end=Math.min(last,Math.max(first+1,Math.ceil((this.center+span)/SPAN)));
    return {first,end};
  }
  refreshLand(first,end,now=performance.now()){
    for(const [block,mesh] of this.land)if(block<first||block>=end){
      this.world.remove(mesh);mesh.userData.dispose();this.land.delete(block);
    }
    for(let block=first;block<end;block++){
      let mesh=this.land.get(block);
      if(!mesh){mesh=createLandscape(this.theme,this.seed,block,this.layout.width);this.land.set(block,mesh);this.world.add(mesh)}
      const sites=[];
      for(let i=block*NOTES;i<Math.min((block+1)*NOTES,this.events.length);i++){
        if((this.births.get(i)??0)<=now)sites.push(this.site(i));
      }
      mesh.userData.setSites?.(sites);mesh.userData.setFrontier(this.front);
    }
  }
  shiftWorld(){
    const d=this.layout.depth;
    this.paper?.userData.frame(this.center,d,Math.max(scrollHead+d,this.front+1.16));
    this.table.position.z=this.center;
    this.table.material.map.offset.y=T.MathUtils.euclideanModulo(-this.center*29/130,1);
    this.key.target.position.z=this.center;this.key.position.copy(this.lighting.dir).normalize().multiplyScalar(17);this.key.position.z+=this.center;
    this.air.streaks.position.z=this.air.fluff.position.z=this.center;
    this.shadowDirty();
  }
  shadowDirty(){this.renderer.shadowMap.needsUpdate=true}
  setIllumination(transition){
    const state=lightingState(this.light,this.weather);
    if(transition&&!this.reduced.matches)this.fade={from:this.lighting,to:state,start:performance.now()};
    else{this.fade=null;this.applyLighting(state)}
    this.invalidate();
  }
  applyLighting(s){
    this.lighting=s;this.hemi.color.copy(s.sky);this.hemi.groundColor.copy(s.ground);this.hemi.intensity=s.fill;
    this.key.color.copy(s.sun);this.key.intensity=s.power;this.key.position.copy(s.dir).normalize().multiplyScalar(17);this.key.position.z+=this.center;
    this.rim.color.copy(s.rim);this.rim.intensity=s.side;
    this.materials.luminous.emissiveIntensity=s.lamps;this.lampPools.material.opacity=clamp((s.lamps-.08)*.48,0,.98);
    this.shadowDirty();
  }
  setWeather(weather){
    if(weather===this.weather)return;this.weather=weather;this.siteCache.clear();this.goalFront=this.builtFront();this.refreshItems();this.setIllumination(true);
  }
  setLight(light){if(light===this.light||!illumination[light])return;this.light=light;this.setIllumination(true)}
  setFollow(flag){this.follow=flag;if(flag&&this.events.length){this.browsing=false;this.focusNote(this.trailHead<0?this.events.length-1:this.trailHead)}}
  moveView(z,immediate=false){
    this.targetCenter=clamp(z,this.beginCenter(),this.endCenter());
    if(immediate||this.reduced.matches){
      this.center=this.targetCenter;this.updateView();
    }
    this.invalidate();
  }
  updateView(){
    this.positionCamera();this.shiftWorld();
    const r=this.range(),key=r.first+'-'+r.end;if(key!==this.windowKey)this.refreshItems();
  }
  focusNote(index,immediate=false){
    if(!this.layout||!this.events[index])return;
    this.trailHead=index;
    if(!immediate&&(!this.follow||this.browsing))return;
    if(immediate)this.browsing=false;
    const z=this.site(index).z,d=this.layout.depth;
    if(immediate||z>this.targetCenter+d*.23||z<this.targetCenter-d*.32)this.moveView(z-d*.13,immediate);
  }
  home(){this.browsing=false;this.zoom=1;this.pitch=rad(this.W<650?52:44);this.yaw=rad(-4);
    const i=this.trailHead>=0?Math.min(this.events.length-1,this.trailHead):this.events.length-1;
    this.moveView(i<0?this.beginCenter():this.site(i).z-this.layout.depth*.13);this.updateView()}
  zoomBy(factor){this.zoom=clamp(this.zoom*factor,.76,1.92);this.updateView();this.invalidate()}
  positionCamera(){
    if(!this.layout)return;
    const {width:w,depth:d}=this.layout,cam=this.camera;
    const gaze=new T.Vector3(0,.20,0),direction=new T.Vector3(Math.sin(this.yaw)*Math.cos(this.pitch),Math.sin(this.pitch),Math.cos(this.yaw)*Math.cos(this.pitch));
    const right=new T.Vector3(direction.z,0,-direction.x).normalize(),up=new T.Vector3().crossVectors(direction,right);
    const tan=Math.tan(rad(cam.fov/2)),tanX=tan*cam.aspect;
    let radius=0;
    for(const x of [-w/2-.13,w/2+.13])for(const z of [-d/2-.12,d/2+.21]){
      for(const y of [-.37,.22]){
        const v=new T.Vector3(x,y,z).sub(gaze),f=v.dot(direction);
        radius=Math.max(radius,f+Math.abs(v.dot(right))/(tanX*.963),f+Math.abs(v.dot(up))/(tan*.858));
      }
    }
    cam.position.copy(direction).multiplyScalar(radius).add(gaze);cam.lookAt(gaze);cam.updateProjectionMatrix();cam.updateMatrixWorld();
    // The near edge occupies more pixels than the far edge. Fit the projected
    // outline, including the height of the rear row, then centre that outline.
    let left=Infinity,rightEdge=-Infinity,bottom=Infinity,top=-Infinity;
    const sample=(x,y,z)=>{
      const p=new T.Vector3(x,y,z).project(cam);left=Math.min(left,p.x);rightEdge=Math.max(rightEdge,p.x);bottom=Math.min(bottom,p.y);top=Math.max(top,p.y);
    };
    for(const x of [-w/2-.11,w/2+.11])for(const z of [-d/2-.11,d/2+.14]){sample(x,-.35,z);sample(x,.05,z)}
    for(const x of [-w*.42,w*.42])for(const z of [-d*.39,d*.39])sample(x,1.65,z);
    const scale=Math.min(1.945/(rightEdge-left),1.72/(top-bottom))*this.zoom;
    const matrix=cam.projectionMatrix.elements;
    matrix[0]*=scale;matrix[5]*=scale;matrix[8]+=(rightEdge+left)*.5*scale;matrix[9]+=(top+bottom)*.5*scale+.025;
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
    cam.position.z+=this.center;cam.updateMatrixWorld();
  }
  anchor(index,event){
    const site=this.site(index,event);return new T.Vector3(site.x,site.y+.009,site.z);
  }
  pointForNote(index,event=this.events[index]){
    if(!this.layout||!event)return null;
    const p=this.anchor(index,event).project(this.camera);
    return {x:(p.x+1)*this.W/2,y:(1-p.y)*this.H/2,visible:p.z>=-1&&p.z<=1&&Math.abs(p.x)<1&&Math.abs(p.y)<1};
  }
  clearItems(){for(const item of this.items.values())this.removeItem(item);this.items.clear()}
  removeItem(item){this.finishAssembly(item);this.world.remove(item.group)}
  finishAssembly(item){
    if(!item.assembly)return;
    item.group.traverse(mesh=>{if(mesh.isMesh){mesh.material=this.materials[mesh.userData.layer];mesh.customDepthMaterial=undefined}});
    this.workbench.push(item.assembly);item.assembly=null;
  }
  assemble(item,p){
    if(!item.assembly){
      const kit=this.workbench.pop()||assemblyMaterials(this.materials);item.assembly=kit;
      const organic=this.theme==='tide'||this.theme==='grove'&&![4,8,13,14].includes(item.kind)||this.theme==='herbarium'&&![8,11,12,14,15].includes(item.kind);
      kit.organic.value=organic?1:0;
      item.group.traverse(mesh=>{if(mesh.isMesh){mesh.material=kit[mesh.userData.layer];mesh.customDepthMaterial=kit.depth}});
    }
    item.assembly.progress.value=p;item.assembly.luminous.emissiveIntensity=this.lighting.lamps;
  }
  model(key,kind,variant){
    let asset=this.models.get(key);
    if(!asset){
      const b=new MiniatureBuilder(),r=random(hash((kind+1)*7919+variant*15485863));
      (nature.has(this.theme)?natureModel:builtModel)(b,this.theme,kind,this.weather,r);
      asset=b.finish();this.models.set(key,asset);
    }
    return asset;
  }
  refreshItems(){
    if(!this.layout)return;
    const range=this.range(),first=range.first*NOTES,end=Math.min(this.events.length,range.end*NOTES);
    this.windowKey=range.first+'-'+range.end;
    for(const [i,item] of this.items)if(i<first||i>=end){this.removeItem(item);this.items.delete(i);this.siteCache.delete(i)}
    this.refreshLand(range.first,range.end);
    for(let i=first;i<end;i++){
      const site=this.site(i),code=this.seedFor(i),kind=site.kind,variant=code%3;
      const key=[this.theme,kind,kind===15?this.weather:'',variant].join('.');
      let item=this.items.get(i);
      if(item&&item.key===key){item.group.position.set(site.x,site.y,site.z);item.size=site.size;item.turn=site.turn;continue}
      if(item)this.removeItem(item);
      const asset=this.model(key,kind,variant),group=new T.Group();
      const moving=[];
      const attach=(geometry,parent)=>{for(const layer of ['body','luminous'])if(geometry[layer]){
        const mesh=new T.Mesh(geometry[layer],this.materials[layer]);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.note=i;mesh.userData.layer=layer;parent.add(mesh);
      }};
      attach(asset,group);
      for(const part of asset.motions){
        const pivot=new T.Group();pivot.position.fromArray(part.pivot);group.add(pivot);attach(part,pivot);
        moving.push({pivot,type:part.type,home:part.pivot,phase:(code%757)/757*TAU});
      }
      const size=site.size,turn=site.turn;group.position.set(site.x,site.y,site.z);
      item={key,group,size,turn,lit:!!asset.luminous||asset.motions.some(p=>p.luminous),kind,moving};this.items.set(i,item);this.world.add(group);
    }
    if(this.models.size>115){
      const live=new Set([...this.items.values()].map(i=>i.key));
      for(const [key,asset] of this.models){if(live.has(key))continue;for(const part of [asset,...asset.motions]){part.body?.dispose();part.luminous?.dispose()}this.models.delete(key);if(this.models.size<=86)break}
    }
    this.shadowDirty();this.invalidate();
  }
  addNote(event,index=this.events.length,delay=0){
    this.events[index]=event;
    this.births.set(index,performance.now()+Math.max(0,delay));this.settled.delete(index);
    this.goalFront=this.builtFront();this.focusNote(index);this.refreshItems();this.invalidate();
  }
  pulse(index,delay=0){if(this.events[index]){this.pulses.set(index,performance.now()+delay);this.invalidate()}}
  pickNoteAt(x,y){
    this.pointer.set(x/this.W*2-1,1-y/this.H*2);this.ray.setFromCamera(this.pointer,this.camera);
    const list=[];for(const item of this.items.values())if(item.group.visible)item.group.traverse(o=>{if(o.isMesh)list.push(o)});
    const hit=this.ray.intersectObjects(list,false)[0];return hit?.object.userData.note??-1;
  }
  bindInput(){
    const el=this.canvas;el.tabIndex=0;el.title='横拖环看 · 上下循路浏览 · 双指缩放';el.setAttribute('aria-description','左右方向键旋转景物，上下方向键沿长卷浏览，Home 回到最新音符。');
    const tracks=new Map(),point=e=>new T.Vector2(e.clientX,e.clientY);
    let origin=null,axis='',yaw=0,pitch=0,center=0,span=0;
    const measure=()=>{const [a,b]=tracks.values();return a&&b?a.distanceTo(b):0};
    const reset=p=>{origin=p;yaw=this.yaw;pitch=this.pitch;center=this.center;axis=''};
    el.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;const p=point(e);tracks.set(e.pointerId,p);reset(p);span=measure();try{el.setPointerCapture(e.pointerId)}catch{}});
    el.addEventListener('pointermove',e=>{
      if(!tracks.has(e.pointerId))return;
      const p=point(e);tracks.set(e.pointerId,p);
      if(tracks.size===2){const d=measure();if(span>2)this.zoomBy(d/span);span=d;return}
      const dx=p.x-origin.x,dy=p.y-origin.y;
      if(!axis&&Math.max(Math.abs(dx),Math.abs(dy))>=5)axis=Math.abs(dx)>=Math.abs(dy)||this.endCenter()<=this.beginCenter()+.03?'orbit':'travel';
      if(axis==='orbit'){
        this.yaw=clamp(yaw-dx/Math.max(155,this.W*.52)*1.19,-1.25,1.25);
        this.pitch=clamp(pitch+dy/Math.max(200,this.H*.62)*.75,rad(21),rad(72));this.updateView();this.invalidate();
      }else if(axis==='travel'){
        this.browsing=true;this.moveView(center-dy*this.layout.depth/Math.max(160,this.H*.71)/this.zoom,true);
      }

    });
    const end=e=>{tracks.delete(e.pointerId);span=measure();if(tracks.size===1)reset(tracks.values().next().value)};
    el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
    el.addEventListener('wheel',e=>{
      e.preventDefault();if(e.shiftKey){this.browsing=true;this.moveView(this.targetCenter+(e.deltaY||e.deltaX)*this.layout.depth*.0023)}else this.zoomBy(Math.exp(-clamp(e.deltaY,-100,100)*.0022));
    },{passive:false});
    el.addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();
      if(e.key==='Home')this.home();else if(e.key==='ArrowUp'||e.key==='ArrowDown'){this.browsing=true;this.moveView(this.targetCenter+(e.key==='ArrowDown'?1:-1)*SPAN*.62)}
      else{this.yaw=clamp(this.yaw+rad(e.key==='ArrowRight'?9:-9),-1.25,1.25);this.updateView();this.invalidate()}
    });
  }
  drawAir(t){
    const {streaks,fluff,phases,pose}=this.air,rain=this.weather==='rain',snow=this.weather==='snow',wind=this.weather==='wind';
    streaks.visible=rain;fluff.visible=snow||wind;
    if(!streaks.visible&&!fluff.visible)return;
    const l=this.layout,attr=streaks.geometry.attributes.position;
    const total=rain?70:snow?54:22;fluff.count=total;
    if(fluff.visible)fluff.material.color.set(wind?'#c4a065':'#fff2e2');
    for(let i=0;i<total;i++){
      const [a,b,c,d,e]=phases[i],alt=1-((1-c+t*(rain?.61:snow?.095:.075)*(d*.34+.85))%1);
      const x=(a-.5)*l.width*1.20+(rain?alt*.52:Math.sin(t*.66+c*30)*.35)+(wind?((b+t*.09)%1-.5)*2:0),z=(b-.5)*l.depth*1.22,y=alt*4.1+.05;
      if(rain){attr.setXYZ(i*2,x,y,z);attr.setXYZ(i*2+1,x-.055,y-.23,z)}
      else{pose.position.set(x,y,z);pose.rotation.set(t*e,e*12,t*.84);pose.scale.set(wind?2:.75+d,wind?.54:.75+d,wind?.80:.75+d);pose.updateMatrix();fluff.setMatrixAt(i,pose.matrix)}
    }
    if(rain){streaks.geometry.setDrawRange(0,total*2);attr.needsUpdate=true}else fluff.instanceMatrix.needsUpdate=true;
  }
  invalidate(){if(!this.frame&&!document.hidden)this.frame=requestAnimationFrame(this.draw)}
  render(now){
    this.frame=0;if(document.hidden||!this.layout)return;
    const reduced=this.reduced.matches;
    const dt=Math.min(.11,Math.max(.001,(now-(this.lastTick??now-17))/1000));this.lastTick=now;
    let arrived=false;
    for(const [i,at] of this.births){
      if(now>=at&&!this.settled.has(i)){this.settled.add(i);arrived=true}
      if(now-at>630){this.births.delete(i);this.settled.delete(i)}
    }
    if(arrived){
      this.goalFront=this.builtFront(now);
      const r=this.range();this.refreshLand(r.first,r.end,now);if(this.trailHead>=0)this.focusNote(this.trailHead);
    }
    const step=(current,goal,rate)=>Math.abs(goal-current)<.012||reduced?goal:current+(goal-current)*(-Math.expm1(-dt*rate));
    const front=step(this.front,this.goalFront,6),center=step(this.center,this.targetCenter,6.5);
    if(this.front!==front){this.front=front;for(const mesh of this.land.values())mesh.userData.setFrontier(front);this.shiftWorld()}
    if(this.center!==center){this.center=center;this.updateView()}
    if(this.fade){
      const f=clamp((now-this.fade.start)/560,0,1);this.applyLighting(mixState(this.fade.from,this.fade.to,f*f*(3-2*f)));if(f===1)this.fade=null;
    }
    let moving=false,acting=false,shadows=0,pools=0,practicals=0;
    const lamps=[];
    if(this.lighting.lamps>.25)for(const [i,item] of this.items){
      if(!item.lit||(this.births.get(i)??0)>now)continue;
      const p=item.group.position.clone().project(this.camera);
      if(Math.abs(p.x)<1.05&&Math.abs(p.y)<1.06)lamps.push([i,Math.hypot(p.x,p.y*.78)]);
    }
    lamps.sort((a,b)=>a[1]-b[1]);const litInView=new Set(lamps.slice(0,this.practicals.length).map(pair=>pair[0]));
    for(const [i,item] of this.items){
      const {group,kind,size,turn}=item,born=this.births.get(i),pulse=this.pulses.get(i);
      const p=born===undefined?1:clamp((now-born)/(reduced?110:610),0,1);
      const q=pulse===undefined?1:clamp((now-pulse)/540,0,1);
      group.visible=born===undefined||now>=born;
      if(p===1){this.births.delete(i);this.settled.delete(i)}else moving=true;
      if(q===1)this.pulses.delete(i);else moving=true;
      if(!group.visible)continue;
      if(!reduced&&p<1)this.assemble(item,p);else this.finishAssembly(item);
      const growth=1-Math.pow(1-p,3),bounce=Math.sin(p*Math.PI*2.7)*(1-p)*.27;
      const hit=Math.sin(Math.PI*q)*(1-q)*(reduced?0:.16),bend=(1-p)*.22;
      const rise=item.assembly ? .62+.38*growth : growth;
      group.scale.set(size*(rise-bounce*.37-hit*.22),size*(rise+bounce+hit),size*(rise-bounce*.37-hit*.22));
      group.rotation.set(-bend*.29,turn-bend*.94,bend*.19);
      if(!reduced)for(const part of item.moving){
        acting=true;const {type,pivot,home,phase}=part,t=now/1000;
        if(type==='spinY')pivot.rotation.y=t*.32+phase;
        else if(type==='spinZ')pivot.rotation.z=t*.48+phase;
        else if(type==='bob')pivot.position.y=home[1]+Math.sin(t*1.72+phase)*.075;
        else pivot.rotation.z=Math.sin(t*(this.weather==='wind'?2.25:1.38)+phase)*(type==='swayZ'?.078:.13);
      }
      const at=group.position,foot=(kind===14?1.65:1.30)*size*growth;
      this.pose.position.set(at.x,at.y+.012,at.z);this.pose.rotation.set(0,turn,0);this.pose.scale.set(foot,1,foot*.9);this.pose.updateMatrix();this.contact.setMatrixAt(shadows,this.pose.matrix);
      this.pose.position.set(at.x+.009,at.y+.016,at.z-.18*growth);this.pose.rotation.set(0,0,0);
      this.pose.scale.set(growth,1,growth);this.pose.updateMatrix();this.ink.setMatrixAt(shadows++,this.pose.matrix);
      if(litInView.has(i)){
        const lamp=this.practicals[practicals++];lamp.position.set(at.x+.07,at.y+.47*size,at.z+.38*size);
        lamp.intensity=Math.max(0,this.lighting.lamps-.25)*1.2*growth;
      }
      if(item.lit){this.pose.position.set(at.x,at.y+.018,at.z+.11);this.pose.scale.set(foot*1.82,1,foot*1.52);this.pose.updateMatrix();this.lampPools.setMatrixAt(pools++,this.pose.matrix)}
    }
    for(let i=practicals;i<this.practicals.length;i++)this.practicals[i].intensity=0;
    this.ink.count=this.contact.count=shadows;this.ink.instanceMatrix.needsUpdate=true;this.lampPools.count=pools;this.contact.instanceMatrix.needsUpdate=this.lampPools.instanceMatrix.needsUpdate=true;
    this.lampPools.visible=this.lampPools.material.opacity>.015;
    if(moving||acting&&now-(this.lastActorShadow||0)>135){this.shadowDirty();this.lastActorShadow=now}
    this.drawAir(reduced?0:now/1000);this.renderer.render(this.world,this.camera);
    if(moving||this.fade||this.births.size||this.front!==this.goalFront||this.center!==this.targetCenter)this.invalidate();
    else if(acting||!reduced&&this.weather!=='clear'){
      clearTimeout(this.idleFrame);this.idleFrame=setTimeout(()=>this.invalidate(),42);
    }
  }
}

export function createScoreScene(canvas){
  try{
    const context=canvas.getContext('webgl2',{alpha:false,antialias:true,powerPreference:'high-performance'});
    if(context)return new SculptureScore(canvas,new T.WebGLRenderer({canvas,context,antialias:true,alpha:false}));
  }catch(err){console.warn('立体谱面初始化失败',err)}
  // A canvas that already acquired a WebGL context cannot acquire a 2D context.
  const fallback=canvas.cloneNode(false);canvas.replaceWith(fallback);fallback.dataset.renderer='canvas';return new ScoreScene(fallback);
}
