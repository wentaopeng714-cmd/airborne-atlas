// Each phrase builds a place, in note order. Longitudinal positions are fractions of
// a district. Lateral distances are measured from its route rather than from a grid.
export const SPAN=5.2;
export const NOTES=8;
const TAU=Math.PI*2;
const clamp=(x,lo,hi)=>Math.min(hi,Math.max(lo,x));
function hash(n){
 n=Math.imul(n^(n>>>16),0x7feb352d);
 n=Math.imul(n^(n>>>15),0x846ca68b);
 return (n^(n>>>16))>>>0;
}
const unit=n=>hash(n)/4294967296;
// [minimum and maximum half-width, centre-line amplitude, curve wavelength, salt]
const channels={
 herbarium:[.46,.64,.64,3.65,9023],harbor:[.91,1.12,.83,4.70,2719],
 fair:[.60,.83,.76,4.45,4513],tide:[.81,1.04,.92,3.85,9677],
 grove:[.37,.55,.90,3.75,3323],alpine:[.43,.55,.61,5.45,8231],
 canal:[.63,.75,.82,4.40,5591],sky:[.46,.64,.72,4.16,6673]
};
const salt=(theme,seed)=>hash((seed|0)^channels[theme][4]);
function ribbon(theme,seed,z,width){
 const [min,max,swing,period]=channels[theme],s=salt(theme,seed);
 const a=(s&1023)/1024*TAU,b=((s>>>10)&1023)/1024*TAU,c=(s>>>20)/4096*TAU;
 const u=z/SPAN,omega=TAU/period,w=clamp(width/10,.82,1.22);
 const x=w*swing*(.72*Math.sin(omega*u+a)+.26*Math.sin(omega*.49*u+b)+.14*Math.sin(omega*1.74*u+c));
 const slope=w*swing*omega/SPAN*(.72*Math.cos(omega*u+a)+.26*.49*Math.cos(omega*.49*u+b)+.14*1.74*Math.cos(omega*1.74*u+c));
 const throat=.50+.31*Math.sin(u*.91+b)+.19*Math.sin(u*1.63+c);
 return {x,half:min+(max-min)*throat,slope};
}
export function route(theme,seed,z,width){
 const {x,half}=ribbon(theme,seed,z,width);return {x,half};
}

