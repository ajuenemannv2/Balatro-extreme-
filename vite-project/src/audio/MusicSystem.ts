import * as Tone from 'tone';

export type TrackId = 'menu' | 'game' | 'shop' | 'boss';

interface TrackNodes {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parts: Tone.Part<any>[];
  instruments: Tone.ToneAudioNode[];
  masterGain: Tone.Gain;
}

function buildMenuTrack(): TrackNodes {
  const masterGain = new Tone.Gain(0.6).toDestination();
  const reverb = new Tone.Reverb(2.5).connect(masterGain);
  reverb.wet.value = 0.4;

  const chords = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.08, decay: 0.3, sustain: 0.4, release: 1.2 },
  }).connect(reverb);
  chords.volume.value = -10;

  const bass = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.02, decay: 0.4, sustain: 0.3, release: 0.8 },
  }).connect(masterGain);
  bass.volume.value = -14;

  const chordSeq: Array<{ time: string; notes: string[]; dur: string }> = [
    { time: '0:0', notes: ['D3','F3','A3','C4'], dur: '2n' },
    { time: '0:2', notes: ['G3','B3','D4'], dur: '2n' },
    { time: '1:0', notes: ['C3','E3','G3','B3'], dur: '2n' },
    { time: '1:2', notes: ['A3','C4','E4'], dur: '2n' },
    { time: '2:0', notes: ['D3','F3','A3','C4'], dur: '2n' },
    { time: '2:2', notes: ['G3','B3','D4'], dur: '2n' },
    { time: '3:0', notes: ['F3','A3','C4','E4'], dur: '4n' },
    { time: '3:2', notes: ['G3','B3','D4'], dur: '4n' },
  ];

  const bassLine: Array<{ time: string; note: string; dur: string }> = [
    { time: '0:0', note: 'D2', dur: '4n' },
    { time: '0:2', note: 'G2', dur: '4n' },
    { time: '1:0', note: 'C2', dur: '4n' },
    { time: '1:2', note: 'A2', dur: '4n' },
    { time: '2:0', note: 'D2', dur: '4n' },
    { time: '2:2', note: 'G2', dur: '4n' },
    { time: '3:0', note: 'F2', dur: '4n' },
    { time: '3:2', note: 'G2', dur: '4n' },
  ];

  const chordPart = new Tone.Part((time, val: typeof chordSeq[0]) => {
    chords.triggerAttackRelease(val.notes, val.dur, time);
  }, chordSeq);
  chordPart.loopEnd = '4m';
  chordPart.loop = true;

  const bassPart = new Tone.Part((time, val: typeof bassLine[0]) => {
    bass.triggerAttackRelease(val.note, val.dur, time);
  }, bassLine);
  bassPart.loopEnd = '4m';
  bassPart.loop = true;

  return { parts: [chordPart, bassPart], instruments: [chords, bass, reverb, masterGain], masterGain };
}

