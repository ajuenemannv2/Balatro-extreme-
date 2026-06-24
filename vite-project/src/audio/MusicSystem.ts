import { Howl } from 'howler';

export type TrackId = 'menu' | 'game' | 'shop' | 'boss';

// 'shop' and 'menu' share the same audio file (Title_shop_theme)
const TRACK_SRC: Record<TrackId, string> = {
  menu: '/music/menu.m4a',
  shop: '/music/menu.m4a',
  game: '/music/game.m4a',
  boss: '/music/boss.m4a',
};

// Per-track volume multipliers — compensate for different recording levels
const TRACK_VOL: Record<TrackId, number> = {
  menu: 0.80,
  shop: 0.70,
  game: 0.88,
  boss: 0.95,
};

const FADE_MS = 1200;

export class MusicSystem {
  private howls = new Map<string, Howl>();
  private currentTrackId: TrackId | null = null;
  private activeSrc: string | null = null;
  private activeSoundId: number | null = null;
  private activeVol = 0;
  private musicVolume = 0.65;
  private muted = false;

  // No-op: Howler auto-unlocks on first user gesture (no Tone.start() needed)
  async start(): Promise<void> {}

  private _howl(src: string): Howl {
    if (!this.howls.has(src)) {
      this.howls.set(src, new Howl({
        src: [src],
        loop: true,
        volume: 0,
        html5: true,   // stream audio — avoids full decode stall on large files
        preload: true,
        format: ['m4a'],
      }));
    }
    return this.howls.get(src)!;
  }

  async switchTrack(id: TrackId): Promise<void> {
    const newSrc = TRACK_SRC[id];

    // Same audio file already playing → just update track metadata (menu↔shop)
    if (this.activeSrc === newSrc && this.activeSoundId !== null) {
      this.currentTrackId = id;
      return;
    }

    const targetVol = this.muted ? 0 : this.musicVolume * TRACK_VOL[id];

    // Fade out the current track
    if (this.activeSoundId !== null && this.activeSrc) {
      const oldHowl = this.howls.get(this.activeSrc);
      const oldId = this.activeSoundId;
      const oldVol = this.activeVol;
      if (oldHowl) {
        oldHowl.fade(oldVol, 0, FADE_MS, oldId);
        setTimeout(() => { try { oldHowl.stop(oldId); } catch { /**/ } }, FADE_MS + 100);
      }
      this.activeSoundId = null;
      this.activeSrc = null;
      this.activeVol = 0;
    }

    // Start the new track with a fade-in
    const howl = this._howl(newSrc);
    const soundId = howl.play();
    howl.volume(0, soundId);
    howl.fade(0, targetVol, FADE_MS, soundId);

    this.activeSrc = newSrc;
    this.activeSoundId = soundId;
    this.activeVol = targetVol;
    this.currentTrackId = id;
  }

  stop(): void {
    if (this.activeSoundId !== null && this.activeSrc) {
      const howl = this.howls.get(this.activeSrc);
      const id = this.activeSoundId;
      const vol = this.activeVol;
      if (howl) {
        howl.fade(vol, 0, 600, id);
        setTimeout(() => { try { howl.stop(id); } catch { /**/ } }, 700);
      }
    }
    this.activeSoundId = null;
    this.activeSrc = null;
    this.activeVol = 0;
    this.currentTrackId = null;
  }

  setVolume(v: number): void {
    this.musicVolume = Math.max(0, Math.min(1, v));
    if (!this.muted && this.activeSoundId !== null && this.activeSrc && this.currentTrackId) {
      const howl = this.howls.get(this.activeSrc);
      if (howl) {
        const targetVol = this.musicVolume * TRACK_VOL[this.currentTrackId];
        howl.volume(targetVol, this.activeSoundId);
        this.activeVol = targetVol;
      }
    }
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.activeSoundId !== null && this.activeSrc && this.currentTrackId) {
      const howl = this.howls.get(this.activeSrc);
      if (howl) {
        const targetVol = m ? 0 : this.musicVolume * TRACK_VOL[this.currentTrackId];
        howl.fade(this.activeVol, targetVol, 300, this.activeSoundId);
        this.activeVol = targetVol;
      }
    }
  }
}
