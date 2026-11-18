import {ScoreDistribution,hash,random} from './score-distribution.js';
import {SPAN, NOTES, siteFor} from './ensemble.js';
import {drawLandscape, drawSettlements} from './landscape-paper.js';
import {nativeNew} from './scenery-worlds.js';
import {weatherIds,lightIds,litPalette,drawHorizon,exposeSprite,fittings,weatherAir} from './scenery-air.js';
// A miniature is drawn in local coordinates with its foot at (0, 0).
// The same silhouette supplies its raking shadow on the manuscript.
const PI = Math.PI;
const TAU = PI * 2;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;
const pick = (a, rnd) => a[Math.floor(rnd() * a.length)];
function ellipse(c, x, y, rx, ry, fill, angle = 0) {
  if (rx <= 0 || ry <= 0) return;
  c.beginPath(); c.ellipse(x, y, rx, ry, angle, 0, TAU);
  c.fillStyle = fill; c.fill();
}
function line(c,x1,y1,x2,y2,color,width=1) {
  c.beginPath(); c.moveTo(x1,y1); c.lineTo(x2,y2);
  c.lineWidth=width; c.strokeStyle=color; c.stroke();
}
function curve(c,x1,y1,cx,cy,x2,y2,color,width=1) {
  c.beginPath(); c.moveTo(x1,y1); c.quadraticCurveTo(cx,cy,x2,y2);
  c.lineWidth=width; c.strokeStyle=color; c.stroke();
}
function poly(c,pts,color) {
  c.beginPath(); c.moveTo(pts[0],pts[1]);
  for(let i=2;i<pts.length;i+=2)c.lineTo(pts[i],pts[i+1]);
  c.closePath(); c.fillStyle=color; c.fill();
}
function inks(c,x,y,x2,y2,stops) {
  const g=c.createLinearGradient(x,y,x2,y2); stops.forEach(([at,col])=>g.addColorStop(at,col)); return g;
}
function clearCanvas(w,h) { const el=document.createElement('canvas'); el.width=w; el.height=h; return el; }
function at(c,x,y,s,angle,fn) {
  c.save(); c.translate(x,y); c.rotate(angle); c.scale(s,s); fn(); c.restore();
}

const palettes = {
  herbarium: { table:['#879283','#5e7268','#495c54'], paper:['#f7edcf','#f5eacf','#e6d8b9'], ink:'#414d3f',rule:'#817f61', accent:'#b76442', latin:'Hortus sonorus', folio:'HERBARIUM', motes:'#e4aa44' },
  harbor: { table:['#8da8a5','#638786','#446b70'], paper:['#eff0d9','#e0e8d4','#c9d9ca'], ink:'#324e50',rule:'#738983', accent:'#b56643',latin:'Portus aurorae',folio:'PORTOLANO',motes:'#f5bc72' },
  fair: { table:['#aa9089','#876e72','#675861'], paper:['#fcf0d7','#f7e4c7','#e8cdaf'],ink:'#624749',rule:'#aa8673',accent:'#a54d55',latin:'Festa vespertina',folio:'CARNEVALE',motes:'#fcab67' },
  grove: {table:['#8c9d74','#698269','#4a6558'],paper:['#e4e6bf','#d9dfb8','#c3c9a5'],ink:'#43513f',rule:'#7c8d69',accent:'#a97a45',latin:'Silva lucens',folio:'MYCELIUM',motes:'#e4ca72'},
  alpine: {table:['#a8bec3','#79949d','#5d7882'],paper:['#eef0da','#e5e8d6','#cdd5ca'],ink:'#465a5b',rule:'#7f9992',accent:'#aa7650',latin:'Via nivium',folio:'ALPINA',motes:'#d2bd93'},
  canal: {table:['#a5b3a3','#7f9789','#577f78'],paper:['#eff0d8','#e3e4cc','#c6d4bd'],ink:'#40574f',rule:'#7e9485',accent:'#a56e50',latin:'Aqua serica',folio:'JIANGNAN',motes:'#e0b98a'},
  sky: {table:['#aab6ca','#8b98b0','#6b8097'],paper:['#ece8db','#dedfdd','#c6c9d1'],ink:'#53516a',rule:'#8c8b9c',accent:'#a57850',latin:'Caelum aureum',folio:'ASTROLABIUM',motes:'#e9cd8e'},
  tide: { table:['#4b6878','#344e65','#203b50'], paper:['#304b60','#29435b','#233851'],ink:'#ecdeb5',rule:'#b6c7c7',accent:'#e7be88',latin:'Pelagus noctis',folio:'PELAGICA',motes:'#b6eddb' }
};
function leaf(c,x,y,dx,dy,w,dark,light) {
  const len=Math.hypot(dx,dy);
  if(!len)return;
  const nx=-dy/len*w,ny=dx/len*w;
  const cx=x+dx*.53,cy=y+dy*.53;
  c.beginPath();c.moveTo(x,y);
  c.quadraticCurveTo(cx+nx,cy+ny,x+dx,y+dy);
  c.quadraticCurveTo(cx-nx*.77,cy-ny*.77,x,y);
  c.fillStyle=dark;c.fill();
  c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(cx+nx,cy+ny,x+dx,y+dy);c.quadraticCurveTo(cx+nx*.12,cy+ny*.12,x,y);
  c.fillStyle=light;c.fill();
}
const greens=['#476442','#607c49','#728251','#80945a'];
function stalk(c,x,y,bx,by,rnd) {
  const bend=(x+bx)*.56+4, dark=pick(greens,rnd);
  curve(c,bx,by,bend,(y+by)*.48,x,y,dark,1.25);
  const amount=2+Math.floor(rnd()*2);
  for(let i=0;i<amount;i++){
    const t=.18+i*.19;
    const px=lerp(bx,x,t)+Math.sin(t*PI)*(bend-(x+bx)/2);
    const py=lerp(by,y,t);
    const side=(i%2?1:-1)*(x>bx?1:-1);
    leaf(c,px,py,side*(5+rnd()*8),-5-rnd()*12,2+rnd()*2.5,'#456348',pick(greens,rnd));
  }
}
function grass(c,rnd,amount=12,spread=14) {
  for(let i=0;i<amount;i++){
    const x=(rnd()-.5)*spread, y=(rnd()-.5)*3;
    const margin=(rnd()-.5)*15, h=2+rnd()*12;
    leaf(c,x,y,margin,-h,.4+rnd()*1.1,'#67805a',pick(['#779159','#90945b','#8c9b68'],rnd));
  }
}
const poppySets=[
 ['#8f2e27','#be3f2e','#e95736','#ff8d55','#ffc182'],
 ['#9b4533','#ce6345','#ed8054','#ffb078','#ffd49b'],
 ['#a04654','#cd6570','#e9918a','#f6b1a4','#ffd3b5'],
 ['#993528','#c34126','#ee5d28','#ff8a48','#ffbb70']
];
function poppyHead(c,rnd,colors) {
  const phase=rnd()*.7;
  for(let j=0;j<6;j++){
    const a=phase+j*TAU/6;
    c.save();c.rotate(a);c.scale(.87+rnd()*.16,.88+rnd()*.16);
    c.beginPath();c.moveTo(-1.5,1);
    c.bezierCurveTo(-5,-1,-11,-5,-10,-9);
    c.bezierCurveTo(-12,-13,-8,-15,-6,-14.6);
    c.quadraticCurveTo(-4,-18,0,-15.7);
    c.bezierCurveTo(3,-17.8,8,-17,8.8,-13);
    c.bezierCurveTo(14,-9,5,-2,1,1);c.closePath();
    c.fillStyle=inks(c,-7,-15,2,1,[[0,colors[j===0?1:3]],[.35,colors[2]],[1,colors[0]]]);c.fill();
    c.strokeStyle=colors[4];c.lineWidth=.5;c.globalAlpha=.75;
    for(let i=0;i<3;i++){
      const x=(i-1)*4;
      c.beginPath();c.moveTo(x*1.3,-13.2+rnd()*2);c.quadraticCurveTo(x*.35,-8,x*.15,-3.2);c.stroke();
    }
    c.restore();
  }
  ellipse(c,0,0,3.95,3.5,'#3b4032');ellipse(c,-.25,-.2,1.9,1.8,'#9c9c60');
  for(let i=0;i<13;i++){
    const a=i*TAU/13;ellipse(c,Math.cos(a)*3.3,Math.sin(a)*2.9,.52,.4,i%3?'#d8ad66':'#eee0a3');
  }
}
function poppies(c,rnd) {
  const colors=pick(poppySets,rnd),h=34+rnd()*11;
  let side=rnd()>.5?1:-1;
  stalk(c,side*13,-h*.78+2,-1,0,rnd);
  at(c,side*13,-h*.78, .45+rnd()*.15, -.15*side,()=>poppyHead(c,rnd,colors));
  const x=-side*(2+rnd()*5);
  stalk(c,x,-h,0,0,rnd);
  at(c,x,-h,.70+rnd()*.24,(rnd()-.5)*.6,()=>poppyHead(c,rnd,colors));
  const bx=side*9,by=-h*.49;
  curve(c,1,0,bx+8,by-10,bx,by,'#708154',1);
  ellipse(c,bx,by,2.4,3.9,'#687951',-.25);
}
function daisyHead(c,rnd,palette) {
  const n=10+Math.floor(rnd()*5);
  for(let j=0;j<n;j++){
    const a=j*TAU/n+.12;
    c.save();c.rotate(a);ellipse(c,0,-5.3,1.9+rnd()*.6,5+rnd()*1.4,palette[j%3],.05);
    line(c,0,-7.9,0,-3.0,palette[3],.35);c.restore();
  }
  ellipse(c,0,0,3.5,3.05,'#b77c2e');ellipse(c,-.5,-.65,2.9,2.25,'#edb74e');
  for(let j=0;j<8;j++)ellipse(c,(rnd()-.5)*3.7,(rnd()-.5)*2.9,.39,.39,'#ffdd7b');
}
function daisies(c,rnd) {
  const palette=pick([['#fff7d8','#fffdf2','#e6e3c7','#c6bda2'],['#ffc54e','#f7a941','#ffd67c','#df993a'],['#eed8f0','#e6daf0','#f4e5f2','#c5a8bc']],rnd);
  const size=3+Math.floor(rnd()*2);
  for(let i=0;i<size;i++){
    const x=(i-(size-1)/2)*8+(rnd()-.5)*5;
    const y=-12-Math.sin((i+.4)/size*PI)*14-rnd()*10;
    stalk(c,x,y,(rnd()-.5)*5,0,rnd);
    at(c,x,y,.44+rnd()*.28,(rnd()-.5)*.5,()=>daisyHead(c,rnd,palette));
  }
}
function spires(c,rnd) {
  const sets=[['#5c5483','#8170a4','#a194c4','#cebfde'],['#694e80','#9673aa','#b68abb','#d8adce'],['#445e85','#687fa4','#9eaec9','#cdd9d5']];
  const color=pick(sets,rnd), count=2+Math.floor(rnd()*2);
  for(let k=0;k<count;k++){
    const x=(k-(count-1)/2)*9, h=(k===1?43:27)+rnd()*10, tilt=(rnd()-.5)*9;
    stalk(c,x+tilt,-h,x*.21,0,rnd);
    for(let j=0;j<10;j++){
      const t=j/10,midX=lerp(x*.57,x+tilt,t)+Math.sin(j*2.1)*.55,midY=-h*.40-t*h*.59,rad=(1-t)*3.1+1.12;
      ellipse(c,midX-rad*.5,midY-.9,rad*.82,rad*.56,color[1],-.38);
      ellipse(c,midX+rad*.48,midY,rad*.94,rad*.61,color[j%3===0?2:1],.31);
      ellipse(c,midX+rad*.2,midY+rad*.33,rad*.6,rad*.48,color[0],-.2);
      ellipse(c,midX-rad*.5,midY-rad*.37,rad*.32,rad*.25,color[3]);
    }
  }
}
function bellflowers(c,rnd) {
  const cols=pick([['#665d98','#9b86c2','#c0a8dc'],['#ad6875','#d08e94','#f4bab2'],['#5e7e9f','#88a4c2','#bbced5']],rnd);
  for(let j=0;j<2;j++){
    const h=30+rnd()*18,x=(j-.5)*15;
    stalk(c,x,-h,0,0,rnd);
    for(let i=0;i<4;i++){
      const side=i%2?-1:1, y=-h+4+i*5.5;
      const bx=x+side*(4+i*.85);curve(c,x,y+1,bx,y-7,bx+side*1.4,y-1,'#6e8259',.8);
      at(c,bx+side*1.4,y-.4,.54+i*.065,-side*.25,()=>{
        c.beginPath();c.moveTo(-1,-3);c.quadraticCurveTo(-4,-2,-4,2);
        c.quadraticCurveTo(-5,5,-6,5.4);c.quadraticCurveTo(-3,7.9,-1.6,5.8);
        c.quadraticCurveTo(.6,8,2.6,5.6);c.quadraticCurveTo(4,6.4,5.3,4.4);
        c.quadraticCurveTo(3.4,3.2,3,-.3);c.quadraticCurveTo(2,-3,-1,-3);
        c.fillStyle=inks(c,-4,-1,4,4,[[0,cols[2]],[.5,cols[1]],[1,cols[0]]]);c.fill();
      });
    }
  }
}
function fern(c,rnd) {
  const cols=pick([['#3e634f','#709571'],['#396b5a','#7caa82'],['#506640','#8b9b57']],rnd);
  for(let f=0;f<6;f++){
    const side=f%2?1:-1, dx=side*(5+rnd()*20),dy=-12-rnd()*20;
    curve(c,0,0,dx*.28,dy*.8,dx,dy,cols[0],.7);
    for(let j=1;j<11;j++){
      const t=j/11, x=dx*(.56*t+.44*t*t),y=dy*(1.6*t-.6*t*t);
      const len=Math.sin(t*PI)*5.1+.4;
      leaf(c,x,y,-len*.88,(-len*.96),len*.18,cols[0],cols[1]);leaf(c,x,y,len, -len*.51,len*.19,cols[0],cols[1]);
    }
  }
}
function pond(c,rnd) {
  const w=18+rnd()*7;
  ellipse(c,1,1,w+1.5,8,'#9b9c77',-.09);
  ellipse(c,0,-.6,w,7.5,inks(c,-w,1,w,-3,[[0,'#608e87'],[.5,'#7ca7a1'],[1,'#b0c4a7']]),-.1);
  for(let k=0;k<12;k++){
    const x=(rnd()-.5)*w*1.6,y=(rnd()-.5)*7;ellipse(c,x,y,1+rnd()*4.5,.3,'#cfd7b7');
  }
  for(let j=0;j<5;j++){
    const x=(rnd()-.5)*w*1.3,y=(rnd()-.5)*5.8;
    c.beginPath();c.ellipse(x,y,2.5+rnd()*2.1,1.55,-.17,.28,TAU-.27);c.lineTo(x,y);c.closePath();c.fillStyle=pick(['#798e50','#95a461','#667e51'],rnd);c.fill();
    if(j>2)at(c,x-1,y-1,.22,.05,()=>daisyHead(c,rnd,['#eed2c5','#f6c4be','#fff1e1','#d5a597']));
  }
  for(let i=0;i<6;i++){
    const x=-w*.56+i*1.3,y=-3-rnd()*14;
    curve(c,x,0,x-1,y*.65,x-3,y,'#61754f',.65);
    if(i%2===0)ellipse(c,x-3,y,1,2.4,'#966d48',-.16);
  }
}
function iris(c,rnd) {
  const cols=pick([['#5b537c','#826fad','#ad9ace','#efe1ae'],['#6b5e87','#9d85ad','#cbb3ca','#f2d18e'],['#476f89','#638ba3','#9cbfca','#efcf85']],rnd);
  for(let i=0;i<5;i++){
    const x=(i-2)*2.3;leaf(c,x,0,x*(2+rnd()),-12-rnd()*14,1.6,'#557961','#91a78a');
  }
  const h=26+rnd()*13,x=(rnd()-.5)*7;curve(c,0,0,x-2,-h*.76,x,-h,'#607c5d',1.35);
  at(c,x,-h,.82+rnd()*.22,(rnd()-.5)*.31,()=>{
    for(let i=-1;i<=1;i++){
      c.save();c.rotate(i*.56);
      c.beginPath();c.moveTo(0,1);c.bezierCurveTo(-2,-2,-8,-8,-5,-12);
      c.bezierCurveTo(-3,-14,0,-12,2,-14);c.bezierCurveTo(8,-12,4,-4,0,1);
      c.fillStyle=inks(c,-4,-13,2,0,[[0,cols[2]],[.52,cols[1]],[1,cols[0]]]);c.fill();c.restore();
    }
    for(const side of [-1,1]){
      c.save();c.scale(side,1);
      c.beginPath();c.moveTo(0,-2);c.bezierCurveTo(3,-5,9,-5,13,-2);
      c.bezierCurveTo(16,.2,13,2.3,10.6,2.6);c.quadraticCurveTo(10,4.1,9,4.1);c.bezierCurveTo(7,5,2,2,0,-2);
      c.fillStyle=cols[1];c.fill();curve(c,1,-1,5,-2.2,8,0,cols[3],1);c.restore();
    }
    leaf(c,0,0,.7,8.6,3.3,cols[0],cols[1]);line(c,0,1,.5,4,cols[3],.8);
  });
}
function garden(c,rnd,kind) {
  if(kind===6){pond(c,rnd);return;}
  grass(c,rnd,9);
  const choices=[poppies,spires,daisies,bellflowers,iris,fern,pond,poppies];
  choices[kind](c,rnd);
  if(rnd()>.4){
    const x=(rnd()>.5?1:-1)*(9+rnd()*5);
    at(c,x,1.2,.25+rnd()*.13,0,()=>rnd()>.5?daisies(c,rnd):fern(c,rnd));
  }
  for(let i=0;i<4;i++){
    const x=(rnd()-.5)*22;ellipse(c,x,(rnd()-.5)*3,1,.4,'#9b926c',rnd());
  }
}

