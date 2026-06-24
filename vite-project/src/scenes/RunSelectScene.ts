import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, FONT } from '../config.ts';
import { Button } from '../ui/Button.ts';
import { DECK_DEFS } from '../data/DeckDefs.ts';
import { createNewRun } from '../engine/RunManager.ts';
import { AudioManager } from '../audio/AudioManager.ts';

export class RunSelectScene extends Phaser.Scene {
  private selectedStake = 0;
  private selectedDeckIdx = 0;

  constructor() {
    super({ key: 'RunSelectScene' });
  }

  init(data?: { selectedStake?: number; selectedDeckIdx?: number }): void {
    if (data?.selectedStake !== undefined) this.selectedStake = data.selectedStake;
    if (data?.selectedDeckIdx !== undefined) this.selectedDeckIdx = data.selectedDeckIdx;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bgHex);
    AudioManager.switchTrack('menu').catch(() => {});

    // Background panels
    const leftPanel = this.add.graphics();
    leftPanel.fillStyle(COLORS.panel, 0.7);
    leftPanel.fillRoundedRect(40, 100, 580, 540, 10);

    const rightPanel = this.add.graphics();
    rightPanel.fillStyle(COLORS.panel, 0.7);
    rightPanel.fillRoundedRect(660, 100, 580, 540, 10);

    this.add.text(GAME_WIDTH / 2, 45, 'New Run', {
      fontFamily: FONT,
      fontSize: '40px',
      color: COLORS.goldHex,
    }).setOrigin(0.5);

