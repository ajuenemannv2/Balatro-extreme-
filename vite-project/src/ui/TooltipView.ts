import Phaser from 'phaser';
import { COLORS, FONT } from '../config.ts';

const DEPTH_TOOLTIP = 60;

let activeTooltip: Phaser.GameObjects.Container | null = null;

export function showTooltip(
  scene: Phaser.Scene,
  x: number,
  y: number,
  title: string,
  body: string,
): void {
  hideTooltip();

  const padding = 10;
  const maxW = 200;

  const titleObj = scene.add.text(0, 0, title, {
    fontFamily: FONT,
    fontSize: '12px',
    color: '#ffffff',
    fontStyle: 'bold',
    wordWrap: { width: maxW - padding * 2 },
  });
  const bodyObj = scene.add.text(0, titleObj.height + 4, body, {
    fontFamily: FONT,
    fontSize: '10px',
    color: '#cccccc',
    wordWrap: { width: maxW - padding * 2 },
  });

  const w = maxW;
  const h = titleObj.height + (body ? bodyObj.height + 4 : 0) + padding * 2;

  const bg = scene.add.graphics();
  bg.fillStyle(COLORS.panelDark ?? 0x180f27, 0.95);
  bg.fillRoundedRect(0, 0, w, h, 6);
  bg.lineStyle(1, 0x6644aa, 0.8);
  bg.strokeRoundedRect(0, 0, w, h, 6);

  titleObj.setPosition(padding, padding);
  bodyObj.setPosition(padding, padding + titleObj.height + 4);

  const container = scene.add.container(0, 0, [bg, titleObj, ...(body ? [bodyObj] : [])]);

  // Position: keep on screen
  const cam = scene.cameras.main;
  let cx = x;
  let cy = y - h - 8;
  if (cx + w > cam.scrollX + cam.width) cx = cam.scrollX + cam.width - w - 4;
  if (cx < cam.scrollX) cx = cam.scrollX + 4;
  if (cy < cam.scrollY) cy = y + 8;

  container.setPosition(cx, cy);
  container.setDepth(DEPTH_TOOLTIP);

  activeTooltip = container;
}

export function hideTooltip(): void {
  if (activeTooltip) {
    activeTooltip.destroy();
    activeTooltip = null;
  }
}
