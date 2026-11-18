// Short flights and landings use the instrument's audio graph and master volume.
export class LandscapeSound {
  constructor(engine){this.engine=engine;this.nodes=new Set();this.bed=null;this.lastCue=-1}
  cancel(){
    for(const node of this.nodes){try{node.stop()}catch{}}
    this.nodes.clear();
  }
  tone(type,start,f0,f1,length,peak,target){
    const ctx=this.engine.ctx,osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type=type;osc.frequency.setValueAtTime(f0,start);osc.frequency.exponentialRampToValueAtTime(f1,start+length);
    gain.gain.setValueAtTime(.00001,start);gain.gain.exponentialRampToValueAtTime(peak,start+Math.min(.025,length*.28));gain.gain.exponentialRampToValueAtTime(.00001,start+length);
    osc.connect(gain);gain.connect(target);this.nodes.add(osc);
    osc.onended=()=>{this.nodes.delete(osc);osc.disconnect();gain.disconnect()};osc.start(start);osc.stop(start+length+.01);
  }
  note(event,delay,weather,special){
    const ctx=this.engine.ctx;if(!ctx||ctx.state!=='running'||delay<=0)return;
    const now=ctx.currentTime,arrival=now+delay/1000,base=440*2**((event.m-69)/12);
    if(now-this.lastCue<.06&&!special)return;this.lastCue=now;
    const level=.017*event.v, mix=this.engine.mix;
    this.tone('sine',now,base*2.01,base*3,.13,level*.60,mix);
    this.tone('sine',arrival,base*(weather==='snow'?3:2),base*(weather==='snow'?2.99:1.98),special?.56:.21,level*1.5,mix);
    if(special)this.tone('triangle',arrival+.08,base*1.5,base*1.5,.53,level,mix);
  }
  ambience(weather,enabled){
    const ctx=this.engine.ctx;if(!ctx||!this.engine.mix)return;
    const wanted=enabled&&ctx.state==='running'?weather:null;
    if(this.bed?.weather===wanted)return;
    if(this.bed){
      const old=this.bed;this.bed=null;
      old.gain.gain.cancelScheduledValues(ctx.currentTime);old.gain.gain.setTargetAtTime(.00001,ctx.currentTime,.12);old.source.stop(ctx.currentTime+.6);
    }
    if(!wanted)return;
    const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
    const weatherColor={clear:[790,.006],rain:[2700,.037],wind:[480,.040],snow:[3300,.008]}[weather];
    source.buffer=this.engine.noise;source.loop=true;filter.type='lowpass';filter.frequency.value=weatherColor[0];filter.Q.value=.3;
    source.connect(filter);filter.connect(gain);gain.connect(this.engine.mix);gain.gain.value=0;gain.gain.setTargetAtTime(weatherColor[1],ctx.currentTime,.6);
    source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect()};source.start();this.bed={source,gain,weather};
  }
}
