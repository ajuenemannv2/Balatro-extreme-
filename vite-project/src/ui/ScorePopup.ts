import Phaser from 'phaser';
import { FONT, ANIM, DEPTH } from '../config.ts';

export class ScorePopup extends Phaser.GameObjects.Container {

  static spawn(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    color: string,
    size: 'sm' | 'md' | 'lg' = 'md'
  ): ScorePopup {
    const popup = new ScorePopup(scene, x, y, text, color, size);
    scene.add.existing(popup);
    return popup;
  }

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    color: string,
    size: 'sm' | 'md' | 'lg' = 'md'
  ) {
    super(scene, x, y);

    const fontSizes = { sm: '16px', md: '22px', lg: '32px' };
    const strokeWidths = { sm: 2, md: 3, lg: 5 };
    const travelDist = size === 'lg' ? 90 : size === 'md' ? 70 : 50;

    // Glow backing rectangle — wider for large pops
    const bgGfx = scene.add.graphics();
    const padX = size === 'lg' ? 14 : 9;
    const padY = size === 'lg' ? 8 : 5;
    const approxW = text.length * (size === 'lg' ? 18 : size === 'md' ? 13 : 9);
    bgGfx.fillStyle(0x000000, 0.5);
    bgGfx.fillRoundedRect(-approxW / 2 - padX, -padY - 1, approxW + padX * 2, (size === 'lg' ? 36 : 26) + padY, 6);

    // Colored glow layer
    const hexColor = parseInt(color.replace('#', ''), 16);
    bgGfx.fillStyle(isNaN(hexColor) ? 0xffffff : hexColor, 0.12);
    bgGfx.fillRoundedRect(-approxW / 2 - padX - 2, -padY - 3, approxW + padX * 2 + 4, (size === 'lg' ? 36 : 26) + padY + 4, 7);

    this.add(bgGfx);

    // Main text
    const label = scene.add.text(0, 0, text, {
      fontFamily: FONT,
      fontSize: fontSizes[size],
      color,
      stroke: '#000000',
      strokeThickness: strokeWidths[size],
    }).setOrigin(0.5, 0.5);
    this.add(label);

    this.setAlpha(0);
    this.setDepth(DEPTH.popup);

    // Spawn: scale in from 0.5 + rise
    this.setScale(0.5);

    scene.tweens.add({
      targets: this,
      y: y - travelDist * 0.35,
      alpha: 1,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: ANIM.popupDuration * 0.25,
      ease: 'Back.Out',
      onComplete: () => {
        // Settle
        scene.tweens.add({
          targets: this,
          scaleX: 1.0,
          scaleY: 1.0,
          duration: 80,
          ease: 'Quad.Out',
          onComplete: () => {
            // Rise and fade out
            scene.tweens.add({
              targets: this,
              y: y - travelDist,
              alpha: 0,
              duration: ANIM.popupDuration * 0.75,
              delay: ANIM.popupDuration * 0.1,
              ease: 'Quad.In',
              onComplete: () => {
                this.destroy();
              },
            });
          },
        });
      },
    });
  }
}
