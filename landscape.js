import * as T from './vendor/three/three.module.min.js';
import {route, SPAN} from './ensemble.js';

// Continuous longitudinal profiles. Models and score occupy the same world coordinates.
const PI=Math.PI, TAU=2*PI, WATER=.071, ROAD=.126, LAND=.144, PAGE=.016;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const mix=(a,b,t)=>a+(b-a)*t;
const soft=t=>t*t*(3-2*t);
const wetWorlds=new Set(['harbor','tide','canal']);
const paints={
 herbarium:{lawn:'#a7b77d',shade:'#7f9b6b',sun:'#c8c88e',soil:'#947d58',edge:'#d9cda6',walk:'#d5bb8b',walk2:'#e1cda7',rim:'#b29166',stone:'#bdad8c',leaf:'#708e5c',bloom:['#be7a77','#9182ab','#ead9a0']},
 harbor:{lawn:'#bcb992',shade:'#92ab88',sun:'#d4c99d',soil:'#a39373',edge:'#dbd1aa',walk:'#b6ada0',walk2:'#c8bdae',rim:'#88958f',stone:'#a5aba0',leaf:'#749581',bloom:['#c7be8e','#b3a5b7','#d7d1ae'],sea:'#609c9e',deep:'#46868e',shoal:'#9bbdad',foam:'#dbe4ce'},
 fair:{lawn:'#b8bf83',shade:'#91a875',sun:'#cfc88a',soil:'#a58664',edge:'#ddc9a6',walk:'#d7a78c',walk2:'#e3bca0',rim:'#b28d70',stone:'#ccae87',leaf:'#7e9b67',bloom:['#c78285','#d7b467','#8b9db0']},
 tide:{lawn:'#9db8a6',shade:'#749e9a',sun:'#c4c5a2',soil:'#849d93',edge:'#c5cbb1',walk:'#acbba8',walk2:'#c0c6ac',rim:'#849e9c',stone:'#95a7a0',leaf:'#709f92',bloom:['#c6949f','#aa90b6','#dac18e'],sea:'#6babb6',deep:'#518a9f',shoal:'#adcbbc',foam:'#dbebd8'},
 grove:{lawn:'#839968',shade:'#607c5a',sun:'#a8b07a',soil:'#887458',edge:'#c7bd91',walk:'#aa9472',walk2:'#bba889',rim:'#837654',stone:'#9b9d80',leaf:'#648455',bloom:['#c9a66e','#c5c493','#d3aa87']},
 alpine:{lawn:'#c5cdba',shade:'#9bac9d',sun:'#e1dfc9',soil:'#97a099',edge:'#dddfc9',walk:'#9ca49c',walk2:'#b5b6a6',rim:'#87968b',stone:'#94a29c',leaf:'#7b9380',bloom:['#d9d7b5','#a2adab','#b49b9e']},
 canal:{lawn:'#acb88c',shade:'#8da187',sun:'#c7c69f',soil:'#9a9579',edge:'#d6cba5',walk:'#b9b7a5',walk2:'#c9c6b1',rim:'#969e92',stone:'#a2a899',leaf:'#839968',bloom:['#cd9ca3','#b3a877','#d8cba8'],sea:'#80a99b',deep:'#5e928e',shoal:'#aac0a6',foam:'#dce3c8'},
 sky:{lawn:'#b9b6c1',shade:'#959bad',sun:'#d9cabe',soil:'#a59ca0',edge:'#d8cfbd',walk:'#bdb2b4',walk2:'#d2c2b5',rim:'#a49d9b',stone:'#a9a4ad',leaf:'#909daf',bloom:['#c0a2b6','#d9c49c','#9bb0c1']}
};
const rgbCache=new Map();
function rgb(hex) {
 if(typeof hex!=='string')return hex;
 let c=rgbCache.get(hex);if(!c){const v=new T.Color(hex);c=[v.r,v.g,v.b];rgbCache.set(hex,c);}
 return c;
}
function tinted(a,b,t){
 a=rgb(a);b=rgb(b);return [mix(a[0],b[0],t),mix(a[1],b[1],t),mix(a[2],b[2],t)];
}
function noise01(seed){
 return ()=>{seed=(seed+0x6d2b79f5)>>>0;let t=Math.imul(seed^seed>>>15,1|seed);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};
}
function worldNoise(x,z,p) {
 return Math.sin(x*1.48+z*.91+p)*.40+Math.cos(z*2.13-x*.68+p*.63)*.24+
   Math.sin(x*3.15+z*2.74+p*.94)*.15+Math.sin(z*5.17-x*4.13+p*.76)*.08;
}
class Stock {
 constructor(){this.pos=[];this.col=[];}
 tri(a,b,c,p,q=p,r=p){
   this.pos.push(...a,...b,...c);this.col.push(...rgb(p),...rgb(q),...rgb(r));
 }
 quad(a,b,c,d,p,q=p,r=p,s=p){this.tri(a,b,d,p,q,s);this.tri(b,c,d,q,r,s);}
 mesh(material,name,group){
   if(!this.pos.length)return null;
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(this.pos,3));
   g.setAttribute('color',new T.Float32BufferAttribute(this.col,3));g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
   const mesh=new T.Mesh(g,material);mesh.name=name;mesh.receiveShadow=true;group.add(mesh);return mesh;
 }
}
function prism(stock,x,y,z,rx,rz,h,angle,col,sides=7,cap=col,topScale=.88,bevel=true){
 const edge=tinted(col,'#5c5949',.13),waist=[],top=[];
 for(let i=0;i<sides;i++){
   const a=i*TAU/sides,xx=Math.cos(a)*rx,zz=Math.sin(a)*rz,ca=Math.cos(angle),sa=Math.sin(angle);
   const dx=xx*ca+zz*sa,dz=-xx*sa+zz*ca;
   waist.push([x+dx,y,z+dz]);top.push([x+dx*topScale,y+h,z+dz*topScale]);
 }
 const center=[x,y+h+(bevel?h*.09:0),z];
 for(let i=0;i<sides;i++){
   const j=(i+1)%sides;stock.quad(waist[j],waist[i],top[i],top[j],edge,edge,col,col);
   stock.tri(top[j],top[i],center,col,cap,cap);
 }
}
function tile(stack,x,y,z,w,d,h,angle,col,cap=col){
 const ca=Math.cos(angle),sa=Math.sin(angle);
 const mk=(a,b,Y)=>[x+a*ca+b*sa,Y,z-a*sa+b*ca];
 const lower=[mk(-w/2,-d/2,y),mk(-w/2,d/2,y),mk(w/2,d/2,y),mk(w/2,-d/2,y)];
 const upper=lower.map(([X,Y,Z])=>[X,Y+h,Z]);
 const edge=tinted(col,'#695c4c',.20);
 stack.quad(...upper,cap);
 for(let i=0;i<4;i++){const j=(i+1)%4;stack.quad(lower[i],lower[j],upper[j],upper[i],edge,edge,col,col);}
}
function ribbon(stack,points,thick,col,cap=col){
 for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i];
   stack.quad(a[0],b[0],b[1],a[1],cap);
   if(thick>0){
    const below=p=>[p[0],p[1]-thick,p[2]];
    stack.quad(below(a[0]),below(b[0]),b[0],a[0],col);
    stack.quad(below(b[1]),below(a[1]),a[1],b[1],col);
   }
 }
}
function blade(stack,x,y,z,h,lean,yaw,col){
 const ca=Math.cos(yaw),sa=Math.sin(yaw),w=h*.105;
 stack.tri([x-w*ca,y,z-w*sa],[x+w*ca,y,z+w*sa],[x+Math.sin(yaw+.6)*lean,y+h,z+Math.cos(yaw+.6)*lean],col,col,tinted(col,'#e0dbb2',.28));
}
function twig(stack,a,b,r,col){
 const v=new T.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]);if(v.lengthSq()<1e-8)return;
 v.normalize();const side=new T.Vector3().crossVectors(v,Math.abs(v.y)>.85?new T.Vector3(1,0,0):new T.Vector3(0,1,0)).normalize();
 const up=new T.Vector3().crossVectors(v,side),lo=[],hi=[];
 for(let i=0;i<5;i++){const theta=TAU*i/5,off=side.clone().multiplyScalar(Math.cos(theta)*r).addScaledVector(up,Math.sin(theta)*r);lo.push([a[0]+off.x,a[1]+off.y,a[2]+off.z]);hi.push([b[0]+off.x,b[1]+off.y,b[2]+off.z]);}
 for(let i=0;i<5;i++){const j=(i+1)%5;stack.quad(lo[i],lo[j],hi[j],hi[i],col);}
}
function streamData(theme,seed,width) {
 const p=(seed>>>0)/4294967296*TAU*9.17,wet=wetWorlds.has(theme),colors=paints[theme]||paints.herbarium;
 const cache=new Map();
 const arc=z=>{const key=Math.round(z*1e5);let pair=cache.get(key);
   if(!pair){pair=route(theme,seed,z,width);cache.set(key,pair);}return pair;};
 const edge=(z,side)=>{
   const margin=clamp(width*.074,.48,.92)+.105*Math.sin(z*.92+p+side*2.61)+.066*Math.cos(z*2.72-p*.33+side)+.021*Math.sin(z*7.3+side*2+p);
   return side*(width*.5-margin);
 };
 function row(z){
   const {x,half}=arc(z),l=edge(z,-1),r=edge(z,1);
   const sections=[];
   function push(X,Y,col,mixColor,blend=0){sections.push({x:X,y:Y,c:tinted(col,mixColor||col,clamp(blend))});}
   const land=(X,Y,t)=>{
     const n=worldNoise(X,z,p), broad=Math.sin(X*.77+z*.41+p*.15);
     const cc=tinted(colors.lawn,n<0?colors.shade:colors.sun,clamp(Math.abs(n)*.76+Math.abs(broad)*.06));
     return {x:X,y:Y,c:tinted(cc,colors.sun,t)};
   };
   function bank(side){
     const end=side<0?l:r,bottom=x+side*half,room=Math.abs(end-bottom),lim=Math.max(.01,room);
     const step=d=>bottom+side*Math.min(d,lim*.91);
     const middle=t=>bottom+side*lim*t,items=[];
     const add=(X,Y,col)=>items.push({x:X,y:Y,c:rgb(col)});
     const outside=end-side*.012,base=PAGE+.004;
     if(wet){
       add(step(-.017),WATER-.002,tinted(colors.stone,colors.soil,.29));
       add(step(.075),WATER+.012,tinted(colors.stone,colors.walk2,.28));
       add(step(.16),LAND-.018,tinted(colors.lawn,colors.soil,.56));
       items.push(land(step(.26),LAND-.002,.06));
     }else{
       add(step(0),ROAD+.003,colors.rim);
       add(step(.069),ROAD+.011,tinted(colors.rim,colors.soil,.38));
       items.push(land(step(.14),LAND-.001,.11));
     }
     const start=Math.min(wet?.33:.23,lim*.91);
     for(const f of [.0,.18,.37,.56,.73,.86]){
       const off=mix(start,lim*.91,f),X=bottom+side*off;
       const outer=soft(clamp((off/lim-.64)/.29)),rough=worldNoise(X,z,p);
       const rise=(.005+.015*(rough+.5))*(.15+.85*outer);
       const y=LAND+rise-outer*.014;
       items.push(land(X,y,outer*.09));
     }
     const ledge=middle(.945),bankTop=LAND-.029+Math.sin(z*2.33+p+side)*.012;
     items.push(land(ledge,bankTop,.18));
     add(middle(.975),LAND*.48,tinted(colors.soil,colors.edge,.58));
     add(outside,base+.008,tinted(colors.edge,colors.soil,.10));
     add(end,base,colors.edge);
     return side<0?items.reverse():items;
   }
   sections.push(...bank(-1));
   if(wet){
     for(const f of [-.91,-.60,0,.60,.91])push(x+half*f,.032,colors.deep,colors.shoal,Math.abs(f)*.73);
   }else{
     for(const f of [-.88,-.64,-.33,0,.33,.64,.88]){
       const X=x+half*f,n=worldNoise(X,z,p);
       push(X,ROAD+.010*(1-f*f)+(n*.0013),colors.walk,colors.walk2,clamp(.30+n*.16+Math.abs(f)*.09));
     }
   }
   sections.push(...bank(1));return sections;
 }
 // Evaluate the same section used to generate the sheet, for paint and accessories.
 function at(X,z,profile){
   const a=profile||row(z);if(X<a[0].x || X>a.at(-1).x)return PAGE+.003;
   for(let i=1;i<a.length;i++){if(X<=a[i].x){const f=clamp((X-a[i-1].x)/Math.max(.0001,a[i].x-a[i-1].x));return mix(a[i-1].y,a[i].y,f);}}
   return PAGE+.003;
 }
 function course(z,offset=0){
   const o=arc(z),dx=(arc(z+.016).x-arc(z-.016).x)/.032,angle=Math.atan(dx);
   return {x:o.x+Math.cos(angle)*offset,z:z-Math.sin(angle)*offset,angle,half:o.half};
 }
 return {arc,edge,at,course,row,wet,colors,phase:p,theme,width};
}
const edgeShader=`
 uniform vec4 landGrowth;
 uniform float landPhase;
 uniform vec4 landAnchors[8];
 uniform vec4 landPonds[8];
 uniform float landJoins[8];
 uniform float landHasPools;
 float poolDepth(vec2 p){
  if(landHasPools<.5)return 0.;
  float outDepth=0.;
  for(int i=0;i<8;i++){
    vec4 a=landPonds[i];
    if(a.z<=0.)continue;
    vec2 rel=(p-a.xy)/a.zw;float d=length(rel);
    outDepth=max(outDepth,1.-smoothstep(.72,1.14,d));
    float start=landJoins[i],dx=a.x-start;
    if(abs(dx)>.01){
      float t=(p.x-start)/dx;
      if(t>=0.&&t<=1.){
        float drift=.15*sin(t*3.141593)*sin(a.y+.83);
        float across=abs(p.y-a.y-drift)/(.15+.09*sin(t*3.141593));
        outDepth=max(outDepth,1.-smoothstep(.65,1.31,across));
      }
    }
  }
  return outDepth;
 }
 float landLip(vec2 p){
   float z=landGrowth.x;
   if(p.y<z-1.65)return 2.;
   float dx=p.x-landGrowth.y,shore=max(abs(dx)-landGrowth.z,0.);
   float across=smoothstep(0.,1.24,shore);
   float feather=.24*sin(p.x*1.45+z*.51+landPhase)+.095*sin(p.x*3.45-z*.66+landPhase*.72)
      +.050*sin(p.x*7.22+z*.83+landPhase*.95);
   float edge=z+mix(.57+.058*sin(dx*2.8+z*.49+landPhase),.045+feather,across);
   // Sites that have landed protect their footprint, including near the paper margin.
   for(int i=0;i<8;i++){
     vec4 a=landAnchors[i];
     float k=abs(p.x-a.x)/max(.001,a.z);
     if(a.z>0.&&k<1.0&&z>a.y-.73){
       float cap=a.y+a.w*sqrt(max(0.,1.-k*k))+.052;
       edge=max(edge,min(z+1.07,cap));
     }
   }
   return edge-p.y;
 }`;
