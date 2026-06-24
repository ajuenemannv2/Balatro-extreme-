import Phaser from 'phaser';
import type { RunState } from '../types/Run.ts';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, FONT } from '../config.ts';
import { Button } from '../ui/Button.ts';
import { clearSave } from '../engine/SaveSystem.ts';
import { numStr } from '../utils/MathUtils.ts';
import { AudioManager } from '../audio/AudioManager.ts';

export class GameOverScene extends Phaser.Scene {
  private runState!: RunState;
  private reason!: string;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data?: { runState?: RunState; reason?: string }): void {
    if (data?.runState) this.runState = data.runState;
    this.reason = data?.reason ?? 'unknown';
  }

  create(): void {
    const rs = this.runState;
    this.cameras.main.setBackgroundColor(COLORS.bgHex);
    AudioManager.playSFX('game_over');
    AudioManager.stopMusic();

    // Dark overlay panel
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0008, 0.85);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Animated red vignette
    const vignette = this.add.graphics();
    vignette.fillStyle(0x660000, 0.3);
    vignette.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // GAME OVER title
    const titleText = this.add.text(GAME_WIDTH / 2, 150, 'GAME OVER', {
      fontFamily: FONT,
      fontSize: '80px',
      color: '#cc2222',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: titleText,
      scaleX: { from: 0.8, to: 1 },
      scaleY: { from: 0.8, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 600,
      ease: 'Back.Out',
    });

    // Subtitle reason
    const reasonMessages: Record<string, string> = {
      out_of_hands: 'You ran out of hands!',
      skipped: 'Better luck next time.',
    };
    const subtitle = reasonMessages[this.reason] ?? 'The game is over.';
    this.add.text(GAME_WIDTH / 2, 255, subtitle, {
      fontFamily: FONT,
      fontSize: '22px',
      color: '#ff8888',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: this.children.getChildren()[this.children.getChildren().length - 1],
      alpha: 1,
      duration: 400,
      delay: 400,
    });

    // Stats panel
    const statsPanel = this.add.graphics();
    statsPanel.fillStyle(COLORS.panelDark, 0.9);
    statsPanel.fillRoundedRect(GAME_WIDTH / 2 - 280, 295, 560, 250, 12);
    statsPanel.lineStyle(1, 0x551111, 0.8);
    statsPanel.strokeRoundedRect(GAME_WIDTH / 2 - 280, 295, 560, 250, 12);

    this.add.text(GAME_WIDTH / 2, 310, 'Run Statistics', {
      fontFamily: FONT,
      fontSize: '20px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    if (rs) {
      const stats = [
        ['Ante Reached', `${rs.ante} / 8`],
        ['Hands Played', String(rs.handsThisRun)],
        ['Most Played Hand', rs.mostPlayedHand ?? 'None'],
        ['Final Score', numStr(rs.chipsScored)],
        ['Target Was', numStr(rs.chipTarget)],
        ['Jokers Owned', String(rs.jokers.length)],
        ['Money Remaining', `$${rs.money}`],
      ];

      stats.forEach(([label, value], i) => {
        const rowY = 345 + i * 28;
        this.add.text(GAME_WIDTH / 2 - 200, rowY, label, {
          fontFamily: FONT,
          fontSize: '15px',
          color: '#888888',
        });
        this.add.text(GAME_WIDTH / 2 + 180, rowY, value, {
          fontFamily: FONT,
          fontSize: '15px',
          color: '#ffffff',
        }).setOrigin(1, 0);
      });
    }

    // Jokers owned display
    if (rs && rs.jokers.length > 0) {
      this.add.text(GAME_WIDTH / 2, 560, 'Your Jokers:', {
        fontFamily: FONT,
        fontSize: '14px',
        color: '#666666',
      }).setOrigin(0.5);

      const jokerStr = rs.jokers.map(j => j.name).join('  ·  ');
      this.add.text(GAME_WIDTH / 2, 582, jokerStr, {
        fontFamily: FONT,
        fontSize: '12px',
        color: '#555555',
        wordWrap: { width: 800 },
        align: 'center',
      }).setOrigin(0.5);
    }

    // Buttons
    new Button(this, GAME_WIDTH / 2, 648, 220, 52, 'Back to Menu', () => {
      clearSave();
      this.scene.start('MenuScene');
    }, { color: COLORS.btnPurple, fontSize: 18 });

    new Button(this, GAME_WIDTH / 2, 705, 160, 40, 'New Run', () => {
      clearSave();
      this.scene.start('RunSelectScene');
    }, { color: COLORS.panel, fontSize: 14 });
  }
}
