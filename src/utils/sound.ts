/** Short original synthesized effects; no downloads or background audio. */
export type SoundMode = 'muted' | 'quiet' | 'on';
class SoundManager {
  private ctx:AudioContext|null=null;
  private output:GainNode|null=null;
  private noise:AudioBuffer|null=null;
  private mode:SoundMode='quiet';
  private lastTick=0;
  private live=0;
  getMode(){return this.mode;}
  private volume(){return this.mode==='muted'?0:this.mode==='quiet'?.22:.55;}
  setMode(mode:SoundMode){this.mode=mode;if(this.output&&this.ctx)this.output.gain.setTargetAtTime(this.volume(),this.ctx.currentTime,.015);}
  unlock(){
    if(this.mode==='muted')return;
    try{
      const Context=window.AudioContext||(window as Window & {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
      if(!Context)return;this.ctx??=new Context();
      if(!this.output){this.output=this.ctx.createGain();this.output.gain.value=this.volume();this.output.connect(this.ctx.destination);}
      if(this.ctx.state==='suspended')void this.ctx.resume().catch(()=>{});
    }catch{}
  }
  private tone(from:number,to:number,duration:number,delay=0,level=.22){
    if(this.mode==='muted'||this.live>=18)return;
    this.unlock();const ctx=this.ctx,out=this.output;if(!ctx||!out)return;
    try{const osc=ctx.createOscillator(),gain=ctx.createGain(),at=ctx.currentTime+delay;
      osc.frequency.setValueAtTime(from,at);osc.frequency.exponentialRampToValueAtTime(to,at+duration);
      gain.gain.setValueAtTime(.001,at);gain.gain.exponentialRampToValueAtTime(level,at+.012);gain.gain.exponentialRampToValueAtTime(.001,at+duration);
      osc.connect(gain).connect(out);osc.start(at);osc.stop(at+duration+.015);this.live++;
      osc.onended=()=>{this.live=Math.max(0,this.live-1);osc.disconnect();gain.disconnect();};
    }catch{}
  }
  private impact(low:number,high:number,duration:number,delay=0){
    if(this.mode==='muted'||this.live>=18)return;this.unlock();
    const ctx=this.ctx,out=this.output;if(!ctx||!out)return;
    try{if(!this.noise){this.noise=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.55),ctx.sampleRate);const samples=this.noise.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;}
      const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain(),at=ctx.currentTime+delay;
      src.buffer=this.noise;filter.type='bandpass';filter.Q.value=.6;filter.frequency.setValueAtTime(high,at);filter.frequency.exponentialRampToValueAtTime(low,at+duration);
      gain.gain.setValueAtTime(.23,at);gain.gain.exponentialRampToValueAtTime(.001,at+duration);
      src.connect(filter).connect(gain).connect(out);src.start(at,0,duration);this.live++;
      src.onended=()=>{this.live=Math.max(0,this.live-1);src.disconnect();filter.disconnect();gain.disconnect();};
    }catch{}
  }
  playTap(){this.tone(700,390,.06);this.impact(500,1750,.055);}
  playTick(){const now=Date.now();if(now-this.lastTick<650)return;this.lastTick=now;this.tone(940,760,.085);}
  playStart(){this.impact(150,1450,.22);this.tone(180,340,.18,.02);this.tone(440,670,.14,.16);}
  playFaceoff(){this.impact(220,2100,.19);this.tone(110,72,.17);this.impact(480,1900,.09,.12);}
  playDramaticCue(){this.tone(160,90,.23);this.impact(220,950,.3,.04);this.tone(155,85,.19,.19);}
  playCard(){this.impact(700,2900,.15);this.tone(490,820,.13,.04);}
  playHide(){this.impact(380,1250,.10);this.tone(450,260,.09);}
  playVote(){this.tone(540,750,.10);this.tone(820,1050,.12,.09);}
  playTimeout(){this.tone(350,170,.23);this.impact(220,1000,.18,.03);}
  playReveal(){this.impact(170,2700,.32);this.tone(140,65,.26);this.tone(500,850,.15,.17);}
  playLead(){this.tone(450,680,.16);this.tone(680,950,.18,.13);}
  playVictory(){this.impact(250,3200,.35);this.tone(280,550,.21);this.tone(550,820,.22,.15);this.tone(820,1100,.30,.32);}
}
export const soundFx=new SoundManager();