// norm is a bank depth for dry sites, or a fraction of the channel half-width
// for wet sites. The sign selects the left/right bank before a district mirror.
// +Z is down the score. Models with a door face +Z in their own local frame.
const at=(kind,role,side,z,norm,size=1)=>({kind,role,side,z,norm,size});
const house=(k,s,z,n=.25,a=1)=>at(k,'frontage',s,z,n,a);
const court=(k,s,z,n=.47,a=1)=>at(k,'courtyard',s,z,n,a);
const grove=(k,s,z,n=.50,a=.84)=>at(k,'garden',s,z,n,a);
const outer=(k,s,z,n=.84,a=.87)=>at(k,'outer',s,z,n,a);
const gate=(k,s,z,n=.16,a=.93)=>at(k,'gate',s,z,n,a);
const edge=(k,s,z,n=.78,a=.76)=>at(k,'water-edge',s,z,n,a);
const quay=(k,s,z,n=.18,a=.95)=>at(k,'quay',s,z,n,a);
const boat=(k,s,z,n=.18,a=.95)=>at(k,'flow',s,z,n,a);
const cross=(k,z,a=1.1)=>at(k,'crossing',0,z,0,a);
const viaduct=(k,s,z,n=.50,a=1.04)=>at(k,'side-crossing',s,z,n,a);
const rolling=(k,z,a=1)=>at(k,'rail',0,z,0,a);
const guest=(s,z,n=.38,a=.90)=>at(15,'visitor',s,z,n,a);
const district=(name,slots)=>({name,slots});
// A negative family is a district's signature site. In occasional phrases a
// full landmark develops there in place of its quieter regular structure.
const settings={
 herbarium:[
  district('glasshouse-garden',[
   house(-8,-1,.31,.53,1.04), gate(13,-1,.31,.02,.89), grove([0,7],-1,.58,.17,.84),
   guest(1,.61,.29), grove(3,-1,.72,.67,.82), court(11,1,.27,.48,.92), grove(2,1,.79,.75,.78), outer(5,-1,.93,.43,.74)]),
  district('bee-orchard',[
   outer(9,1,.28,.65,1.05), court(12,1,.38,.08,.95), grove(2,1,.52,.80,.74),
   guest(-1,.62,.28), grove(7,-1,.30,.14,.88), outer(1,-1,.20,.70,.85), grove(10,1,.80,.29,.83), gate(13,-1,.83,.66,.90)]),
  district('water-court',[
   court(11,-1,.32,.26,1.07), grove(6,-1,.44,.71,.97), grove(4,-1,.64,.07,.90),
   guest(1,.70,.23), house(-8,1,.29,.60,.92), grove(10,1,.23,.07,.81), outer(5,-1,.81,.73,.85), grove([0,3],1,.91,.70,.78)])
 ],
 harbor:[
  district('shipwright-slip',[
   quay(11,-1,.31,.19,1.02),boat(10,-1,.33,.17,.92),house(13,-1,.28,.70,1.03),
   edge(6,1,.58,.72,.69),guest(1,.78,.30),outer(3,-1,.79,.77,.88),house(-8,1,.29,.47,.96),house(4,-1,.72,.10,.80)]),
  district('pilot-reach',[
   house(0,1,.35,.16,1.05),boat(9,1,.32,.12,1),edge(12,-1,.53,.73,.78),
   guest(-1,.78,.39),house(8,1,.29,.81,.99),outer(3,1,.81,.68,.85),quay(5,-1,.22,.18,.89),house(7,-1,.72,.58,.94)]),
  district('fish-quay',[
   quay(5,1,.38,.21,1),boat(1,1,.39,.30,.88),house(7,1,.35,.68,1.05),
   guest(-1,.81,.28),house(2,-1,.29,.61,1.03),edge(6,-1,.58,.77,.64),house(4,1,.78,.34,.87),outer(3,-1,.77,.81,.77)])
 ],
 fair:[
  district('carousel-green',[
   gate(13,-1,.27,.06,.85),court(-8,-1,.37,.63,1.12),house(6,-1,.68,.27,.85),
   guest(1,.70,.38),house(3,1,.28,.10,.78),court(10,1,.29,.82,1.10),grove(7,1,.91,.81,.73),outer(5,-1,.88,.71,.81)]),
  district('circus-yard',[
   court(2,1,.32,.45,1.08),house(9,1,.35,.91,.87),gate(6,1,.49,.03,.80),
   guest(-1,.69,.22),house(11,-1,.34,.55,.95),house(3,-1,.23,.06,.78),outer(4,1,.82,.58,.93),court(12,-1,.87,.83,.87)]),
  district('lantern-midway',[
   court(1,-1,.31,.66,1.05),court(0,-1,.45,.12,.92),house(13,1,.36,.17,.85),
   guest(1,.71,.22),court(5,1,.29,.83,.93),house(7,-1,.65,.56,.82),house(11,-1,.86,.12,.90),outer(4,1,.90,.82,.78)])
 ],
 tide:[
  district('tidal-arch',[
   edge(8,-1,.31,.88,1.03),boat(7,-1,.39,.11,.87),edge(2,-1,.59,.92,.82),
   guest(1,.76,.30),edge(12,1,.23,.92,.92),grove(4,-1,.76,.37,.80),outer([0,6],1,.47,.57,.81),boat(5,1,.90,.12,.80)]),
  district('pearl-garden',[
   edge(-12,1,.35,.83,1.08),boat(11,1,.54,.13,.83),grove(6,1,.37,.24,.88),
   guest(-1,.76,.37),edge(0,-1,.25,.79,.91),outer(13,-1,.38,.45,.94),grove(4,1,.80,.37,.74),boat(1,-1,.92,.18,.72)]),
  district('drifting-reef',[
   boat(9,1,.35,.13,1.02),edge(3,1,.26,.91,.83),edge(10,-1,.55,.76,.91),
   guest(-1,.82,.29),grove(13,1,.58,.47,.86),edge(7,1,.78,.86,.74),outer(2,-1,.24,.52,.83),grove(6,-1,.88,.74,.80)])
 ],
 grove:[
  district('lamplit-hamlet',[
   house(-8,-1,.32,.42,1.10),gate(4,-1,.34,.00,.87),grove(0,-1,.58,.18,.78),
   guest(1,.71,.34),outer(9,1,.30,.66,1.04),grove(10,1,.53,.13,.83),outer(5,-1,.84,.66,.78),grove(7,1,.89,.72,.66)]),
  district('moss-well',[
   court(13,1,.36,.25,1.04),grove(12,1,.45,.72,.88),gate(4,1,.20,.70,.77),
   guest(-1,.69,.23),outer(2,-1,.37,.68,.94),grove(1,-1,.42,.08,.80),outer(3,1,.80,.64,.82),grove(6,-1,.88,.73,.74)]),
  district('spore-nursery',[
   outer(11,-1,.33,.58,1.00),grove(7,-1,.31,.08,.88),grove(10,-1,.61,.38,.94),
   guest(1,.69,.32),house(8,1,.29,.66,.96),grove(3,1,.24,.10,.85),outer(9,-1,.86,.83,1.03),grove(1,1,.89,.72,.76)])
 ],
 alpine:[
  district('cog-platform',[
   rolling(10,.32,.97),house(-8,-1,.33,.20,1.04),gate(3,-1,.57,.04,.85),
   guest(1,.71,.26),outer(13,-1,.31,.84,.91),grove(2,1,.27,.07,.78),outer(0,1,.40,.79,.92),grove(1,-1,.89,.44,.76)]),
  district('ravine-pass',[
   viaduct(9,1,.34,.34,1.05),house(11,1,.34,.84,.94),grove(1,1,.59,.12,.75),
   guest(-1,.70,.35),outer(12,-1,.29,.68,1.04),grove(5,-1,.29,.08,.88),rolling(10,.79,.88),outer(4,1,.83,.69,.82)]),
  district('shepherd-track',[
   house(13,-1,.36,.57,1.02),grove(6,-1,.41,.04,.91),grove(4,-1,.64,.47,.91),
   guest(1,.73,.22),viaduct(7,1,.29,.23,.93),grove(5,1,.49,.75,.84),outer(0,-1,.85,.81,.88),house(3,1,.91,.71,.86)])
 ],
 canal:[
  district('moonbridge-ferry',[
   cross(-8,.48,1.10),boat(1,-1,.18,.09,.83),quay(2,-1,.51,.12,.90),
   guest(1,.86,.24),outer(11,1,.34,.63,1),grove(5,-1,.34,.36,.84),edge(0,1,.67,.92,.62),house(13,-1,.87,.72,.91)]),
  district('tea-quay',[
   house(13,1,.33,.13,1.05),boat(9,1,.38,.17,.96),grove(5,1,.38,.77,.89),
   guest(-1,.81,.26),quay(2,-1,.40,.07,.83),house(4,-1,.22,.65,.96),outer(3,1,.81,.76,.87),edge(6,1,.69,.76,.78)]),
  district('millwater-lane',[
   quay(12,-1,.33,.16,1.02),edge(6,-1,.44,.95,.67),house(10,-1,.28,.77,.94),
   guest(1,.84,.33),cross(8,.52,1.05),grove(7,1,.56,.20,.82),boat(1,1,.17,.16,.81),outer(11,-1,.88,.73,.80)])
 ],
 sky:[
  district('dome-terrace',[
   house(-8,-1,.32,.49,1.08),court(10,-1,.37,.03,.94),gate(1,1,.31,.09,.84),
   guest(1,.71,.30),court(9,1,.33,.73,1.03),grove(6,-1,.64,.22,.78),outer(7,-1,.85,.79,.84),grove(0,1,.88,.72,.67)]),
  district('balloon-landing',[
   court(11,1,.35,.54,1.05),gate(2,1,.31,.05,.87),viaduct(3,1,.67,.57,.96),
   guest(-1,.72,.22),house(5,-1,.29,.68,.98),grove(0,-1,.25,.07,.76),outer(6,1,.90,.89,.83),court(4,-1,.88,.77,.83)]),
  district('meridian-court',[
   court(12,-1,.32,.39,1.02),court(13,-1,.41,.88,.92),gate(2,-1,.49,.02,.83),
   guest(1,.68,.28),house(8,1,.30,.74,1.00),court(1,1,.25,.05,.91),grove(4,-1,.80,.59,.85),outer(7,1,.90,.82,.80)])
 ]
};

