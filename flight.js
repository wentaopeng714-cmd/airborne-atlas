// Each note traces its own path from the playing surface to the score's live projection.
// All geometry below is in CSS pixels; the canvas backing store handles device density.
const TAU=Math.PI*2;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
const valid=p=>p && Number.isFinite(p.x) && Number.isFinite(p.y);
const profiles={
  herbarium:{shape:'petal',inks:['#c65460','#d77e5c','#a8649b','#628c70'],gold:'#ffe5a2'},
  harbor:{shape:'tern',inks:['#408899','#658983','#b46c4b','#608da7'],gold:'#d9fcf2'},
  fair:{shape:'carnival',inks:['#bd4c67','#dc9256','#8961a2','#558aa3'],gold:'#fff0a4'},
  tide:{shape:'fish',inks:['#5b95d4','#7c69bd','#b56eb7','#4fa7b7'],gold:'#dcfaff'},
  grove:{shape:'samara',inks:['#648d51','#aa8240','#a07d58','#729c66'],gold:'#ecf7a6'},
  alpine:{shape:'crystal',inks:['#50869b','#799db8','#6983a9','#8683aa'],gold:'#e8fcff'},
  canal:{shape:'lantern',inks:['#c65453','#cb8452','#a66589','#809099'],gold:'#ffdf86'},
  sky:{shape:'feather',inks:['#9464b1','#cb8c68','#b26f9e','#5b99b0'],gold:'#fff1be'}
};
function random(seed) {
  return ()=>{
    seed=(seed+0x6d2b79f5)>>>0;
    let n=Math.imul(seed^seed>>>15,1|seed);
    n^=n+Math.imul(n^n>>>7,61|n);
    return ((n^n>>>14)>>>0)/4294967296;
  };
}
function rgba(hex,alpha) {
  const n=parseInt(hex.slice(1),16);
  return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+clamp(alpha)+')';
}
function ellipse(c,x,y,rx,ry,fill) {
  c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,TAU);
  c.fillStyle=fill;c.fill();
}
function halo(c,x,y,r,ink,amount) {
  if(r<=0 || amount<=0)return;
  const g=c.createRadialGradient(x,y,0,x,y,r);
  g.addColorStop(0,rgba('#fff6cb',amount*.98));
  g.addColorStop(.23,rgba(ink,amount*.74));g.addColorStop(.55,rgba(ink,amount*.32));
  g.addColorStop(1,rgba(ink,0));
  c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
}
function star(c,x,y,r,color,angle=0) {
  c.save();c.translate(x,y);c.rotate(angle);c.scale(r,r);
  c.beginPath();c.moveTo(0,-1);c.quadraticCurveTo(.12,-.13,.84,0);
  c.quadraticCurveTo(.12,.12,0,1);c.quadraticCurveTo(-.12,.12,-.84,0);
  c.quadraticCurveTo(-.12,-.13,0,-1);c.fillStyle=color;c.fill();c.restore();
}
function shape(c,kind,x,y,size,angle,ink,light) {
  c.save(); c.translate(x,y);c.rotate(angle);c.scale(size,size);
  c.lineJoin='round';c.lineCap='round';c.lineWidth=.085;
  c.fillStyle=ink;c.strokeStyle='rgba(68,54,55,.42)';
  c.beginPath();
  if(kind==='tern') {
    c.moveTo(.98,-.04);c.quadraticCurveTo(.56,-.13,.38,-.07);
    c.quadraticCurveTo(-.05,-1.07,-1.23,-1.03);c.quadraticCurveTo(-.55,-.72,-.46,-.12);
    c.lineTo(-1.26,.32);c.lineTo(-.50,.25);c.quadraticCurveTo(-.74,.73,-.74,1);
    c.quadraticCurveTo(-.26,.63,.23,.20);c.quadraticCurveTo(.55,.17,.98,-.04);
  } else if(kind==='fish') {
    c.moveTo(1.05,0);c.bezierCurveTo(.38,-.67,-.38,-.51,-.59,-.13);
    c.lineTo(-1.15,-.47);c.quadraticCurveTo(-.94,0,-1.14,.50);
    c.lineTo(-.55,.17);c.bezierCurveTo(.02,.64,.69,.34,1.05,0);
  } else if(kind==='carnival') {
    for(let i=0;i<10;i++) {
      const a=-Math.PI/2+i*Math.PI/5,r=i%2?.42:1;
      const px=Math.cos(a)*r,py=Math.sin(a)*r;
      if(i)c.lineTo(px,py);else c.moveTo(px,py);
    }
  } else if(kind==='crystal') {
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6,r=i%2?.36:1;
      if(i)c.lineTo(Math.cos(a)*r,Math.sin(a)*r);else c.moveTo(r,0);
    }
  } else if(kind==='lantern') {
    c.moveTo(-.32,-.84);c.quadraticCurveTo(-.95,-.54,-.77,.05);
    c.quadraticCurveTo(-.72,.50,-.32,.68);c.lineTo(.32,.68);
    c.quadraticCurveTo(.85,.38,.81,-.16);c.quadraticCurveTo(.77,-.61,.34,-.84);
  } else if(kind==='samara' || kind==='feather') {
    c.moveTo(-1.10,.42);c.bezierCurveTo(-.73,.16,-.55,-.43,-.10,-.57);
    c.quadraticCurveTo(.65,-.83,1.14,-.60);c.quadraticCurveTo(.82,-.39,.61,-.03);
    c.lineTo(.39,-.02);c.lineTo(.45,.09);c.quadraticCurveTo(.08,.44,-.58,.36);
    c.quadraticCurveTo(-.89,.35,-1.10,.42);
  } else {
    // Each bloom rides as a single folded petal, a warm edge lifted off the ink trail.
    c.moveTo(-1.03,.14);c.bezierCurveTo(-.64,-.16,-.57,-.71,.10,-.72);
    c.bezierCurveTo(.66,-.8,.92,-.4,.93,-.02);c.bezierCurveTo(1,.52,.49,.76,-.03,.58);
    c.quadraticCurveTo(-.48,.31,-1.03,.14);
  }
  c.closePath();c.fill();c.stroke();
  c.strokeStyle=light;c.fillStyle=light;c.lineWidth=.10;c.beginPath();
  if(kind==='crystal'){
    for(let k=0;k<6;k++){const a=k*Math.PI/3;c.moveTo(0,0);c.lineTo(Math.cos(a)*.81,Math.sin(a)*.81);}
  }else if(kind==='carnival'){
    c.moveTo(-.40,.23);c.lineTo(0,-.47);c.lineTo(.14,-.12);
  }else if(kind==='lantern'){
    c.moveTo(-.27,-.65);c.quadraticCurveTo(-.44,-.05,-.25,.53);
    c.moveTo(-.31,.69);c.lineTo(.30,.69);c.moveTo(0,.74);c.lineTo(0,1.12);
  }else if(kind==='fish'){
    c.moveTo(-.44,-.16);c.quadraticCurveTo(0,-.37,.37,-.26);
    c.moveTo(.42,-.12);c.lineTo(.50,-.12);
  }else{
    c.moveTo(-.73,.18);c.quadraticCurveTo(-.03,.11,.58,-.36);
  }
  c.stroke();c.restore();
}
function tinyNote(c,x,y,size,rot,ink) {
  c.save();c.translate(x,y);c.rotate(rot);c.scale(size,size);
  ellipse(c,-.23,.38,.38,.22,ink);c.beginPath();c.moveTo(.10,.35);c.lineTo(.10,-.81);
  c.quadraticCurveTo(.31,-.50,.63,-.44);c.strokeStyle=ink;c.lineWidth=.15;c.stroke();c.restore();
}
function cubic(p,a,b,c,d) {
  const q=1-p;return q*q*q*a+3*q*q*p*b+3*q*p*p*c+p*p*p*d;
}
function point(path,t) {
  return {x:cubic(t,path.x0,path.x1,path.x2,path.x3),y:cubic(t,path.y0,path.y1,path.y2,path.y3)};
}
function tangent(path,t) {
  const q=1-t,dx=3*(q*q*(path.x1-path.x0)+2*q*t*(path.x2-path.x1)+t*t*(path.x3-path.x2));
  const dy=3*(q*q*(path.y1-path.y0)+2*q*t*(path.y2-path.y1)+t*t*(path.y3-path.y2));
  const len=Math.hypot(dx,dy)||1;
  return {x:-dy/len,y:dx/len,angle:Math.atan2(dy,dx)};
}
function aim(source,goal,flight) {
  const dx=goal.x-source.x,dy=goal.y-source.y;
  const reach=clamp(Math.hypot(dx,dy)*.23,22,132);
  const bend=flight.bend*reach*(flight.weather==='wind'?1.45:1);
  return {x0:source.x,y0:source.y,x1:source.x+dx*.14+bend,
    y1:source.y+dy*.09-reach*.41,x2:goal.x-dx*.13+bend*.68,
    y2:goal.y-dy*.42-reach*.17,x3:goal.x,y3:goal.y};
}
function traceRibbon(c,path,head,tail,width,ink,alpha,side=0) {
  const N=13,upper=[],lower=[];
  const begin=point(path,tail),end=point(path,head);
  if(Math.hypot(end.x-begin.x,end.y-begin.y)<.8)return;
  for(let i=0;i<=N;i++) {
    const f=i/N,t=mix(tail,head,f),p=point(path,t),n=tangent(path,t);
    const spread=(.12+Math.pow(f,1.05)*.71)*width;
    const wave=side*Math.sin(Math.PI*f)*Math.sin(f*3.8+.3);
    upper.push([p.x+n.x*(spread+wave),p.y+n.y*(spread+wave)]);
    lower.push([p.x+n.x*(-spread+wave),p.y+n.y*(-spread+wave)]);
  }
  const g=c.createLinearGradient(begin.x,begin.y,end.x,end.y);
  g.addColorStop(0,rgba(ink,0));g.addColorStop(.33,rgba(ink,alpha*.36));g.addColorStop(1,rgba(ink,alpha));
  c.fillStyle=g;c.beginPath();c.moveTo(...upper[0]);
  for(let i=1;i<=N;i++)c.lineTo(...upper[i]);for(let i=N;i>=0;i--)c.lineTo(...lower[i]);
  c.closePath();c.fill();
}
function impact(c,p,f,t) {
  const alpha=(1-t)**1.42,size=f.size;
  if(alpha<.005)return;
  c.save();c.globalAlpha=alpha;
  const spread=(1-(1-t)**2)*(14+size*1.65);
  halo(c,p.x,p.y,size*(1.6+t*1.9),f.ink,.48*(1-t));
  c.lineWidth=1.7*(1-t)+.35;c.strokeStyle=rgba(f.ink,.76);
  c.beginPath();c.ellipse(p.x,p.y,3+spread,1.7+spread*.38,0,0,TAU);c.stroke();
  c.strokeStyle=rgba(f.light,.94);c.lineWidth=1.2;
  c.beginPath();c.ellipse(p.x,p.y,2.5+spread*.67,1.25+spread*.28,-.12,.04,4.7);c.stroke();
  for(let k=0;k<f.bits.length;k++){
    const b=f.bits[k], distance=(.21+1.35*t)*b.speed*size*2.5;
    const wind=f.weather==='wind'?t*t*12:0;
    const x=p.x+Math.cos(b.angle)*distance+wind, y=p.y+Math.sin(b.angle)*distance*.90-size*.64*t+size*2*t*t;
    const scale=(1-t*.7)*b.radius*size*.37;
    if(f.weather==='rain' && k%2===0){
      c.strokeStyle=rgba(f.ink,.85);c.lineWidth=1.45;c.beginPath();c.moveTo(x,y);c.lineTo(x-.9,y+3.1);c.stroke();
    }else if((k+1)%3===0||f.weather==='snow'){
      star(c,x,y,scale*1.65,f.light,b.rot+t);
    }else if(k%2===0){
      shape(c,f.profile.shape,x,y,scale,b.rot+t*b.spin,f.ink,f.light);
    }else ellipse(c,x,y,scale*.6,scale*.52,f.ink);
  }
  c.restore();
}

