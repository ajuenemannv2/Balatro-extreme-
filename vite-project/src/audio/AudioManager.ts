import { MusicSystem, type TrackId } from './MusicSystem.ts';
import { SFXSystem } from './SFXSystem.ts';

type SFXId =
  | 'card_deal' | 'card_play' | 'discard' | 'chip_hit'
  | 'mult_trigger' | 'joker_activate' | 'buy' | 'sell'
  | 'win_round' | 'game_over';

class AudioManagerClass {
  private music = new MusicSystem();
  private sfx = new SFXSystem();
  private musicVolume = 0.6;
  private sfxVolume = 0.8;
  private musicMuted = false;
  private sfxMuted = false;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    try {
      await this.sfx.preload();
    } catch (e) {
      console.warn('SFX preload failed:', e);
    }
  }

  async startMusic(trackId: TrackId = 'menu'): Promise<void> {
    try {
      await this.music.start();
      await this.music.switchTrack(trackId);
      this.music.setVolume(this.musicMuted ? 0 : this.musicVolume);
    } catch (e) {
      console.warn('Music start failed:', e);
    }
  }

  async switchTrack(trackId: TrackId): Promise<void> {
    try {
      await this.music.switchTrack(trackId);
    } catch (e) {
      console.warn('Music switch failed:', e);
    }
  }

  stopMusic(): void {
    this.music.stop();
  }

  playSFX(id: SFXId, opts?: { rate?: number }): void {
    if (this.sfxMuted) return;
    this.sfx.play(id, opts);
  }

  setMusicVolume(v: number): void {
    this.musicVolume = Math.max(0, Math.min(1, v));
    if (!this.musicMuted) this.music.setVolume(this.musicVolume);
  }

  setSFXVolume(v: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, v));
    this.sfx.setVolume(this.sfxVolume);
  }

  setMusicMuted(m: boolean): void {
    this.musicMuted = m;
    this.music.setMuted(m);
  }

  setSFXMuted(m: boolean): void {
    this.sfxMuted = m;
    this.sfx.setMuted(m);
  }

  getMusicVolume(): number { return this.musicVolume; }
  getSFXVolume(): number { return this.sfxVolume; }
  isMusicMuted(): boolean { return this.musicMuted; }
  isSFXMuted(): boolean { return this.sfxMuted; }
}

export const AudioManager = new AudioManagerClass();
