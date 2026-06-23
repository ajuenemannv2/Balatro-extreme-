import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, FONT } from '../config.ts';
import { Button } from '../ui/Button.ts';
import { hasSave, loadRun } from '../engine/SaveSystem.ts';
import { SFX } from '../utils/SoundEngine.ts';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bgHex);
    this.input.once('pointerdown', () => SFX.unlock());

    // ── Deep radial background ────────────────────────────────────────────────
    const bgGfx = this.add.graphics();
    // Outer ring – near-black purple
    bgGfx.fillStyle(0x0c0818, 1);
    bgGfx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Radial "spotlight" from center using concentric ellipses (dark → lighter)
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2 - 40;
    const radialSteps = 8;
    for (let s = radialSteps; s >= 1; s--) {
      const rx = (GAME_WIDTH * 0.55 * s) / radialSteps;
      const ry = (GAME_HEIGHT * 0.55 * s) / radialSteps;
      const alpha = 0.04 * (radialSteps - s + 1);
      bgGfx.fillStyle(0x4a1060, alpha);
      bgGfx.fillEllipse(cx, cy, rx * 2, ry * 2);
    }
    bgGfx.setDepth(0);

    // ── Decorative background card shapes (fanned) ───────────────────────────
    const cardGfx = this.add.graphics();
    cardGfx.setDepth(1);
    const cardConfigs = [
      { x: cx - 380, y: cy + 100, angle: -28 },
      { x: cx - 190, y: cy + 60,  angle: -14 },
      { x: cx,       y: cy + 50,  angle:   0 },
      { x: cx + 190, y: cy + 60,  angle:  14 },
      { x: cx + 380, y: cy + 100, angle:  28 },
    ];
    const cw = 72; const ch = 96;
    for (const cfg of cardConfigs) {
      cardGfx.save();
      // Phaser graphics doesn't support rotation transforms on individual shapes,
      // so we approximate fans by offsetting positions with trig
      const rad = (cfg.angle * Math.PI) / 180;
      const ox = Math.sin(rad) * 40;
      const oy = -Math.cos(rad) * 20;
      const bx = cfg.x + ox - cw / 2;
      const by = cfg.y + oy - ch / 2;
      // Card back fill
      cardGfx.fillStyle(0x1a3a6b, 0.25);
      cardGfx.fillRoundedRect(bx, by, cw, ch, 6);
      // Card border
      cardGfx.lineStyle(1, 0x2a5aab, 0.35);
      cardGfx.strokeRoundedRect(bx, by, cw, ch, 6);
      // Inner pattern dot
      cardGfx.fillStyle(0x2a5aab, 0.2);
      cardGfx.fillCircle(cfg.x + ox, cfg.y + oy, 12);
      cardGfx.restore();
    }

    // ── Floating suit symbols ─────────────────────────────────────────────────
    const suitConfigs = [
      { symbol: '♠', x: cx - 480, y: cy - 160, color: '#ccccee', size: 52 },
      { symbol: '♥', x: cx + 490, y: cy - 120, color: '#dd5555', size: 48 },
      { symbol: '♦', x: cx - 460, y: cy + 200, color: '#dd5555', size: 44 },
      { symbol: '♣', x: cx + 470, y: cy + 210, color: '#ccccee', size: 50 },
    ];

    for (const sc of suitConfigs) {
      const suitTxt = this.add.text(sc.x, sc.y, sc.symbol, {
        fontFamily: FONT,
        fontSize: `${sc.size}px`,
        color: sc.color,
      }).setOrigin(0.5).setAlpha(0.18).setDepth(2);

      // Slow float tween
      this.tweens.add({
        targets: suitTxt,
        y: sc.y - 18,
        alpha: 0.28,
        duration: 2800 + Math.random() * 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
        delay: Math.random() * 1000,
      });

      // Slow scale pulse
      this.tweens.add({
        targets: suitTxt,
        scaleX: 1.12,
        scaleY: 1.12,
        duration: 3200 + Math.random() * 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
        delay: Math.random() * 600,
      });
    }

    // ── Title panel glow ──────────────────────────────────────────────────────
    const glowGfx = this.add.graphics();
    glowGfx.setDepth(3);
    // Multi-layer soft glow behind title
    const glowLayers = [
      { r: 260, a: 0.06 },
      { r: 200, a: 0.10 },
      { r: 140, a: 0.14 },
      { r: 80,  a: 0.18 },
    ];
    for (const gl of glowLayers) {
      glowGfx.fillStyle(0xcc3300, gl.a);
      glowGfx.fillEllipse(cx, 230, gl.r * 2.2, gl.r * 0.9);
    }

    // Dark panel behind text
    const panelGfx = this.add.graphics();
    panelGfx.setDepth(4);
    panelGfx.fillStyle(0x0a0614, 0.72);
    panelGfx.fillRoundedRect(cx - 240, 155, 480, 180, 16);
    panelGfx.lineStyle(1, 0x6a2080, 0.5);
    panelGfx.strokeRoundedRect(cx - 240, 155, 480, 180, 16);

    // ── "BALATRO" title ───────────────────────────────────────────────────────
    // Shadow / glow layer
    this.add.text(cx + 3, 215 + 3, 'BALATRO', {
      fontFamily: FONT,
      fontSize: '80px',
      color: '#880000',
    }).setOrigin(0.5).setAlpha(0.7).setDepth(5);

    const title = this.add.text(cx, 215, 'BALATRO', {
      fontFamily: FONT,
      fontSize: '80px',
      color: COLORS.goldHex,
      stroke: '#3a0000',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(6);

    // Shimmer tween cycling gold → white → gold
    this.tweens.addCounter({
      from: 0,
      to: 100,
      duration: 2400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
      onUpdate: (tween) => {
        const t = tween.getValue() / 100;
        // Lerp gold (#f5a623) → white (#ffffff)
        const r = Math.floor(0xf5 + (0xff - 0xf5) * t);
        const g = Math.floor(0xa6 + (0xff - 0xa6) * t);
        const b = Math.floor(0x23 + (0xff - 0x23) * t);
        const hex = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
        title.setColor(hex);
      },
    });

    // Gentle float on title
    this.tweens.add({
      targets: title,
      y: 209,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    // ── "EXTREME" subtitle ────────────────────────────────────────────────────
    this.add.text(cx, 298, 'E X T R E M E', {
      fontFamily: FONT,
      fontSize: '28px',
      color: '#cc2222',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6);

    // ── Divider line ──────────────────────────────────────────────────────────
    const divGfx = this.add.graphics();
    divGfx.setDepth(5);
    divGfx.lineStyle(1, COLORS.gold, 0.4);
    divGfx.lineBetween(cx - 160, 336, cx + 160, 336);

    // ── Buttons ───────────────────────────────────────────────────────────────
    const btnW = 240;
    const btnH = 54;
    const btnStartY = 390;
    const btnSpacing = 68;
    let btnRow = 0;

    new Button(this, cx, btnStartY + btnSpacing * btnRow++, btnW, btnH, 'New Run', () => {
      this.scene.start('RunSelectScene');
    }, { color: COLORS.green, fontSize: 20 }).setDepth(10);

    if (hasSave()) {
      new Button(this, cx, btnStartY + btnSpacing * btnRow++, btnW, btnH, 'Continue', () => {
        const rs = loadRun();
        if (rs) this.scene.start('BlindSelectScene', { runState: rs });
      }, { color: COLORS.chipBlue, fontSize: 20 }).setDepth(10);
    }

    new Button(this, cx, btnStartY + btnSpacing * btnRow, btnW, btnH, 'Collection', () => {
      // TODO: collection scene
    }, { color: COLORS.panel, fontSize: 20 }).setDepth(10).setAlpha(0.6);

    // ── Version text ──────────────────────────────────────────────────────────
    this.add.text(12, GAME_HEIGHT - 18, 'v1.0.0', {
      fontFamily: FONT,
      fontSize: '12px',
      color: '#443355',
    }).setDepth(10);

    this.add.text(GAME_WIDTH - 12, GAME_HEIGHT - 18, 'Balatro Extreme Web', {
      fontFamily: FONT,
      fontSize: '12px',
      color: '#443355',
    }).setOrigin(1, 0).setDepth(10);
  }
}