export class NoteFlights {
  constructor(canvas,dock,scene,scoreCanvas) {
    this.canvas=canvas;this.dock=dock;this.scene=scene;this.scoreCanvas=scoreCanvas;
    this.ctx=canvas.getContext('2d');
    this.flights=[];this.frame=0;this.chord=0;this.last=-1000;
    this.motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    this.update=t=>this.draw(t);
    this.onVisibility=()=>{if(document.hidden)this.clear();};
    document.addEventListener('visibilitychange',this.onVisibility);
    canvas.setAttribute('aria-hidden','true');canvas.style.pointerEvents='none';
  }
  target(index,scoreRect,event) {
    const p=this.scene.pointForNote?.(index,event);
    if(!valid(p))return null;
    const w=this.scene.W || this.scoreCanvas.clientWidth || scoreRect.width;
    const h=this.scene.H || this.scoreCanvas.clientHeight || scoreRect.height;
    if(!w || !h)return null;
    return {x:scoreRect.left+p.x*scoreRect.width/w,y:scoreRect.top+p.y*scoreRect.height/h,visible:p.visible!==false};
  }
  launch(note,index,{theme='herbarium',weather='clear'}={}) {
    if(!this.ctx || !Number.isInteger(index) || !Number.isFinite(note?.m))return 0;
    const source=this.dock.launchPoint(note.m),rect=this.scoreCanvas.getBoundingClientRect();
    if(!valid(source) || !rect.width || !rect.height)return 0;
    const target=this.target(index,rect,note) || {x:rect.left+rect.width*.50,y:rect.top+rect.height*.45};
    const dist=Math.hypot(target.x-source.x,target.y-source.y);
    const now=performance.now(), v=clamp(Number.isFinite(note.v)?note.v:.75);
    this.chord=now-this.last<50?(this.chord+1)%5:0;this.last=now;
    const rand=random((note.s>>>0)^Math.imul(index+1,0x9e3779b9)^(note.m<<8));
    const profile=profiles[theme]||profiles.herbarium;
    const reduced=this.motion.matches;
    const delay=reduced?0:26+this.chord*16;
    const travel=reduced?82:Math.round(clamp(280+Math.sqrt(dist)*10.6+(1-v)*68,360,626));
    const bits=Array.from({length:10},(_,i)=>({
      angle:-Math.PI+i*TAU/10+(rand()-.5)*.42,
      radius:.6+rand()*.66,speed:.52+.55*rand(),rot:rand()*TAU,spin:(rand()-.5)*7
    }));
    const item={index,m:note.m,seed:note.s,events:this.scene.events,source,start:now,
      delay,travel,impactTime:delay+travel,after:reduced?170:390,
      reduced,profile,ink:profile.inks[(note.m+Math.floor(rand()*4))%4],light:profile.gold,
      size:(rect.width<490?6.0:7.5)+v*3.6,weather,v,phase:rand()*TAU,
      bend:(rand()>.5?1:-1)*mix(.50,1.06,rand()),bits};
    this.dock.flash?.(note.m,item.ink);
    this.flights.push(item);
    if(this.flights.length>22)this.flights.shift();
    if(!this.frame)this.frame=requestAnimationFrame(this.update);
    return item.impactTime;
  }
  clear() {
    cancelAnimationFrame(this.frame);this.frame=0;this.flights.length=0;
    this.chord=0;this.last=-1000;
    if(this.ctx){
      this.ctx.save();this.ctx.setTransform(1,0,0,1,0,0);
      this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);this.ctx.restore();
    }
  }
  dispose() {this.clear();document.removeEventListener('visibilitychange',this.onVisibility);}
  draw(now) {
    this.frame=0;
    const c=this.ctx;
    let overlay=this.canvas.getBoundingClientRect();
    if(!overlay.width || !overlay.height){this.clear();return;}
    const dpr=Math.min(window.devicePixelRatio||1,2,Math.sqrt(3800000/(overlay.width*overlay.height)));
    const w=Math.max(1,Math.round(overlay.width*dpr)),h=Math.max(1,Math.round(overlay.height*dpr));
    if(this.canvas.width!==w || this.canvas.height!==h){
      this.canvas.width=w;this.canvas.height=h;
      overlay=this.canvas.getBoundingClientRect();
    }
    const rect=this.scoreCanvas.getBoundingClientRect();
    c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,w,h);
    c.setTransform(w/overlay.width,0,0,h/overlay.height,-overlay.left*w/overlay.width,-overlay.top*h/overlay.height);
    let count=0;
    for(const f of this.flights){
      const age=Math.max(0,now-f.start);
      if(age>f.impactTime+f.after || (f.events && f.events!==this.scene.events))continue;
      const attached=this.scene.events?.[f.index];
      if(attached && (attached.m!==f.m || (f.seed!==undefined && attached.s!==f.seed)))continue;
      if(this.scene.events && !attached && age>108)continue;
      this.flights[count++]=f;
      const source=this.dock.launchPoint(f.m) || f.source, goal=this.target(f.index,rect);
      if(!goal)continue;
      const within=goal.visible && goal.x>=rect.left-1 && goal.x<=rect.right+1 && goal.y>=rect.top-1 && goal.y<=rect.bottom+1;
      if(age<f.impactTime){
        const ringAge=clamp(age/(f.reduced?90:230));
        if(ringAge<1){
          c.save();c.globalAlpha=1-ringAge;
          halo(c,source.x,source.y,f.size*(1.6+.85*ringAge),f.ink,.7);
          c.strokeStyle=rgba(f.ink,.92);c.lineWidth=1.6;c.beginPath();
          c.ellipse(source.x,source.y,2+ringAge*f.size*1.20,1.6+ringAge*f.size*.78,0,0,TAU);c.stroke();
          star(c,source.x,source.y,f.size*(.40+.2*Math.sin(ringAge*Math.PI)),f.light);
          c.restore();
        }
        if(!f.reduced && age>f.delay){
          const u=clamp((age-f.delay)/f.travel);
          const progress=u*(.88+.12*u);
          this.airborne(f,aim(source,goal,f),progress,age);
        }
      } else if(within) {
        const t=clamp((age-f.impactTime)/f.after);
        if(f.reduced){
          halo(c,goal.x,goal.y,9,f.ink,(1-t)*.44);
          star(c,goal.x,goal.y,(1-t)*3.8,f.light);
        }else impact(c,goal,f,t);
      }
    }
    this.flights.length=count;
    if(count)this.frame=requestAnimationFrame(this.update);
  }
  airborne(f,path,p,age) {
    const c=this.ctx,size=f.size;
    const head=point(path,p),n=tangent(path,p);
    const trailLength=.31+f.v*.12+(f.weather==='wind' ? .08 : 0);
    const tail=Math.max(0,p-trailLength);
    traceRibbon(c,path,p,tail,size*.81,f.ink,.2);
    traceRibbon(c,path,p,tail,size*.30,f.ink,.8);
    traceRibbon(c,path,p,Math.max(0,p-trailLength*.78),size*.14,f.light,.96);
    traceRibbon(c,path,p,tail,size*.12,f.ink,.73,size*1.3);
    halo(c,head.x,head.y,size*1.66,f.ink,.78);
    const flutter=Math.sin(f.phase+age*(f.weather==='wind' ? .023 : .015))*.35;
    const rotation=f.profile.shape==='lantern'?flutter:n.angle+flutter;
    shape(c,f.profile.shape,head.x,head.y,size,rotation,f.ink,f.light);
    star(c,head.x+n.x*size*.68,head.y+n.y*size*.68,size*.46,'#fff8d9',flutter);
    // A legible musical fleck and satellite glints break up the tapered ink ribbon.
    for(let j=1;j<=6;j++){
      const t=p-(.045*j);
      if(t<0)continue;
      const pt=point(path,t),normal=tangent(path,t),b=f.bits[j];
      const wave=Math.sin(f.phase+j*2.41+age*.006)*size*(.38+j*.15);
      const x=pt.x+normal.x*wave,y=pt.y+normal.y*wave;
      const fade=1-j/8;
      c.save();c.globalAlpha=fade;
      if(j===3)tinyNote(c,x,y,size*.60,b.rot*.18-.25,f.ink);
      else if(f.weather==='rain' && j%2){
        c.strokeStyle=f.ink;c.lineWidth=1.4;c.beginPath();c.moveTo(x,y-1);c.lineTo(x-1.8,y+3.7);c.stroke();
      }else if(f.weather==='snow' || j===2 || j===4){
        star(c,x,y,size*(.18+b.radius*.19),j===2?f.light:f.ink,b.rot);
      }else ellipse(c,x,y,size*.13*b.radius,size*.11*b.radius,f.ink);
      c.restore();
    }
  }
}
