export const themes = {
  herbarium:{name:'雾野花房', en:'Wildflower House', instrument:'钢琴', instrumentEn:'Piano', icon:'flower', art:'0% 0%', alt:'虞美人、蓍草与种荚的彩色植物版画'},
  harbor:{name:'风信港湾', en:'Windward Harbour', instrument:'排箫', instrumentEn:'Pan Flute', icon:'beacon', art:'100% 0%', alt:'晨光下的灯塔、木栈桥与帆船'},
  fair:{name:'琥珀游园', en:'The Amber Fair', instrument:'木琴', instrumentEn:'Xylophone', icon:'wheel', art:'0% 100%', alt:'黄昏里并肩而立的旋转木马与摩天轮'},
  tide:{name:'月下潮池', en:'Moonlit Tidepool', instrument:'竖琴', instrumentEn:'Harp', icon:'shell', art:'100% 100%', alt:'潮池中的紫色水母、珊瑚与海葵'},
  grove:{name:'萤火菌林',en:'Firefly Grove',instrument:'木琴',instrumentEn:'Xylophone',dock:'fair',icon:'flower'},
  alpine:{name:'雪岭驿站',en:'Alpine Station',instrument:'钢琴',instrumentEn:'Piano',dock:'herbarium',icon:'beacon'},
  canal:{name:'烟雨水乡',en:'Willow Canal',instrument:'排箫',instrumentEn:'Pan Flute',dock:'harbor',icon:'shell'},
  sky:{name:'云上天文台',en:'Sky Observatory',instrument:'竖琴',instrumentEn:'Harp',dock:'tide',icon:'wheel'}
};
const iconPaths = {
 journey:'<circle cx="12" cy="12" r="9"/><path d="m16.5 7.5-3 6-6 3 3-6z"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
 rain:'<path d="M5 14a4 4 0 0 1-1-7.8 6 6 0 0 1 11.4-1A4.5 4.5 0 1 1 18 14Z M8 17l-1.5 3m7-3L12 21m7-4-1 2"/>',
 wind:'<path d="M2 8h11c4 0 4-6 .5-5M3 12h15c5 0 5 7 0 6M2 16h7c3.5 0 4 5 1 5"/>',
 snow:'<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9.5 4l2.5 3 2.5-3m-5 16 2.5-3 2.5 3M4.5 10 8 9l-.4-3.4m8.8 12.8L16 15l3.5-1M4.5 14 8 15l-.4 3.4m8.8-12.8L16 9l3.5 1"/>',
 moon:'<path d="M19.9 15.2A9 9 0 0 1 9 3a9.2 9.2 0 1 0 10.9 12.2Z"/>',
 seed:'<path d="M5 21C7 12 16 8 19 3 6 3 1.8 11.6 7.3 15.9M8.5 15c3.2.3 8.6-.9 11-8.7"/>',
 book:'<path d="M12 5v15m0-14C8 3 4 4 2 5v14c4-1.5 7-.8 10 1.2 3-2 6-2.7 10-1.2V5c-3-1-6-2-10 1Z"/>',
 hand:'<path d="M7.2 12.8V6.4a1.5 1.5 0 0 1 3 0v4.2-6.3a1.5 1.5 0 0 1 3 0v6.1-4.7a1.45 1.45 0 0 1 2.9 0v6.1-3.4a1.45 1.45 0 0 1 2.9 0v6.5c0 4.3-2.4 7-6.4 7-2.2 0-4-.9-5.4-2.7L3.6 14a1.55 1.55 0 0 1 2.4-2Z"/>',
 pinch:'<path d="m5 18 1-4.4 3.3-3.9a1.4 1.4 0 0 1 2.1 1.7l-1.3 2.2 2 .2 3.6-6.4a1.45 1.45 0 0 1 2.6 1.3l-2.9 5.7 1.8-2.3c1-1.1 2.7 0 2 1.3l-3.4 6.3c-1.4 2.6-4.9 2.8-7.4 1.6L5 20M3 8V5h3m12-2h3v3"/><circle cx="10.6" cy="6.4" r="1" fill="currentColor" stroke="none"/>',
 sliders:'<path d="M4 6h8m5 0h3M4 12h2m5 0h9M4 18h10m5 0h1"/><circle cx="14.5" cy="6" r="2.3"/><circle cx="8.5" cy="12" r="2.3"/><circle cx="16.5" cy="18" r="2.3"/>',
 keys:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M5 9h1m3 0h1m3 0h1m3 0h1M6 12h1m3 0h1m3 0h1M7 15h10"/>',
 flower:'<path d="M12 14c1.3 4-.2 6.3-1.2 8m1.9-4.3c2.5-3.6 5.3-3 6.8-3-.8 2.2-3 3.8-6.8 3M11.9 14C6 15.4 3.1 12.5 3.5 7.7c2.4 0 3.8 1 4.7 2C7 6.3 8.2 3.5 11.2 2c1.5 1.4 2.5 3.5 2.3 5.6 1.5-2.4 3.4-3.4 5.6-3.1 1.1 3.8-.5 8-7.2 9.5Z"/>',
 beacon:'<path d="m7 21 2-13h6l2 13M8 8h8m-7-1V4l3-2 3 2v3m-6 6 6 2M3 21h18M2 6l4-1m12 0 4 1"/>',
 wheel:'<circle cx="12" cy="9.2" r="6.8"/><circle cx="12" cy="9.2" r="1"/><path d="m12 3 0 5m-5-3 4 3.7m6-4L13 8.5m5 3.5-5-2m-7 2 5-2m-4 11 5-11 5 11M4 22h16"/>',
 shell:'<path d="m9 20-6-8C.5 8 4.3 4.2 7 5c1.7-3.5 5.8-3.9 8-1.5 3-.5 5 1.2 5.3 3.5 2.6 1 2.2 4.3.8 6L15 20Zm1-1L6 8m6 11L10 5m3 14 2-13m0 13 4-9m-10 12h6"/>',
 shuffle:'<path d="M3 6h3c4.5 0 6.5 12 11 12h4m-4-4 4 4-4 4M3 18h3c1.7 0 3.3-1.5 4.6-4.3m2.8-5.4C14.4 6.8 15.6 6 17 6h4m-4-4 4 4-4 4"/>',
 score:'<path d="M3 7h17M3 11h17M3 15h17M3 19h17m-8-4V3l4.5 2"/><ellipse cx="10" cy="16" rx="2.4" ry="1.6" transform="rotate(-20 10 16)" fill="currentColor"/>',
 focus:'<path d="M9 3H4v5m11-5h5v5M4 16v5h5m6 0h5v-5"/><circle cx="12" cy="12" r="3"/>',
 play:'<path fill="currentColor" stroke="none" d="M7 3.8a.9.9 0 0 1 1.4-.8l12.1 8.2a1 1 0 0 1 0 1.6L8.4 21a.9.9 0 0 1-1.4-.8Z"/>',
 pause:'<path fill="currentColor" stroke="none" d="M6 4h4v16H6zm8 0h4v16h-4z"/>',
 undo:'<path d="m8 4-5 5 5 5M4 9h9a6 6 0 0 1 0 12H9"/>',
 new:'<path d="M6 2h8l4 4v5M6 2v19h7M13 2v6h5m-3 9h7m-3.5-3.5v7"/>',
 save:'<path d="M4 3h13l3 3v15H4zM8 3v6h8V3M8 20v-7h8v7"/>',
 plus:'<path d="M5 12h14m-7-7v14"/>', minus:'<path d="M5 12h14"/>', close:'<path d="m5 5 14 14m0-14L5 19"/>',
 down:'<path d="m5 9 7 7 7-7"/>', arrow:'<path d="m8 5 7 7-7 7"/>'
};
export function icon(key){return '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(iconPaths[key]||'')+'</svg>'}
export function randomSeed(){return crypto.getRandomValues(new Uint32Array(1))[0]}
function rng(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
const naturals=[60,62,64,65,67,69,71,72,74,76,77,79,81,83,84];
const scores=[
 {name:'晨雾来信',theme:'herbarium',bpm:106,notes:[0,4,5,7,6,4,2,1,2,4,7,9,8,7,5,4,2,4,5,7,9,7,4,2,1,0],rhythm:[1,.5,.5,1.5,.5,1,1,1]},
 {name:'从灯塔寄出',theme:'harbor',bpm:92,notes:[0,2,4,7,8,7,5,4,2,4,5,7,9,8,7,4,2,1,2,4,7,5,4,2,0],rhythm:[1,.75,.25,1.5,.5,1]},
 {name:'纸风车圆舞曲',theme:'fair',bpm:122,notes:[4,7,9,11,9,7,5,8,10,12,10,8,7,9,11,9,7,4,2,5,8,7,4,0],rhythm:[1,.5,.5,1,1,1,1]},
 {name:'一封潮汐',theme:'tide',bpm:80,notes:[2,4,7,9,7,4,2,5,8,10,8,5,4,7,9,12,11,9,7,5,4,2,0],rhythm:[1,.75,.5,1.25,.5,1.5]}
];
export const demos=scores.map(({name,theme})=>({name,theme}));
function build(notes,rhythm,bpm,theme,title,seed){
 const random=rng(seed);let t=0;
 const events=notes.map((n,i)=>{
   const event={m:naturals[n],t:Number(t.toFixed(4)),v:.62+random()*.21+(i%4===0?.08:0),s:Math.floor(random()*4294967296)};
   t+=rhythm[i%rhythm.length]*60/bpm;
   return event;
 });
 return {format:'airborne-atlas/1',title,theme,seed,night:false,events};
}
export function getDemo(index){const d=scores[index];return build(d.notes,d.rhythm,d.bpm,d.theme,d.name,randomSeed())}
export function improvise(theme){
 const seed=randomSeed(), random=rng(seed), scale=[0,1,2,4,5,7,8,9,11,12], start=1+Math.floor(random()*3);
 const phrase=[0,1,2,3].map((_,i)=>i?Math.floor(random()*5)-2:0);
 const notes=[],rhythm=[];
 for(let section=0;section<4;section++){
   let degree=start+[0,2,3,0][section];const count=section===3?6:7;
   for(let i=0;i<count;i++){
     degree=Math.max(0,Math.min(scale.length-1,degree+phrase[i%4]+(i>=4?Math.floor(random()*3)-1:0)));
     notes.push(i===count-1&&section===3?0:scale[degree]);
     rhythm.push(i===count-1?1.5:[.5,.5,.75,1][Math.floor(random()*4)]);
   }
 }
 const names={herbarium:['花窗','一枚种子','温室'],harbor:['北风','灯塔','归船'],fair:['纸风车','木马','琥珀灯'],tide:['月光','海萤','潮声'],grove:['萤灯','苔径'],alpine:['雪线','缆车'],canal:['拱桥','柳巷'],sky:['星轨','云钟']};
 const title=names[theme][Math.floor(random()*3)]+['小品','变奏','随想'][Math.floor(random()*3)];
 return build(notes,rhythm,80+Math.floor(random()*38),theme,title,seed);
}