function island(c,rnd) {
  const w=14+rnd()*6;
  poly(c,[-w,-.5,-w*.56,-5,w*.3,-6,w,-2,w*.77,2,-w*.37,3.4], '#a5ae91');
  for(let i=0;i<9;i++)ellipse(c,(rnd()-.5)*w*1.4,(rnd()-.5)*4,1+rnd()*2,.45,'#ccd0aa',-.06);
}
function isohouse(c,x,y,w,d,h,colors) {
  const ridge=h*.43;
  const a=x-w/2,b=x+w/2;
  poly(c,[a,y-h,b,y-h,b,y,a,y],colors[0]);
  poly(c,[b,y-h,b+d,y-h-d*.46,b+d,y-d*.46,b,y],colors[1]);
  poly(c,[a,y-h,(a+b)/2,y-h-ridge,b,y-h],colors[0]);
  poly(c,[(a+b)/2-1,y-h-ridge,(a+b)/2+d,y-h-ridge-d*.46,b+d+1.5,y-h-d*.46+1,b+1.4,y-h+1.3],colors[2]);
  line(c,a-1,y-h+.5,(a+b)/2,y-h-ridge-.4,colors[2],1.6);
  for(let i=0;i<3;i++){
    const xx=b+1.6+i*d/3;
    line(c,xx,y-h-.3-i*d*.14,xx-3.7,y-h-ridge*.52-i*d*.14,colors[3],.5);
  }
  const dx=x-w*.18;
  c.fillStyle='#53686a';c.fillRect(dx,y-h*.55,w*.2,h*.55);
  c.fillStyle='#f4d697';c.fillRect(x+w*.17,y-h*.75,w*.13,h*.22);
  line(c,x+w*.235,y-h*.75,x+w*.235,y-h*.53,'#8c7957',.4);
  poly(c,[b+d*.3,y-h*.7-d*.13,b+d*.66,y-h*.7-d*.3,b+d*.66,y-h*.46-d*.3,b+d*.3,y-h*.46-d*.13],'#648080');
}
function pine(c,x,y,s,rnd) {
  at(c,x,y,s,0,()=>{
    line(c,0,0,0,-24,'#665c43',2);
    for(let i=0;i<4;i++){
      const w=8-i*1.6,top=-11-i*4.6,bot=top+9-i*.8;
      poly(c,[-w,bot,-w*.67,bot-3,-w*.8,bot-3,0,top-3,w*.58,bot-4,w*.5,bot-3,w,bot],i%2?'#597d65':'#4c705d');
      poly(c,[-w,bot,0,top-3,1,bot-.4,-w*.36,bot-.9],'#789780');
    }
  });
}
function harbor(c,rnd,kind) {
  island(c,rnd);
  const blue=['#f0e4be','#b8b492','#617e85','#93a5a2'];
  const red=['#f5e5c8','#c9b795','#ad6651','#c88b6b'];
  if(kind===0){
    const h=26+rnd()*9,w=7;
    const stripe=pick(['#bd6c52','#a56850','#668b87','#a06656'],rnd);
    poly(c,[-w,0,-w*.56,-h,w*.56,-h,w,0],inks(c,-w,0,w,0,[[0,'#fff0cf'],[.52,'#ddd3b1'],[1,'#a7a997']]));
    for(let i=0;i<2;i++){
      const y=-h*(.25+i*.47),wid=w*(1-.42*(-y/h));
      poly(c,[-wid,y,wid,y,wid-.5,y-4.6,-wid+.5,y-4.6],stripe);
    }
    c.fillStyle='#49676a';c.fillRect(-2.1,-6.6,4.2,6.6);
    poly(c,[-6,-h,6,-h,5.1,-h-2,-5.1,-h-2],'#4c6461');
    c.fillStyle='#f3bd72';c.fillRect(-3.6,-h-9,7.2,7);
    for(let k=-1;k<=1;k++)line(c,k*3.4,-h-2,k*3.4,-h-9,'#647373',.65);
    poly(c,[-6.1,-h-8.7,0,-h-14,6.1,-h-8.7],'#ab5c47');
    line(c,0,-h-13,0,-h-16,'#6e7266',.7);
    at(c,10,.3,.50,0,()=>isohouse(c,0,0,12,7,10,red));
  } else if(kind===5){
    const base=pick([blue,red],rnd);
    isohouse(c,-5,-3,17,6,9,base);
    for(let k=0;k<7;k++){
      const x=-15+4.7*k;poly(c,[x,-4.5,x+4.6,-4.5,x+4,0,x-1,0],k%2?'#a58463':'#bfa27c');
      if(k%2===0)line(c,x,-1,x,-6,'#766d53',1.3);
    }
    for(let j=0;j<2;j++){
      const x=7+j*6,y=-1+j*.6;
      poly(c,[x,y-4,x+4,y-4,x+4,y,x,y],'#bf996b');
      line(c,x,y-4,x+4,y,'#a07e56',.66);
    }
  } else if(kind===6){
    for(let i=0;i<5;i++){
      const x=(rnd()-.5)*22;ellipse(c,x,1-rnd()*2,2+rnd()*3,1.3+rnd()*1.2,pick(['#b1b3a2','#a2a99d','#c1c3aa'],rnd));
    }
    const x=(rnd()-.5)*3;
    line(c,x,0,x,-18,'#77694f',1.4);
    poly(c,[x-5,-17,x+4,-17,x+7,-14.8,x+3,-12.9,x-5,-13.1],'#8dada3');
    line(c,x-3,-14.9,x+3,-14.9,'#eee9c4',.65);
    line(c,x+7,0,x+7,-8,'#776a55',1.1);
    ellipse(c,x+7,-6.4,2.8,2.8,'#c3775c');ellipse(c,x+7,-6.4,1.25,1.25,'#d8d8bb');
    for(let i=0;i<3;i++)pine(c,-8-i*3,1-i*.55,.18+rnd()*.16,rnd);
  } else if(kind===1){
    const s=.82+rnd()*.32; at(c,0,-1,s,0,()=>{
      ellipse(c,0,2,21,5,'#8ab3ab');
      for(let i=0;i<9;i++)ellipse(c,(rnd()-.5)*35,rnd()*3,1+rnd()*3,.38,'#d2dfca');
      poly(c,[-15,-2,15,-2,10,2,-9,2],'#875e45');line(c,-16,-3,16,-3,'#edc38e',1.4);
      line(c,-1,-2,-1,-36,'#655c49',1.05);
      poly(c,[-2,-32,-3,-5,-14,-6],inks(c,-14,-6,-1,-22,[[0,'#f9e8c7'],[.7,'#fff6dc'],[1,'#dac6a0']]));
      poly(c,[1,-29,1,-5,14,-6],inks(c,0,-20,14,-5,[[0,'#c77d60'],[1,'#e0a180']]));
      poly(c,[-1,-36,6,-35,-1,-33.7],'#c76c4b');line(c,1,-28,14,-5,'#a57c5d',.55);
    });
  } else if(kind===2){
    poly(c,[-7,0,-4,-23,4,-23,7,0],'#e7d8b2');poly(c,[2,0,2,-24,5,-22,7,0],'#c3bd99');
    poly(c,[-6.5,-22,-2,-28,3,-27,6.5,-22],'#896650');
    c.fillStyle='#776953';c.fillRect(-2,-6,3.8,6);
    pine(c,-10,0,.36,rnd);
  } else if(kind===3){
    pine(c,-9,-1,.72,rnd);pine(c,6,-.8,1.12,rnd);pine(c,13,1,.58,rnd);
    for(let i=0;i<5;i++)ellipse(c,(rnd()-.5)*23,rnd()*2,1.7,.9,'#c2c4a4');
  } else {
    isohouse(c,-5,-2,12,7,9,blue);
    isohouse(c,5,.5,14,7,12,red);
    pine(c,-14,1,.46,rnd);
    for(let k=0;k<4;k++)line(c,14+k*2.2,0,14+k*2.2,2.1,'#8e7658',.85);
    line(c,13.6,.6,21,.6,'#ac9371',1.35);
  }
}
const carnival=['#c96653','#e29d61','#719b9b','#b88298','#7295ab'];
function lamp(c,x,y,s) {
  line(c,x,y,x,y-14*s,'#625952',1.15*s);ellipse(c,x,y-15*s,1.9*s,2.25*s,'#ffda8d');
  poly(c,[x-2.3*s,y-16.8*s,x,y-18.4*s,x+2.3*s,y-16.8*s],'#79614c');
}
function fair(c,rnd,kind) {
  const color=pick(carnival,rnd),cream='#fff0c4';
  ellipse(c,0,.5,17.5,4.2,'#d6bc97',-.05);
  if(kind===0) {
    const n=10,w=22;
    ellipse(c,0,-1,w,4.7,'#966c56');ellipse(c,-.4,-2.5,w,4.2,'#e0ae72');
    for(let i=0;i<5;i++){
      const x=(i-2)*8;line(c,x,-2.4,x,-19,'#b79158',1);
      at(c,x,-7+(i%2)*1.3,.44,i%2?.1:-.12,()=>{
        ellipse(c,0,-1.9,4.8,2.3,cream);
        poly(c,[1,-2,3,-6,5,-7,6,-5,6.8,-4.8,6.8,-4,4.8,-4.1,4,-1],cream);
        line(c,-2,-1,-4,2,'#bc7259',1.4);line(c,2,-1,4,1.9,'#bc7259',1.3);
      });
    }
    for(let i=0;i<n;i++){
      const x=-w+i*2*w/n,nx=x+2*w/n;
      poly(c,[0,-29,x,-16+(x*x/w/w)*-2,nx,-16+(nx*nx/w/w)*-2], i%2?cream:color);
      const a=-16+(x*x/w/w)*-2,b=-16+(nx*nx/w/w)*-2;
      c.beginPath();c.moveTo(x,a);c.lineTo(nx,b);c.quadraticCurveTo((x+nx)/2,b+4.4,x,a);c.fillStyle=i%2?'#e2c58f':color;c.fill();
    }
    ellipse(c,0,-29,1.2,1.2,'#d6a458');line(c,0,-29,0,-35,'#9b764e',.85);
    poly(c,[0,-35,7,-34,1,-31.8],color);
  } else if(kind===5){
    // A chair-swing ride, with seats hanging at different points around its crown.
    line(c,0,-1,0,-27,'#aa8564',2.8);
    for(let i=0;i<8;i++){
      const a=i*TAU/8+.23,x=Math.cos(a)*12,y=-23+Math.sin(a)*2.8;
      line(c,x,y,x*1.39,y+11,'#96927e',.7);
      line(c,x+1.9,y,x*1.39+1.7,y+11,'#96927e',.58);
      poly(c,[x*1.39-1.5,y+10.6,x*1.39+3.4,y+10.9,x*1.39+2.4,y+13,x*1.39-1,y+12.5],carnival[i%5]);
    }
    ellipse(c,0,-24,15,3.8,color);
    for(let i=0;i<8;i++){ const xx=-14+i*3.5;poly(c,[0,-31,xx,-24,xx+3.5,-24],i%2?cream:color); }
    ellipse(c,0,-31.4,1.25,1.15,'#e7b76b');lamp(c,-17,0,.7);
  } else if(kind===6){
    const roof=pick(carnival,rnd),w=15;
    poly(c,[-w,0,w,0,w,-8,-w,-8],'#cf9473');
    for(const x of [-w+1,w-1])line(c,x,-1,x,-21,'#996c50',1.55);
    for(let i=0;i<7;i++){
      const x=-16+i*4.6;
      poly(c,[x+1,-23,x+5.5,-23,x+4.6,-17,x,-17],i%2?cream:roof);
      ellipse(c,x+2.3,-17,2.3,1.5,i%2?cream:roof);
    }
    for(let k=0;k<5;k++){
      const x=-9+k*4.6;
      ellipse(c,x,-10.2,1.6,2.1,pick(carnival,rnd));ellipse(c,x,-12.8,1.1,1,'#edcf9d');
    }
    line(c,-15,-8.2,15,-8.2,'#e6c595',1.2);line(c,-12,-2,12,-2,roof,1.35);
  } else if(kind===1){
    const h=21,r=16.8;line(c,-9,0,0,-h,'#7b9fa1',1.2);line(c,10,0,0,-h,'#7b9fa1',1.2);
    lamp(c,15,1,.68);
  } else if(kind===2||kind===4){
    const n=7,w=15;poly(c,[-w,-16,w,-16,w-2,0,-w+2,0],cream);
    for(let i=0;i<n;i++){
      const x=-w+2*w*i/n,nx=x+2*w/n;poly(c,[0,-29,x,-15,nx,-15],i%2?cream:color);
      if(i%2===0)poly(c,[x,-15,nx,-15,nx*.87,0,x*.87,0],color);
    }
    poly(c,[-4,0,0,-12,4,0],'#76534c');line(c,-15,-15,15,-15,'#d0a56a',1.2);
    line(c,0,-29,0,-34,'#996a4e',.8);poly(c,[0,-34,6,-32,0,-30.5],pick(carnival,rnd));
    lamp(c,18,1,.8);
  } else {
    for(let i=0;i<7;i++){
      const x=(rnd()-.5)*22,y=-19-rnd()*17;
      curve(c,0,0,x*.34,-8,x,y+3,'#a89277',.55);
      ellipse(c,x,y,3.7,4.9,pick(carnival,rnd),x*.016);
      ellipse(c,x-1.3,y-1.5,.75,1.4,'#f7d2b6',.25);
      poly(c,[x,y+4,x-1,y+5.7,x+.9,y+5.7],'#a1736a');
    }
    at(c,0,0,.55,0,()=>isohouse(c,0,0,14,5,9,['#e4ae83','#c88b74','#8099a0','#a9b4ac']));
  }
}
function seaFan(c,rnd,col) {
  function branch(x,y,angle,len,depth){
    const a=angle+(rnd()-.5)*.42,dx=Math.sin(a)*len,dy=-Math.cos(a)*len;
    curve(c,x,y,x+dx*.2,y+dy*.65,x+dx,y+dy,col[depth%2],.45+depth*.45);
    if(depth>0){branch(x+dx,y+dy,a-.31-rnd()*.39,len*(.58+rnd()*.16),depth-1);branch(x+dx,y+dy,a+.24+rnd()*.45,len*(.58+rnd()*.19),depth-1);}
    else ellipse(c,x+dx,y+dy,.8,.85,col[2]);
  }
  for(let i=-1;i<=1;i++)branch(i*1.9,0,i*.5,8+rnd()*2.7,3);
}
function jelly(c,rnd,color) {
  for(let i=0;i<8;i++){
    const x=(i-3.5)*2.1,len=9+rnd()*13;
    c.beginPath();c.moveTo(x,0);c.bezierCurveTo(x-2,7,x+4,len*.55,x+1,len);
    c.strokeStyle=i%2?color[2]:color[1];c.lineWidth=i%3===0?1.35:.6;c.stroke();
  }
  c.beginPath();c.moveTo(-11,0);c.bezierCurveTo(-10,-14,8,-16,11,-.6);c.quadraticCurveTo(4,3,-2,1.2);c.quadraticCurveTo(-7,2.4,-11,0);
  c.fillStyle=inks(c,0,-12,0,2,[[0,color[0]],[.55,color[1]],[1,color[2]]]);c.fill();
  curve(c,-10,-.9,-8,-2.8,-5,-1.4,color[0],.7);curve(c,-4,-1.4,-1,-3,2,-1.5,color[0],.7);
  curve(c,3,-1.1,6,-3,10,-1.1,color[0],.7);curve(c,-7.9,-4,-6.1,-9,-1.7,-9.4,'#eadfce',.8);
}
function tide(c,rnd,kind) {
  const mint=['#bce3cf','#8ac8bb','#6a9eaa'],rose=['#ffcab3','#e6a0a6','#ad86a0'],lilac=['#e3cee9','#b7abce','#808aa9'];
  const water=pick([mint,rose,lilac],rnd);
  ellipse(c,0,0,16+rnd()*5,3,'#628886');
  if(kind===5){
    const x=(rnd()-.5)*4,y=-13-rnd()*6;
    c.save();c.translate(x,y);c.rotate(-.2+rnd()*.13);
    c.beginPath();c.moveTo(0,-8);c.bezierCurveTo(2,-7,4,-4,8,-4);
    c.bezierCurveTo(13,-4,17,-6,19,-6);c.bezierCurveTo(15,0,10,4,4,5);
    c.quadraticCurveTo(0,9,-4,5);c.bezierCurveTo(-12,5,-17,1,-20,-4.7);
    c.bezierCurveTo(-13,-3,-9,-3,-6,-4.6);c.quadraticCurveTo(-2,-6,0,-8);
    c.fillStyle=inks(c,-14,-4,14,5,[[0,'#9bbdbb'],[.46,'#89a7b7'],[1,'#68869d']]);c.fill();
    curve(c,0,5,2,13,-4,19,'#91aeb4',1.1);
    for(let k=0;k<17;k++){
      const sx=(rnd()-.5)*27,sy=-2+rnd()*4;ellipse(c,sx,sy,.5+rnd()*.34,.45,'#d2d7c7');
    }
    for(const side of [-1,1])ellipse(c,side*2,-5,.63,.55,'#466479');
    c.restore();
  } else if(kind===1) {
    at(c,-5,-21,.8,(rnd()-.5)*.3,()=>jelly(c,rnd,water));
    at(c,8,-10,.45,.19,()=>jelly(c,rnd,pick([mint,rose,lilac],rnd)));
  } else if(kind===7){
    for(let j=0;j<4;j++){
      const x=(j-1.5)*6.3,y=-9-Math.sin(j*1.36)*4-rnd()*4;
      const col=j%2?mint:rose,ss=.75+rnd()*.35;
      at(c,x,y,ss,-.12,()=>{
        poly(c,[-3,0,-6,-2.2,-6,2.4],col[1]);ellipse(c,0,0,3.9,1.8,col[0],-.08);
        line(c,-1,1,1,1.1,col[1],.56);ellipse(c,2.25,-.4,.37,.37,'#485c66');
      });
    }
    at(c,-6,0,.30,-.2,()=>seaFan(c,rnd,mint));
  } else if(kind===2){
    at(c,-3,0,1.08,0,()=>seaFan(c,rnd,pick([['#c68083','#d9958e','#eeb8a5'],['#997b9d','#bd8fb2','#d9b2c6']],rnd)));
    at(c,8,0,.52,.2,()=>seaFan(c,rnd,mint));
  } else if(kind===3){
    const n=13;
    for(let j=0;j<n;j++){
      const a=lerp(-1.35,1.35,j/(n-1)),r=15+Math.sin((j+.5)*PI/n)*5;
      const x=Math.sin(a)*r, y=-Math.cos(a)*r;
      poly(c,[0,0,x-2.7*Math.cos(a),y-2.7*Math.sin(a),x+2.7*Math.cos(a),y+2.7*Math.sin(a)],j%2?water[0]:water[1]);
      ellipse(c,x,y,2.8,1.45,water[j%2],a);
      line(c,0,0,x*.92,y*.92,water[2],.5);
    }
    ellipse(c,0,-.7,3.3,2.95,'#e9dbc9');ellipse(c,-.8,-1.6,1.2,.7,'#fff4de');
  } else if(kind===4){
    for(let j=0;j<5;j++){
      const x=(rnd()-.5)*26,y=(rnd()-.5)*4;
      c.beginPath();c.ellipse(x,y,5.5+rnd()*3,2.8,-.2,.35,TAU-.39);c.lineTo(x,y);c.closePath();c.fillStyle=pick(['#72a99a','#92b3a2','#568f8e'],rnd);c.fill();
    }
    for(let k=0;k<2;k++)at(c,k?7:-4,k?0:-3,k?.58:.95,0,()=>{
      for(let i=0;i<9;i++){
        const a=TAU*i/9;leaf(c,0,0,Math.cos(a)*7,Math.sin(a)*3.5-3.3,2.3,water[1],water[0]);
      }
      ellipse(c,0,-2,2.2,1.2,'#edc46f');
    });
  } else {
    for(let j=0;j<22;j++){
      const a=TAU*j/22, x=Math.cos(a)*8,y=Math.sin(a)*2;
      const ox=x*(1+rnd()*.8),oy=y-6-rnd()*10;
      curve(c,x*.4,y*.4,x,y-9,ox,oy,water[j%3],1.35);ellipse(c,ox,oy,1.1,1.45,water[(j+1)%3]);
    }
    ellipse(c,0,-1,4.2,1.6,'#d4b78e');
  }
  for(let j=0;j<3;j++){
    const x=12+(rnd()-.4)*10,y=-5-rnd()*23,r=.5+rnd()*1.1;
    c.beginPath();c.arc(x,y,r,0,TAU);c.strokeStyle='#b2d3cf';c.lineWidth=.39;c.stroke();
  }
}

