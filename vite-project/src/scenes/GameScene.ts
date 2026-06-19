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
import { CardView } from '../ui/CardView.ts';
import { JokerView } from '../ui/JokerView.ts';
import { ScorePopup } from '../ui/ScorePopup.ts';
import { Button } from '../ui/Button.ts';
import { TextureCache } from '../rendering/TextureCache.ts';
import { numStr } from '../utils/MathUtils.ts';
import { drawTarotFace, drawPlanetFace, drawSpectralFace } from '../rendering/ConsumableRenderer.ts';

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
      // Try loading from EventBus (if coming from BootScene/MenuScene flow)
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
    this.textureCache = new TextureCache(this, 512);
    this.currentChips = 0;
    this.currentMult = 0;
    this.handsPlayedThisRound = 0;
    this.discardsUsedThisRound = 0;

    this.cameras.main.setBackgroundColor(COLORS.bgHex);

    this._drawBackground();
    this._buildHUD();
    this._buildJokerRow();
    this._buildConsumableRow();
    this._buildPlayArea();
    this._buildBottomControls();

    // Deal initial hand
    this._dealCards();

    this._updateUI();

    // Listen for game_won
    this._gameWonHandler = (_rs: RunState) => {
      this.scene.start('WinScene', { runState: this.runState });
    };
    EventBus.on<RunState>('game_won', this._gameWonHandler);
  }

  // ---------------------------------------------------------------------------
  // Background / Layout
  // ---------------------------------------------------------------------------

  private _drawBackground(): void {
    // Top HUD bar
    const hudBar = this.add.graphics();
    hudBar.fillStyle(COLORS.panelDark, 0.95);
    hudBar.fillRect(0, 0, GAME_WIDTH, 90);
    hudBar.setDepth(DEPTH.hud - 5);

    // Side panel (left: joker area, consumable area)
    const sidePanel = this.add.graphics();
    sidePanel.fillStyle(COLORS.panel, 0.4);
    sidePanel.fillRoundedRect(0, 95, GAME_WIDTH, 205, 0);
    sidePanel.setDepth(DEPTH.bg + 1);

    // Play area zone
    const playZone = this.add.graphics();
    playZone.lineStyle(1, 0x4a3060, 0.6);
    playZone.strokeRoundedRect(140, PLAY_AREA_Y - 65, GAME_WIDTH - 280, 130, 10);
    playZone.setDepth(DEPTH.bg + 1);

    // Hand area zone
    const handZone = this.add.graphics();
    handZone.lineStyle(1, 0x4a3060, 0.4);
    handZone.strokeRoundedRect(80, HAND_POSITIONS_Y - 55, GAME_WIDTH - 160, 115, 10);
    handZone.setDepth(DEPTH.bg + 1);

    // "Play Area" label
    this.add.text(GAME_WIDTH / 2, PLAY_AREA_Y - 70, 'Play Area', {
      fontFamily: FONT, fontSize: '12px', color: '#555577',
    }).setOrigin(0.5).setDepth(DEPTH.bg + 2);
  }

  // ---------------------------------------------------------------------------
  // HUD
  // ---------------------------------------------------------------------------

  private _buildHUD(): void {
    const rs = this.runState;

    // Blind name
    this.blindNameText = this.add.text(100, 18, '', {
      fontFamily: FONT, fontSize: '16px', color: '#cccccc',
    }).setOrigin(0.5, 0).setDepth(DEPTH.hud);

    // Score display row 1: Chips × Mult = Score / Target
    this.add.text(390, 8, 'Chips', {
      fontFamily: FONT, fontSize: '11px', color: '#4a90d9',
    }).setOrigin(0.5, 0).setDepth(DEPTH.hud);

    this.chipsText = this.add.text(390, 22, '0', {
      fontFamily: FONT, fontSize: '32px', color: '#4a90d9',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 0).setDepth(DEPTH.hud);

    this.add.text(510, 35, '×', {
      fontFamily: FONT, fontSize: '26px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(DEPTH.hud);

    this.add.text(620, 8, 'Mult', {
      fontFamily: FONT, fontSize: '11px', color: '#e74c3c',
    }).setOrigin(0.5, 0).setDepth(DEPTH.hud);

    this.multText = this.add.text(620, 22, '0', {
      fontFamily: FONT, fontSize: '32px', color: '#e74c3c',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 0).setDepth(DEPTH.hud);

    this.add.text(730, 35, '=', {
      fontFamily: FONT, fontSize: '22px', color: '#888888',
    }).setOrigin(0.5).setDepth(DEPTH.hud);

    this.add.text(830, 8, 'Score', {
      fontFamily: FONT, fontSize: '11px', color: '#ffffff',
    }).setOrigin(0.5, 0).setDepth(DEPTH.hud);

    this.scoreText = this.add.text(830, 22, '0', {
      fontFamily: FONT, fontSize: '26px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 0).setDepth(DEPTH.hud);

    this.add.text(930, 35, '/', {
      fontFamily: FONT, fontSize: '20px', color: '#888888',
    }).setOrigin(0.5).setDepth(DEPTH.hud);

    this.add.text(1040, 8, 'Target', {
      fontFamily: FONT, fontSize: '11px', color: '#aaaaaa',
    }).setOrigin(0.5, 0).setDepth(DEPTH.hud);

    this.targetText = this.add.text(1040, 22, numStr(rs.chipTarget), {
      fontFamily: FONT, fontSize: '22px', color: '#aaaaaa',
    }).setOrigin(0.5, 0).setDepth(DEPTH.hud);

    // Progress bar
    this.progressBar = this.add.graphics();
    this.progressBar.setDepth(DEPTH.hud);
    this.progressFill = this.add.graphics();
    this.progressFill.setDepth(DEPTH.hud + 1);
    this._drawProgressBar();

    // Second row: Hands / Discards / Money / Ante
    const row2Y = 62;

    this.add.text(390, row2Y, 'Hands', {
      fontFamily: FONT, fontSize: '11px', color: '#aaaaaa',
    }).setOrigin(0.5, 0).setDepth(DEPTH.hud);

    this.handsText = this.add.text(390, row2Y + 14, String(rs.handsRemaining), {
      fontFamily: FONT, fontSize: '18px', color: '#ffffff',
    }).setOrigin(0.5, 0).setDepth(DEPTH.hud);

    this.add.text(510, row2Y, 'Discards', {
      fontFamily: FONT, fontSize: '11px', color: '#aaaaaa',
    }).setOrigin(0.5, 0).setDepth(DEPTH.hud);

    this.discardsText = this.add.text(510, row2Y + 14, String(rs.discardsRemaining), {
      fontFamily: FONT, fontSize: '18px', color: '#ff8844',
    }).setOrigin(0.5, 0).setDepth(DEPTH.hud);

    this.add.text(640, row2Y, 'Money', {
      fontFamily: FONT, fontSize: '11px', color: '#aaaaaa',
    }).setOrigin(0.5, 0).setDepth(DEPTH.hud);

    this.moneyText = this.add.text(640, row2Y + 14, `$${rs.money}`, {
      fontFamily: FONT, fontSize: '18px', color: COLORS.goldHex,
    }).setOrigin(0.5, 0).setDepth(DEPTH.hud);

    this.add.text(790, row2Y, 'Ante', {
      fontFamily: FONT, fontSize: '11px', color: '#aaaaaa',
    }).setOrigin(0.5, 0).setDepth(DEPTH.hud);

    this.anteText = this.add.text(790, row2Y + 14, `${rs.ante} / 8`, {
      fontFamily: FONT, fontSize: '18px', color: '#cccccc',
    }).setOrigin(0.5, 0).setDepth(DEPTH.hud);

    // Hand type label (center of play area)
    this.handTypeText = this.add.text(GAME_WIDTH / 2, PLAY_AREA_Y + 70, '', {
      fontFamily: FONT, fontSize: '16px', color: COLORS.goldHex,
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(DEPTH.ui);
  }

  private _drawProgressBar(): void {
    const rs = this.runState;
    const barX = 1140;
    const barY = 18;
    const barW = 120;
    const barH = 14;

    this.progressBar.clear();
    this.progressBar.fillStyle(0x222222, 1);
    this.progressBar.fillRoundedRect(barX, barY, barW, barH, 4);
    this.progressBar.lineStyle(1, 0x555555, 1);
    this.progressBar.strokeRoundedRect(barX, barY, barW, barH, 4);

    this.progressFill.clear();
    const progress = Math.min(1, rs.chipsScored / rs.chipTarget);
    if (progress > 0) {
      this.progressFill.fillStyle(progress >= 1 ? COLORS.green : COLORS.chipBlue, 1);
      this.progressFill.fillRoundedRect(barX, barY, barW * progress, barH, 4);
    }
  }

  // ---------------------------------------------------------------------------
  // Joker Row
  // ---------------------------------------------------------------------------

  private _buildJokerRow(): void {
    const rs = this.runState;

    // Clear existing
    this.jokerViews.forEach(jv => jv.destroy());
    this.jokerViews = [];

    // Slots background
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

    // Joker count label
    this.add.text(60 + rs.maxJokerSlots * 82 + 10, JOKER_ROW_Y, `${rs.jokers.length}/${rs.maxJokerSlots}`, {
      fontFamily: FONT, fontSize: '12px', color: '#888888',
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

    // Slot backgrounds
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

    // Right-click to use consumable
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
      // Planet: apply to hand levels
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
    // "Play a hand" prompt
    this.add.text(GAME_WIDTH / 2, PLAY_AREA_Y, 'Select cards to play', {
      fontFamily: FONT, fontSize: '14px', color: '#3a2a50',
    }).setOrigin(0.5).setDepth(DEPTH.bg + 2);
  }

  // ---------------------------------------------------------------------------
  // Bottom Controls
  // ---------------------------------------------------------------------------

  private _buildBottomControls(): void {
    const rs = this.runState;

    this.playBtn = new Button(this, 420, 668, 200, 52, 'Play Hand', () => {
      void this.playHand();
    }, { color: COLORS.green, fontSize: 18 });
    this.playBtn.setDepth(DEPTH.ui);

    this.discardBtn = new Button(this, 640, 668, 180, 52, 'Discard', () => {
      void this.discard();
    }, { color: 0x8b4513, fontSize: 18 });
    this.discardBtn.setDepth(DEPTH.ui);

    // Deck / discard info
    this.deckCountText = this.add.text(GAME_WIDTH - 60, 640, `Deck\n${rs.deck.length}`, {
      fontFamily: FONT, fontSize: '13px', color: '#aaaaaa', align: 'center',
    }).setOrigin(0.5).setDepth(DEPTH.ui);

    this.discardCountText = this.add.text(GAME_WIDTH - 60, 688, `Disc\n${rs.discardPile.length}`, {
      fontFamily: FONT, fontSize: '13px', color: '#888888', align: 'center',
    }).setOrigin(0.5).setDepth(DEPTH.ui);

    // Sort buttons
    const sortByRankBtn = this.add.text(860, 668, 'Sort Rank', {
      fontFamily: FONT, fontSize: '13px', color: '#aaaaaa',
      backgroundColor: '#2d1e3e', padding: { x: 8, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(DEPTH.ui);

    sortByRankBtn.on('pointerdown', () => this._sortHandByRank());
    sortByRankBtn.on('pointerover', () => sortByRankBtn.setColor(COLORS.goldHex));
    sortByRankBtn.on('pointerout', () => sortByRankBtn.setColor('#aaaaaa'));

    const sortBySuitBtn = this.add.text(980, 668, 'Sort Suit', {
      fontFamily: FONT, fontSize: '13px', color: '#aaaaaa',
      backgroundColor: '#2d1e3e', padding: { x: 8, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(DEPTH.ui);

    sortBySuitBtn.on('pointerdown', () => this._sortHandBySuit());
    sortBySuitBtn.on('pointerover', () => sortBySuitBtn.setColor(COLORS.goldHex));
    sortBySuitBtn.on('pointerout', () => sortBySuitBtn.setColor('#aaaaaa'));
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
      // Reshuffle discard into deck
      rs.deck = [...rs.discardPile].sort(() => Math.random() - 0.5);
      rs.discardPile = [];
    }

    // Boss blind card draw modification is handled per-card below (e.g., The Wheel)

    const { drawn, remaining } = drawCards(rs.deck, needed);
    rs.deck = remaining;

    // Apply The Wheel: face down randomly
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

    // Destroy old views
    this.handViews.forEach(cv => cv.destroy());
    this.handViews = [];

    const cards = rs.hand;
    const count = cards.length;
    if (count === 0) return;

    const totalW = (count - 1) * 85;
    const startX = GAME_WIDTH / 2 - totalW / 2;

    cards.forEach((card, i) => {
      const targetX = startX + i * 85;
      const targetY = HAND_POSITIONS_Y;

      // Start from deck position (off-screen top-right) for deal animation
      const cv = new CardView(this, GAME_WIDTH - 60, 640, card, this.textureCache);
      cv.setFaceUp(card.faceUp);
      cv.setAlpha(0);
      this.handViews.push(cv);

      this.tweens.add({
        targets: cv,
        x: targetX,
        y: targetY,
        alpha: 1,
        duration: ANIM.dealDuration,
        delay: i * ANIM.dealStagger,
        ease: 'Quad.Out',
      });

      cv.on('pointerdown', () => this._onCardClick(cv));
    });

    // Update hand type preview after dealing
    this.time.delayedCall(ANIM.dealDuration + cards.length * ANIM.dealStagger + 50, () => {
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

    const selectedCards = selected.map(cv => cv.cardData);

    // Animate selected cards flying to play area
    await this._animateCardsToPlayArea(selected);

    // Run scoring engine
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

    // Show hand type
    this.handTypeText.setText(result.handType);
    ScorePopup.spawn(this, GAME_WIDTH / 2, PLAY_AREA_Y - 80, result.handType, COLORS.goldHex);

    // Animate scoring steps
    this.currentChips = 0;
    this.currentMult = 0;
    this._updateCounterDisplays(0, 0);

    await this._animateScoringSteps(result.steps, selectedCards);

    // Final score popup
    const finalScore = result.finalScore;
    ScorePopup.spawn(this, GAME_WIDTH / 2, PLAY_AREA_Y - 30, `${numStr(finalScore)}`, '#ffffff');

    // Update runState
    rs.chipsScored += finalScore;
    rs.handsRemaining -= 1;
    this.handsPlayedThisRound += 1;
    rs.handsThisRun += 1;
    rs.bossBlindHandsPlayed += 1;

    // Update hand play counts
    rs.handPlayCounts[result.handType] = (rs.handPlayCounts[result.handType] ?? 0) + 1;
    rs.mostPlayedHand = result.handType;

    // Boss blind hand-played effect
    onHandPlayedForBlind(rs, selectedCards);

    // Apply deferred effects
    applyDeferredEffects(rs);

    // Handle destroyed cards
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

    // Handle created consumables
    if (result.createdConsumables && result.createdConsumables.length > 0) {
      for (const defId of result.createdConsumables) {
        if (rs.consumables.length < rs.maxConsumableSlots) {
          rs.consumables.push({ instanceId: `${defId}_${Date.now()}`, type: 'tarot', defId });
        }
      }
      this._rebuildConsumableRow();
    }

    // The Hook boss: discard 2 random cards after hand
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

    // Move played cards to discard
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

    // Animate play area cards off
    await this._clearPlayArea();

    // Check win condition
    const won = rs.chipsScored >= rs.chipTarget;
    if (won) {
      await this._onBlindWon();
      return;
    }

    // Check loss condition
    if (rs.handsRemaining <= 0) {
      await this._onGameOver();
      return;
    }

    // Draw new cards
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

      // Process hints
      for (const hint of step.hints) {
        if (hint.type === 'card_glow') {
          const cv = this.playAreaViews.find(v => v.cardData.id === hint.cardId);
          cv?.glow(COLORS.chipBlue);
        } else if (hint.type === 'joker_activate') {
          const jv = this.jokerViews.find(v => v.jokerData.instanceId === hint.jokerId);
          jv?.flash();
        } else if (hint.type === 'chip_add' && hint.delta > 0) {
          ScorePopup.spawn(this, GAME_WIDTH / 2 - 100, PLAY_AREA_Y - 60, `+${numStr(hint.delta)} Chips`, '#4a90d9');
        } else if (hint.type === 'mult_add' && hint.delta > 0) {
          ScorePopup.spawn(this, GAME_WIDTH / 2 + 100, PLAY_AREA_Y - 60, `+${hint.delta} Mult`, '#e74c3c');
        } else if (hint.type === 'mult_mul') {
          ScorePopup.spawn(this, GAME_WIDTH / 2 + 100, PLAY_AREA_Y - 60, `×${hint.factor} Mult`, '#ff8844');
        } else if (hint.type === 'money_add') {
          ScorePopup.spawn(this, GAME_WIDTH / 2, PLAY_AREA_Y + 50, `+$${hint.delta}`, COLORS.goldHex);
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

    // Notify jokers of discard
    for (const j of rs.jokers) {
      j.onDiscard?.(rs, selected.map(cv => cv.cardData));
    }

    // Animate off-screen
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

    // Remove from hand, add to discard pile
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

    // Deactivate boss blind
    deactivateBlind(rs);

    // Calculate end-of-round money
    const earned = calcRoundEndMoney(rs, this.handsPlayedThisRound, this.discardsUsedThisRound);
    rs.money += earned;

    // Deferred effects
    applyDeferredEffects(rs);

    // Joker end-of-round effects
    for (const j of rs.jokers) {
      j.onRoundEnd?.(rs);
    }

    ScorePopup.spawn(this, GAME_WIDTH / 2, PLAY_AREA_Y, `Round Won! +$${earned}`, '#44cc66');
    await this._delay(1200);

    // Return cards to deck: move hand + playedThisRound to discard, then shuffle into deck
    for (const card of rs.hand) rs.discardPile.push(card);
    rs.hand = [];
    rs.deck = [...rs.deck, ...rs.discardPile].sort(() => Math.random() - 0.5);
    rs.discardPile = [];
    rs.playedThisRound = [];

    const rng = getRNG(rs);
    advanceToNextBlind(rs, rng);
    rs.rngState = rng.getState();

    saveRun(rs);

    // Check if game won (8 antes)
    if (rs.ante > 8) {
      this.scene.start('WinScene', { runState: rs });
      return;
    }

    this.scene.start('ShopScene', { runState: rs });
  }

  private async _onGameOver(): Promise<void> {
    ScorePopup.spawn(this, GAME_WIDTH / 2, PLAY_AREA_Y, 'Out of hands!', '#ff4444');
    await this._delay(1500);
    this.scene.start('GameOverScene', { runState: this.runState, reason: 'out_of_hands' });
  }

  // ---------------------------------------------------------------------------
  // UI Updates
  // ---------------------------------------------------------------------------

  _updateUI(): void {
    const rs = this.runState;

    // Blind name
    const blindName = getBlindName(rs.ante, rs.blindIndex, rs.activeBlindId);
    this.blindNameText.setText(blindName);

    this.chipsText.setText('0');
    this.multText.setText('0');
    this.scoreText.setText(numStr(rs.chipsScored));
    this.targetText.setText(numStr(rs.chipTarget));
    this.handsText.setText(String(rs.handsRemaining));
    this.discardsText.setText(String(rs.discardsRemaining));
    this.moneyText.setText(`$${rs.money}`);
    this.anteText.setText(`${rs.ante} / 8`);
    this.deckCountText.setText(`Deck\n${rs.deck.length}`);
    this.discardCountText.setText(`Disc\n${rs.discardPile.length}`);

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
