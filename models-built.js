// Hand-built miniature architecture. Front façades face +Z and all dimensions are local.
const PI=Math.PI,TAU=2*PI;
const C={cream:'#f3e2bc',ivory:'#fff2ce',white:'#f6ecda',ochre:'#d4a457',gold:'#d4a354',brass:'#ba8949',wood:'#97704c',lightWood:'#bd9568',beam:'#624c3d',bark:'#594939',roof:'#466768',navy:'#314b58',teal:'#518d89',mint:'#9ebda2',coral:'#bd6455',red:'#a74d42',blue:'#688b9b',stone:'#a7aaa0',darkStone:'#69756d',rock:'#839084',snow:'#ebf0e4',pine:'#486c58',leaf:'#789678',water:'#82aba0',black:'#3d4541'};
const pick=(r,a)=>a[Math.floor(r()*a.length)];
const windowLight=b=>b.glow('#ffd482');
const lampLight=b=>b.glow('#ffca69');
function placed(b,x=0,y=0,z=0,s=1){
  return {
    glow:col=>b.glow(col),
    motion:(type,[X,Y,Z],draw)=>move(b,type,[x+s*X,y+s*Y,z+s*Z],draw),
    box:(X,Y,Z,w,h,d,col,...rot)=>b.box(x+s*X,y+s*Y,z+s*Z,s*w,s*h,s*d,col,...rot),
    ell:(X,Y,Z,a,c,d,col,...rot)=>b.ell(x+s*X,y+s*Y,z+s*Z,s*a,s*c,s*d,col,...rot),
    cyl:(X,Y,Z,r,R,h,col,n,...rot)=>b.cyl(x+s*X,y+s*Y,z+s*Z,s*r,s*R,s*h,col,n,...rot),
    rod:(x1,y1,z1,x2,y2,z2,r,col,rTop=r,n)=>b.rod(x+s*x1,y+s*y1,z+s*z1,x+s*x2,y+s*y2,z+s*z2,r*s,col,rTop*s,n),
    ring:(X,Y,Z,r,t,col,...rot)=>b.ring(x+s*X,y+s*Y,z+s*Z,r*s,t*s,col,...rot),
    form:(ps,d,X,Y,Z,col,...rot)=>b.form(ps.map(([a,c])=>[a*s,c*s]),s*d,x+s*X,y+s*Y,z+s*Z,col,...rot)
  };
}
function closedWheel(b,x,y,z,r,color=C.beam,n=6){
 b.ring(x,y,z,r,r*.10,color);b.cyl(x,y,z,r*.19,r*.19,.095,C.brass,8,PI/2);
 for(let i=0;i<n;i++){const a=PI*i/n;b.rod(x-r*Math.cos(a),y-r*Math.sin(a),z,x+r*Math.cos(a),y+r*Math.sin(a),z,.014,color);}
}
function flag(b,x,y,z,color=C.coral,h=.46){
 b.rod(x,y,z,x,y+h,z,.016,C.brass);
 b.form([[0,0],[.29,-.04],[.22,-.09],[.29,-.15],[0,-.115]],.015,x,y+h-.012,z,color);
}
function lamp(b,x,y,z,s=1){
 const q=placed(b,x,y,z,s);q.cyl(0,.04,0,.09,.11,.08,C.navy,8);q.rod(0,.04,0,0,.62,0,.03,C.navy);
 q.cyl(0,.72,0,.08,.065,.16,lampLight(b),6);q.cyl(0,.84,0,.018,.115,.08,C.navy,6);
 q.cyl(0,.63,0,.075,.085,.03,C.brass,6);
}
function pane(b,x,y,z,w,h,frame=C.beam){
 b.box(x,y,z,w,h,.038,frame);
 b.box(x,y,z+.022,w*.78,h*.74,.022,windowLight(b));
 b.box(x,y,z+.041,w*.085,h*.80,.015,frame);
 b.box(x,y-.006,z+.041,w*.82,h*.07,.015,frame);
}
function roof(b,x,y,z,w,d,rise,col,snow=false){
 const shape=[[-w*.54,-.04],[-w*.54,.035],[0,rise],[w*.54,.035],[w*.54,-.04],[0,rise-.08]];
 b.form(shape,d*1.13,x,y,z,col);
 const front=z+d*.566;
 b.rod(x-w*.54,y+.018,front,x,y+rise+.01,front,.023,snow?C.snow:C.cream);
 b.rod(x,y+rise+.01,front,x+w*.54,y+.018,front,.023,snow?C.snow:C.cream);
 b.rod(x,y+rise,z-d*.56,x,y+rise,z+d*.56,.035,snow?C.snow:C.brass);
 if(!snow){for(const f of [-.31,0,.31])for(const side of [-1,1])
   b.rod(x,y+rise+.008,z+d*f,x+side*w*.53,y+.039,z+d*f,.009,col===C.roof?'#68827d':'#b08068');}
 if(snow){for(const side of [-1,1])b.form([[0,0],[side*w*.55,-rise+.029],[side*w*.48,-rise+.102]],d*1.12,x,y+rise+.017,z,C.snow);}
}
function hut(b,x,y,z,s,wall,roofCol,opts={}){
 const q=placed(b,x,y,z,s),w=1,d=.69,h=.68;
 q.box(0,.055,0,1.06,.11,.78,opts.stone||C.stone);q.box(0,.41,0,w,h,d,wall);
 q.form([[-.50,0],[0,.35],[.50,0]],d,0,.746,0,wall);
 roof(q,0,.76,0,1.13,.79,.37,roofCol,!!opts.snow);
 const fr=d*.5+.011;
 q.box(.12,.33,fr,.23,.53,.04,opts.trim||C.navy);q.box(.12,.32,fr+.027,.16,.47,.02,opts.door||C.wood);
 q.ell(.175,.31,fr+.047,.016,.016,.012,C.brass);
 pane(q,-.25,.47,fr,.24,.24,opts.trim||C.beam);
 pane(q,.36,.48,fr,.17,.21,opts.trim||C.beam);
 q.box(.10,.112,.43,.35,.09,.18,C.stone);q.box(.10,.044,.52,.40,.087,.16,C.darkStone);
 q.box(.50,.49,.012,.04,.24,.26,opts.trim||C.beam);q.box(.525,.49,.012,.018,.18,.19,windowLight(q));
 q.box(.528,.49,.012,.023,.025,.20,opts.trim||C.beam);
 for(const xx of [-.455,.455])q.box(xx,.41,fr+.008,.032,.61,.043,opts.trim||C.wood);
 q.box(0,.167,fr+.01,.91,.035,.045,opts.trim||C.wood);
 q.box(-.25,.327,fr+.02,.285,.036,.080,C.lightWood);
 q.box(0,.775,fr+.009,.93,.046,.061,opts.trim||C.wood);
 for(const dx of [-.14,.14])q.box(-.25+dx,.477,fr+.015,.036,.20,.041,opts.door||C.roof);
 if(opts.chimney!==false){q.box(-.34,.99,-.14,.135,.42,.15,opts.trim||C.coral);q.box(-.34,1.21,-.14,.17,.045,.185,C.darkStone);}
}
function conifer(b,x,y,z,s,snow=false){
 const q=placed(b,x,y,z,s);q.cyl(0,.23,0,.063,.097,.46,C.bark,8);
 for(let i=0;i<3;i++){
   const yy=.53+i*.27,rr=.40-i*.092;
   q.cyl(0,yy,0,.018,rr,.68-i*.06,[C.pine,'#507962','#699077'][i],7,0,.38+i*.25);
   if(snow)q.cyl(0,yy+.116,0,.012,rr*.70,.43-i*.032,C.snow,7,0,.38+i*.25);
 }
}
function stone(b,x,y,z,s,col=C.stone){b.ell(x,y,z,s*.80,s*.53,s*.64,col,.11,.28,-.09);}
function plankDock(b,x=0,z=0,s=1){
 const q=placed(b,x,0,z,s);
 for(const X of [-.53,.53])for(const Z of [-.25,.25]){
   q.cyl(X,.19,Z,.055,.067,.38,C.beam,8);q.cyl(X,.39,Z,.062,.062,.04,C.lightWood,8);
 }
 for(let i=0;i<8;i++)q.box(-.525+i*.15,.26,0,.143,.075,.65,i%2?C.lightWood:'#b28b60');
}
function rail(b,x1,x2,z,y,h=.35,col=C.wood){
 for(const x of [x1,(x1+x2)*.5,x2]){b.rod(x,y,z,x,y+h+.035,z,.028,col);b.ell(x,y+h+.045,z,.035,.035,.035,C.gold);}
 b.rod(x1,y+h,z,x2,y+h,z,.027,col);b.rod(x1,y+h*.42,z,x2,y+h*.42,z,.017,col);
}
function tentCanopy(b,x,y,z,r,h,col,accent=C.ivory,count=9){
 b.cyl(x,y+h*.5,z,.035,r,h,col,count);
 b.cyl(x,y+.006,z,r*1.025,r*.94,.075,accent,count);
 for(let j=0;j<count;j++){
   const a=j*TAU/count,xx=x+Math.sin(a)*r,zz=z+Math.cos(a)*r;
   b.rod(xx,y+.015,zz,x,y+h,z,.014,accent,.008,5);
   b.ell(xx,y-.035,zz,.065,.080,.065,j%2?col:accent);
 }
 b.ell(x,y+h+.03,z,.056,.071,.056,C.gold);
}
function flower(b,x,y,z,s,leaf=C.leaf,petal=C.white){
 b.rod(x,y,z,x+.025*s,y+.48*s,z,.019*s,leaf);
 b.ell(x-.036*s,y+.20*s,z,.105*s,.036*s,.044*s,leaf,0,0,-.44);
 b.ell(x+.076*s,y+.28*s,z,.09*s,.035*s,.045*s,leaf,0,0,.38);
 for(let j=0;j<6;j++){const a=j*TAU/6;b.ell(x+(.025+Math.cos(a)*.08)*s,y+(.48+Math.sin(a)*.08)*s,z,.107*s,.044*s,.042*s,petal,.07,0,a);}
 b.ell(x+.025*s,y+.48*s,z+.024*s,.056*s,.051*s,.041*s,C.gold);
}
function crate(b,x,y,z,s=1){
 const q=placed(b,x,y,z,s);q.box(0,.135,0,.34,.27,.29,C.lightWood);
 for(const Y of [.045,.224])q.box(0,Y,.148,.34,.038,.027,C.wood);
 q.rod(-.15,.04,.163,.15,.23,.163,.017,C.beam);
}
function cart(b,col=C.coral,canopy=false){
 b.box(0,.38,0,.96,.40,.51,col);b.box(0,.59,0,1.03,.063,.58,C.cream);
 b.box(0,.21,0,1.0,.065,.55,C.brass);
 for(const x of [-.32,.32]){closedWheel(b,x,.19,.277,.17,C.beam,4);b.cyl(x,.18,-.27,.155,.155,.055,C.beam,9,PI/2);}
 b.rod(.44,.47,0,.77,.59,0,.029,C.wood);b.rod(.78,.59,-.14,.78,.59,.14,.030,C.beam);
 if(canopy){for(const x of [-.41,.41])b.rod(x,.60,0,x,1.28,0,.028,C.wood);roof(b,0,1.27,0,1.05,.62,.17,C.coral);}
}
function stripedLantern(b,x,y,z,s=.2,col=C.coral){
 b.ell(x,y,z,s*.74,s*.92,s*.74,col);
 b.cyl(x,y+s*.85,z,s*.4,s*.45,s*.12,C.gold,8);
 b.cyl(x,y-s*.84,z,s*.42,s*.38,s*.13,C.gold,8);
 b.rod(x,y-s*.90,z,x,y-s*1.37,z,s*.077,C.gold);
 b.ell(x,y,z+s*.70,s*.17,s*.53,s*.075,lampLight(b));
}
function water(b,x,z,rx,rz){b.ell(x,.025,z,rx,.045,rz,C.water);}

