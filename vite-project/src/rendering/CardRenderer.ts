import type { Suit, Enhancement } from '../types/Card.ts';
import { drawSuit, getSuitColor } from './SuitRenderer.ts';
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

function getEnhancementColor(enhancement: Enhancement): string | null {
  switch (enhancement) {
    case 'bonus':  return '#fff5cc';
    case 'mult':   return '#ffe5e5';
    case 'glass':  return '#e0eeff';
    case 'steel':  return '#e8e8e8';
    case 'stone':  return '#cccccc';
    case 'gold':   return '#ffe066';
    case 'lucky':  return '#e8ffe8';
    case 'wild':   return null; // handled specially
    default:       return '#f0e6d3';
  }
}

// ---------------------------------------------------------------------------
// Pip positions
// ---------------------------------------------------------------------------

// Grid positions: col in {0=left, 1=center, 2=right}, row in {0..4 top..bottom}
// Returns [colFraction, rowFraction] each in [0,1]
type PipPos = [number, number];

const PIP_LAYOUTS: Record<string, PipPos[]> = {
  '2':  [[0.5, 0.18], [0.5, 0.82]],
  '3':  [[0.5, 0.18], [0.5, 0.5], [0.5, 0.82]],
  '4':  [[0.25, 0.2], [0.75, 0.2], [0.25, 0.8], [0.75, 0.8]],
  '5':  [[0.25, 0.2], [0.75, 0.2], [0.5, 0.5], [0.25, 0.8], [0.75, 0.8]],
  '6':  [[0.25, 0.2], [0.75, 0.2], [0.25, 0.5], [0.75, 0.5], [0.25, 0.8], [0.75, 0.8]],
  '7':  [[0.25, 0.2], [0.75, 0.2], [0.5, 0.35], [0.25, 0.5], [0.75, 0.5], [0.25, 0.8], [0.75, 0.8]],
  '8':  [[0.25, 0.2], [0.75, 0.2], [0.5, 0.33], [0.25, 0.5], [0.75, 0.5], [0.5, 0.67], [0.25, 0.8], [0.75, 0.8]],
  '9':  [[0.25, 0.18], [0.75, 0.18], [0.25, 0.38], [0.75, 0.38], [0.5, 0.5], [0.25, 0.62], [0.75, 0.62], [0.25, 0.82], [0.75, 0.82]],
  '10': [[0.25, 0.15], [0.75, 0.15], [0.5, 0.28], [0.25, 0.38], [0.75, 0.38], [0.25, 0.62], [0.75, 0.62], [0.5, 0.72], [0.25, 0.85], [0.75, 0.85]],
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function drawCardFace(
  canvas: HTMLCanvasElement,
  rank: string | null,
  suit: Suit | null,
  enhancement: Enhancement,
  isDebuffed: boolean,
  isSelected: boolean
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  // --- Background ---
  roundedRect(ctx, 0, 0, W, H, CARD_RADIUS);
  ctx.save();
  ctx.clip();

  if (enhancement === 'wild') {
    // Rainbow gradient background
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0,    '#ffcccc');
    grad.addColorStop(0.17, '#ffd9b3');
    grad.addColorStop(0.33, '#ffffb3');
    grad.addColorStop(0.5,  '#ccffcc');
    grad.addColorStop(0.67, '#b3e0ff');
    grad.addColorStop(0.83, '#d9b3ff');
    grad.addColorStop(1,    '#ffcccc');
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = getEnhancementColor(enhancement) ?? '#f0e6d3';
  }
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // --- Selection border ---
  if (isSelected) {
    roundedRect(ctx, 1, 1, W - 2, H - 2, CARD_RADIUS);
    ctx.strokeStyle = '#4a90d9';
    ctx.lineWidth = 3;
    ctx.stroke();
  } else {
    // Subtle card outline
    roundedRect(ctx, 0.5, 0.5, W - 1, H - 1, CARD_RADIUS);
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Stone card: no rank/suit decoration
  if (rank === null) {
    drawStoneContent(ctx, W, H);
    applyDebuff(ctx, W, H, isDebuffed);
    return;
  }

  const suitColor = suit ? getSuitColor(suit) : '#1a1a1a';

  // --- Top-left corner: rank ---
  ctx.fillStyle = suitColor;
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(rank, 6, 5);

  // --- Top-left corner: small suit ---
  if (suit) {
    drawSuit(ctx, suit, 10, 22, 10);
  }

  // --- Bottom-right corner (rotated 180°) ---
  ctx.save();
  ctx.translate(W, H);
  ctx.rotate(Math.PI);
  ctx.fillStyle = suitColor;
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(rank, 6, 5);
  if (suit) {
    drawSuit(ctx, suit, 10, 22, 10);
  }
  ctx.restore();

  // --- Center content ---
  const cx = W / 2;
  const cy = H / 2;

  if (rank === 'A' && suit) {
    drawSuit(ctx, suit, cx, cy, 40);
  } else if (rank === 'J' || rank === 'Q' || rank === 'K') {
    drawFaceCard(ctx, rank, suit, cx, cy, suitColor);
  } else if (PIP_LAYOUTS[rank] && suit) {
    drawPips(ctx, suit, rank, W, H);
  }

  applyDebuff(ctx, W, H, isDebuffed);
}

export function drawCardBack(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  // Background
  roundedRect(ctx, 0, 0, W, H, CARD_RADIUS);
  ctx.fillStyle = '#1a3a6b';
  ctx.fill();

  // Clip to card shape
  roundedRect(ctx, 0, 0, W, H, CARD_RADIUS);
  ctx.save();
  ctx.clip();

  // Crosshatch pattern at 45° and -45°
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 0.7;
  const spacing = 6;
  const diag = Math.sqrt(W * W + H * H);
  const steps = Math.ceil(diag / spacing) * 2;

  // 45° lines
  ctx.beginPath();
  for (let i = -steps; i <= steps; i++) {
    const offset = i * spacing;
    ctx.moveTo(-diag + offset, -diag);
    ctx.lineTo(diag + offset, diag);
  }
  ctx.stroke();

  // -45° lines
  ctx.beginPath();
  for (let i = -steps; i <= steps; i++) {
    const offset = i * spacing;
    ctx.moveTo(-diag + offset, diag);
    ctx.lineTo(diag + offset, -diag);
  }
  ctx.stroke();
  ctx.restore();

  // Center diamond ornament
  const cx = W / 2;
  const cy = H / 2;
  const dm = Math.min(W, H) * 0.28;

  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 1.5;

  // Outer diamond
  ctx.beginPath();
  ctx.moveTo(cx, cy - dm);
  ctx.lineTo(cx + dm * 0.6, cy);
  ctx.lineTo(cx, cy + dm);
  ctx.lineTo(cx - dm * 0.6, cy);
  ctx.closePath();
  ctx.stroke();

  // Inner diamond
  const dm2 = dm * 0.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy - dm2);
  ctx.lineTo(cx + dm2 * 0.6, cy);
  ctx.lineTo(cx, cy + dm2);
  ctx.lineTo(cx - dm2 * 0.6, cy);
  ctx.closePath();
  ctx.stroke();

  // Cross lines
  ctx.beginPath();
  ctx.moveTo(cx, cy - dm);
  ctx.lineTo(cx, cy + dm);
  ctx.moveTo(cx - dm * 0.6, cy);
  ctx.lineTo(cx + dm * 0.6, cy);
  ctx.stroke();

  ctx.restore();

  // Outline
  roundedRect(ctx, 0.5, 0.5, W - 1, H - 1, CARD_RADIUS);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function drawStoneContent(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number
): void {
  const cx = W / 2;
  const cy = H / 2;

  // Gray rounded rect in center
  const rw = W * 0.55;
  const rh = H * 0.42;
  roundedRect(ctx, cx - rw / 2, cy - rh / 2, rw, rh, 6);
  ctx.fillStyle = '#aaaaaa';
  ctx.fill();
  ctx.strokeStyle = '#888888';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Concentric rings
  ctx.strokeStyle = '#999999';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 3; i++) {
    const scale = 0.65 + i * 0.12;
    const rw2 = rw * scale * 0.45;
    const rh2 = rh * scale * 0.45;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rw2, rh2, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawFaceCard(
  ctx: CanvasRenderingContext2D,
  rank: string,
  suit: Suit | null,
  cx: number,
  cy: number,
  suitColor: string
): void {
  // Large centered letter
  ctx.fillStyle = suitColor;
  ctx.font = `bold 36px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(rank, cx, cy - 4);

  // Suit symbol overlay under letter
  if (suit) {
    drawSuit(ctx, suit, cx, cy + 20, 16);
  }
}

function drawPips(
  ctx: CanvasRenderingContext2D,
  suit: Suit,
  rank: string,
  W: number,
  H: number
): void {
  const positions = PIP_LAYOUTS[rank];
  if (!positions) return;

  // Pip area inset from corners (top/bottom corners reserved for rank)
  const padX = 8;
  const padY = 32; // leave room for corner rank/suit
  const areaW = W - padX * 2;
  const areaH = H - padY * 2;

  const pipSize = Math.max(8, Math.min(14, 110 / positions.length));

  for (const [fx, fy] of positions) {
    const px = padX + fx * areaW;
    const py = padY + fy * areaH;
    drawSuit(ctx, suit, px, py, pipSize);
  }
}

function applyDebuff(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  isDebuffed: boolean
): void {
  if (!isDebuffed) return;

  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = '#cc0000';

  // Diagonal X pattern: two crossing bands
  ctx.save();
  ctx.beginPath();
  roundedRect(ctx, 0, 0, W, H, CARD_RADIUS);
  ctx.clip();

  ctx.lineWidth = W * 0.18;
  ctx.strokeStyle = '#cc0000';
  ctx.lineCap = 'round';

  // First diagonal
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(W, H);
  ctx.stroke();

  // Second diagonal
  ctx.beginPath();
  ctx.moveTo(W, 0);
  ctx.lineTo(0, H);
  ctx.stroke();

  ctx.restore();
  ctx.restore();
}
