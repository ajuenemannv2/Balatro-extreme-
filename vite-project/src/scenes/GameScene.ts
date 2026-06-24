import Phaser from 'phaser';
import type { RunState } from '../types/Run.ts';
import type { PlayingCard } from '../types/Card.ts';
import type { ScoringStep } from '../types/Score.ts';
import type { ConsumableInstance } from '../types/Consumable.ts';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, CARD_W, CARD_H, ANIM, FONT, DEPTH, JOKER_ROW_Y, HAND_POSITIONS_Y, PLAY_AREA_Y } from '../config.ts';
import { scoreHand } from '../engine/ScoringEngine.ts';
import { evaluateHand } from '../engine/HandEvaluator.ts';
import { drawCards } from '../engine/DeckBuilder.ts';
import { deactivateBlind, onHandPlayedForBlind, getBlindName } from '../engine/BlindManager.ts';
import { calcRoundEndMoney } from '../engine/EconomyEngine.ts';
import { applyDeferredEffects, advanceToNextBlind, getRNG } from '../engine/RunManager.ts';
import { saveRun } from '../engine/SaveSystem.ts';
import { EventBus } from '../utils/EventBus.ts';
import { SFX } from '../utils/SoundEngine.ts';
import { AudioManager } from '../audio/AudioManager.ts';
import { CardView } from '../ui/CardView.ts';
import { JokerView } from '../ui/JokerView.ts';
import { ScorePopup } from '../ui/ScorePopup.ts';
import { Button } from '../ui/Button.ts';
import { TextureCache } from '../rendering/TextureCache.ts';
import { numStr } from '../utils/MathUtils.ts';
import { drawTarotFace, drawPlanetFace, drawSpectralFace } from '../rendering/ConsumableRenderer.ts';

function _glowColorForSource(source: string): number {
  if (source.includes(':mult') || source.includes(':mult_')) return COLORS.multRed;
  if (source.includes(':glass') || source.includes(':poly') || source.includes(':xmult')) return 0x9b59b6;
  if (source.includes(':lucky')) return COLORS.gold;
  if (source.includes(':holo')) return COLORS.multRed;
  return COLORS.chipBlue;
}

export class GameScene extends Phaser.Scene {
  private runState!: RunState;
  private textureCache!: TextureCache;

  // Card views
  private handViews: CardView[] = [];
  private playAreaViews: CardView[] = [];
  private jokerViews: JokerView[] = [];
  private consumableViews: Phaser.GameObjects.Container[] = [];

  // HUD text objects
  private chipsText!: Phaser.GameObjects.Text;
  private multText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private targetText!: Phaser.GameObjects.Text;
  private handsText!: Phaser.GameObjects.Text;
  private discardsText!: Phaser.GameObjects.Text;
  private moneyText!: Phaser.GameObjects.Text;
  private anteText!: Phaser.GameObjects.Text;
  private blindNameText!: Phaser.GameObjects.Text;
  private handTypeText!: Phaser.GameObjects.Text;
  private deckCountText!: Phaser.GameObjects.Text;
  private discardCountText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressFill!: Phaser.GameObjects.Graphics;

  // Buttons
  private playBtn!: Button;
  private discardBtn!: Button;