function beacon(b,hero=false){
 const s=hero?1.15:.88,q=placed(b,0,0,0,s);
 q.cyl(0,.09,0,.36,.44,.18,C.darkStone,12);
 q.cyl(0,.24,0,.315,.37,.16,C.cream,12);
 const colors=[C.ivory,C.coral,C.ivory,C.coral,C.ivory];
 for(let i=0;i<5;i++)q.cyl(0,.32+(i+.5)*.245,0,.31-(i+1)*.028,.31-i*.028,.245,colors[i],12);
 q.box(0,.43,.302,.13,.245,.048,C.navy);q.ell(.043,.42,.328,.014,.014,.013,C.gold);
 for(let i=0;i<3;i++)q.box(0,.76+i*.285,.264-i*.032,.086,.13,.031,C.navy);
 q.cyl(0,1.58,0,.335,.235,.11,C.navy,12);
 q.cyl(0,1.77,0,.145,.155,.30,lampLight(q),8);
 q.ring(0,1.735,0,.285,.015,C.brass,PI/2);
 for(let j=0;j<8;j++){
   const a=j*TAU/8,xx=Math.sin(a),zz=Math.cos(a);
   q.rod(xx*.287,1.615,zz*.287,xx*.287,1.745,zz*.287,.011,C.navy);
   if(j%2===0)q.rod(xx*.16,1.625,zz*.16,xx*.16,1.925,zz*.16,.016,C.navy);
 }
 q.cyl(0,1.955,0,.065,.265,.15,C.coral,8);q.ell(0,2.06,0,.047,.063,.047,C.brass);
 if(hero){hut(q,-.42,.04,-.13,.54,C.cream,C.roof,{chimney:false});stone(q,.42,.065,.16,.19);stone(q,.37,.053,-.19,.15);}
}
function hull(b,color=C.navy,scale=1){
 const q=placed(b,0,0,0,scale);
 const outline=[[-.77,0],[-.57,-.23],[-.30,-.285],[.34,-.27],[.66,-.15],[.88,0],[.61,.19],[.30,.275],[-.34,.27],[-.63,.18]];
 q.form(outline.map(([x,z])=>[x*.86,z*.76]),.095,0,.10,0,color,PI/2);
 q.form(outline,.16,0,.21,0,color,PI/2);
 q.form(outline.map(([x,z])=>[x*1.015,z*1.035]),.041,0,.30,0,C.cream,PI/2);
 q.form(outline.map(([x,z])=>[x*.98,z*.94]),.045,0,.336,0,C.lightWood,PI/2);
 for(const x of [-.42,-.18,.09,.34])q.ell(x,.23,.256,.042,.041,.018,C.gold);
}
function sail(b,x,h,spread,side,col,z=.02){
 b.rod(x,.35,z,x,h,z,.025,C.beam,.017);const y0=.55;
 b.form([[0,.015],[spread*side,.10],[.045*side,h-y0-.055]],.020,x,y0,z,col,0,side*.12);
 b.rod(x,y0,z,x+spread*side,y0+.10,z,.018,C.wood);
 b.rod(x,h-.04,z,x+spread*side,y0+.11,z,.008,C.cream);
 flag(b,x,h-.045,z,C.coral,.145);
}
function sailing(b,double=false,full=false){
 hull(b,full?C.teal:C.navy);
 sail(b,double?.12:-.10,double?1.70:1.76,double?.54:.65,1,C.ivory);
 if(double)sail(b,-.35,1.43,.42,-1,full?'#d79e6e':'#c77e60',-.03);
 else b.form([[.0,0],[-.51,.025],[-.01,.84]],.018,-.15,.56,-.07,'#c78a6b',0,-.13);
 b.rod(.85,.35,0,double?.12:-.10,double?1.68:1.73,.02,.008,C.beam);
}
function tug(b,ice=false){
 hull(b,ice?C.coral:C.teal);
 b.box(-.12,.49,-.015,.74,.29,.40,C.white);b.box(-.10,.72,-.015,.50,.23,.35,C.cream);
 b.box(-.10,.86,-.015,.58,.065,.43,C.navy);
 for(const x of [-.28,-.10,.08])pane(b,x,.72,.17,.12,.14);
 b.cyl(.30,.66,0,.091,.12,.56,C.navy,10);b.cyl(.30,.87,0,.108,.105,.11,C.coral,10);
 b.rod(-.42,.68,-.09,-.42,1.17,-.09,.017,C.beam);flag(b,-.42,1.05,-.09,C.gold,.13);
 for(const x of [-.44,.29])b.ring(x,.36,.277,.077,.023,C.black);
 if(ice){b.form([[0,0],[.32,.13],[-.04,.11]],.27,.60,.18,0,C.stone);for(let j=0;j<3;j++)stone(b,.57+j*.13,.025,.29-j*.17,.16-j*.026,C.snow);}
}
function seasideMill(b){
 b.cyl(0,.53,0,.24,.39,1.06,C.cream,10);b.cyl(0,1.18,0,.03,.37,.30,C.roof,9);
 b.box(0,.29,.347,.19,.38,.036,C.beam);pane(b,-.07,.79,.265,.14,.17);
 const cx=0,cy=1.03,z=.365;
 move(b,'spinZ',[cx,cy,z],()=>{for(let i=0;i<4;i++){
   const a=.34+i*PI/2,dx=Math.cos(a),dy=Math.sin(a);
   b.rod(cx,cy,z,cx+.71*dx,cy+.71*dy,z,.025,C.wood);
   b.form([[.16,.016],[.66,.016],[.66,.17],[.30,.14]],.022,cx,cy,z,C.white,0,0,a);
   for(const t of [.36,.5,.62])b.rod(cx+t*dx,cy+t*dy,z+.018,cx+t*dx-.13*dy,cy+t*dy+.13*dx,z+.018,.009,C.wood);
 }});
 b.ell(cx,cy,z+.015,.075,.075,.048,C.brass);
}
function harbor(b,k,w,r){
 if(k===0||k===14){beacon(b,k===14);return;}
 if(k===1||k===9){sailing(b,k===9);return;}
 if(k===2){seasideMill(b);return;}
 if(k===3){for(const [x,z,s] of [[-.36,.04,.85],[.10,-.16,1.28],[.42,.17,.78]])conifer(b,x,0,z,s);stone(b,-.20,.07,.29,.20);return;}
 if(k===4||k===7||k===8||k===13){
   if(k===7){hut(b,-.36,.015,.03,.72,C.cream,C.coral);hut(b,.29,.025,-.15,.88,'#e8cda6',C.roof);conifer(b,.58,.01,.13,.52);return;}
   if(k===8){hut(b,-.25,.015,.03,.86,C.white,C.roof);beacon(placed(b,.34,.03,-.12,.62));return;}
   hut(b,0,.015,-.02,.95,k===4?'#deb79c':'#bfcbb6',k===4?C.roof:C.red,{door:C.teal});
   if(k===13){b.ring(-.32,.37,.343,.093,.026,C.coral);b.rod(.64,.02,.12,.49,.79,-.02,.025,C.beam);crate(b,.47,.02,.31,.62);}
   else{b.rod(-.57,.02,.11,-.57,.95,.11,.023,C.beam);flag(b,-.57,.84,.11,C.gold,.17);}return;
 }
 if(k===5||k===11){
   plankDock(b);const z=-.17;
   b.rod(-.40,.29,z,-.40,1.28,z,.065,C.wood);b.rod(-.45,1.24,z,.43,1.39,z,.055,C.beam);
   b.rod(-.40,.62,z,.10,1.34,z,.036,C.lightWood);b.rod(.34,1.37,z,.34,.77,z,.014,C.navy);
   b.ring(.34,.73,z,.051,.016,C.brass);crate(b,.22,.30,.05,.84);
   if(k===11){b.rod(-.40,1.27,z,-.39,1.55,z,.035,C.beam);b.rod(-.39,1.53,z,.38,1.39,z,.012,C.cream);b.cyl(-.36,.70,.0,.083,.083,.16,C.navy,10,PI/2);crate(b,-.06,.30,.08,.62);}
   else rail(b,-.45,.0,.28,.29,.27);return;
 }
 if(k===6||k===12){
   b.ell(0,.16,0,.36,.18,.36,C.coral);b.cyl(0,.26,0,.284,.34,.095,C.white,12);b.cyl(0,.47,0,.13,.24,.35,C.teal,10);
   if(k===6){b.rod(0,.58,0,0,1.02,0,.033,C.navy);b.ring(0,1.08,0,.105,.030,C.coral);b.ring(0,.65,0,.16,.024,C.gold,PI/2);}
   else{for(const x of [-.155,.155])b.rod(x,.60,0,x,1.17,0,.035,C.gold);
    b.cyl(0,.93,0,.064,.145,.21,C.brass,10);b.ell(0,.80,0,.035,.044,.035,C.beam);b.cyl(0,1.22,0,.025,.239,.17,C.red,8);b.ell(0,1.33,0,.041,.052,.041,lampLight(b));}return;
 }
 if(k===10){tug(b);return;}
 if(w==='wind'){sailing(b,true,true);return;}if(w==='snow'){tug(b,true);return;}
 if(w==='rain'){hull(b,C.teal);b.form([[-.39,0],[-.34,.22],[-.21,.32],[.22,.32],[.35,.22],[.40,0]],.44,-.05,.37,0,C.roof);
  for(const X of [-.35,.24])b.rod(X,.39,.24,X,.64,.24,.021,C.gold);b.box(-.05,.54,.223,.37,.19,.028,C.navy);return;}
 plankDock(b);for(const x of [-.44,.38])b.rod(x,.28,-.17,x,.99,-.17,.03,C.beam);
 for(let i=0;i<6;i++){const x=-.43+i*.135;b.rod(x,.50,-.16,x+.16,.94,-.16,.012,C.cream);b.rod(x,.94,-.15,x+.16,.50,-.15,.012,C.cream);}
 crate(b,.23,.30,.19,.7);for(let i=0;i<3;i++){b.ell(-.25+i*.16,.37,.15,.10,.048,.039,'#8babb0');b.form([[0,0],[-.065,.05],[-.063,-.04]],.025,-.34+i*.16,.37,.15,C.blue);}
}
function horse(b,x,y,z,s,col){
 const q=placed(b,x,y,z,s);
 q.ell(0,0,0,.17,.09,.066,col);
 q.ell(.122,.085,0,.063,.113,.054,col,0,0,-.40);
 q.ell(.18,.145,.0,.088,.051,.051,col,0,0,-.24);
 q.ell(.133,.210,0,.023,.048,.021,col,0,0,-.30);
 q.ell(.013,.058,.0,.067,.047,.078,C.coral);
 for(const [X,Z,D] of [[-.09,.032,-.055],[.08,-.03,.056]])q.rod(X,-.025,Z,X+D,-.16,Z,.024,col,.016);
 q.ell(-.16,-.018,0,.042,.088,.032,C.wood,0,0,-.48);
}
function carousel(b,k,r){
 const hero=k===14,gilded=k===8||hero,s=hero?1.18:1,q=placed(b,0,0,0,s);
 const top=gilded?1.06:.96,R=gilded?.76:.66;
 q.cyl(0,.09,0,R*.96,R,.16,gilded?C.brass:C.red,12);
 q.cyl(0,.19,0,R,R*.97,.07,C.cream,12);
 q.cyl(0,.65,0,.094,.14,.89,C.gold,10);
 move(q,'spinY',[0,0,0],()=>{for(let j=0;j<4;j++){
   const a=j*PI/2+.32,x=R*.71*Math.cos(a),z=R*.71*Math.sin(a);
   q.rod(x,.18,z,x,top,z,.018,C.gold);
   horse(q,x,.52+(j%2)*.08,z,gilded?1.04:.90,[C.ivory,'#afbbb0','#caa38a',C.white][j]);
 }});
 tentCanopy(q,0,top,0,R,gilded?.45:.36,gilded?'#b9685c':C.coral,C.cream,9);
 if(gilded){
   for(let j=0;j<7;j++){
     const a=j*TAU/7,xx=Math.sin(a)*R*.90,zz=Math.cos(a)*R*.90;
     q.ell(xx,top-.015,zz,.035,.036,.033,lampLight(q));
   }flag(q,0,top+.45,0,C.gold,.20);
   if(hero){
     const crest=top+.47;
     q.cyl(0,crest+.031,0,.16,.19,.065,C.brass,10);
     for(let j=0;j<6;j++){const a=j*TAU/6,x=.126*Math.sin(a),z=.126*Math.cos(a);
       q.rod(x,crest+.04,z,x*1.27,crest+.18,z*1.27,.034,C.gold,.014);
       q.ell(x*1.27,crest+.19,z*1.27,.027,.033,.027,lampLight(q));}
     for(let i=0;i<10;i++){const a=i*TAU/10;q.ell(Math.sin(a)*R*.96,.11,Math.cos(a)*R*.96,.039,.032,.039,i%2?C.teal:C.coral);}
   }
 }
}
function ferris(b,gilded){
 const r=gilded?.72:.61,cy=r+.28,z=.02,n=gilded?8:6;
 b.box(0,.045,0,1.12,.09,.63,C.navy);
 for(const zz of [-.20,.17]){
   for(const x of [-.48,.48])b.rod(x,.08,zz,0,cy,zz,.044,C.teal,.035);
   b.rod(-.36,.25,zz,.36,.25,zz,.026,C.gold);
 }
 b.ring(0,cy,z,r,.034,gilded?C.gold:C.coral);b.ring(0,cy,z-.09,r,.022,C.brass);
 for(let j=0;j<n;j++){
   const a=TAU*j/n+.1,x=Math.cos(a)*r,y=cy+Math.sin(a)*r;
   b.rod(0,cy,z,x,y,z,.018,C.gold);b.rod(x,y,-.10,x,y,.13,.018,C.wood);
   move(b,'swingZ',[x,y,.125],()=>{b.rod(x,y,.125,x,y-.13,.125,.012,C.beam);b.box(x,y-.17,.125,.174,.091,.16,[C.coral,C.teal,C.gold,'#a989a1'][j%4]);
   if(gilded)b.form([[-.11,0],[0,.06],[.11,0]],.17,x,y-.063,.125,C.cream);});
 }
 b.cyl(0,cy,.15,.09,.09,.07,C.gold,10,PI/2);b.ell(0,cy,.20,.056,.056,.025,lampLight(b));
}
function chairRide(b,large=false){
 const rr=large?.69:.59,top=large?1.24:1.08;
 b.cyl(0,.088,0,.34,.4,.17,C.teal,12);b.cyl(0,.52,0,.073,.12,.90,C.cream,12);
 tentCanopy(b,0,top,0,rr,.26,large?'#66979a':'#a990b5',C.cream,8);
 move(b,'spinY',[0,0,0],()=>{for(let i=0;i<5;i++){
   const a=TAU*i/5+.22,dx=Math.cos(a),dz=Math.sin(a);
   const x=dx*rr*1.05,z=dz*rr*1.05,y=.35+i%2*.025;
   for(const dt of [-.055,.055])b.rod(dx*rr*.78+dt,top-.03,dz*rr*.78,x+dt,y+.05,z,.010,C.brass);
   b.box(x,y,z,.14,.071,.13,i%2?C.coral:C.teal);
   b.box(x,y+.07,z-.059,.14,.11,.029,C.gold);
 }});
}
function balloons(b,x,y,z,n,r,pastel=false){
 const cols=pastel?['#ecc2bd','#e6bcdb','#b7d5d3','#f3d5a1']:['#c96868','#e5b164','#839ebb','#91afa1','#bc90ab'];
 for(let j=0;j<n;j++){
   const a=j*2.39996,R=.11+.24*Math.sqrt(j/n),X=x+Math.cos(a)*R,Y=y+.52+(1-j/n)*.26+r()*.12,Z=z+Math.sin(a)*R*.73;
   b.rod(x,y,z,X,Y-.10,Z,.008,C.cream);
   b.ell(X,Y,Z,.122,.157,.117,cols[j%cols.length],0,.2,(r()-.5)*.2);
   b.cyl(X,Y-.153,Z,.018,.027,.038,cols[j%cols.length],6);
   b.ell(X-.037,Y+.05,Z+.098,.020,.034,.012,C.ivory);
 }
}
function fair(b,k,w,r){
 if(k===0||k===8||k===14){carousel(b,k,r);return;}
 if(k===1||k===10){ferris(b,k===10);return;}
 if(k===5||k===12){chairRide(b,k===12);return;}
 if(k===2||k===4){
   const R=.62; b.cyl(0,.29,0,R*.87,R,.54,k===2?C.coral:'#7899a0',10);
   for(let j=0;j<10;j++){
     const a=j*TAU/10,x=Math.sin(a)*R*.92,z=Math.cos(a)*R*.92;
     if(j%2===0)b.box(x,.29,z,.18,.48,.036,C.ivory,0,a);
   }b.box(0,.235,R*.94,.29,.46,.054,C.navy);
   if(k===2)tentCanopy(b,0,.56,0,R*1.12,.60,C.coral,C.ivory,10);
   else{b.ell(0,.60,0,.67,.48,.67,'#7e92ad');b.cyl(0,.60,0,.68,.61,.08,C.gold,12);
     for(let j=0;j<8;j++){const a=TAU*j/8;b.rod(Math.sin(a)*.64,.63,Math.cos(a)*.64,0,1.08,0,.014,C.cream);}}
   flag(b,0,k===2?1.12:1.06,0,C.gold,.25);return;
 }
 if(k===3||k===7){if(k===3){cart(b,C.teal);balloons(b,0,.61,0,6,r);}else{b.cyl(0,.09,0,.19,.25,.18,C.gold,9);balloons(b,0,.14,0,9,r);};return;}
 if(k===6||k===13){cart(b,k===13?C.teal:C.red,true);
   if(k===6){for(let i=0;i<3;i++){
     const x=-.32+i*.29;b.ell(x,.72,.02,.082,.09,.064,[C.teal,C.coral,C.gold][i]);
     b.ell(x,.817,.02,.067,.067,.061,C.cream);for(const dx of [-.045,.045])b.ell(x+dx,.865,.01,.026,.031,.025,C.cream);
   }}else{b.box(0,.91,-.11,.67,.56,.11,C.cream);pane(b,0,.93,-.037,.40,.27,C.coral);
     b.box(0,.76,.016,.51,.043,.14,C.gold);flower(b,-.38,.55,.08,.58,C.leaf,'#d99592');}
   return;
 }
 if(k===9){cart(b,C.coral);b.box(0,.91,-.08,.78,.65,.27,'#9b6052');b.box(0,.93,.057,.65,.53,.039,C.gold);
   for(let i=0;i<7;i++){const x=-.24+i*.08,hh=.22+.18*(1-Math.abs(i-3)/3);b.cyl(x,.72+hh/2,.096,.025,.033,hh,C.cream,7);}
   b.form([[-.46,0],[-.35,.11],[-.09,.10],[0,.19],[.09,.10],[.35,.11],[.46,0]],.29,0,1.22,-.06,C.coral);
   b.rod(.40,.72,-.08,.48,.83,-.08,.03,C.wood);b.rod(.48,.83,-.08,.57,.83,-.08,.026,C.gold);return;}
 if(k===11){cart(b,'#9a819b');b.box(0,.91,0,.88,.61,.47,'#9c809c');b.ell(0,1.21,0,.54,.22,.31,C.navy);
   pane(b,-.16,.91,.241,.28,.27,C.gold);b.box(.23,.88,.25,.17,.41,.038,C.teal);
   for(const x of [-.36,.34])b.ell(x,1.18,.27,.035,.035,.021,lampLight(b));
   b.rod(0,1.35,0,0,1.56,0,.016,C.brass);b.ring(0,1.59,0,.072,.022,C.gold);return;}
 cart(b,w==='snow'?C.red:w==='wind'?C.teal:'#c68b86');
 if(w==='clear'){for(let i=0;i<4;i++){const x=-.31+i*.2,z=(i%2-.5)*.14;
   b.rod(x,.60,z,x,.91+i%2*.12,z,.014,C.beam);b.ell(x,.98+i%2*.12,z,.13,.16,.12,['#edc8bd','#dad4e4','#e7b6cc','#b5d9d1'][i]);}return;}
 if(w==='rain'){b.rod(0,.60,0,0,1.24,0,.031,C.gold);tentCanopy(b,0,1.17,0,.52,.27,'#a9a6ba',C.ivory,8);
   for(let i=0;i<4;i++){b.rod(-.32+i*.2,.62,.10,-.32+i*.2,.84,.10,.012,C.cream);b.ell(-.32+i*.2,.88,.10,.06,.066,.046,[C.coral,C.gold,C.teal,'#af82ae'][i]);}return;}
 if(w==='wind'){for(let i=0;i<3;i++){const x=-.30+i*.31,H=1.13+(i%2)*.23; b.rod(x,.59,0,x,H,0,.012,C.wood);
   b.form([[0,.21],[.14,.03],[0,-.23],[-.14,.03]],.026,x,H,0,[C.gold,C.teal,C.coral][i],0,i*.18-.15,-.08);
   b.rod(x,H-.23,.013,x-.07,H-.41,.02,.010,C.coral);}return;}
 b.cyl(-.20,.79,0,.12,.15,.34,C.brass,12);b.cyl(-.2,.99,0,.04,.141,.075,C.cream,10);
 for(const x of [.10,.31]){b.cyl(x,.68,.08,.068,.052,.14,C.ivory,10);b.ring(x+.068,.70,.08,.037,.011,C.ivory);}
 b.box(0,.61,0,.92,.035,.51,C.snow);
}
function bridge(b,chinese=false,hero=false){
 const q=placed(b,0,0,0,hero?1.14:1);
 const profile=[[-.84,0],[-.84,.24],[-.60,.36],[-.31,.49],[0,.56],[.31,.49],[.60,.36],[.84,.24],[.84,0],[.50,0],[.45,.16],[.31,.29],[.15,.36],[0,.38],[-.15,.36],[-.31,.29],[-.45,.16],[-.50,0]];
 q.form(profile,.56,0,.065,0,chinese?'#a0a495':'#99a5a3');
 const span=[[-.80,.30],[-.52,.42],[-.25,.54],[0,.59],[.25,.54],[.52,.42],[.80,.30]];
 for(const z of [-.27,.27]){
   for(let i=0;i<span.length;i++){
     const [x,y]=span[i];q.cyl(x,y+.073,z,.037,.049,.165,chinese?'#acae9e':C.darkStone,6);
     q.ell(x,y+.175,z,.052,.052,.052,chinese?C.cream:C.snow);
     if(i){const [px,py]=span[i-1];q.rod(px,py+.13,z,x,y+.13,z,.026,chinese?C.stone:C.snow);}
   }
 }
 for(let i=0;i<9;i++){
   const a=PI*(i+.5)/9,x=Math.cos(a)*.51,y=.06+Math.sin(a)*.38;
   q.rod(x,y,.289,x+Math.cos(a)*.09,y+Math.sin(a)*.09,.289,.014,C.darkStone);
 }
 water(q,0,0,.66,.45);if(hero){willow(placed(q,-.71,.02,-.19,.73),false,5);lamp(q,.76,.29,.28,.54);}
}
function shelter(b,rain=false){
 b.box(0,.06,0,1.2,.12,.68,C.darkStone);
 for(const x of [-.45,.45])for(const z of [-.20,.20])b.rod(x,.10,z,x,.90,z,.044,C.wood);
 b.box(0,.55,-.21,.97,.63,.068,rain?'#859a8b':C.lightWood);
 b.box(0,.34,0,.82,.075,.27,C.wood);
 for(const x of [-.30,.30])b.rod(x,.10,.02,x,.32,.02,.046,C.beam);
 roof(b,0,.92,0,1.17,.73,.30,rain?C.roof:C.coral,!rain);b.box(-.20,.63,-.16,.25,.23,.023,C.cream);
 for(let i=0;i<3;i++)b.box(-.20,.68-i*.05,-.142,.14-i*.012,.015,.014,C.darkStone);
}
function animal(b,dog=false){
 const col=dog?'#c8945d':'#d5d1b5',leg=dog?'#977252':'#7d7c69';
 b.ell(0,.42,0,.34,.17,.145,col,0,0,-.045);
 for(const X of [-.19,.19])for(const Z of [-.084,.09]){
   const foot=X+(X<0?-.034:.035)+(Z<0?.034:0);
   b.rod(X,.37,Z,foot,.10,Z-.014,.044,leg,.031);
   b.ell(foot+.014,.068,Z-.016,.055,.043,.041,dog?C.cream:C.black);
 }
 b.ell(.27,.58,.008,.117,.165,.105,col,0,0,-.38);b.ell(.37,.70,.025,.14,.114,.112,col);
 b.ell(.485,.67,.044,.097,.070,.072,dog?C.cream:col);
 b.ell(.56,.68,.052,.029,.028,.046,C.black);b.ell(.402,.717,.122,.017,.019,.014,C.black);
 if(dog){for(const side of [-1,1])b.ell(.30,.733,side*.09,.068,.091,.047,'#875d44',0,0,-.19);
   b.rod(-.28,.47,0,-.42,.65,0,.065,col,.037);b.rod(-.42,.65,0,-.34,.76,0,.037,C.cream,.01);
   b.box(.014,.51,0,.24,.12,.29,C.coral);b.rod(.145,.53,.14,.146,.35,.14,.019,C.navy);}
 else{
   for(const Z of [-.071,.088]){b.rod(.33,.77,Z,.26,.91,Z,.035,C.brass,.026);b.rod(.26,.91,Z,.15,.96,Z,.026,C.beam,.018);b.rod(.15,.96,Z,.11,.88,Z,.018,C.beam,.008);}
   b.ell(.41,.604,.062,.028,.064,.033,C.cream,0,0,-.22);
   b.ell(-.32,.48,0,.071,.055,.046,col,0,0,-.42);
 }
}
function sled(b){
 for(const z of [-.19,.19]){
   b.rod(-.60,.075,z,.43,.075,z,.033,C.beam);
   b.rod(.43,.075,z,.56,.14,z,.033,C.beam);b.rod(.56,.14,z,.61,.23,z,.030,C.beam);
   for(const x of [-.34,.27])b.rod(x,.09,z,x+.055,.29,z,.026,C.wood);
 }
 for(let i=0;i<6;i++)b.box(-.35+i*.14,.30,0,.128,.049,.42,C.lightWood);
 b.rod(-.27,.38,-.20,-.27,.63,-.20,.025,C.beam);b.rod(-.27,.38,.20,-.27,.63,.20,.025,C.beam);
 b.box(-.27,.53,0,.054,.18,.42,C.coral);
 b.box(.04,.365,0,.42,.075,.35,'#a17d78');b.rod(.61,.22,-.18,.80,.65,0,.013,C.coral);b.rod(.61,.22,.18,.80,.65,0,.013,C.coral);
}
function gondola(b,x=0,y=0,z=0,s=1){
 const q=placed(b,x,y,z,s);move(q,'swingZ',[.2,.94,0],()=>{q.form([[-.33,.035],[-.38,.11],[-.33,.48],[-.23,.59],[.24,.59],[.34,.48],[.39,.10],[.31,.035]],.42,0,.035,0,C.coral);
 q.box(0,.59,0,.56,.066,.45,C.navy);
 for(const X of [-.20,.0,.20])q.box(X,.405,.218,.16,.22,.026,'#bcd5cc');
 q.box(.348,.369,0,.025,.19,.31,'#9bbcb8');q.box(.348,.367,0,.032,.20,.022,C.navy);
 q.rod(0,.61,0,0,.82,0,.036,C.beam);q.rod(0,.82,0,.19,.93,0,.036,C.beam);
 q.cyl(.20,.94,0,.065,.065,.06,C.navy,10,PI/2);q.box(0,.143,.222,.69,.035,.026,C.cream);});
}
function alpineStation(b,hero=false){
 const q=placed(b,0,0,0,hero?1.12:.94);
 hut(q,-.27,.01,-.04,.92,'#ceb496',C.coral,{snow:true,trim:C.red,chimney:false});
 for(const z of [-.22,.25])q.rod(.36,.05,z,.35,1.28,z,.062,C.navy);
 q.box(.34,1.26,.015,.30,.13,.64,C.wood);
 for(const z of [-.24,.25]){
  q.cyl(.38,1.36,z,.105,.105,.072,C.black,10,PI/2);
  q.rod(-.50,1.43,z,.79,1.43,z,.014,C.beam);
 }
 gondola(q,.51,.64,.25,.64);
 if(hero){
   conifer(q,-.74,.01,.15,.71,true);flag(q,-.47,1.02,-.26,C.coral,.47);
   for(const x of [-.89,-.70])stone(q,x,.056,-.16,.19,C.snow);
   q.rod(-.98,1.58,-.23,.40,1.43,-.23,.013,C.navy);
   gondola(q,-.88,.97,-.23,.66);
 }
}
function train(b){
 for(const z of [-.16,.16])b.rod(-.77,.08,z,.76,.08,z,.027,C.darkStone);
 for(let i=0;i<6;i++)b.box(-.65+i*.255,.037,0,.085,.07,.50,C.beam);
 b.box(0,.27,0,1.13,.11,.44,C.navy);
 for(const z of [-.225,.225])for(const x of [-.38,-.02,.32])b.cyl(x,.205,z,.10,.10,.056,C.red,12,PI/2);
 b.cyl(.19,.50,0,.18,.18,.58,C.teal,12,0,0,PI/2);
 b.cyl(.49,.50,0,.16,.16,.045,C.brass,12,0,0,PI/2);
 b.box(-.33,.59,0,.39,.49,.41,C.red);b.box(-.33,.86,0,.45,.063,.50,C.navy);
 pane(b,-.33,.68,.210,.23,.22,C.cream);b.cyl(.34,.75,0,.087,.066,.27,C.black,10);
 b.cyl(.34,.90,0,.105,.09,.06,C.brass,10);b.ell(.54,.57,0,.040,.073,.066,lampLight(b));
 b.rod(-.38,.22,.276,.32,.22,.276,.019,C.brass);b.box(.60,.225,0,.18,.095,.50,C.coral);
}
function alpine(b,k,w,r){
 if(k===0){conifer(b,-.21,0,.02,1.16,true);conifer(b,.25,.015,-.08,.87,true);stone(b,.12,.051,.19,.15,C.snow);return;}
 if(k===1){let y=0;for(const [s,x] of [[.38,.01],[.29,-.05],[.21,.02],[.13,-.03]]){stone(b,x,y+s*.32,0,s,C.rock);y+=s*.66;}
   b.rod(.36,.01,.02,.36,1.03,.02,.033,C.wood);
   for(const [H,dir,col] of [[.82,1,C.coral],[.99,-1,C.cream]])b.form([[0,-.045],[.28*dir,-.045],[.34*dir,0],[.28*dir,.048],[0,.048]],.055,.36,H,.02,col);
   return;}
 if(k===2){for(const x of [-.39,.39])b.rod(x,.02,-.08,x,.75,-.08,.042,C.beam);
   b.rod(-.48,.69,-.05,.48,.69,-.05,.036,C.lightWood);
   for(let j=0;j<4;j++){const x=-.29+j*.19,rot=-.13+j*.068,H=.99+(j%2)*.11,col=[C.red,C.teal,C.gold,C.navy][j];
     b.form([[-.042,0],[.038,0],[.039,H-.08],[.012,H],[.0,H+.025],[-.046,H-.07]],.049,x,.015,.025,col,0,.1,rot);
     b.box(x-.014,.46,.062,.060,.11,.06,C.beam);};return;}
 if(k===3){shelter(b);return;}if(k===4){stone(b,-.22,.14,-.08,.47,C.rock);stone(b,.28,.08,.12,.27,C.stone);animal(placed(b,-.12,.29,-.02,.93));return;}
 if(k===5){for(let i=0;i<5;i++)flower(b,(i-2)*.15,.025,(i%2-.5)*.19,.70+r()*.31,C.leaf,i%2?C.white:'#e8e2b7');stone(b,.31,.07,.11,.16,C.rock);return;}
 if(k===6){for(const x of [-.6,0,.6]){b.rod(x,.03,0,x,.67,0,.04,C.wood);b.cyl(x,.69,0,.016,.055,.06,C.snow,6);}
   for(const h of [.26,.51]){b.rod(-.64,h,0,.63,h-.03,0,.05,C.lightWood);b.rod(-.64,h+.036,0,.63,h+.012,0,.021,C.snow);}
   conifer(b,-.48,0,-.19,.56,true);return;}
 if(k===7){water(b,0,0,.68,.45);plankDock(b);for(const z of [-.23,.23])rail(b,-.54,.54,z,.29,.36,C.wood);stone(b,-.56,.08,.02,.24,C.rock);return;}
 if(k===8||k===14){alpineStation(b,k===14);return;}
 if(k===9){bridge(b);return;}
 if(k===10){train(b);return;}
 if(k===11){for(const x of [-.54,.52])b.rod(x,.015,-.12,x,1.54,-.12,.046,C.navy);
   b.rod(-.58,1.51,-.12,.59,1.51,-.12,.039,C.brass);gondola(b,-.02,.47,-.12,1.09);return;}
 if(k===12){hut(b,-.14,0,-.02,.97,C.white,C.coral,{snow:true,chimney:false,trim:C.wood});
   b.box(.31,.78,.12,.33,1.53,.34,C.cream);b.cyl(.31,1.71,.12,0,.30,.44,C.navy,4,0,PI/4);
   b.cyl(.31,1.33,.302,.106,.106,.035,C.brass,12,PI/2);b.cyl(.31,1.33,.326,.087,.087,.022,C.ivory,12,PI/2);
   b.rod(.31,1.33,.344,.31,1.39,.344,.009,C.navy);b.rod(.31,1.33,.344,.36,1.31,.344,.01,C.navy);
   b.rod(.31,1.91,.12,.31,2.10,.12,.018,C.brass);b.rod(.25,2.04,.12,.37,2.04,.12,.013,C.brass);
   return;}
 if(k===13){hut(b,0,0,-.06,1.05,'#ddc6a7',C.coral,{snow:true,trim:C.red});for(const x of [-.40,-.115,.28,.48])b.box(x,.50,.319,.054,.25,.037,C.red);return;}
 if(w==='rain'){shelter(b,true);return;}if(w==='snow'){sled(b);return;}
 if(w==='wind'){stone(b,0,.08,0,.25,C.rock);b.rod(0,.05,0,0,1.45,0,.031,C.wood);
   for(let i=0;i<5;i++)b.cyl(.09+i*.12,1.36-i*.025,0,.131-i*.017,.144-i*.017,.145,i%2?C.ivory:C.coral,9,0,0,PI/2-.14);return;}
 animal(b,true);b.rod(-.48,0,-.13,-.48,.86,-.13,.028,C.wood);flag(b,-.48,.80,-.13,C.coral,.15);
}
function willow(b,large=false,branches=8){
 const s=large?1.18:.94,q=placed(b,0,0,0,s);
 q.rod(-.05,.02,0,.04,.62,0,.112,C.bark,.077);q.rod(.04,.60,0,-.09,1.13,.01,.078,C.bark,.044);
 for(let i=0;i<branches;i++){
   const a=i*2.39996,r=.29+(i%3)*.075,X=Math.cos(a)*r,Z=Math.sin(a)*r*.82,H=.97+(i%3)*.13;
   q.rod(-.03,.70,0,X*.79,H,Z*.79,.044,C.bark,.027);
   q.ell(X*.75,H-.02,Z*.73,.22,.14,.19,i%2?'#95ab77':'#809c72');
   const ends=large?3:2;
   for(let j=0;j<ends;j++){
     const off=(j-(ends-1)/2)*.085,h=.37+(i%3)*.07+j*.028,x=X+off,z=Z+j*.036;
     q.rod(X*.80+off,H-.015,Z*.8,x,H-h*.45,z,.019,'#889f69',.013);
     q.rod(x,H-h*.45,z,x-.04,H-h,z+.023,.012,'#93a76b',.005);
     q.ell(x-.02,H-h*.72,z+.014,.031,.079,.018,i%3?'#91a977':'#708e69',0,0,-.33);
   }
 }
}
function chinaRoof(b,x,y,z,w,d,col=C.navy){
 // The beam rises at each eave and drops between the turned tip and the central ridge.
 const upper=[[-.61,.15],[-.52,.095],[-.37,.09],[-.20,.15],[0,.34],[.20,.15],[.37,.09],[.52,.095],[.61,.15]];
 const profile=[...upper,...upper.slice().reverse().map(([a,c])=>[a,c-.067])].map(([a,c])=>[a*w,c*w]);
 b.form(profile,d,x,y,z,col);
 for(const side of [-1,1]){
   const Z=z+side*d*.502;
   for(let i=1;i<upper.length;i++)b.rod(x+upper[i-1][0]*w,y+upper[i-1][1]*w,Z,x+upper[i][0]*w,y+upper[i][1]*w,Z,.014,C.stone);
 }
 b.rod(x,y+.347*w,z-d*.52,x,y+.347*w,z+d*.52,.032,C.darkStone);
}
function sampan(b,covered=false,umbrella=false){
 hull(b,'#735f46');b.box(0,.375,0,1.00,.035,.37,C.wood);
 for(const x of [-.42,.21])b.box(x,.42,0,.105,.05,.41,C.lightWood);
 if(covered){
   b.form([[-.35,0],[-.335,.14],[-.25,.26],[-.1,.32],[.12,.32],[.27,.26],[.34,.14],[.35,0]],.46,-.03,.39,0,'#918464');
   for(const z of [-.24,.24]){b.box(-.03,.481,z,.44,.16,.029,C.beam);
   for(const x of [-.22,-.04,.14])b.rod(x,.39,z,x,.63,z,.014,C.cream);}
   crate(b,.44,.36,-.017,.70);b.ell(-.52,.44,0,.12,.09,.12,C.cream);
 }else{
   b.rod(-.56,.32,-.23,.22,1.01,.18,.023,C.lightWood,.013);
   b.rod(-.59,.32,.21,.17,.92,-.23,.019,C.wood,.014);
   b.box(-.25,.38,.01,.25,.04,.34,C.red);
 }
 if(umbrella){b.rod(-.16,.43,0,-.16,1.11,0,.020,C.beam);tentCanopy(b,-.16,1.05,0,.37,.20,'#cb897a',C.cream,8);}
}
function pavilion(b){
 const q=b;q.cyl(0,.085,0,.57,.62,.17,C.stone,8,0,PI/8);
 q.cyl(0,.19,0,.54,.55,.06,C.lightWood,8,0,PI/8);
 for(const x of [-.32,.32])for(const z of [-.22,.22])q.rod(x,.20,z,x,.94,z,.037,'#935c48');
 for(const z of [-.22,.22])q.rod(-.36,.92,z,.36,.92,z,.034,C.coral);
 q.box(0,.92,0,.83,.08,.62,C.beam);chinaRoof(q,0,.96,0,1.08,.83);
 q.cyl(0,1.38,0,.035,.16,.15,C.navy,6);q.ell(0,1.48,0,.047,.075,.047,C.brass);
 rail(q,-.31,.31,-.22,.22,.23,C.red);
 stripedLantern(q,.31,.81,.23,.101,C.red);
}
function fanMill(b,x,y,z,s=.69){
 const q=placed(b,x,y,z,s);q.rod(0,.02,0,0,1.1,0,.032,C.wood);
 move(q,'spinZ',[0,1.06,.026],()=>{
  for(let i=0;i<4;i++){
   const a=i*PI/2+.21;q.form([[0,0],[.29,.05],[.23,.23],[.05,.14]],.023,0,1.06,.026,i%2?C.coral:C.gold,0,0,a);
  }q.ell(0,1.06,.066,.042,.041,.022,C.brass);
 });
}
function wheelHouse(b){
 hut(b,-.29,0,-.04,.77,'#d7d4b7',C.navy,{chimney:false});
 const x=.29,y=.51,z=.20,rr=.42;
 for(const X of [x-.17,x+.17])b.rod(X,.01,z-.16,X,.62,z-.16,.049,C.wood);
 move(b,'spinZ',[x,y,z],()=>{
   for(const Z of [z-.09,z+.10])b.ring(x,y,Z,rr,.032,C.wood);
   for(let j=0;j<10;j++){const a=TAU*j/10,dx=Math.cos(a)*rr,dy=Math.sin(a)*rr;
     b.rod(x,y,z,x+dx,y+dy,z,.025,C.lightWood);
     b.box(x+dx,y+dy,z,.13,.047,.25,C.lightWood,0,0,a+PI/2);}
 });b.cyl(x,y,z+.13,.076,.076,.11,C.brass,9,PI/2);water(b,x,.01,.53,.34);
}
function basket(b,x,y,z,r,col=C.ochre){
 b.cyl(x,y+.12*r,z,.25*r,.17*r,.24*r,col,10);
 b.ring(x,y+.24*r,z,.25*r,.019*r,C.lightWood,PI/2);
 b.ring(x,y+.25*r,z,.17*r,.014*r,C.wood);
}
function lotus(b){
 water(b,0,0,.70,.44);
 for(let i=0;i<7;i++){const a=i*2.39996,r=.16+i*.044,x=Math.cos(a)*r,z=Math.sin(a)*r*.65;
   b.ell(x,.09,z,.15,.025,.12,i%2?'#759776':'#94a67a',0,a);
   if(i%3===0){b.rod(x,.06,z,x+.02,.25,z,.012,C.leaf);
     for(let j=0;j<6;j++){const aa=TAU*j/6;b.ell(x+.02+Math.cos(aa)*.045,.275,z+Math.sin(aa)*.045,.047,.076,.030,i%2?'#d69d9a':'#e5b2af',.28,aa,-.22);}
     b.ell(x+.02,.28,z,.036,.031,.036,C.gold);}
 }
}
function canal(b,k,w,r){
 if(k===0){lotus(b);return;}if(k===1||k===9){sampan(b,k===9);return;}
 if(k===2){for(let i=0;i<4;i++)b.box(0,.05+i*.049,.32-i*.15,1.05,.10+i*.10,.17,i%2?'#adb0a3':'#939e94');
   for(const x of [-.49,.49]){b.cyl(x,.49,-.13,.052,.064,.29,C.darkStone,8);b.ell(x,.65,-.13,.069,.045,.069,C.stone);}
   b.ring(-.39,.135,.26,.058,.014,C.brass);water(b,0,.40,.59,.26);return;}
 if(k===3||k===11){willow(b,k===11);return;}
 if(k===4){b.box(0,.52,0,1.04,.98,.18,'#d9d9bc');b.box(0,.096,0,1.11,.19,.23,C.stone);
   b.box(0,.56,.10,.62,.54,.034,C.beam);b.box(0,.56,.126,.53,.47,.017,'#a7c0a9');
   for(let i=-1;i<=1;i++){const x=i*.15;b.box(x,.56,.146,.018,.45,.025,C.beam);
     b.box(0,.56+i*.13,.147,.52,.021,.025,C.beam);}
   b.ring(0,.56,.171,.154,.020,C.beam);chinaRoof(b,0,1.00,0,.97,.28);return;}
 if(k===5){cart(b,'#9a7258');for(const x of [-.39,.40])b.rod(x,.60,-.04,x,1.38,-.04,.025,C.wood);
   b.rod(-.45,1.36,-.04,.45,1.36,-.04,.031,C.beam);
   for(const [x,y,s] of [[-.26,1.12,.15],[.01,1.15,.12],[.27,1.10,.17]]){b.rod(x,1.36,-.04,x,y+.10,-.04,.008,C.wood);stripedLantern(b,x,y,-.04,s,C.red);}return;}
 if(k===6){water(b,0,0,.58,.32);for(let j=0;j<11;j++){
   const a=j*2.39996,R=.10+.3*r(),x=Math.cos(a)*R,z=Math.sin(a)*R*.62,H=.43+.43*r(),lean=(r()-.5)*.2;
   b.rod(x,.035,z,x+lean,H,z,.015,'#7b9566',.008);
   b.ell(x+lean,H+.044,z,.025,.083,.024,'#a9865b',0,0,-lean*2);
   b.ell(x+.03,.30,z,.022,.19,.025,C.leaf,0,0,-.41);
  }return;}
 if(k===7){b.box(0,.11,0,.65,.22,.50,C.darkStone);b.box(0,.253,0,.58,.09,.44,C.stone);
   b.ell(-.055,.50,0,.22,.24,.17,C.stone);b.ell(.085,.72,.045,.175,.17,.151,C.stone);
   for(let i=0;i<8;i++){const a=TAU*i/8;b.ell(.072+Math.cos(a)*.132,.73+Math.sin(a)*.13,.10,.054,.055,.056,'#9ca697');}
   b.ell(.148,.685,.135,.096,.06,.065,'#aeb4a1');b.ell(.130,.747,.177,.021,.018,.018,C.darkStone);
   for(const x of [-.11,.15])b.ell(x,.341,.101,.09,.061,.08,C.stone);
   b.ring(-.24,.57,-.036,.096,.032,C.stone);
   return;}
 if(k===8||k===14){bridge(b,true,k===14);return;}if(k===10){pavilion(b);return;}
 if(k===12){wheelHouse(b);return;}
 if(k===13){plankDock(b);const q=placed(b,0,.29,-.075,.93);q.box(0,.36,0,.98,.72,.61,'#d9d6b9');
   chinaRoof(q,0,.75,0,1.08,.79);q.box(0,.36,.317,.45,.44,.03,C.beam);
   pane(q,-.34,.46,.313,.20,.24);pane(q,.34,.46,.313,.20,.24);q.box(0,.23,.38,.60,.062,.23,C.wood);
   stripedLantern(q,.44,.68,.40,.108,C.coral);q.cyl(-.14,.32,.41,.055,.047,.115,C.ivory,9);return;}
 if(w==='rain'){sampan(b,false,true);return;}
 if(w==='wind'){for(const [x,H] of [[-.34,.84],[.00,1.17],[.34,.91]])fanMill(b,x,0,0,H);b.rod(-.45,.33,-.035,.45,.33,-.035,.031,C.wood);return;}
 if(w==='snow'){b.cyl(0,.13,0,.32,.25,.26,C.beam,10);b.cyl(0,.29,0,.46,.43,.075,C.wood,12);
   b.cyl(0,.36,0,.155,.12,.11,C.coral,10);b.ell(0,.49,0,.14,.125,.13,C.navy);b.cyl(0,.608,0,.053,.074,.047,C.brass,8);
   b.ring(-.14,.53,0,.067,.017,C.navy);b.rod(.08,.48,0,.22,.55,0,.049,C.navy,.031);
   for(const x of [-.26,.28]){b.cyl(x,.38,.13,.049,.034,.077,C.ivory,9);b.box(x,.105,.45,.29,.16,.21,C.red);}
   return;}
 for(const x of [-.33,.33]){
   basket(b,x,.025,0,.86);for(let i=0;i<5;i++){const a=TAU*i/5;b.ell(x+Math.cos(a)*.113,.265,Math.sin(a)*.104,.067,.065,.063,i%2?'#c98a50':'#bd6459');}
   b.rod(x,.28,-.13,x,.58,0,.014,C.wood);b.rod(x,.28,.13,x,.58,0,.014,C.wood);
 }b.rod(-.48,.58,0,.48,.58,0,.022,C.beam);b.ell(0,.52,0,.065,.045,.055,C.cream);
}
function move(b,type,p,draw){if(typeof b.motion==='function')b.motion(type,p,draw);else draw();}