// Mechanisms are painted above their cached housings so the little gondolas
// remain plumb and the mill's body stays still as its cloth sails turn.
function millSails(c,angle) {
    for(let i=0;i<4;i++)at(c,0,-21,1,i*PI/2+angle,()=>{
      line(c,0,0,0,-14.5,'#77684d',1);
      poly(c,[.2,-3.5,3.1,-4.1,3.1,-13.2,.2,-14],'#f5e4bf');
      for(let j=0;j<4;j++)line(c,0,-5.1-j*2.1,3,-5.4-j*2.1,'#b29e7f',.4);
    });
    ellipse(c,0,-21,1.3,1.3,'#9a7350');
}
function ferrisWheel(c,angle) {
  const h=21,r=16.8;
    c.strokeStyle='#a56a5b';c.lineWidth=1.45;c.beginPath();c.ellipse(0,-h,r,r*1.04,-.07,0,TAU);c.stroke();
    for(let i=0;i<10;i++){
      const a=TAU*i/10-PI/2+angle, x=Math.cos(a)*r,y=-h+Math.sin(a)*r;
      line(c,0,-h,x,y,'#c39c72',.65);line(c,x,y,x,y+1.7,'#726957',.6);
      const shade=carnival[i%5];
      poly(c,[x-2.2,y+1.8,x+2.3,y+1.8,x+1.5,y+4.5,x-1.6,y+4.5],shade);
      line(c,x-2.3,y+1.5,x+2.4,y+1.5,'#f5df9c',.6);
    }
    line(c,-10,0,0,-h,'#b17a5f',1.9);line(c,9,0,0,-h,'#b17a5f',1.9);ellipse(c,0,-h,2.5,2.5,'#cf9f54');
}
function butterfly(c,t,phase) {
  const loop=t*.76+phase;
  const x=6+Math.sin(loop)*9+Math.cos(loop*.72)*3;
  const y=-34+Math.sin(loop*1.97)*3.6;
  const wing=.38+.62*Math.abs(Math.cos(t*7.9+phase));
  c.save();c.translate(x,y);c.rotate(Math.sin(loop)*.22);
  for(const side of [-1,1]){
    c.save();c.scale(side*wing,1);
    ellipse(c,2.1,-1.75,1.65,2.8,'#c58b40',.48);
    ellipse(c,2.4,-2.2,.93,1.5,'#edb95d',.48);
    ellipse(c,2.1,.9,1.43,1.8,'#e5aa53',-.57);
    ellipse(c,2.8,-3.1,.45,.5,'#f4d9a0');c.restore();
  }
  ellipse(c,0,-.3,.47,1.95,'#655842');c.restore();
}
function animateSpecimen(c,theme,kind,code,seconds,reduced) {
  const phase=(code%1024)*TAU/1024,t=reduced?0:seconds;
  if(theme==='harbor' && kind===2){millSails(c,phase+t*.57);return;}
  if(theme==='fair' && kind===1){ferrisWheel(c,phase+t*.20);return;}
  if(theme==='herbarium' && kind===0){butterfly(c,t,phase);return;}
  if(reduced)return;
  if(theme==='grove' && [0,4,7,8,14].includes(kind)){
    for(let j=0;j<2;j++){
      const a=t*.83+phase+j*2.2,xx=Math.cos(a)*7.2,yy=-9+Math.sin(a*1.7)*3.8;
      c.globalAlpha=.25+.54*(.5+.5*Math.sin(t*1.6+phase+j));ellipse(c,xx,yy,.81,.68,'#f3d66c');
    }
    c.globalAlpha=1;
  }else if(theme==='alpine'&&[3,8,10,13,14].includes(kind)){
    const rise=(t*.19+phase/TAU)%1;
    c.globalAlpha=.36*Math.sin(PI*rise);ellipse(c,4+rise*5,-17-rise*9,1+rise*2.3,.85+rise*1.5,'#e3e3d7');c.globalAlpha=1;
  }else if(theme==='canal'&&[0,1,6,9,13,15].includes(kind)){
    const rise=(t*.21+phase/TAU)%1;c.beginPath();c.ellipse(3,1.4,3+rise*10,.7+rise*2.2,-.09,.05,PI*.86);c.globalAlpha=.56*Math.sin(PI*rise);c.strokeStyle='#a7bdab';c.lineWidth=.63;c.stroke();c.globalAlpha=1;
  }else if(theme==='sky'&&[1,4,6,9,12,14].includes(kind)){
    const a=t*.26+phase;ellipse(c,Math.cos(a)*5,-13+Math.sin(a)*1.8,.77,.76,'#f3d696');
  }
  if(theme==='herbarium' && (kind===1||kind===7)){
    for(let k=0;k<2;k++){
      const life=(t*.19+phase/TAU+k*.41)%1;
      const x=7+life*13+Math.sin(life*TAU)*2,y=-24-life*11+Math.cos(phase+k)*4;
      c.globalAlpha=.67*Math.sin(life*PI);
      ellipse(c,x,y,.63,.96,'#c89d59',life*PI);
    }
    c.globalAlpha=1;
  }else if(theme==='tide' && (kind===1||kind===4||kind===5)){
    // A pair of thin expanding ripple crescents travels across the printed pool.
    for(let k=0;k<2;k++){
      const life=(phase/TAU+t*.23+k*.48)%1;
      c.beginPath();c.ellipse(1,.65,5+life*15,1.6+life*4,-.08,.15,PI*.88);
      c.globalAlpha=.41*Math.sin(life*PI);c.strokeStyle='#c4e7da';c.lineWidth=.65;c.stroke();
    }
    if(kind===1){
      const rise=(t*.23+phase/TAU)%1,r=.65+rise*.8;
      c.beginPath();c.arc(7.5+Math.sin(rise*PI*2)*2,-12-rise*20,r,0,TAU);
      c.strokeStyle='#d2eee4';c.lineWidth=.6;c.globalAlpha=.8*Math.sin(PI*rise);c.stroke();
    }
    c.globalAlpha=1;
  }
}
function makeTexture(seed) {
  const tile=clearCanvas(230,230),c=tile.getContext('2d'),r=random(seed);
  const pixels=c.createImageData(230,230);
  for(let i=0;i<pixels.data.length;i+=4){
    const n=r(); const v=n>.5?255:29;
    pixels.data[i]=v;pixels.data[i+1]=v;pixels.data[i+2]=v;
    pixels.data[i+3]=Math.round((4+r()*22)*(n>.5?.99:.58));
  }
  c.putImageData(pixels,0,0);
  for(let j=0;j<130;j++){
    const x=r()*230,y=r()*230;
    line(c,x,y,x+r()*3+.5,y-r()*2,'rgba(107,89,51,.1)',.38);
  }
  return tile;
}
function sprite(theme,seed,kind,image,weather,light) {
  const cScale=2.45,w=96,h=93,bottom=78;
  const el=clearCanvas(Math.ceil(w*cScale),Math.ceil(h*cScale)),c=el.getContext('2d',{willReadFrequently:true});
  c.scale(cScale,cScale);c.translate(w/2,bottom);c.lineCap='round';c.lineJoin='round';
  const r=random(seed);
  const actualKind=image||kind<8?kind:kind%8;
  let height=55;
  const organic=['herbarium','grove','tide'].includes(theme);
  c.save();
  if(weather==='wind'&&organic)c.transform(1,0,-.082,1,0,0);
  if(weather==='rain'&&organic)c.scale(1.035,.92);
  if(image){
    const maxW=kind===14?60:kind===15?49:kind<10?45:39.5,maxH=kind===14?63:kind===15?54:kind<10?51:43;
    const aspect=image.naturalWidth/image.naturalHeight;
    const imageH=Math.min(maxH,maxW/aspect)*(.95+r()*.08),imageW=imageH*aspect;
    height=imageH;c.drawImage(image,-imageW/2,1.6-imageH,imageW,imageH);
  }else{
    const fn={herbarium:garden,harbor,fair,tide}[theme];
    if(fn)fn(c,r,actualKind);else nativeNew(c,theme,actualKind,r);
  }
  c.restore();
  exposeSprite(el,weather,light,theme,seed,actualKind);
  fittings(c,theme,actualKind,weather,light,random(seed^31337));
  const shadow=clearCanvas(el.width,el.height),sh=shadow.getContext('2d');sh.drawImage(el,0,0);
  sh.save();sh.scale(cScale,cScale);sh.translate(w/2,bottom);
  if(actualKind<8)animateSpecimen(sh,theme,actualKind,seed,0,true);sh.restore();
  sh.globalCompositeOperation='source-in';
  sh.fillStyle=light==='dusk'?'#514968':light==='night'?'#172b38':light==='dawn'?'#65617c':'#575241';sh.fillRect(0,0,el.width,el.height);
  return {el,shadow,w,h,bottom,kind:actualKind,height,organic:organic&&(kind<8||theme==='tide'||theme==='herbarium'&&[9,10].includes(kind)||theme==='grove'&&[10,11].includes(kind))};
}
function growFromGround(c,spr,image,progress) {
  if(progress>=1){c.drawImage(image,-spr.w/2,-spr.bottom,spr.w,spr.h);return;}
  if(progress<=0)return;
  const pixelsX=image.width/spr.w,pixelsY=image.height/spr.h;
  const H=Math.min(spr.bottom-1,spr.height+5);
  if(spr.organic){
    // Individual shoots reach the crown before the outer leaves and petals unfurl.
    const strips=13,sw=spr.w/strips;
    for(let n=0;n<strips;n++){
      const side=Math.abs((n+.5)/strips-.5)*2;
      const t=clamp((progress-.21*side+Math.sin(n*2.4)*.028)/(.79+.05*side),0,1);
      if(!t)continue;
      const risen=H*(1-(1-t)**1.35),sy=spr.bottom-risen,sh=spr.h-sy;
      const x=-spr.w/2+n*sw;
      const spread=.80+.20*clamp(progress/.86,0,1);
      c.drawImage(image,n*sw*pixelsX,sy*pixelsY,(sw+.11)*pixelsX,sh*pixelsY,x*spread,-risen,(sw+.12)*spread,sh);
    }
  }else{
    // Foundations settle first. Walls lift in courses and the crown unfolds last.
    const levels=[[-.16,.18,0,.26],[.18,.56,.14,.67],[.56,1,.47,1]];
    for(const [bottom,top,start,end] of levels){
      let t=clamp((progress-start)/(end-start),0,1);
      if(!t)continue;t=t*t*(3-2*t);
      const bottomY=bottom<0?spr.h-spr.bottom:-bottom*H;
      const bandH=(top-bottom)*H,risen=Math.min(bandH,top*H+bottomY)*t;
      const y=bottomY-risen,sy=spr.bottom+y,sh=Math.min(risen,spr.h-sy);
      if(sh<=0)continue;
      const spread=top>.9?.83+.17*t:1;
      c.drawImage(image,0,sy*pixelsY,image.width,sh*pixelsY,-spr.w/2*spread,y,spr.w*spread,sh);
    }
  }
}
function edges(c,points) {
  c.beginPath();c.moveTo(points[0].x,points[0].y);
  for(let i=1;i<points.length;i++)c.lineTo(points[i].x,points[i].y);
  c.closePath();
}
function clef(c,x,y,scale,color) {
  // Draw a single continuous G clef so iOS and Linux read the same engraving.
  c.save();c.translate(x,y);c.scale(scale,scale);c.fillStyle=color;
  c.beginPath();c.moveTo(1.6,-7.8);
  c.bezierCurveTo(-.1,-12,-2.4,-19.7,.5,-25.5);
  c.bezierCurveTo(3.1,-31.7,7,-31.9,7.8,-26.4);
  c.bezierCurveTo(8.6,-19,2.2,-12.1,-3.1,-7.3);
  c.bezierCurveTo(-9.9,-1.1,-11.8,4.6,-7.3,9.8);
  c.bezierCurveTo(-4.9,12.5,-.3,13.7,4.4,12.1);
  c.bezierCurveTo(12.2,9.6,10.8,1,5.4,-.1);
  c.bezierCurveTo(1.3,-.9,-3.8,2.3,-3.6,6.1);
  c.bezierCurveTo(-3.3,7.9,-2.7,9,-1.1,10);
  c.bezierCurveTo(-7.3,8.5,-7.9,1.3,-3.4,-2.1);
  c.bezierCurveTo(2.7,-7.6,11.7,-4.7,12.3,2.6);
  c.bezierCurveTo(13.5,10.8,7.4,15.4,.2,15.1);
  c.bezierCurveTo(-8.1,15.1,-13,9.6,-13.1,3.1);
  c.bezierCurveTo(-13.4,-4.9,-5.9,-11.6,-.4,-17.1);
  c.bezierCurveTo(4.1,-21.5,7.5,-26.5,5.6,-27.8);
  c.bezierCurveTo(2.5,-29.6,-.9,-22.2,.6,-15);
  c.lineTo(8.2,23.8);c.bezierCurveTo(9.4,30.4,5.2,34.4,-.1,32.3);
  c.bezierCurveTo(-4.8,30.5,-4.4,24.6,-.6,24.3);
  c.bezierCurveTo(4.4,23.4,4.8,30.5,.7,30.4);
  c.bezierCurveTo(4,33.3,8.8,29.5,6.9,23.4);c.lineTo(1.6,-7.8);
  c.fill();c.restore();
}
const degree=[0,0,1,1,2,3,3,4,4,5,5,6];
function staffDegree(pitch) {
  const pc=((pitch%12)+12)%12;
  return Math.floor((pitch-60)/12)*7+degree[pc];
}
export class ScoreScene extends ScoreDistribution {
  constructor(canvas) {
    super();
    this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});
    this.events=[];this.theme='herbarium';this.seed=8791;this.night=false;this.light='day';this.weather='clear';this.art=new Map();
    this.title='';this.follow=true;this.zoom=1;this.angle=60;this.pan=0;this.targetPan=0;
    this.cache=new Map();this.births=new Map();this.pulses=new Map();this.tracks=new Map();
    this.inFlight=new Set();this.texture=makeTexture(208);this.dragY=0;this.time=0;this.frame=0;
    this.motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reduced=this.motionPreference.matches;
    this.motionPreference.addEventListener?.('change',e=>{this.reduced=e.matches;if(this.reduced)this.transition=null;this.invalidate();});
    this.visible=true;this.needsPaint=true;this.transition=null;
    this.boundPaint=t=>this.draw(t);
    
    this.onResize=new ResizeObserver(()=>this.resize());this.onResize.observe(canvas);
    this.intersection=new IntersectionObserver(entries=>{
      this.visible=entries[0].isIntersecting;if(this.visible)this.invalidate();else this.transition=null;
    });this.intersection.observe(canvas);
    this.visibility=()=>{if(!document.hidden)this.invalidate();};document.addEventListener('visibilitychange',this.visibility);
    this.bindGestures();this.resize();
  }
  setScore(events,options={}) {
    const sameWorld=this.theme===options.theme && this.seed===options.seed;
    const priorEvents=this.events;
    this.transition=null;
    this.events=Array.isArray(events)?events.slice():[];
    this.theme=palettes[options.theme]?options.theme:this.theme;
    this.seed=Number.isFinite(options.seed)?options.seed:this.seed;
    const oldLight=this.light,oldWeather=this.weather;
    if(lightIds.includes(options.light))this.light=options.light;
    else if('night' in options)this.light=options.night?'night':'day';
    this.night=this.light==='night';
    if(weatherIds.includes(options.weather))this.weather=options.weather;
    if('title' in options)this.title=String(options.title||'');
    if(!sameWorld||oldLight!==this.light||oldWeather!==this.weather)this.cache.clear();
    this.pulses.clear();this.births.clear();this.inFlight.clear();this.pickItems=[];
    if(!sameWorld || !priorEvents.length){this.pan=this.targetPan=0;this.playhead=null;this.browsing=false;}
    else if(this.playhead!=null)this.playhead=Math.min(this.playhead,this.events.length-1);
    this.relayout();this.front=this.builtFront();
    if(Number.isInteger(options.focusIndex))this.focusNote(options.focusIndex,true);
    this.needsPaint=true;this.invalidate();
  }

  holdAtmosphere() {
    if(this.reduced||!this.visible||document.hidden||!this.back)return;
    const start=performance.now();
    // Weather and time are normally changed together in one playback tick.
    if(this.transition&&start-this.transition.start<35)return;
    const previous=clearCanvas(this.canvas.width,this.canvas.height);
    previous.getContext('2d').drawImage(this.canvas,0,0);
    this.transition={previous,start};
  }
  setWeather(weather) {
    if(!weatherIds.includes(weather)||this.weather===weather)return;
    this.holdAtmosphere();this.weather=weather;this.artwork(this.theme,15);this.cache.clear();this.needsPaint=true;this.invalidate();
  }
  setLight(light) {
    if(!lightIds.includes(light)||this.light===light)return;
    this.holdAtmosphere();this.light=light;this.night=light==='night';this.cache.clear();this.needsPaint=true;this.invalidate();
  }
  pointForNote(index,event=this.events[index]) {
    if(!event||!Number.isInteger(index)||index<0||!this.W||!this.rowH)return null;
    const site=siteFor(this.theme,this.seed,index,event,this.worldWidth,this.weather);
    const p=this.worldPoint(site.x,site.z),x=p.x,y=p.y-site.y*p.unit*.16;
    return {x,y,visible:y>=(this.contentTop??this.paperTop)&&y<=(this.contentBottom??this.paperBottom)&&x>=0&&x<=this.W};
  }
  pickNoteAt(cssX,cssY) {
    if(!Number.isFinite(cssX+cssY)||cssY<this.contentTop||cssY>this.contentBottom)return -1;
    const items=this.pickItems||[];
    for(let k=items.length-1;k>=0;k--){
      const {i,x,y,scale,spr,sway,face}=items[k];if(!this.events[i])continue;
      const dx=cssX-x,dy=cssY-y;
      const ux=(dx*Math.cos(sway)+dy*Math.sin(sway))/(scale*face)+spr.w/2;
      const uy=(dy*Math.cos(sway)-dx*Math.sin(sway))/(scale*this.propAspect)+spr.bottom;
      if(ux<1||ux>=spr.w-1||uy<1||uy>=spr.h-1)continue;
      const d=spr.el.width/spr.w;
      const ctx=spr.el.getContext('2d');
      const patch=ctx.getImageData(Math.max(0,Math.floor((ux-1)*d)),Math.max(0,Math.floor((uy-1)*d)),Math.ceil(2*d),Math.ceil(2*d)).data;
      for(let a=3;a<patch.length;a+=4)if(patch[a]>40)return i;
    }
    // Small printed note heads and the place where their trails touch down
    // are also targets when the transparent margins of an artwork are tapped.
    for(let k=items.length-1;k>=0;k--){
      const {i,x,y,printX,printY,g}=items[k],r=clamp(g.gap*.76,3.5,7);
      if(Math.hypot(cssX-printX,cssY-printY)<r||Math.hypot(cssX-x,cssY-y)<r)return i;
    }
    return -1;
  }
  setFollow(bool) {
    this.follow=!!bool;
    if(this.follow && this.events.length){this.browsing=false;this.focusNote(this.playhead??this.events.length-1);}
  }
  zoomBy(factor) {
    if(!Number.isFinite(factor)||factor<=0)return;
    const pos=this.rowH?this.pan/this.rowH:0;
    this.transition=null;this.zoom=clamp(this.zoom*factor,.66,1.75);this.relayout();
    this.pan=this.targetPan=clamp(pos*this.rowH,0,this.maxPan);
    this.needsPaint=true;this.invalidate();
  }
  setViewAngle(degrees) {
    if(!Number.isFinite(degrees))return;
    const target=clamp(degrees,36,83);
    if(Math.abs(target-this.angle)<.015)return;
    const position=this.rowH?this.pan/this.rowH:0;
    this.transition=null;this.angle=target;this.relayout();
    this.pan=this.targetPan=clamp(position*this.rowH,0,this.maxPan);this.invalidate();
  }
  home() {
    this.zoom=1;this.angle=60;this.browsing=false;this.relayout();
    if(this.events.length)this.focusNote(Math.min(this.playhead??this.events.length-1,this.events.length-1),true);
    else this.invalidate();
  }
  addNote(event,index=this.events.length,landingDelayMs=0) {
    if(!event||!Number.isInteger(index)||index<0)return;
    this.events[index]=event;this.births.set(index,performance.now()+Math.max(0,Number(landingDelayMs)||0));if(landingDelayMs>0)this.inFlight.add(index);this.relayout();
    this.focusNote(index);this.invalidate();
  }
  pulse(index,arrivalDelayMs=0) {
    if(!Number.isInteger(index)||index<0)return;
    this.pulses.set(index,performance.now()+Math.max(0,Number(arrivalDelayMs)||0));
    this.invalidate();
  }
  resize() {
    const b=this.canvas.getBoundingClientRect();
    const W=Math.round(b.width),H=Math.round(b.height);
    if(W<=1||H<=1)return;
    const dpr=Math.min(window.devicePixelRatio||1,2);
    if(W===this.W&&H===this.H&&dpr===this.dpr){this.invalidate();return;}
    this.transition=null;this.W=W;this.H=H;this.dpr=dpr;
    this.canvas.width=Math.round(W*dpr);this.canvas.height=Math.round(H*dpr);
    this.relayout();this.needsPaint=true;this.invalidate();
  }
  relayout() {
    if(!this.W||!this.H)return;
    const w=this.W,h=this.H;
    this.cols=NOTES;this.worldWidth=w<650?9.4:13;
    const rad=this.angle*PI/180;
    this.obliqueness=clamp((Math.cos(rad)-Math.cos(83*PI/180))/(Math.cos(36*PI/180)-Math.cos(83*PI/180)),0,1);
    this.pitchAspect=Math.sin(rad)/Math.sin(PI/3);
    this.propAspect=lerp(.71,1.22,this.obliqueness);
    this.paperTop=(w<600?42:clamp(h*.102,45,52))+Math.max(0,this.obliqueness-.50)*h*.105;
    this.paperBottom=h-clamp(h*.059,27,33);
    const displayRows=(w<600&&h>=315)||h>575?3:2;
    this.topBand=this.paperTop+clamp(h*.054,19,33);
    this.bottomBand=h-this.paperBottom+clamp(h*.029,10,17);
    this.rowH=clamp((h-this.topBand-this.bottomBand)/displayRows,54,200)*this.zoom;
    this.lastRow=Math.max(1,Math.ceil(this.events.length/NOTES));
    const enoughRows=Math.ceil((h-this.topBand-this.bottomBand)/this.rowH);
    this.rows=Math.max(enoughRows,this.lastRow);
    let endZ=Math.max(0,this.lastRow-1)*SPAN;
    for(let i=(this.lastRow-1)*NOTES;i<this.events.length;i++)if(this.events[i])endZ=Math.max(endZ,this.site(i).z);
    this.maxPan=Math.max(0,(endZ/SPAN+.43)*this.rowH-(h-this.topBand-this.bottomBand));
    this.pan=clamp(this.pan,0,this.maxPan);this.targetPan=clamp(this.targetPan,0,this.maxPan);
    this.needsPaint=true;
  }
  builtFront() {
    let last=this.events.length-1;
    while(last>=0&&(!this.events[last]||this.inFlight.has(last)))last--;
    if(last<0)return -.02;
    const block=Math.floor(last/NOTES),first=Math.max(0,(block-1)*NOTES);
    let z=block>0?block*SPAN-.43:-.02;
    for(let i=first;i<=last;i++)if(this.events[i]&&!this.inFlight.has(i))z=Math.max(z,this.site(i).z+.87);
    return z;
  }
  focusNote(index,immediate=false) {
    if(!this.events[index] || !this.rowH)return;
    this.playhead=index;
    if(!immediate&&(!this.follow||this.browsing))return;
    if(immediate)this.browsing=false;
    const viewport=this.H-this.topBand-this.bottomBand;
    const distance=(this.site(index).z/SPAN+.25)*this.rowH;
    const y=distance-this.targetPan;
    if(immediate||y>viewport*.73||y<viewport*.18){
      this.targetPan=clamp(distance-viewport*.60,0,this.maxPan);
      if(immediate||this.reduced)this.pan=this.targetPan;
      this.needsPaint=true;this.invalidate();
    }
  }
  bindGestures() {
    const canvas=this.canvas;canvas.style.touchAction='none';
    const point=e=>({x:e.clientX,y:e.clientY});
    const dist=()=>{const p=[...this.tracks.values()];return p.length===2?Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y):0;};
    if(!canvas.hasAttribute('tabindex'))canvas.tabIndex=0;
    canvas.setAttribute('aria-keyshortcuts','ArrowLeft ArrowRight ArrowUp ArrowDown Home');
    canvas.setAttribute('aria-description','横拖或按左右方向键调整俯仰，竖拖或按上下方向键浏览，Home 键回到生长位置。');
    canvas.title='横拖调整视角 · 竖拖沿谱游览 · 双指或滚轮缩放';
    canvas.addEventListener('keydown',e=>{
      if(e.altKey||e.metaKey||e.ctrlKey)return;
      if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
        e.preventDefault();this.setViewAngle(this.angle+(e.key==='ArrowLeft'?-4:4));
      }else if(e.key==='ArrowUp'||e.key==='ArrowDown'){
        e.preventDefault();this.browsing=true;this.targetPan=clamp(this.targetPan+(e.key==='ArrowUp'?-1:1)*this.rowH*.54,0,this.maxPan);this.invalidate();
      }else if(e.key==='Home'){e.preventDefault();this.home();}
    });
    const beginDrag=p=>{
      this.dragOrigin=p;this.dragY=p.y;this.dragAngle=this.angle;this.dragAxis='';
    };
    canvas.addEventListener('pointerdown',e=>{
      if(e.button!==0 && e.pointerType==='mouse')return;
      const p=point(e);this.tracks.set(e.pointerId,p);try{canvas.setPointerCapture(e.pointerId);}catch{}
      beginDrag(p);this.pinch=dist();
    });
    canvas.addEventListener('pointermove',e=>{
      if(!this.tracks.has(e.pointerId))return;this.tracks.set(e.pointerId,point(e));
      if(this.tracks.size===2){const d=dist();if(this.pinch>1&&d>1)this.zoomBy(d/this.pinch);this.pinch=d;return;}
      const dx=e.clientX-this.dragOrigin.x,dy=e.clientY-this.dragOrigin.y;
      if(!this.dragAxis){
        if(Math.max(Math.abs(dx),Math.abs(dy))<4)return;
        this.dragAxis=Math.abs(dx)>Math.abs(dy)?'angle':'scroll';
      }
      if(this.dragAxis==='angle')this.setViewAngle(this.dragAngle+dx/Math.max(165,this.W*.66)*47);
      else{
        this.browsing=true;this.pan=this.targetPan=clamp(this.pan-(e.clientY-this.dragY),0,this.maxPan);
        this.needsPaint=true;this.invalidate();
      }
      this.dragY=e.clientY;
    });
    const up=e=>{
      this.tracks.delete(e.pointerId);this.pinch=dist();
      if(this.tracks.size===1)beginDrag(this.tracks.values().next().value);
    };
    canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
    canvas.addEventListener('wheel',e=>{
      e.preventDefault();const dy=e.deltaY*(e.deltaMode===1?16:1);
      if(e.shiftKey){this.browsing=true;this.targetPan=clamp(this.targetPan+dy,0,this.maxPan);this.invalidate();}
      else this.zoomBy(Math.exp(-clamp(dy,-100,100)*.00175));
    },{passive:false});
  }
  paperSide(y) {
    const t=clamp((y-this.paperTop)/(this.paperBottom-this.paperTop),0,1);
    const far=.022+this.obliqueness*.124,near=.021-this.obliqueness*.017;
    return this.W*lerp(far,near,t)+3;
  }
  worldPoint(x,z) {
    const span=this.H-this.topBand-this.bottomBand;
    const v=((z/SPAN+.25)*this.rowH-this.pan)/span;
    const normalized=clamp(v,0,1),depth=.46*this.obliqueness;
    const f=normalized/(1+depth*(1-normalized))+(v<0?v/(1+depth):v>1?(v-1)*(1+depth):0);
    const y=this.topBand+span*f;
    const pers=1+(normalized-.54)*(.025+.45*this.obliqueness);
    const margin=this.paperSide(y)+clamp(this.W*.034,9,35);
    const unit=(this.W-margin*2)/this.worldWidth;
    return {x:this.W*.5+x*unit,y,unit,pers,margin};
  }
  geometry(row) {
    const g=this.worldPoint(0,(row+.61)*SPAN),left=g.margin,right=this.W-left;
    const clefW=clamp((right-left)*.063,19,54),start=left+clefW+4,end=right-clamp(this.W*.018,7,23);
    const step=(end-start)/NOTES;
    const gap=clamp(this.rowH*.053,3.3,8)*g.pers*this.pitchAspect;
    return {raw:g.y,pers:g.pers,left,right,start,end,step,gap,scale:g.unit/35,clefW};
  }
  site(i) {return siteFor(this.theme,this.seed,i,this.events[i],this.worldWidth,this.weather);}
  anchor(i) {
    const site=this.site(i),feet=this.worldPoint(site.x,site.z),g=this.geometry(Math.floor(i/NOTES));
    const degreeFromE4=staffDegree(this.events[i].m)-2,col=i%NOTES;
    const printX=g.start+(col+.48)*g.step,printY=g.raw+(4-clamp(degreeFromE4,-10,22))*g.gap*.5;
    // The ink marks the exact pitch; the diorama shares its route and event
    // identity. Both are projected from permanent positions in this score.
    return {x:feet.x,y:feet.y-site.y*feet.unit*.16,site,printX,printY,g,degree:degreeFromE4};
  }
  artwork(theme,kind,weather=this.weather) {
    if(kind<8&&kind!==-1)return null;
    const key=theme+'-'+kind+(kind===15?'-'+weather:''),previous=this.art.get(key);
    if(previous)return previous.loaded?previous.image:null;
    const image=new Image(),entry={image,loaded:false};this.art.set(key,entry);
    image.onload=()=>{
      entry.loaded=true;
      if(this.theme===theme&&(kind!==15||weather===this.weather)){if(kind===-1)this.needsPaint=true;else this.cache.clear();this.invalidate();}
    };
    image.src=kind===-1?'./art/horizon-'+theme+'.webp':kind===15?'./art/weather-'+theme+'-'+weather+'.webp':kind===14?'./art/landmark-'+theme+'.png':'./art/specimen-'+theme+'-'+(kind-8)+'.webp';
    return null;
  }
  getSprite(i) {
    const code=this.seedFor(i),kind=this.family(i),key=this.theme+'-'+i+'-'+code+'-'+kind;
    if(this.cache.has(key))return this.cache.get(key);
    const art=this.artwork(this.theme,kind);
    const s=sprite(this.theme,code,kind,art,this.weather,this.light);this.cache.set(key,s);
    if(this.cache.size>130)this.cache.delete(this.cache.keys().next().value);
    return s;
  }
  makeBackground() {
    const w=this.W,h=this.H,r=this.dpr;
    if(!this.back || this.back.width!==this.canvas.width || this.back.height!==this.canvas.height)this.back=clearCanvas(this.canvas.width,this.canvas.height);
    const c=this.back.getContext('2d');c.setTransform(r,0,0,r,0,0);c.clearRect(0,0,w,h);
    const p=this.palette=litPalette(palettes[this.theme],this.theme,this.light,this.weather),dark=this.night||this.theme==='tide';
    c.fillStyle=inks(c,0,0,w,h,[[0,p.table[0]],[.58,p.table[1]],[1,p.table[2]]]);c.fillRect(0,0,w,h);
    const view=this.artwork(this.theme,-1);
    if(view){
      const z=Math.max(w/view.naturalWidth,h/(view.naturalHeight*.81));
      const iw=view.naturalWidth*z,ih=view.naturalHeight*z;
      const shift=(this.obliqueness-.5)*Math.min(21,Math.max(0,(iw-w)*.19));
      const yy=clamp(this.paperTop*.52-ih*.21,h-ih,0);
      c.drawImage(view,(w-iw)/2+shift,yy,iw,ih);
      const tint=this.light==='night'?'rgba(17,34,57,.66)':this.light==='dusk'?'rgba(197,117,88,.20)':this.light==='dawn'?'rgba(242,201,174,.19)':'rgba(216,218,177,.045)';
      c.fillStyle=tint;c.fillRect(0,0,w,h);
      if(this.weather==='rain'||this.weather==='snow'){
        c.fillStyle=this.weather==='rain'?'rgba(91,115,130,.34)':'rgba(225,238,240,.40)';c.fillRect(0,0,w,h);
      }
    }else drawHorizon(c,w,h,this.paperTop,this.theme,this.light,this.weather,this.seed);
    const pat=c.createPattern(this.texture,'repeat');c.globalAlpha=.48;c.fillStyle=pat;c.fillRect(0,0,w,h);c.globalAlpha=1;
    // Sloping sheet edge, with a quiet layered bevel against the felt.
    const y0=this.paperTop,y1=this.paperBottom,x0=this.paperSide(y0),x1=this.paperSide(y1);
    const corners=[{x:x0,y:y0+1},{x:w-x0-1,y:y0},{x:w-x1,y:y1-1},{x:x1,y:y1}];
    const rnd=random(5619),pts=[];
    for(let side=0;side<4;side++){
      const a=corners[side],b=corners[(side+1)%4],len=Math.hypot(b.x-a.x,b.y-a.y),num=Math.ceil(len/5);
      for(let j=0;j<num;j++){
        const t=j/num,noise=(rnd()-.5)*1.8;
        pts.push({x:lerp(a.x,b.x,t)+(side%2?noise:noise*.25),y:lerp(a.y,b.y,t)+(side%2?noise*.22:noise)});
      }
    }
    c.save();c.shadowColor='rgba(26,39,31,.34)';c.shadowBlur=clamp(w*.012,5,15);c.shadowOffsetY=5;
    edges(c,pts);c.fillStyle=dark?'#52615e':'#b6ab8e';c.fill();c.restore();
    for(let k=3;k>=1;k--){
      c.save();c.translate(-.6*k,.95*k);edges(c,pts);c.fillStyle=dark?['','#58625f','#3d4d4c','#6a7066'][k]:['','#ded5b7','#baaf94','#d4c7a9'][k];c.fill();c.restore();
    }
    edges(c,pts);c.fillStyle=inks(c,0,0,w*.85,h,[[0,p.paper[0]],[.56,p.paper[1]],[1,p.paper[2]]]);c.fill();
    c.save();c.clip();
    const light=c.createRadialGradient(w*.42,h*.3,h*.1,w*.42,h*.3,Math.max(w*.66,h));
    light.addColorStop(0,dark?'rgba(125,173,192,.12)':'rgba(255,252,230,.36)');light.addColorStop(.7,'rgba(248,236,207,0)');light.addColorStop(1,dark?'rgba(16,29,40,.2)':'rgba(128,102,64,.095)');
    c.fillStyle=light;c.fillRect(0,0,w,h);
    c.globalAlpha=dark?.31:.47;c.fillStyle=pat;c.fillRect(0,0,w,h);c.globalAlpha=1;
    const margin=clamp(w*.027,8,23);
    const by=y0+clamp(h*.024,7,13);
    const ax=this.paperSide(by)+margin, bx=w-ax;
    c.fillStyle=p.ink;c.globalAlpha=.77;c.font='italic '+clamp(w*.017,10.3,16)+'px Georgia, serif';
    c.fillText(p.latin,ax,by+5);
    c.font='600 '+clamp(w*.009,7,9)+'px Georgia, serif';c.textAlign='right';
    c.fillText('PL. '+({herbarium:'I',harbor:'II',fair:'III',tide:'IV',grove:'V',alpine:'VI',canal:'VII',sky:'VIII'}[this.theme]),bx,by+4);c.textAlign='left';
    c.globalAlpha=.35;line(c,ax,by+10,bx,by+10,p.rule,.55);
    // Small printer's ornaments at the two ends of the title rule.
    for(const x of [ax,bx]){poly(c,[x,by+8.7,x+1.3,by+10,x,by+11.3,x-1.3,by+10],p.ink);}
    c.restore();
    const footerY=y1-clamp(h*.018,6,10);
    c.save();c.globalAlpha=.52;c.textAlign='center';c.font='italic '+clamp(w*.011,8,10.5)+'px Georgia, serif';
    c.fillStyle=p.ink;c.fillText('—   '+p.folio+'   —',w/2,footerY);c.restore();
    c.save();
    c.beginPath();c.rect(0,by+12,w,Math.max(0,footerY-(by+12)-4));c.clip();
    const start=(this.pan/this.rowH-.62)*SPAN;
    const end=(this.pan/this.rowH+(this.H-this.topBand-this.bottomBand)/this.rowH+.42)*SPAN;
    const front=this.front??this.builtFront();
    c.save();
    if(front<end){
      c.beginPath();c.moveTo(0,0);c.lineTo(w,0);
      for(let k=20;k>=0;k--){
        const u=k/20,tip=front-.23*(u-.48)**2-.09*Math.sin(u*15+this.seed%20);
        c.lineTo(w*u,this.worldPoint(0,tip).y);
      }
      c.closePath();c.clip();
    }
    if(front>start)drawLandscape(this,c,start,Math.min(end,front+.04));
    const firstRow=Math.max(0,Math.floor(start/SPAN)),lastRow=Math.max(firstRow,Math.ceil(end/SPAN));
    drawSettlements(this,c,firstRow*NOTES,Math.min(this.events.length,(lastRow+1)*NOTES));
    c.restore();
    c.save();c.globalAlpha=.29;c.fillStyle=pat;c.fillRect(0,by+12,w,Math.max(0,footerY-(by+12)-4));c.restore();
    for(let row=firstRow;row<=lastRow;row++)this.printRow(c,row,p);
    c.restore();this.contentTop=by+12;this.contentBottom=footerY-4;
    this.needsPaint=false;
  }
  printRow(c,row,p) {
    const g=this.geometry(row),base=g.raw,half=2*g.gap;
    c.save();c.strokeStyle=p.rule;
    for(let j=-2;j<=2;j++){
      const y=base+j*g.gap,tilt=.24*j;
      c.globalAlpha=.32;c.lineWidth=j===-2||j===2?.68:.55;
      c.beginPath();c.moveTo(g.left,y);c.quadraticCurveTo((g.left+g.right)/2,y+.4,g.right,y+tilt);c.stroke();
    }
    const clefScale=Math.min(g.gap*.122,g.clefW/27)*.98;
    c.globalAlpha=.86;clef(c,g.left+g.clefW*.46,base,clefScale,p.ink);
    c.globalAlpha=.45;const den=g.step*this.cols;
    for(let k=1;k<=4;k++){
      const x=k===4?g.right:g.start+den*k/4;
      line(c,x,base-half,x,base+half,p.rule,k===4?.95:.7);
    }
    c.globalAlpha=.49;c.font='italic '+Math.max(7,Math.min(10,g.step*.3))+'px Georgia, serif';c.fillStyle=p.ink;
    c.fillText(String(row*4+1).padStart(2,'0'),g.left,base+half+Math.max(9,g.gap));
    c.restore();
  }
  invalidate() {
    if(!this.frame&&this.visible&&!document.hidden)this.frame=requestAnimationFrame(this.boundPaint);
  }
  draw(now) {
    this.frame=0;
    if(!this.W||!this.H||!this.visible||document.hidden)return;
    const delta=Math.min(72,Math.max(1,now-(this.time||now-16)));this.time=now;
    if(Math.abs(this.targetPan-this.pan)>.12){
      this.pan=lerp(this.pan,this.targetPan,this.reduced?1:1-Math.exp(-delta/105));this.needsPaint=true;
    }else if(this.pan!==this.targetPan){this.pan=this.targetPan;this.needsPaint=true;}
    for(const i of this.inFlight){if(now>=this.births.get(i)){this.inFlight.delete(i);this.needsPaint=true;}}
    const frontGoal=this.builtFront();
    if(!Number.isFinite(this.front)||this.reduced)this.front=frontGoal;
    const frontMoving=Math.abs(frontGoal-this.front)>.012;
    if(frontMoving){
      this.front=lerp(this.front,frontGoal,1-Math.exp(-delta/175));this.needsPaint=true;
    }else if(this.front!==frontGoal){this.front=frontGoal;this.needsPaint=true;}
    if(this.needsPaint||!this.back)this.makeBackground();
    const c=this.ctx;
    c.setTransform(1,0,0,1,0,0);c.drawImage(this.back,0,0);
    c.setTransform(this.dpr,0,0,this.dpr,0,0);
    c.save();c.beginPath();c.rect(0,this.contentTop,this.W,this.contentBottom-this.contentTop);c.clip();
    const first=Math.max(0,Math.floor(this.pan/this.rowH)-1)*this.cols;
    const end=Math.min(this.events.length,first+(Math.ceil(this.H/this.rowH)+3)*this.cols);
    const items=[];
    for(let i=first;i<end;i++){
      if(!this.events[i])continue;
      const {x,y,g,site,printX,printY}=this.anchor(i);
      if(y<this.contentTop-48||y>this.contentBottom+135)continue;
      const birth=this.births.get(i),age=birth===undefined?4:(now-birth)/1000;
      if(age<0)continue;
      const spr=this.getSprite(i),code=this.seedFor(i);
      const sound=this.pulses.get(i),tone=sound===undefined||now<sound?4:(now-sound)/1000;
      const germ=this.reduced?1:clamp(age/(spr.organic?.81:.91),0,1);
      const spring=germ<.67?1:1+Math.sin((germ-.67)*PI/.33)*.029;
      const noteScale=site.size*(.97+(code%61)/1000);
      const scale=clamp(g.scale,.56,2.0)*noteScale*(spr.kind===14?1.07:1);
      const room=Math.max(.30,(y-this.contentTop-2)/((spr.height+4)*this.propAspect));
      const itemScale=this.pan<1 && i<this.cols?Math.min(scale,room):scale;
      const phase=(code>>>10)*.0052;
      const beat=(!this.reduced && tone<1.15)?Math.sin(clamp(tone/.5,0,1)*PI)*Math.exp(-tone*2.8):0;
      const sway=!this.reduced ? Math.sin(now*.0008+phase)*(.009+(this.theme==='tide'?.011:0)):0;
      const face=site.side>0 && ['frontage','gate','visitor','quay','flow'].includes(site.role) ? -1 : 1;
      items.push({i,x,y,g,site,face,printX,printY,spr,code,age,tone,germ,spring,scale:itemScale,beat,sway});
    }
    const p=this.palette;
    // All shadows and note heads precede the miniatures, so clusters overlap in depth order.
    for(const it of items){
      const {x,y,printX,printY,g,spr,spring,scale,germ,i,tone}=it;
      if(germ<=0)continue;
      if(tone<1.12){
        c.save();c.setLineDash([2,3]);c.globalAlpha=.55*(1-tone/1.12);
        curve(c,printX,printY,lerp(printX,x,.57),printY+g.gap*.5,x,y,p.accent,1);c.restore();
      }
      c.save();c.translate(printX,printY);
      // Ledger lines and the seed-shaped note head stay on the pitch actually played.
      const steps=staffDegree(this.events[i].m)-2;
      if(steps<0 || steps>8){
        const dir=steps<0?-1:1, boundary=dir<0?0:8;
        c.globalAlpha=.65;
        for(let n=boundary+2*dir;dir<0?n>=steps:n<=steps;n+=2*dir){
          const ly=(g.raw+(4-n)*g.gap*.5)-printY;line(c,-g.gap*.84,ly,g.gap*.84,ly,p.rule,.7);
        }
        c.globalAlpha=1;
      }
      const pitchClass=((this.events[i].m%12)+12)%12;
      if([1,3,6,8,10].includes(pitchClass)){
        const step=g.gap*.31,ax=-g.gap*1.16;
        for(const offset of [-.7,.7])line(c,ax+offset*step,-step*2.2,ax+offset*step-.27,step*2.2,p.ink,Math.max(.48,step*.24));
        for(const offset of [-.7,.7])line(c,ax-step*1.2,step*offset+.4,ax+step*1.2,step*offset-.5,p.ink,Math.max(.67,step*.33));
      }
      c.globalAlpha=.76;ellipse(c,0,.15,g.gap*.58,g.gap*.34,p.ink,-.28);
      line(c,g.gap*.46,0,g.gap*.46,-g.gap*2.3,p.ink,Math.max(.55,g.gap*.12));
      c.restore();
      if(this.night && ['frontage','quay','visitor','gate','courtyard'].includes(it.site.role)){
        c.save();c.translate(x,y);c.scale(1,.34);
        this.glow(c,0,1,Math.max(10,22*scale),.20,'255,190,98');c.restore();
      }
      c.save();c.translate(x,y);c.scale(scale,scale);
      c.globalAlpha=this.weather==='rain'?.105:this.night?.30:this.weather==='snow'?.16:.22;
      const cast=this.light==='dusk'?-.74:this.light==='dawn'?.83:this.light==='night'?.29:.48;
      c.transform(.93,.015,cast,-(this.light==='dawn'||this.light==='dusk'?.39:.23)*this.pitchAspect,0,0);
      c.scale(it.face,1);growFromGround(c,spr,spr.shadow,germ);c.restore();
    }
    items.sort((a,b)=>a.y-b.y);
    this.pickItems=items.filter(it=>it.germ>=1);
    for(const it of items){
      const {x,y,spr,code,age,tone,germ,spring,scale,beat,sway}=it;
      if(germ>0){
        c.save();c.translate(x,y);
        c.rotate(sway+(1-germ)*Math.sin(germ*8.2)*.15);
        const sx=(1+Math.sin(germ*PI)*.065)*(1-beat*.036);
        c.scale(scale*sx*it.face,scale*this.propAspect*spring*(1+beat*.08));
        growFromGround(c,spr,spr.el,germ);
        if(germ>.97)animateSpecimen(c,this.theme,spr.kind,code,now*.001,this.reduced);
        c.restore();
        if((this.theme==='tide'||this.theme==='fair')&&(this.night||this.theme==='tide')){
          const glimmer=this.reduced?.5:.44+.36*Math.sin(code+now*.0012);
          const gx=x+Math.sin(code)*6*scale,gy=y-(9+code%11)*scale;
          this.glow(c,gx,gy,4.2*scale,glimmer*(this.theme==='fair'?.63:.34),this.theme==='fair'?'255,199,113':'177,235,219');
        }
      }
      if(!this.reduced && age<1.25)this.sow(c,it,age);
      if(tone<1.12){
        c.save();c.globalAlpha=Math.max(0,(1-tone/1.12))*.74;
        const rr=(5+Math.min(1,tone/.92)*19)*Math.min(scale,1.4);
        c.beginPath();c.ellipse(x,y+.5,rr,rr*.34,-.09,0,TAU);
        c.strokeStyle=p.accent;c.lineWidth=Math.max(.8,(1-tone)*1.6);c.stroke();c.restore();
      }
    }
    c.restore();
    weatherAir(c,this.W,this.H,this.weather,this.theme,this.light,now*.001,this.seed,this.reduced);
    if(this.transition){
      const t=clamp((now-this.transition.start)/470,0,1);
      if(t>=1||this.reduced)this.transition=null;
      else{
        c.save();c.setTransform(1,0,0,1,0,0);
        c.globalAlpha=1-t*t*(3-2*t);c.drawImage(this.transition.previous,0,0);c.restore();
      }
    }
    for(const [idx,t] of this.births)if(now-t>1350)this.births.delete(idx);
    for(const [idx,t] of this.pulses)if(now-t>1180)this.pulses.delete(idx);
    const animate=frontMoving||this.transition||this.births.size||this.pulses.size||Math.abs(this.targetPan-this.pan)>.08;
    clearTimeout(this.rest);
    if(animate)this.invalidate();
    else if((this.events.length||this.weather!=='clear'||this.night)&&!this.reduced&&this.visible&&!document.hidden)this.rest=setTimeout(()=>this.invalidate(),110);
  }
  glow(c,x,y,r,opacity,rgb) {
    if(r<=0||opacity<=0)return;
    const grad=c.createRadialGradient(x,y,0,x,y,r);
    grad.addColorStop(0,'rgba('+rgb+','+opacity+')');grad.addColorStop(.36,'rgba('+rgb+','+(opacity*.34)+')');grad.addColorStop(1,'rgba('+rgb+',0)');
    c.fillStyle=grad;c.fillRect(x-r,y-r,r*2,r*2);
  }
  sow(c,it,age) {
    const {x,y,code,scale}=it,p=this.palette;
    if(age<.50){
      const phase=age/.50;
      c.save();c.globalAlpha=.71*(1-phase);
      const r=(2+16*phase)*scale;c.beginPath();c.ellipse(x,y,r,r*.30,-.09,0,TAU);
      c.lineWidth=(1.3-.75*phase)*scale;c.strokeStyle=p.motes;c.stroke();
      this.glow(c,x,y,Math.max(1,(8+9*phase)*scale),.42*(1-phase),'255,211,135');
      c.restore();
    }
    if(age>.24&&age<1.12){
      const t=(age-.24)/.88;
      for(let k=0;k<7;k++){
        const a=k*2.39+code*.01,speed=8+(code>>k&7);
        const px=x+Math.cos(a)*t*speed*scale,py=y-4-(Math.sin(t*PI*.77)*speed+Math.sin(a)*t*5)*scale;
        c.save();c.globalAlpha=(1-t)*.83;
        ellipse(c,px,py,(1.45-.45*t)*scale,(.7-.25*t)*scale,p.motes,a+t);c.restore();
      }
    }
  }
}