const weatherList=['clear','rain','wind','snow'];
const wet=new Set(['harbor','tide','canal']);
// Conservative ground footprints, in each sculpture's local X/Z frame. Icon
// silhouettes can extend past their foot. Long vessels and trains use oriented
// footprints so a dock beside a ship need not be separated by its full length.
const halfFeet={
 herbarium:[[.79,.30],[.66,.35],[.65,.37],[.58,.23],[.65,.50],[.54,.52],[.73,.49],[.71,.30],[.74,.43],[.65,.42],[.56,.46],[.58,.58],[.42,.36],[.59,.37],[.86,.65],[.50,.39],[.48,.48],[.39,.22],[.46,.32]],
 harbor:[[.39,.39],[.90,.30],[.68,.43],[.72,.67],[.60,.55],[.60,.32],[.36,.36],[.84,.54],[.79,.55],[.90,.30],[.90,.30],[.60,.32],[.36,.36],[.66,.55],[.88,.51],[.60,.32],[.90,.30],[.90,.30],[.94,.39]],
 fair:[[.71,.73],[.69,.31],[.73,.76],[.81,.32],[.68,.68],[.67,.68],[.81,.37],[.44,.33],[.81,.82],[.81,.32],[.85,.31],[.81,.32],[.78,.79],[.81,.37],[.96,.97],[.81,.32],[.81,.58],[.81,.32],[.81,.32]],
 tide:[[.46,.38],[.47,.39],[.81,.32],[.52,.47],[.72,.48],[.64,.67],[.54,.37],[.45,.36],[.72,.61],[.79,.83],[.49,.45],[.54,.44],[.65,.59],[.53,.47],[.77,.67],[.45,.38],[.46,.41],[.70,.29],[.46,.45]],
 grove:[[.50,.41],[.52,.42],[.50,.41],[.56,.32],[.45,.41],[.50,.46],[.44,.41],[.35,.33],[.58,.75],[.71,.58],[.42,.41],[.50,.46],[.55,.38],[.53,.43],[.78,1],[.56,.41],[.50,.48],[.40,.37],[.40,.37]],
 alpine:[[.67,.45],[.71,.24],[.48,.12],[.66,.44],[.58,.38],[.51,.21],[.70,.41],[.74,.45],[.81,.48],[.86,.45],[.77,.29],[.59,.37],[.76,.56],[.67,.57],[1.28,.57],[.59,.16],[.65,.44],[.65,.16],[.81,.22]],
 canal:[[.70,.44],[.90,.30],[.59,.66],[.47,.43],[.61,.19],[.81,.32],[.58,.32],[.37,.25],[.86,.45],[.90,.30],[.67,.57],[.59,.53],[.82,.42],[.63,.46],[1.19,.57],[.56,.23],[.90,.44],[.59,.10],[.46,.56]],
 sky:[[.42,.27],[.38,.39],[.41,.23],[.73,.26],[.41,.33],[.37,.27],[.37,.35],[.46,.30],[.58,.58],[.51,.38],[.55,.42],[.36,.34],[.47,.39],[.34,.28],[.89,.85],[.36,.25],[.32,.32],[.75,.34],[.34,.28]]
};
function recipeIndex(theme,seed,block){
 const s=salt(theme,seed),cycle=Math.floor(block/3),phase=((block%3)+3)%3;
 // Change a three-phrase rotation at a two-cycle cadence; the outgoing and
 // incoming trios cannot end and start on the same plan.
 const offset=(s%3+Math.floor(cycle/2)*2)%3,forward=((s>>>9)&1)?1:2;
 return ((offset+phase*forward+(cycle%2?forward:0))%3+3)%3;
}
export function districtType(theme,seed,block){return settings[theme][recipeIndex(theme,seed,block)].name;}
function chooseFamily(slot,theme,seed,block,ordinal){
 const k=slot.kind;
 if(Array.isArray(k))return k[hash(seed^Math.imul(block+1,156019)^ordinal)%k.length];
 if(k>=0)return k;
 const scenic=recipeIndex(theme,seed,block)===(theme==='tide'?1:0);
 return scenic&&Math.floor(block/3)%2===0?14:-k;
}
function guestPlacement(theme,weather,slot){
 if(theme==='harbor' && weather!=='clear')return {...slot,role:'flow',norm:.16};
 if(theme==='canal' && weather==='rain')return {...slot,role:'flow',norm:.22,size:.80};
 if(theme==='tide'){
  return weather==='wind'||weather==='snow'?{...slot,role:'flow',norm:.23}:{...slot,role:'water-edge',norm:.76};
 }
 return slot;
}
function landmarkPlacement(theme,slot,ordinal){
 if(theme==='canal'){
  // Along the main canal the stone arch spans bank to bank. In a narrow lane
  // a new arched bridge crosses a side channel beside the existing boat traffic.
  if(slot.role==='crossing')return {...slot,size:1.13};
  return {...slot,role:'side-crossing',side:slot.side||1,norm:.42,z:slot.z,size:1.07};
 }
 if(theme==='tide')return {...slot,role:'water-edge',side:slot.side||1,norm:.91,size:1.10};
 if(['flow','rail','crossing','quay','side-crossing','water-edge'].includes(slot.role)){
  return {...slot,role:'frontage',side:slot.side||1,norm:.36,size:1.07};
 }
 return {...slot,role:slot.role==='outer'?'outer':'courtyard',side:slot.side||1,norm:Math.max(.28,slot.norm),size:1.09};
}
function projectedExtent(site,dx,dz){
 const u=site.cs*dx-site.sn*dz,v=site.sn*dx+site.cs*dz;
 return Math.hypot(site.rx*u,site.rz*v);
}
function clearance(a,b){
 const dx=a.x-b.x,dz=a.z-b.z,dist=Math.hypot(dx,dz);
 if(dist<.00001)return -3;
 const ux=dx/dist,uz=dz/dist;
 return dist-projectedExtent(a,ux,uz)-projectedExtent(b,ux,uz);
}
function orientation(theme,kind,role,side,slope,drift){
 const tangent=Math.atan(slope);
 if(role==='flow'||role==='rail')return (theme==='tide'&&kind!==15?tangent-.20:-Math.PI/2+tangent)+drift*.25;
 if(role==='crossing')return tangent;
 if(role==='side-crossing')return tangent+side*(theme==='canal'?.81:.15);
 if(role==='quay'){
  // The wheeled mill is on the model's right; its wheel must face the water.
  if(theme==='canal'&&kind===12)return side>0?Math.PI+tangent:tangent;
  if(theme==='canal'&&kind===2)return -side*Math.PI/2+tangent;
  return tangent+side*.075;
 }
 if(role==='frontage'||role==='gate'||role==='visitor')return -side*(.99+drift)+tangent*.45;
 if(role==='courtyard')return -side*.45+tangent*.30+drift;
 return tangent+drift*2.1+side*.17;
}
function rawSite(params,slot,kind,wx,dz=0,depthShift=0,sideFlip=false,shrink=1){
 const {theme,seed,block,ordinal,width,mirror}=params;
 const noise=hash(seed^Math.imul(block*8+ordinal+1,0x57c29d));
 const tiny=(unit(noise)-.5)*.08,turnNoise=(unit(noise^91827)-.5)*.49;
 const role=slot.role;
 const side=(slot.side||1)*mirror*(sideFlip?-1:1);
 let size=slot.size*(.965+unit(noise^5613)*.07)*shrink;
 const foot=halfFeet[theme][kind===15?15+weatherList.indexOf(wx):kind];
 const start=block*SPAN;
 let z=start+clamp(slot.z*SPAN+dz+tiny,.35,SPAN-.35);
 let routeHere=ribbon(theme,seed,z,width),turn=orientation(theme,kind,role,side,routeHere.slope,turnNoise);
 if(role==='crossing')size=Math.max(size,(routeHere.half+.085)/(kind===14?.957:.84));
 let site={rx:foot[0]*size,rz:foot[1]*size,cs:Math.cos(turn),sn:Math.sin(turn)};
 // Keep the entire footprint inside its own strip. The adjacent strip can be
 // generated later, in either order, without renegotiating the boundary.
 const tip=projectedExtent(site,0,1)+.085;
 z=clamp(z,start+tip,start+SPAN-tip);
 routeHere=ribbon(theme,seed,z,width);
 turn=orientation(theme,kind,role,side,routeHere.slope,turnNoise);
 site.cs=Math.cos(turn);site.sn=Math.sin(turn);
 const norm=slot.norm+depthShift;
 const cx=routeHere.x,half=routeHere.half;
 let x,surface;
 if(role==='flow'||role==='water-edge'){
  const n=role==='flow'?clamp(norm,.02,theme==='tide'?.72:.41):clamp(norm,.58,.98);
  x=cx+side*half*n;surface='water';
 }else if(role==='rail'||role==='crossing'){x=cx;surface=role==='rail'?'rail':'water';}
 else if(role==='quay'){x=cx+side*(half+clamp(norm,-.08,.35));surface='land';}
 else{
  const shoulder=cx+side*half;
  const reach=projectedExtent(site,1,0);
  const available=width*.5-.14-reach-side*shoulder;
  const near=Math.min(available,Math.max(.34,reach*.90+.10));
  x=shoulder+side*(near+clamp(norm,0,1)*Math.max(0,available-near));
  surface='land';
 }
 const approachZ=z+clamp(turnNoise,-.20,.20);
 const meet=ribbon(theme,seed,approachZ,width);
 const curb=wet.has(theme)||theme==='alpine'?meet.half+.04:meet.half*.78;
 const approach={x:meet.x+side*curb,z:approachZ};
 const reach=projectedExtent(site,1,0);
 const door={x:x-side*Math.min(.45,reach*.70),z:z+Math.cos(turn)*Math.min(.20,site.rz*.4)};
 site={...site,x,z,y:surface==='water'?.071:surface==='rail'?.174-.103*size:.144,
  kind,size,turn,role,side:role==='crossing'||role==='rail'?0:side,surface,approach,door,
  district:settings[theme][recipeIndex(theme,seed,block)].name};
 if(role==='side-crossing')site.crossingAlong={x:Math.sin(turn),z:Math.cos(turn)};
 if(theme==='tide'&&surface==='land'){site.pool=true;site.surface='water';site.y=.071;}
 return site;
}
// Try offsets within the same authored relationship before changing its scale.
// A wharf can slide along its bank, a train can slide along its rail, and a bridge
// always keeps its two landings aligned across the route.
const offsets=[[0,0],[.20,0],[-.20,0],[0,.10],[0,-.10],[.42,.04],[-.42,-.04],[.24,-.15],[-.24,.15],[0,.23],[0,-.23],[.66,0],[-.66,0],[.45,.21],[-.45,-.21],[-.48,.24],[.48,-.24],[.90,.10],[-.90,-.10],[.80,-.19],[-.80,.19],[1.18,0],[-1.18,0],[0,.39],[0,-.39],[1.56,0],[-1.56,0],[1.86,.18],[-1.86,-.18],[2.36,-.15],[-2.36,.15],[2.96,0],[-2.96,0]];
function resolve(params,slot,kind,wx,taken,forced=false){
 let best,bestCost=Infinity;
 const scales=forced?[1,.93,.85]:[1,.94,.88];
 const flips=(forced||params.theme==='tide'&&kind===15)&&slot.side!==0?[false,true]:[false];
 for(const shrink of scales)for(const flip of flips)for(const [dz,depth] of offsets){
  const s=rawSite(params,slot,kind,wx,dz,depth,flip,shrink);
  let squared=0;for(const other of taken){const gap=clearance(s,other);if(gap<.055)squared+=(.055-gap)**2;}
  const cost=squared*2600+Math.abs(dz)*.46+Math.abs(depth)*1.4+(1-shrink)*4.2+(flip?.81:0);
  if(cost<bestCost){best=s;bestCost=cost;}
  if(cost<.000001)return s;
 }
 if(bestCost>6){
  // A player can earn a much larger model in any slot. Search the rest of the
  // same bank and its opposite in the uncommon case that its original bay is full.
  const rows=forced?31:20,columns=forced?12:6;
  for(const shrink of (forced?[1,.91,.82,.75,.69]:[.96,.88]))for(const flip of flips){
   for(let j=1;j<rows;j++)for(let d=0;d<=columns;d++){
    const dz=(j/rows-slot.z)*SPAN,depth=d/columns-slot.norm;
    const s=rawSite(params,slot,kind,wx,dz,depth,flip,shrink);
    let penalty=0;for(const other of taken){const g=clearance(s,other);if(g<.055)penalty+=(.055-g)**2;}
    const cost=penalty*2600+Math.abs(dz)*.46+Math.abs(depth)*1.4+(1-shrink)*4.2+(flip?.81:0);
    if(cost<bestCost){best=s;bestCost=cost;}
   }
  }
 }
 return best;
}
const cache=new Map();
function districtPlan(theme,seed,block,width){
 const key=[theme,seed>>>0,block,width].join('|');
 if(cache.has(key))return cache.get(key);
 const index=recipeIndex(theme,seed,block),recipe=settings[theme][index],mirror=unit(salt(theme,seed)^Math.imul(Math.floor(block/2)+1,16681))<.5?-1:1;
 const params={theme,seed,block,width,mirror},fixed=[],taken=[],visitors=new Map(),awards=new Map();
 let guestIndex=-1;
 const ordinals=Array.from({length:NOTES},(_,i)=>i);
 if(theme==='canal'){
  // Reserve the crossing and water traffic first, leaving waterfront planting
  // and mooring furniture free to move to the clearer side of their berth.
  const importance=s=>s.role==='crossing'?0:s.role==='flow'?1:s.kind===15?2:3;
  ordinals.sort((a,b)=>importance(recipe.slots[a])-importance(recipe.slots[b]));
 }
 for(const i of ordinals){
  const slot=recipe.slots[i],kind=chooseFamily(slot,theme,seed,block,i);
  if(kind===15){
   guestIndex=i;
   if(theme==='canal'){
    const visitor=resolve({...params,ordinal:i},guestPlacement(theme,'rain',slot),15,'rain',taken);
    visitors.set('rain',visitor);taken.push(visitor);
   }
   continue;
  }
  const s=resolve({...params,ordinal:i},slot,kind,'clear',taken);
  fixed[i]=s;taken.push(s);
 }
 for(const weather of weatherList){
  if(visitors.has(weather))continue;
  const slot=guestPlacement(theme,weather,recipe.slots[guestIndex]);
  const s=resolve({...params,ordinal:guestIndex},slot,15,weather,taken);
  visitors.set(weather,s);
 }
 const value={params,slots:recipe.slots,fixed,visitors,awards,guestIndex};
 cache.set(key,value);
 if(cache.size>96)cache.delete(cache.keys().next().value);
 return value;
}
function awarded(plan,ordinal){
 if(plan.awards.has(ordinal))return plan.awards.get(ordinal);
 const normal=plan.fixed[ordinal];
 if(normal?.kind===14)return normal;
 const others=plan.fixed.filter((s,i)=>s&&i!==ordinal);
 if(ordinal!==plan.guestIndex)others.push(...plan.visitors.values());
 const p={...plan.params,ordinal};
 const slot=landmarkPlacement(p.theme,plan.slots[ordinal],ordinal);
 let s=resolve(p,slot,14,'clear',others,true);
 if(p.theme==='canal'&&slot.role==='crossing'&&others.some(other=>clearance(other,s)<.015)){
  s=resolve(p,{...slot,role:'side-crossing',side:1,norm:.39},14,'clear',others,true);
 }
 if(p.theme==='tide'&&others.some(other=>clearance(other,s)<.015)){
  // The rock arch can rise from an isolated tide pool when both sandbars
  // already carry tall reefs. The ecology beneath it remains aquatic.
  s=resolve(p,{...slot,role:'garden',norm:.40},14,'clear',others,true);
 }
 plan.awards.set(ordinal,s);return s;
}
export function siteFor(theme,seed,index,event,width,weather='clear'){
 const block=Math.floor(index/NOTES),i=index%NOTES,plan=districtPlan(theme,seed,block,width);
 const site=event?.landmark===true?awarded(plan,i):i===plan.guestIndex?plan.visitors.get(weather)||plan.visitors.get('clear'):plan.fixed[i];
 // Never expose mutable cached coordinates. Scrolling or composing can safely
 // keep the returned site as an animation's target.
 const {rx,rz,cs,sn,...result}=site;
 result.approach={...site.approach};result.door={...site.door};result.footprint={rx,rz};
 if(site.crossingAlong)result.crossingAlong={...site.crossingAlong};
 return result;
}
