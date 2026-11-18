const NATURALS = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83, 84];
const KEYS = {
  KeyA: 60, KeyW: 61, KeyS: 62, KeyE: 63, KeyD: 64, KeyF: 65, KeyT: 66,
  KeyG: 67, KeyY: 68, KeyH: 69, KeyU: 70, KeyJ: 71, KeyK: 72, KeyO: 73,
  KeyL: 74, KeyP: 75, Semicolon: 76, Quote: 77, BracketLeft: 78,
  BracketRight: 79, Digit9: 80, Digit0: 81, Minus: 82, Equal: 83, Backslash: 84
};
const NOTE = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
const TONES = ['herbarium', 'harbor', 'fair', 'tide'];
const PASTELS = ['#bd6d68','#d18e71','#d7ac6b','#d0b975','#9aa784','#7ea799','#729eae','#798ca8','#9b8da8','#bd92ab','#c67f91','#cb8c77','#c9a474','#8eaa95','#79a5ac'];
const clamp = (v, low = 0, high = 1) => Math.min(high, Math.max(low, v));
const noteName = m => NOTE[m % 12] + (Math.floor(m / 12) - 1);
const tau = Math.PI * 2;

function gradient(c, x, y, x2, y2, stops) {
  const g = c.createLinearGradient(x, y, x2, y2);
  stops.forEach(([p, color]) => g.addColorStop(p, color));
  return g;
}
function round(c, x, y, w, h, r, fill, stroke) {
  if (w <= 0 || h <= 0) return;
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  c.beginPath();
  c.roundRect(x, y, w, h, radius);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1; c.stroke(); }
}
function line(c,x,y,x2,y2,color,weight = 1) {
  c.beginPath();
  c.moveTo(x,y); c.lineTo(x2,y2); c.strokeStyle = color; c.lineWidth = weight; c.stroke();
}
function oval(c,x,y,rx,ry,fill) {
  c.beginPath(); c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,tau);
  c.fillStyle = fill; c.fill();
}
function label(c,value,x,y,color,size,italic = false) {
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = (italic ? 'italic 500 ' : '500 ') + size + 'px Georgia, "Times New Roman", serif';
  c.fillStyle = color; c.fillText(value,x,y);
}
function screw(c,x,y,r = 2.5) {
  oval(c,x,y+.8,r+.3,r+.3,'#3f332a');
  oval(c,x,y,r,r,gradient(c,x-r,y-r,x+r,y+r,[[0,'#ffedbc'],[.45,'#cbab70'],[1,'#80613b']]));
  line(c,x-r*.50,y+r*.34,x+r*.5,y-r*.34,'#856741',Math.max(.7,r*.34));
}
function wood(c,x,y,w,h,r,dark=false) {
  c.save();
  const stops = dark ? [[0,'#88664e'],[.12,'#493728'],[.66,'#4c3831'],[1,'#352a25']] :
    [[0,'#b18a6c'],[.09,'#805740'],[.36,'#75503c'],[.8,'#936748'],[1,'#543c32']];
  round(c,x,y,w,h,r,gradient(c,x,y,x,y+h,stops),'#5b4636');
  c.clip();
  for (let i=1; i<Math.ceil(h/2.6); i++) {
    const yy=y+i*2.7;
    c.beginPath(); c.moveTo(x,yy);
    for(let k=1;k<=12;k++) {
      const phase = i*1.83+k*.96;
      c.lineTo(x+w*k/12,yy+Math.sin(phase)*.9+Math.cos(k*.68+i)*.65);
    }
    c.strokeStyle = i%3===0 ? 'rgba(253,202,145,.13)' : 'rgba(53,30,22,.13)';
    c.lineWidth=.75; c.stroke();
  }
  c.restore();
}
function sparkle(c,x,y,r,color) {
  c.fillStyle=color; c.beginPath(); c.moveTo(x,y-r); c.quadraticCurveTo(x,y-.3,x+r,y);
  c.quadraticCurveTo(x+.4,y,x,y+r); c.quadraticCurveTo(x,y+.4,x-r,y);
  c.quadraticCurveTo(x-.4,y,x,y-r); c.fill();
}
function hexMix(hex, blend, t) {
  const n=parseInt(hex.slice(1),16), b=parseInt(blend.slice(1),16);
  const cs=[16,8,0].map(s=>Math.round(((n>>s)&255)*(1-t)+((b>>s)&255)*t));
  return 'rgb('+cs.join(',')+')';
}
function nearest(list, value, measure) {
  let best = list[0], dist = Infinity;
  for (const item of list) { const v=Math.abs(measure(item)-value); if(v<dist){best=item;dist=v;} }
  return best;
}
const airColors = ['#b67044','#4f8ba1'];

