import { Howl } from 'howler';

type SFXId =
  | 'card_deal' | 'card_play' | 'discard' | 'chip_hit'
  | 'mult_trigger' | 'joker_activate' | 'buy' | 'sell'
  | 'win_round' | 'game_over';

function renderWav(renderFn: (ctx: OfflineAudioContext) => void, duration: number, sr = 44100): Promise<string> {
  return new Promise((resolve) => {
    const offline = new OfflineAudioContext(1, Math.floor(sr * duration), sr);
    renderFn(offline);
    offline.startRendering().then((buffer) => {
      const numSamples = buffer.length;
      const data = buffer.getChannelData(0);
      const headerBytes = 44;
      const totalBytes = headerBytes + numSamples * 2;
      const ab = new ArrayBuffer(totalBytes);
      const view = new DataView(ab);
      const writeStr = (offset: number, s: string) => {
        for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
      };
      writeStr(0, 'RIFF');
      view.setUint32(4, totalBytes - 8, true);
      writeStr(8, 'WAVE');
      writeStr(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sr, true);
      view.setUint32(28, sr * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeStr(36, 'data');
      view.setUint32(40, numSamples * 2, true);
      for (let i = 0; i < numSamples; i++) {
        view.setInt16(headerBytes + i * 2, Math.max(-1, Math.min(1, data[i])) * 0x7fff, true);
      }
      const blob = new Blob([ab], { type: 'audio/wav' });
      resolve(URL.createObjectURL(blob));
    });
  });
}

function makeTone(ctx: OfflineAudioContext, freq: number, startTime: number, duration: number, type: OscillatorType = 'sine', gainVal = 0.4): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(gainVal, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

function makeNoise(ctx: OfflineAudioContext, cutoff: number, duration: number, gainVal = 0.3): void {
  const bufSize = Math.floor(ctx.sampleRate * duration);
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
  const source = ctx.createBufferSource();
  source.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = cutoff;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainVal, 0);
  gain.gain.exponentialRampToValueAtTime(0.001, duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(0);
}

export class SFXSystem {
  private sounds = new Map<SFXId, Howl>();
  private volume = 0.8;
  private muted = false;

  async preload(): Promise<void> {
    const sfxDefs: Array<{ id: SFXId; duration: number; fn: (ctx: OfflineAudioContext) => void }> = [
      {
        id: 'card_deal', duration: 0.08,
        fn: (ctx) => makeNoise(ctx, 3000, 0.08, 0.25),
      },
      {
        id: 'card_play', duration: 0.12,
        fn: (ctx) => { makeNoise(ctx, 800, 0.04, 0.3); makeTone(ctx, 220, 0, 0.1, 'sine', 0.15); },
      },
      {
        id: 'discard', duration: 0.1,
        fn: (ctx) => makeNoise(ctx, 1500, 0.1, 0.2),
      },
      {
        id: 'chip_hit', duration: 0.06,
        fn: (ctx) => makeTone(ctx, 880, 0, 0.06, 'sine', 0.3),
      },
      {
        id: 'mult_trigger', duration: 0.15,
        fn: (ctx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(400, 0);
          osc.frequency.linearRampToValueAtTime(900, 0.12);
          gain.gain.setValueAtTime(0.35, 0);
          gain.gain.exponentialRampToValueAtTime(0.001, 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(0); osc.stop(0.15);
        },
      },
      {
        id: 'joker_activate', duration: 0.2,
        fn: (ctx) => {
          makeTone(ctx, 220, 0, 0.05, 'sine', 0.2);
          makeTone(ctx, 440, 0.05, 0.08, 'triangle', 0.25);
          makeTone(ctx, 660, 0.1, 0.1, 'sine', 0.2);
        },
      },
      {
        id: 'buy', duration: 0.25,
        fn: (ctx) => {
          makeTone(ctx, 523, 0, 0.07, 'sine', 0.3);
          makeTone(ctx, 659, 0.07, 0.07, 'sine', 0.3);
          makeTone(ctx, 784, 0.14, 0.1, 'sine', 0.3);
        },
      },
      {
        id: 'sell', duration: 0.2,
        fn: (ctx) => {
          makeTone(ctx, 784, 0, 0.06, 'sine', 0.25);
          makeTone(ctx, 659, 0.06, 0.06, 'sine', 0.25);
          makeTone(ctx, 523, 0.12, 0.08, 'sine', 0.25);
        },
      },
      {
        id: 'win_round', duration: 0.5,
        fn: (ctx) => {
          const notes = [523, 659, 784, 1047];
          notes.forEach((f, i) => makeTone(ctx, f, i * 0.1, 0.2, 'sine', 0.25));
        },
      },
      {
        id: 'game_over', duration: 0.6,
        fn: (ctx) => {
          const notes = [392, 349, 330, 262];
          notes.forEach((f, i) => makeTone(ctx, f, i * 0.12, 0.25, 'triangle', 0.2));
        },
      },
    ];

    await Promise.all(sfxDefs.map(async ({ id, duration, fn }) => {
      try {
        const url = await renderWav(fn, duration);
        this.sounds.set(id, new Howl({ src: [url], format: ['wav'], volume: this.volume }));
      } catch (e) {
        console.warn(`Failed to generate SFX "${id}":`, e);
      }
    }));
  }

  play(id: SFXId, opts?: { rate?: number }): void {
    if (this.muted) return;
    const howl = this.sounds.get(id);
    if (howl) {
      const sound = howl.play();
      if (opts?.rate && typeof sound === 'number') howl.rate(opts.rate, sound);
    }
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    for (const h of this.sounds.values()) h.volume(this.volume);
  }

  setMuted(m: boolean): void { this.muted = m; }
}
