import {familyLabels,weatherFamilies,landmarkNames} from './scenery-worlds.js';
import {weatherIds} from './scenery-air.js';
export function hash(a) {
  a = Math.imul(a ^ (a >>> 16), 0x7feb352d);
  a = Math.imul(a ^ (a >>> 15), 0x846ca68b);
  return (a ^ (a >>> 16)) >>> 0;
}
export function random(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let z = Math.imul(state ^ (state >>> 15), 1 | state);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

export class ScoreDistribution {
  describeNote(index) {
    if(!this.events[index])return null;
    const kind=this.family(index);
    if(kind===15)return weatherFamilies[this.theme][weatherIds.indexOf(this.weather)];
    if(kind===14)return landmarkNames[this.theme];
    return familyLabels[this.theme][kind];
  }
  seedFor(i) {
    const ev=this.events[i];return hash((Number(ev.s)||0)^this.seed^Math.imul(i+1,2654435761)^Math.imul(ev.m|0,486187739));
  }
  family(i) {return this.site(i).kind}
}
