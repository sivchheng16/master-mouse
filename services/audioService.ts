class AudioService {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private createOscillator(
    freq: number,
    type: OscillatorType = 'sine',
    duration = 0.1,
    gainValue = 0.1,
    startTime: number | null = null,
    endFreq: number | null = null
  ) {
    this.init();
    if (!this.ctx) return;

    const start = startTime ?? this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (endFreq !== null) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, start + duration);
    }

    gain.gain.setValueAtTime(gainValue, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(start);
    osc.stop(start + duration);
  }

  playPop() {
    this.createOscillator(800, 'sine', 0.1, 0.2, null, 200);
  }

  playExplosion() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Low frequency rumble
    this.createOscillator(100, 'sawtooth', 0.4, 0.4, now, 10);
    this.createOscillator(80, 'square', 0.4, 0.3, now, 5);

    // Noise burst simulation using random frequencies
    [100, 200, 300, 400].forEach((f, i) => {
      const offset = Math.random() * 0.05;
      this.createOscillator(f + Math.random() * 100, 'sawtooth', 0.2, 0.2, now + offset, 50);
    });
  }

  playHover() {
    this.createOscillator(900, 'sine', 0.03, 0.03);
  }

  playWhack() {
    this.createOscillator(100, 'square', 0.1, 0.1, null, 50);
    this.createOscillator(400, 'sine', 0.1, 0.1);
  }

  playGameStart() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [329.63, 392.0, 523.25, 659.25].forEach((f, i) => {
      this.createOscillator(f, 'sine', 0.5, 0.08, now + i * 0.08, f * 1.2);
    });
  }

  playSuccess() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      this.createOscillator(f, 'triangle', 0.4, 0.1, now + i * 0.1);
    });
  }

  playError() {
    this.createOscillator(150, 'sawtooth', 0.3, 0.1, null, 80);
  }

  playCollect() {
    this.createOscillator(880, 'sine', 0.15, 0.1, null, 1760);
  }

  playDragStart() {
    this.createOscillator(400, 'sine', 0.1, 0.05, null, 600);
  }

  playDragEnd() {
    this.createOscillator(600, 'sine', 0.1, 0.05, null, 400);
  }

  playBubble() {
    this.createOscillator(1200, 'sine', 0.08, 0.05, null, 1500);
  }

  playFluid() {
    const freq = 1000 + Math.random() * 2000;
    this.createOscillator(freq, 'sine', 0.05, 0.02);
  }

  playTing(index: number = 0) {
    const frequencies = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25];
    const freq = frequencies[index % frequencies.length];
    this.createOscillator(freq, 'sine', 0.3, 0.1, null, freq * 1.05);
  }

  playPianoNote(index: number) {
    // C4, E4, G4, C5 (Major arpeggio)
    const freqs = [261.63, 329.63, 392.00, 523.25];
    const freq = freqs[index % freqs.length];

    this.init();
    if (!this.ctx) return;

    // Simple piano synthesis using triangle wave with harmonics
    const now = this.ctx.currentTime;
    const duration = 0.6;

    const playHarmonic = (f: number, g: number) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now);
      gain.gain.setValueAtTime(g, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now);
      osc.stop(now + duration);
    };

    playHarmonic(freq, 0.15);
    playHarmonic(freq * 2, 0.05); // Harmonic 1
    playHarmonic(freq * 3, 0.02); // Harmonic 2
  }
}

export const audioService = new AudioService();