export const weathers={auto:'随演奏变化',clear:'晴朗',rain:'细雨',wind:'起风',snow:'飘雪'};
export const lights={auto:'随演奏变化',dawn:'清晨',day:'白天',dusk:'黄昏',night:'夜晚'};
export const weatherIcon={auto:'journey',clear:'sun',rain:'rain',wind:'wind',snow:'snow'};
const up=(a,b,c)=>a<b&&b<c;
const down=(a,b,c)=>a>b&&b>c;
export const discoveries={
 herbarium:{name:'玻璃花室',hint:'连弹三个越来越高的音',match:up},
 harbor:{name:'归航灯塔',hint:'同一个音连弹三次',match:(a,b,c)=>a===b&&b===c},
 fair:{name:'鎏金旋转木马',hint:'弹出低、高、低三个音',match:(a,b,c)=>a<b&&b>c},
 tide:{name:'珍珠珊瑚礁',hint:'连弹三个越来越低的音',match:down},
 grove:{name:'萤灯蘑菇屋',hint:'同音弹两次，再弹高音',match:(a,b,c)=>a===b&&c>b},
 alpine:{name:'红缆车山站',hint:'弹出高、低、高三个音',match:(a,b,c)=>a>b&&c>b},
 canal:{name:'柳岸石拱桥',hint:'先弹低音，再把高音弹两次',match:(a,b,c)=>a<b&&b===c},
 sky:{name:'黄铜观星台',hint:'向上跨五度，再弹回起音',match:(a,b,c)=>b-a>=7&&c===a}
};
export function freeClimate(seed,count){
 const phase=Math.floor(Math.max(0,count-1)/16);
 const wheel=['clear','rain','wind','snow'];
 const light=['dawn','day','dusk','night'];
 const cycle=Math.floor(phase/4),offset=(seed>>>7)%3;
 if(offset)wheel.splice(1,3,...Array.from({length:3},(_,i)=>['rain','wind','snow'][(i+offset)%3]));
 return {weather:wheel[(phase+(cycle%2?2:0))%4],light:light[phase%4]};
}