export class InstrumentDock {
  constructor(container,onStrike) {
    this.container=container;
    this.onStrike=onStrike;
    this.theme='herbarium';
    this.live=new Map();
    this.pointers=new Map();
    this.hands=new Map();
    this.focus=null;
    this.geometry=[];
    this.raf=0;
    this.abort=new AbortController();
    this.root=document.createElement('div');
    this.root.className='aa-instrument';
    this.root.setAttribute('role','group');
    this.canvas=document.createElement('canvas');
    this.canvas.setAttribute('aria-hidden','true');
    this.root.append(this.canvas);
    container.replaceChildren(this.root);
    this.c=this.canvas.getContext('2d');
    this.setTheme(this.theme);
    this.wireInput();
    this.ro=new ResizeObserver(()=>this.resize());
    this.ro.observe(this.root);
    this.resize();
  }
  setTheme(theme) {
    this.theme=TONES.includes(theme)?theme:'herbarium';
    this.root.dataset.instrument=this.theme;
    this.root.setAttribute('aria-label', {herbarium:'钢琴',harbor:'排箫',fair:'木琴',tide:'竖琴'}[this.theme]);
    this.live.clear();
    this.pointers.clear();
    this.hands.clear();
    this.focus=null;
    for(const b of this.root.querySelectorAll('button')) b.remove();
    this.buttons=new Map();
    const notes=this.theme==='herbarium'?Array.from({length:25},(_,i)=>i+60):NATURALS;
    for(const m of notes) {
      const b=document.createElement('button');
      b.className='aa-note-access'; b.type='button';
      b.setAttribute('aria-label','演奏 '+noteName(m));
      b.tabIndex=m===60?0:-1;
      b.addEventListener('click',()=>this.strike(m,.77));
      b.addEventListener('focus',()=>{this.focus=m; this.invalidate();});
      b.addEventListener('blur',()=>{this.focus=null; this.invalidate();});
      b.addEventListener('keydown',e=>{
        if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
        e.preventDefault();
        let j=notes.indexOf(m)+(e.key==='ArrowLeft'?-1:1);
        if(e.key==='Home') j=0; else if(e.key==='End') j=notes.length-1;
        const next=this.buttons.get(notes[clamp(j,0,notes.length-1)]);
        b.tabIndex=-1; next.tabIndex=0; next.focus();
      });
      this.buttons.set(m,b); this.root.append(b);
    }
    this.resize();
  }
  resize() {
    const w=this.root.clientWidth, h=this.root.clientHeight;
    if(!w || !h || !this.c) return;
    this.w=w; this.h=h;
    const dpr=Math.min(2.5,window.devicePixelRatio||1);
    this.canvas.width=Math.round(w*dpr); this.canvas.height=Math.round(h*dpr);
    this.c.setTransform(this.canvas.width/w,0,0,this.canvas.height/h,0,0);
    this.layout();
    this.invalidate();
  }
  layout() {
    const {w,h,theme}=this;
    const margin=theme==='herbarium'?clamp(w*.018,8,22):clamp(w*.034,9,36);
    const keyW=(w-2*margin)/NATURALS.length;
    this.left=margin; this.keyW=keyW;
    this.top=clamp(h*.105,5,13); this.bottom=h-clamp(h*.09,5,10);
    this.geometry=NATURALS.map((m,i)=>({
      m, i, cx:margin+(i+.5)*keyW, x:margin+i*keyW, w:keyW, black:false
    }));
    if(theme==='herbarium') {
      NATURALS.slice(0,-1).forEach((m,i)=>{
        if(NATURALS[i+1]!==m+2) return;
        const delta=[0,.0,-.0,-.025,.025,0,.025][i%7] || 0;
        const cx=margin+(i+1+delta)*keyW, bw=keyW*.55;
        this.geometry.push({m:m+1,i,cx,x:cx-bw/2,w:bw,black:true});
      });
    }
    this.geometry.forEach(k=>{
      const b=this.buttons.get(k.m);
      if(!b) return;
      b.style.left=(100*k.x/w)+'%'; b.style.width=(100*k.w/w)+'%';
      b.style.bottom=k.black?'42%':'0';
    });
  }
  midiAtX(x) {
    if(!this.geometry.length || !Number.isFinite(x)) return 60;
    return nearest(this.geometry,clamp(x)*this.w,k=>k.cx).m;
  }
  launchPoint(midi) {
    if(!this.geometry.length || !this.w || !this.h)return null;
    const r=this.canvas.getBoundingClientRect();
    if(!r.width || !r.height)return null;
    const key=this.geometry.find(k=>k.m===midi) || nearest(this.geometry,midi,k=>k.m);
    // Match the location of the sound-making surface, including the sloping harp bridge.
    let y;
    if(this.theme==='harbor')y=this.h*.10;
    else if(this.theme==='fair')y=this.h*(.09+key.i/14*.11+(.81-key.i/14*.22)*.5);
    else if(this.theme==='tide'){
      const t=(key.cx-this.left*.70)/(this.w-this.left*1.40);
      const crown=.13+.26*t**1.52-.042*Math.sin(t*Math.PI);
      y=this.h*(crown+(.76-.13*t-crown)*.56);
    }else y=this.top+(this.bottom-this.top)*(key.black ? .45 : .73);
    return {x:r.left+key.cx*r.width/this.w,y:r.top+y*r.height/this.h};
  }
  hit(e) {
    const r=this.canvas.getBoundingClientRect();
    if(!r.width || !r.height || e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom) return null;
    const x=(e.clientX-r.left)*this.w/r.width, y=(e.clientY-r.top)*this.h/r.height;
    if(this.theme==='herbarium' && y<this.top+(this.bottom-this.top)*.61) {
      const black=this.geometry.find(k=>k.black && x>=k.x && x<k.x+k.w);
      if(black) return black.m;
    }
    return NATURALS[clamp(Math.floor((x-this.left)/this.keyW),0,NATURALS.length-1)];
  }
  wireInput() {
    const c=this.canvas, signal=this.abort.signal;
    const on=(node,type,fn,options={})=>node.addEventListener(type,fn,{...options,signal});
    const hit=e=>{
      const m=this.hit(e);
      if(this.pointers.get(e.pointerId)===m) return;
      this.pointers.set(e.pointerId,m);
      if(m===null) return;
      const r=this.canvas.getBoundingClientRect();
      const depth=clamp((e.clientY-r.top)/Math.max(r.height,1));
      const expressive=e.pointerType==='pen' && e.pressure>0 ? e.pressure : .57+depth*.31;
      this.strike(m,clamp(expressive,.28,1));
    };
    on(c,'pointerdown',e=>{
      if(e.button!==0) return;
      e.preventDefault();
      c.setPointerCapture(e.pointerId);
      hit(e);
    });
    on(c,'pointermove',e=>{if(this.pointers.has(e.pointerId))hit(e);});
    const end=e=>this.pointers.delete(e.pointerId);
    on(c,'pointerup',end); on(c,'pointercancel',end); on(c,'lostpointercapture',end);
    on(window,'blur',()=>this.pointers.clear());
    on(window,'keydown',e=>{
      if(e.repeat || e.defaultPrevented || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
      const target=e.target;
      const m=KEYS[e.code];
      if(!this.buttons.has(m))return;
      const modalOpen=Array.from(document.querySelectorAll('dialog[open],[aria-modal="true"]'))
        .some(node=>node.getClientRects().length && getComputedStyle(node).visibility!=='hidden');
      if(modalOpen || target?.isContentEditable ||
         target?.closest?.('input,select,textarea,[role="textbox"],[role="dialog"]'))return;
      e.preventDefault(); this.strike(m,e.shiftKey ? .96 : .77);
    });
  }
  strike(m,velocity) {this.flash(m); this.onStrike?.(m,velocity);}
  flash(midi,tint) {
    if(!Number.isFinite(midi))return;
    const m=this.buttons.has(midi)?midi:nearest(NATURALS,midi,x=>x);
    this.live.set(m,{start:performance.now(),tint:tint||'#d79468'}); this.invalidate();
  }
  hover(slot,x) {
    if(!Number.isFinite(x)) {
      if(this.hands.delete(slot)) this.invalidate();
      return;
    }
    const note=this.midiAtX(x);
    if(this.hands.get(slot)===note)return;
    this.hands.set(slot,note);
    this.invalidate();
  }
  invalidate() {
    if(!this.raf) this.raf=requestAnimationFrame(t=>{this.raf=0;this.draw(t);});
  }
  draw(t) {
    if(!this.w || !this.h)return;
    this.c.clearRect(0,0,this.w,this.h);
    this.lights=new Map();
    for(const [m,{start,tint}] of this.live) {
      const elapsed=Math.max(0,t-start), life=1-elapsed/580;
      if(life<=0) this.live.delete(m);
      else this.lights.set(m,{power:life*life,age:elapsed,tint,glaze:tint+Math.round(life*life*173).toString(16).padStart(2,'0')});
    }
    if(this.theme==='herbarium')this.piano();
    if(this.theme==='harbor')this.pipes();
    if(this.theme==='fair')this.bars();
    if(this.theme==='tide')this.harp();
    this.indicators();
    if(this.live.size)this.invalidate();
  }
  piano() {
    const c=this.c,{w,h,left,top,bottom}=this, keyH=bottom-top;
    wood(c,1,1,w-2,h-2,clamp(h*.065,3,8));
    round(c,4,3,w-8,h-6,4,null,'rgba(239,198,131,.56)');
    round(c,left-3,top-3,w-2*left+6,keyH+6,3,'#382c25');
    round(c,left-1,top-2,w-2*left+2,4,1,'#963e40');
    for(const k of this.geometry.filter(k=>!k.black)) {
      const a=this.lights.get(k.m)?.power || 0;
      const down=2.3*a, x=k.x+.5, kw=k.w-1, base=bottom+down;
      round(c,x,top,kw,keyH+1.5,Math.min(3,kw*.08),'#b4a085');
      const shaded=gradient(c,x,top,x+.5,top+keyH,[[0,'#bfb7a7'],[.09,'#e3dccc'],[.54,'#f5edda'],[.92,'#fff8e6'],[1,'#e9dfc7']]);
      round(c,x,top+.5,kw,keyH-2+down*.4,Math.min(3,kw*.08),shaded);
      const bb=gradient(c,x,0,x+kw,0,[[0,'rgba(98,75,50,.10)'],[.1,'rgba(255,255,255,.18)'],[.85,'rgba(255,255,255,0)'],[1,'rgba(78,56,38,.1)']]);
      round(c,x,top+.5,kw,keyH-2+down*.4,2,bb);
      if(a)round(c,x,top+1,kw,keyH-2,2,this.lights.get(k.m).glaze);
      line(c,x+2,base-3.6,x+kw-2,base-3.6,'rgba(255,252,239,.78)',1.1);
      const anchor=k.m%12===0;
      const n=anchor?noteName(k.m):NOTE[k.m%12];
      label(c,n,k.cx,bottom-keyH*.14+down*.45,anchor?'#695345':'#887b65',clamp(k.w*.29,8.7,12.3),!anchor);
    }
    for(const k of this.geometry.filter(k=>k.black)) {
      const a=this.lights.get(k.m)?.power || 0, x=k.x, kw=k.w;
      const bh=keyH*.60+a*1.55;
      c.save(); c.shadowColor='rgba(39,27,21,.44)'; c.shadowBlur=2.7; c.shadowOffsetX=1.4; c.shadowOffsetY=2.8;
      round(c,x,top,kw,bh,Math.min(3.4,kw*.17),'#201f1d'); c.restore();
      round(c,x+.65,top+.6,kw-1.3,bh-2,2.4,gradient(c,x,top,x+kw*.12,top+bh,[[0,'#393b35'],[.3,'#32332e'],[.83,'#393934'],[.89,'#59564a'],[.92,'#2b2b26'],[1,'#2b2926']]));
      round(c,x+.7,top+.7,kw-1.4,bh-2.3,2.2,gradient(c,x,0,x+kw,0,[[0,'rgba(245,234,208,.23)'],[.14,'rgba(196,188,158,.04)'],[.80,'rgba(0,0,0,0)'],[1,'rgba(6,7,4,.39)']]));
      if(a)round(c,x+.7,top+1,kw-1.4,bh-2.3,2,this.lights.get(k.m).glaze);
    }
    for(const x of [left*.48,w-left*.48]) {
      screw(c,x,top*.57,clamp(left*.13,1.25,2.4));
      screw(c,x,h-top*.55,clamp(left*.13,1.25,2.4));
      if(left>=13) {
        line(c,x,h*.28,x,h*.72,'rgba(222,184,125,.53)',.75);
        sparkle(c,x,h*.5,3.2,'#d5b283');
      }
    }
  }
  pipes() {
    const c=this.c,{w,h,left,geometry}=this;
    const top=h*.10, bar=h*.34, kw=this.keyW;
    for(const k of geometry) {
      const a=this.lights.get(k.m)?.power || 0;
      const y=top+a*.9, len=h*(.81-.38*(k.i/14)**.87);
      const pw=k.w*.90, x=k.cx-pw/2, ry=clamp(pw*.15,2.4,6.7);
      c.save(); c.shadowColor='rgba(75,60,38,.23)'; c.shadowOffsetX=1.3; c.shadowOffsetY=2.5; c.shadowBlur=2.7;
      round(c,x,y,pw,len,Math.min(4,pw*.12),'#a37a4d'); c.restore();
      round(c,x,y,pw,len,Math.min(4,pw*.12),gradient(c,x,0,x+pw,0,[[0,'#9c7748'],[.09,'#c9a46d'],[.22,'#e7cc91'],[.34,'#f5e5af'],[.50,'#e4cb91'],[.77,'#c7a46e'],[.93,'#b28c59'],[1,'#96744c']]));
      for(const p of [.12,.25,.38,.64,.76,.87]) {
        const xx=x+pw*p; line(c,xx,y+3,xx+Math.sin(p*k.i)*1.1,y+len-3,'rgba(113,80,44,.13)',.7);
      }
      for(const off of [2.7,5.4]) {
        const cy=y+len-off;
        line(c,x+2,cy,x+pw-2,cy,'rgba(128,90,49,.35)',.85);
        line(c,x+2,cy-.8,x+pw-2,cy-.8,'rgba(255,240,182,.75)',.7);
      }
      oval(c,k.cx,y+.8,pw*.5,ry+1,'#eed8a2');
      oval(c,k.cx,y+.45,pw*.39,ry*.71,gradient(c,0,y-ry,0,y+ry,[[0,'#4b3a29'],[.50,'#715a3c'],[1,'#ab8759']]));
      if(a)round(c,x,y+ry,pw,Math.max(len-ry,1),2,this.lights.get(k.m).glaze);
      const cy=bar+Math.max(10,(y+len-5-bar)*.5);
      label(c,k.m%12===0?noteName(k.m):NOTE[k.m%12],k.cx,cy,'#574c3d',clamp(kw*.26,8.4,12.4),k.m%12!==0);
    }
    const bh=clamp(h*.085,5.5,9);
    round(c,left-3,bar-bh,w-2*left+6,bh,2.5,gradient(c,0,bar-bh,0,bar,[[0,'#d6dfc8'],[.2,'#7e9e8b'],[.55,'#6b9081'],[1,'#384e49']]),'#667a64');
    for(let i=0;i<15;i++) {
      const xx=left+kw*i+kw*.5;
      for(const off of [-1.4,1.4])line(c,xx+off-2,bar-bh+.3,xx+off+1.5,bar-.2,'#c8bb84',1.15);
    }
  }
  bars() {
    const c=this.c,{h,w,left,geometry}=this,kw=this.keyW;
    const top=h*.09, base=h*.90;
    wood(c,left*.35,top+h*.10,w-left*.7,h*.61,6.5);
    for(const y of [h*.30,h*.70]) {
      round(c,left*.39,y,w-left*.78,3,1.5,'#d3b084');
      for(const x of [left*.65,w-left*.65])screw(c,x,y-1,1.65);
    }
    for(const k of geometry) {
      const light=this.lights.get(k.m), a=light?.power || 0;
      const y=top+(k.i/14)*h*.11+(light?Math.sin(light.age/24)*1.75*a:0);
      const len=base-top-(k.i/14)*h*.22;
      const pw=kw*.92,x=k.cx-pw/2, color=PASTELS[k.i];
      const r=clamp(pw*.16,3,7.3);
      c.save(); c.shadowColor='rgba(43,35,30,.3)'; c.shadowBlur=2.4; c.shadowOffsetY=3;
      round(c,x,y,pw,len,r,hexMix(color,'#352c32',.34)); c.restore();
      round(c,x,y,pw,len-2,r,gradient(c,0,y,0,y+len,[[0,hexMix(color,'#fff1df',.48)],[.09,hexMix(color,'#fff7ec',.19)],[.35,color],[.79,hexMix(color,'#635544',.045)],[1,hexMix(color,'#7c584e',.17)]]));
      round(c,x+1.55,y+1.3,pw-3.1,len-5,r-.7,null,'rgba(255,246,220,.33)');
      for(const yy of [y+len*.19,y+len*.80]) {
        const rad=clamp(pw*.076,1.5,3.1);
        oval(c,k.cx,yy+.5,rad+.8,rad+.8,'rgba(84,57,43,.34)');
        oval(c,k.cx,yy,rad,rad,gradient(c,k.cx-rad,yy-rad,k.cx+rad,yy+rad,[[0,'#fff6c9'],[.6,'#d5b381'],[1,'#987b5b']]));
      }
      if(a)round(c,x+.8,y+.8,pw-1.6,len-2,r,light.glaze);
      label(c,k.m%12===0?noteName(k.m):NOTE[k.m%12],k.cx,y+len*.50,'#4d4641',clamp(pw*.28,8.5,12.4),k.m%12!==0);
    }
  }
  harp() {
    const c=this.c,{h,w,left,geometry}=this;
    const lx=left*.70, rx=w-left*.70;
    const pathY=t=>h*(.13+.26*t**1.52-.042*Math.sin(t*Math.PI));
    const baseY=t=>h*(.76-.13*t);
    round(c,1,1,w-2,h-2,7,gradient(c,0,0,w*.20,h,[[0,'#293f4a'],[.6,'#203540'],[1,'#1b2c36']]),'#42545a');
    round(c,5,5,w-10,h-10,4,null,'rgba(197,175,122,.31)');
    for(let j=0;j<42;j++) {
      const xx=(.04+((j*.61803+.09)%1)*.92)*w, yy=(.14+((j*.7549+.21)%1)*.71)*h;
      oval(c,xx,yy,j%6===0?1.05:.48,j%6===0?1.05:.48,'rgba(232,218,165,'+(j%4*.05+.15)+')');
    }
    const brass=gradient(c,0,h*.06,0,h*.8,[[0,'#f3dc9e'],[.14,'#d2a869'],[.38,'#c39355'],[.65,'#caa16a'],[1,'#ac7e49']]);
    for(const k of geometry) {
      const t=(k.cx-lx)/(rx-lx), y=pathY(t), base=baseY(t);
      const live=this.lights.get(k.m), a=live?.power || 0;
      const swing=live?Math.sin(live.age*.11)*Math.min(5,this.keyW*.14)*a:0;
      const col=k.m%12===0?'#d98573':k.m%12===5?'#9fb9cd':'#e4d9b3';
      c.beginPath(); c.moveTo(k.cx,y); c.quadraticCurveTo(k.cx+swing,(y+base)/2,k.cx,base); c.strokeStyle=col; c.lineWidth=1.05+(1-k.i/14)*.47+a; c.stroke();
      if(live){c.save(); c.globalAlpha=a*.44; line(c,k.cx-swing*.36,y+2,k.cx+swing*.26,base-2,live.tint,2.8);c.restore();}
      label(c,k.m%12===0?noteName(k.m):NOTE[k.m%12],k.cx,base+Math.min(h*.12,11),'#dfd6b8',clamp(this.keyW*.25,8.2,11.5),k.m%12!==0);
    }
    const rail=(coords,width,color)=>{
      c.beginPath(); coords.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
      c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();
    };
    const top=Array.from({length:41},(_,i)=>{const t=i/40;return [lx+(rx-lx)*t,pathY(t)];});
    const base=[[lx,baseY(0)],[rx,baseY(1)]], beam=clamp(h*.058,3.7,6.4);
    c.save();
    rail([[lx,pathY(0)],[lx,baseY(0)]],beam*1.4,brass);
    for(const pts of [top,base]){
      rail(pts.map(([x,y])=>[x,y+1]),beam+1.8,'#725b41');
      rail(pts,beam,brass); rail(pts.map(([x,y])=>[x,y-beam*.24]),1,'#ecd39b');
    }
    for(const k of geometry) {
      const t=(k.cx-lx)/(rx-lx); oval(c,k.cx,pathY(t),1.45,1.45,'#80643d'); oval(c,k.cx-.25,pathY(t)-.3,.75,.75,'#e6cb88');
    }
    for(const [x,y] of [[lx,pathY(0)],[lx,baseY(0)],[rx,pathY(1)],[rx,baseY(1)]])screw(c,x,y,clamp(h*.035,2.4,4.2));
    c.restore();
  }
  indicators() {
    const c=this.c;
    for(const [slot,m] of this.hands) {
      const k=this.geometry.find(k=>k.m===m);
      if(!k)continue;
      const color=airColors[Number(slot)===1?1:0], width=clamp(k.w*.70,7,34);
      const y=this.theme==='herbarium'&&k.black?this.top+(this.bottom-this.top)*.48:this.h*.91;
      round(c,k.cx-width/2,y-1.7,width,3.4,1.7,'rgba(255,246,222,.88)');
      round(c,k.cx-width*.44,y-1,width*.88,2,1,color);
      oval(c,k.cx,y-5.3,2,2,color);
    }
    if(this.focus!==null) {
      const k=this.geometry.find(k=>k.m===this.focus);
      if(k){c.save();c.setLineDash([3,2]);round(c,k.x+1.5,this.top+1.5,k.w-3,k.black?(this.bottom-this.top)*.56:(this.bottom-this.top)-3,3,null,'#2d7e78');c.restore();}
    }
  }
  dispose() {
    this.abort.abort();this.ro.disconnect();cancelAnimationFrame(this.raf);
    this.root.remove();
  }
}

function roomImpulse(ctx) {
  const n=Math.floor(ctx.sampleRate*.76);
  const impulse=ctx.createBuffer(2,n,ctx.sampleRate);
  const taps=[[.021,.46],[.038,.31],[.056,.23],[.079,.16],[.119,.1]];
  for(let channel=0;channel<2;channel++) {
    const out=impulse.getChannelData(channel);
    let smoothed=0, state=443443+channel*311;
    for(let i=0;i<n;i++) {
      state=(Math.imul(1664525,state)+1013904223)>>>0;
      const t=i/ctx.sampleRate;
      smoothed=smoothed*.6+(state/2147483648-1)*.4;
      out[i]=t>.016?smoothed*Math.exp(-(t-.016)*10.8)*.24:0;
    }
    for(const [at,v] of taps)out[Math.round((at+channel*.0017)*ctx.sampleRate)]+=v;
  }
  return impulse;
}

export class SoundEngine {
  constructor() {
    this.ctx=null;this.output=null;this.volume=.75;this.voices=new Set();
  }
  unlock() {
    const Audio=window.AudioContext || window.webkitAudioContext;
    if(!Audio)return Promise.resolve(false);
    try {
      if(!this.ctx || this.ctx.state==='closed') {
        const ctx=new Audio({latencyHint:'interactive'});
        this.ctx=ctx;
        this.mix=ctx.createGain();this.mix.gain.value=.73;
        const compressor=ctx.createDynamicsCompressor();
        compressor.threshold.value=-16;compressor.knee.value=13;
        compressor.ratio.value=4;compressor.attack.value=.003;
        compressor.release.value=.22;
        this.output=ctx.createGain();this.output.gain.value=this.volume;
        this.mix.connect(compressor);compressor.connect(this.output);
        this.output.connect(ctx.destination);
        this.reverb=ctx.createConvolver();
        this.reverb.buffer=roomImpulse(ctx);
        const wet=ctx.createGain();wet.gain.value=.23;
        this.reverb.connect(wet);wet.connect(this.mix);
        const noise=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.85),ctx.sampleRate);
        const arr=noise.getChannelData(0);
        let state=67378;
        for(let i=0;i<arr.length;i++){state=(Math.imul(1664525,state)+1013904223)>>>0;arr[i]=state/2147483648-1;}
        this.noise=noise;
      }
      if(this.ctx.state==='running')return Promise.resolve(true);
      return this.ctx.resume().then(()=>this.ctx.state==='running').catch(()=>false);
    } catch {return Promise.resolve(false);}
  }
  setVolume(volume) {
    if(!Number.isFinite(volume))return;
    this.volume=clamp(volume);
    if(this.output)this.output.gain.setTargetAtTime(this.volume,this.ctx.currentTime,.012);
  }
  play(midi,velocity=.75,theme='herbarium') {
    if(!Number.isFinite(midi))return;
    if(!this.ctx || this.ctx.state!=='running')this.unlock();
    const ctx=this.ctx;
    if(!ctx || ctx.state==='closed')return;
    const f=440*2**((clamp(midi,24,108)-69)/12);
    const v=clamp(Number.isFinite(velocity)?velocity:.75,.04,1);
    const t=ctx.currentTime+.004;
    if(this.voices.size>=22)this.release(this.voices.values().next().value,ctx.currentTime);
    const gain=ctx.createGain();
    gain.gain.value=1;
    const voice={gain,sources:[],pending:0,cleanups:[],released:false};
    this.voices.add(voice);
    let source=gain;
    if(ctx.createStereoPanner) {
      const pan=ctx.createStereoPanner();
      pan.pan.value=clamp((midi-72)/52,-.36,.36);
      gain.connect(pan);voice.cleanups.push(pan);source=pan;
    }
    source.connect(this.mix);
    const send=ctx.createGain();
    send.gain.value={herbarium:.55,harbor:.8,fair:.62,tide:.95}[theme] ?? .55;
    source.connect(send);send.connect(this.reverb);voice.cleanups.push(send);
    // Each resonant mode has its own decay; brightness falls as the material loses energy.
    const mode=(ratio,level,attack,decay,detune=0,vibrato=0)=>{
      const freq=f*ratio;
      if(freq>ctx.sampleRate*.42 || level<.0004)return;
      const osc=ctx.createOscillator(), env=ctx.createGain();
      osc.frequency.value=freq;
      osc.detune.value=detune;
      env.gain.setValueAtTime(.00002,t);
      env.gain.linearRampToValueAtTime(Math.max(.0001,level),t+attack);
      env.gain.exponentialRampToValueAtTime(.000035,t+attack+decay);
      osc.connect(env);env.connect(gain);voice.cleanups.push(env);
      if(vibrato) {
        const lfo=ctx.createOscillator(), mod=ctx.createGain();
        lfo.frequency.value=4.75;
        mod.gain.setValueAtTime(0,t);
        mod.gain.linearRampToValueAtTime(vibrato,t+.26);
        lfo.connect(mod);mod.connect(osc.detune);voice.cleanups.push(mod);
        this.addSource(voice,lfo,t,t+attack+decay+.018);
      }
      this.addSource(voice,osc,t,t+attack+decay+.018);
    };
    const breath=(frequency,q,level,attack,decay)=>{
      const noise=ctx.createBufferSource(), filter=ctx.createBiquadFilter(), env=ctx.createGain();
      noise.buffer=this.noise;noise.loop=true;
      filter.type='bandpass';filter.frequency.value=Math.min(frequency,ctx.sampleRate*.40);filter.Q.value=q;
      env.gain.setValueAtTime(.00002,t);
      env.gain.linearRampToValueAtTime(level,t+attack);
      env.gain.exponentialRampToValueAtTime(.00004,t+attack+decay);
      noise.connect(filter);filter.connect(env);env.connect(gain);
      voice.cleanups.push(filter,env);this.addSource(voice,noise,t,t+attack+decay+.015);
    };
    const loud=.20+.80*v;
    if(theme==='harbor') {
      // A small pressure swell, breath onset and a narrow, gently beating tube resonance.
      const fundamental=ctx.createOscillator(), amp=ctx.createGain(), lfo=ctx.createOscillator(), depth=ctx.createGain();
      fundamental.frequency.setValueAtTime(f*.988,t);
      fundamental.frequency.exponentialRampToValueAtTime(f,t+.062);
      lfo.frequency.value=4.9;depth.gain.setValueAtTime(0,t);depth.gain.linearRampToValueAtTime(5.4,t+.21);
      lfo.connect(depth);depth.connect(fundamental.detune);
      amp.gain.setValueAtTime(.00003,t);amp.gain.linearRampToValueAtTime(.24*loud,t+.07);
      amp.gain.linearRampToValueAtTime(.26*loud,t+.16);
      amp.gain.linearRampToValueAtTime(.17*loud,t+.28);
      amp.gain.exponentialRampToValueAtTime(.00004,t+.54);
      fundamental.connect(amp);amp.connect(gain);voice.cleanups.push(amp,depth);
      this.addSource(voice,lfo,t,t+.56);this.addSource(voice,fundamental,t,t+.56);
      mode(2,.030*loud,.062,.46,0,2.5);mode(3,.069*loud,.049,.46,0,3);mode(5,.019*loud,.054,.33);
      breath(f*2.1,.85,.13*loud,.011,.22);breath(f*5,.65,.08*loud,.048,.34);
    } else if(theme==='fair') {
      const decay=1.4*(440/f)**.21;
      mode(1,.34*loud,.0033,decay);
      mode(3.985,.143*v,.0018,.40);mode(9.19,.063*v*v,.0015,.16);
      mode(13.62,.024*v*v,.001,.075);
      mode(1,.024*loud,.005,decay*.72,4.7);
      breath(f*2.8,.8,.059*loud,.0014,.035);
    } else if(theme==='tide') {
      const decay=2.45*(440/f)**.24;
      const pluckPoint=.177+clamp((midi-60)/24)*.029;
      for(let n=1;n<=8;n++) {
        const a=Math.abs(Math.sin(n*Math.PI*pluckPoint))*Math.exp(-n*.055)/(n**1.32);
        mode(n*(1+.000065*(n*n-1)),a*.57*loud,.0028,decay/(n**.48));
      }
      mode(1,.036*loud,.016,decay,2.3);
      breath(f*4.9,.5,.041*loud,.0014,.032);
    } else {
      // A felt strike, small unison detuning, and progressively shorter upper partials.
      const decay=2.25*(440/f)**.25;
      mode(1,.195*loud,.0048,decay,-1.5);
      mode(1,.105*loud,.007,decay*.87,1.7);
      mode(2.0012,.14*loud,.0032,decay*.63);
      mode(3.0041,.071*loud*(.55+.45*v),.0027,decay*.45);
      mode(4.0085,.055*loud*v,.0023,decay*.29);
      mode(5.016,.034*v*v,.0018,decay*.21);
      mode(7.044,.014*v*v,.0018,.20);
      breath(Math.min(3200,f*4.7),.9,.06*loud,.001,.033);
    }
  }
  addSource(voice,node,at,end) {
    voice.sources.push(node);voice.pending++;
    node.onended=()=>{
      node.disconnect();
      if(--voice.pending!==0)return;
      voice.gain.disconnect();
      for(const part of voice.cleanups)part.disconnect();
      this.voices.delete(voice);
    };
    node.start(at); node.stop(end);
  }
  release(voice,at) {
    if(!voice || voice.released)return;
    voice.released=true;this.voices.delete(voice);
    voice.gain.gain.cancelScheduledValues(at);
    voice.gain.gain.setTargetAtTime(0,at,.009);
    for(const osc of voice.sources){try{osc.stop(at+.055);}catch{}}
  }
  stop() {
    if(!this.ctx)return;
    const at=this.ctx.currentTime;
    for(const voice of Array.from(this.voices))this.release(voice,at);
  }
}
