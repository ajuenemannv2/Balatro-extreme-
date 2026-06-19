import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, FONT } from '../config.ts';
import { Button } from '../ui/Button.ts';
import { hasSave } from '../engine/SaveSystem.ts';
import { EventBus } from '../utils/EventBus.ts';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bgHex);

    // Decorative panel behind title
    const titlePanel = this.add.graphics();
    titlePanel.fillStyle(COLORS.panel, 0.6);
    titlePanel.fillRoundedRect(GAME_WIDTH / 2 - 200, 160, 400, 160, 12);

    const title = this.add.text(GAME_WIDTH / 2, 210, 'BALATRO', {
      fontFamily: FONT,
      fontSize: '72px',
      color: COLORS.goldHex,
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 295, 'EXTREME', {
      fontFamily: FONT,
      fontSize: '32px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      y: 204,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    // Decorative card suit symbols
    const suits = ['♠', '♥', '♦', '♣'];
    const suitColors = ['#dddddd', '#ff6666', '#ff6666', '#dddddd'];
    suits.forEach((s, i) => {
      this.add.text(GAME_WIDTH / 2 - 80 + i * 52, 355, s, {
        fontFamily: FONT,
        fontSize: '28px',
        color: suitColors[i],
      }).setOrigin(0.5).setAlpha(0.3);
    });

    const btnW = 220;
    const btnH = 52;
    const btnStartY = 400;
    const btnSpacing = 64;

    new Button(this, GAME_WIDTH / 2, btnStartY, btnW, btnH, 'New Run', () => {
      this.scene.start('RunSelectScene');
    }, { color: COLORS.btnPurple });

    if (hasSave()) {
      new Button(this, GAME_WIDTH / 2, btnStartY + btnSpacing, btnW, btnH, 'Continue', () => {
        EventBus.emit('load_saved_run');
        this.scene.start('GameScene');
      }, { color: COLORS.green });
    }

    new Button(
      this,
      GAME_WIDTH / 2,
      btnStartY + btnSpacing * (hasSave() ? 2 : 1),
      btnW,
      btnH,
      'Collection',
      () => {
        // TODO: collection scene
      },
      { color: COLORS.panel }
    );

    this.add.text(10, GAME_HEIGHT - 20, 'v1.0.0', {
      fontFamily: FONT,
      fontSize: '12px',
      color: '#666666',
    });

    this.add.text(GAME_WIDTH - 10, GAME_HEIGHT - 20, 'Balatro Extreme Web', {
      fontFamily: FONT,
      fontSize: '12px',
      color: '#444444',
    }).setOrigin(1, 0);
  }
}
