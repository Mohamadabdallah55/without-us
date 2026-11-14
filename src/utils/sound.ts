/** Short procedural sound effects. Muted by default. */
export type SoundMode = 'muted' | 'quiet' | 'on';

class SoundManager {
  private ctx: AudioContext | null = null;
  private output: GainNode | null = null;
  private mode: SoundMode = 'muted';

  setMode(mode: SoundMode) {
    this.mode = mode;
    if (this.output) this.output.gain.value = this.volume();
  }

  private volume() {
    return this.mode === 'muted' ? 0 : this.mode === 'quiet' ? .24 : .7;
  }

  private impact(low: number, high: number, duration: number, delay = 0) {
    if (this.mode === 'muted') return;
    try {
      const Context = window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Context) return;
      this.ctx ??= new Context();
      const ctx = this.ctx;
      if (!this.output) {
        this.output = ctx.createGain();
        this.output.gain.value = this.volume();
        this.output.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
      const frames = Math.ceil(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < frames; i++) samples[i] = (Math.random() * 2 - 1) * (1 - i / frames) ** 2;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = .55;
      const at = ctx.currentTime + delay;
      filter.frequency.setValueAtTime(high, at);
      filter.frequency.exponentialRampToValueAtTime(low, at + duration);
      source.connect(filter).connect(this.output);
      source.start(at);
    } catch {
      // Audio support or permission must never interrupt play.
    }
  }

  playTap() { this.impact(420, 1450, .055); }
  playTick() { this.impact(1200, 2900, .045); }
  playStart() { this.impact(170, 860, .16); }
  playFaceoff() { this.impact(280, 1700, .17); this.impact(560, 2050, .08, .075); }
  playDramaticCue() { this.impact(190, 980, .22); }
  playReveal() { this.impact(130, 2700, .25); }
  playLead() { this.impact(840, 2400, .10, .18); }
  playVictory() { this.impact(190, 3200, .34); this.impact(600, 2400, .13, .18); }
}

export const soundFx = new SoundManager();
