import Phaser from 'phaser';
import type { RunState } from '../types/Run.ts';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, FONT } from '../config.ts';
import { Button } from '../ui/Button.ts';
import { clearSave } from '../engine/SaveSystem.ts';
import { numStr } from '../utils/MathUtils.ts';

export class WinScene extends Phaser.Scene {
  private runState!: RunState;

  constructor() {
    super({ key: 'WinScene' });
  }

  init(data?: { runState?: RunState }): void {
    if (data?.runState) this.runState = data.runState;
  }

  create(): void {
    const rs = this.runState;
    this.cameras.main.setBackgroundColor(COLORS.bgHex);

    // Background glow overlay
    const glow = this.add.graphics();
    const glowGrad = glow.fillStyle(COLORS.gold, 0.08);
    void glowGrad;
    glow.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Particle emitter for fireworks / confetti
    this._spawnParticles();

    // VICTORY title
    const titleText = this.add.text(GAME_WIDTH / 2, 130, 'VICTORY!', {
      fontFamily: FONT,
      fontSize: '90px',
      color: COLORS.goldHex,
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: titleText,
      alpha: 1,
      scaleX: { from: 0.5, to: 1 },
      scaleY: { from: 0.5, to: 1 },
      duration: 700,
      ease: 'Back.Out',
    });

    this.tweens.add({
      targets: titleText,
      y: 124,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
      delay: 700,
    });

    // Subtitle
    const sub = this.add.text(GAME_WIDTH / 2, 240, 'You beat all 8 Antes!', {
      fontFamily: FONT,
      fontSize: '24px',
      color: '#ffdd88',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: sub, alpha: 1, duration: 500, delay: 600 });

    // Stats panel
    const panelX = GAME_WIDTH / 2 - 280;
    const panelY = 280;
    const panelW = 560;
    const panelH = 240;

    const statsPanel = this.add.graphics();
    statsPanel.fillStyle(COLORS.panelDark, 0.9);
    statsPanel.fillRoundedRect(panelX, panelY, panelW, panelH, 12);
    statsPanel.lineStyle(2, COLORS.gold, 0.6);
    statsPanel.strokeRoundedRect(panelX, panelY, panelW, panelH, 12);

    this.add.text(GAME_WIDTH / 2, panelY + 18, 'Final Stats', {
      fontFamily: FONT,
      fontSize: '20px',
      color: COLORS.goldHex,
    }).setOrigin(0.5);

    if (rs) {
      const stats = [
        ['Antes Cleared', '8 / 8'],
        ['Total Hands Played', String(rs.handsThisRun)],
        ['Best Hand', rs.mostPlayedHand ?? 'None'],
        ['Jokers Owned', String(rs.jokers.length)],
        ['Money at End', `$${rs.money}`],
        ['Stake Level', String(rs.stakeLevel)],
        ['Seed', rs.seed],
      ];

      stats.forEach(([label, value], i) => {
        const rowY = panelY + 50 + i * 26;
        this.add.text(panelX + 30, rowY, label, {
          fontFamily: FONT,
          fontSize: '14px',
          color: '#888888',
        });
        this.add.text(panelX + panelW - 30, rowY, value, {
          fontFamily: FONT,
          fontSize: '14px',
          color: '#ffffff',
        }).setOrigin(1, 0);
      });

      // Joker list
      if (rs.jokers.length > 0) {
        this.add.text(GAME_WIDTH / 2, panelY + panelH + 18, rs.jokers.map(j => j.name).join('  ·  '), {
          fontFamily: FONT,
          fontSize: '11px',
          color: '#555555',
          wordWrap: { width: 800 },
          align: 'center',
        }).setOrigin(0.5);
      }
    }

    // Score callout
    if (rs) {
      const scoreBox = this.add.graphics();
      scoreBox.fillStyle(0x1a3a10, 0.9);
      scoreBox.fillRoundedRect(GAME_WIDTH / 2 - 130, panelY + panelH + 50, 260, 55, 8);
      scoreBox.lineStyle(2, COLORS.green, 0.8);
      scoreBox.strokeRoundedRect(GAME_WIDTH / 2 - 130, panelY + panelH + 50, 260, 55, 8);

      this.add.text(GAME_WIDTH / 2, panelY + panelH + 68, `Chips Scored: ${numStr(rs.chipsScored)}`, {
        fontFamily: FONT,
        fontSize: '16px',
        color: '#44ff88',
      }).setOrigin(0.5);
    }

    // Buttons
    new Button(this, GAME_WIDTH / 2 - 120, GAME_HEIGHT - 50, 200, 52, 'Play Again', () => {
      clearSave();
      this.scene.start('RunSelectScene');
    }, { color: COLORS.green, fontSize: 18 });

    new Button(this, GAME_WIDTH / 2 + 120, GAME_HEIGHT - 50, 200, 52, 'Main Menu', () => {
      clearSave();
      this.scene.start('MenuScene');
    }, { color: COLORS.panel, fontSize: 18 });
  }

  private _spawnParticles(): void {
    // Create simple colored squares as particle texture
    const gfx = this.add.graphics();
    gfx.fillStyle(0xffffff, 1);
    gfx.fillRect(0, 0, 6, 6);
    gfx.generateTexture('confetti_particle', 6, 6);
    gfx.destroy();

    // Burst emitter from multiple positions along the top
    const colors = [
      COLORS.gold, COLORS.chipBlue, COLORS.multRed, COLORS.green,
      0xff88cc, 0x88ffcc, 0xffff44, 0xff44ff,
    ];

    colors.forEach((color, i) => {
      const emitX = (GAME_WIDTH / (colors.length - 1)) * i;
      const emitter = this.add.particles(emitX, -10, 'confetti_particle', {
        speed: { min: 80, max: 260 },
        angle: { min: 60, max: 120 },
        gravityY: 160,
        lifespan: { min: 2000, max: 4000 },
        quantity: 3,
        frequency: 180,
        rotate: { min: 0, max: 360 },
        tint: color,
        alpha: { start: 1, end: 0 },
        scaleX: { min: 0.5, max: 1.5 },
        scaleY: { min: 0.5, max: 1.5 },
      });

      // Stagger start
      emitter.stop();
      this.time.delayedCall(i * 80, () => {
        emitter.start();
        // Stop after 5 seconds, leave existing particles to fall
        this.time.delayedCall(5000, () => emitter.stop());
      });

      void emitter; // held in scope by closure for start/stop calls
    });
  }

  shutdown(): void {
    // Particles destroyed with scene
  }
}
