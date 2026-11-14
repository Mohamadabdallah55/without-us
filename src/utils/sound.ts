/**
 * Procedural non-musical Web Audio synthesizer (wood taps & soft chimes).
 * Defaults to Quiet Mode (muted = true) suitable for mosque gatherings.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private muted = true; // Quiet mode ON by default

  isMuted(): boolean {
    return this.muted;
  }

  setMuted(next: boolean) {
    this.muted = next;
  }

  private getCtx(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', gainPeak = 0.08, delay = 0) {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playTap() {
    this.playTone(520, 0.06, 'triangle', 0.05);
  }

  playReveal(isOutlier: boolean) {
    if (isOutlier) {
      this.playTone(392, 0.14, 'triangle', 0.07, 0);
      this.playTone(311, 0.22, 'triangle', 0.07, 0.09);
    } else {
      this.playTone(523.25, 0.12, 'sine', 0.06, 0);
      this.playTone(659.25, 0.2, 'sine', 0.06, 0.08);
    }
  }

  playTick() {
    this.playTone(880, 0.035, 'sine', 0.035);
  }

  playDramaticCue() {
    this.playTone(293.66, 0.18, 'triangle', 0.07, 0);
    this.playTone(440, 0.28, 'sine', 0.07, 0.14);
  }

  playVictory() {
    this.playTone(523.25, 0.14, 'sine', 0.07, 0);
    this.playTone(659.25, 0.14, 'sine', 0.07, 0.1);
    this.playTone(783.99, 0.28, 'sine', 0.08, 0.2);
  }
}

export const soundFx = new SoundManager();
