import Phaser from 'phaser';
import { COLORS, FONT } from '../config.ts';

export class Button extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private baseColor: number;
  private readonly btnW: number;
  private readonly btnH: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    labelText: string,
    onClick: () => void,
    options?: { color?: number; textColor?: number; fontSize?: number }
  ) {
    super(scene, x, y);

    this.btnW = width;
    this.btnH = height;
    this.baseColor = options?.color ?? COLORS.btnPurple;

    this.bg = scene.add.graphics();
    this.drawBg(this.baseColor);
    this.add(this.bg);

    const fontSize = options?.fontSize ?? 18;
    const textColor = options?.textColor !== undefined
      ? '#' + options.textColor.toString(16).padStart(6, '0')
      : '#ffffff';

    this.label = scene.add.text(0, 0, labelText, {
      fontFamily: FONT,
      fontSize: `${fontSize}px`,
      color: textColor,
    }).setOrigin(0.5, 0.5);
    this.add(this.label);

    this.setSize(width, height);
    this.setInteractive({ useHandCursor: true });

    this.on('pointerover', () => {
      this.drawBg(this.lighten(this.baseColor, 0.25));
    });
    this.on('pointerout', () => {
      this.drawBg(this.baseColor);
    });
    this.on('pointerdown', () => {
      this.drawBg(this.darken(this.baseColor, 0.2));
    });
    this.on('pointerup', () => {
      this.drawBg(this.baseColor);
      onClick();
    });

    scene.add.existing(this);
  }

  private drawBg(color: number): void {
    this.bg.clear();
    this.bg.fillStyle(color, 1);
    this.bg.fillRoundedRect(-this.btnW / 2, -this.btnH / 2, this.btnW, this.btnH, 4);
    this.bg.lineStyle(1, 0x000000, 0.3);
    this.bg.strokeRoundedRect(-this.btnW / 2, -this.btnH / 2, this.btnW, this.btnH, 4);
  }

  private lighten(color: number, amount: number): number {
    const r = Math.min(255, ((color >> 16) & 0xff) + Math.floor(255 * amount));
    const g = Math.min(255, ((color >> 8) & 0xff) + Math.floor(255 * amount));
    const b = Math.min(255, (color & 0xff) + Math.floor(255 * amount));
    return (r << 16) | (g << 8) | b;
  }

  private darken(color: number, amount: number): number {
    const r = Math.max(0, ((color >> 16) & 0xff) - Math.floor(255 * amount));
    const g = Math.max(0, ((color >> 8) & 0xff) - Math.floor(255 * amount));
    const b = Math.max(0, (color & 0xff) - Math.floor(255 * amount));
    return (r << 16) | (g << 8) | b;
  }

  setLabel(text: string): void {
    this.label.setText(text);
  }

  setEnabled(enabled: boolean): void {
    if (enabled) {
      this.setAlpha(1);
      this.setInteractive({ useHandCursor: true });
    } else {
      this.setAlpha(0.45);
      this.disableInteractive();
    }
  }
}