function material(kind,growth,phase,anchors,pools,joins,hasPools){
 const water=kind==='water';
 const mat=new T.MeshStandardMaterial({vertexColors:true,roughness:water?.38:.92,metalness:water?.10:.015,side:T.DoubleSide});
 // Object-space Z remains absolute even if its parent is moved by the score camera.
 mat.onBeforeCompile=shader=>{
   shader.uniforms.landGrowth=growth;shader.uniforms.landPhase=phase;shader.uniforms.landAnchors=anchors;
   shader.uniforms.landPonds=pools;shader.uniforms.landJoins=joins;shader.uniforms.landHasPools=hasPools;
   shader.vertexShader='varying vec3 landP;\n'+edgeShader+'\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nlandP=position;'+(water?'':'transformed.y=mix(transformed.y,.035,poolDepth(position.xz));')+'float lR=landLip(position.xz);transformed.y=mix(.019,transformed.y,smoothstep(-.04,.28,lR));');
   shader.fragmentShader='varying vec3 landP;\n'+edgeShader+'\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nfloat landD=landLip(landP.xz);float fray=sin(landP.x*36.+landP.z*11.)*.013+sin(landP.x*87.-landP.z*31.)*.007;if(landD<fray)discard;'+(water?'':'if(landHasPools>.5&&poolDepth(landP.xz)>.70)discard;'));
   const tint=water
     ? 'float wv=sin(landP.z*18.+sin(landP.x*4.)*1.6+landP.x*7.)*.011+sin(landP.z*39.-landP.x*14.)*.005;diffuseColor.rgb*=1.+wv;'
     : 'vec2 grainCell=floor(landP.xz*99.);float grit=fract(sin(dot(mod(grainCell,4096.),vec2(12.9898,78.233)))*43758.5453);float fine=sin(landP.z*24.+landP.x*12.)*.005;diffuseColor.rgb*=.986+grit*.027+fine;';
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+tint+'\nfloat newEdge=(1.-smoothstep(0.,.085,landD));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.76,.70,.49),newEdge*.30);');
 };
 mat.customProgramCacheKey=()=>water?'landscape-water-4':'landscape-ground-4';
 return mat;
}
function terrain(data,z0,z1,ground,water){
 let prev,waterPrev;const N=28;
 for(let j=0;j<=N;j++){
   const z=mix(z0,z1,j/N),row=data.row(z);
   if(prev){for(let i=0;i<row.length-1;i++){
     const a=prev.row[i],b=row[i],c=row[i+1],d=prev.row[i+1];
     ground.quad([a.x,a.y,prev.z],[b.x,b.y,z],[c.x,c.y,z],[d.x,d.y,prev.z],a.c,b.c,c.c,d.c);
   }}
   prev={row,z};
   if(data.wet){
     const {x,half}=data.arc(z),p=data.colors;
     const surface=[-1,-.88,-.56,-.20,.20,.56,.88,1].map(f=>{
       const proximity=Math.pow(Math.abs(f),2.4),n=worldNoise(x+half*f,z,data.phase);
       const mid=tinted(p.deep,p.sea,.43+.23*n);
       return {v:[x+half*f,WATER,z],c:tinted(mid,p.shoal,proximity*.89)};
     });
     if(waterPrev)for(let i=0;i<surface.length-1;i++)water.quad(waterPrev[i].v,surface[i].v,surface[i+1].v,waterPrev[i+1].v,waterPrev[i].c,surface[i].c,surface[i+1].c,waterPrev[i+1].c);
     waterPrev=surface;
   }
 }
}
function crossline(data,stock,z,col){
 const r=data.arc(z);
 for(const side of [-1,1]){
   const edgeX=data.edge(z,side),rr=r.x+side*(r.half+.19);
   const start=edgeX-side*.01,half=.0075,steps=20;
   for(let i=0;i<steps;i++){
     const x=mix(start,rr,i/steps),X=mix(start,rr,(i+1)/steps);
     const a=data.at(x,z)+.0055,b=data.at(X,z)+.0055;
     const fade=Math.sin(Math.PI*(i+.5)/steps);
     const cc=tinted(data.colors.lawn,col,.33+.24*fade);
     stock.quad([x,a,z-half],[x,a,z+half],[X,b,z+half],[X,b,z-half],cc);
   }
 }
}
function along(data,z0,z1,offset,half,height){
 const arr=[],n=32;
 for(let i=0;i<=n;i++){
   const z=mix(z0,z1,i/n),c=data.arc(z),dx=typeof offset==='function'?offset(c,z):offset;
   const w=typeof half==='function'?half(c,z):half,x=c.x+dx;
   arr.push([[x-w,height(x-w,z),z],[x+w,height(x+w,z),z]]);
 }return arr;
}
function track(data,z0,z1,solid){
 const p=data.colors;
 for(const side of [-1,1]){
   const r=along(data,z0,z1,side*.205,.028,()=>.174);
   ribbon(solid,r,.045,'#747d78','#a6afaa');
   const railLip=along(data,z0,z1,side*.205+.008,.006,()=>.175);
   ribbon(solid,railLip,0,'#c7ccc0');
 }
 const inc=.30;
 for(let j=Math.ceil((z0+.001)/inc);j*inc<z1-.002;j++){
   const z=j*inc,q=data.course(z);tile(solid,q.x,.131,z,.72,.128,.020,q.angle,p.soil,j%4?'#a28c70':'#938372');
   for(const side of [-1,1]){
     const bolt=data.course(z,side*.256);prism(solid,bolt.x,.152,bolt.z,.026,.024,.011,0,'#747b74',5,'#878a7f');
   }
 }
}
function courb(data,z0,z1,stack,theme){
 const p=data.colors;
 const bankWidth=theme==='canal'?.17:.11;
 if(theme==='canal'||theme==='harbor'){
   for(const side of theme==='canal'?[-1,1]:[1]){
     const off=(c,z)=>side*(c.half+.22);
     ribbon(stack,along(data,z0,z1,off,bankWidth,(x,z)=>data.at(x,z)+.006),.008,p.stone);
   }
 }
 if(theme==='fair'){
   for(const side of [-1,1]){
     const off=c=>side*(c.half-.075);
     ribbon(stack,along(data,z0,z1,off,.019,(x,z)=>data.at(x,z)+.008),0,p.walk2);
   }
 }
}
function glint(stock,x,y,z,len,width,rot,col) {
 const ca=Math.cos(rot),sa=Math.sin(rot),A=[x-len*ca,y,z+len*sa],B=[x+len*ca,y,z-len*sa];
 const upper=[x-.06*len*ca+width*sa,y,z+.06*len*sa+width*ca],lower=[x+.07*len*ca-width*sa,y,z-.07*len*sa-width*ca];
 stock.quad(A,upper,B,lower,col);
}
function routeDetails(data,z0,z1,stack,rng){
 const {theme,colors:p}=data;
 if(theme==='alpine')track(data,z0,z1,stack);
 courb(data,z0,z1,stack,theme);
 const step=theme==='fair'?.31:theme==='canal'?.42:theme==='herbarium'?.53:theme==='grove'?.41:.56;
 for(let j=Math.ceil((z0+.012)/step);j*step<z1-.02;j++){
   const z=j*step,q=data.arc(z),angle=data.course(z).angle,R=rng();
   if(theme==='fair'){
     // Interlocking peach pavers follow the slope of the fairground promenade.
     for(let k=-2;k<=2;k++){
       const xx=q.x+k*q.half*.34+((j%2)-.5)*.08;
       tile(stack,xx,data.at(xx,z)+.001,z,q.half*.30,.25,.009,angle+(rng()-.5)*.045,p.rim,tinted(p.walk,p.walk2,.30+rng()*.50));
     }
     if(j%4===0){const xx=q.x+q.half*.70;glint(stack,xx,.148,z,.13,.030,-.58,'#e6cb9e');glint(stack,xx,.149,z,.065,.027,.97,'#eed6a7');}
   }else if(theme==='herbarium'||theme==='grove'){
     const xx=q.x+Math.sin(j*1.59+data.phase)*q.half*(theme==='grove'?.38:.30),yy=data.at(xx,z);
     if(theme==='herbarium'){prism(stack,xx,yy+.002,z,.18+R*.10,.10+R*.04,.015,angle+(R-.5)*.45,p.stone,7,tinted(p.walk2,p.stone,.07),.91);}
     else if(j%4===0){prism(stack,xx,yy+.002,z,.15,.123,.020,angle,p.soil,9,'#b89e77');prism(stack,xx,yy+.024,z,.065,.054,.001,angle,'#9f8969',9,'#a98e6b');}
     else glint(stack,xx,yy+.004,z,.067,.018,R*4,'#b79e72');
   }else if(theme==='sky'){
     const xx=q.x+(R-.5)*q.half*.63;
     for(const side of [-1,1]){const X=q.x+side*(q.half-.09);prism(stack,X,data.at(X,z)+.004,z,.045,.044,.014,0,'#ae956f',6,'#c6ad80');}
     if(j%3===0){glint(stack,xx,.142,z,.16,.033,.47,'#d9c5a1');glint(stack,xx,.143,z,.11,.022,-1.06,'#dfcaa8');}
   }else if(theme==='canal'||theme==='harbor'){
     for(const side of theme==='harbor'?[1]:[-1,1]){
       const x=q.x+side*(q.half+.21);
       tile(stack,x,data.at(x,z)+.007,z,theme==='harbor'?.20:.29,step*.90,.012,angle+(R-.5)*.055,p.soil,tinted(p.stone,p.walk2,.26+rng()*.52));
     }
   }
   if(data.wet){
     for(let i=0;i<3;i++){
       const zz=z+(i-1)*.113,X=data.arc(zz),f=(rng()-.5)*1.72,xx=X.x+f*X.half;
       glint(stack,xx,WATER+.0037,zz,.075+rng()*.135,.005+rng()*.005,angle+(.08+rng()*.20),tinted(p.sea,p.foam,.35+rng()*.40));
     }
   }
 }
}
function bush(stack,x,y,z,s,color,rng){
 for(let i=0;i<4;i++){
   const a=i*2.399+(.1+rng()*.5),r=s*(.12+i*.13),h=s*(.52+rng()*.26);
   const X=x+Math.cos(a)*r,Z=z+Math.sin(a)*r;
   prism(stack,X,y,Z,s*(.48+rng()*.13),s*.41,h,a,tinted(color,'#829466',.10),7,tinted(color,'#c3c293',.23),.56);
 }
}
function tufts(stack,x,y,z,s,col,rng){
 for(let i=0;i<5;i++){
   const a=rng()*TAU,r=rng()*s*.18;
   blade(stack,x+Math.cos(a)*r,y,z+Math.sin(a)*r,s*(.62+rng()*.52),s*(.28+rng()*.36),a,col);
 }
}
function drift(stack,x,y,z,rx,rz,angle,col,rng,depth=.013){
 const rim=[],cap=[],n=10,hue=tinted(col,'#d7ceab',.18);
 for(let i=0;i<n;i++){
   const a=i*TAU/n,ir=.85+rng()*.15,u=Math.cos(a)*ir*rx,v=Math.sin(a)*ir*rz;
   const dx=u*Math.cos(angle)+v*Math.sin(angle),dz=-u*Math.sin(angle)+v*Math.cos(angle);
   rim.push([x+dx,y,z+dz]);cap.push([x+dx*.87,y+depth*.73,z+dz*.87]);
 }
 const c=[x,y+depth,z];
 for(let i=0;i<n;i++){const j=(i+1)%n;stack.quad(rim[j],rim[i],cap[i],cap[j],col,col,hue,hue);stack.tri(cap[j],cap[i],c,hue,hue,hue);}
}
function meadow(data,stock,x,z,s,rng){
 const p=data.colors,theme=data.theme,y=data.at(x,z)+.002;
 if(theme==='alpine'){
   drift(stock,x,y,z,s*.65,s*.29,rng()*TAU,'#cfd4c6',rng,.041);
   for(let j=0;j<3;j++){const xx=x+(rng()-.5)*s*.75,zz=z+(rng()-.5)*s*.56,hh=s*(.07+rng()*.10);
     prism(stock,xx,data.at(xx,zz)+.010,zz,s*(.10+rng()*.12),s*.14,hh,rng()*TAU,p.stone,6,'#d1d2c7',.52);}
   tufts(stock,x+s*.19,y+.02,z+s*.13,s*.25,p.leaf,rng);return;
 }
 if(theme==='tide'){
   for(let i=0;i<4;i++){
     const xx=x+(rng()-.5)*s*.72,zz=z+(rng()-.5)*s*.73,yy=data.at(xx,zz)+.008;
     const col=p.bloom[i%3],h=s*(.13+rng()*.15);
     prism(stock,xx,yy,zz,h*.56,h*.57,h*.67,rng()*TAU,tinted(col,p.stone,.28),7,col,.63);
     for(let j=0;j<3;j++){const a=j*2.12;blade(stock,xx,yy+h*.28,zz,h*.76,h*.30,a,col);}
   }
   return;
 }
 if(theme==='sky'){
   drift(stock,x,y,z,s*.50,s*.27,rng()*TAU,tinted(p.lawn,p.walk,.49),rng,.030);
   for(let i=0;i<3;i++){const xx=x+(rng()-.5)*s*.54,zz=z+(rng()-.5)*s*.27;
     prism(stock,xx,data.at(xx,zz)+.005,zz,s*.077,s*.075,s*(.13+rng()*.16),i+.37,'#9397a9',5,'#c9c7d2',.28);}
   return;
 }
 const reeds=theme==='harbor'||theme==='canal';
 if(reeds){for(let j=0;j<3;j++)tufts(stock,x+(rng()-.5)*s*.63,y,z+(rng()-.5)*s*.44,s*(.22+rng()*.22),p.leaf,rng);
   if(theme==='harbor')for(let j=0;j<3;j++){const xx=x+(rng()-.5)*s*.85,zz=z+(rng()-.5)*s*.45;
     prism(stock,xx,data.at(xx,zz)+.006,zz,s*.08,s*.062,s*.048,j+1,p.stone,5,'#cecdab',.57);}return;
 }
 if(theme==='grove'){
   drift(stock,x,y,z,s*.44,s*.26,rng()*TAU,'#819264',rng,.048);
   for(let j=0;j<7;j++){
     const a=j*2.39996,xx=x+Math.cos(a)*s*.35*rng(),zz=z+Math.sin(a)*s*.26*rng(),yy=data.at(xx,zz);
     if(j%3===0)prism(stock,xx,yy+.034,zz,.051*s,.049*s,.040*s,a,'#ad9064',6,'#cbb187',.41);
     else blade(stock,xx,yy+.012,zz,s*.23,s*.16,a,p.leaf);
   }
   return;
 }
 // Low flower drifts remain compact enough for the played specimens to read as the leads.
 bush(stock,x,y,z,s*.37,p.leaf,rng);
 for(let j=0;j<10;j++){
   const a=j*2.39996,r=s*.39*Math.sqrt(j/10),xx=x+Math.cos(a)*r,zz=z+Math.sin(a)*r*.72,yy=data.at(xx,zz);
   const h=s*(.105+rng()*.14);
   blade(stock,xx,yy,zz,h*.92,s*.036,a,p.leaf);
   prism(stock,xx,yy+h*.71,zz,s*.037,s*.037,s*.022,a,p.bloom[j%3],6,p.bloom[j%3],1);
 }
}
function vergeDetails(data,z0,z1,stock,rng){
 const {colors:p,theme}=data;
 // Dense tufts occur in loose islands with breathing room along the banks and margins.
 for(const side of [-1,1]){
   for(let i=0;i<5;i++){
     const z=z0+(.25+(i+rng()*.65)/5*4.68),r=data.arc(z),e=data.edge(z,side);
     const blend=i%2?.76+rng()*.13:.12+rng()*.14,begin=r.x+side*(r.half+.14);
     const x=mix(begin,e-side*.14,blend);
     meadow(data,stock,x,z,(i%2?.76:.54)+rng()*.22,rng);
   }
   for(let i=0;i<8;i++){
     const z=mix(z0+.06,z1-.06,rng()),r=data.arc(z),e=data.edge(z,side),x=mix(r.x+side*(r.half+.18),e-side*.10,.10+rng()*.77),y=data.at(x,z);
     if(theme==='sky'||theme==='alpine'||theme==='tide')prism(stock,x,y+.003,z,.055+rng()*.076,.046+rng()*.037,.023+rng()*.038,rng()*TAU,p.stone,6,tinted(p.stone,p.edge,.4),.59);
     else glint(stock,x,y+.008,z,.032+rng()*.076,.012+rng()*.014,rng()*TAU,tinted(p.lawn,p.shade,.53));
   }
 }
 // Quiet recurring regional details, kept close to the right-of-way.
 if(theme==='herbarium'||theme==='grove'){
   const z=z0+1.18+rng()*.42,rr=data.arc(z),side=rng()<.5?-1:1,x=rr.x+side*(rr.half+.32);
   const dir=data.course(z).angle+.06,h=.18,posts=[];
   for(let j=0;j<4;j++){
     const xx=x+Math.sin(dir)*(j-1.5)*.31,zz=z+Math.cos(dir)*(j-1.5)*.31,yy=data.at(xx,zz);
     prism(stock,xx,yy,zz,.035,.036,h,0,p.soil,6,'#c5ab81',.88);
     posts.push([xx,yy+h*.71,zz]);
   }
   for(let i=1;i<posts.length;i++)twig(stock,posts[i-1],posts[i],.021,theme==='grove'?'#8a795b':'#aa9271');
 }else if(theme==='harbor'||theme==='canal'){
   const side=theme==='harbor'?1:(rng()<.5?1:-1),start=z0+.82+rng()*.64;
   for(let i=0;i<3;i++){const z=start+i*.36,r=data.arc(z),x=r.x+side*(r.half+.07),yy=data.at(x,z);
     prism(stock,x,yy,z,.046,.046,.16,0,theme==='canal'?'#858f80':'#947f63',7,p.walk2);
     if(theme==='harbor')prism(stock,x,yy+.12,z,.050,.05,.021,0,'#d4c5a1',7,'#d4c5a1',1);}
 }else if(theme==='fair'){
   const z=z0+1.12+rng()*.42,side=rng()<.5?1:-1;
   for(let i=0;i<3;i++){const zz=z+i*.35,r=data.arc(zz),x=r.x+side*(r.half+.075),y=data.at(x,zz);
     prism(stock,x,y,zz,.034,.034,.16,0,'#b9916d',7,'#cdad7a');
     prism(stock,x,y+.10,zz,.035,.035,.034,0,i%2?'#a77d87':'#ae8680',7,'#b88d7a');}
 }else if(theme==='sky'){
   const z=z0+1.37+rng()*.47,r=data.arc(z),x=r.x+r.half+.20,y=data.at(x,z);
   for(let i=0;i<5;i++){const a=PI*i/4,xx=x+Math.cos(a)*.18,zz=z+Math.sin(a)*.18;prism(stock,xx,y+.013,zz,.035,.035,.024,0,'#bda880',6,'#d2be98',.7);}
 }else if(theme==='alpine'){
   const z=z0+.99+rng()*.50,r=data.arc(z),x=r.x-r.half-.12,y=data.at(x,z);
   prism(stock,x,y,z,.037,.037,.35,0,'#a57d62',6,'#e0dec5');prism(stock,x,y+.20,z,.04,.04,.082,0,'#b9786a',6,'#c28b75',1);
 }
}
function bridgeRamp(data,stack,x,z,side,angle,size,col){
 const ca=Math.cos(angle),sa=Math.sin(angle),d=.28*size,w=.30*size;
 const pos=(u,v,h)=>[x+ca*u+sa*v,h,z-sa*u+ca*v];
 const toe=side*.93*size,foot=side*1.29*size,near=data.at(x+ca*toe,z-sa*toe);
 const far=data.at(x+ca*foot,z-sa*foot);
 const mid=side*1.11*size;
 stack.quad(pos(toe,-w,near+.033),pos(toe,w,near+.033),pos(mid,w,far+.018),pos(mid,-w,far+.018),col);
 stack.quad(pos(mid,-w,far+.018),pos(mid,w,far+.018),pos(foot,w*.72,far+.007),pos(foot,-w*.72,far+.007),col);
 for(let i=0;i<3;i++){const u=side*(.97+.082*i)*size;
   stack.quad(pos(u-d*.013,-w*.80,mix(near+.035,far+.012,i/3)),pos(u-d*.013,w*.80,mix(near+.035,far+.012,i/3)),pos(u+d*.013,w*.80,mix(near+.035,far+.012,i/3)),pos(u+d*.013,-w*.80,mix(near+.035,far+.012,i/3)),tinted(col,'#768b80',.24));}
}
function sideCreek(data,stack,water,site,rng){
 const d=site.crossingAlong||{x:Math.sin(site.turn||0),z:Math.cos(site.turn||0)},norm=Math.hypot(d.x,d.z)||1;
 const dx=d.x/norm,dz=d.z/norm,nx=dz,nz=-dx;
 const center=site.z,span=(site.size||1)*1.28,rows=[],beds=[];
 for(let j=0;j<=18;j++){
   const f=j/18,t=(f-.5)*span*2,wiggle=Math.sin(f*TAU+site.x)*.13;
   const xx=site.x+dx*t+nx*wiggle,zz=center+dz*t+nz*wiggle;
   const road=data.arc(zz);if(Math.abs(xx-road.x)<road.half+.08)continue;
   const width=(.10+.19*Math.sin(f*PI))*(site.size||1),yy=data.at(xx,zz)+.010;
   rows.push([[xx-nx*width,yy+.003,zz-nz*width],[xx+nx*width,yy+.003,zz+nz*width]]);
   beds.push([[xx-nx*(width+.080),yy,zz-nz*(width+.080)],[xx+nx*(width+.080),yy,zz+nz*(width+.080)]]);
 }
 ribbon(stack,beds,.005,data.colors.stone);ribbon(water,rows,0,data.theme==='sky'?'#aaafc1':'#80aaa8',data.theme==='sky'?'#c4c5cf':'#91b8b2');
 for(const side of [-1,1]){const u=side*.66,xx=site.x+dx*u+nx*.24,zz=center+dz*u+nz*.24;
   prism(stack,xx,data.at(xx,zz)+.006,zz,.11,.076,.077,rng()*TAU,data.colors.stone,6,'#b5bdb0',.54);}
}
function access(data,stack,water,site,rng,parcels){
 const {role,size=1}=site,p=data.colors,theme=data.theme;
 if(role==='side-crossing'){
   sideCreek(data,stack,water,site,rng);
   for(const side of [-1,1])bridgeRamp(data,stack,site.x,site.z,side,site.turn||0,size,p.walk2);
   return;
 }
 if(role==='crossing'){for(const side of [-1,1])bridgeRamp(data,stack,site.x,site.z,side,site.turn||0,size,p.walk2);return;}
 if(!['quay','frontage','courtyard','gate','visitor'].includes(role)||site.surface==='water')return;
 const routeAt=data.arc(site.approach?.z??site.z),side=site.side||(site.x>routeAt.x?1:-1);
 const enter=site.approach||{x:routeAt.x+side*(routeAt.half+.04),z:site.z};
 // A shipyard connector meets its quay instead of cutting a pavement through the water.
 const entranceX=data.wet?routeAt.x+side*(routeAt.half+.21):enter.x;
 const door=site.door||site,dx=door.x-entranceX,dz=door.z-enter.z,len=Math.hypot(dx,dz);if(len<.18)return;
 const nx=-dz/len,nz=dx/len,end=1;
 const wid=role==='courtyard'?.20:role==='quay'?.17:role==='visitor'?.095:.14;
 const surface=(x,z)=>data.at(x,z)+.012+(parcels.some(q=>contains(q.polygon,x,z))?.027:0);
 const light=tinted(p.walk2,p.lawn,theme==='grove'?.38:.23),curvature=(rng()-.5)*Math.min(len*.25,.31),rows=[];
 for(let i=0;i<=12;i++){
   const t=end*i/12,sway=Math.sin(t*PI)*curvature;
   const x=entranceX+dx*t+nx*sway,z=enter.z+dz*t+nz*sway,w=wid*(1-.23*(i/12))*Math.min(1,.6+len*.5);
   const l=[x-nx*w,0,z-nz*w],r=[x+nx*w,0,z+nz*w];l[1]=surface(l[0],l[2]);r[1]=surface(r[0],r[2]);
   rows.push([l,r]);
 }
 ribbon(stack,rows,.008,p.rim,light);
 if(theme==='herbarium'&&[8,12,14].includes(site.kind)){
   const end=rows.at(-1),prev=rows.at(-3),a=Math.atan2(dx,dz),nose=.09*size;
   for(const [xx,zz] of [[end[0][0],end[0][2]],[end[1][0],end[1][2]],[prev[0][0],prev[0][2]]]){
     const X=xx+dx/len*nose,Z=zz+dz/len*nose;
     prism(stack,X,surface(X,Z),Z,.17*size,.132*size,.017,a,p.stone,7,tinted(p.walk2,p.stone,.23),.91);
   }
 }
 if(role==='quay'||role==='gate'||theme==='canal'){
   for(let j=2;j<rows.length;j+=3){const [l,r]=rows[j],[ll,rr]=rows[j+1];
     stack.quad([l[0],l[1]+.002,l[2]],[mix(l[0],ll[0],.15),mix(l[1],ll[1],.15)+.002,mix(l[2],ll[2],.15)],
       [mix(r[0],rr[0],.15),mix(r[1],rr[1],.15)+.002,mix(r[2],rr[2],.15)],[r[0],r[1]+.002,r[2]],tinted(light,p.rim,.43));}
 }
}
// A district receives actual model sites as its notes land. Shared plots follow the
// footprints of neighbouring uses and the local waterfront rather than a preset grid.
function hull(points){
 const pts=points.slice().sort((a,b)=>a.x-b.x||a.z-b.z);
 const cross=(a,b,c)=>(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);
 const half=seq=>{const list=[];for(const p of seq){while(list.length>1&&cross(list.at(-2),list.at(-1),p)<=0)list.pop();list.push(p);}return list;};
 const low=half(pts),high=half(pts.slice().reverse());low.pop();high.pop();return low.concat(high);
}
function polygonFor(data,sites,side,z0,z1,pad,layout){
 const points=[];
 const valid=(x,z)=>{
   const Z=clamp(z,z0+.075,z1-.075),r=data.arc(Z),outer=data.edge(Z,side)-side*.055;
   const inward=r.x+side*(r.half+(layout==='reef'?-.07:.12));
   return {x:clamp(x,Math.min(outer,inward),Math.max(outer,inward)),z:Z};
 };
 for(const s of sites){
   const rx=clamp(s.footprint?.rx||.43,.23,.83)*.85+pad,rz=clamp(s.footprint?.rz||.37,.19,.77)*.82+pad;
   const turn=s.turn||0,ca=Math.cos(turn),sa=Math.sin(turn);
   for(let j=0;j<8;j++){const a=(j+.5)*TAU/8,xx=Math.cos(a)*rx,zz=Math.sin(a)*rz;
    points.push(valid(s.x+ca*xx+sa*zz,s.z-sa*xx+ca*zz));}
 }
 if(['quay','station','square','terrace'].includes(layout)){
   const lo=clamp(Math.min(...sites.map(s=>s.z))-.32,z0+.1,z1-.1);
   const hi=clamp(Math.max(...sites.map(s=>s.z))+.32,z0+.1,z1-.1);
   for(let j=0;j<=4;j++){
    const z=mix(lo,hi,j/4),r=data.arc(z);
    points.push(valid(r.x+side*(r.half+.14),z));
   }
 }
 let polygon=hull(points);if(polygon.length<3)return null;
 // Round off the perimeter and keep the bend of the route at the planted edge.
 for(let pass=0;pass<2;pass++){
   const next=[];
   for(let j=0;j<polygon.length;j++){
    const a=polygon[j],b=polygon[(j+1)%polygon.length],cut=layout==='terrace'?.13:layout==='quay'?.11:.23;
    next.push(valid(mix(a.x,b.x,cut),mix(a.z,b.z,cut)),valid(mix(a.x,b.x,1-cut),mix(a.z,b.z,1-cut)));
   }polygon=next;
 }
 return polygon;
}
function contains(poly,x,z){
 let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){
   const a=poly[i],b=poly[j];if((a.z>z)!==(b.z>z)&&x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)yes=!yes;
 }return yes;
}
function clearOfSites(sites,x,z,pad){
 return sites.every(s=>{
   const dx=x-s.x,dz=z-s.z,ca=Math.cos(s.turn||0),sa=Math.sin(s.turn||0);
   const xx=dx*ca-dz*sa,zz=dx*sa+dz*ca,rx=(s.footprint?.rx||.36)+pad,rz=(s.footprint?.rz||.30)+pad;
   return (xx/rx)**2+(zz/rz)**2>1;
 });
}
function plotGround(data,stack,poly,base,border,rise,line,rng){
 const cx=poly.reduce((a,p)=>a+p.x,0)/poly.length,cz=poly.reduce((a,p)=>a+p.z,0)/poly.length;
 const mid=[cx,data.at(cx,cz)+rise,cz],outline=[],cap=tinted(base,data.colors.sun,.09),len=poly.length;
 const dark=tinted(border,data.colors.soil,.44);
 for(let j=0;j<len;j++){
   const p=poly[j],dx=cx-p.x,dz=cz-p.z,h=Math.hypot(dx,dz)||1,n=Math.min(line/h,.21);
   const ex=p.x+dx*n,ez=p.z+dz*n;
   const hi=data.at(p.x,p.z)+rise+.015;
   outline.push({foot:[p.x,data.at(p.x,p.z)+.002,p.z],lip:[p.x,hi,p.z],inner:[ex,data.at(ex,ez)+rise+.010,ez],
     bed:[ex,data.at(ex,ez)+rise,ez],middle:[mix(ex,cx,.40),data.at(mix(ex,cx,.40),mix(ez,cz,.40))+rise,mix(ez,cz,.40)]});
 }
 for(let j=0;j<len;j++){
   const a=outline[j],b=outline[(j+1)%len],t=.10+rng()*.12;
   const c=tinted(base,cap,t),edge=tinted(border,data.colors.edge,.14+rng()*.17);
   stack.quad(a.foot,b.foot,b.lip,a.lip,dark,dark,edge,edge);
   stack.quad(a.lip,b.lip,b.inner,a.inner,edge);stack.quad(a.inner,b.inner,b.bed,a.bed,dark);
   stack.quad(a.bed,b.bed,b.middle,a.middle,c,c,cap,cap);stack.tri(a.middle,b.middle,mid,cap,cap,base);
 }
 return {cx,cz};
}
function borderSamples(poly,step){
 const chain=[],samples=[];
 let length=0;for(let j=0;j<poly.length;j++){
   const a=poly[j],b=poly[(j+1)%poly.length],d=Math.hypot(b.x-a.x,b.z-a.z);
   if(d>.0001){chain.push({a,b,d,at:length});length+=d;}
 }
 const N=Math.max(3,Math.round(length/step));let i=0;
 for(let j=0;j<N;j++){
   const dist=(j+.5)*length/N;
   while(i<chain.length-1&&chain[i].at+chain[i].d<dist)i++;
   const {a,b,d,at}=chain[i],f=(dist-at)/d;
   samples.push({x:mix(a.x,b.x,f),z:mix(a.z,b.z,f),angle:Math.atan2(b.x-a.x,b.z-a.z)});
 }return samples;
}
function plotInterior(data,stack,poly,sites,center,style,rng){
 const p=data.colors,botanical=style==='bed'||style==='wood'||style==='reef';
 let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;
 for(const a of poly){minX=Math.min(minX,a.x);maxX=Math.max(maxX,a.x);minZ=Math.min(minZ,a.z);maxZ=Math.max(maxZ,a.z);}
 const area=(maxX-minX)*(maxZ-minZ),trials=Math.min(165,Math.ceil(area*(botanical?16:7)));
 for(let i=0;i<trials;i++){
   const x=mix(minX,maxX,rng()),z=mix(minZ,maxZ,rng());
   if(!contains(poly,x,z)||!clearOfSites(sites,x,z,botanical?.025:.07))continue;
   const y=data.at(x,z)+.033,t=rng(),rr=.051+rng()*.07;
   if(style==='bed'){
     // Several low species wind around the larger scored plants: leafy clumps,
     // seedheads, aster florets and warm soil still readable between the rows.
     for(let j=0;j<3;j++){const a=j*TAU/3+t*6;blade(stack,x,y,z,rr*(1.0+j*.14),rr*.72,a,p.leaf);}
     if(t>.28){const flower=p.bloom[Math.floor(t*11)%3];for(let j=0;j<3;j++){
        const a=j*2.3999+t*4,xx=x+Math.cos(a)*rr*.31,zz=z+Math.sin(a)*rr*.29,h=rr*(.81+j*.16);
        prism(stack,xx,y+h*.68,zz,rr*.29,rr*.25,rr*.14,a,flower,5,flower,.93);}}
   }else if(style==='wood'){
     if(t>.67)bush(stack,x,y,z,rr*1.38,tinted(p.leaf,'#86a46c',.41),rng);
     else{glint(stack,x,y+.009,z,rr*.75,rr*.26,t*TAU,tinted(p.soil,'#baa977',.48));
      if(t<.32){twig(stack,[x-.07,y+.012,z-.025],[x+.083,y+.025,z+.04],.012,'#79684d');}}
   }else if(style==='reef'){
     if(t>.42){for(let j=0;j<3;j++){const a=j*2.39996+t*TAU;
       prism(stack,x+Math.cos(a)*rr*.54,y,z+Math.sin(a)*rr*.51,rr*.36,rr*.3,rr*(.48+j*.26),a,p.bloom[Math.floor(t*7)%3],5,tinted(p.bloom[Math.floor(t*7)%3],p.edge,.26),.40);}}
     else glint(stack,x,y+.014,z,rr*.87,rr*.30,t*TAU,tinted(p.stone,p.edge,.49));
   }else if(style==='terrace'){
     if(i%4===0)starInlay(stack,x,y+.009,z,rr*.90,'#d7bb86');
     else prism(stack,x,y+.003,z,.021,.021,.011,0,p.stone,6,p.edge);
   }else{
     glint(stack,x,y+.007,z,rr*(style==='square'?1.06:.82),rr*.23,t*TAU,tinted(p.stone,p.edge,.35));
   }
 }
}
function starInlay(stock,x,y,z,r,col){glint(stock,x,y,z,r,r*.23,.06,col);glint(stock,x,y+.001,z,r*.59,r*.18,PI/2+.06,col);}
function railPlot(data,stack,z0,z1,side){
 const length=z1-z0,p=data.colors;
 const sample=z=>{const q=data.arc(z);return q.x+side*(q.half+.078);};
 const N=Math.max(4,Math.ceil(length/.16)),rim=[],stripe=[];
 for(let i=0;i<=N;i++){
  const z=mix(z0,z1,i/N),x=sample(z),outside=x+side*.47,lo=Math.min(x,outside),hi=Math.max(x,outside),y=.189;
  rim.push([[lo,y,z],[hi,y,z]]);const warn=x+side*.083;
  stripe.push([[warn-.018,y+.002,z],[warn+.018,y+.002,z]]);
 }
 ribbon(stack,rim,.078,'#7d827c','#b9b8a9');ribbon(stack,stripe,0,'#d2b478');
 for(let i=0;i<Math.ceil(length/.21);i++){const z=z0+(i+.5)*length/Math.ceil(length/.21),x=sample(z);
  tile(stack,x+side*.235,.190,z,.45,.010,.003,data.course(z).angle,'#989e95');}
 for(const f of [.16,.85]){
  const z=mix(z0,z1,f),x=sample(z)+side*.42;
  prism(stack,x,.187,z,.046,.046,.31,0,'#8a7160',7,'#d2bb94');prism(stack,x,.39,z,.050,.050,.061,0,'#a67461',7,'#ae7c66');
 }
}
function embankment(data,stack,z0,z1,side,wood,rng){
 const p=data.colors,length=z1-z0,N=Math.max(7,Math.ceil(length/.15)),top=[];
 const bank=z=>data.arc(z).x+side*(data.arc(z).half-.030);
 for(let i=0;i<=N;i++){
  const z=mix(z0,z1,i/N),x=bank(z),outer=x+side*(wood?.57:.46),yy=wood?.163:.157;
  top.push([[Math.min(x,outer),yy,z],[Math.max(x,outer),yy,z]]);
 }
 ribbon(stack,top,wood?.086:.095,wood?'#857254':'#8c958b',wood?'#b69871':'#b3b5a4');
 const step=wood?.14:.30,n=Math.max(3,Math.floor(length/step));
 for(let i=0;i<n;i++){const z=mix(z0,z1,(i+.50)/n),x=bank(z),angle=data.course(z).angle;
   if(wood)tile(stack,x+side*.284,.163,z,.566,length/n-.016,.011,angle,'#8c795e',tinted('#b4956e','#cfba91',rng()*.66));
   else{
    tile(stack,x+side*.215,.157,z,.418,length/n-.021,.016,angle,p.stone,tinted(p.walk2,p.stone,rng()*.64));
    tile(stack,x+side*.035,.116,z,.086,length/n-.021,.049,angle,p.soil,tinted(p.stone,p.soil,.25));
   }
 }
 const posts=[];
 for(let j=0;j<Math.max(2,Math.ceil(length/.85));j++){
   const zz=mix(z0+.08,z1-.08,j/(Math.max(2,Math.ceil(length/.85))-1)),xx=bank(zz)+side*.036;
   const col=wood?'#816d52':'#8d9788';prism(stack,xx,wood?.046:.105,zz,.047,.050,wood?.27:.17,0,col,7,wood?'#d2b995':'#c7c4ae');
   posts.push([xx,wood?.277:.23,zz]);
 }
 if(wood&&posts.length>1){for(let i=1;i<posts.length;i++){
   const a=posts[i-1],b=posts[i],mid=[(a[0]+b[0])*.5,Math.min(a[1],b[1])-.065,(a[2]+b[2])*.5];
   twig(stack,a,mid,.013,'#c6ad80');twig(stack,mid,b,.013,'#c6ad80');
 }}
}
function festoon(data,stack,poly,side,sites,rng){
 const centerX=poly.reduce((a,p)=>a+p.x,0)/poly.length;
 const candidates=borderSamples(poly,.60).filter(p=>side*(p.x-centerX)>.015&&clearOfSites(sites,p.x,p.z,.02));
 if(candidates.length<2)return;
 candidates.sort((a,b)=>a.z-b.z);
 const anchors=[candidates[0],candidates[Math.floor((candidates.length-1)*.5)],candidates.at(-1)].filter((p,i,a)=>!i||Math.hypot(p.x-a[i-1].x,p.z-a[i-1].z)>.58);
 if(anchors.length<2)return;
 const posts=anchors.map(p=>{const y=data.at(p.x,p.z)+.045,h=.54+rng()*.075;
   prism(stack,p.x,y,p.z,.035,.035,h,0,'#9b7a5b',7,'#c5a47c');prism(stack,p.x,y+h,p.z,.045,.044,.045,0,'#c6a46a',7,'#e1c395',.63);
   return [p.x,y+h-.015,p.z];});
 for(let i=1;i<posts.length;i++){
  const a=posts[i-1],b=posts[i],n=Math.max(5,Math.ceil(Math.hypot(b[0]-a[0],b[2]-a[2])/.22));let prev=a;
  for(let j=1;j<=n;j++){
   const t=j/n,pt=[mix(a[0],b[0],t),mix(a[1],b[1],t)-Math.sin(PI*t)*.12,mix(a[2],b[2],t)];
   twig(stack,prev,pt,.009,'#796e5e');
   if(j<n){
    const cc=['#d49485','#d8bb79','#9bb7aa','#ae9cb7'][j%4];
    prism(stack,pt[0],pt[1]-.068,pt[2],.029,.028,.050,0,cc,6,tinted(cc,'#fff1bf',.40),.75);
    if(j%2===0)stack.tri([pt[0]-.061,pt[1]-.015,pt[2]],[pt[0]+.057,pt[1]-.010,pt[2]],[pt[0]-.022,pt[1]-.15,pt[2]+.037],cc);
   }prev=pt;
  }
 }
}
function districtFittings(data,stack,poly,sites,style,center,rng){
 if(!['quay','square','terrace'].includes(style))return;
 const footprint=p=>contains(poly,p.x,p.z)&&clearOfSites(sites,p.x,p.z,.36);
 const candidates=[{x:center.cx,z:center.cz}];
 for(let j=0;j<36;j++){
   const a=poly[Math.floor(rng()*poly.length)],b=poly[Math.floor(rng()*poly.length)],t=.19+rng()*.54;
   candidates.push({x:mix(a.x,b.x,t),z:mix(a.z,b.z,t)});
 }
 const place=candidates.find(footprint);if(!place)return;
 const {x,z}=place,p=data.colors,y=data.at(x,z)+.036;
 if(style==='quay'&&data.theme==='harbor'){
   // Timber and mooring line are shared by the slip and adjacent repair shed.
   for(let i=0;i<4;i++)tile(stack,x-.125+i*.082,y,z,.075,.45+(i%2)*.08,.055,.13,'#90765c','#b09270');
   for(let i=0;i<2;i++)tile(stack,x-.062+i*.095,y+.055,z,.08,.395,.048,.13,'#9c8062','#bd9e76');
   const xx=x+.255,zz=z-.048;let old=null;
   for(let i=0;i<24;i++){const a=i*.51,rr=.014+i*.0032,pt=[xx+Math.cos(a)*rr,y+.019,zz+Math.sin(a)*rr*.71];
    if(old)twig(stack,old,pt,.012,'#a38b62');old=pt;}
 }else if(style==='quay'){
   for(let i=-2;i<=2;i++)for(let j=-1;j<=1;j++){
    const xx=x+i*.183+(j%2)*.065,zz=z+j*.153;if(footprint({x:xx,z:zz}))
       tile(stack,xx,data.at(xx,zz)+.033,zz,.175,.142,.012,.033,tinted(p.stone,p.walk2,rng()*.42));}
 }else{
   const R=style==='terrace'?.48:.36,ink=style==='terrace'?'#c0a475':'#bc987a';
   for(let i=0;i<32;i++){
    const a=i*TAU/32,b=(i+1)*TAU/32,xx=x+Math.cos(a)*R,zz=z+Math.sin(a)*R,XX=x+Math.cos(b)*R,ZZ=z+Math.sin(b)*R;
    if(footprint({x:xx,z:zz}))twig(stack,[xx,data.at(xx,zz)+.038,zz],[XX,data.at(XX,ZZ)+.038,ZZ],.011,ink);
    if(i%4===0&&footprint({x:xx,z:zz}))starInlay(stack,xx,data.at(xx,zz)+.038,zz,.052,'#d2b98e');
   }starInlay(stack,x,y+.007,z,R*.77,style==='terrace'?'#ceb387':'#dcc59f');
 }
}
function districtPlots(data,stack,water,sites,z0,z1,rng){
 const theme=data.theme,p=data.colors,parcels=[];
 for(const side of [-1,1]){
   const beside=sites.filter(s=>s.side===side);
   const land=beside.filter(s=>s.surface!=='water'&&!['rail','crossing','side-crossing'].includes(s.role));
   const infra=land.filter(s=>['frontage','quay','gate','courtyard','visitor'].includes(s.role));
   let use=[],style='bed',color=p.soil,border=p.stone,rise=.025,edge=.058,pad=.20;
   if(theme==='herbarium'){
     use=land.filter(s=>s.role!=='visitor');color='#9e8c65';border='#b49f75';
   }else if(theme==='harbor'||theme==='canal'){
     use=infra;style='quay';color=theme==='harbor'?'#b8a98b':'#aeb49b';border=theme==='harbor'?'#aa9271':'#929f91';pad=.18;edge=.069;
   }else if(theme==='fair'){
     use=land;style='square';color='#d1ac8a';border='#bd9270';pad=.27;edge=.085;
   }else if(theme==='alpine'){
     use=infra.filter(s=>s.role!=='visitor'||[3,8,11,13,14].includes(s.kind));style='station';color='#b3b5a6';border='#949b8d';pad=.20;
   }else if(theme==='grove'){
     use=land;style='wood';color='#859064';border='#8d865d';edge=.041;pad=.23;
   }else if(theme==='tide'){
     use=beside.filter(s=>s.role!=='flow').map(s=>{const r=data.arc(s.z);return {...s,x:s.surface==='water'&&!s.pool?r.x+side*(r.half+.085):s.x};});
     style='reef';color='#aab7a0';border='#8faaa4';pad=.23;edge=.095;
   }else if(theme==='sky'){
     use=infra;style='terrace';color='#b4aeb5';border='#b19a80';edge=.072;pad=.24;
   }
   if(!use.length)continue;
   // A solitary botanical belongs to the landscape itself until its neighbours arrive.
   if(use.length===1&&['bed','wood','reef'].includes(style))continue;
   const poly=polygonFor(data,use,side,z0,z1,pad,style);if(!poly||poly.length<3)continue;
   const ctr=plotGround(data,stack,poly,color,border,rise,edge,rng);parcels.push({polygon:poly,rise});
   const lo=clamp(Math.min(...use.map(v=>v.z))-.49,z0+.08,z1-.08),hi=clamp(Math.max(...use.map(v=>v.z))+.49,z0+.08,z1-.08);
   if(style==='quay')embankment(data,stack,lo,hi,side,theme==='harbor',rng);
   if(style==='station'&&use.some(s=>[3,8,10,11,14].includes(s.kind)))railPlot(data,stack,lo,hi,side);
   if(style==='square')festoon(data,stack,poly,side,sites,rng);
   const borderPts=borderSamples(poly,style==='terrace'?.33:.39);
   borderPts.forEach((q,i)=>{
    if(!clearOfSites(sites,q.x,q.z,.01))return;
    const yy=data.at(q.x,q.z)+rise+.016;
    if(style==='bed'&&i%2===0){tile(stack,q.x,yy,q.z,.065,.25,.029,q.angle,'#a69069','#c1ac80');if(i%6===0)prism(stack,q.x,yy,q.z,.035,.035,.082,0,'#9b805d',6,'#c4ac7e');}
    if(style==='wood'&&i%3===0)prism(stack,q.x,yy,q.z,.095,.063,.045,q.angle,'#858b6c',6,'#a3ac7b',.56);
    if(style==='reef'&&i%2===0)prism(stack,q.x,yy,q.z,.082,.076,.064,q.angle,'#88a69e',6,'#afc1ac',.49);
    if(style==='terrace'&&i%2===0)prism(stack,q.x,yy,q.z,.033,.031,.016,0,'#b59a6f',7,'#d8c49d');
    if(style==='square'&&i%3===0)tile(stack,q.x,yy,q.z,.075,.21,.014,q.angle,'#b99c7c',i%2?'#dcc29b':'#b88475');
   });
   plotInterior(data,stack,poly,use,ctr,style,rng);districtFittings(data,stack,poly,sites,style,ctr,rng);
   if(style==='terrace'){
     const avail=borderSamples(poly,.37).filter(q=>clearOfSites(sites,q.x,q.z,.10));
     const brass=tinted('#b49d79',p.edge,.2);
     for(let i=1;i<avail.length;i++){
      const a=avail[i-1],b=avail[i];if(Math.hypot(a.x-b.x,a.z-b.z)>.59)continue;
      twig(stack,[a.x,data.at(a.x,a.z)+.056,a.z],[b.x,data.at(b.x,b.z)+.056,b.z],.014,brass);
     }
   }
 }
 return parcels;
}
export function createLandscape(theme,seed,block,width){
 const group=new T.Group();group.name='landscape-'+theme+'-'+block;
 const z0=block*SPAN,z1=(block+1)*SPAN,data=streamData(theme,seed,width);
 const growth={value:new T.Vector4(z1+2,0,1,width)},phase={value:data.phase};
 const anchors={value:Array.from({length:8},()=>new T.Vector4(0,0,-1,0))};
 const pools={value:Array.from({length:8},()=>new T.Vector4(0,0,-1,0))},joins={value:new Float32Array(8)},hasPools={value:0};
 const landMat=material('soil',growth,phase,anchors,pools,joins,hasPools),waterMat=material('water',growth,phase,anchors,pools,joins,hasPools);
 const ground=new Stock(),surface=new Stock(),details=new Stock(),r=noise01((seed>>>0)^Math.imul(block+1,2654435761));
 terrain(data,z0,z1,ground,surface);
 routeDetails(data,z0,z1,details,r);vergeDetails(data,z0,z1,details,r);
 for(let j=-2;j<=2;j++)crossline(data,details,z0+SPAN*.5+j*.12,data.colors.soil);
 ground.mesh(landMat,'relief',group);surface.mesh(waterMat,'channel',group);details.mesh(landMat,'wayside',group);
 let connection=null,creek=null,signature=null;
 group.userData.setFrontier=z=>{
   const global=Number.isFinite(z)?z:(z===-Infinity?-2:z1+3),r=route(theme,seed,global,width);
   growth.value.set(global,r.x,r.half,width);group.visible=global>0&&global+1.07>=z0;
 };
 group.userData.setSites=(sites=[])=>{
   const here=sites.filter(s=>s&&Number.isFinite(s.x)&&Number.isFinite(s.z));
   const key=here.map(s=>[s.kind,s.role,s.x.toFixed(3),s.z.toFixed(3),s.size?.toFixed(3),s.turn?.toFixed(3),s.approach?.x?.toFixed(3),s.approach?.z?.toFixed(3)].join('/')).join(';');
   if(key===signature)return;signature=key;
   anchors.value.forEach((v,i)=>{
     const s=here[i];if(!s){v.set(0,0,-1,0);return;}
     const a=s.turn||0,rx=s.footprint?.rx||.43,rz=s.footprint?.rz||.39;
     v.set(s.x,s.z,Math.abs(Math.cos(a))*rx+Math.abs(Math.sin(a))*rz+.13,Math.abs(Math.sin(a))*rx+Math.abs(Math.cos(a))*rz+.10);
   });
   for(const mesh of [connection,creek])if(mesh){group.remove(mesh);mesh.geometry.dispose();}
   const accessStock=new Stock(),waterStock=new Stock();
   hasPools.value=0;
   pools.value.forEach((v,i)=>{
     const s=here[i];if(!s?.pool){v.set(0,0,-1,0);return;}
     const rx=clamp((s.footprint?.rx||.4)+.23,.41,1.04),rz=clamp((s.footprint?.rz||.39)+.25,.40,.90);
     const r=data.arc(s.z),join=r.x+Math.sign(s.x-r.x)*r.half*.89;
     v.set(s.x,s.z,rx,rz);joins.value[i]=join;hasPools.value=1;
     const fill=tinted(data.colors.sea,data.colors.shoal,.43),core=tinted(data.colors.deep,data.colors.sea,.61);
     for(let k=0;k<36;k++){
       const a=k*TAU/36,b=(k+1)*TAU/36;
       const A=[s.x+Math.cos(a)*rx*1.25,WATER,s.z+Math.sin(a)*rz*1.25],B=[s.x+Math.cos(b)*rx*1.25,WATER,s.z+Math.sin(b)*rz*1.25];
       waterStock.tri(B,A,[s.x,WATER,s.z],fill,fill,core);
     }
     const inlet=[];for(let j=0;j<=18;j++){
       const t=j/18,zz=s.z+.15*Math.sin(t*PI)*Math.sin(s.z+.83),xx=mix(join,s.x,t),w=(.15+.09*Math.sin(t*PI))*1.42;
       inlet.push([[xx,WATER-.001,zz-w],[xx,WATER-.001,zz+w]]);
     }ribbon(waterStock,inlet,0,fill);
   });
   const parcels=districtPlots(data,accessStock,waterStock,here,z0,z1,noise01((seed>>>0)^Math.imul(block+2,319921)));
   here.forEach((site,i)=>access(data,accessStock,waterStock,site,noise01((seed>>>0)^Math.imul(block*8+i+1,1597334677)),parcels));
   connection=accessStock.mesh(landMat,'thresholds',group);creek=waterStock.mesh(waterMat,'tributary',group);
 };
 group.userData.dispose=()=>{
   group.traverse(mesh=>mesh.geometry?.dispose());landMat.dispose();waterMat.dispose();group.clear();
 };
 return group;
}
