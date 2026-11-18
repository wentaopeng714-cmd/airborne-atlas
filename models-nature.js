// Sculptures are modeled upright in local space. +Z is the little scene's front.
const PI=Math.PI, TAU=PI*2;
const cream='#efe1bc',brass='#bd8c48',gold='#e2b960',bronze='#786243',copper='#a16c4e',patina='#65948c';
const green='#587a4e',sage='#9bab72',bark='#806148',umber='#684f3e',moss='#718653';
const ink='#344a47',pearl='#f3e6d7',reef='#55978e',blush='#de9085';
const pick=(r,a)=>a[Math.floor(r()*a.length)];
function stroke(b,pts,r,col,taper=.82){
 for(let i=1;i<pts.length;i++)b.rod(...pts[i-1],...pts[i],r*(1-(1-taper)*(i-1)/(pts.length-1)),col,r*(1-(1-taper)*i/(pts.length-1)),7);
}
function stem(b,x,y,z,h,bend=.12){
 stroke(b,[[x,y,z],[x+bend*.16,y+h*.43,z-.018],[x+bend,y+h,z+.025]],.026,green,.62);
}
function leaf(b,x,y,z,h,w,col,roll=0,yaw=0,lean=.04){
 b.form([[0,0],[-w*.76,h*.22],[-w,h*.46],[-w*.48,h*.77],[w*.08,h],[w*.57,h*.75],[w*.92,h*.44],[w*.54,h*.19]],.023,x,y,z,col,lean,yaw,roll);
}
function sprig(b,x,y,z,s,r,number=5){
 for(let j=0;j<number;j++){const a=j*2.399+r()*.26;leaf(b,x+Math.cos(a)*.04*s,y,z+Math.sin(a)*.055*s,(.28+r()*.42)*s,.078*s,pick(r,[green,sage,'#779562']),-.57*Math.cos(a),a*.38,.36*Math.sin(a));}
}
function stones(b,r,s=1,pal=[moss,'#a29a7e','#8e977c']){
 for(let i=0;i<5;i++){const a=i*2.4+.4,rad=(.2+r()*.20)*s;
  b.ell(Math.cos(a)*rad,.055*s,Math.sin(a)*rad,(.09+r()*.11)*s,(.045+r()*.07)*s,(.08+r()*.08)*s,pick(r,pal),r()*.19,r()*3,r()*.15);}
}
function island(b,r,s=1,seabed=false){
 b.ell(0,.065*s,0,.57*s,.10*s,.36*s,seabed?'#789997':'#78845a',0,-.18,0);
 stones(b,r,s,seabed?['#83b1a8','#a6b3a0','#bdb298']:[moss,'#9ba46e','#86896b']);
}
function petalHead(b,x,y,z,r,colors,n=6,type='cup',rotation=0){
 for(let j=0;j<n;j++){
  const a=j*TAU/n+rotation,c=Math.cos(a),sn=Math.sin(a);
  if(type==='cup'){
   const profile=[[-.076,.0],[-.24,.20],[-.45,.48],[-.49,.70],[-.40,.87],[-.26,.89],[-.17,.97],[-.04,.94],[.10,1.00],[.22,.93],[.36,.92],[.48,.79],[.45,.53],[.29,.26],[.08,.04]].map(([u,v])=>[u*r,v*r]);
   b.form(profile,.06*r,x,y,z+(j%2)*.034*r,colors[j%colors.length],-.37+.12*sn,.16*c,a-PI/2);
   b.ell(x+c*r*.46,y+sn*r*.43,z+.10*r-sn*r*.13,.035*r,.22*r,.018*r,colors[(j+1)%colors.length],-.35,0,a-PI/2+.13);
  }else b.ell(x+c*r*.55,y+sn*r*.43,z-.08*r+sn*r*.21,r*.135,r*.52,r*.12,colors[j%colors.length],.22+.22*sn,.13*c,a-PI/2);
 }
 b.ell(x,y,z+r*.15,r*.247,r*.21,r*.165,type==='cup'?'#41473e':'#cd9d46');
 b.ell(x-r*.033,y+r*.035,z+r*.265,r*.137,r*.13,r*.071,type==='cup'?'#9c9e62':'#edd17a');
 if(type==='cup')for(let j=0;j<8;j++){const a=j*TAU/8;b.ell(x+.182*r*Math.cos(a),y+.143*r*Math.sin(a),z+.268*r,.026*r,.034*r,.025*r,'#dcc583');}
}
function poppies(b,r,wild){
 const color=wild?['#d45864','#f08078','#e76064','#ff9a86']:['#df4e34','#ef6941','#f58152','#c54432'];
 for(let i=0;i<(wild?3:2);i++){
  const x=(i-(wild?1:.5))*(wild?.34:.63),h=(i===0?1.16:1.45)*(wild?.83:1)+r()*.18,z=(i%2?-.08:.10);
  const bend=(i%2?.1:-.13);stem(b,x,0,z,h,bend);
  leaf(b,x,h*.22,z,.42,.09,sage,-.75,i*.32);leaf(b,x+.01,h*.46,z,.39,.085,green,.84,-.2);
  petalHead(b,x+bend,h,z+.03,(wild?.245:.34)*(1+r()*.14),color,wild?5:6,'cup',r()*.45);
 }
 const x=.11;stroke(b,[[0,0,.04],[x,.48,.04],[x+.08,.87,.10],[x+.17,.78,.12]],.017,green);
 b.ell(x+.17,.77,.12,.064,.092,.064,'#88976d',0,0,-.15);sprig(b,-.2,.02,.05,.65,r,3);
}
function lupines(b,r){
 const cols=pick(r,[['#695e96','#9582b1','#bdacd0'],['#6676aa','#8d9dc4','#bdc9d9']]);
 for(let k=0;k<3;k++){
  const x=(k-1)*.35,z=k===1?-.13:.08,h=(k===1?1.74:1.30)+r()*.14;
  stem(b,x,.02,z,h,.05);
  for(let y=0;y<7;y++){
   const t=y/7,rad=.115*(1-t*.70);for(let q=0;q<2;q++){
    const a=(y*.78+q*PI),xx=x+.04+Math.cos(a)*rad*.62,zz=z+Math.sin(a)*rad*.69;
    b.ell(xx,h*(.49+t*.49),zz,rad,rad*.93,rad*.85,cols[(y+q)%3],.22,a,.35*Math.cos(a));
   }
  }
  for(let j=0;j<3;j++)leaf(b,x,.08+j*.06,z,.44,.058,green,(j-1)*.77,j*.48);
 }
}
function daisies(b,r){
 const col=pick(r,[['#fff9db','#efebc9'],['#f2bd5d','#f0ce76']]);
 for(let j=0;j<5;j++){const a=j*2.399,rad=j?.25+r()*.23:.02,x=Math.cos(a)*rad,z=Math.sin(a)*rad*.66,h=.73+r()*.48;
  stem(b,x*.74,0,z,h,x*.28);petalHead(b,x*1.02,h,z+.03,.19+r()*.08,col,9,'daisy',a);leaf(b,x*.74,h*.3,z,.28,.046,green,j%2?.68:-.61);
 }
}
function bellflowers(b,r){
 for(let k=0;k<2;k++){
  const x=(k-.5)*.56,z=k*.10,h=1.35+r()*.20;stem(b,x,0,z,h,.10);
  for(let j=0;j<4;j++){
   const side=j%2?-1:1,yy=h-.05-j*.19,xx=x+side*(.11+j*.026);
   stroke(b,[[x+.08,yy,z],[xx,yy+.075,z],[xx+side*.035,yy-.025,z+.025]],.012,green);
   const sz=.73+j*.080;b.cyl(xx,yy-.09,z+.03,.046*sz,.105*sz,.16*sz,j%2?'#a28ebc':'#8776a8',8,0,0,side*.10);
   for(let n=0;n<4;n++){const a=TAU*n/4;b.ell(xx+.077*sz*Math.cos(a),yy-.18*sz,z+.03+.060*sz*Math.sin(a),.041*sz,.040*sz,.037*sz,'#bbabd0');}
  }
  leaf(b,x,.16,z,.65,.085,sage,k?.59:-.60);
 }
}
function iris(b,r){
 for(let j=0;j<6;j++){const a=j*2.40;leaf(b,Math.cos(a)*.20,0,Math.sin(a)*.15,.78+r()*.32,.062,j%2?sage:green,-.54*Math.cos(a),.65*a,.12);}
 for(let k=0;k<2;k++){const x=k?.23:-.20,y=k?1.35:1.09,z=k?-.04:.13;stem(b,x,0,z,y,.02);
  for(let n=0;n<3;n++){const a=n*TAU/3,kx=Math.cos(a),kz=Math.sin(a);b.ell(x+kx*.09,y+.12,z+kz*.10,.124,.25,.061,n===1?'#a69ac1':'#857ba7',.14,kz*.9,-kx*.52);
   b.ell(x+kx*.18,y-.02,z+kz*.15,.12,.17,.078,'#8176a5',kz*.75,.22,-kx*.85);
   b.ell(x+kx*.12,y+.012,z+kz*.17+.02,.044,.094,.025,'#e1b75e',.26,0,-kx*.78);}
 }
}
function fern(b,x,y,z,s,r,fronds=4){
 for(let k=0;k<fronds;k++){
  const a=k*TAU/fronds+.42,dx=Math.cos(a)*(.43+r()*.13)*s,dz=Math.sin(a)*.43*s,h=(.65+r()*.32)*s;
  const root=[x,y,z],mid=[x+dx*.32,y+h*.69,z+dz*.36],end=[x+dx,y+h,z+dz];
  stroke(b,[root,mid,end],.015*s,'#718958');
  for(let j=1;j<=5;j++){
   const t=j/6,xx=x+dx*t*t,yy=y+h*(1.5*t-.5*t*t),zz=z+dz*t;
   for(const side of [-1,1]){const kx=-Math.sin(a)*side,kz=Math.cos(a)*side;
    leaf(b,xx,yy+.01*s,zz,(.23-.09*t)*s,.033*s,j%2?'#739664':'#86a276',-.98*kx,a*.53,.88*kz);}
  }
 }
}
function waterGarden(b,r,s=1,bloom=true){
 b.ell(0,.055*s,0,.64*s,.07*s,.43*s,'#75b2ac');b.ell(-.05*s,.096*s,-.06*s,.45*s,.025*s,.30*s,'#8ec5b4');
 for(let i=0;i<5;i++){const a=i*2.4+.3,x=Math.cos(a)*(.15+.055*i)*s,z=Math.sin(a)*.24*s;
  b.cyl(x,.14*s,z,.111*s,.104*s,.026*s,i%2?'#91aa72':'#6d976f',10,0,a,0);
  if(i<2&&bloom)for(let j=0;j<6;j++){const q=j*TAU/6;b.ell(x+Math.cos(q)*.045*s,.174*s,z+Math.sin(q)*.044*s,.03*s,.07*s,.028*s,j%2?'#f0b3ae':'#f9d1bd',.55*Math.sin(q),0,-.55*Math.cos(q));}
 }
 for(let j=0;j<3;j++){const x=-.39*s+j*.06*s,h=(.32+r()*.16)*s;b.rod(x,.08*s,-.1*s,x-.03*s,h,-.14*s,.009*s,'#70865b');b.ell(x-.03*s,h,-.14*s,.022*s,.074*s,.022*s,'#996e46');}
}
function potted(b,x,y,z,s,r){b.cyl(x,y+.10*s,z,.11*s,.079*s,.20*s,'#bb8560',9);sprig(b,x,y+.17*s,z,s*.55,r,3);}
function lamp(b,x,y,z,s){b.cyl(x,y,z,.095*s,.072*s,.17*s,b.glow('#ffbe65'),8);b.cyl(x,y+.107*s,z,.035*s,.12*s,.06*s,bronze,8);b.cyl(x,y-.10*s,z,.085*s,.07*s,.038*s,bronze,8);}
function conservatory(b,r,hero){
 const s=hero?1:.85;const glass='#a8ccc1',frame='#5e8578',foot='#c7b89a';
 b.box(0,.10*s,0,1.66*s,.19*s,.93*s,foot);b.box(0,.24*s,0,1.60*s,.17*s,.87*s,'#d2c9a9');
 for(const side of [-1,1]){
  const x=side*.55*s;
  b.box(x,.57*s,0,.50*s,.52*s,.75*s,glass);
  b.form([[-.29*s,0],[0,.23*s],[.29*s,0]],.80*s,x,.82*s,0,'#8aafa0');
  for(let j=-1;j<=1;j++)b.box(x+j*.23*s,.57*s,.383*s,.025*s,.53*s,.028*s,frame);
  b.box(x,.65*s,.396*s,.49*s,.021*s,.032*s,frame);
  b.box(x,.85*s,.391*s,.56*s,.034*s,.04*s,frame);
 }
 const wide=.445*s,base=.90*s,high=.43*s;
 b.cyl(0,.68*s,.02*s,.405*s,.405*s,.73*s,glass,12);
 b.ell(0,base+.10*s,.02*s,wide,high,wide,'#8cb8a8');
 b.cyl(0,base+.09*s,.02*s,.45*s,.45*s,.074*s,frame,14);
 for(let j=0;j<10;j++){
  const a=j*TAU/10,cs=Math.cos(a),sn=Math.sin(a);let x=cs*wide,z=.02*s+sn*wide;
  b.rod(x,.32*s,z,x,base+.09*s,z,.014*s,frame);
  const pts=[];for(let n=0;n<4;n++){const t=n*PI/6;pts.push([cs*wide*Math.cos(t),base+.10*s+high*Math.sin(t),.02*s+sn*wide*Math.cos(t)]);}
  stroke(b,pts,.010*s,'#9f9a6a');
 }
 b.cyl(0,1.44*s,.02*s,.093*s,.112*s,.17*s,frame,8);
 b.cyl(0,1.58*s,.02*s,0,.126*s,.14*s,brass,8);b.ell(0,1.67*s,.02*s,.033*s,.065*s,.033*s,gold);
 b.form([[-.13*s,0],[-.13*s,.37*s],[-.09*s,.46*s],[0,.51*s],[.09*s,.46*s],[.13*s,.37*s],[.13*s,0]],.04*s,0,.26*s,.455*s,frame);
 b.box(0,.53*s,.482*s,.166*s,.37*s,.019*s,b.glow('#dccd89'));b.box(0,.53*s,.496*s,.016*s,.37*s,.018*s,frame);
 if(hero){for(const side of [-1,1]){potted(b,side*.59,.21,.48,.68,r);lamp(b,side*.20,.72,.46,.61);}b.box(0,.12,.55,.60,.10,.20,foot);}
}
function magnolia(b,r){
 island(b,r,.69);stroke(b,[[0,.04,0],[-.10,.54,.005],[.04,1.08,-.02]],.105,bark,.51);
 for(let j=0;j<7;j++){const a=j*2.399,rad=.24+r()*.24,x=Math.cos(a)*rad,z=Math.sin(a)*rad*.75,y=.97+r()*.47;
  stroke(b,[[0,.58,0],[x*.64,.87,z*.57],[x,y,z]],.034,bark,.41);
  for(let n=0;n<4;n++){const t=n*TAU/4;b.ell(x+Math.cos(t)*.075,y+.076,z+Math.sin(t)*.07,.083,.145,.061,n%2?'#edada6':'#f4cbb7',.33*Math.sin(t),t,-.46*Math.cos(t));}
  leaf(b,x-.03,y-.11,z,.14,.045,sage,.65,a);
 }
}
function hydrangea(b,r){
 for(let k=0;k<3;k++){const a=k*2.24,x=Math.cos(a)*.21,z=Math.sin(a)*.18,h=.76+r()*.24;stem(b,x,0,z,h,.025);
  const palette=k%2?['#8b80ae','#b4a5ca','#9e94c1']:['#7896b8','#a2b9cc','#8aa9c4'];
  b.ell(x,h,z,.17,.145,.15,palette[0]);
  for(let j=0;j<8;j++){const q=j*2.399,up=(j+.5)/8,rad=Math.sqrt(1-up*up)*.191,xx=x+Math.cos(q)*rad,zz=z+Math.sin(q)*rad,yy=h-.083+up*.23;
   for(let n=0;n<3;n++){const t=n*TAU/3+q;b.ell(xx+.046*Math.cos(t),yy+.017*Math.sin(t),zz+.046*Math.sin(t),.062,.032,.058,palette[(n+j)%3],-.2,.62*t,.3*Math.cos(t));}
  }
  leaf(b,x,.10,z,.52,.13,green,-.7*Math.cos(a),a);
 }
}
function fountain(b){
 b.cyl(0,.11,0,.58,.48,.18,'#b8ae91',12);b.cyl(0,.20,0,.51,.52,.07,patina,16);b.cyl(0,.242,0,.46,.46,.025,'#8abab0',16);
 b.cyl(0,.53,0,.09,.16,.55,bronze,10);b.cyl(0,.80,0,.32,.125,.18,patina,12);b.cyl(0,.91,0,.30,.32,.052,'#9ecac2',14);
 b.cyl(0,1.08,0,.048,.08,.30,brass,9);b.cyl(0,1.21,0,.174,.055,.10,patina,10);b.ell(0,1.31,0,.049,.09,.048,'#b4d9cb');
 for(let j=0;j<6;j++){const a=j*TAU/6,cs=Math.cos(a),sn=Math.sin(a);stroke(b,[[.28*cs,.92,.28*sn],[.36*cs,.78,.36*sn],[.42*cs,.29,.42*sn]],.011,'#afd2c8',.62);}
}
function hive(b,r){
 for(const s of [-1,1])b.box(s*.23,.16,0,.07,.31,.43,bark);
 for(let j=0;j<4;j++){b.box(0,.33+j*.14,0,.67,.13,.48,j%2?'#ba8b54':'#d1a566');b.box(0,.388+j*.14,.245,.67,.015,.035,'#e1bd82');}
 b.form([[-.396,0],[0,.22],[.396,0]],.57,0,.85,0,'#85735a');b.box(0,.34,.26,.29,.032,.05,umber);
 for(let j=0;j<2;j++){const x=(j-.5)*.4;petalHead(b,x,.23,.33,.082,['#faf1ca','#f6e5bb'],6,'daisy');}
 sprig(b,.31,.02,-.03,.52,r,4);
}
function roseArch(b,r){
 for(const side of [-1,1]){b.box(side*.46,.58,0,.07,1.15,.09,'#699376');for(let j=0;j<3;j++)b.box(side*.46,.28+j*.25,-.03,.22,.038,.08,'#699376');}
 const pts=[];for(let j=0;j<=8;j++){const a=PI-j*PI/8;pts.push([Math.cos(a)*.46,1.11+Math.sin(a)*.39,0]);}stroke(b,pts,.044,'#699376');
 for(let i=0;i<12;i++){const pos=i/11,x=pos<.23?-.46:pos>.78?.46:Math.cos(PI-(pos-.23)/.55*PI)*.46;
  const y=pos<.23?.24+pos*3.9:pos>.78?.26+(1-pos)*4:1.14+Math.sin((pos-.23)/.55*PI)*.37;
  b.ell(x+.039,y,.04,.092,.065,.073,green,0,.3,i*.57);if(i%3!==0){b.ell(x-.025,y+.056,.086,.084,.075,.066,i%2?'#cf796f':'#bc665c');b.ell(x-.04,y+.073,.129,.043,.040,.032,'#edaaa0');}
 }
 stones(b,r,.7);
}
function spottedCap(b,x,y,z,r,h,pal,spots,rng){
 const shell=u=>.12+.78*Math.sqrt(Math.max(0,1-u*u));
 b.cyl(x,y+.05*h,z,r,r*.82,.10*h,cream,18);
 const radial=[1,.987,.95,.89,.80,.69,.55,.40,.24,.08];
 for(let j=0;j<radial.length-1;j++){
  const lo=radial[j],hi=radial[j+1],a=shell(lo),q=shell(hi);
  b.cyl(x,y+(a+q)*.5*h,z,hi*r,lo*r,(q-a)*h+.002,j>4?pal[1]:pal[0],18);
 }
 b.ell(x,y+.899*h,z,.09*r,.020*h,.09*r,pal[1]);
 for(let j=0;j<spots;j++){
  const a=j*2.399+.22,u=.24+.61*Math.sqrt((j+.5)/spots),dist=u*r;
  b.ell(x+Math.cos(a)*dist,y+(shell(u)+.020)*h,z+Math.sin(a)*dist,r*(.072+rng()*.041),h*.048,r*.078,'#f3dbb0',.33*Math.sin(a),a,-.32*Math.cos(a));
 }
 for(let j=0;j<7;j++){const a=j*TAU/7;b.rod(x+Math.cos(a)*r*.25,y+.014*h,z+Math.sin(a)*r*.25,x+Math.cos(a)*r*.84,y+.027*h,z+Math.sin(a)*r*.84,r*.012,'#c9aa86',r*.008,5);}
}
function toad(b,x,z,s,r,pal=['#b95142','#dc7554'],spots=7){
 b.cyl(x,.35*s,z,.106*s,.150*s,.70*s,'#e0cdac',10,0,0,-.043);
 b.ell(x,.54*s,z,.142*s,.046*s,.130*s,'#beaa83');
 spottedCap(b,x+.017*s,.69*s,z,.31*s,.29*s,pal,spots,r);
}
function chanterelle(b,x,z,s,r){
 b.cyl(x,.28*s,z,.093*s,.067*s,.56*s,'#d99a4a',9,0,0,.09);
 for(let j=0;j<8;j++){const a=j*TAU/8,dx=Math.cos(a),dz=Math.sin(a);b.ell(x+dx*.132*s,.56*s+(j%3)*.017*s,z+dz*.13*s,.13*s,.077*s,.16*s,j%2?'#e5a643':'#f0bd5c',-.30*dz,a,.31*dx);}
 b.ell(x,.538*s,z,.114*s,.038*s,.108*s,'#c0893a');
}
function shelf(b,x,y,z,s,col){
 b.ell(x,y,z,.31*s,.067*s,.23*s,'#d8c4a1',-.06,.22,.05);
 b.ell(x,y+.047*s,z-.006*s,.306*s,.10*s,.227*s,col,-.06,.22,.05);
 b.ell(x-.03*s,y+.12*s,z-.018*s,.18*s,.035*s,.13*s,col==='#8196b0'?'#acb7c8':'#d4a066');
}
function stump(b,x,z,s,r,tiers=false){
 b.cyl(x,.37*s,z,.22*s,.37*s,.74*s,bark,9,0,.2,.04);
 b.cyl(x,.745*s,z,.215*s,.219*s,.034*s,'#c39c75',9);
 b.ring(x,.769*s,z,.122*s,.009*s,'#9a7153',PI/2,0,0);
 for(let i=0;i<5;i++){const a=i*TAU/5,cs=Math.cos(a),sn=Math.sin(a);b.rod(x+cs*.18*s,.56*s,z+sn*.18*s,x+cs*.45*s,.055*s,z+sn*.38*s,.054*s,'#866650',.027*s,7);}
 const n=tiers?5:3;for(let i=0;i<n;i++){const a=i*1.83+.40;shelf(b,x+Math.cos(a)*.24*s,.20*s+i*.103*s,z+Math.sin(a)*.23*s,.62*s,i%2?'#c39767':'#ad7952');}
}
function coralTwig(b,x,y,z,s,col,r,arms=4){
 for(let j=0;j<arms;j++){
  const a=j*2.399+.15,xx=x+Math.cos(a)*.31*s,zz=z+Math.sin(a)*.26*s,yy=y+(.56+r()*.30)*s;
  stroke(b,[[x+(j-1.5)*.037*s,y,z],[(x+xx)*.5,y+.30*s,(z+zz)*.5],[xx,yy,zz]],.055*s,col,.47);
  const side=j%2?-1:1;
  stroke(b,[[xx*.78+x*.22,yy-.19*s,zz],[xx+side*.11*s,yy-.075*s,zz+.02*s],[xx+side*.14*s,yy+.02*s,zz+.036*s]],.034*s,col,.46);
  b.ell(xx,yy,zz,.027*s,.037*s,.028*s,col);
 }
}
function spiralFern(b,r,eggs=false){
 fern(b,-.13,0,.0,1.0,r,3);
 for(let i=0;i<2;i++){
  const x=.10+i*.15,z=.13-i*.18,h=.77+i*.17;
  stroke(b,[[x,0,z],[x-.035,h*.49,z],[x+.027,h,z]],.022,'#849a5c');
  const a0=-PI*.20,cx=x-.040,cy=h+.078,pts=[];
  for(let j=0;j<11;j++){const t=j/10,a=a0+t*PI*2.15,rad=.113*(1-.74*t);pts.push([cx+Math.cos(a)*rad,cy+Math.sin(a)*rad,z]);}
  stroke(b,pts,.019,'#a2ae6d',.65);
 }
 if(eggs){for(let j=0;j<5;j++){let a=j*2.399;b.ell(-.28+Math.cos(a)*.14,.125+(j%2)*.042,.15+Math.sin(a)*.1,.083,.114,.078,b.glow(j%2?'#f4bd5b':'#db9f4d'));}}
}
function forestLantern(b,r){
 island(b,r,.78);stroke(b,[[-.24,.06,-.08],[-.29,.70,-.09],[-.17,1.18,-.08],[.02,1.37,-.06],[.23,1.32,-.05],[.29,1.20,-.04]],.065,'#755d42',.40);
 b.ring(.28,1.15,-.04,.052,.012,brass);lamp(b,.278,.955,-.04,1.45);
 for(let i=0;i<3;i++)leaf(b,-.22,.63+i*.17,-.08,.24,.05,sage,i%2?.6:-.8,.3*i);
}
function mushroomHouse(b,r,hero){
 const s=hero?1.15:.86;island(b,r,.91*s);
 b.cyl(0,.55*s,0,.35*s,.45*s,1.04*s,'#d4bf94',12,0,.18,-.035);
 for(let j=0;j<7;j++){const a=j*TAU/7;b.rod(Math.cos(a)*.419*s,.08*s,Math.sin(a)*.419*s,Math.cos(a)*.34*s,.85*s,Math.sin(a)*.34*s,.016*s,'#beaa88',.012*s);}
 spottedCap(b,0,.94*s,0,.69*s,.50*s,['#a84d40','#c66b4c'],12,r);
 b.form([[-.14*s,0],[-.14*s,.31*s],[-.095*s,.41*s],[0,.46*s],[.095*s,.41*s],[.14*s,.31*s],[.14*s,0]],.05*s,0,.09*s,.418*s,umber);
 b.form([[-.10*s,0],[-.10*s,.28*s],[-.068*s,.36*s],[0,.405*s],[.068*s,.36*s],[.10*s,.28*s],[.10*s,0]],.03*s,0,.11*s,.456*s,b.glow('#f4b868'));
 b.box(0,.32*s,.481*s,.024*s,.37*s,.018*s,bark);b.ell(.073*s,.27*s,.49*s,.023*s,.023*s,.02*s,brass);
 for(const side of [-1,1]){const x=side*.28*s;b.ell(x,.64*s,.295*s,.092*s,.115*s,.039*s,b.glow('#f9c878'));b.ring(x,.64*s,.318*s,.095*s,.014*s,bark);b.box(x,.65*s,.34*s,.018*s,.15*s,.014*s,bark);}
 for(let j=0;j<3;j++)b.ell(0,.085*s,.56*s+j*.12*s,.125*s,.031*s,.062*s,'#a6a48b',0,.12*j,0);
 if(hero){toad(b,-.53*s,.23*s,.46*s,r,['#c49148','#e1af66'],3);lamp(b,.42*s,.40*s,.37*s,.70*s);}
}
function stairStump(b,r){
 island(b,r,.83);stump(b,0,0,1.49,r,true);
 for(let j=0;j<10;j++){const a=-1+j*.39,rr=.39+.018*Math.cos(a),y=.15+j*.078;
  b.box(Math.sin(a)*rr,y,Math.cos(a)*rr,.28,.041,.16,j%2?'#ad815a':'#be956c',0,a,0);if(j%2===0)b.rod(Math.sin(a)*.49,y,Math.cos(a)*.49,Math.sin(a)*.49,y+.19,Math.cos(a)*.49,.012,bark);
 }
 stroke(b,[[.22,1.03,-.12],[.45,1.23,-.10],[.55,1.20,-.08]],.034,bark);lamp(b,.55,1.05,-.08,.9);
}
function oyster(b,r){
 stump(b,-.1,-.05,.77,r,false);
 const cols=['#7a739c','#6d80a1','#8196b0'];for(let j=0;j<7;j++){
  const a=j*2.299,xx=Math.cos(a)*(.10+j*.018),zz=Math.sin(a)*.21,yy=.27+j*.135;
  b.rod(-.04,.18,0,xx,yy,zz,.042,'#c1b5ae',.028);shelf(b,xx,yy,zz,.72+r()*.29,cols[j%3]);
 }
}
function snail(b,r){
 island(b,r,.72);
 b.ell(0,.22,.10,.51,.15,.20,'#bca477');b.ell(.37,.28,.10,.18,.18,.15,'#d2b68a');
 b.ell(-.12,.53,.02,.324,.335,.24,'#bb8758',.08,0,-.1);
 const pts=[];for(let j=0;j<=18;j++){const t=j/18,a=t*TAU*1.57,rr=.025+.247*t;pts.push([-.12+Math.cos(a)*rr,.53+Math.sin(a)*rr,.252-.038*t]);}stroke(b,pts,.021,'#e0b57c');
 for(const side of [-1,1]){const z=.1+side*.085;b.rod(.43,.34,z,.50,.58,z+side*.024,.017,'#aa8b60',.010);b.ell(.50,.58,z+side*.024,.023,.024,.023,ink);}
 stroke(b,[[-.35,.63,-.03],[-.39,.89,-.06],[-.29,.97,-.08],[-.19,.95,-.08]],.018,bark);lamp(b,-.18,.85,-.08,.59);
}
function oldWell(b,r){
 island(b,r,.78);for(let row=0;row<2;row++)for(let j=0;j<10;j++){const a=(j+row*.5)*TAU/10;b.box(Math.sin(a)*.34,.20+row*.16,Math.cos(a)*.34,.20,.15,.16,j%3===0?'#8d9d7b':'#abb29a',0,a,0);}
 b.cyl(0,.24,0,.26,.26,.13,'#69918a',10);for(const s of [-1,1])b.rod(s*.41,.17,0,s*.40,1.05,-.01,.046,bark,.036);
 b.rod(-.48,1,0,.50,1,0,.047,'#aa895e');b.rod(.08,.99,.0,.08,.60,0,.009,cream);
 b.cyl(.08,.50,0,.111,.082,.18,copper,10);b.ring(.08,.61,0,.090,.012,brass);
 toad(b,-.43,.20,.35,r,['#bf8d49','#deab63'],2);
}
function basket(b,x,y,z,s,r,withFlowers=true){
 b.cyl(x,y+.23*s,z,.31*s,.23*s,.40*s,'#b58b55',12);
 for(let j=0;j<4;j++)b.ring(x,y+(.09+j*.084)*s,z,(.235+j*.021)*s,.014*s,j%2?'#d1aa6b':'#967248',PI/2);
 const a=[];for(let j=0;j<=8;j++){const t=j/8*PI;a.push([x+Math.cos(t)*.30*s,y+.39*s+Math.sin(t)*.39*s,z]);}stroke(b,a,.026*s,bark);
 if(withFlowers)for(let k=0;k<3;k++){const xx=x+(k-1)*.16*s,yy=y+.47*s+(k%2)*.08*s;petalHead(b,xx,yy,z+.14*s,.10*s,k%2?['#d77978','#eda299']:['#e8b654','#f2cd72'],5,'daisy');}
}
function frog(b,x,y,z,s){
 b.ell(x,y+.13*s,z,.19*s,.13*s,.19*s,'#83a16e');b.ell(x,y+.26*s,z+.10*s,.17*s,.115*s,.12*s,'#97b17c');
 for(const side of [-1,1]){b.ell(x+side*.104*s,y+.33*s,z+.105*s,.060*s,.061*s,.055*s,'#a6bb81');b.ell(x+side*.104*s,y+.343*s,z+.147*s,.029*s,.028*s,.025*s,ink);
  b.ell(x+side*.18*s,y+.073*s,z-.048*s,.102*s,.070*s,.14*s,'#729363',-.12,side*.41,0);}
}
function deer(b,r){
 island(b,r,.78);
 b.ell(-.04,.53,0,.34,.19,.16,'#b4875c',0,0,-.04);b.ell(.26,.72,.01,.116,.22,.108,'#c59668',0,0,-.32);
 b.ell(.35,.92,.02,.165,.12,.105,'#ca9a6b',0,0,.11);b.ell(.475,.89,.035,.076,.064,.077,'#d8b58a');b.ell(.526,.912,.045,.034,.029,.035,umber);
 for(const s of [-1,1]){
  b.ell(.31,1.044,s*.060,.046,.11,.03,'#b78960',.42*s,0,.39);b.ell(.387,.946,s*.091,.022,.025,.019,ink);
  for(const x of [-.25,.15])stroke(b,[[x,.48,s*.08],[x+.04,.28,s*.089],[x-.006,.11,s*.10]],.034,'#a17a56',.67);
 }
 b.ell(-.36,.55,-.01,.093,.080,.056,cream,0,0,.56);
 for(let j=0;j<6;j++)b.ell(-.24+(j%3)*.084,.58+Math.floor(j/3)*.050,.133,.022,.014,.012,cream);
 sprig(b,-.34,.02,.13,.51,r,3);
}
function weatherHerb(b,w,r){
 if(w==='rain'){
  b.cyl(0,.075,0,.48,.46,.12,brass,12);b.ell(0,.43,0,.42,.51,.35,'#acd4ca');b.cyl(0,.16,0,.411,.413,.05,patina,14);
  for(let j=0;j<6;j++){const a=j*TAU/6,pts=[];for(let k=0;k<=4;k++){const t=k*PI/8;pts.push([Math.cos(a)*.425*Math.cos(t),.40+.51*Math.sin(t),Math.sin(a)*.35*Math.cos(t)]);}stroke(b,pts,.012,'#d4dfc5');}
  b.ell(0,.96,0,.065,.06,.065,brass);sprig(b,-.3,.09,.25,.43,r,3);
 }else if(w==='wind'){
  b.cyl(0,.12,0,.14,.22,.22,'#b59e76',8);b.rod(0,.08,0,0,1.35,0,.036,'#ad8760',.026);
  motion(b,'spinZ',[0,1.29,.075],()=>{
  for(let j=0;j<7;j++){const a=j*TAU/7; b.ell(Math.cos(a)*.188,1.29+Math.sin(a)*.188,.075,.112,.215,.043,['#e5ac71','#dc8877','#8eb0a2'][j%3],.25,.17,a-PI/2+.28);}
  b.ell(0,1.29,.125,.070,.070,.051,gold);});sprig(b,-.07,.04,0,.51,r,4);
 }else if(w==='snow'){
  b.box(0,.18,0,.91,.27,.59,'#ac825b');b.box(0,.32,0,.79,.038,.47,'#715e47');
  for(let j=0;j<3;j++)sprig(b,(j-1)*.22,.34,.02,.29,r,3);
  for(const s of [-1,1])b.rod(s*.40,.25,-.19,s*.40,.96,-.19,.024,bronze);
  b.rod(-.43,.96,-.19,.43,.96,-.19,.025,bronze);lamp(b,0,.78,-.17,1.06);
  b.ell(-.22,.33,.256,.18,.038,.06,'#e5e9df');b.ell(.26,.34,-.19,.14,.035,.076,'#f1ede0');
 }else{basket(b,-.12,0,.02,1.18,r);b.cyl(.31,.23,-.015,.14,.13,.38,'#c09553',8);b.cyl(.31,.44,-.015,.15,.15,.046,brass,8);sprig(b,.27,.02,.16,.44,r,3);}
}
function weatherGrove(b,w,r){
 if(w==='clear'){deer(b,r);return;}
 island(b,r,.71);
 if(w==='rain'){
  frog(b,-.21,.07,.09,.89);frog(b,.18,.07,.13,.65);stroke(b,[[0,.04,-.12],[.05,.53,-.17],[.12,.84,-.17]],.025,green);
  for(let j=0;j<5;j++){const a=j*TAU/5;b.ell(.09+Math.cos(a)*.19,.79,-.12+Math.sin(a)*.16,.22,.047,.18,j%2?'#91ad80':'#779d76',.16*Math.sin(a),a,.18*Math.cos(a));}
 }else if(w==='wind'){
  b.rod(0,.04,0,0,1.14,0,.038,bark,.024);for(let j=0;j<5;j++){const a=j*TAU/5;b.ell(.12*Math.cos(a),1.09+.12*Math.sin(a),.07,.072,.22,.030,j%2?'#c08160':'#dfb27a',.34,.15,a-PI/2+.59);}b.ell(0,1.10,.095,.056,.053,.035,brass);fern(b,-.16,.025,.05,.45,r,2);
 }else{
  b.ell(-.04,.245,0,.33,.24,.24,'#8b7464');
  for(let j=0;j<22;j++){const a=j*2.399,u=(j+.5)/22,x=Math.sin(a)*Math.sqrt(1-u*u),z=Math.cos(a)*Math.sqrt(1-u*u);b.rod(-.06+x*.27,.23+u*.18,z*.195,-.06+x*.34,.23+u*.26,z*.24,.027,j%3?'#9c856e':'#b49b81',.003,5);}
  b.ell(.24,.225,.075,.162,.129,.12,'#c2a48a');b.ell(.365,.205,.08,.034,.033,.033,umber);b.ell(.265,.25,.179,.020,.015,.010,ink);b.ell(-.07,.46,-.04,.19,.039,.135,'#e5e6d8');
 }
}
function pedestal(b,s=1){
 b.cyl(0,.064*s,0,.29*s,.32*s,.12*s,'#a49a84',10);
 b.cyl(0,.144*s,0,.25*s,.28*s,.052*s,brass,10);
 b.cyl(0,.30*s,0,.073*s,.13*s,.284*s,bronze,10);
 b.cyl(0,.456*s,0,.155*s,.085*s,.095*s,brass,10);
}
function tripod(b,x,y,z,s){
 for(let j=0;j<3;j++){const a=j*TAU/3+.3,xx=x+Math.cos(a)*.37*s,zz=z+Math.sin(a)*.37*s;
  b.rod(xx,y+.055*s,zz,x+Math.cos(a)*.06*s,y+.67*s,z+Math.sin(a)*.06*s,.038*s,'#966e4b',.052*s,8);
  b.cyl(xx,y+.047*s,zz,.055*s,.061*s,.064*s,bronze,8);
 }
 b.cyl(x,y+.68*s,z,.12*s,.095*s,.102*s,brass,10);
}
function armillary(b,r,hero=false,small=false){
 const s=small?.71:hero?1.12:.92;pedestal(b,s);const y=.94*s;
 b.rod(0,.42*s,0,0,y,0,.049*s,bronze);
 b.ring(0,y,0,.438*s,.031*s,brass,.2,-.36,-.22);
 b.ring(0,y,0,.37*s,.024*s,'#8b9f9e',1.04,-.20,-.12);
 b.ring(0,y,0,.304*s,.021*s,'#b59555',.49,.87,.68);
 b.ring(0,y,0,.245*s,.013*s,'#819a9b',1.27,.3,-.48);
 b.ell(0,y,0,.121*s,.115*s,.12*s,'#628092');b.rod(-.17*s,y-.41*s,-.095*s,.17*s,y+.40*s,.095*s,.012*s,gold);
 for(let j=0;j<7;j++){const a=j*TAU/7;b.ell(Math.cos(a)*.435*s,y+Math.sin(a)*.429*s,.026*s,.020*s,.020*s,.018*s,'#dfc692');}
 if(hero){b.ell(.23*s,y+.45*s,0,.084*s,.078*s,.083*s,'#90a5ba');for(const a of [0,2.1,4.2])b.ell(Math.cos(a)*.225*s,.16*s,Math.sin(a)*.225*s,.043*s,.024*s,.045*s,patina);}
}
function telescope(b,r,small=false){
 const s=small?.73:1;tripod(b,0,0,0,s);
 b.ring(0,.79*s,0,.125*s,.021*s,copper,0,.4,0);
 const A=[-.36*s,.73*s,.12*s],B=[.45*s,1.32*s,-.08*s];
 b.rod(...A,...B,.081*s,'#526d79',.145*s,12);
 for(let j=0;j<4;j++){const t=[.05,.29,.68,.96][j],dx=B[0]-A[0],dy=B[1]-A[1],dz=B[2]-A[2];const rad=(.084+.065*t)*s;
  b.rod(A[0]+t*dx,A[1]+t*dy,A[2]+t*dz,A[0]+(t+.034)*dx,A[1]+(t+.034)*dy,A[2]+(t+.034)*dz,rad,brass,rad,12);}
 b.rod(...B,.48*s,1.34*s,-.084*s,.138*s,'#96b3b6',.134*s,12);
 b.rod(...A,-.47*s,.65*s,.15*s,.047*s,bronze,.039*s,8);
 b.rod(-.05*s,1.08*s,.032*s,.18*s,1.25*s,-.022*s,.038*s,brass,.044*s,9);
}
function cloudStone(b,r,s=1){
 b.ell(0,.08*s,0,.52*s,.105*s,.34*s,'#aaa7a7');for(let j=0;j<5;j++){const a=j*TAU/5+.2;b.ell(Math.cos(a)*.37*s,.112*s,Math.sin(a)*.21*s,.14*s,.088*s,.13*s,j%2?'#c7c4bc':'#d8d0c0');}
}
function cloudBridge(b,r){
 for(const sign of [-1,1]){
  b.ell(sign*.49,.32,0,.235,.133,.26,'#b5ada9');b.cyl(sign*.49,.20,0,.194,.07,.25,'#99939a',6);
  b.ell(sign*.49,.40,-.036,.17,.054,.15,'#d8d2c0');
  for(const z of [-.11,.11])b.rod(sign*.43,.40,z,sign*.43,.67,z,.023,brass);
 }
 for(let j=0;j<7;j++){const x=(j-3)*.117,y=.38-.090*Math.cos(x/.36*PI/2);b.box(x,y,0,.098,.044,.30,j%2?'#a99781':'#beaa8c',0,0,-.14*Math.sin(x*3.4));}
 for(const z of [-.144,.144])stroke(b,[[-.47,.64,z],[-.23,.53,z],[0,.49,z],[.23,.53,z],[.47,.64,z]],.017,bronze);
}
function crystals(b,x,y,z,s,r,n=5){
 const colors=['#89b9bf','#b1c7d5','#a4b6d3','#a4cbb9'];
 for(let i=0;i<n;i++){const a=i*2.399,rad=i?.095+r()*.19:0,h=(.49+r()*.48)*s,xx=x+Math.cos(a)*rad*s,zz=z+Math.sin(a)*rad*s,rr=(.059+r()*.047)*s;
  b.cyl(xx,y+h*.39,zz,rr,rr*.86,h*.78,colors[i%4],5,0,a,0);b.cyl(xx,y+h*.86,zz,0,rr,h*.21,b.glow(i%2?'#bcd5d4':'#b8c8da'),5,0,a,0);}
}
function observatory(b,r,hero){
 const s=hero?1.12:.90;
 b.cyl(0,.12*s,0,.56*s,.64*s,.20*s,'#9c9384',12);b.cyl(0,.51*s,0,.44*s,.48*s,.67*s,'#c6a787',12);
 b.cyl(0,.82*s,0,.48*s,.49*s,.095*s,bronze,14);
 b.ell(0,.82*s,0,.49*s,.46*s,.49*s,'#85a494');
 for(let j=0;j<8;j++){const a=j*TAU/8,pts=[];for(let k=0;k<4;k++){const t=k*PI/6;pts.push([Math.cos(a)*.49*s*Math.cos(t),.83*s+.46*s*Math.sin(t),Math.sin(a)*.49*s*Math.cos(t)]);}stroke(b,pts,.012*s,'#ba9d67');}
 b.form([[-.092*s,0],[-.086*s,.22*s],[-.058*s,.31*s],[0,.34*s],[.059*s,.31*s],[.086*s,.22*s],[.092*s,0]],.052*s,0,.18*s,.454*s,umber);
 b.ell(0,.39*s,.487*s,.052*s,.088*s,.015*s,b.glow('#e3bb79'));
 for(let n=0;n<7;n++){const a=(n+.5)*TAU/7,xx=Math.sin(a)*.458*s,zz=Math.cos(a)*.458*s;
  b.box(xx,.61*s,zz,.069*s,.147*s,.023*s,b.glow('#f0bf72'),0,a,0);}
 const end=[.42*s,1.47*s,.09*s];
 b.rod(.06*s,1.02*s,.15*s,...end,.075*s,brass,.114*s,12);b.rod(...end,.435*s,1.489*s,.086*s,.112*s,'#9cbab9',.111*s,12);
 b.cyl(0,1.31*s,0,.036*s,.076*s,.083*s,bronze,8);
 if(hero){
  b.box(-.54*s,.40*s,-.03*s,.39*s,.54*s,.48*s,'#bfa185');
  b.form([[-.235*s,0],[0,.20*s],[.235*s,0]],.54*s,-.54*s,.65*s,-.03*s,'#729185');
  b.box(-.54*s,.50*s,.22*s,.14*s,.17*s,.021*s,b.glow('#e8bd7b'));
  for(let k=0;k<3;k++)b.box(0,.078*s+k*.048*s,.69*s-k*.082*s,.49*s,.091*s,.129*s,'#bdb29a');
 }
}
function balloon(b,r,wing=false){
 cloudStone(b,r,.60);b.box(0,.27,0,.285,.20,.225,'#a78157');b.box(0,.38,0,.30,.045,.24,brass);
 const cols=wing?['#cb8d66','#efc28b']:['#8195ab','#e2cea0'];
 b.ell(0,1.11,0,.35,.46,.32,cols[0]);
 for(let j=0;j<8;j++){const a=j*TAU/8,cs=Math.cos(a),sn=Math.sin(a);
  const pts=[[cs*.12,.74,sn*.105],[cs*.29,.93,sn*.27],[cs*.348,1.13,sn*.32],[cs*.26,1.38,sn*.24],[cs*.055,1.54,sn*.042]];
  stroke(b,pts,.019,j%2?cols[1]:brass);
  if(j%2===0)b.rod(cs*.12,.38,sn*.10,cs*.20,.77,sn*.17,.010,bronze);
 }
 b.cyl(0,.72,0,.121,.081,.14,copper,10);b.ell(0,.64,0,.048,.081,.048,b.glow('#ffd591'));
 if(wing){for(const side of [-1,1]){b.form([[0,0],[side*.39,.12],[side*.52,.36],[side*.19,.31]],.047,side*.22,1.06,0,'#dba665',.07,0,0);b.rod(side*.22,1.08,.03,side*.65,1.38,.03,.012,bronze);}}
}
function orrery(b,r){
 pedestal(b,.91);b.rod(0,.42,0,0,1.11,0,.045,bronze);b.ell(0,1.13,0,.155,.155,.155,b.glow('#e2ac55'));
 motion(b,'spinY',[0,.68,0],()=>{
 const colors=['#9b6c5d','#8ca6ae','#be9276','#758199','#a67e56'];
 for(let j=0;j<5;j++){const a=j*2.399+.08,rad=.19+.045*j,y=.61+.075*j;const xx=Math.cos(a)*rad,zz=Math.sin(a)*rad;
  b.rod(0,y,0,xx,y,zz,.014,brass);b.rod(xx,y,zz,xx,y+.12,zz,.012,brass);b.ell(xx,y+.15,zz,.055+j*.013,.057+j*.011,.055+j*.012,colors[j]);
  if(j===3)b.ring(xx,y+.15,zz,.12,.009,gold,1.08,-.22,.3);}
 });
}
function prism(b,r,ice=false){
 pedestal(b,.86);b.ring(0,.85,0,.32,.028,brass,.05,-.14,.17);
 const col=ice?'#a3c8d5':'#c3b5cd';
 b.cyl(0,.94,0,0,.205,.48,col,5,0,.43,0);b.cyl(0,.59,0,.205,0,.23,'#a0c5c3',5,0,.43,0);
 for(const side of [-1,1])b.rod(side*.16,.42,0,side*.29,.84,0,.022,bronze);
 if(ice)crystals(b,.22,.08,.04,.39,r,3);
}
function weatherSky(b,w,r){
 if(w==='wind'){balloon(b,r,true);return;}if(w==='snow'){prism(b,r,true);return;}
 if(w==='rain'){
  tripod(b,0,0,0,.69);b.cyl(0,.61,0,.15,.12,.40,'#a6c9c6',10);
  b.cyl(0,.88,0,.31,.104,.23,patina,12);b.ring(0,1.005,0,.302,.019,brass,PI/2);
  for(let j=0;j<5;j++)b.box(.034,.46+j*.055,.12,.075,.009,.014,bronze);
  b.cyl(0,.54,0,.123,.123,.14,'#75aaa9',10);
 }else{
  pedestal(b,.78);b.rod(0,.37,0,0,.79,0,.031,bronze);b.ring(0,.89,0,.31,.028,brass,-.2,0,.11);
  b.cyl(0,.89,.018,.284,.286,.058,'#a5c1bd',14,PI/2-.22,0,.11);
  for(let j=0;j<8;j++){const a=TAU*j/8;b.rod(Math.cos(a)*.30,.89+Math.sin(a)*.30,0,Math.cos(a)*.36,.89+Math.sin(a)*.36,0,.015,brass);}
 }
}
function anemone(b,x,y,z,s,r,colours,n=14){
 b.ell(x,y+.095*s,z,.235*s,.117*s,.22*s,colours[0]);
 for(let j=0;j<n;j++){const a=j*2.399,dist=(.11+.10*r())*s,h=(.24+.19*r())*s;
  const cs=Math.cos(a),sn=Math.sin(a),end=[x+cs*dist*1.31,y+h,z+sn*dist*1.27];
  stroke(b,[[x+cs*.084*s,y+.12*s,z+sn*.085*s],[x+cs*dist*.80,y+h*.72,z+sn*dist*.79],end],.030*s,colours[j%2],.57);
  b.ell(...end,.030*s,.039*s,.030*s,b.glow(colours[2]));
 }
}
function jelly(b,x,y,z,s,r,col,arms=6){
 motion(b,'bob',[x,y,z],()=>{
 const [veil,shade,light]=col;
 const umbrella=[1,.975,.91,.81,.67,.49,.29,.09];
 function profile(rad){return -.085+.278*Math.sqrt(Math.max(0,1-rad*rad));}
 for(let i=0;i<umbrella.length-1;i++){const lo=umbrella[i],hi=umbrella[i+1],v=profile(lo),w=profile(hi);b.cyl(x,y+(v+w)*s*.5,z,.30*s*hi,.30*s*lo,(w-v)*s+.001,i>3?light:veil,16);}
 b.ell(x,y+.19*s,z,.033*s,.010*s,.033*s,light);
 for(let j=0;j<9;j++){const a=j*TAU/9;b.ell(x+Math.cos(a)*.238*s,y-.084*s,z+Math.sin(a)*.238*s,.084*s,.044*s,.080*s,j%2?veil:shade);}
 b.ell(x-.064*s,y+.105*s,z+.105*s,.094*s,.039*s,.048*s,light,-.29,.2,-.24);
 for(let j=0;j<arms;j++){
  const a=j*TAU/arms,cs=Math.cos(a),sn=Math.sin(a),h=(.33+r()*.23)*s,xx=x+cs*.19*s,zz=z+sn*.155*s;
  const path=[[xx,y-.11*s,zz],[xx+cs*.05*s,y-.11*s-h*.34,zz+sn*.038*s],[xx-.036*s,y-.11*s-h*.69,zz+sn*.05*s],[xx+.041*s,y-.11*s-h,zz+sn*.005*s]];
  stroke(b,path,(j%2?.012:.018)*s,j%2?shade:light,.56);
 }
 });
}
function seaFan(b,x,y,z,s,r,colours,depth=3){
 function branch(X,Y,Z,a,h,n){
  const xx=X+Math.sin(a)*h,yy=Y+Math.cos(a)*h,zz=Z+(r()-.41)*h*.25;
  b.rod(X,Y,Z,xx,yy,zz,(.022+.012*n)*s,colours[n%2],(.015+.011*n)*s,7);
  if(n){branch(xx,yy,zz,a-.39-r()*.17,h*.70,n-1);branch(xx,yy,zz,a+.35+r()*.18,h*.68,n-1);}
  else b.ell(xx,yy,zz,.029*s,.043*s,.032*s,colours[2]);
 }
 for(const a of [-.52,.32])branch(x,y,z,a,.30*s,depth);
}
function openShell(b,x,y,z,s,col,pearly=true){
 const shape=[[-.04,0],[-.27,.15],[-.39,.35],[-.40,.45],[-.31,.46],[-.29,.54],[-.20,.53],[-.15,.60],[-.067,.56],[0,.62],[.08,.57],[.16,.60],[.20,.53],[.30,.54],[.32,.46],[.401,.44],[.38,.34],[.28,.16],[.05,0]].map(([a,d])=>[a*s,d*s]);
 b.form(shape,.047*s,x,y+.035*s,z-.045*s,col[0],-.30);
 for(let j=0;j<10;j++){const a=-1.08+j*.24,xx=Math.sin(a)*.37*s,yy=Math.cos(a)*.49*s;
  b.ell(x+xx*.50,y+.09*s+yy*.5,z-.015*s-yy*.14,.031*s,Math.hypot(xx,yy)*.51,.035*s,j%2?col[1]:col[2],-.25,0,-Math.atan2(xx,yy));}
 b.ell(x,y+.035*s,z+.13*s,.35*s,.070*s,.24*s,col[0]);b.ell(x,y+.084*s,z+.12*s,.286*s,.038*s,.175*s,col[1]);
 if(pearly)b.ell(x-.01*s,y+.18*s,z+.15*s,.112*s,.111*s,.112*s,b.glow('#f1e2d0'));
}
function ray(b,x,y,z,s,r,col){
 const contour=[[-.047,-.28],[-.16,-.16],[-.35,-.14],[-.64,-.24],[-.55,.01],[-.40,.16],[-.22,.20],[-.085,.25],[-.03,.33],[.04,.33],[.09,.25],[.22,.20],[.40,.16],[.56,.01],[.64,-.24],[.35,-.14],[.17,-.16],[.05,-.28]].map(([a,d])=>[a*s,d*s]);
 b.form(contour,.055*s,x,y,z,col[0],PI/2-.10,.02,-.035);
 b.ell(x,y+.016*s,z+.037*s,.149*s,.085*s,.283*s,col[1],.08);
 stroke(b,[[x,y,z-.22*s],[x-.047*s,y-.026*s,z-.39*s],[x+.011*s,y-.10*s,z-.58*s],[x+.065*s,y-.06*s,z-.70*s]],.022*s,col[0],.38);
 for(const side of [-1,1]){b.ell(x+side*.084*s,y+.080*s,z+.161*s,.018*s,.017*s,.019*s,ink);
  for(let j=0;j<4;j++){b.ell(x+side*(.20+j*.077)*s,y+.043*s,z-.02*s+(r()-.5)*.07*s,.029*s,.009*s,.024*s,col[2]);}}
}
function minnow(b,x,y,z,s,col){
 b.ell(x,y,z,.15*s,.051*s,.049*s,col[0],0,0,.02);
 b.form([[0,0],[-.096*s,.067*s],[-.082*s,0],[-.10*s,-.057*s]],.018*s,x-.13*s,y,z,col[1],0,.13);
 b.ell(x+.091*s,y+.009*s,z+.039*s,.012*s,.012*s,.011*s,ink);
}
function seaArch(b,r){
 island(b,r,1.17,true);const s=1;
 const outline=[[-.68,.01],[-.674,.25],[-.58,.48],[-.51,.74],[-.37,.94],[-.23,.98],[-.14,1.07],[.035,1.12],[.21,1.05],[.36,.97],[.51,.78],[.61,.55],[.64,.28],[.69,.03],[.37,0],[.34,.26],[.265,.54],[.12,.73],[-.025,.77],[-.16,.70],[-.26,.56],[-.32,.33],[-.36,0]];
 b.form(outline,.38,0,.07,-.02,'#9ba18e',0,-.065);
 b.form([[-.65,.13],[-.52,.46],[-.41,.55],[-.34,.44],[-.43,.21],[-.49,.06]],.057,0,.075,.177,'#b7b398');
 b.form([[-.42,.76],[-.32,.92],[-.14,1.02],[.08,1.06],[.13,.99],[-.13,.93]],.048,0,.08,.159,'#b3b39c');
 b.form([[.32,.72],[.43,.84],[.55,.66],[.60,.42],[.50,.35],[.40,.52]],.052,0,.069,.165,'#8a9789');
 for(let j=0;j<6;j++){const side=j%2?-1:1;b.ell(side*(.43+r()*.12),.13+r()*.24,.135,.085+r()*.05,.057,.084,j%2?'#90a18a':'#a5ae91');}
 for(let j=0;j<5;j++){const a=j*TAU/5;b.ell(-.37+Math.cos(a)*.103,.19,.20+Math.sin(a)*.1,.112,.047,.082,'#79a094');}
 coralTwig(b,.33,.09,.15,.54,'#c78d87',r,3);
 b.ell(0,.10,.02,.36,.033,.20,'#78b4b3');
}
function seahorse(b,r){
 island(b,r,.85,true);
 const pts=[[.075,.30,.07],[-.056,.25,.07],[-.14,.34,.07],[-.07,.48,.07],[.028,.45,.07],[.02,.39,.07],
  [.13,.46,.07],[.10,.62,.07],[-.015,.78,.07],[-.045,.92,.07],[.058,1.01,.07]];
 stroke(b,pts,.064,'#d19b60',.94);
 b.ell(-.011,.73,.07,.133,.226,.09,'#dbab6b',0,0,-.26);
 b.ell(.040,.99,.07,.118,.105,.084,'#dfa868',0,0,.26);
 b.rod(.09,.99,.06,.265,.939,.065,.048,'#d8a567',.035,9);
 b.ell(.109,1.013,.139,.017,.019,.013,ink);
 for(let i=0;i<6;i++){let yy=.62+i*.07;b.cyl(-.102+Math.sin(i*.6)*.025,yy,.061,0,.065,.090,'#bd8c5f',5,0,0,.60);}
 b.ell(-.125,.782,-.015,.072,.082,.025,'#d8b382',-.1,.16,-.33);coralTwig(b,-.29,.07,-.065,.60,reef,r,3);
}
function amphora(b,r){
 island(b,r,.90,true);
 b.cyl(0,.16,0,.176,.095,.18,'#caba9c',14);
 b.ell(0,.43,0,.30,.31,.24,'#ded2b1',.0,-.12,-.065);
 b.cyl(0,.70,0,.123,.207,.19,'#c5b591',12);b.cyl(0,.86,0,.119,.12,.16,'#dad0b1',12);
 b.ring(0,.952,0,.13,.026,'#84959c',PI/2);
 for(const side of [-1,1]){const xx=side*.195;b.ring(xx,.703,.04,.096,.024,'#8c9a9b',0,.22*side,.15*side);}
 for(let j=0;j<7;j++){const a=j*TAU/7;const x=Math.sin(a)*.287,z=Math.cos(a)*.239;b.box(x,.44,z,.070,.062,.014,'#688898',0,a,.35);}
 seaFan(b,-.27,.09,-.10,.52,r,['#9a86a4','#b49eb6','#c9b6c3'],2);
}
function starfish(b,x,y,z,s,col){
 b.ell(x,y,z,.068*s,.042*s,.067*s,col);
 for(let j=0;j<5;j++){const a=j*TAU/5;b.rod(x+Math.cos(a)*.029*s,y,z+Math.sin(a)*.029*s,x+Math.cos(a)*.167*s,y-.008*s,z+Math.sin(a)*.167*s,.044*s,col,.008*s,6);}
}
function kingfisher(b,r){
 island(b,r,.73,true);stroke(b,[[-.40,.1,0],[-.07,.31,.02],[.25,.56,-.03]],.088,'#94785c',.50);
 b.ell(0,.57,.02,.153,.20,.116,'#4d98a6',0,0,-.28);b.ell(.051,.56,.109,.104,.13,.042,'#ce956b',-.13,0,-.2);
 b.ell(.085,.76,.021,.131,.109,.112,'#41899b');b.rod(.183,.77,.04,.40,.745,.047,.035,ink,.003,7);
 b.ell(.117,.786,.115,.022,.020,.014,ink);b.ell(-.091,.57,.096,.071,.14,.037,'#43818f',.08,0,-.34);
 b.form([[0,.06],[-.065,-.22],[.075,-.17]],.078,-.111,.47,.01,'#427e8d',.22,0,-.18);
}
function crab(b,r){
 island(b,r,.79,true);openShell(b,-.09,.12,-.046,.9,['#bc968a','#dfc0a4','#ebcdb7'],false);
 b.ell(.074,.214,.219,.165,.095,.111,'#ba7963');
 for(const side of [-1,1]){
  for(let j=0;j<3;j++){const x=.06+side*.14,z=.13+j*.051;stroke(b,[[x,.19,z],[x+side*.09,.20,z+.031],[x+side*.12,.115,z+.057]],.013,'#b57965');}
  b.ell(.075+side*.143,.27,.303,.058,.045,.044,'#cf8a71');b.ell(.075+side*.060,.291,.268,.016,.019,.015,ink);
 }
}
function gull(b,r){
 b.ell(0,.07,0,.47,.058,.29,'#8db9ba');b.form([[-.454,0],[-.30,.08],[-.17,.24],[-.02,.31],[.12,.27],[.035,.255],[-.05,.19],[.15,.054],[.41,.014]],.15,0,.09,0,'#a7c9c5');
 b.ell(0,.72,0,.19,.094,.084,'#e4e3d5');b.ell(.157,.80,.017,.076,.072,.071,cream);b.rod(.207,.792,.03,.33,.77,.03,.026,'#d6a25f',.006);
 for(const side of [-1,1]){
  const pts=[[0,0],[side*.30,.22],[side*.52,.26],[side*.66,.19],[side*.51,.16],[side*.31,.095],[side*.12,-.04]];
  b.form(pts,.060,side*.03,.735,0,'#c9d1cb',.1,.14*side);b.form([[0,0],[side*.16,-.03],[side*.066,-.057]],.061,side*.51,.96,0,'#647170');
 }
 b.ell(.174,.81,.076,.011,.011,.010,ink);
}
function seal(b,r){
 b.cyl(0,.103,0,.46,.31,.195,'#b4cbcc',7,0,.3);b.cyl(0,.21,0,.445,.46,.038,'#e4e8da',7,0,.3);
 b.ell(-.02,.34,.012,.33,.147,.148,'#aab8b3',0,0,.12);
 b.ell(.22,.46,.052,.143,.151,.123,'#b7c3bb');b.ell(.303,.434,.119,.081,.063,.043,'#d8d6c6');
 b.ell(.319,.461,.146,.023,.018,.023,ink);b.ell(.254,.492,.156,.018,.020,.015,ink);
 for(const side of [-1,1]){b.ell(-.28,.37,side*.078,.113,.044,.055,'#94a5a4',.1,side*.49,side*.07);b.ell(.061,.267,side*.144,.096,.040,.061,'#97aba7',.12,side*.44,.12);}
}
function weatherTide(b,w,r){if(w==='rain')crab(b,r);else if(w==='wind')gull(b,r);else if(w==='snow')seal(b,r);else kingfisher(b,r);}
function tide(b,k,w,r){
 const violet=['#aca0c1','#897fa8','#c9bcd5'],mint=['#9bc5b6','#74a9a4','#b8d6ca'];
 if(k===15){weatherTide(b,w,r);return;}
 switch(k){
 case 0:island(b,r,.73,true);anemone(b,0,.07,0,1.52,r,['#bb8a94','#b19ab5','#e9bbb5'],12);break;
 case 1:island(b,r,.62,true);jelly(b,-.14,1.07,-.06,1.06,r,mint,5);jelly(b,.24,.65,.11,.61,r,violet,4);break;
 case 2:island(b,r,.62,true);seaFan(b,0,.08,0,1.35,r,['#bc817e','#d39890','#ddafa5'],3);break;
 case 3:island(b,r,.68,true);openShell(b,0,.12,0,1.28,['#cbada6','#e4c6b6','#efd8c0']);break;
 case 4:waterGarden(b,r,1.12,true);break;
 case 5:island(b,r,.69,true);ray(b,0,.81,.02,.98,r,['#89aab1','#99b7bd','#c8cfbe']);starfish(b,-.19,.13,.09,.73,'#c79285');break;
 case 6:island(b,r,.71,true);coralTwig(b,-.16,.09,-.05,.92,'#b4a298',r,4);anemone(b,.18,.08,.08,.72,r,['#879fb3','#9cacc8','#c6c9d4'],7);break;
 case 7:island(b,r,.68,true);for(let j=0;j<6;j++)minnow(b,(j%3-1)*.24+(j>2?.08:0),.47+Math.floor(j/3)*.21+Math.sin(j)*.06,(j%2-.5)*.22,.73+r()*.18,['#b7c8ba','#8aa9ab']);break;
 case 8:seaArch(b,r);break;
 case 9:island(b,r,1.00,true);seaFan(b,-.33,.11,-.04,.59,r,['#c48892','#bd8196','#d5a5b2'],2);ray(b,.035,.98,0,1.18,r,['#c49399','#d6a9a6','#ddcbb4']);break;
 case 10:island(b,r,.72,true);jelly(b,-.10,1.28,-.05,1.26,r,violet,7);jelly(b,.29,.73,.13,.61,r,['#c3acd1','#ab93be','#dfc7db'],4);break;
 case 11:seahorse(b,r);break;
 case 12:island(b,r,.91,true);openShell(b,0,.13,0,1.60,['#d2afa8','#eed2c2','#e9d3b8']);starfish(b,.34,.13,.20,.6,'#b78171');break;
 case 13:amphora(b,r);break;
 case 14:island(b,r,1.28,true);openShell(b,.037,.13,.10,1.55,['#d2b5a6','#ead1bc','#edd7c1']);seaFan(b,-.38,.09,-.16,.79,r,['#b37c86','#c48d94','#d9a1a1'],2);coralTwig(b,.38,.09,-.1,.67,'#86ac9b',r,3);starfish(b,-.47,.14,.24,.59,'#d39980');break;
 }
}
function sky(b,k,w,r){
 if(k===15){weatherSky(b,w,r);return;}
 switch(k){
 case 0:
  cloudStone(b,r,.80);b.ell(-.06,.21,.02,.30,.19,.23,'#8f929b',0,.55,.18);
  for(let j=0;j<5;j++){const a=j*2.399;b.ell(-.06+Math.cos(a)*.17,.35-(j%2)*.04,.02+Math.sin(a)*.13,.046,.018,.035,'#79818c');}
  break;
 case 1:
  tripod(b,0,0,0,.92);b.cyl(0,.71,0,.24,.20,.065,brass,12,-.32);
  b.cyl(0,.748,.008,.203,.203,.023,'#668c96',12,-.32);
  b.rod(-.14,.72,.09,.144,.80,-.04,.013,gold);b.ell(0,.782,-.012,.037,.045,.038,gold);break;
 case 2:
  cloudStone(b,r,.67);b.rod(0,.08,0,.012,1.23,0,.027,brass,.019);
  b.form([[0,0],[.18,-.024],[.40,.035],[.291,-.071],[.38,-.125],[.166,-.16],[0,-.122]],.026,.01,1.18,0,'#718ba6');
  b.ell(.012,1.26,0,.035,.049,.035,gold);break;
 case 3:cloudBridge(b,r);break;
 case 4:
  pedestal(b,.82);b.rod(0,.38,0,0,.91,0,.029,brass);b.ell(0,.95,0,.209,.203,.203,'#c99f70');b.ring(0,.95,0,.31,.023,'#e6c491',1.20,-.22,.38);b.ring(0,.95,0,.345,.010,'#a9b2ae',1.2,-.22,.38);
  b.ell(.36,1.12,-.08,.048,.045,.047,'#93a5ad');break;
 case 5:{
  const radius=.28,H=1.20;cloudStone(b,r,.72);
  for(let i=0;i<3;i++){const a=i*TAU/3,q=(i+1)*TAU/3;const ax=Math.cos(a),az=Math.sin(a),qx=Math.cos(q),qz=Math.sin(q);
   b.rod(ax*radius,.10,az*radius,ax*.051,H,az*.051,.032,bronze,.016);
   for(let j=0;j<3;j++){const low=.13+.275*j,high=low+.245,lr=radius*(1-low/H),hr=radius*(1-high/H);b.rod(ax*lr,low,az*lr,qx*hr,high,qz*hr,.011,brass);}}
  b.ell(0,H+.05,0,.086,.091,.084,b.glow('#bdd4c8'));break;
 }
 case 6:cloudStone(b,r,.71);crystals(b,0,.10,0,1.17,r,6);break;
 case 7:
  cloudStone(b,r,.89);stroke(b,[[0,.10,0],[-.13,.34,.02],[-.03,.51,0],[.12,.62,-.05]],.051,bark,.52);
  for(let j=0;j<7;j++){const a=j*2.399,x=Math.cos(a)*.22,z=Math.sin(a)*.155;b.ell(x,.59+.11*Math.cos(a*.6),z,.181,.091,.149,j%2?'#90b09a':'#a6bba5');}
  break;
 case 8:observatory(b,r,false);break;
 case 9:armillary(b,r,true);break;
 case 10:telescope(b,r);break;
 case 11:balloon(b,r);break;
 case 12:orrery(b,r);break;
 case 13:prism(b,r);break;
 case 14:observatory(b,r,true);break;
 }
}
function grove(b,k,w,r){
 if(k===15){weatherGrove(b,w,r);return;}
 switch(k){
 case 0:island(b,r,.64);toad(b,-.14,-.03,1.24,r);toad(b,.23,.03,.64,r,['#b6764f','#d69b69'],5);break;
 case 1:island(b,r,.70);chanterelle(b,-.19,.04,1.17,r);chanterelle(b,.17,-.08,1.35,r);chanterelle(b,.14,.19,.62,r);break;
 case 2:stump(b,0,0,1.05,r,true);sprig(b,.28,.05,.08,.54,r,3);break;
 case 3:island(b,r,.61);coralTwig(b,-.11,.08,0,1.10,'#c99760',r,5);coralTwig(b,.18,.09,.07,.59,'#dfb277',r,3);break;
 case 4:forestLantern(b,r);break;
 case 5:island(b,r,.59);spiralFern(b,r);break;
 case 6:
  island(b,r,.78);b.ell(0,.22,0,.33,.23,.25,'#8c9884',.10,.31,.2);
  for(let j=0;j<8;j++){const a=j*2.399;b.ell(Math.cos(a)*.19,.377+Math.cos(a)*.044,Math.sin(a)*.11,.055+.022*r(),.026,.045,'#aeb58a');}
  toad(b,.27,.12,.43,r,['#c7b397','#d9c6a6'],3);break;
 case 7:
  island(b,r,.63);fern(b,-.10,.07,.0,.54,r,2);
  for(let j=0;j<9;j++){const a=j*2.399,x=Math.cos(a)*(.16+r()*.15),z=Math.sin(a)*.24,h=.20+r()*.39;
   b.rod(x*.68,.09,z*.68,x,h,z,.013,'#83965c',.009);b.ell(x,h,z,.033,.058,.033,b.glow(j%2?'#e1b964':'#f5d88c'));}
  break;
 case 8:mushroomHouse(b,r,false);break;
 case 9:stairStump(b,r);break;
 case 10:oyster(b,r);break;
 case 11:island(b,r,.75);spiralFern(b,r,true);break;
 case 12:snail(b,r);break;
 case 13:oldWell(b,r);break;
 case 14:mushroomHouse(b,r,true);break;
 }
}
function motion(b,type,pivot,draw){
 if(typeof b.motion==='function')b.motion(type,pivot,draw);else draw();
}
function herbarium(b,k,w,r){
 if(k===15){weatherHerb(b,w,r);return;}
 switch(k){
 case 0:case 7:motion(b,'swayZ',[0,0,0],()=>poppies(b,r,k===7));break;
 case 1:lupines(b,r);break;
 case 2:daisies(b,r);break;
 case 3:motion(b,'swayZ',[0,0,0],()=>bellflowers(b,r));break;
 case 4:iris(b,r);break;
 case 5:fern(b,0,0,0,1.14,r,5);break;
 case 6:waterGarden(b,r,1.14);break;
 case 8:conservatory(b,r,false);break;
 case 9:magnolia(b,r);break;
 case 10:hydrangea(b,r);break;
 case 11:fountain(b);break;
 case 12:hive(b,r);break;
 case 13:roseArch(b,r);break;
 case 14:conservatory(b,r,true);break;
 }
}
export function natureModel(b,theme,kind,weather,rng){
 const fn={herbarium,grove,sky,tide}[theme];
 if(fn)fn(b,kind,weather,rng);
}