function paintedBuilder(base,theme,rng){
 const paint={};
 const reds={harbor:[C.coral,'#ab5950','#c07558'],fair:[C.coral,'#bd7993','#a874a2'],
   alpine:[C.coral,'#ac594c','#b56a4e'],canal:[C.coral,'#b26955','#ab545b']};
 const fills=reds[theme]||reds.harbor;
 paint[C.coral]=pick(rng,fills);
 paint[C.teal]=pick(rng,[C.teal,'#518991','#759483']);
 paint[C.roof]=pick(rng,theme==='canal'?[C.roof,'#506263','#4c5a61']:[C.roof,'#667c77','#526d7d']);
 paint[C.lightWood]=pick(rng,[C.lightWood,'#b68b64','#c09b73']);
 paint[C.cream]=pick(rng,[C.cream,'#ecdcba','#eadaaf']);
 const result={glow:c=>base.glow(c),motion:(type,p,draw)=>move(base,type,p,draw)};
 const slots={box:6,ell:6,cyl:6,rod:7,ring:5,form:5};
 for(const [name,slot] of Object.entries(slots)){
   result[name]=(...args)=>{args[slot]=paint[args[slot]]||args[slot];base[name](...args);};
 }
 return result;
}

export function builtModel(b,theme,kind,weather='clear',rng=Math.random){
 b=paintedBuilder(b,theme,rng);
 const k=Number.isInteger(kind)?kind:0,w=['rain','wind','snow'].includes(weather)?weather:'clear';
 if(theme==='harbor'){
   const watercraft=[1,6,9,10,12].includes(k)||(k===15&&w!=='clear');
   if(watercraft)move(b,'bob',[0,0,0],()=>harbor(b,k,w,rng));else harbor(b,k,w,rng);
 }else if(theme==='fair')fair(b,k,w,rng);
 else if(theme==='alpine')alpine(b,k,w,rng);
 else if(theme==='canal'){
   if([1,9].includes(k)||(k===15&&w==='rain'))move(b,'bob',[0,0,0],()=>canal(b,k,w,rng));else canal(b,k,w,rng);
 }
}
