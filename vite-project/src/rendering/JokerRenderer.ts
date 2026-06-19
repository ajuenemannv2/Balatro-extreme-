import type { JokerRarity } from '../types/Joker.ts';
import { CARD_RADIUS } from '../config.ts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function rarityBorderColor(rarity: JokerRarity): string {
  switch (rarity) {
    case 'Common':    return '#888888';
    case 'Uncommon':  return '#4488ff';
    case 'Rare':      return '#ff4444';
    case 'Legendary': return '#ffaa00';
  }
}

function rarityBgColor(rarity: JokerRarity): string {
  switch (rarity) {
    case 'Common':    return '#2a2a2a';
    case 'Uncommon':  return '#0a1a3a';
    case 'Rare':      return '#2a0a0a';
    case 'Legendary': return '#1a1500';
  }
}

function rarityStarCount(rarity: JokerRarity): number {
  switch (rarity) {
    case 'Common':    return 1;
    case 'Uncommon':  return 2;
    case 'Rare':      return 3;
    case 'Legendary': return 4;
  }
}

/** Simple deterministic hash: returns 0–7 */
function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h % 8;
}

// ---------------------------------------------------------------------------
// Symbol drawers
// ---------------------------------------------------------------------------

type SymbolFn = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
) => void;

function drawCircleSymbol(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
): void {
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.42, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.1;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawTriangleSymbol(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
): void {
  const r = size * 0.45;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const angle = (Math.PI * 2 * i) / 3 - Math.PI / 2;
    const px = cx + r * Math.cos(angle);
    const py = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawDiamondSymbol(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
): void {
  const hw = size * 0.38;
  const hh = size * 0.48;
  ctx.beginPath();
  ctx.moveTo(cx, cy - hh);
  ctx.lineTo(cx + hw, cy);
  ctx.lineTo(cx, cy + hh);
  ctx.lineTo(cx - hw, cy);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawStarSymbol(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
): void {
  const outerR = size * 0.46;
  const innerR = size * 0.19;
  const points = 5;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI * i) / points - Math.PI / 2;
    const px = cx + r * Math.cos(angle);
    const py = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawLightningSymbol(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
): void {
  const h = size * 0.9;
  const w = size * 0.45;
  // Zigzag bolt
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.1, cy - h * 0.5);
  ctx.lineTo(cx - w * 0.15, cy + h * 0.02);
  ctx.lineTo(cx + w * 0.18, cy + h * 0.02);
  ctx.lineTo(cx - w * 0.1, cy + h * 0.5);
  ctx.lineTo(cx + w * 0.4, cy - h * 0.08);
  ctx.lineTo(cx - w * 0.02, cy - h * 0.08);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawCrownSymbol(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
): void {
  const hw = size * 0.44;
  const baseY = cy + size * 0.28;
  const baseH = size * 0.22;
  const topY = cy - size * 0.28;

  // Base bar
  ctx.fillStyle = color;
  ctx.fillRect(cx - hw, baseY, hw * 2, baseH);

  // Three prongs: left, center, right
  const prongsY = baseY;
  const smallR = size * 0.14;

  // Left prong
  ctx.beginPath();
  ctx.arc(cx - hw * 0.65, prongsY - smallR, smallR, 0, Math.PI, true);
  ctx.lineTo(cx - hw * 0.65 - smallR, prongsY);
  ctx.lineTo(cx - hw * 0.65 + smallR, prongsY);
  ctx.fill();

  // Center prong (taller)
  const bigR = size * 0.17;
  ctx.beginPath();
  ctx.arc(cx, topY + bigR, bigR, 0, Math.PI, true);
  ctx.lineTo(cx - bigR, prongsY);
  ctx.lineTo(cx + bigR, prongsY);
  ctx.fill();
  ctx.fillRect(cx - bigR, topY + bigR, bigR * 2, prongsY - (topY + bigR));

  // Right prong
  ctx.beginPath();
  ctx.arc(cx + hw * 0.65, prongsY - smallR, smallR, 0, Math.PI, true);
  ctx.lineTo(cx + hw * 0.65 - smallR, prongsY);
  ctx.lineTo(cx + hw * 0.65 + smallR, prongsY);
  ctx.fill();
}

function drawEyeSymbol(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
): void {
  const hw = size * 0.46;
  const hh = size * 0.22;

  // Eye outline
  ctx.beginPath();
  ctx.moveTo(cx - hw, cy);
  ctx.quadraticCurveTo(cx, cy - hh * 2, cx + hw, cy);
  ctx.quadraticCurveTo(cx, cy + hh * 2, cx - hw, cy);
  ctx.closePath();
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.08;
  ctx.stroke();

  // Iris
  ctx.beginPath();
  ctx.arc(cx, cy, hh * 0.75, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // Pupil
  ctx.beginPath();
  ctx.arc(cx, cy, hh * 0.32, 0, Math.PI * 2);
  ctx.fillStyle = rarityBgColor('Common');
  ctx.fill();
}

function drawSpiralSymbol(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.07;
  ctx.lineCap = 'round';
  ctx.beginPath();

  const turns = 3;
  const steps = 80;
  const maxR = size * 0.44;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * Math.PI * 2 * turns - Math.PI / 2;
    const r = t * maxR;
    const px = cx + r * Math.cos(angle);
    const py = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

const SYMBOL_FNS: SymbolFn[] = [
  drawCircleSymbol,
  drawTriangleSymbol,
  drawDiamondSymbol,
  drawStarSymbol,
  drawLightningSymbol,
  drawCrownSymbol,
  drawEyeSymbol,
  drawSpiralSymbol,
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function drawJokerFace(
  canvas: HTMLCanvasElement,
  jokerId: string,
  jokerName: string,
  rarity: JokerRarity
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const borderColor = rarityBorderColor(rarity);
  const bgColor = rarityBgColor(rarity);

  // Background
  roundedRect(ctx, 0, 0, W, H, CARD_RADIUS);
  ctx.fillStyle = bgColor;
  ctx.fill();

  // Rarity border
  roundedRect(ctx, 1, 1, W - 2, H - 2, CARD_RADIUS);
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Clip to card
  roundedRect(ctx, 0, 0, W, H, CARD_RADIUS);
  ctx.save();
  ctx.clip();

  // Subtle inner glow from border color
  const grad = ctx.createRadialGradient(W / 2, H / 2, H * 0.1, W / 2, H / 2, H * 0.75);
  grad.addColorStop(0, 'rgba(255,255,255,0.03)');
  grad.addColorStop(1, borderColor + '22');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Stars at top
  const starCount = rarityStarCount(rarity);
  const starSize = 6;
  const starSpacing = 10;
  const starTotalW = starCount * starSpacing - (starSpacing - starSize);
  const starStartX = W / 2 - starTotalW / 2 + starSize / 2;
  const starY = 9;

  ctx.fillStyle = borderColor;
  for (let s = 0; s < starCount; s++) {
    const sx = starStartX + s * starSpacing;
    drawStar5(ctx, sx, starY, starSize * 0.45, borderColor);
  }

  // Symbol
  const seed = hashId(jokerId);
  const symbolFn = SYMBOL_FNS[seed];
  const cx = W / 2;
  const cy = H * 0.48;
  const symbolSize = Math.min(W, H) * 0.46;

  symbolFn(ctx, cx, cy, symbolSize, borderColor);

  // Name at bottom
  const nameAreaY = H - 18;
  ctx.fillStyle = '#ffffff';
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Truncate name if needed
  let displayName = jokerName;
  const maxWidth = W - 6;
  while (ctx.measureText(displayName).width > maxWidth && displayName.length > 0) {
    displayName = displayName.slice(0, -1);
  }
  if (displayName.length < jokerName.length) {
    displayName = displayName.slice(0, -1) + '…';
  }

  ctx.fillText(displayName, cx, nameAreaY);

  ctx.restore();
}

function drawStar5(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string
): void {
  const inner = r * 0.4;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : inner;
    const angle = (Math.PI * i) / 5 - Math.PI / 2;
    const px = cx + radius * Math.cos(angle);
    const py = cy + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}
