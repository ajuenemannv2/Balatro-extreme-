import { Howl } from 'howler';

export type TrackId = 'menu' | 'game' | 'shop' | 'boss';

// 'shop' and 'menu' share the same audio file
const TRACK_SRC: Record<TrackId, string> = {
  menu: '/music/menu.m4a',
  shop: '/music/menu.m4a',
  game: '/music/game.m4a',
  boss: '/music/boss.m4a',
};

// Per-track volume compensate for different recording levels
const TRACK_VOL: Record<TrackId, number> = {
  menu: 0.80,
  shop: 0.75,
  game: 0.88,
  boss: 0.95,
};

// Maximum milliseconds to wait for a loop boundary before forcing the switch
const MAX_WAIT_MS = 10_000;

export class MusicSystem {
  private howls = new Map<string, Howl>();
  private currentTrackId: TrackId | null = null;
  private activeSrc: string | null = null;
  private activeSoundId: number | null = null;
  private activeVol = 0;
  private musicVolume = 0.65;
  private muted = false;
  private transitionTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingTrackId: TrackId | null = null;
  private pendingEndFn: (() => void) | null = null;

  // No-op: Howler auto-unlocks on first user gesture
  async start(): Promise<void> {}

  private _howl(src: string): Howl {
    if (!this.howls.has(src)) {
      this.howls.set(src, new Howl({
        src: [src],
        loop: true,
        volume: 0,
        preload: true,
        format: ['m4a'],
      }));
    }
    return this.howls.get(src)!;
  }

  // Remove any scheduled loop-boundary transition (timer + 'end' listener)
  private _clearPendingTransition(): void {
    if (this.transitionTimer !== null) {
      clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    }
    if (this.pendingEndFn && this.activeSrc) {
      const howl = this.howls.get(this.activeSrc);
      howl?.off('end', this.pendingEndFn as never);
    }
    this.pendingEndFn = null;
    this.pendingTrackId = null;
  }

  // Actually start playing a new track right now.
  private _commitStart(id: TrackId): void {
    const newSrc = TRACK_SRC[id];
    const targetVol = this.muted ? 0 : this.musicVolume * TRACK_VOL[id];

    this._clearPendingTransition();

    // Stop old sound (fade out quickly so the loop-end feels clean)
    if (this.activeSoundId !== null && this.activeSrc) {
      const oldHowl = this.howls.get(this.activeSrc)!;
      const oldSrc = this.activeSrc;
      const oldId = this.activeSoundId;
      const oldVol = this.activeVol;
      if (oldSrc !== newSrc) {
        // Different file: short fade-out overlap, then free the decoded
        // buffer — WebAudio keeps the whole track as raw PCM otherwise
        oldHowl.fade(oldVol, 0, 250, oldId);
        setTimeout(() => {
          try { oldHowl.stop(oldId); oldHowl.unload(); } catch { /**/ }
          this.howls.delete(oldSrc);
        }, 350);
      } else {
        // Same file (menu ↔ shop): just stop silently, no need to restart
        try { oldHowl.stop(oldId); } catch { /**/ }
      }
    }

    this.activeSoundId = null;
    this.activeSrc = null;
    this.activeVol = 0;

    // Start new track with fade-in
    const howl = this._howl(newSrc);
    const soundId = howl.play();
    howl.volume(0, soundId);
    howl.fade(0, targetVol, 600, soundId);

    this.activeSrc = newSrc;
    this.activeSoundId = soundId;
    this.activeVol = targetVol;
    this.currentTrackId = id;
  }

  async switchTrack(id: TrackId): Promise<void> {
    this._clearPendingTransition();

    const newSrc = TRACK_SRC[id];

    // Same audio file already playing (e.g. menu ↔ shop both use menu.m4a)
    if (this.activeSrc === newSrc && this.activeSoundId !== null) {
      this.currentTrackId = id;
      return;
    }

    // Nothing playing — start right away
    if (!this.activeSrc || this.activeSoundId === null) {
      this._commitStart(id);
      return;
    }

    // Something is playing — switch when the current loop iteration ends.
    // Howler fires 'end' on every loop of a looping sound, which tracks the
    // audio clock exactly (a setTimeout drifts and is throttled when the
    // tab is backgrounded). MAX_WAIT_MS timer is a fallback force-switch.
    this.pendingTrackId = id;
    const howl = this.howls.get(this.activeSrc)!;
    const commit = () => {
      if (this.pendingTrackId) this._commitStart(this.pendingTrackId);
    };
    this.pendingEndFn = commit;
    howl.once('end', commit, this.activeSoundId);
    this.transitionTimer = setTimeout(commit, MAX_WAIT_MS);
  }

  // Hard stop — fade out immediately, no loop-boundary wait
  stop(): void {
    this._clearPendingTransition();

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
