// Small ecology and infrastructure families accompany the larger painted landmarks.
export const familyLabels={
 herbarium:['虞美人','羽扇豆','雏菊花丛','风铃草','鸢尾','蕨丛','睡莲池','野罂粟','玻璃花房','玉兰树','绣球花','铜喷泉','蜂箱','月季拱门','花房地标'],
 harbor:['领航灯','单桅帆船','海风磨坊','海岸松林','渔屋','修船木栈','救生浮标','海湾村落','灯塔守望所','双桅帆船','蒸汽拖船','船坞吊架','航海钟浮标','渔具屋','港湾地标'],
 fair:['旋转木马','小摩天轮','条纹帐篷','气球车','圆顶戏棚','飞椅','玩具摊','节庆气球','金冠旋木','流动风琴车','彩厢摩天轮','占星家篷车','珐琅飞椅','花饰售票亭','游园地标'],
 tide:['海葵','水母群','海扇','珍珠贝','水莲','蝠鲼','海底花丛','银鱼群','潮蚀石拱','海礁蝠鲼','紫水母','珊瑚海马','砗磲珠贝','沉船陶罐','潮池地标'],
 grove:['斑点伞菇','金黄鸡油菌','菌褶枯木','鹿角菌','银铃风灯','卷叶蕨','石上地衣','萤火苔圃','蘑菇灯屋','菌阶古桩','紫蓝侧耳','萤卵卷蕨','巡夜蜗牛','苔石古井','菌林地标'],
 alpine:['雪线云杉','路标石堆','滑雪板架','山地候车亭','山羊与岩坡','高山火绒草','山道篱笆','山溪木桥','登山缆车站','雪谷石拱桥','齿轨小火车','山地吊厢','钟楼礼拜堂','红窗山舍','雪岭地标'],
 canal:['荷叶小塘','双撑篙舟','石级码头','垂柳','沿河花窗','风灯摊','芦苇滩','石狮桥墩','江南月桥','篷顶货船','湖心亭','千丝古柳','江边水车','临水茶铺','水乡地标'],
 sky:['陨石坑','星盘三脚架','星旗台','云端吊桥','行星环仪','天顶测距塔','发光晶簇','悬云盆景','铜穹天文台','黄铜浑天仪','长筒望远镜','星象热气球','巡天星仪','折光棱镜','云上地标']
};
const PI=Math.PI,T=PI*2;
const choice=(r,a)=>a[Math.floor(r()*a.length)];
function o(c,x,y,rx,ry,c0,a=0){c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),a,0,T);c.fillStyle=c0;c.fill();}
function l(c,x,y,X,Y,col,w=1){c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.strokeStyle=col;c.lineWidth=w;c.stroke();}
function q(c,x,y,cx,cy,X,Y,col,w=1){c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(cx,cy,X,Y);c.strokeStyle=col;c.lineWidth=w;c.stroke();}
function p(c,pts,color){c.beginPath();c.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)c.lineTo(pts[i],pts[i+1]);c.closePath();c.fillStyle=color;c.fill();}
function g(c,x,y,X,Y,...colors){const grad=c.createLinearGradient(x,y,X,Y);colors.forEach((col,i)=>grad.addColorStop(i/(colors.length-1),col));return grad;}
function local(c,x,y,s,f){c.save();c.translate(x,y);c.scale(s,s);f();c.restore();}
function rock(c,x,y,s,colors){p(c,[x-7*s,y,x-5*s,y-5*s,x+1*s,y-8*s,x+8*s,y-2*s,x+5*s,y+2*s,x-2*s,y+2*s],colors[0]);p(c,[x-7*s,y,x+1*s,y-8*s,x+2*s,y-2*s,x-2*s,y+2*s],colors[1]);p(c,[x+1*s,y-8*s,x+8*s,y-2*s,x+3*s,y-3*s],colors[2]);}
function gravel(c,r,pal,n=6){for(let i=0;i<n;i++){const x=(r()-.5)*24,y=(r()-.5)*3;rock(c,x,y,.12+r()*.32,pal);}}
const stone=['#82918c','#bdc1ad','#e4d9af'],moss=['#526e52','#819568','#b2aa74'],slate=['#6d7a85','#a0acb2','#d4d3c8'],cloudrock=['#8b8896','#c6bcc2','#e7d7bb'];
function lamp(c,x,y,s,shade='#c2844d'){local(c,x,y,s,()=>{p(c,[-2.8,-4,2.8,-4,2.1,1,-1.9,1],g(c,-2,0,2,0,'#b37a3c','#ffe6a3',shade));p(c,[-3.5,-4,0,-6,3.5,-4],shade);l(c,0,-5,0,-7,'#715d48',.6);l(c,-2,1,2,1,'#826642',1);});}
function mushroom(c,x,y,h,rad,cap,r){
 local(c,x,y,1,()=>{
  c.beginPath();c.moveTo(-rad*.28,0);c.bezierCurveTo(-rad*.05,-h*.52,-rad*.18,-h*.72,-rad*.14,-h);c.lineTo(rad*.27,-h);c.bezierCurveTo(rad*.06,-h*.55,rad*.2,-h*.22,rad*.43,0);c.closePath();c.fillStyle=g(c,-rad*.3,0,rad*.42,0,'#a29578','#f5e2b4','#bea783');c.fill();
  o(c,0,-h,rad,rad*.34,'#bd987c',-.05);for(let i=0;i<12;i++){const a=i*PI/11;l(c,0,-h+1,Math.cos(a)*rad*.93,-h+Math.sin(a)*rad*.28,'#e8cba8',.35);}
  c.beginPath();c.moveTo(-rad,-h);c.bezierCurveTo(-rad*.85,-h-rad*.62,-rad*.35,-h-rad*.91,0,-h-rad*.93);c.bezierCurveTo(rad*.67,-h-rad*.9,rad*.76,-h-rad*.31,rad,-h);c.quadraticCurveTo(rad*.05,-h+rad*.21,-rad,-h);c.fillStyle=g(c,-rad,-h-rad*.6,rad,-h,cap[0],cap[1],cap[2]);c.fill();
  for(let j=0;j<7;j++){const px=(r()-.5)*rad*1.43,py=-h-rad*(.15+r()*.40);o(c,px,py,rad*(.044+r()*.07),rad*.046,'#f8d5a0',-.12);}
 });
}
function pine(c,x,y,s){local(c,x,y,s,()=>{l(c,0,0,0,-28,'#725d4b',1.7);for(let i=0;i<5;i++){const yy=-8-i*4,w=8.4-i*1.27;p(c,[-w,yy+3,0,yy-11,w,yy+3,1,yy+2],i%2?'#4f7568':'#42685c');p(c,[-w,yy+3,0,yy-11,-.5,yy+1],i%2?'#88a794':'#739482');}});}
function fern(c,x,y,s,r,col='#648c68'){for(let f=0;f<5;f++){const dx=(f-2)*5*s,h=(12+r()*9)*s;q(c,x,y,x+dx*.32,y-h*.8,x+dx,y-h,col,.6*s);for(let j=1;j<9;j++){const t=j/9,xx=x+dx*(.6*t+.4*t*t),yy=y-h*(1.6*t-.6*t*t),hh=Math.sin(t*PI)*3.7*s;for(const side of [-1,1])o(c,xx+side*hh*.5,yy-hh*.48,hh*.25+.1,hh*.68+.1,col,side*.79);}}}
function flags(c,x,y,h,col){l(c,x,y,x,y-h,'#78684c',1.1);p(c,[x,y-h,x+8,y-h+1.2,x+5,y-h+2.7,x+8.4,y-h+4.2,x,y-h+3.5],col);}
function step(c,x,y,w,h,top,side){p(c,[x-w,y,x,y-3,x+w,y-1,x+w*.1,y+2],top);p(c,[x-w,y,x+w*.1,y+2,x+w*.1,y+2+h,x-w,y+h],side);p(c,[x+w*.1,y+2,x+w,y-1,x+w,y-1+h,x+w*.1,y+2+h],side);}
function walkway(c,r,stoneFlag=false){for(let i=0;i<9;i++){const x=-14+i*3.5,w=3.2,y=-3-Math.sin(i*PI/8)*2;p(c,[x,y,x+w,y-.2,x+w+1,y+2.1,x+.3,y+2.4],stoneFlag?'#b5b4a2':i%2?'#bc9d70':'#a58965');}for(const xx of [-13,12])l(c,xx,0,xx,-9,stoneFlag?'#969e90':'#806c52',1.6);q(c,-13,-9,0,-13,12,-9,stoneFlag?'#9eaa9f':'#927b5d',.95);}
function roof(c,x,y,w,col){p(c,[x-w,y,x-w*.67,y-2,x-w*.25,y-6,x,y-9,x+w*.28,y-6,x+w*.77,y-1,x+w,y-2,x+w*.83,y+1,x+w*.07,y+3,x-w*.84,y+2],col);for(let k=-4;k<=4;k++)l(c,x+k*w*.145,y+.8,x+k*w*.105,y-3.4,'#9ca7a1',.45);}
function grove(c,k,r){
 gravel(c,r,moss);
 if(k===0||k===1){const red=['#ec9d67','#ba624a','#8a4c40'],gold=['#ffdf75','#d79c45','#a4753e'];mushroom(c,-5,0,16+r()*9,9+r()*3,k?gold:red,r);mushroom(c,7,-1,9,6,k?gold:red,r);mushroom(c,12,1,5,3.8,k?gold:red,r);}
 else if(k===2){p(c,[-15,-5,-9,-11,15,-8,13,0,-9,1],'#795b44');o(c,-11,-4,4.6,5.8,'#bb9470',.4);for(let i=0;i<4;i++){o(c,-6+i*4,-8-i%2*3,4.8-i*.5,2-i*.17,choice(r,['#ca9158','#dca767','#bea384']),-.16);}fern(c,8,-2,.46,r);}
 else if(k===3){for(let i=0;i<9;i++){const x=(r()-.5)*14,h=6+r()*12;q(c,x*.4,0,x+.4,-h*.6,x,-h,'#cd9557',1.5);q(c,x,-h*.55,x+4,-h*.71,x+4.1,-h*.9,'#e0b16b',1.15);}}
 else if(k===4){q(c,-4,0,-9,-22,0,-28,'#796c4a',2);q(c,0,-28,7,-29,6,-22,'#9b8660',1.7);lamp(c,6,-14,1.4,'#9d8953');fern(c,-4,0,.45,r);}
 else if(k===5){fern(c,0,0,1.35,r);for(let j=0;j<2;j++){const xx=8+j*4,h=16+j*3;l(c,xx,0,xx-2,-h,'#85976e',1.05);c.beginPath();c.arc(xx-4,-h,2,0,T);c.strokeStyle='#9faa6b';c.lineWidth=1.0;c.stroke();}}
 else if(k===6){rock(c,1,0,1.6,moss);for(let i=0;i<14;i++)o(c,(r()-.5)*14,-4-r()*4,1+r()*1.2,.7,'#a6ad7a');mushroom(c,9,0,5,3,['#d7c0ad','#9d949b','#827b85'],r);}
 else{for(let i=0;i<11;i++){const x=(r()-.5)*17,y=-4-r()*9;l(c,x*.6,0,x,y,'#728264',.55);o(c,x,y,1.1,1.8,'#d9bc73');}fern(c,-7,0,.4,r);}
}
function alpine(c,k,r){
 gravel(c,r,slate);
 if(k===0){pine(c,-6,1,.7);pine(c,2,-1,1.0);pine(c,8,1,.48);}
 else if(k===1){for(let j=0;j<4;j++)rock(c,(j%2-.5)*1.2,-j*3.1,.88-j*.13,slate);flags(c,8,0,12,'#c87e62');}
 else if(k===2){for(let j=0;j<4;j++){const x=(j-1.5)*2.1; q(c,x+4,0,x,-8,x-3,-18-(j%2)*2,['#c98358','#9c5346','#668e91','#c3a760'][j],2.3);l(c,x-1.5,-11,x-2,-13,'#e6d0ad',.8);}l(c,-8,-8,8,-8,'#9b815e',1.5);}
 else if(k===3){l(c,-8,0,-8,-14,'#755e4d',1.8);l(c,8,0,8,-14,'#755e4d',1.8);p(c,[-11,-14,-1,-23,12,-15,8,-13,-1,-19,-8,-13],g(c,-8,-20,9,-14,'#abc2be','#7d928f'));l(c,-7,-4,8,-4,'#a47b56',2);lamp(c,4,-8,.52);}
 else if(k===4){rock(c,-5,1,1,slate);local(c,3,-5,.75,()=>{o(c,0,-3,5.8,2.9,'#bca17f');l(c,-3,-2,-4,2,'#857660',1.2);l(c,3,-2,3,2,'#857660',1.2);o(c,5.5,-6,2.05,2.3,'#ab967c',-.25);q(c,5,-7,1,-14,3,-14,'#746751',1.1);q(c,6,-7,3,-13,5,-13,'#8c785d',.85);});}
 else if(k===5){for(let i=0;i<5;i++){const x=(r()-.5)*15,y=-8-r()*8;l(c,x*.7,0,x,y,'#81906c',.8);for(let j=0;j<6;j++)o(c,x+Math.cos(j*T/6)*2,y+Math.sin(j*T/6)*1.6,.8,2,'#ece9d3',j*T/6);o(c,x,y,1.25,1,'#d2aa5a');}}
 else if(k===6){for(let j=0;j<4;j++){let x=-11+j*7;l(c,x,0,x,-7-j%2,'#887865',1.4);}l(c,-12,-5,11,-4.4,'#b59b78',1.6);l(c,-12,-2,11,-1.4,'#aa9070',1.4);pine(c,9,-1,.39);}
 else{walkway(c,r);rock(c,-14,1,.5,slate);rock(c,14,-1,.54,slate);}
}
function canal(c,k,r){
 gravel(c,r,stone,3);
 if(k===0){for(let i=0;i<6;i++){const x=(r()-.5)*22,y=(r()-.5)*5;o(c,x,y,4+r()*2.5,2.1,'#78977d',-.12);if(i%2===0)for(let j=-2;j<=2;j++)o(c,x+j*.7,y-2.3-Math.cos(j)*.6,1.2,2.3,j%2?'#e1a5a3':'#f3cbc1',j*.36);}}
 else if(k===1){p(c,[-15,-4,-10,-2,12,-2,16,-5,13,.5,-8,1],'#755c47');l(c,-12,-2,13,-3,'#c7a676',.95);l(c,-8,-10,7,2,'#876f52',.9);p(c,[-5,-3,-3,-13,4,-14,8,-4],g(c,-4,-8,5,-8,'#927751','#c6aa76','#8f7453'));}
 else if(k===2){for(let j=0;j<4;j++)step(c,-j*.9,-j*2.6,9-j*.8,1.7,'#c3be9f','#919a8e');l(c,8,-1,8,-10,'#a69779',1.35);}
 else if(k===3){q(c,-2,0,0,-8,0,-20,'#8c785a',2.8);for(let k2=0;k2<15;k2++){const dx=(r()-.5)*24,h=7+r()*8,y=-15-r()*6;q(c,0,-18,dx*.9,-28,dx,y+h,'#789571',.85);for(let j=0;j<5;j++)o(c,dx+(r()-.5)*1.4,y+j*h/5,.55,1.5,'#91a982',-.18);}}
 else if(k===4){p(c,[-13,0,13,0,13,-10,-13,-10],'#e3dec8');roof(c,0,-11,15,'#6b7a76');c.beginPath();c.arc(0,-4.5,3.7,0,T);c.strokeStyle='#778a83';c.lineWidth=1.3;c.stroke();l(c,-3.5,-4.5,3.5,-4.5,'#9ba49a',.6);}
 else if(k===5){l(c,-5,0,-5,-18,'#8f7858',1.5);l(c,-6,-17,7,-17,'#977d58',1.3);for(let j=0;j<2;j++){const x=j*5;l(c,x,-17,x,-13,'#8f7858',.55);o(c,x,-11.4,2.3,2.8,'#ba7160');l(c,x,-9.2,x,-7.5,'#b69a65',.7);}}
 else if(k===6){for(let j=0;j<13;j++){const x=(r()-.5)*19,y=-6-r()*14;q(c,x,0,x+2,-7,x+3,y,'#7d916e',.67);if(j%3===0)o(c,x+3,y,1,2.8,'#a38a65',.2);}}
 else{step(c,0,0,8,2,'#c4bda4','#8b9a92');o(c,0,-4,3.8,3.2,'#9aa796');o(c,-1,-8,2.8,2.8,'#bac0a8');q(c,1,-3,7,-8,4,-7,'#a5ad98',1.3);}
}
function sky(c,k,r){
 gravel(c,r,cloudrock,4);
 if(k===0){rock(c,-4,1,.95,cloudrock);rock(c,5,-1,.5,cloudrock);for(let i=0;i<5;i++)o(c,-4+(r()-.5)*8,-3-r()*3,1.1,.8,'#958d90');}
 else if(k===1){for(let i=-1;i<=1;i++)l(c,0,-12,i*6,0,'#98764e',1.3);o(c,0,-14,7,3.1,'#b5a077',-.43);o(c,0,-14,5.8,2.1,'#587183',-.43);l(c,-5,-12,4,-15.5,'#e6cc81',.75);}
 else if(k===2){step(c,0,0,6,1.5,'#cabfa5','#958778');flags(c,0,-1,23,'#738aa5');o(c,0,-24,.9,.9,'#e7c77b');}
 else if(k===3){rock(c,-13,1,.53,cloudrock);rock(c,12,1,.54,cloudrock);walkway(c,r);}
 else if(k===4){l(c,0,0,0,-14,'#aa8756',1.5);o(c,0,-15,5.3,5.1,g(c,-5,-18,5,-12,'#e9c98a','#c08d55','#836c59'));c.beginPath();c.ellipse(0,-15,9,2.1,-.32,.1,T-.2);c.strokeStyle='#cfb590';c.lineWidth=.85;c.stroke();}
 else if(k===5){p(c,[-6,0,0,-26,6,0,3,0,0,-16,-3,0],'#ae8f69');for(let j=0;j<4;j++)l(c,-5+j,-3-j*3,3-j,-6-j*2,'#d0b78c',.65);o(c,0,-27,1.6,1.6,'#a4b6ce');}
 else if(k===6){for(let i=0;i<6;i++){const x=(i-2.5)*2.9,h=6+r()*11;p(c,[x-1.8,0,x-1.9,-h*.72,x,-h,x+2.3,-h*.71,x+1.8,0],g(c,x-2,-h,x+2,0,'#d3e9e2','#a9c1cc','#a7a2ba'));}}
 else{rock(c,0,0,1,cloudrock);q(c,0,-4,-3,-11,1,-14,'#937d61',1.4);for(let i=0;i<7;i++)o(c,(r()-.5)*12,-12-r()*5,2.8,1.8,choice(r,['#82a695','#99b6a2','#c0cbaf']));}
}
export function nativeNew(c,theme,kind,r){({grove,alpine,canal,sky}[theme]||grove)(c,kind,r);}

export const weatherFamilies={
 herbarium:['蜂农花篮','玻璃护苗罩','花瓣风车','暖灯育苗床'],harbor:['晒网鱼市','篷布雨船','满帆纵帆船','红壳破冰船'],
 fair:['棉花糖车','雨伞糖果亭','风筝摊','热可可车'],tide:['潮木翠鸟','贝壳藏蟹','逐浪海鸥','冰上小海豹'],
 grove:['林间小鹿','叶伞双蛙','枫籽风轮','冬眠刺猬'],alpine:['山径向导犬','山道雨棚','山顶风向袋','木雪橇'],
 canal:['担筐果摊','油纸伞渡船','竹风车架','围炉茶席'],sky:['镜面逐日仪','云台量雨仪','翼帆气球','冰晶观测架']
};
export const landmarkNames={herbarium:'玻璃花室',harbor:'归航灯塔',fair:'鎏金旋转木马',tide:'珍珠珊瑚礁',grove:'萤灯蘑菇屋',alpine:'红缆车山站',canal:'柳岸石拱桥',sky:'黄铜观星台'};
