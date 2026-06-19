import Phaser from 'phaser';
import type { JokerInstance } from '../types/Joker.ts';
import { drawJokerFace } from '../rendering/JokerRenderer.ts';
import { TextureCache } from '../rendering/TextureCache.ts';
import { CARD_W, CARD_H, COLORS, ANIM, FONT, DEPTH } from '../config.ts';

function jokerTexKey(joker: JokerInstance): string {
  return `joker_${joker.id}_${joker.edition}`;
}

export class JokerView extends Phaser.GameObjects.Container {
  jokerData: JokerInstance;

  private cache: TextureCache;
  private jokerImage: Phaser.GameObjects.Image;
  private flashRect: Phaser.GameObjects.Graphics;
  private tooltip: Phaser.GameObjects.Container | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    joker: JokerInstance,
    cache: TextureCache
  ) {
    super(scene, x, y);
    this.jokerData = joker;
    this.cache = cache;

    this.flashRect = scene.add.graphics();
    this.add(this.flashRect);

    const texKey = this._buildTexture(joker);
    this.jokerImage = scene.add.image(0, 0, texKey);
    this.add(this.jokerImage);

    this._applyShader();

    this.setSize(CARD_W, CARD_H);
    this.setInteractive({ useHandCursor: true });
    this.setDepth(DEPTH.cards);

    this.on('pointerover', () => this._showTooltip());
    this.on('pointerout', () => this._hideTooltip());

    scene.add.existing(this);
  }

  private _buildTexture(joker: JokerInstance): string {
    const key = jokerTexKey(joker);
    this.cache.getOrCreate(key, CARD_W, CARD_H, (canvas) => {
      drawJokerFace(canvas, joker.id, joker.name, joker.rarity);
    });
    return key;
  }

  private _applyShader(): void {
    const edition = this.jokerData.edition;
    try {
      this.jokerImage.resetPipeline();
      if (edition === 'foil') {
        this.jokerImage.setPostPipeline('FoilPipeline');
      } else if (edition === 'holographic') {
        this.jokerImage.setPostPipeline('HoloPipeline');
      } else if (edition === 'polychrome') {
        this.jokerImage.setPostPipeline('PolychromePipeline');
      } else if (edition === 'negative') {
        this.jokerImage.setPostPipeline('NegativePipeline');
      }
    } catch {
      // Canvas renderer / shaders unavailable
    }
  }

  flash(): void {
    this.flashRect.clear();
    this.flashRect.fillStyle(COLORS.white, 0.75);
    this.flashRect.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 5);

    this.scene.tweens.add({
      targets: this.flashRect,
      alpha: 0,
      duration: ANIM.jokerFlashDuration,
      ease: 'Quad.Out',
      onComplete: () => {
        this.flashRect.clear();
        this.flashRect.setAlpha(1);
      },
    });
  }

  update(joker: JokerInstance): void {
    this.jokerData = joker;
    const texKey = this._buildTexture(joker);
    this.jokerImage.setTexture(texKey);
    this._applyShader();
    if (joker.isDisabled) {
      this.setAlpha(0.4);
    } else {
      this.setAlpha(1);
    }
  }

  private _showTooltip(): void {
    if (this.tooltip) return;

    const tooltipW = 200;
    const tooltipH = 80;
    const tx = this.x + CARD_W / 2 + 8;
    const ty = this.y - tooltipH / 2;

    const container = this.scene.add.container(tx, ty);
    container.setDepth(DEPTH.tooltip);

    const bg = this.scene.add.graphics();
    bg.fillStyle(COLORS.panelDark, 0.95);
    bg.fillRoundedRect(0, 0, tooltipW, tooltipH, 6);
    bg.lineStyle(1, COLORS.rarityCommon, 0.7);
    bg.strokeRoundedRect(0, 0, tooltipW, tooltipH, 6);
    container.add(bg);

    const nameText = this.scene.add.text(tooltipW / 2, 10, this.jokerData.name, {
      fontFamily: FONT,
      fontSize: '13px',
      color: '#ffffff',
    }).setOrigin(0.5, 0);
    container.add(nameText);

    const descText = this.scene.add.text(6, 30, this.jokerData.description, {
      fontFamily: FONT,
      fontSize: '10px',
      color: '#cccccc',
      wordWrap: { width: tooltipW - 12 },
    }).setOrigin(0, 0);
    container.add(descText);

    this.tooltip = container;
  }

  private _hideTooltip(): void {
    if (!this.tooltip) return;
    this.tooltip.destroy();
    this.tooltip = null;
  }

  destroy(fromScene?: boolean): void {
    this._hideTooltip();
    super.destroy(fromScene);
  }
}