function buildGameTrack(): TrackNodes {
  const masterGain = new Tone.Gain(0.55).toDestination();
  const delay = new Tone.FeedbackDelay('8n', 0.25).connect(masterGain);
  delay.wet.value = 0.2;

  const lead = new Tone.Synth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.01, decay: 0.15, sustain: 0.4, release: 0.3 },
  }).connect(delay);
  lead.volume.value = -12;

  const chords = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'square' },
    envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.4 },
  }).connect(masterGain);
  chords.volume.value = -18;

  const bass = new Tone.Synth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.2 },
  }).connect(masterGain);
  bass.volume.value = -10;

  const hihat = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
    harmonicity: 5.1, modulationIndex: 32,
  }).connect(masterGain);
  hihat.frequency.value = 400;
  hihat.volume.value = -24;

  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.05, octaves: 6,
    envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 },
  }).connect(masterGain);
  kick.volume.value = -14;

  const melody: Array<{ time: string; note: string; dur: string }> = [
    { time:'0:0', note:'D4', dur:'8n' }, { time:'0:1', note:'F4', dur:'8n' },
    { time:'0:2', note:'A4', dur:'8n' }, { time:'0:3', note:'C5', dur:'8n' },
    { time:'1:0', note:'A4', dur:'4n' }, { time:'1:2', note:'G4', dur:'4n' },
    { time:'2:0', note:'F4', dur:'8n' }, { time:'2:1', note:'G4', dur:'8n' },
    { time:'2:2', note:'A4', dur:'8n' }, { time:'2:3', note:'C5', dur:'8n' },
    { time:'3:0', note:'D5', dur:'2n' },
  ];

  const bassLine: Array<{ time: string; note: string; dur: string }> = [
    { time:'0:0', note:'D2', dur:'8n' }, { time:'0:2', note:'D2', dur:'8n' },
    { time:'0:2.5', note:'F2', dur:'8n' }, { time:'1:0', note:'G2', dur:'8n' },
    { time:'1:2', note:'G2', dur:'8n' }, { time:'2:0', note:'C2', dur:'8n' },
    { time:'2:2', note:'C2', dur:'8n' }, { time:'3:0', note:'A2', dur:'4n' },
    { time:'3:2', note:'G2', dur:'4n' },
  ];

  const hihatPattern: Array<{ time: string }> = Array.from({ length: 16 }, (_, i) => ({
    time: `0:${Math.floor(i / 2)}:${(i % 2) * 2}`,
  }));

  const kickPattern: Array<{ time: string }> = [
    { time:'0:0' }, { time:'0:2' }, { time:'1:0' }, { time:'1:2' },
    { time:'2:0' }, { time:'2:2' }, { time:'3:0' }, { time:'3:2' },
  ];

  const melodyPart = new Tone.Part((time, val: typeof melody[0]) => {
    lead.triggerAttackRelease(val.note, val.dur, time);
  }, melody);
  melodyPart.loopEnd = '4m'; melodyPart.loop = true;

  const bassPart = new Tone.Part((time, val: typeof bassLine[0]) => {
    bass.triggerAttackRelease(val.note, val.dur, time);
  }, bassLine);
  bassPart.loopEnd = '4m'; bassPart.loop = true;

  const hihatPart = new Tone.Part((time) => {
    hihat.triggerAttackRelease('16n', time);
  }, hihatPattern);
  hihatPart.loopEnd = '1m'; hihatPart.loop = true;

  const kickPart = new Tone.Part((time) => {
    kick.triggerAttackRelease('C1', '8n', time);
  }, kickPattern);
  kickPart.loopEnd = '4m'; kickPart.loop = true;

  return { parts: [melodyPart, bassPart, hihatPart, kickPart], instruments: [lead, chords, bass, hihat, kick, delay, masterGain], masterGain };
}

function buildShopTrack(): TrackNodes {
  const masterGain = new Tone.Gain(0.5).toDestination();
  const reverb = new Tone.Reverb(1.8).connect(masterGain);
  reverb.wet.value = 0.3;

  const vibes = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.005, decay: 0.8, sustain: 0.1, release: 1.5 },
  }).connect(reverb);
  vibes.volume.value = -12;

  const pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.5, decay: 0.5, sustain: 0.8, release: 2 },
  }).connect(reverb);
  pad.volume.value = -20;

  const melody: Array<{ time: string; note: string; dur: string }> = [
    { time:'0:0', note:'G4', dur:'4n' }, { time:'0:2', note:'A4', dur:'4n' },
    { time:'1:0', note:'B4', dur:'4n' }, { time:'1:2', note:'D5', dur:'4n' },
    { time:'2:0', note:'C5', dur:'2n' }, { time:'3:0', note:'B4', dur:'4n' },
    { time:'3:2', note:'A4', dur:'4n' },
  ];

  const padSeq: Array<{ time: string; notes: string[]; dur: string }> = [
    { time:'0:0', notes:['G3','B3','D4'], dur:'1m' },
    { time:'1:0', notes:['A3','C4','E4'], dur:'1m' },
    { time:'2:0', notes:['C3','E3','G3','B3'], dur:'1m' },
    { time:'3:0', notes:['D3','F3','A3'], dur:'1m' },
  ];

  const melodyPart = new Tone.Part((time, val: typeof melody[0]) => {
    vibes.triggerAttackRelease(val.note, val.dur, time);
  }, melody);
  melodyPart.loopEnd = '4m'; melodyPart.loop = true;

  const padPart = new Tone.Part((time, val: typeof padSeq[0]) => {
    pad.triggerAttackRelease(val.notes, val.dur, time);
  }, padSeq);
  padPart.loopEnd = '4m'; padPart.loop = true;

  return { parts: [melodyPart, padPart], instruments: [vibes, pad, reverb, masterGain], masterGain };
}

