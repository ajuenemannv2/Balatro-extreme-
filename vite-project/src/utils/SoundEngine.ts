let _ctx: AudioContext | null = null;

function ctx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext();
  return _ctx;
}

function tone(
  freq: number,
  endFreq: number,
  duration: number,
  waveType: OscillatorType = 'sine',
  volume = 0.25,
  delay = 0,
): void {
  try {
    const ac = ctx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = waveType;
    osc.frequency.setValueAtTime(freq, ac.currentTime + delay);
    if (endFreq !== freq) osc.frequency.exponentialRampToValueAtTime(endFreq, ac.currentTime + delay + duration);
    gain.gain.setValueAtTime(volume, ac.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(ac.currentTime + delay);
    osc.stop(ac.currentTime + delay + duration);
  } catch { /* audio context blocked or unavailable */ }
}

export const SFX = {
  cardSelect(): void {
    tone(880, 660, 0.06, 'sine', 0.15);
  },

  cardDeselect(): void {
    tone(500, 350, 0.05, 'sine', 0.1);
  },

  cardFlip(): void {
    tone(700, 350, 0.08, 'triangle', 0.18);
  },

  chipScore(): void {
    tone(1000, 800, 0.1, 'sine', 0.2);
    tone(1200, 900, 0.08, 'sine', 0.12, 0.04);
  },

  multScore(): void {
    tone(300, 240, 0.12, 'sawtooth', 0.12);
    tone(450, 360, 0.1, 'sine', 0.15, 0.05);
  },

  handPlay(): void {
    // Quick chord sweep
    tone(400, 400, 0.25, 'sine', 0.18);
    tone(500, 500, 0.25, 'sine', 0.15, 0.03);
    tone(600, 600, 0.25, 'sine', 0.12, 0.06);
  },

  purchase(): void {
    // Rising ding
    tone(440, 880, 0.12, 'sine', 0.2);
    tone(660, 1320, 0.1, 'sine', 0.15, 0.1);
  },

  packOpen(): void {
    // Ascending shimmer arpeggio
    const freqs = [440, 554, 659, 784, 988];
    freqs.forEach((f, i) => tone(f, f * 1.05, 0.12, 'sine', 0.15, i * 0.06));
  },

  blindWon(): void {
    // Triumphant short fanfare
    tone(523, 523, 0.15, 'sine', 0.22);
    tone(659, 659, 0.15, 'sine', 0.2, 0.15);
    tone(784, 784, 0.3, 'sine', 0.25, 0.3);
    tone(1047, 1047, 0.4, 'sine', 0.22, 0.45);
  },

  gameOver(): void {
    // Descending drone
    tone(440, 220, 0.5, 'sawtooth', 0.2);
    tone(370, 185, 0.6, 'sawtooth', 0.15, 0.3);
    tone(294, 147, 0.8, 'sawtooth', 0.1, 0.7);
  },

  error(): void {
    tone(220, 180, 0.15, 'square', 0.1);
  },

  /** Call on first user gesture to unlock the AudioContext on iOS/Safari */
  unlock(): void {
    try {
      if (!_ctx) _ctx = new AudioContext();
      if (_ctx.state === 'suspended') _ctx.resume();
    } catch { /* ignore */ }
  },
};
