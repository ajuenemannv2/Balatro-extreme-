import type { Suit } from '../types/Card.ts';

export function getSuitColor(suit: Suit): string {
  return suit === 'Hearts' || suit === 'Diamonds' ? '#d63030' : '#1a1a1a';
}

export function drawSuit(
  ctx: CanvasRenderingContext2D,
  suit: Suit,
  x: number,
  y: number,
  size: number
): void {
  ctx.save();
  ctx.fillStyle = getSuitColor(suit);
  ctx.strokeStyle = getSuitColor(suit);
  ctx.lineWidth = size * 0.08;

  switch (suit) {
    case 'Spades':
      drawSpade(ctx, x, y, size);
      break;
    case 'Hearts':
      drawHeart(ctx, x, y, size);
      break;
    case 'Clubs':
      drawClub(ctx, x, y, size);
      break;
    case 'Diamonds':
      drawDiamond(ctx, x, y, size);
      break;
  }

  ctx.restore();
}

function drawSpade(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
): void {
  const half = size / 2;
  const s = size / 14; // base unit

  ctx.beginPath();
  // Start at bottom tip
  ctx.moveTo(cx, cy - half * 0.95);
  // Left arc going down and around
  ctx.bezierCurveTo(
    cx - half * 1.1, cy - half * 0.3,
    cx - half * 1.1, cy + half * 0.2,
    cx - half * 0.4, cy + half * 0.25
  );
  // Right arc going up to tip
  ctx.bezierCurveTo(
    cx - half * 0.0, cy + half * 0.35,
    cx - half * 0.0, cy + half * 0.05,
    cx, cy - half * 0.95
  );
  ctx.moveTo(cx, cy - half * 0.95);
  ctx.bezierCurveTo(
    cx + half * 1.1, cy - half * 0.3,
    cx + half * 1.1, cy + half * 0.2,
    cx + half * 0.4, cy + half * 0.25
  );
  ctx.bezierCurveTo(
    cx + half * 0.0, cy + half * 0.35,
    cx + half * 0.0, cy + half * 0.05,
    cx, cy - half * 0.95
  );
  ctx.fill();

  // Left lower lobe
  ctx.beginPath();
  ctx.arc(cx - half * 0.3, cy + half * 0.2, half * 0.28, 0, Math.PI * 2);
  ctx.fill();

  // Right lower lobe
  ctx.beginPath();
  ctx.arc(cx + half * 0.3, cy + half * 0.2, half * 0.28, 0, Math.PI * 2);
  ctx.fill();

  // Stem
  const stemW = s * 1.2;
  const stemH = size * 0.28;
  ctx.fillRect(cx - stemW / 2, cy + half * 0.35, stemW, stemH);

  // Stem base flare
  ctx.beginPath();
  ctx.moveTo(cx - stemW * 2.2, cy + half * 0.35 + stemH);
  ctx.lineTo(cx + stemW * 2.2, cy + half * 0.35 + stemH);
  ctx.lineTo(cx + stemW * 1.5, cy + half * 0.35 + stemH - s * 0.5);
  ctx.lineTo(cx - stemW * 1.5, cy + half * 0.35 + stemH - s * 0.5);
  ctx.closePath();
  ctx.fill();
}

function drawHeart(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
): void {
  const half = size / 2;
  const r = half * 0.52;
  const topY = cy - half * 0.35;
  const leftX = cx - half * 0.5;
  const rightX = cx + half * 0.5;

  ctx.beginPath();
  // Start at the bottom tip
  ctx.moveTo(cx, cy + half * 0.85);
  // Left side bezier up to left circle tangent
  ctx.bezierCurveTo(
    cx - half * 1.1, cy + half * 0.1,
    cx - half * 1.1, cy - half * 0.85,
    leftX, topY
  );
  // Left circle arc (top-left lobe)
  ctx.arc(leftX, topY, r, Math.PI, 0, false);
  // Right circle arc (top-right lobe)
  ctx.arc(rightX, topY, r, Math.PI, 0, false);
  // Right side bezier down to tip
  ctx.bezierCurveTo(
    cx + half * 1.1, cy - half * 0.85,
    cx + half * 1.1, cy + half * 0.1,
    cx, cy + half * 0.85
  );
  ctx.closePath();
  ctx.fill();
}

function drawClub(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
): void {
  const half = size / 2;
  const r = half * 0.38;
  const s = size / 14;

  // Top circle
  ctx.beginPath();
  ctx.arc(cx, cy - half * 0.35, r, 0, Math.PI * 2);
  ctx.fill();

  // Bottom-left circle
  ctx.beginPath();
  ctx.arc(cx - half * 0.42, cy + half * 0.15, r, 0, Math.PI * 2);
  ctx.fill();

  // Bottom-right circle
  ctx.beginPath();
  ctx.arc(cx + half * 0.42, cy + half * 0.15, r, 0, Math.PI * 2);
  ctx.fill();

  // Stem
  const stemW = s * 1.3;
  const stemH = size * 0.26;
  ctx.fillRect(cx - stemW / 2, cy + half * 0.38, stemW, stemH);

  // Stem base flare
  ctx.beginPath();
  ctx.moveTo(cx - stemW * 2.2, cy + half * 0.38 + stemH);
  ctx.lineTo(cx + stemW * 2.2, cy + half * 0.38 + stemH);
  ctx.lineTo(cx + stemW * 1.5, cy + half * 0.38 + stemH - s * 0.5);
  ctx.lineTo(cx - stemW * 1.5, cy + half * 0.38 + stemH - s * 0.5);
  ctx.closePath();
  ctx.fill();
}

function drawDiamond(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
): void {
  const half = size / 2;
  const hw = half * 0.72; // horizontal half-width
  const hh = half * 0.95; // vertical half-height

  ctx.beginPath();
  ctx.moveTo(cx, cy - hh);       // top
  ctx.lineTo(cx + hw, cy);       // right
  ctx.lineTo(cx, cy + hh);       // bottom
  ctx.lineTo(cx - hw, cy);       // left
  ctx.closePath();
  ctx.fill();
}
