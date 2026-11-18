// Terrain and paths are drawn in the same longitudinal coordinates as the
// miniatures. This keeps water, banks and access roads continuous when panning.
import {route, SPAN, NOTES} from './ensemble.js';
import {hash,random} from './score-distribution.js';
import {mix} from './scenery-air.js';

const colors={
  herbarium:{verge:'#819b61',bank:'#9f9c62',edge:'#b7986d',bed:'#ddc18f',core:'#e9d6a8',mark:'#a19161',light:'#fff3c5',stone:'#a9aa88'},
  grove:{verge:'#73936a',bank:'#848958',edge:'#9e885c',bed:'#baa575',core:'#cfb886',mark:'#887e59',light:'#e6d5a3',stone:'#879780'},
  harbor:{verge:'#9da873',bank:'#b9a177',edge:'#7c9d92',bed:'#82adab',core:'#a6c9bd',mark:'#6b918a',light:'#e0ede0',stone:'#a0a092'},
  canal:{verge:'#879e74',bank:'#a6a384',edge:'#7f9c87',bed:'#8bb5a2',core:'#a9c9ad',mark:'#729d8d',light:'#e0ebc8',stone:'#989d88'},
  fair:{verge:'#a5a075',bank:'#bc946f',edge:'#b59378',bed:'#d4b197',core:'#e7c7a3',mark:'#aa825e',light:'#fae5ba',stone:'#c4a282'},
  tide:{verge:'#51777e',bank:'#698483',edge:'#538387',bed:'#477f88',core:'#518f94',mark:'#6f9ea0',light:'#b1d5c5',stone:'#779996'},
  alpine:{verge:'#8d9e89',bank:'#acac95',edge:'#929c8f',bed:'#bbc0a5',core:'#d3d0b2',mark:'#9b9681',light:'#f3ecd6',stone:'#9ca79c'},
  sky:{verge:'#b2abb1',bank:'#a99a9d',edge:'#af9275',bed:'#d7c5aa',core:'#e9dbc4',mark:'#ab967c',light:'#fcf2d3',stone:'#b7a6a0'}
};
const paletteCache=new Map();
function terrainInks(theme,light,weather) {
  const id=theme+'/'+light+'/'+weather;
  if(paletteCache.has(id))return paletteCache.get(id);
  const colorsFor={...colors[theme]};
  for(const name of Object.keys(colorsFor)){
    let value=colorsFor[name];
    if(light==='night')value=mix(value,isWater(theme)?'#203b49':'#293b40',name==='light'?.36:.62);
    else if(light==='dusk')value=mix(value,'#bc8472',.16);
    else if(light==='dawn')value=mix(value,'#c8aca2',.12);
    if(weather==='rain')value=mix(value,light==='night'?'#304b59':'#8da8ae',.21);
    if(weather==='snow')value=mix(value,light==='night'?'#8096a1':'#dbe6e1',.31);
    colorsFor[name]=value;
  }
  paletteCache.set(id,colorsFor);return colorsFor;
}
const isWater=id=>id==='harbor'||id==='canal'||id==='tide';
const pt=(x,y)=>({x,y});
function ink(c,path,color,width=1,close=false) {
  if(path.length<2)return;
  c.beginPath();c.moveTo(path[0].x,path[0].y);
  for(let j=1;j<path.length;j++)c.lineTo(path[j].x,path[j].y);
  if(close){c.closePath();c.fillStyle=color;c.fill();}
  else{c.strokeStyle=color;c.lineWidth=width;c.stroke();}
}
function oval(c,x,y,rx,ry,angle,color){
  if(rx<=0||ry<=0)return;
  c.beginPath();c.ellipse(x,y,rx,ry,angle,0,Math.PI*2);c.fillStyle=color;c.fill();
}
function strand(c,project,start,end,getX,color,width,step=.21) {
  const path=[];
  for(let z=start;z<end;z+=step)path.push(project(getX(z),z));
  path.push(project(getX(end),end));
  ink(c,path,color,width);
}
function band(c,project,start,end,edges,color,step=.21) {
  const a=[],b=[];
  for(let z=start;z<end+step*.5;z+=step){
    const at=Math.min(z,end),[lo,hi]=edges(at);a.push(project(lo,at));b.push(project(hi,at));
  }
  ink(c,a.concat(b.reverse()),color,0,true);
}
function bridgeLine(c,one,two,inkColor,width=1) {
  ink(c,[one,two],inkColor,width);
}