  // State
  private isAnimating = false;
  private currentChips = 0;
  private currentMult = 0;
  private handsPlayedThisRound = 0;
  private discardsUsedThisRound = 0;
  private _gameWonHandler: ((rs: RunState) => void) | null = null;
  private _miniGameUsesThisRound: Map<string, number> = new Map();

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data?: { runState?: RunState }): void {
    if (data?.runState) {
      this.runState = data.runState;
    }
  }

  create(): void {
    if (!this.runState) {
      EventBus.once<RunState>('run_state_ready', (rs) => {
        this.runState = rs;
        this._initScene();
      });
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Loading...', {
        fontFamily: FONT, fontSize: '24px', color: '#ffffff',
      }).setOrigin(0.5);
      return;
    }
    this._initScene();
  }

  private _initScene(): void {
    // Reset state that persists across scene restarts on the same instance
    this.isAnimating = false;
    this.playAreaViews = [];
    this.handViews = [];
    this.jokerViews = [];
    this.consumableViews = [];

    this.textureCache = new TextureCache(this, 512);
    this.currentChips = 0;
    this.currentMult = 0;
    this.handsPlayedThisRound = 0;
    this.discardsUsedThisRound = 0;
    this._miniGameUsesThisRound = new Map();

    this.cameras.main.setBackgroundColor(COLORS.bgHex);

    // Switch to appropriate music track (boss blind gets more intense track)
    const isBoss = this.runState.blindIndex === 2;
    AudioManager.switchTrack(isBoss ? 'boss' : 'game').catch(() => {});

    this._drawBackground();
    this._buildHUD();
    this._buildJokerRow();
    this._buildConsumableRow();
    this._buildPlayArea();
    this._buildBottomControls();

    this._dealCards();
    this._updateUI();

    this._gameWonHandler = (_rs: RunState) => {
      this.scene.start('WinScene', { runState: this.runState });
    };
    EventBus.on<RunState>('game_won', this._gameWonHandler);

    // Fire blind-start mini-games after a short delay so the scene is visible
    this.time.delayedCall(600, () => {
      void this._runMiniGames('on_blind_start', 0);
    });
  }

  // ---------------------------------------------------------------------------
  // Background / Layout
  // ---------------------------------------------------------------------------

  private _drawBackground(): void {
    // ── Near-black outer frame ───────────────────────────────────────────────
    const outer = this.add.graphics();
    outer.fillStyle(0x0c0c14, 1);
    outer.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    outer.setDepth(DEPTH.bg);

    // ── Green felt table band (main play area) ────────────────────────────────
    const felt = this.add.graphics();
    felt.fillStyle(0x35654d, 1);
    felt.fillRect(0, 88, GAME_WIDTH, 562);   // y=88 to y=650
    felt.setDepth(DEPTH.bg + 1);

    // Subtle felt highlight in center
    for (let s = 4; s >= 1; s--) {
      felt.fillStyle(0x3d7a5a, 0.07 * (5 - s));
      felt.fillEllipse(GAME_WIDTH / 2, 380, GAME_WIDTH * 0.85 * (s / 4), 400 * (s / 4));
    }

    // Subtle breathing pulse on felt (depth rhythm, gives table a "living" feel)
    const feltPulse = this.add.graphics().setDepth(DEPTH.bg + 1).setAlpha(0);
    feltPulse.fillStyle(0x4a8060, 0.18);
    feltPulse.fillEllipse(GAME_WIDTH / 2, 380, GAME_WIDTH * 0.7, 320);
    this.tweens.add({
      targets: feltPulse, alpha: 1, duration: 3200, yoyo: true,
      repeat: -1, ease: 'Sine.InOut',
    });

    // ── HUD bar at top ────────────────────────────────────────────────────────
    const hudBar = this.add.graphics();
    hudBar.fillStyle(0x0a0a18, 0.97);
    hudBar.fillRect(0, 0, GAME_WIDTH, 88);
    hudBar.lineStyle(2, 0x2a2a44, 1);
    hudBar.lineBetween(0, 88, GAME_WIDTH, 88);
    hudBar.setDepth(DEPTH.hud - 5);

    // ── Joker/consumable row background ──────────────────────────────────────
    const sidePanel = this.add.graphics();
    sidePanel.fillStyle(0x1a1428, 0.55);
    sidePanel.fillRoundedRect(0, 93, GAME_WIDTH, 64, 0);
    sidePanel.setDepth(DEPTH.bg + 2);

    // ── Play area zone ────────────────────────────────────────────────────────
    const playZone = this.add.graphics();
    playZone.fillStyle(0x2a5440, 0.4);
    playZone.fillRoundedRect(150, PLAY_AREA_Y - 62, GAME_WIDTH - 300, 124, 10);
    playZone.lineStyle(1, 0x4a8060, 0.5);
    playZone.strokeRoundedRect(150, PLAY_AREA_Y - 62, GAME_WIDTH - 300, 124, 10);
    playZone.setDepth(DEPTH.bg + 2);

    // ── Hand area zone ────────────────────────────────────────────────────────
    const handZone = this.add.graphics();
    handZone.lineStyle(1, 0x3a6050, 0.35);
    handZone.strokeRoundedRect(80, HAND_POSITIONS_Y - 55, GAME_WIDTH - 160, 115, 10);
    handZone.setDepth(DEPTH.bg + 2);

    // ── Play area label ───────────────────────────────────────────────────────
    this.add.text(GAME_WIDTH / 2, PLAY_AREA_Y - 68, 'Play Area', {
      fontFamily: FONT, fontSize: '12px', color: '#4a7060',
    }).setOrigin(0.5).setDepth(DEPTH.bg + 3);

    // ── Bottom action bar background ──────────────────────────────────────────
    const bottomBar = this.add.graphics();
    bottomBar.fillStyle(0x0c0c14, 0.9);
    bottomBar.fillRect(0, 650, GAME_WIDTH, 70);
    bottomBar.lineStyle(1, 0x2a2a44, 0.8);
    bottomBar.lineBetween(0, 650, GAME_WIDTH, 650);
    bottomBar.setDepth(DEPTH.bg + 2);
  }

  // ---------------------------------------------------------------------------
  // HUD
  // ---------------------------------------------------------------------------

  private _buildHUD(): void {
    const rs = this.runState;
    const d = DEPTH.hud;

    // ── Left: blind name + ante ───────────────────────────────────────────────
    this.blindNameText = this.add.text(14, 10, '', {
      fontFamily: FONT, fontSize: '14px', color: '#aaaacc',
    }).setOrigin(0, 0).setDepth(d);

    this.anteText = this.add.text(14, 28, `Ante ${rs.ante} / 8`, {
      fontFamily: FONT, fontSize: '13px', color: '#666688',
    }).setOrigin(0, 0).setDepth(d);

    // ── Center: Chips counter ─────────────────────────────────────────────────
    // Chips box (blue)
    const chipBox = this.add.graphics();
    chipBox.fillStyle(0x1a3a5e, 0.95);
    chipBox.fillRoundedRect(340, 6, 130, 54, 7);
    chipBox.lineStyle(2, COLORS.chipBlue, 0.7);
    chipBox.strokeRoundedRect(340, 6, 130, 54, 7);
    chipBox.setDepth(d - 1);

    this.add.text(405, 14, 'CHIPS', {
      fontFamily: FONT, fontSize: '10px', color: '#4a90d9',
    }).setOrigin(0.5, 0).setDepth(d);

    this.chipsText = this.add.text(405, 28, '0', {
      fontFamily: FONT, fontSize: '30px', color: '#7ab8f5',
      stroke: '#001020', strokeThickness: 2,
    }).setOrigin(0.5, 0).setDepth(d);

    // × symbol
    this.add.text(490, 33, '×', {
      fontFamily: FONT, fontSize: '28px', color: '#aaaaaa',
    }).setOrigin(0.5).setDepth(d);

    // Mult box (red)
    const multBox = this.add.graphics();
    multBox.fillStyle(0x3e1010, 0.95);
    multBox.fillRoundedRect(510, 6, 130, 54, 7);
    multBox.lineStyle(2, COLORS.multRed, 0.7);
    multBox.strokeRoundedRect(510, 6, 130, 54, 7);
    multBox.setDepth(d - 1);

    this.add.text(575, 14, 'MULT', {
      fontFamily: FONT, fontSize: '10px', color: '#e74c3c',
    }).setOrigin(0.5, 0).setDepth(d);

    this.multText = this.add.text(575, 28, '0', {
      fontFamily: FONT, fontSize: '30px', color: '#f08080',
      stroke: '#200000', strokeThickness: 2,
    }).setOrigin(0.5, 0).setDepth(d);

    // = symbol
    this.add.text(660, 33, '=', {
      fontFamily: FONT, fontSize: '22px', color: '#888888',
    }).setOrigin(0.5).setDepth(d);

    // ── Score / Target ────────────────────────────────────────────────────────
    this.add.text(740, 12, 'SCORE', {
      fontFamily: FONT, fontSize: '10px', color: '#aaaaaa',
    }).setOrigin(0.5, 0).setDepth(d);

    this.scoreText = this.add.text(740, 26, '0', {
      fontFamily: FONT, fontSize: '26px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 0).setDepth(d);

    this.add.text(830, 33, '/', {
      fontFamily: FONT, fontSize: '18px', color: '#666666',
    }).setOrigin(0.5).setDepth(d);

    this.add.text(920, 12, 'TARGET', {
      fontFamily: FONT, fontSize: '10px', color: '#888888',
    }).setOrigin(0.5, 0).setDepth(d);

    this.targetText = this.add.text(920, 26, numStr(rs.chipTarget), {
      fontFamily: FONT, fontSize: '22px', color: '#888888',
    }).setOrigin(0.5, 0).setDepth(d);

    // ── Progress bar ──────────────────────────────────────────────────────────
    this.progressBar = this.add.graphics();
    this.progressBar.setDepth(d);
    this.progressFill = this.add.graphics();
    this.progressFill.setDepth(d + 1);
    this._drawProgressBar();

    // ── Right: Stats row (Hands / Discards / Money) ───────────────────────────
    // Hands pill
    const statsBg = this.add.graphics();
    statsBg.setDepth(d - 1);
    statsBg.fillStyle(0x0a0a1e, 0.85);
    statsBg.fillRoundedRect(1020, 8, 250, 72, 7);
    statsBg.lineStyle(1, 0x2a2a44, 0.7);
    statsBg.strokeRoundedRect(1020, 8, 250, 72, 7);

    this.add.text(1048, 14, 'Hands', { fontFamily: FONT, fontSize: '10px', color: '#888888' }).setDepth(d);
    this.handsText = this.add.text(1048, 28, String(rs.handsRemaining), {
      fontFamily: FONT, fontSize: '22px', color: '#ffffff',
    }).setDepth(d);

    this.add.text(1120, 14, 'Discards', { fontFamily: FONT, fontSize: '10px', color: '#888888' }).setDepth(d);
    this.discardsText = this.add.text(1120, 28, String(rs.discardsRemaining), {
      fontFamily: FONT, fontSize: '22px', color: '#ff8844',
    }).setDepth(d);

    this.add.text(1202, 14, 'Money', { fontFamily: FONT, fontSize: '10px', color: '#888888' }).setDepth(d);
    this.moneyText = this.add.text(1202, 28, `$${rs.money}`, {
      fontFamily: FONT, fontSize: '20px', color: COLORS.goldHex,
    }).setDepth(d);

    // ── Hand type label ───────────────────────────────────────────────────────
    this.handTypeText = this.add.text(GAME_WIDTH / 2, PLAY_AREA_Y + 75, '', {
      fontFamily: FONT, fontSize: '17px', color: COLORS.goldHex,
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(DEPTH.ui);
  }

  private _drawProgressBar(): void {
    const rs = this.runState;
    const barX = 1028;
    const barY = 62;
    const barW = 240;
    const barH = 12;

    this.progressBar.clear();
    this.progressBar.fillStyle(0x111122, 1);
    this.progressBar.fillRoundedRect(barX, barY, barW, barH, 4);
    this.progressBar.lineStyle(1, 0x333355, 1);
    this.progressBar.strokeRoundedRect(barX, barY, barW, barH, 4);

    this.progressFill.clear();
    const progress = Math.min(1, rs.chipsScored / rs.chipTarget);
    if (progress > 0) {
      // Blue → red as we approach target
      const r = Math.floor(0x4a + (0xe7 - 0x4a) * progress);
      const g = Math.floor(0x90 + (0x4c - 0x90) * progress);
      const b = Math.floor(0xd9 + (0x3c - 0xd9) * progress);
      const barColor = (r << 16) | (g << 8) | b;
      this.progressFill.fillStyle(progress >= 1 ? (COLORS.green as number) : barColor, 1);
      this.progressFill.fillRoundedRect(barX, barY, barW * progress, barH, 4);
    }
  }

  // ---------------------------------------------------------------------------
  // Joker Row
  // ---------------------------------------------------------------------------

  private _buildJokerRow(): void {
    const rs = this.runState;

    this.jokerViews.forEach(jv => jv.destroy());
    this.jokerViews = [];

    const slotsG = this.add.graphics();
    for (let i = 0; i < rs.maxJokerSlots; i++) {
      const sx = 60 + i * 82;
      slotsG.fillStyle(COLORS.panelDark, 0.7);
      slotsG.fillRoundedRect(sx - CARD_W / 2 - 2, JOKER_ROW_Y - CARD_H / 2 - 2, CARD_W + 4, CARD_H + 4, 7);
      slotsG.lineStyle(1, 0x3a2a50, 0.6);
      slotsG.strokeRoundedRect(sx - CARD_W / 2 - 2, JOKER_ROW_Y - CARD_H / 2 - 2, CARD_W + 4, CARD_H + 4, 7);
    }
    slotsG.setDepth(DEPTH.table);

    rs.jokers.forEach((joker, i) => {
      const jx = 60 + i * 82;
      const jv = new JokerView(this, jx, JOKER_ROW_Y, joker, this.textureCache);
      this.jokerViews.push(jv);
    });

    this.add.text(60 + rs.maxJokerSlots * 82 + 10, JOKER_ROW_Y, `${rs.jokers.length}/${rs.maxJokerSlots}`, {
      fontFamily: FONT, fontSize: '12px', color: '#666688',
    }).setOrigin(0, 0.5).setDepth(DEPTH.ui);
  }

  // ---------------------------------------------------------------------------
  // Consumable Row
  // ---------------------------------------------------------------------------

  private _buildConsumableRow(): void {
    const rs = this.runState;

    this.consumableViews.forEach(cv => cv.destroy());
    this.consumableViews = [];

    const startX = GAME_WIDTH - 90 - (rs.maxConsumableSlots - 1) * 80;
    const cY = JOKER_ROW_Y;

    const slotsG = this.add.graphics();
    for (let i = 0; i < rs.maxConsumableSlots; i++) {
      const cx = startX + i * 80;
      slotsG.fillStyle(COLORS.panelDark, 0.7);
      slotsG.fillRoundedRect(cx - CARD_W / 2 - 2, cY - CARD_H / 2 - 2, CARD_W + 4, CARD_H + 4, 7);
      slotsG.lineStyle(1, 0x3a2a50, 0.6);
      slotsG.strokeRoundedRect(cx - CARD_W / 2 - 2, cY - CARD_H / 2 - 2, CARD_W + 4, CARD_H + 4, 7);
    }
    slotsG.setDepth(DEPTH.table);

    rs.consumables.forEach((cons: ConsumableInstance, i: number) => {
      const cx = startX + i * 80;
      const container = this._buildConsumableView(cons, cx, cY);
      this.consumableViews.push(container);
    });
  }

  private _buildConsumableView(cons: ConsumableInstance, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    container.setDepth(DEPTH.cards);

    const texKey = `consumable_${cons.defId}`;
    if (!this.textures.exists(texKey)) {
      this.textureCache.getOrCreate(texKey, CARD_W, CARD_H, (canvas) => {
        if (cons.type === 'tarot') {
          drawTarotFace(canvas, cons.defId, cons.defId.replace(/_/g, ' '));
        } else if (cons.type === 'planet') {
          drawPlanetFace(canvas, cons.defId, cons.defId.replace(/_/g, ' '));
        } else {
          drawSpectralFace(canvas, cons.defId, cons.defId.replace(/_/g, ' '));
        }
      });
    }

    const img = this.add.image(0, 0, texKey);
    container.add(img);

    container.setSize(CARD_W, CARD_H);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerup', (_ptr: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
      void _ptr; void _lx; void _ly;
      if (!event.stopPropagation) return;
      this._useConsumable(cons);
    });

    return container;
  }

  private _useConsumable(cons: ConsumableInstance): void {
    const rs = this.runState;
    const selected = this.handViews.filter(cv => cv.isSelected).map(cv => cv.cardData);

    if (cons.type === 'planet') {
      import('../data/PlanetDefs.ts').then(({ PLANET_DEFS }) => {
        const def = PLANET_DEFS.find(p => p.id === cons.defId);
        if (!def) return;
        rs.handLevels[def.upgradesHand] = (rs.handLevels[def.upgradesHand] ?? 1) + 1;
        rs.pendingPlanetCards.push(def.upgradesHand);
        const idx = rs.consumables.findIndex(c => c.instanceId === cons.instanceId);
        if (idx !== -1) rs.consumables.splice(idx, 1);
        this._rebuildConsumableRow();
        ScorePopup.spawn(this, GAME_WIDTH / 2, PLAY_AREA_Y, `${def.upgradesHand} +1`, COLORS.goldHex);
      });
      return;
    }

    if (cons.type === 'tarot') {
      import('../data/TarotDefs.ts').then(({ TAROT_DEFS }) => {
        const def = TAROT_DEFS.find(t => t.id === cons.defId);
        if (!def) return;
        if (selected.length < def.targetCount && def.targetCount > 0) {
          ScorePopup.spawn(this, GAME_WIDTH / 2, PLAY_AREA_Y, `Select ${def.targetCount} card(s)`, '#ff8888');
          return;
        }
        def.effect({ runState: rs, selectedCards: selected });
        const idx = rs.consumables.findIndex(c => c.instanceId === cons.instanceId);
        if (idx !== -1) rs.consumables.splice(idx, 1);
        this._rebuildConsumableRow();
        this._refreshHandViews();
        ScorePopup.spawn(this, GAME_WIDTH / 2, PLAY_AREA_Y, def.name, '#c9a227');
      });
      return;
    }

    if (cons.type === 'spectral') {
      import('../data/SpectralDefs.ts').then(({ SPECTRAL_DEFS }) => {
        const def = SPECTRAL_DEFS.find(s => s.id === cons.defId);
        if (!def) return;
        if (selected.length < def.targetCount && def.targetCount > 0) {
          ScorePopup.spawn(this, GAME_WIDTH / 2, PLAY_AREA_Y, `Select ${def.targetCount} card(s)`, '#ff8888');
          return;
        }
        def.effect({ runState: rs, selectedCards: selected });
        const idx = rs.consumables.findIndex(c => c.instanceId === cons.instanceId);
        if (idx !== -1) rs.consumables.splice(idx, 1);
        this._rebuildConsumableRow();
        this._refreshHandViews();
        ScorePopup.spawn(this, GAME_WIDTH / 2, PLAY_AREA_Y, def.name, '#88ccdd');
      });
    }
  }

  private _rebuildConsumableRow(): void {
    this.consumableViews.forEach(cv => cv.destroy());
    this.consumableViews = [];
    this._buildConsumableRow();
  }

  // ---------------------------------------------------------------------------
  // Play Area
  // ---------------------------------------------------------------------------

  private _buildPlayArea(): void {
    this.add.text(GAME_WIDTH / 2, PLAY_AREA_Y, 'Select cards to play', {
      fontFamily: FONT, fontSize: '14px', color: '#2a5040',
    }).setOrigin(0.5).setDepth(DEPTH.bg + 3);
  }

  // ---------------------------------------------------------------------------
  // Bottom Controls
  // ---------------------------------------------------------------------------

  private _buildBottomControls(): void {
    const rs = this.runState;

    // ── Play Hand button (large, green) ───────────────────────────────────────
    this.playBtn = new Button(this, 380, 667, 220, 54, '▶  Play Hand', () => {
      void this.playHand();
    }, { color: COLORS.green, fontSize: 19 });
    this.playBtn.setDepth(DEPTH.ui);

    // ── Discard button (brownish-orange) ──────────────────────────────────────
    this.discardBtn = new Button(this, 620, 667, 200, 54, '✕  Discard', () => {
      void this.discard();
    }, { color: 0x7a3a08, fontSize: 19 });
    this.discardBtn.setDepth(DEPTH.ui);

    // ── Deck / discard pile indicators (bottom-right) ─────────────────────────
    const deckBg = this.add.graphics();
    deckBg.setDepth(DEPTH.ui - 1);
    deckBg.fillStyle(0x0a0a18, 0.8);
    deckBg.fillRoundedRect(GAME_WIDTH - 130, 654, 118, 56, 8);
    deckBg.lineStyle(1, 0x2a2a44, 0.6);
    deckBg.strokeRoundedRect(GAME_WIDTH - 130, 654, 118, 56, 8);

    // Mini card stack icon (deck)
    const stackGfx = this.add.graphics();
    stackGfx.setDepth(DEPTH.ui);
    stackGfx.fillStyle(0x1a3a6b, 0.9);
    stackGfx.fillRoundedRect(GAME_WIDTH - 122, 660, 28, 38, 3);
    stackGfx.fillStyle(0x1a3a6b, 0.7);
    stackGfx.fillRoundedRect(GAME_WIDTH - 119, 657, 28, 38, 3);
    stackGfx.fillStyle(0x1e4aaa, 0.9);
    stackGfx.fillRoundedRect(GAME_WIDTH - 116, 654, 28, 38, 3);
    stackGfx.lineStyle(1, 0x4a7aee, 0.6);
    stackGfx.strokeRoundedRect(GAME_WIDTH - 116, 654, 28, 38, 3);

    this.deckCountText = this.add.text(GAME_WIDTH - 80, 662, `Deck\n${rs.deck.length}`, {
      fontFamily: FONT, fontSize: '12px', color: '#aaaacc', align: 'left',
    }).setOrigin(0, 0).setDepth(DEPTH.ui);

    this.discardCountText = this.add.text(GAME_WIDTH - 80, 690, `Disc: ${rs.discardPile.length}`, {
      fontFamily: FONT, fontSize: '12px', color: '#888888',
    }).setOrigin(0, 0).setDepth(DEPTH.ui);

    // ── Sort buttons ──────────────────────────────────────────────────────────
    const sortRank = this.add.text(840, 667, 'Sort Rank', {
      fontFamily: FONT, fontSize: '13px', color: '#aaaaaa',
      backgroundColor: '#1a1428',
      padding: { x: 10, y: 7 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(DEPTH.ui);

    sortRank.on('pointerdown', () => this._sortHandByRank());
    sortRank.on('pointerover', () => sortRank.setColor(COLORS.goldHex));
    sortRank.on('pointerout', () => sortRank.setColor('#aaaaaa'));

    const sortSuit = this.add.text(960, 667, 'Sort Suit', {
      fontFamily: FONT, fontSize: '13px', color: '#aaaaaa',
      backgroundColor: '#1a1428',
      padding: { x: 10, y: 7 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(DEPTH.ui);

    sortSuit.on('pointerdown', () => this._sortHandBySuit());
    sortSuit.on('pointerover', () => sortSuit.setColor(COLORS.goldHex));
    sortSuit.on('pointerout', () => sortSuit.setColor('#aaaaaa'));
  }

  // ---------------------------------------------------------------------------
  // Dealing cards
  // ---------------------------------------------------------------------------

  private _dealCards(): void {
    const rs = this.runState;
    const needed = rs.handSize - rs.hand.length;
    if (needed <= 0) {
      this._layoutHandViews();
      return;
    }

    if (rs.deck.length === 0 && rs.discardPile.length > 0) {
      rs.deck = [...rs.discardPile].sort(() => Math.random() - 0.5);
      rs.discardPile = [];
    }

    const { drawn, remaining } = drawCards(rs.deck, needed);
    rs.deck = remaining;

    for (const card of drawn) {
      if (rs.activeBlindId === 'boss_wheel' && Math.random() < 1 / 7) {
        card.faceUp = false;
      } else {
        card.faceUp = true;
      }
      rs.hand.push(card);
    }

    if (drawn.length === 0 && rs.deck.length === 0) {
      this._showMessage('Deck empty!');
    }

    this._layoutHandViews();
  }

  private _layoutHandViews(): void {
    const rs = this.runState;
    const cards = rs.hand;
    const count = cards.length;

    // Build a lookup of existing views by card ID so we can reuse them
    const existingById = new Map(this.handViews.map(cv => [cv.cardData.id, cv]));
    const handIdSet = new Set(cards.map(c => c.id));

    // Destroy views for cards no longer in hand (played/discarded)
    this.handViews.forEach(cv => {
      if (!handIdSet.has(cv.cardData.id)) cv.destroy();
    });

    if (count === 0) {
      this.handViews = [];
      return;
    }

    const totalW = (count - 1) * 85;
    const startX = GAME_WIDTH / 2 - totalW / 2;
    let newCardIndex = 0;

    this.handViews = cards.map((card, i) => {
      const targetX = startX + i * 85;
      const targetY = HAND_POSITIONS_Y;
      const existing = existingById.get(card.id);

      if (existing) {
        // Card already in hand — reposition smoothly without deal animation
        existing.setAnchorY(targetY);
        this.tweens.add({
          targets: existing,
          x: targetX,
          y: targetY,
          duration: 200,
          ease: 'Quad.Out',
        });
        return existing;
      } else {
        // New card drawn from deck — fly in with staggered deal animation
        const cv = new CardView(this, GAME_WIDTH - 60, 640, card, this.textureCache);
        cv.setFaceUp(card.faceUp);
        cv.setAlpha(0);
        const dealDelay = newCardIndex * ANIM.dealStagger;
        this.tweens.add({
          targets: cv,
          x: targetX,
          y: targetY,
          alpha: 1,
          duration: ANIM.dealDuration,
          delay: dealDelay,
          ease: 'Quad.Out',
        });
        this.time.delayedCall(dealDelay, () => AudioManager.playSFX('card_deal'));
        cv.on('pointerdown', () => this._onCardClick(cv));
        newCardIndex++;
        return cv;
      }
    });

    const newCount = newCardIndex;
    this.time.delayedCall(ANIM.dealDuration + newCount * ANIM.dealStagger + 50, () => {
      this._updateHandTypePreview();
    });
  }

  private _onCardClick(cv: CardView): void {
    if (this.isAnimating) return;
    const selected = this.handViews.filter(v => v.isSelected);
    if (!cv.isSelected && selected.length >= 5) {
      ScorePopup.spawn(this, GAME_WIDTH / 2, PLAY_AREA_Y - 30, 'Max 5 cards!', '#ff8888');
      return;
    }
    cv.setSelected(!cv.isSelected);
    this._updateHandTypePreview();
  }

  private _updateHandTypePreview(): void {
    const selected = this.handViews.filter(cv => cv.isSelected).map(cv => cv.cardData);
    if (selected.length === 0) {
      this.handTypeText.setText('');
      return;
    }
    try {
      const { handType } = evaluateHand(selected, this.runState);
      this.handTypeText.setText(handType);
    } catch {
      this.handTypeText.setText('');
    }
  }

  // ---------------------------------------------------------------------------
  // Play Hand
  // ---------------------------------------------------------------------------

  async playHand(): Promise<void> {
    if (this.isAnimating) return;

    const selected = this.handViews.filter(cv => cv.isSelected);
    if (selected.length === 0) {
      ScorePopup.spawn(this, GAME_WIDTH / 2, PLAY_AREA_Y - 30, 'Select cards!', '#ff8888');
      return;
    }

    const rs = this.runState;
    if (rs.handsRemaining <= 0) {
      ScorePopup.spawn(this, GAME_WIDTH / 2, PLAY_AREA_Y, 'No hands left!', '#ff8888');
      return;
    }

    this.isAnimating = true;
    this.playBtn.setEnabled(false);
    this.discardBtn.setEnabled(false);
    SFX.handPlay();

    const selectedCards = selected.map(cv => cv.cardData);

    await this._animateCardsToPlayArea(selected);

    const rng = getRNG(rs);
    let result;
    try {
      result = scoreHand(selectedCards, rs, rng);
    } catch (err) {
      console.error('scoreHand error:', err);
      this.isAnimating = false;
      this.playBtn.setEnabled(true);
      this.discardBtn.setEnabled(true);
      return;
    }

    rs.rngState = rng.getState();

    this.handTypeText.setText(result.handType);
    ScorePopup.spawn(this, GAME_WIDTH / 2, PLAY_AREA_Y - 80, result.handType, COLORS.goldHex);

    this.currentChips = 0;
    this.currentMult = 0;
    this._updateCounterDisplays(0, 0);

    await this._animateScoringSteps(result.steps, selectedCards);

    const finalScore = result.finalScore;
    ScorePopup.spawn(this, GAME_WIDTH / 2, PLAY_AREA_Y - 30, `${numStr(finalScore)}`, '#ffffff');

    rs.chipsScored += finalScore;
    rs.handsRemaining -= 1;
    this.handsPlayedThisRound += 1;
    rs.handsThisRun += 1;
    rs.bossBlindHandsPlayed += 1;

    rs.handPlayCounts[result.handType] = (rs.handPlayCounts[result.handType] ?? 0) + 1;
    rs.mostPlayedHand = result.handType;

    onHandPlayedForBlind(rs, selectedCards);
    applyDeferredEffects(rs);

    if (result.destroyedCardIds.length > 0) {
      for (const cardId of result.destroyedCardIds) {
        const deckIdx = rs.deck.findIndex(c => c.id === cardId);
        if (deckIdx !== -1) rs.deck.splice(deckIdx, 1);
        const handIdx = rs.hand.findIndex(c => c.id === cardId);
        if (handIdx !== -1) rs.hand.splice(handIdx, 1);
        const playIdx = rs.playedThisRound.findIndex(c => c.id === cardId);
        if (playIdx !== -1) rs.playedThisRound.splice(playIdx, 1);
      }
    }

    if (result.createdConsumables && result.createdConsumables.length > 0) {
      for (const defId of result.createdConsumables) {
        if (rs.consumables.length < rs.maxConsumableSlots) {
          rs.consumables.push({ instanceId: `${defId}_${Date.now()}`, type: 'tarot', defId });
        }
      }
      this._rebuildConsumableRow();
    }

    if (rs.activeBlindId === 'boss_hook' && selectedCards.length > 0) {
      const hookCards = [...rs.hand].sort(() => Math.random() - 0.5).slice(0, 2);
      for (const hc of hookCards) {
        const idx = rs.hand.findIndex(c => c.id === hc.id);
        if (idx !== -1) {
          rs.hand.splice(idx, 1);
          rs.discardPile.push(hc);
        }
      }
    }

    for (const card of selectedCards) {
      const idx = rs.hand.findIndex(c => c.id === card.id);
      if (idx !== -1) {
        rs.hand.splice(idx, 1);
        rs.playedThisRound.push(card);
        if (!result.destroyedCardIds.includes(card.id)) {
          rs.discardPile.push(card);
        }
      }
    }

    await this._clearPlayArea();

    // Trigger on_hand_played mini-games
    await this._runMiniGames('on_hand_played', finalScore);

    // Trigger last-stand mini-game when exactly 1 hand remains
    if (rs.handsRemaining === 1) {
      await this._runMiniGames('on_score_milestone', finalScore);
    }

    const won = rs.chipsScored >= rs.chipTarget;
    if (won) {
      await this._onBlindWon();
      return;
    }

    if (rs.handsRemaining <= 0) {
      await this._onGameOver();
      return;
    }

    this._dealCards();
    this._updateUI();
    saveRun(rs);

    this.isAnimating = false;
    this.playBtn.setEnabled(true);
    this.discardBtn.setEnabled(true);
  }

  private async _animateCardsToPlayArea(selectedViews: CardView[]): Promise<void> {
    const count = selectedViews.length;
    const totalW = (count - 1) * 90;
    const startX = GAME_WIDTH / 2 - totalW / 2;

    return new Promise<void>((resolve) => {
      let completed = 0;
      selectedViews.forEach((cv, i) => {
        const tx = startX + i * 90;
        this.tweens.add({
          targets: cv,
          x: tx,
          y: PLAY_AREA_Y,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: ANIM.playDuration,
          ease: 'Quad.Out',
          onComplete: () => {
            completed++;
            if (completed === selectedViews.length) resolve();
          },
        });
      });
      this.playAreaViews = selectedViews;
    });
  }

  // ─── Mini-game System ─────────────────────────────────────────────────────

  private async _runMiniGames(trigger: string, lastScore: number): Promise<void> {
    const rs = this.runState;
    for (const joker of rs.jokers) {
      if (!joker.miniGameId || joker.miniGameTrigger !== trigger) continue;
      if (joker.isDisabled) continue;

      const chance = joker.miniGameChance ?? 1.0;
      if (Math.random() > chance) continue;

      const maxPerRound = joker.miniGameMaxPerRound;
      if (maxPerRound !== undefined) {
        const used = this._miniGameUsesThisRound.get(joker.id) ?? 0;
        if (used >= maxPerRound) continue;
        this._miniGameUsesThisRound.set(joker.id, used + 1);
      }

      const won = await this._launchMiniGame(joker.miniGameId, joker.id, joker.name,
        joker.miniGameWinDesc ?? 'Bonus!', joker.miniGameLoseDesc ?? 'Penalty!');

      const effect = won
        ? joker.onMiniGameWin?.(rs, lastScore)
        : joker.onMiniGameLose?.(rs, lastScore);

      if (!effect) continue;

      if (effect.addChipsScored) {
        rs.chipsScored += effect.addChipsScored;
      }
      if (effect.scaleLastScore !== undefined) {
        const added = effect.scaleLastScore - lastScore;
        if (added > 0) rs.chipsScored += added;
      }
      if (effect.resetScore) {
        rs.chipsScored = 0;
      }
      if (effect.addHandsRemaining) {
        rs.handsRemaining = Math.max(0, rs.handsRemaining + effect.addHandsRemaining);
      }
      if (effect.addDiscardsRemaining) {
        rs.discardsRemaining = Math.max(0, rs.discardsRemaining + effect.addDiscardsRemaining);
      }

      const msg = won
        ? `${joker.name}: ${joker.miniGameWinDesc ?? 'WIN!'}`
        : `${joker.name}: ${joker.miniGameLoseDesc ?? 'LOSE!'}`;
      ScorePopup.spawn(this, GAME_WIDTH / 2, PLAY_AREA_Y - 60, msg,
        won ? '#44ff88' : '#ff6666', 'sm');
      this._updateUI();

      await this._delay(400);
    }
  }

  private _launchMiniGame(
    gameId: string,
    jokerId: string,
    jokerName: string,
    winDesc: string,
    loseDesc: string,
  ): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      EventBus.once<{ jokerId: string; won: boolean }>('mini_game_result', (data) => {
        resolve(data.won);
      });
      this.scene.launch('MiniGameScene', { gameId, jokerId, jokerName, winDesc, loseDesc });
      this.scene.bringToTop('MiniGameScene');
    });
  }

  private async _clearPlayArea(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.playAreaViews.length === 0) { resolve(); return; }
      let done = 0;
      for (const cv of this.playAreaViews) {
        this.tweens.add({
          targets: cv,
          y: cv.y + 80,
          alpha: 0,
          duration: ANIM.discardDuration,
          ease: 'Quad.In',
          onComplete: () => {
            cv.destroy();
            done++;
            if (done === this.playAreaViews.length) {
              this.playAreaViews = [];
              resolve();
            }
          },
        });
      }
    });
  }

  private async _animateScoringSteps(steps: ScoringStep[], _playedCards: PlayingCard[]): Promise<void> {
    let chips = 0;
    let mult = 0;

    for (const step of steps) {
      await this._delay(ANIM.scoreStepDelay);

      if (step.addChips !== undefined) chips = step.chipsAfter;
      if (step.addMult !== undefined || step.mulMult !== undefined) mult = step.multAfter;
      else {
        chips = step.chipsAfter;
        mult = step.multAfter;
      }

      // Track the scoring card's position so chip/mult popups appear above it
      let cardX = GAME_WIDTH / 2;
      let cardY = PLAY_AREA_Y;

      for (const hint of step.hints) {
        if (hint.type === 'card_glow') {
          const cv = this.playAreaViews.find(v => v.cardData.id === hint.cardId);
          if (cv) { cardX = cv.x; cardY = cv.y; }
          cv?.glow(_glowColorForSource(step.source));
        } else if (hint.type === 'joker_activate') {
          const jv = this.jokerViews.find(v => v.jokerData.instanceId === hint.jokerId);
          AudioManager.playSFX('joker_activate');
          jv?.flash();
        } else if (hint.type === 'chip_add' && hint.delta > 0) {
          SFX.chipScore();
          AudioManager.playSFX('chip_hit');
          const sz = hint.delta >= 50 ? 'lg' : hint.delta >= 20 ? 'md' : 'sm';
          ScorePopup.spawn(this, cardX, cardY - CARD_H / 2 - 28, `+${numStr(hint.delta)}`, '#4a90d9', sz);
        } else if (hint.type === 'mult_add' && hint.delta > 0) {
          SFX.multScore();
          AudioManager.playSFX('mult_trigger');
          const sz = hint.delta >= 10 ? 'lg' : hint.delta >= 4 ? 'md' : 'sm';
          ScorePopup.spawn(this, cardX, cardY - CARD_H / 2 - 28, `+${hint.delta}×`, '#e74c3c', sz);
        } else if (hint.type === 'mult_mul') {
          SFX.multScore();
          AudioManager.playSFX('mult_trigger');
          if (hint.factor >= 3) this.cameras.main.shake(80, 0.004);
          ScorePopup.spawn(this, cardX, cardY - CARD_H / 2 - 28, `×${hint.factor}`, '#ff8844', 'lg');
        } else if (hint.type === 'money_add') {
          ScorePopup.spawn(this, cardX, cardY + CARD_H / 2 + 20, `+$${hint.delta}`, COLORS.goldHex, 'md');
        }
      }

      await this._tweenCounters(chips, mult, step.chipsAfter * step.multAfter);
    }

    this.currentChips = chips;
    this.currentMult = mult;
  }

  private _tweenCounters(chips: number, mult: number, _score: number): Promise<void> {
    return new Promise<void>((resolve) => {
      const obj = { chips: this.currentChips, mult: this.currentMult };
      this.tweens.add({
        targets: obj,
        chips,
        mult,
        duration: ANIM.counterDuration,
        ease: 'Quad.Out',
        onUpdate: () => {
          this._updateCounterDisplays(obj.chips, obj.mult);
        },
        onComplete: () => {
          this.currentChips = chips;
          this.currentMult = mult;
          this._updateCounterDisplays(chips, mult);
          resolve();
        },
      });
    });
  }

  private _updateCounterDisplays(chips: number, mult: number): void {
    const chipsRound = Math.floor(chips);
    const multRound = Math.floor(mult);
    const score = chipsRound * multRound;

    this.chipsText.setText(numStr(chipsRound));
    this.multText.setText(numStr(multRound));
    this.scoreText.setText(numStr(score));
  }

  // ---------------------------------------------------------------------------
  // Discard
  // ---------------------------------------------------------------------------

  async discard(): Promise<void> {
    if (this.isAnimating) return;
    const rs = this.runState;

    if (rs.discardsRemaining <= 0) {
      ScorePopup.spawn(this, GAME_WIDTH / 2, PLAY_AREA_Y, 'No discards left!', '#ff8888');
      return;
    }

    const selected = this.handViews.filter(cv => cv.isSelected);
    if (selected.length === 0) {
      ScorePopup.spawn(this, GAME_WIDTH / 2, PLAY_AREA_Y - 30, 'Select cards to discard', '#ff8888');
      return;
    }
    if (selected.length > 5) {
      ScorePopup.spawn(this, GAME_WIDTH / 2, PLAY_AREA_Y - 30, 'Max 5 discards', '#ff8888');
      return;
    }

    this.isAnimating = true;
    this.playBtn.setEnabled(false);
    this.discardBtn.setEnabled(false);
    AudioManager.playSFX('discard');

    for (const j of rs.jokers) {
      j.onDiscard?.(rs, selected.map(cv => cv.cardData));
    }

    await new Promise<void>((resolve) => {
      let done = 0;
      for (const cv of selected) {
        this.tweens.add({
          targets: cv,
          y: cv.y + 100,
          alpha: 0,
          duration: ANIM.discardDuration,
          ease: 'Quad.In',
          onComplete: () => {
            done++;
            if (done === selected.length) resolve();
          },
        });
      }
    });

    for (const cv of selected) {
      const idx = rs.hand.findIndex(c => c.id === cv.cardData.id);
      if (idx !== -1) {
        rs.discardPile.push(rs.hand.splice(idx, 1)[0]);
      }
      const hvIdx = this.handViews.indexOf(cv);
      if (hvIdx !== -1) this.handViews.splice(hvIdx, 1);
      cv.destroy();
    }

    rs.discardsRemaining -= 1;
    this.discardsUsedThisRound += 1;
    applyDeferredEffects(rs);

    this._dealCards();
    this._updateUI();
    saveRun(rs);

    this.isAnimating = false;
    this.playBtn.setEnabled(true);
    this.discardBtn.setEnabled(rs.discardsRemaining > 0);
  }

  // ---------------------------------------------------------------------------
  // Sort hand
  // ---------------------------------------------------------------------------

  private _sortHandByRank(): void {
    const rs = this.runState;
    const RANK_ORDER: Record<string, number> = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
      '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
    };
    rs.hand.sort((a, b) => (RANK_ORDER[a.rank ?? ''] ?? 0) - (RANK_ORDER[b.rank ?? ''] ?? 0));
    this._layoutHandViews();
  }

  private _sortHandBySuit(): void {
    const rs = this.runState;
    const SUIT_ORDER: Record<string, number> = { Spades: 0, Hearts: 1, Clubs: 2, Diamonds: 3 };
    rs.hand.sort((a, b) => {
      const suitDiff = (SUIT_ORDER[a.suit ?? ''] ?? 0) - (SUIT_ORDER[b.suit ?? ''] ?? 0);
      if (suitDiff !== 0) return suitDiff;
      const RANK_ORDER: Record<string, number> = {
        '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
        '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
      };
      return (RANK_ORDER[a.rank ?? ''] ?? 0) - (RANK_ORDER[b.rank ?? ''] ?? 0);
    });
    this._layoutHandViews();
  }

  private _refreshHandViews(): void {
    this._layoutHandViews();
  }

  // ---------------------------------------------------------------------------
  // Win / Game Over
  // ---------------------------------------------------------------------------

  private async _onBlindWon(): Promise<void> {
    const rs = this.runState;

    deactivateBlind(rs);

    const earned = calcRoundEndMoney(rs, this.handsPlayedThisRound, this.discardsUsedThisRound);
    rs.money += earned;

    applyDeferredEffects(rs);

    for (const j of rs.jokers) {
      j.onRoundEnd?.(rs);
    }

    SFX.blindWon();
    AudioManager.playSFX('win_round');
    this.cameras.main.shake(350, 0.015);
    ScorePopup.spawn(this, GAME_WIDTH / 2, PLAY_AREA_Y, `Round Won! +$${earned}`, '#44cc66');
    await this._delay(1200);

    for (const card of rs.hand) rs.discardPile.push(card);
    rs.hand = [];
    rs.deck = [...rs.deck, ...rs.discardPile].sort(() => Math.random() - 0.5);
    rs.discardPile = [];
    rs.playedThisRound = [];

    const rng = getRNG(rs);
    advanceToNextBlind(rs, rng);
    rs.rngState = rng.getState();

    saveRun(rs);

    if (rs.ante > 8) {
      this.scene.start('WinScene', { runState: rs });
      return;
    }

    this.scene.start('ShopScene', { runState: rs });
  }

  private async _onGameOver(): Promise<void> {
    SFX.gameOver();
    ScorePopup.spawn(this, GAME_WIDTH / 2, PLAY_AREA_Y, 'Out of hands!', '#ff4444');
    await this._delay(1500);
    this.scene.start('GameOverScene', { runState: this.runState, reason: 'out_of_hands' });
  }

  // ---------------------------------------------------------------------------
  // UI Updates
  // ---------------------------------------------------------------------------

  _updateUI(): void {
    const rs = this.runState;

    const blindName = getBlindName(rs.ante, rs.blindIndex, rs.activeBlindId);
    this.blindNameText.setText(blindName);
    this.anteText.setText(`Ante ${rs.ante} / 8`);

    this.chipsText.setText('0');
    this.multText.setText('0');
    this.scoreText.setText(numStr(rs.chipsScored));
    this.targetText.setText(numStr(rs.chipTarget));
    this.handsText.setText(String(rs.handsRemaining));
    this.discardsText.setText(String(rs.discardsRemaining));
    this.moneyText.setText(`$${rs.money}`);
    this.deckCountText.setText(`Deck\n${rs.deck.length}`);
    this.discardCountText.setText(`Disc: ${rs.discardPile.length}`);

    this.discardBtn.setEnabled(rs.discardsRemaining > 0);

    this._drawProgressBar();
  }

  private _showMessage(msg: string): void {
    ScorePopup.spawn(this, GAME_WIDTH / 2, PLAY_AREA_Y, msg, '#ffffff');
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private _delay(ms: number): Promise<void> {
    return new Promise<void>((resolve) => {
      this.time.delayedCall(ms, resolve);
    });
  }

  shutdown(): void {
    if (this._gameWonHandler) {
      EventBus.off('game_won', this._gameWonHandler);
      this._gameWonHandler = null;
    }
    this.handViews.forEach(cv => cv.destroy());
    this.playAreaViews.forEach(cv => cv.destroy());
    this.jokerViews.forEach(jv => jv.destroy());
    this.consumableViews.forEach(cv => cv.destroy());
    this.textureCache?.clear();
  }
}