function buildBossTrack(): TrackNodes {
  const masterGain = new Tone.Gain(0.6).toDestination();
  const distortion = new Tone.Distortion(0.4).connect(masterGain);
  const reverb = new Tone.Reverb(1.2).connect(masterGain);
  reverb.wet.value = 0.25;

  const bass = new Tone.Synth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0.6, release: 0.2 },
  }).connect(distortion);
  bass.volume.value = -10;

  const lead = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.3 },
  }).connect(reverb);
  lead.volume.value = -14;

  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.08, octaves: 8,
    envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.2 },
  }).connect(masterGain);
  kick.volume.value = -12;

  const bassLine: Array<{ time: string; note: string; dur: string }> = [
    { time:'0:0', note:'D2', dur:'8n' }, { time:'0:1', note:'D2', dur:'8n' },
    { time:'0:2', note:'Eb2', dur:'8n' }, { time:'0:3', note:'D2', dur:'8n' },
    { time:'1:0', note:'G2', dur:'8n' }, { time:'1:2', note:'A2', dur:'8n' },
    { time:'2:0', note:'F2', dur:'8n' }, { time:'2:2', note:'G2', dur:'8n' },
    { time:'3:0', note:'Bb2', dur:'4n' }, { time:'3:2', note:'A2', dur:'4n' },
  ];

  const chromatic: Array<{ time: string; note: string; dur: string }> = [
    { time:'0:0', note:'A5', dur:'8n' }, { time:'0:2', note:'G#5', dur:'8n' },
    { time:'1:0', note:'G5', dur:'8n' }, { time:'1:2', note:'F#5', dur:'8n' },
    { time:'2:0', note:'F5', dur:'8n' }, { time:'2:2', note:'E5', dur:'8n' },
    { time:'3:0', note:'Eb5', dur:'4n' },
  ];

  const kickPat: Array<{ time: string }> = [
    { time:'0:0' }, { time:'0:1.5' }, { time:'1:0' }, { time:'1:2' },
    { time:'2:0' }, { time:'2:3' }, { time:'3:0' }, { time:'3:2' },
  ];

  const bassPart = new Tone.Part((time, val: typeof bassLine[0]) => {
    bass.triggerAttackRelease(val.note, val.dur, time);
  }, bassLine);
  bassPart.loopEnd = '4m'; bassPart.loop = true;

  const leadPart = new Tone.Part((time, val: typeof chromatic[0]) => {
    lead.triggerAttackRelease(val.note, val.dur, time);
  }, chromatic);
  leadPart.loopEnd = '4m'; leadPart.loop = true;

  const kickPart = new Tone.Part((time) => {
    kick.triggerAttackRelease('C1', '8n', time);
  }, kickPat);
  kickPart.loopEnd = '4m'; kickPart.loop = true;

  return { parts: [bassPart, leadPart, kickPart], instruments: [bass, lead, kick, distortion, reverb, masterGain], masterGain };
}

export class MusicSystem {
  private currentTrackId: TrackId | null = null;
  private currentNodes: TrackNodes | null = null;
  private musicVolume = 0.7;
  private muted = false;
  private started = false;

  async start(): Promise<void> {
    await Tone.start();
    Tone.getTransport().bpm.value = 120;
    this.started = true;
  }

  async switchTrack(id: TrackId): Promise<void> {
    if (this.currentTrackId === id) return;
    if (!this.started) await this.start();

    // Fade out current
    if (this.currentNodes) {
      const gain = this.currentNodes.masterGain;
      gain.gain.rampTo(0, 0.5);
      await new Promise(r => setTimeout(r, 600));
      this.currentNodes.parts.forEach(p => { p.stop(); p.dispose(); });
      this.currentNodes.instruments.forEach(i => i.dispose());
      this.currentNodes = null;
    }

    Tone.getTransport().stop();
    Tone.getTransport().cancel();

    const bpmMap: Record<TrackId, number> = { menu: 90, game: 120, shop: 100, boss: 130 };
    Tone.getTransport().bpm.value = bpmMap[id];

    const builders: Record<TrackId, () => TrackNodes> = {
      menu: buildMenuTrack,
      game: buildGameTrack,
      shop: buildShopTrack,
      boss: buildBossTrack,
    };

    this.currentNodes = builders[id]();
    this.currentNodes.masterGain.gain.value = this.muted ? 0 : this.musicVolume;
    this.currentNodes.parts.forEach(p => p.start(0));
    Tone.getTransport().start();
    this.currentTrackId = id;
  }

  stop(): void {
    if (this.currentNodes) {
      this.currentNodes.masterGain.gain.rampTo(0, 0.3);
      setTimeout(() => {
        this.currentNodes?.parts.forEach(p => { p.stop(); p.dispose(); });
        this.currentNodes?.instruments.forEach(i => i.dispose());
        this.currentNodes = null;
        this.currentTrackId = null;
      }, 400);
    }
    Tone.getTransport().stop();
  }

  setVolume(v: number): void {
    this.musicVolume = Math.max(0, Math.min(1, v));
    if (this.currentNodes && !this.muted) {
      this.currentNodes.masterGain.gain.rampTo(this.musicVolume, 0.1);
    }
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.currentNodes) {
      this.currentNodes.masterGain.gain.rampTo(m ? 0 : this.musicVolume, 0.2);
    }
  }
}
