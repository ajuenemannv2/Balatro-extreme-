import Phaser from 'phaser';
import { FONT, ANIM } from '../config.ts';

export class ScorePopup extends Phaser.GameObjects.Text {
  static spawn(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    color: string
  ): ScorePopup {
    const popup = new ScorePopup(scene, x, y, text, {
      fontFamily: FONT,
      fontSize: '22px',
      color,
      stroke: '#000000',
      strokeThickness: 3,
    });
    popup.setOrigin(0.5, 0.5);
    popup.setAlpha(0);
    popup.setDepth(50);
    scene.add.existing(popup);

    scene.tweens.add({
      targets: popup,
      y: y - 60,
      alpha: { from: 0, to: 1 },
      duration: ANIM.popupDuration * 0.3,
      ease: 'Quad.Out',
      onComplete: () => {
        scene.tweens.add({
          targets: popup,
          alpha: 0,
          duration: ANIM.popupDuration * 0.7,
          delay: ANIM.popupDuration * 0.15,
          ease: 'Quad.In',
          onComplete: () => {
            popup.destroy();
          },
        });
      },
    });

    return popup;
  }
}
