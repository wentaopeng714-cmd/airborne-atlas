// Atmosphere is applied to the same physical specimen: a change of conditions
// preserves the species, pose, geography, and performance seed.
const PI=Math.PI,TAU=PI*2;
export const weatherIds=['clear','rain','wind','snow'];
export const lightIds=['dawn','day','dusk','night'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function mix(hex,tint,k){
 const rgb=s=>{s=s.replace('#','');return [0,2,4].map(i=>parseInt(s.slice(i,i+2),16));};
 const a=rgb(hex),b=rgb(tint);
 return '#'+a.map((v,i)=>Math.round(v+(b[i]-v)*k).toString(16).padStart(2,'0')).join('');
}
function el(c,x,y,rx,ry,color,a=0){if(rx<=0||ry<=0)return;c.beginPath();c.ellipse(x,y,rx,ry,a,0,TAU);c.fillStyle=color;c.fill();}
function ln(c,x,y,X,Y,color,w=1){c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.strokeStyle=color;c.lineWidth=w;c.stroke();}
function arc(c,x,y,cx,cy,X,Y,color,w=1){c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(cx,cy,X,Y);c.strokeStyle=color;c.lineWidth=w;c.stroke();}
function po(c,p,col){c.beginPath();c.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)c.lineTo(p[i],p[i+1]);c.closePath();c.fillStyle=col;c.fill();}
function grad(c,x,y,X,Y,colors){const a=c.createLinearGradient(x,y,X,Y);colors.forEach((col,i)=>a.addColorStop(i/(colors.length-1),col));return a;}
function halo(c,x,y,r,color,strength){const a=c.createRadialGradient(x,y,0,x,y,r);a.addColorStop(0,'rgba('+color+','+strength+')');a.addColorStop(.34,'rgba('+color+','+strength*.35+')');a.addColorStop(1,'rgba('+color+',0)');c.fillStyle=a;c.fillRect(x-r,y-r,2*r,2*r);}
const atmosphere={
 herbarium:['#c9d8b7','#dce4be','#7c9982','#466e5b'], harbor:['#9bbbc8','#d9dabc','#73a3a6','#447785'],
 fair:['#d9b7aa','#f8d5a4','#c19585','#826a75'], tide:['#7e9cac','#b7c5c0','#578a94','#345a75'],
 grove:['#637f69','#a9ba89','#5b8269','#395647'],alpine:['#9ebed0','#e6ded1','#829ca4','#627b80'],
 canal:['#99b1aa','#d3d3ad','#88a097','#577c76'],sky:['#9aafcb','#efdbca','#bfc6d2','#8a9aaf']
};
export function litPalette(base,theme,light,weather) {
 let colors=base.paper.slice(),table=base.table.slice(),ink=base.ink,rule=base.rule;
 const dark=light==='night';
 if(dark){const hue={herbarium:'#384749',harbor:'#344d55',fair:'#473f54',tide:'#1d344b',grove:'#293d36',alpine:'#354551',canal:'#334741',sky:'#303a57'}[theme];colors=[mix(hue,'#bbc8aa',.12),hue,mix(hue,'#18243a',.32)];ink='#e9e3be';rule='#a2b6a9';}
 if(light==='dawn')colors=colors.map((v,i)=>mix(v,i===2?'#a6b5bb':'#f2c2a9',.24));
 if(light==='dusk')colors=colors.map((v,i)=>mix(v,i===2?'#b78d9b':'#efb179',.30));
 if(weather==='rain'){colors=colors.map(col=>mix(col,dark?'#344b59':'#90aba9',.27));table=table.map(col=>mix(col,'#657c89',.34));}
 if(weather==='snow'){colors=colors.map(col=>mix(col,dark?'#748796':'#e0e9e7',dark?.24:.53));table=table.map(col=>mix(col,'#bed0cd',.44));}
 return {...base,paper:colors,table,ink,rule};
}
function breeze(n){return (Math.sin(n*91.173+4.2)*43127.13)%1;}
export function drawHorizon(c,w,h,top,theme,light,weather,seed){
 const dark=light==='night',set=atmosphere[theme];let cols=set.slice();
 if(light==='dawn')cols=cols.map((v,i)=>mix(v,i<2?'#efc0b1':'#bca8a5',i===1?.63:.28));
 if(light==='dusk')cols=cols.map((v,i)=>mix(v,i<2?'#f5ab7d':'#9b8096',i===1?.72:.48));
 if(dark)cols=['#17283f','#526777',mix(set[2],'#233343',.73),mix(set[3],'#1a2e39',.7)];
 if(weather==='rain')cols=cols.map((v,i)=>mix(v,'#718995',dark?.2:i===1?.68:.47));
 if(weather==='snow')cols=cols.map((v,i)=>mix(v,dark?'#6b7f96':'#d1dedd',i===2?.59:.31));
 c.fillStyle=grad(c,0,0,0,h*.88,[cols[0],cols[1],cols[2],cols[3]]);c.fillRect(0,0,w,h);
 const sunX=w*(light==='dawn'?.24:light==='dusk'?.74:.59),sunY=top*.35;
 if(weather!=='rain'){
  halo(c,sunX,sunY,Math.max(38,w*.12),dark?'177,208,220':'255,239,191',dark?.22:.48);
  el(c,sunX,sunY,dark?6:6.9,dark?6:6.9,dark?'#e0e6cf':'#ffebbb');
 }
 if(dark||theme==='sky'){
  for(let i=0;i<50;i++){const x=(Math.abs(breeze(i+2))*w),y=Math.abs(breeze(i+13))*top;el(c,x,y,.4+i%3*.17,.4+i%3*.17,dark?'#d4dbc4':'rgba(255,248,209,.65)');}
 }
 const yH=top*.82;
 function ridge(pass,rough){
  c.beginPath();c.moveTo(-10,h);const count=70;
  for(let i=0;i<=count;i++){
   const u=i/count,x=u*w;
   const n=Math.sin(u*(8+pass*3)+seed*.00001)+.53*Math.sin(u*(18+pass*4)+pass*2.2)+.15*Math.sin(u*37);
   const yy=yH+(.06+pass*.15)*top+n*top*rough;
   c.lineTo(x,yy);
  }
  c.lineTo(w,h);c.closePath();c.fillStyle=pass?cols[3]:cols[2];c.fill();
 }
 ridge(0,theme==='alpine'?.56:theme==='sky'?.32:.16);
 const horizonColor=mix(cols[2],cols[3],.45);
 // Distinct silhouettes give the long manuscript a place beyond its margins.
 for(let i=0;i<Math.ceil(w/9);i++){
  const x=i*11+Math.sin(i*4.6)*3,scale=.65+Math.abs(breeze(i+7))*.66;
  const y=yH+top*(.08+Math.sin(x/w*12)*.12);
  if(['herbarium','grove','alpine','canal'].includes(theme)){
   if(theme==='alpine')po(c,[x-3.5*scale,y,x,y-11*scale,x+3.7*scale,y],horizonColor);
   else{el(c,x,y-2*scale,4*scale,5.8*scale,horizonColor);ln(c,x,y,x,y+2,horizonColor,1);}
  }else if(theme==='harbor' && i%9===2){
   po(c,[x-5,y,x+5,y,x+2,y+1.5,x-2,y+1.6],horizonColor);po(c,[x,y-10,x,y-1.2,x-4,y-1.2],mix(cols[1],cols[2],.26));
  }else if(theme==='fair'&&i%8===1){
   po(c,[x-7,y,x,y-8,x+7,y],horizonColor);ln(c,x,y-8,x,y-11,horizonColor,.7);
  }else if(theme==='sky'&&i%9===3){el(c,x,y,9*scale,3.1*scale,mix(cols[1],cols[2],.35));el(c,x+2,y-2,4.3*scale,3.6*scale,mix(cols[1],cols[2],.28));}
 }
 ridge(1,theme==='alpine'?.22:.12);
 for(let j=0;j<52;j++){
  const x=Math.abs(breeze(j+20))*w,y=yH+Math.abs(breeze(j+2))*(h-yH);
  if(['harbor','tide','canal','sky'].includes(theme))arc(c,x,y,x+3,y+.6,x+6+j%8,y,'rgba(226,234,214,.18)',.6);
  else{ln(c,x,y,x+2.2,y-1.3,weather==='snow'?'rgba(240,247,240,.35)':'rgba(225,227,175,.18)',.58);}
 }
}
const botanical=new Set(['herbarium','grove']);
export function exposeSprite(el,weather,light,theme,seed,kind){
 if(weather==='clear'&&light==='day')return;
 const c=el.getContext('2d'),img=c.getImageData(0,0,el.width,el.height),a=img.data,w=el.width,h=el.height;
 const snow=weather==='snow';
 const night=light==='night',dusk=light==='dusk',dawn=light==='dawn';
 const luminous=night&&((!botanical.has(theme)&&theme!=='tide')||kind>=8||theme==='grove'&&kind===4);
 const glows=luminous?c.createImageData(w,h):null;let hasGlow=false;
 const rF=night?.56:dusk?1.04:dawn?1.02:1,gF=night?.59:dusk?.91:dawn?.96:1,bF=night?.71:dusk?.82:dawn?.94:1;
 for(let i=0,p=0;i<a.length;i+=4,p++){
  if(!a[i+3])continue;
  let r=a[i],g=a[i+1],b=a[i+2];
  const gold=(r>g*1.10&&g>b*1.35&&r>138),lum=(r*.26+g*.53+b*.21);
  if(weather==='rain'){r=r*.79+4;g=g*.83+9;b=b*.88+17;}
  else if(weather==='snow'){r=r*.90+10;g=g*.92+12;b=b*.97+15;}
  const y=Math.floor(p/w)/h,x=(p%w)/w;
  const lamplit=luminous&&gold&&lum>119&&g>100&&x>.22&&x<.79&&y>.27&&y<.80;
  if(lamplit){a[i]=Math.min(255,r*1.22+29);a[i+1]=g*1.14+15;a[i+2]=b*.95+12;
   hasGlow=true;glows.data[i]=255;glows.data[i+1]=194;glows.data[i+2]=99;glows.data[i+3]=Math.round(a[i+3]*.46);
  }
  else {a[i]=r*rF+(night?6:0);a[i+1]=g*gF+(night?12:0);a[i+2]=b*bF+(night?19:0);}
  if(dawn&&lum>130)a[i+2]+=3;
  if(snow&&a[i+3]>65 && p>=5*w){
   const depth=2+(Math.floor(p/w*.5+(p%w)*.18+seed%17)%4);
   const top=a[i-4*w*depth+3];
   if(top<36){const k=.74+(1-top/36)*.18;a[i]=a[i]*(1-k)+(night?175:236)*k;a[i+1]=a[i+1]*(1-k)+(night?194:242)*k;a[i+2]=a[i+2]*(1-k)+(night?209:236)*k;}
  }
 }
 c.putImageData(img,0,0);
 if(hasGlow){
  const mask=document.createElement('canvas');mask.width=w;mask.height=h;mask.getContext('2d').putImageData(glows,0,0);
  c.save();c.setTransform(1,0,0,1,0,0);c.filter='blur(2.5px)';c.globalCompositeOperation='screen';c.drawImage(mask,0,0);c.restore();
 }
}
function parasol(c,x,y,s,col){
 ln(c,x,y,x,y-16*s,'#80694f',1*s);c.beginPath();c.moveTo(x-8*s,y-11*s);c.quadraticCurveTo(x-4*s,y-17*s,x,y-16*s);c.quadraticCurveTo(x+5*s,y-16*s,x+8*s,y-11*s);
 for(let i=3;i>=0;i--){const xx=x+(-8+i*4)*s;c.quadraticCurveTo(xx+2*s,y-12.3*s,xx,y-11*s);}
 c.fillStyle=col;c.fill();arc(c,x,y-16*s,x-3*s,y-14*s,x-3.8*s,y-11.5*s,'rgba(250,228,185,.7)',.51);ln(c,x,y-16*s,x+3.6*s,y-11.7*s,'rgba(98,90,82,.4)',.45);
}
function lantern(c,x,y,night){
 arc(c,x-3,y+4,x-4,y-4,x,y-5,'#786a53',.8);ln(c,x,y-5,x,y-2,'#8b7851',.5);
 po(c,[x-1.8,y-2,x+1.8,y-2,x+1.35,y+1.3,x-1.35,y+1.3],night?'#ffe9a5':'#e5bc74');ln(c,x-1.8,y+1.5,x+1.8,y+1.5,'#866d55',.6);
 if(night)halo(c,x,y,5,'255,187,81',.43);
}
export function fittings(c,theme,kind,weather,light,r){
 const night=light==='night',arch=kind>=8||!['herbarium','grove','tide'].includes(theme);
 const side=r()>.5?1:-1,xx=side*(8+r()*5);
 if(weather==='snow'){
  for(let j=0;j<4;j++)el(c,(r()-.5)*20,r()*2.1,2.3+r()*3,.65+r()*.52,night?'#a6bdc7':'#e8eeea',-.12);
  if(arch&&kind%3!==2){for(let i=0;i<3;i++){const x=xx+i*1.1;po(c,[x,-9,x+.65,-9,x+.25,-6.7+i%2],'#d9ece8');}}
  if(theme==='alpine'||(theme==='fair'&&kind%2===0)){ln(c,xx-2,1,xx-4,-7,'#b36c51',1.3);ln(c,xx+.5,1,xx-1.5,-6.7,'#8d9b90',1.2);}
 }else if(weather==='rain'){
  el(c,xx*.3,1.25,8+r()*3,1.05,'rgba(100,154,159,.55)');arc(c,-4,1.4,0,2.4,4,1.2,'rgba(215,231,217,.75)',.48);
  if(theme==='tide'){for(let j=0;j<3;j++){const x=xx+j*1.7;arc(c,x,0,x-2,-5,x+1,-9-r()*3,'#75a99a',1.0);}}
  else if((theme==='herbarium'||theme==='grove')&&kind%3===1){
   c.beginPath();c.moveTo(xx-4.3,0);c.bezierCurveTo(xx-4.8,-10,xx+4.7,-12,xx+4.5,0);c.closePath();c.fillStyle='rgba(183,220,212,.42)';c.fill();c.strokeStyle='#a8b8a7';c.lineWidth=.55;c.stroke();arc(c,xx-2.8,-2,xx-3.2,-7,xx,-8,'#e8f3e6',.6);ln(c,xx-4.5,0,xx+4.6,0,'#9d8c64',.9);
  }else if(['fair','canal','sky'].includes(theme)||kind%3===0)parasol(c,xx,1.1,.67+r()*.20,({canal:'#9f654e',fair:'#be755d',sky:'#728d9e'})[theme]||'#91a081');
  else lantern(c,xx,-3,night);
 }else if(weather==='wind'){
  if(['tide','grove','herbarium'].includes(theme)){
   for(let j=0;j<3;j++){const x=xx+(j-1)*2,y=-2-j*.5;arc(c,x,y,x+1,-6-j*1.5,x+4.3+j*.72,-8-j*1.6,theme==='tide'?'#7bb3a5':'#82986b',.9);el(c,x+4+j*.8,-7.9-j*1.6,1.95,.61,theme==='grove'?'#c19e66':'#9ca863',-.24);}
  }else{
   const h=8+r()*5;ln(c,xx,0,xx-.3,-h,'#968465',.8);
   po(c,[xx-.4,-h,xx+4,-h+.2,xx+8,-h-1.2,xx+5,-h+1.4,xx+7,-h+2.2,xx+3,-h+2,xx-.4,-h+2.1],theme==='sky'?'#9ea8c6':'#bf825e');
  }
 }
 if(night){
  if(arch&&kind%2===0)lantern(c,-xx,-3.5,true);
  else{const rgb=theme==='tide'?'153,231,229':'247,205,107';for(let i=0;i<2;i++){const x=xx*.4+(r()-.5)*6,y=-4-r()*9;halo(c,x,y,2.6,rgb,.5);el(c,x,y,.58,.57,'rgba('+rgb+',.95)');}}
 }
}
export function landWash(c,w,h,theme,weather,light,g,n,r){
 if(!n)return;const x0=g.start-g.step*.26,x1=g.start+(n-.08)*g.step,y=g.raw+g.gap*.75,extent=x1-x0;
 const palette={herbarium:'#a4ad6e',harbor:'#72aca6',fair:'#d3a57e',tide:'#76b6b7',grove:'#75966e',alpine:'#a4b5af',canal:'#76a296',sky:'#acb5ca'};
 const col=palette[theme],broad=['canal','grove','alpine','sky'].includes(theme);
 const amplitude=g.gap*(broad?1.55:.94);
 c.save();c.beginPath();
 for(let j=0;j<=50;j++){const u=j/50,shape=Math.sin(u*PI)**.6,yy=y+Math.sin(u*10.3+.2)*g.gap*.56+Math.sin(u*23.3)*g.gap*.23-amplitude*shape*.54;j?c.lineTo(x0+u*extent,yy):c.moveTo(x0,yy);}
 for(let j=50;j>=0;j--){const u=j/50,shape=Math.sin(u*PI)**.63,yy=y+Math.sin(u*9.7+.1)*g.gap*.63+amplitude*shape*(1.22+.21*Math.sin(u*22));c.lineTo(x0+u*extent,yy);}c.closePath();
 c.globalAlpha=weather==='snow'?.62:light==='night'?.22:.26;c.fillStyle=weather==='snow'?mix(col,'#e8eee2',.76):col;c.fill();c.globalAlpha=.47;
 for(let j=0;j<n*3;j++){
  const u=r(),x=x0+u*extent,yy=y+Math.sin(u*10)*g.gap*.55+r()*g.gap*.97;
  if(['canal','tide','harbor','sky'].includes(theme)||weather==='rain')arc(c,x,yy,x+2,yy+.6,x+3+r()*4,yy-.3,light==='night'?'#8aa9ae':'#e7e8c9',.55);
  else if(theme==='alpine'||weather==='snow')po(c,[x,yy,x+2,yy-1.1,x+3.7,yy+.3,x+1,yy+.6],'#a2a69b');
  else {el(c,x,yy,.65+r()*.85,.34,col);if(j%3===1)ln(c,x,yy,x+.8,yy-1.95,col,.5);}
 }
 c.restore();
}
export function weatherAir(c,w,h,weather,theme,light,time,seed,reduced){
 const t=reduced?0:time,night=light==='night';c.save();
 const count=clamp(Math.ceil(w/19),17,68);
 for(let i=0;i<count;i++){
  const a=Math.abs(breeze(seed%67+i*2.7)),b=Math.abs(breeze(i*1.9+27)),z=.55+a*.7;
  if(weather==='rain'){
   const yy=((b*h+t*(89+41*z))%(h+16))-8,x=((a*w-yy*.24+w*2)%w);
   ln(c,x,yy,x-2.1*z,yy+7*z,night?'rgba(196,219,230,.30)':'rgba(115,149,165,.30)',.55*z);
  }else if(weather==='snow'){const y=(b*h+t*(7+11*z))%(h+5),x=(a*w+Math.sin(t*.75+i)*5+t*3*z)%w;el(c,x,y,.6*z+.26,.70*z+.32,night?'rgba(227,240,242,.60)':'rgba(255,255,248,.81)');}
  else if(weather==='wind'&&i%3===0){const x=(a*w+t*(17+9*z))%(w+12),y=b*h+Math.sin(t*1.2+i)*3;arc(c,x,y,x+4*z,y-2*z,x+10*z,y-.6*z,'rgba(238,236,205,.40)',.58);el(c,x+5,y+2,1.6*z,.62*z,theme==='grove'?'rgba(181,151,84,.7)':'rgba(172,154,103,.64)',Math.sin(t+i)*.6);}
  else if((theme==='grove'||theme==='sky'||night)&&i%3===1){const x=a*w+Math.sin(t*.57+i)*1.6,y=b*h+Math.cos(t*.61+i)*1.85;const k=.22+.26*(.5+.5*Math.sin(t+i));el(c,x,y,.8,.72,'rgba(248,223,148,'+k+')');}
 }c.restore();
}
