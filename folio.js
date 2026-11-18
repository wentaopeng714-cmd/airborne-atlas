import * as T from './vendor/three/three.module.min.js';
import {SPAN} from './ensemble.js';
import {random} from './score-distribution.js';

export const folios={
  herbarium:['Hortus sonorus','HERBARIUM','#f3ebcd','#4c6251','#465d49','#b89957'],
  harbor:['Portus aurorae','PORTOLANO','#eee8ce','#496568','#355e68','#b98e57'],
  fair:['Festa vespertina','CARNEVALE','#f5e5cd','#755252','#744959','#c19b54'],
  tide:['Pelagus noctis','PELAGICA','#dce8dc','#38586a','#36566d','#af9660'],
  grove:['Silva lucens','MYCELIUM','#eae7c8','#516548','#455741','#ad8c51'],
  alpine:['Via nivium','ALPINA','#f0eddb','#51636a','#536976','#b49256'],
  canal:['Aqua serica','JIANGNAN','#eee6cc','#48675f','#44665d','#b5965c'],
  sky:['Caelum aureum','ASTROLABIUM','#eee6da','#575470','#58556b','#b59856']
};
const TAU=Math.PI*2;
export function canvasTexture(canvas){
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  texture.anisotropy=4;return texture;
}
function clef(c,x,y,scale){
  c.save();c.translate(x,y);c.scale(scale,scale);
  const curve=new Path2D('M1.6 -7.8 C-.1 -12 -2.4 -19.7 .5 -25.5 C3.1 -31.7 7 -31.9 7.8 -26.4 C8.6 -19 2.2 -12.1 -3.1 -7.3 C-9.9 -1.1 -13 9.6 -7 14.3 C-2 18.9 8.8 15.1 9.2 6.3 C9.5 -.6 3.2 -4.4 -1.1 -1.1 C-5.5 2.1 -4.6 8.4 .7 10 C-2.5 6.5 -2.6 4.1 .2 2.1 C4.5 -.3 8.2 3.8 7.3 8.6 C6.1 14.5 -.9 16.3 -5.4 12 C-11.4 6 -5.2 -.2 .7 -6.9 C5.4 -12.2 9 -19.5 6.9 -24.6 C4.6 -28.4 .8 -19.1 2.1 -13 L7 23.8 C8.6 33.1 -4.4 33.2 -4.3 26.9 C-4.2 22.6 1.6 21.8 2.3 25.1 C2.8 27.1 .5 28.5 -1.1 28.1 C2.3 32.4 7.7 28.5 5.9 22.3 Z');
  c.fill(curve);c.restore();
}
function engraving(c,x,y,scale,ink,flip=1){
  c.save();c.translate(x,y);c.scale(scale*flip,scale);c.strokeStyle=ink;c.lineWidth=1.4;
  c.beginPath();c.moveTo(0,12);c.bezierCurveTo(12,9,24,5,40,-9);c.stroke();
  for(let i=0;i<5;i++){
    const u=i*6+4,v=12-i*2.9;
    for(const side of [-1,1]){
      c.beginPath();c.moveTo(u,v);c.quadraticCurveTo(u+1,v+side*7,u+8,v+side*8-(side===1?2:0));c.quadraticCurveTo(u+7,v+side*2,u,v);c.stroke();
    }
  }c.restore();
}
function stripTexture(width,theme) {
  const palette=folios[theme],density=Math.min(126,1740/width),canvas=document.createElement('canvas');
  canvas.width=Math.ceil(width*density);canvas.height=Math.ceil(SPAN*density);
  const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,r=random(3811);
  const base=parseInt(palette[2].slice(1),16),rgb=[base>>16,base>>8&255,base&255],im=c.createImageData(w,h);
  for(let y=0,i=0;y<h;y++)for(let x=0;x<w;x++,i+=4){
    const gutter=13*Math.exp(-x/(w*.022))+5*((x/w-.45)**2);
    const grain=(r()-.5)*11+Math.sin(TAU*y/h*8+x*.005)*.85-gutter;
    for(let k=0;k<3;k++)im.data[i+k]=rgb[k]+grain;
    im.data[i+3]=255;
  }
  c.putImageData(im,0,0);
  for(let i=0;i<w*h/420;i++){
    const x=r()*w,y=r()*h;c.strokeStyle=i%2?'rgba(93,71,40,.09)':'rgba(255,255,237,.22)';
    c.beginPath();c.moveTo(x,y);c.lineTo(x+r()*6+1,y+r()*2-.8);c.stroke();
  }
  const margin=.24*density;
  c.strokeStyle=c.fillStyle=palette[3];
  const line=(x,y,X,Y)=>{c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.stroke()};
  c.globalAlpha=.35;c.lineWidth=1;
  for(const x of [margin,w-margin])line(x,0,x,h);
  for(let k=0;k<20;k++){
    const y=k*h/20,size=(k%5===0?.12:.048)*density;
    line(w-margin-size,y,w-margin,y);
  }
  c.globalAlpha=.56;c.lineWidth=Math.max(1,density*.011);
  const mid=h/2,dg=.12*h/SPAN;
  for(let k=-2;k<=2;k++)line(margin+4,mid+k*dg,w-margin-3,mid+k*dg);
  c.globalAlpha=.76;clef(c,margin+.22*density,mid,density*.0133);
  const tex=canvasTexture(canvas);tex.wrapT=T.RepeatWrapping;return tex;
}
const scrollHead=-1.08;
export {scrollHead};
export function makeFolio(width,theme) {
  const group=new T.Group(),palette=folios[theme],tex=stripTexture(width,theme);
  const bands=[],solids=new Map();
  const solid=color=>{if(!solids.has(color))solids.set(color,new T.MeshStandardMaterial({color,roughness:.84}));return solids.get(color)};
  function mesh(geo,mat,x,y,z){
    const o=new T.Mesh(geo,mat);o.position.set(x,y,z);o.receiveShadow=true;group.add(o);return o;
  }
  function band(w,h,y,color,x=0){
    const o=mesh(new T.BoxGeometry(w,h,1),solid(color),x,y,0);o.castShadow=true;bands.push(o);
  }
  band(width+.19,.088,-.31,palette[4]);
  for(const [i,color] of ['#bdab81','#e6d7b1','#c7b894','#e6dcbc'].entries())band(width+i*.006,.055,-.236+i*.058,color);
  band(.105,.27,-.15,palette[4],-width/2-.052);
  const top=new T.PlaneGeometry(width,1,44,1);top.rotateX(-Math.PI/2);
  const attr=top.attributes.position;
  for(let i=0;i<attr.count;i++)attr.setY(i,.016+.043*Math.exp(-(attr.getX(i)+width/2)/.14));
  top.computeVertexNormals();bands.push(mesh(top,new T.MeshStandardMaterial({map:tex,roughness:.96}),0,0,0));
  const label=document.createElement('canvas');label.width=1200;label.height=70;
  const c=label.getContext('2d');c.fillStyle=c.strokeStyle=palette[3];c.globalAlpha=.88;
  c.font='italic 35px Georgia,serif';c.fillText(palette[0],12,44);
  c.textAlign='right';c.font='18px Georgia,serif';c.fillText(palette[1].split('').join(' '),1183,41);
  c.globalAlpha=.51;c.lineWidth=1.4;c.beginPath();c.moveTo(12,58);c.lineTo(1185,58);c.stroke();
  engraving(c,592,29,.54,palette[3],1);
  const headerTex=canvasTexture(label),headerGeo=new T.PlaneGeometry(width-.65,.62);headerGeo.rotateX(-Math.PI/2);
  const title=mesh(headerGeo,new T.MeshBasicMaterial({map:headerTex,transparent:true,depthWrite:false}),0,.037,scrollHead+.50);
  const flag=new T.Shape();flag.moveTo(-.115,0);flag.lineTo(.115,0);flag.lineTo(.115,-.49);flag.lineTo(0,-.38);flag.lineTo(-.115,-.49);flag.closePath();
  const ribbonGeo=new T.ExtrudeGeometry(flag,{depth:.015,bevelEnabled:false});ribbonGeo.rotateX(-Math.PI/2);
  const ribbon=mesh(ribbonGeo,solid('#ad5845'),width*.32,-.22,0);
  const binding=mesh(new T.BoxGeometry(width+.18,.09,.12),solid(palette[4]),0,-.30,scrollHead);
  group.userData.frame=(center,depth,physicalEnd)=>{
    const begin=Math.max(scrollHead,center-depth*2.5-width),end=Math.min(physicalEnd,center+depth*2.5+width);
    for(const o of bands){o.position.z=(begin+end)*.5;o.scale.z=end-begin}
    tex.repeat.y=(end-begin)/SPAN;tex.offset.y=T.MathUtils.euclideanModulo(-end/SPAN,1);
    title.visible=binding.visible=begin<=scrollHead+.001;
    ribbon.visible=Math.abs(end-physicalEnd)<.001;ribbon.position.z=physicalEnd-.04;
  };
  group.userData.dispose=()=>{const mats=new Set();group.traverse(o=>{o.geometry?.dispose();if(o.material)mats.add(o.material)});for(const m of mats)m.dispose();tex.dispose();headerTex.dispose()};
  return group;
}

export function radialInk(ambient=false){
  const can=document.createElement('canvas');can.width=can.height=96;const c=can.getContext('2d');
  const g=c.createRadialGradient(48,48,0,48,48,48);
  if(ambient){g.addColorStop(0,'rgba(255,188,81,.76)');g.addColorStop(.27,'rgba(255,176,67,.48)');g.addColorStop(.64,'rgba(255,151,48,.16)');g.addColorStop(1,'rgba(255,140,45,0)')}
  else{g.addColorStop(0,'rgba(36,29,16,.55)');g.addColorStop(.35,'rgba(42,35,24,.37)');g.addColorStop(.72,'rgba(46,39,27,.14)');g.addColorStop(1,'rgba(46,39,27,0)')}
  c.fillStyle=g;c.fillRect(0,0,96,96);return canvasTexture(can);
}