export function drawLandscape(scene,c,start,end) {
  const {theme,seed,worldWidth,weather,light}=scene;
  const p=terrainInks(theme,light,weather),wet=isWater(theme),night=light==='night';
  const project=(x,z)=>scene.worldPoint(x,z);
  const road=z=>route(theme,seed,z,worldWidth);
  const bank=(z,side,extra=0)=>{const r=road(z);return r.x+side*(r.half+extra);};
  const a=Math.floor(start*5)/5, b=Math.ceil(end*5)/5;
  c.save();c.lineJoin='round';c.lineCap='round';
  // Changing climate tints the inks while the geography stays registered.
  const snow=weather==='snow',wash=night?.72:.91;
  const phase=(seed%379)*.037;
  const shoulder=(z,side)=>.46+.16*Math.sin(z*.73+phase+side)+.09*Math.cos(z*1.9+side);
  for(const [width,alpha] of [[1.42,.13],[1.07,.15],[.73,.19]]){
    c.globalAlpha=alpha*wash;
    band(c,project,a,b,z=>[bank(z,-1,width*shoulder(z,-1)),bank(z,1,width*shoulder(z,1))],snow?'#c8d6cd':p.verge);
  }
  c.globalAlpha=.63*wash;
  band(c,project,a,b,z=>[bank(z,-1,.15),bank(z,1,.16)],p.bank);
  c.globalAlpha=.84*wash;
  band(c,project,a,b,z=>[bank(z,-1),bank(z,1)],p.bed);
  c.globalAlpha=.52*wash;
  band(c,project,a,b,z=>{const r=road(z),sweep=Math.sin(z*.72+phase)*.12;
    return [r.x-r.half*(.60+sweep),r.x+r.half*(.59-sweep)];},p.core);
  if(wet){
    for(let i=0;i<5;i++){
      c.globalAlpha=.11+i*.016;
      const f=(i-2)*.20;
      band(c,project,a,b,z=>{
        const r=road(z),m=r.x+r.half*(f+Math.sin(z*.85+phase+i)*.14);
        return [m-r.half*.08,m+r.half*.09];
      },i%2?p.edge:p.light);
    }
  }
  for(const side of [-1,1]){
    c.globalAlpha=(night?.5:.78);
    strand(c,project,a,b,z=>bank(z,side),p.edge,1.05);
    c.globalAlpha=.63;
    strand(c,project,a,b,z=>bank(z,side,-.042),p.light,.82);
  }
  const first=Math.floor(a/SPAN)-1, last=Math.ceil(b/SPAN)+1;
  for(let block=first;block<=last;block++){
    const z0=block*SPAN,z1=z0+SPAN;
    if(z1<a||z0>b)continue;
    const rng=random(hash(seed^Math.imul(block+10003,0x3f631)));
    for (let j=0;j<12;j++){
      const z=z0+(j+rng()*.75)*SPAN/12;
      const r=road(z),side=j%2?1:-1, offset=(.20+rng()*.69)*side;
      const v=project(r.x+r.half*offset,z);
      if(wet){
        c.globalAlpha=night?.50:.72;
        const reach=v.unit*(.10+rng()*.18);
        c.beginPath();c.moveTo(v.x-reach,v.y);c.quadraticCurveTo(v.x,v.y-v.unit*.021,v.x+reach*.75,v.y+.1);
        c.lineWidth=clampUnit(v.unit*.012,.55,1.15);c.strokeStyle=j%3?p.light:p.mark;c.stroke();
      }else if(theme==='fair' || theme==='sky'){
        c.globalAlpha=.57;
        if(j%3===0){
          const sz=v.unit*.055;
          ink(c,[pt(v.x-sz,v.y),pt(v.x,v.y-sz*.49),pt(v.x+sz,v.y),pt(v.x,v.y+sz*.49)],p.mark,0,true);
        }
      }else{
        c.globalAlpha=.49;oval(c,v.x,v.y,v.unit*(.016+rng()*.025),v.unit*.011,-.15,p.mark);
      }
      const far=project(bank(z,side,.25+rng()*.82),z);
      if(snow) {
        c.globalAlpha=.62;oval(c,far.x,far.y,far.unit*(.13+rng()*.16),far.unit*.046,-.07,'#eff1dc');
      }else if(theme==='herbarium'||theme==='grove'||theme==='canal'){
        c.globalAlpha=.61;
        for(let k=-1;k<=1;k++)bridgeLine(c,far,pt(far.x+far.unit*.042*k,far.y-far.unit*(.06+rng()*.07)),p.verge,.78);
      }else{
        c.globalAlpha=.48;
        oval(c,far.x,far.y,far.unit*(.04+rng()*.07),far.unit*.02,-.13,p.stone);
      }
    }
    for(let j=0;j<60;j++){
      const z=z0+rng()*SPAN,side=rng()<.5?-1:1;
      const offset=.10+rng()**1.7*1.10, x=bank(z,side,offset);
      const px=project(x,z),sz=px.unit;
      if(snow){
        c.globalAlpha=.41;oval(c,px.x,px.y,sz*(.035+rng()*.115),sz*(.012+rng()*.023),-.16,'#e9efdf');
      }else if(theme==='harbor'||theme==='canal'||theme==='herbarium'||theme==='grove'){
        c.globalAlpha=.58;
        const blades=2+Math.floor(rng()*3),col=j%3?p.verge:p.mark;
        for(let k=0;k<blades;k++){
          const angle=(k/blades-.45)*1.95+(rng()-.5)*.26,h=sz*(.025+rng()*.087);
          const top=pt(px.x+Math.sin(angle)*h,px.y-Math.cos(angle)*h);
          bridgeLine(c,px,top,col,clampUnit(sz*.013,.45,.94));
          if(theme==='herbarium'&&j%12===0)oval(c,top.x,top.y,sz*.018,sz*.012,-.25,'#c98177');
        }
      }else if(theme==='alpine'||theme==='tide'){
        c.globalAlpha=.45;
        oval(c,px.x,px.y,sz*(.035+rng()*.085),sz*(.015+rng()*.021),-.11,p.stone);
        if(j%3===0)bridgeLine(c,pt(px.x-sz*.034,px.y-sz*.013),pt(px.x+sz*.027,px.y-sz*.019),p.light,.6);
      }else if(theme==='sky'){
        if(j%6===0){c.globalAlpha=.56;bridgeLine(c,pt(px.x-2,px.y),pt(px.x+2,px.y),p.mark,.7);bridgeLine(c,pt(px.x,px.y-1.5),pt(px.x,px.y+1.5),p.mark,.6);}
      }else if(j%3===0){
        c.globalAlpha=.52;oval(c,px.x,px.y,sz*.04,sz*.017,-.36,j%2?'#a17d75':'#b9a46d');
      }
    }
    const side=(block&1)?-1:1;
    if(theme==='harbor'||theme==='canal'||theme==='fair') {
      // Continuous shoreline frontage or a fairground promenade. The repeated
      // joints sit on the same bank as the adjoining footpaths and dwellings.
      const s=z0+.30, e=z1-.16;
      const span=[s,e],extra=theme==='fair'?.14:.26;
      c.globalAlpha=.83*wash;
      band(c,project,...span,z=>[bank(z,side,.015),bank(z,side,extra)],theme==='harbor'?'#ad926f':p.stone,.14);
      for (let k=0;k<15;k++){
        const z=s+(e-s)*k/15;
        c.globalAlpha=.46;
        bridgeLine(c,project(bank(z,side,.02),z),project(bank(z,side,extra),z+.014),p.mark,.67);
        if(k%4===0) {
          const post=project(bank(z,side,.03),z);
          c.globalAlpha=.75;
          bridgeLine(c,post,pt(post.x,post.y-post.unit*.12),p.mark,Math.max(.9,post.unit*.025));
        }
      }
    } else if (theme==='alpine' || theme==='sky'){
      c.globalAlpha=.62;
      const track=z=>theme==='alpine'?road(z).x:bank(z,side,.31);
      const gauge=theme==='alpine'?.15:.07;
      for(const offset of [-gauge,gauge])strand(c,project,z0,z1,z=>track(z)+offset,p.mark,.93);
      for(let j=0;j<13;j++){
        const z=z0+(j+.5)*SPAN/13,mid=track(z);
        bridgeLine(c,project(mid-gauge-.06,z),project(mid+gauge+.06,z),p.mark,.80);
      }
    }
  }
  c.restore();
}

