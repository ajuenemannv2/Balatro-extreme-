import Phaser from 'phaser';
import type { PlayingCard } from '../types/Card.ts';
import { drawCardFace, drawCardBack } from '../rendering/CardRenderer.ts';
import { TextureCache } from '../rendering/TextureCache.ts';
import { CARD_W, CARD_H, ANIM, DEPTH } from '../config.ts';

function cardFaceKey(card: PlayingCard): string {
  return `card_face_${card.rank ?? 'stone'}_${card.suit ?? 'none'}_${card.enhancement}_${card.isDebuffed ? 'd' : 'n'}`;
}

const CARD_BACK_KEY = 'card_back_global';

export class CardView extends Phaser.GameObjects.Container {
  cardData: PlayingCard;

  private cache: TextureCache;
  private cardImage: Phaser.GameObjects.Image;
  private glowGfx: Phaser.GameObjects.Graphics;     // scoring burst glow
  private selectGfx: Phaser.GameObjects.Graphics;   // selection border
  private shadowGfx: Phaser.GameObjects.Graphics;   // drop shadow

  private _selected = false;
  private _faceUp = true;
  private _anchorY = 0;
  private _bobTween: Phaser.Tweens.Tween | null = null;
  private _pulseTween: Phaser.Tweens.Tween | null = null;
  private _borderTween: Phaser.Tweens.Tween | null = null;
  private _borderPhaseProxy = { phase: 0 };

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    cardData: PlayingCard,
    cache: TextureCache
  ) {
    super(scene, x, y);
    this.cardData = cardData;
    this.cache = cache;
    this._anchorY = y;

    // Drop shadow (bottommost)
    this.shadowGfx = scene.add.graphics();
    this.shadowGfx.fillStyle(0x000000, 0.3);
    this.shadowGfx.fillRoundedRect(-CARD_W / 2 + 3, -CARD_H / 2 + 5, CARD_W, CARD_H, 6);
    this.add(this.shadowGfx);

    // Scoring glow layer (below card image)
    this.glowGfx = scene.add.graphics();
    this.add(this.glowGfx);

    // Card image
    const texKey = this._buildTexture(cardData.faceUp);
    this.cardImage = scene.add.image(0, 0, texKey);
    this.add(this.cardImage);

    // Selection glow layer (above card image)
    this.selectGfx = scene.add.graphics();
    this.add(this.selectGfx);

    this._applyShader();

    this.setSize(CARD_W, CARD_H);
    this.setInteractive({ useHandCursor: true });
    this.setDepth(DEPTH.cards);

    // Hover: subtle lift + scale of the card image
    this.on('pointerover', () => {
      if (!this._selected) {
        scene.tweens.add({
          targets: this.cardImage,
          scaleX: 1.06,
          scaleY: 1.06,
          duration: 110,
          ease: 'Quad.Out',
        });
        // Lighten shadow
        this.shadowGfx.clear();
        this.shadowGfx.fillStyle(0x000000, 0.18);
        this.shadowGfx.fillRoundedRect(-CARD_W / 2 + 6, -CARD_H / 2 + 10, CARD_W, CARD_H, 6);
      }
    });

    this.on('pointerout', () => {
      if (!this._selected) {
        scene.tweens.add({
          targets: this.cardImage,
          scaleX: 1.0,
          scaleY: 1.0,
          duration: 110,
          ease: 'Quad.Out',
        });
        this._resetShadow();
      }
    });

    scene.add.existing(this);
  }

  private _resetShadow(): void {
    this.shadowGfx.clear();
    this.shadowGfx.fillStyle(0x000000, 0.3);
    this.shadowGfx.fillRoundedRect(-CARD_W / 2 + 3, -CARD_H / 2 + 5, CARD_W, CARD_H, 6);
  }

  private _buildTexture(faceUp: boolean): string {
    if (!faceUp) {
      this.cache.getOrCreate(CARD_BACK_KEY, CARD_W, CARD_H, (canvas) => {
        drawCardBack(canvas);
      });
      return CARD_BACK_KEY;
    }
    const key = cardFaceKey(this.cardData);
    this.cache.getOrCreate(key, CARD_W, CARD_H, (canvas) => {
      drawCardFace(
        canvas,
        this.cardData.rank,
        this.cardData.suit,
        this.cardData.enhancement,
        this.cardData.isDebuffed,
        false
      );
    });
    return key;
  }

  private _applyShader(): void {
    const edition = this.cardData.edition;
    try {
      this.cardImage.resetPipeline();
      if (edition === 'foil') {
        this.cardImage.setPostPipeline('FoilPipeline');
      } else if (edition === 'holographic') {
        this.cardImage.setPostPipeline('HoloPipeline');
      } else if (edition === 'polychrome') {
        this.cardImage.setPostPipeline('PolychromePipeline');
      } else if (edition === 'negative') {
        this.cardImage.setPostPipeline('NegativePipeline');
      }
    } catch {
      // Shaders not available (canvas renderer), silently skip
    }
  }

  setAnchorY(y: number): void {
    this._anchorY = y;
  }

  setSelected(selected: boolean): void {
    if (this._selected === selected) return;
    this._selected = selected;

    // Stop existing bob, pulse, and border tween
    if (this._bobTween) {
      this._bobTween.stop();
      this._bobTween = null;
    }
    if (this._pulseTween) {
      this._pulseTween.stop();
      this._pulseTween = null;
    }
    if (this._borderTween) {
      this._borderTween.stop();
      this._borderTween = null;
    }
    // Kill any Y tweens on this container
    this.scene.tweens.killTweensOf(this);

    if (selected) {
      // Snap anchor from current position before moving
      this._anchorY = this.y;

      // Initial scale pop: burst to 1.15 then settle into the lift
      this.scene.tweens.add({
        targets: this,
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 80,
        ease: 'Quad.Out',
        onComplete: () => {
          // Lift + scale with a snappy spring feel
          this.scene.tweens.add({
            targets: this,
            y: this._anchorY - 26,
            scaleX: 1.08,
            scaleY: 1.08,
            duration: 180,
            ease: 'Back.Out',
            onComplete: () => {
              // Gentle perpetual bob with slight rotation wobble
              this._bobTween = this.scene.tweens.add({
                targets: this,
                y: this.y - 6,
                angle: 1.5,
                duration: 900 + Math.random() * 200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.InOut',
              });
            },
          });
        },
      });

      // Bright selected border — smoothly cycles between blue and teal
      this._borderPhaseProxy.phase = 0;
      this._drawSelectBorder(0);
      this._borderTween = this.scene.tweens.add({
        targets: this._borderPhaseProxy,
        phase: 1,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
        onUpdate: () => {
          if (this._selected) this._drawSelectBorder(this._borderPhaseProxy.phase);
        },
      });

      // Pulse the selection glow — starts invisible, pulses up to soft visibility
      this.selectGfx.setAlpha(0);
      this._pulseTween = this.scene.tweens.add({
        targets: this.selectGfx,
        alpha: 0.35,
        duration: 750,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });

      // Elevated shadow
      this.shadowGfx.clear();
      this.shadowGfx.fillStyle(0x000000, 0.45);
      this.shadowGfx.fillRoundedRect(-CARD_W / 2 + 5, -CARD_H / 2 + 12, CARD_W, CARD_H, 6);

      // Reset hover scale
      this.cardImage.setScale(1.0);

      this.setDepth(DEPTH.cardSelected);
    } else {
      // Clear selection visuals
      this.selectGfx.clear();
      this.selectGfx.setAlpha(1);

      // Return to anchor, reset rotation
      this.scene.tweens.add({
        targets: this,
        y: this._anchorY,
        scaleX: 1.0,
        scaleY: 1.0,
        angle: 0,
        duration: 150,
        ease: 'Quad.Out',
      });

      this._resetShadow();
      this.setDepth(DEPTH.cards);
    }
  }

  private _drawSelectBorder(phase = 0): void {
    this.selectGfx.clear();

    // Smooth RGB lerp: chipBlue (0x4a,0x90,0xd9) → teal (0x44,0xff,0xcc)
    const r = Math.round(0x4a + (0x44 - 0x4a) * phase);
    const g = Math.round(0x90 + (0xff - 0x90) * phase);
    const b = Math.round(0xd9 + (0xcc - 0xd9) * phase);
    const borderColor = (r << 16) | (g << 8) | b;

    // Accent: lighter version — (0x88,0xcc,0xff) → (0x99,0xff,0xee)
    const ar = Math.round(0x88 + (0x99 - 0x88) * phase);
    const ag = Math.round(0xcc + (0xff - 0xcc) * phase);
    const ab = Math.round(0xff + (0xee - 0xff) * phase);
    const accentColor = (ar << 16) | (ag << 8) | ab;

    const hw = CARD_W / 2;
    const hh = CARD_H / 2;

    // Wide outer glow ring
    this.selectGfx.lineStyle(8, borderColor, 0.22);
    this.selectGfx.strokeRoundedRect(-hw - 5, -hh - 5, CARD_W + 10, CARD_H + 10, 9);

    // Medium ring
    this.selectGfx.lineStyle(3, borderColor, 0.7);
    this.selectGfx.strokeRoundedRect(-hw - 2, -hh - 2, CARD_W + 4, CARD_H + 4, 8);

    // Inner bright ring
    this.selectGfx.lineStyle(1.5, accentColor, 0.9);
    this.selectGfx.strokeRoundedRect(-hw, -hh, CARD_W, CARD_H, 6);

    // Corner diamond accents
    const corners: [number, number][] = [
      [-hw - 2, -hh - 2],
      [ hw + 2, -hh - 2],
      [ hw + 2,  hh + 2],
      [-hw - 2,  hh + 2],
    ];
    for (const [cx, cy] of corners) {
      this.selectGfx.fillStyle(accentColor, 1);
      this.selectGfx.fillRect(cx - 3, cy - 1, 6, 2);
      this.selectGfx.fillRect(cx - 1, cy - 3, 2, 6);
    }
  }

  get isSelected(): boolean {
    return this._selected;
  }

  setFaceUp(faceUp: boolean): void {
    if (this._faceUp === faceUp) return;
    this._faceUp = faceUp;
    this.refreshTexture();
  }

  refreshTexture(): void {
    const texKey = this._buildTexture(this._faceUp);
    this.cardImage.setTexture(texKey);
  }

  async flip(): Promise<void> {
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this.cardImage,
        scaleX: 0,
        duration: ANIM.dealDuration / 2,
        ease: 'Quad.In',
        onComplete: () => {
          this._faceUp = !this._faceUp;
          this.refreshTexture();
          this.scene.tweens.add({
            targets: this.cardImage,
            scaleX: 1,
            duration: ANIM.dealDuration / 2,
            ease: 'Quad.Out',
            onComplete: () => resolve(),
          });
        },
      });
    });
  }

  // Called when this card is scored — ring flash around edge + scale bounce
  glow(color: number): void {
    // Scale bounce
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.18,
      scaleY: 1.18,
      duration: 100,
      ease: 'Quad.Out',
      yoyo: true,
      onYoyo: () => {
        this.scene.tweens.add({
          targets: this,
          scaleX: this._selected ? 1.08 : 1.0,
          scaleY: this._selected ? 1.08 : 1.0,
          duration: 90,
          ease: 'Quad.Out',
        });
      },
    });

    // Glow RING around card edge — no fill behind the card face
    this.glowGfx.clear();
    this.glowGfx.setAlpha(1);
    this.glowGfx.lineStyle(6, color, 0.85);
    this.glowGfx.strokeRoundedRect(-CARD_W / 2 - 4, -CARD_H / 2 - 4, CARD_W + 8, CARD_H + 8, 9);
    this.glowGfx.lineStyle(14, color, 0.22);
    this.glowGfx.strokeRoundedRect(-CARD_W / 2 - 9, -CARD_H / 2 - 9, CARD_W + 18, CARD_H + 18, 13);

    this.scene.tweens.add({
      targets: this.glowGfx,
      alpha: 0,
      duration: 600,
      ease: 'Quad.Out',
      onComplete: () => {
        this.glowGfx.clear();
        this.glowGfx.setAlpha(1);
      },
    });
  }

  // Brief flash — used for joker activate hints
  flash(): void {
    this.scene.tweens.add({
      targets: this.cardImage,
      alpha: 0.3,
      duration: 80,
      yoyo: true,
      repeat: 2,
      ease: 'Linear',
    });
  }
}
