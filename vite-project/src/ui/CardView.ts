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
  private glowGraphics: Phaser.GameObjects.Graphics;
  private _selected = false;
  private _faceUp = true;

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

    this.glowGraphics = scene.add.graphics();
    this.add(this.glowGraphics);

    const texKey = this._buildTexture(cardData.faceUp);
    this.cardImage = scene.add.image(0, 0, texKey);
    this.add(this.cardImage);

    this._applyShader();

    this.setSize(CARD_W, CARD_H);
    this.setInteractive({ useHandCursor: true });
    this.setDepth(DEPTH.cards);

    scene.add.existing(this);
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

  setSelected(selected: boolean): void {
    if (this._selected === selected) return;
    this._selected = selected;
    this.scene.tweens.add({
      targets: this,
      y: this.y + (selected ? -20 : 20),
      duration: 120,
      ease: 'Quad.Out',
    });
    this.setDepth(selected ? DEPTH.cardSelected : DEPTH.cards);
    this.refreshTexture();
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

  glow(color: number): void {
    this.glowGraphics.clear();
    this.glowGraphics.fillStyle(color, 0.55);
    this.glowGraphics.fillRoundedRect(
      -CARD_W / 2 - 5,
      -CARD_H / 2 - 5,
      CARD_W + 10,
      CARD_H + 10,
      8
    );

    this.scene.tweens.add({
      targets: this.glowGraphics,
      alpha: 0,
      duration: ANIM.popupDuration * 0.6,
      ease: 'Quad.Out',
      onComplete: () => {
        this.glowGraphics.clear();
        this.glowGraphics.setAlpha(1);
      },
    });
  }
}