const clampUnit=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));

export function drawSettlements(scene,c,firstIndex,endIndex) {
  const {theme,seed,worldWidth,light}=scene;
  const colorsFor=terrainInks(theme,light,scene.weather),wet=isWater(theme),night=light==='night';
  const project=(x,z)=>scene.worldPoint(x,z);
  c.save();c.lineCap='round';c.lineJoin='round';
  for(let first=Math.floor(firstIndex/NOTES)*NOTES;first<endIndex;first+=NOTES){
    const groups=[[],[]],watercraft=[],quays=[];
    for(let i=first;i<Math.min(first+NOTES,endIndex);i++){
      if(!scene.events[i]||scene.inFlight.has(i))continue;
      const s=scene.site(i),r=route(theme,seed,s.z,worldWidth);
      const side=s.side|| (s.x<r.x?-1:1);
      if(s.role==='crossing') {
        // The printed approaches meet both abutments across the real channel.
        for(const direction of [-1,1]){
          const inner=project(r.x+direction*(r.half-.11),s.z);
          const outer=project(r.x+direction*(r.half+.43),s.z+.04);
          c.globalAlpha=.82;bridgeLine(c,inner,outer,colorsFor.stone,Math.max(2.2,inner.unit*.17));
          for(let j=0;j<4;j++){
            const x=r.x+direction*(r.half+.055+j*.092);
            c.globalAlpha=.62;bridgeLine(c,project(x,s.z-.085),project(x,s.z+.11),colorsFor.mark,.78);
          }
        }
        continue;
      }
      if(s.role==='quay'){
        quays.push(s);
        const inner=project(r.x+side*(r.half-.23),s.z+.038);
        const outer=project(s.x,s.z);
        c.globalAlpha=.80;bridgeLine(c,inner,outer,colorsFor.stone,Math.max(2,inner.unit*.15));
      }
      if(s.pool) {
        const v=project(s.x,s.z);
        c.globalAlpha=.58;oval(c,v.x,v.y,v.unit*.53,v.unit*.17,-.11,colorsFor.bank);
        c.globalAlpha=.82;oval(c,v.x,v.y-.45,v.unit*.48,v.unit*.14,-.11,colorsFor.bed);
      }
      if(s.role==='side-crossing'&&s.crossingAlong){
        const t=s.crossingAlong;
        const left=project(s.x-t.x*.62,s.z-t.z*.62),right=project(s.x+t.x*.62,s.z+t.z*.62);
        c.globalAlpha=.60;bridgeLine(c,left,right,theme==='sky'?'#b5b4c9':'#8ea8a3',Math.max(2,left.unit*.17));
      }
      if(s.role==='flow')watercraft.push(s);
      const inside=wet&&(s.role==='flow'||s.role==='water-edge'||Math.abs(s.x-r.x)<r.half*.90);
      if(inside){
        const v=project(s.x,s.z);
        c.globalAlpha=.55;
        for(let k=0;k<2;k++){
          c.beginPath();c.ellipse(v.x,v.y+(k+.5)*v.unit*.037,v.unit*(.22+.13*k),v.unit*(.04+.022*k),-.07,.25,Math.PI*1.21);
          c.strokeStyle=colorsFor.light;c.lineWidth=.78;c.stroke();
        }
      }else groups[s.x<r.x?0:1].push(s);
    }
    for(const boat of watercraft){
      const dock=quays.filter(q=>Math.abs(q.z-boat.z)<SPAN*.36).sort((a,b)=>Math.abs(a.z-boat.z)-Math.abs(b.z-boat.z))[0];
      if(!dock)continue;
      const r=route(theme,seed,dock.z,worldWidth),side=dock.x<r.x?-1:1;
      const mooring=project(r.x+side*(r.half-.16),dock.z+.06);
      const prow=project(boat.x+side*.12,boat.z-.04);
      c.globalAlpha=.62;c.beginPath();c.moveTo(mooring.x,mooring.y);
      c.quadraticCurveTo((mooring.x+prow.x)/2,(mooring.y+prow.y)/2+mooring.unit*.048,prow.x,prow.y);
      c.strokeStyle=colorsFor.mark;c.lineWidth=.75;c.stroke();
    }
    groups.forEach((sites,bankNo)=>{
      if(!sites.length)return;
      sites.sort((a,b)=>a.z-b.z);
      const side=bankNo?1:-1;
      // Blend local earth into the paper. Nearby doorways share a gently
      // bent lane. Distant buildings connect to the main route individually.
      const nearby=[];
      for(let j=0;j<sites.length;j++){
        const s=sites[j],v=project(s.x,s.z);
        const radius=v.unit*(s.role==='garden'?.85:.66)*s.size;
        c.save();c.translate(v.x,v.y+v.unit*.035);c.scale(1,.35);
        const wash=c.createRadialGradient(0,0,0,0,0,radius);
        wash.addColorStop(0,colorsFor.verge);wash.addColorStop(.52,colorsFor.verge+'a6');wash.addColorStop(1,colorsFor.verge+'00');
        c.globalAlpha=night?.30:.37;c.fillStyle=wash;c.fillRect(-radius,-radius,radius*2,radius*2);c.restore();
        for(let k=j+1;k<sites.length;k++){
          const b=sites[k],dist=Math.hypot(s.x-b.x,s.z-b.z);
          if(dist<2.75)nearby.push([s,b,dist]);
        }
      }
      const connected=new Set();
      for(const [a,b] of nearby.sort((u,v)=>u[2]-v[2])){
        if(connected.has(a)&&connected.has(b))continue;
        connected.add(a);connected.add(b);
        const one=project(a.door.x,a.door.z),two=project(b.door.x,b.door.z);
        const bend=project((a.door.x+b.door.x)*.5-side*.13,(a.door.z+b.door.z)*.5+.18);
        c.beginPath();c.moveTo(one.x,one.y);c.quadraticCurveTo(bend.x,bend.y,two.x,two.y);
        c.globalAlpha=.27;c.lineWidth=clampUnit(one.unit*.105,1.7,6);c.strokeStyle=colorsFor.bank;c.stroke();
        c.globalAlpha=.47;c.lineWidth=clampUnit(one.unit*.040,.70,2.1);c.strokeStyle=colorsFor.core;c.stroke();
      }
      const middle=sites[Math.floor(sites.length/2)];
      for(const s of sites){
        const v=project(s.x,s.z),randomPoint=random(hash(Math.round(s.z*8000)^seed));
        c.globalAlpha=.40;
        oval(c,v.x,v.y+v.unit*.012,v.unit*(.22+.12*randomPoint()),v.unit*(.048+.025*randomPoint()),-.05,colorsFor.bank);
        if((['frontage','courtyard','gate','quay'].includes(s.role) && !connected.has(s)) || s===middle){
          const entry=project(s.approach.x,s.approach.z),door=project(s.door.x,s.door.z);
          c.globalAlpha=.38;c.beginPath();c.moveTo(entry.x,entry.y);
          c.bezierCurveTo(entry.x+(door.x-entry.x)*.28,entry.y-v.unit*.12,entry.x+(door.x-entry.x)*.64,door.y+v.unit*.10,door.x,door.y);
          c.strokeStyle=colorsFor.bank;c.lineWidth=clampUnit(v.unit*.084,1.6,4.7);c.stroke();
          c.globalAlpha=.56;c.lineWidth=clampUnit(v.unit*.033,.58,1.6);c.strokeStyle=colorsFor.light;c.stroke();
        }
        if(s.role==='courtyard'||s.role==='frontage'){
          const pad=[[-.36,-.14],[.30,-.12],[.34,.20],[-.34,.23]].map(([dx,dz])=>project(s.x+dx,s.z+dz));
          c.globalAlpha=.42;ink(c,pad,colorsFor.stone,0,true);
          c.globalAlpha=.62;ink(c,[pad[3],pad[2],pad[1]],colorsFor.bank,.8);
        }else if(s.role==='garden'){
          c.globalAlpha=.55;
          for(let j=0;j<6;j++){
            const q=project(s.x+side*(.39-.02*Math.sin(j*.75)),s.z+(j-2.5)*.085);
            oval(c,q.x,q.y,q.unit*.032,q.unit*.014,-.12,colorsFor.stone);
          }
        }
        if(s.kind===14||s.size>1.14){
          c.globalAlpha=.52;
          const q=project(s.x-side*.29,s.z+.06);
          for(let k=0;k<3;k++)bridgeLine(c,pt(q.x+side*k*2,q.y+k*.42-1.5),pt(q.x+side*k*2,q.y+k*.42+1.5),colorsFor.mark,.62);
        }
      }
    });
  }
  c.restore();
}