    // ---- Stake selector (left panel) ----
    this.add.text(330, 130, 'Stake', {
      fontFamily: FONT,
      fontSize: '20px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    const stakeNames = ['White', 'Red', 'Green', 'Black', 'Blue', 'Purple', 'Orange', 'Gold'];
    const stakeColors = [
      '#ffffff', '#ff4444', '#44ff44', '#888888',
      '#4488ff', '#8844ff', '#ff8844', '#ffdd00',
    ];

    const stakeDescriptions = [
      'Default stake. No modifiers.',
      'Cards appear face-down at start.',
      'Jokers cost $2 more.',
      'Debuffs face cards in boss blinds.',
      'Forced Ante: must meet ante or lose.',
      'Eternal Jokers cannot be sold.',
      'Hands start at level 0.',
      'Maximum difficulty. All stakes active.',
    ];

    const stakesPerRow = 4;
    stakeNames.forEach((name, i) => {
      const col = i % stakesPerRow;
      const row = Math.floor(i / stakesPerRow);
      const x = 100 + col * 120;
      const y = 185 + row * 80;
      const isSelected = i === this.selectedStake;

      const btn = this.add.graphics();
      btn.fillStyle(isSelected ? COLORS.btnPurple : COLORS.panelDark, 1);
      btn.fillRoundedRect(x - 48, y - 22, 96, 44, 6);
      if (isSelected) {
        btn.lineStyle(2, COLORS.gold, 1);
        btn.strokeRoundedRect(x - 48, y - 22, 96, 44, 6);
      }

      this.add.text(x, y - 6, name, {
        fontFamily: FONT,
        fontSize: '14px',
        color: stakeColors[i],
      }).setOrigin(0.5);

      this.add.text(x, y + 10, '★'.repeat(i + 1).slice(0, 5), {
        fontFamily: FONT,
        fontSize: '9px',
        color: stakeColors[i],
      }).setOrigin(0.5);

      btn.setInteractive(
        new Phaser.Geom.Rectangle(x - 48, y - 22, 96, 44),
        Phaser.Geom.Rectangle.Contains
      );
      btn.on('pointerdown', () => {
        this.scene.restart({ selectedStake: i, selectedDeckIdx: this.selectedDeckIdx });
      });
      btn.on('pointerover', () => {
        if (i !== this.selectedStake) {
          btn.clear();
          btn.fillStyle(COLORS.btnHover, 0.5);
          btn.fillRoundedRect(x - 48, y - 22, 96, 44, 6);
        }
        // Show description
        stakeDescText.setText(stakeDescriptions[i]);
      });
      btn.on('pointerout', () => {
        if (i !== this.selectedStake) {
          btn.clear();
          btn.fillStyle(COLORS.panelDark, 1);
          btn.fillRoundedRect(x - 48, y - 22, 96, 44, 6);
        }
        stakeDescText.setText(stakeDescriptions[this.selectedStake]);
      });
    });

    const stakeDescText = this.add.text(330, 370, stakeDescriptions[this.selectedStake], {
      fontFamily: FONT,
      fontSize: '13px',
      color: '#cccccc',
      wordWrap: { width: 500 },
      align: 'center',
    }).setOrigin(0.5, 0);

    // ---- Deck selector (right panel) ----
    this.add.text(950, 130, 'Deck', {
      fontFamily: FONT,
      fontSize: '20px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    const deckDef = DECK_DEFS[this.selectedDeckIdx] ?? DECK_DEFS[0];

    // Deck art placeholder
    const deckArt = this.add.graphics();
    deckArt.fillStyle(COLORS.cardBack, 1);
    deckArt.fillRoundedRect(879, 155, 142, 190, 8);
    deckArt.lineStyle(2, COLORS.gold, 0.6);
    deckArt.strokeRoundedRect(879, 155, 142, 190, 8);

    this.add.text(950, 250, '🂠', {
      fontFamily: FONT,
      fontSize: '72px',
      color: '#ffffff',
    }).setOrigin(0.5);

    const deckNameText = this.add.text(950, 360, deckDef.name, {
      fontFamily: FONT,
      fontSize: '22px',
      color: COLORS.goldHex,
    }).setOrigin(0.5);

    const deckDescText = this.add.text(950, 395, deckDef.description, {
      fontFamily: FONT,
      fontSize: '13px',
      color: '#cccccc',
      wordWrap: { width: 520 },
      align: 'center',
    }).setOrigin(0.5, 0);

    // Prev / Next deck buttons
    const prevBtn = this.add.text(690, 355, '◀', {
      fontFamily: FONT,
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const nextBtn = this.add.text(1210, 355, '▶', {
      fontFamily: FONT,
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // Deck index indicator
    const deckIdxText = this.add.text(950, 450, `${this.selectedDeckIdx + 1} / ${DECK_DEFS.length}`, {
      fontFamily: FONT,
      fontSize: '14px',
      color: '#888888',
    }).setOrigin(0.5);

    const updateDeck = (newIdx: number): void => {
      this.selectedDeckIdx = ((newIdx % DECK_DEFS.length) + DECK_DEFS.length) % DECK_DEFS.length;
      const d = DECK_DEFS[this.selectedDeckIdx];
      deckNameText.setText(d.name);
      deckDescText.setText(d.description);
      deckIdxText.setText(`${this.selectedDeckIdx + 1} / ${DECK_DEFS.length}`);
    };

    prevBtn.on('pointerdown', () => updateDeck(this.selectedDeckIdx - 1));
    nextBtn.on('pointerdown', () => updateDeck(this.selectedDeckIdx + 1));
    prevBtn.on('pointerover', () => prevBtn.setColor(COLORS.goldHex));
    prevBtn.on('pointerout', () => prevBtn.setColor('#ffffff'));
    nextBtn.on('pointerover', () => nextBtn.setColor(COLORS.goldHex));
    nextBtn.on('pointerout', () => nextBtn.setColor('#ffffff'));

    // ---- Bottom buttons ----
    new Button(this, GAME_WIDTH / 2, 620, 240, 58, 'Start Run', () => {
      const seed = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const deckId = DECK_DEFS[this.selectedDeckIdx].id;
      const rs = createNewRun(seed, this.selectedStake, deckId);
      this.scene.start('BlindSelectScene', { runState: rs });
    }, { color: COLORS.green, fontSize: 20 });

    new Button(this, GAME_WIDTH / 2, 685, 140, 40, '← Back', () => {
      this.scene.start('MenuScene');
    }, { color: COLORS.panel });
  }
}
