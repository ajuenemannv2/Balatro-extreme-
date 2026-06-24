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

  // No-op: Howler auto-unlocks on first user gesture
  async start(): Promise<void> {}

  private _howl(src: string): Howl {
    if (!this.howls.has(src)) {
      this.howls.set(src, new Howl({
        src: [src],
        loop: true,
        volume: 0,
        html5: true,      // stream instead of full decode — required for large files
        preload: true,
        format: ['m4a'],
      }));
    }
    return this.howls.get(src)!;
  }

  // Returns milliseconds until the current loop reaches its natural end point.
  // Returns 0 if duration is not yet known or nothing is playing.
  private _msUntilLoopEnd(): number {
    if (!this.activeSrc || this.activeSoundId === null) return 0;
    const howl = this.howls.get(this.activeSrc);
    if (!howl) return 0;
    const dur = howl.duration();
    if (!dur || dur <= 0 || !isFinite(dur)) return 0;
    const pos = howl.seek(this.activeSoundId);
    if (typeof pos !== 'number' || !isFinite(pos) || pos < 0) return 0;
    const remaining = (dur - (pos % dur)) * 1000;
    // If we're within 300ms of the end, wait for the next full loop instead
    return remaining < 300 ? remaining + dur * 1000 : remaining;
  }

  // Actually start playing a new track right now.
  private _commitStart(id: TrackId): void {
    const newSrc = TRACK_SRC[id];
    const targetVol = this.muted ? 0 : this.musicVolume * TRACK_VOL[id];

    // Stop old sound (fade out quickly so the loop-end feels clean)
    if (this.activeSoundId !== null && this.activeSrc) {
      const oldHowl = this.howls.get(this.activeSrc)!;
      const oldId = this.activeSoundId;
      const oldVol = this.activeVol;
      if (this.activeSrc !== newSrc) {
        // Different file: short fade-out overlap
        oldHowl.fade(oldVol, 0, 250, oldId);
        setTimeout(() => { try { oldHowl.stop(oldId); } catch { /**/ } }, 350);
      } else {
        // Same file (menu ↔ shop): just stop silently, no need to restart
        try { oldHowl.stop(oldId); } catch { /**/ }
      }
    }

    this.activeSoundId = null;
    this.activeSrc = null;
    this.activeVol = 0;
    this.pendingTrackId = null;

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
    // Cancel any previously scheduled transition
    if (this.transitionTimer !== null) {
      clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    }

    const newSrc = TRACK_SRC[id];

    // Same audio file already playing (e.g. menu ↔ shop both use menu.m4a)
    if (this.activeSrc === newSrc && this.activeSoundId !== null) {
      this.currentTrackId = id;
      this.pendingTrackId = null;
      return;
    }

    // Nothing playing — start right away
    if (!this.activeSrc || this.activeSoundId === null) {
      this._commitStart(id);
      return;
    }

    // Something is playing — schedule the switch at the next loop boundary
    const msLeft = this._msUntilLoopEnd();

    if (msLeft <= 0) {
      // Duration not yet known (file still loading) — start immediately
      this._commitStart(id);
      return;
    }

    // Clamp so we never wait more than MAX_WAIT_MS
    const waitMs = Math.min(msLeft, MAX_WAIT_MS);
    this.pendingTrackId = id;

    this.transitionTimer = setTimeout(() => {
      this.transitionTimer = null;
      if (this.pendingTrackId) this._commitStart(this.pendingTrackId);
    }, waitMs - 80); // fire 80ms early to account for timer jitter
  }

  // Hard stop — fade out immediately, no loop-boundary wait
  stop(): void {
    if (this.transitionTimer !== null) {
      clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    }
    this.pendingTrackId = null;

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
