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

function buildEnhancementGradient(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  enhancement: Enhancement
): CanvasGradient | string {
  switch (enhancement) {
    case 'bonus': {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#fffff0');
      g.addColorStop(1, '#f5eed4');
      return g;
    }
    case 'mult': {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#fff4f4');
      g.addColorStop(1, '#f5dada');
      return g;
    }
    case 'glass': {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#e8f4ff');
      g.addColorStop(0.5, '#ddeeff');
      g.addColorStop(1, '#cce0ff');
      return g;
    }
    case 'steel': {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#e8e8e8');
      g.addColorStop(0.5, '#f4f4f4');
      g.addColorStop(1, '#d4d4d4');
      return g;
    }
    case 'stone': return '#c8c0b8';
    case 'gold': {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#fff4a0');
      g.addColorStop(0.5, '#ffe050');
      g.addColorStop(1, '#d4a800');
      return g;
    }
    case 'lucky': {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#eeffee');
      g.addColorStop(1, '#c8f0d0');
      return g;
    }
    default: {
      // Standard cream card — warm gradient
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#faf4ea');
      g.addColorStop(0.6, '#f2e8d8');
      g.addColorStop(1, '#e8d8c0');
      return g;
    }
  }
}

// ---------------------------------------------------------------------------
// Pip positions
// ---------------------------------------------------------------------------

type PipPos = [number, number];

const PIP_LAYOUTS: Record<string, PipPos[]> = {
  '2':  [[0.5, 0.18], [0.5, 0.82]],
  '3':  [[0.5, 0.18], [0.5, 0.5],  [0.5, 0.82]],
  '4':  [[0.25, 0.2], [0.75, 0.2], [0.25, 0.8], [0.75, 0.8]],
  '5':  [[0.25, 0.2], [0.75, 0.2], [0.5, 0.5],  [0.25, 0.8], [0.75, 0.8]],
  '6':  [[0.25, 0.2], [0.75, 0.2], [0.25, 0.5], [0.75, 0.5], [0.25, 0.8], [0.75, 0.8]],
  '7':  [[0.25, 0.2], [0.75, 0.2], [0.5, 0.34], [0.25, 0.5], [0.75, 0.5], [0.25, 0.8], [0.75, 0.8]],
  '8':  [[0.25, 0.2], [0.75, 0.2], [0.5, 0.33], [0.25, 0.5], [0.75, 0.5], [0.5, 0.67], [0.25, 0.8], [0.75, 0.8]],
  '9':  [[0.25, 0.18],[0.75, 0.18],[0.25, 0.37],[0.75, 0.37],[0.5, 0.5],  [0.25, 0.63],[0.75, 0.63],[0.25, 0.82],[0.75, 0.82]],
  '10': [[0.25, 0.15],[0.75, 0.15],[0.5, 0.28], [0.25, 0.38],[0.75, 0.38],[0.25, 0.62],[0.75, 0.62],[0.5, 0.72], [0.25, 0.85],[0.75, 0.85]],
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
  _isSelected: boolean
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  // ── Card shape clip ─────────────────────────────────────────────────────────
  roundedRect(ctx, 0, 0, W, H, CARD_RADIUS);
  ctx.save();
  ctx.clip();

  // ── Background ──────────────────────────────────────────────────────────────
  if (enhancement === 'wild') {
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0,    '#ffe0e0');
    grad.addColorStop(0.15, '#ffe8cc');
    grad.addColorStop(0.30, '#ffffd0');
    grad.addColorStop(0.50, '#d0ffd8');
    grad.addColorStop(0.65, '#ccf0ff');
    grad.addColorStop(0.82, '#e8ccff');
    grad.addColorStop(1,    '#ffe0e0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  } else {
    ctx.fillStyle = buildEnhancementGradient(ctx, W, H, enhancement);
    ctx.fillRect(0, 0, W, H);
  }

  // ── Subtle inner light (specular) ───────────────────────────────────────────
  const specular = ctx.createRadialGradient(W * 0.4, H * 0.18, 0, W * 0.4, H * 0.3, W * 0.85);
  specular.addColorStop(0, 'rgba(255,255,255,0.42)');
  specular.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = specular;
  ctx.fillRect(0, 0, W, H);

  ctx.restore();

  // ── Enhancement overlays ────────────────────────────────────────────────────
  if (enhancement === 'glass') {
    // Blue diagonal sheen
    roundedRect(ctx, 0, 0, W, H, CARD_RADIUS);
    ctx.save();
    ctx.clip();
    ctx.globalAlpha = 0.18;
    const sheenGrad = ctx.createLinearGradient(0, 0, W, H);
    sheenGrad.addColorStop(0, 'rgba(80,160,255,0)');
    sheenGrad.addColorStop(0.45, 'rgba(150,210,255,0.8)');
    sheenGrad.addColorStop(0.55, 'rgba(150,210,255,0.8)');
    sheenGrad.addColorStop(1, 'rgba(80,160,255,0)');
    ctx.fillStyle = sheenGrad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  } else if (enhancement === 'gold') {
    // Gold shimmer band
    roundedRect(ctx, 0, 0, W, H, CARD_RADIUS);
    ctx.save();
    ctx.clip();
    ctx.globalAlpha = 0.25;
    const goldGrad = ctx.createLinearGradient(0, 0, W * 1.2, H * 0.6);
    goldGrad.addColorStop(0, 'rgba(255,240,100,0)');
    goldGrad.addColorStop(0.5, 'rgba(255,220,0,0.9)');
    goldGrad.addColorStop(1, 'rgba(255,240,100,0)');
    ctx.fillStyle = goldGrad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  } else if (enhancement === 'lucky') {
    // Green sparkle dots
    roundedRect(ctx, 0, 0, W, H, CARD_RADIUS);
    ctx.save();
    ctx.clip();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#44cc66';
    const dots: [number, number][] = [
      [0.2, 0.3], [0.8, 0.2], [0.5, 0.15], [0.15, 0.7],
      [0.85, 0.75], [0.6, 0.85], [0.35, 0.55],
    ];
    for (const [fx, fy] of dots) {
      ctx.beginPath();
      ctx.arc(fx * W, fy * H, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else if (enhancement === 'steel') {
    // Brushed metal lines
    roundedRect(ctx, 0, 0, W, H, CARD_RADIUS);
    ctx.save();
    ctx.clip();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = '#aaaaaa';
    ctx.lineWidth = 0.8;
    for (let y = 0; y < H; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.restore();
  } else if (enhancement === 'bonus') {
    // Soft yellow corners
    roundedRect(ctx, 0, 0, W, H, CARD_RADIUS);
    ctx.save();
    ctx.clip();
    ctx.globalAlpha = 0.20;
    const cornerGrad = ctx.createRadialGradient(W, 0, 0, W, 0, W * 0.8);
    cornerGrad.addColorStop(0, '#ffee44');
    cornerGrad.addColorStop(1, 'rgba(255,238,68,0)');
    ctx.fillStyle = cornerGrad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  } else if (enhancement === 'mult') {
    // Red glow corners
    roundedRect(ctx, 0, 0, W, H, CARD_RADIUS);
    ctx.save();
    ctx.clip();
    ctx.globalAlpha = 0.18;
    const multGrad = ctx.createRadialGradient(0, H, 0, 0, H, W * 0.9);
    multGrad.addColorStop(0, '#ff4444');
    multGrad.addColorStop(1, 'rgba(255,68,68,0)');
    ctx.fillStyle = multGrad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // ── Card border ──────────────────────────────────────────────────────────────
  roundedRect(ctx, 0.5, 0.5, W - 1, H - 1, CARD_RADIUS);
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Subtle inner highlight on top edge
  ctx.beginPath();
  ctx.moveTo(CARD_RADIUS, 1);
  ctx.lineTo(W - CARD_RADIUS, 1);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Stone card: special content
  if (rank === null) {
    drawStoneContent(ctx, W, H);
    applyDebuff(ctx, W, H, isDebuffed);
    return;
  }

  const suitColor = suit ? getSuitColor(suit) : '#1a1a1a';
  const isRed = suitColor === '#d63030';

  // ── Corner label areas ───────────────────────────────────────────────────────
  // Subtle corner box (top-left)
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = isRed ? '#cc0000' : '#000000';
  roundedRect(ctx, 2, 2, 20, 36, 3);
  ctx.fill();
  ctx.restore();

  // Rank text (top-left)
  ctx.fillStyle = suitColor;
  ctx.font = `bold 14px monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  // Slight text shadow for depth
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = '#000000';
  ctx.fillText(rank, 7, 6);
  ctx.restore();
  ctx.fillStyle = suitColor;
  ctx.fillText(rank, 6, 5);

  // Small suit icon (top-left, below rank)
  if (suit) {
    drawSuit(ctx, suit, 10, 22, 10);
  }

  // Bottom-right corner (rotated 180°)
  ctx.save();
  ctx.translate(W, H);
  ctx.rotate(Math.PI);

  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = isRed ? '#cc0000' : '#000000';
  roundedRect(ctx, 2, 2, 20, 36, 3);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = suitColor;
  ctx.font = `bold 14px monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = '#000000';
  ctx.fillText(rank, 7, 6);
  ctx.restore();
  ctx.fillStyle = suitColor;
  ctx.fillText(rank, 6, 5);
  if (suit) {
    drawSuit(ctx, suit, 10, 22, 10);
  }
  ctx.restore();

  // ── Center pip area ──────────────────────────────────────────────────────────
  const cx = W / 2;
  const cy = H / 2;

  if (rank === 'A' && suit) {
    drawAceCenter(ctx, suit, cx, cy, W, H);
  } else if (rank === 'J' || rank === 'Q' || rank === 'K') {
    drawFaceCard(ctx, rank, suit, cx, cy, W, H, suitColor, isRed);
  } else if (PIP_LAYOUTS[rank] && suit) {
    drawPips(ctx, suit, rank, W, H);
  }

  applyDebuff(ctx, W, H, isDebuffed);

  // ── Enhancement badge (bottom-center) ────────────────────────────────────────
  drawEnhancementBadge(ctx, W, H, enhancement);
}

// ---------------------------------------------------------------------------
// Card back — ornate deep navy
// ---------------------------------------------------------------------------

export function drawCardBack(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  // ── Base ──────────────────────────────────────────────────────────────────────
  roundedRect(ctx, 0, 0, W, H, CARD_RADIUS);
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, '#1a3a6b');
  bgGrad.addColorStop(0.5, '#12285a');
  bgGrad.addColorStop(1, '#0e1e44');
  ctx.fillStyle = bgGrad;
  ctx.fill();

  // Clip everything inside the card
  roundedRect(ctx, 0, 0, W, H, CARD_RADIUS);
  ctx.save();
  ctx.clip();

  // ── Diagonal crosshatch ───────────────────────────────────────────────────────
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.strokeStyle = '#4488cc';
  ctx.lineWidth = 0.6;
  const spacing = 7;
  const diag = Math.sqrt(W * W + H * H) + 10;
  const steps = Math.ceil(diag / spacing) * 2;

  ctx.beginPath();
  for (let i = -steps; i <= steps; i++) {
    const o = i * spacing;
    ctx.moveTo(-diag + o, -diag);
    ctx.lineTo( diag + o,  diag);
  }
  ctx.stroke();

  ctx.beginPath();
  for (let i = -steps; i <= steps; i++) {
    const o = i * spacing;
    ctx.moveTo(-diag + o,  diag);
    ctx.lineTo( diag + o, -diag);
  }
  ctx.stroke();
  ctx.restore();

  // ── Inner border frame ────────────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(100,160,255,0.25)';
  ctx.lineWidth = 1;
  roundedRect(ctx, 4, 4, W - 8, H - 8, CARD_RADIUS - 2);
  ctx.stroke();

  roundedRect(ctx, 7, 7, W - 14, H - 14, CARD_RADIUS - 3);
  ctx.stroke();

  // ── Center ornament ───────────────────────────────────────────────────────────
  const cx = W / 2;
  const cy = H / 2;

  // Outer ring
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(100,160,255,0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Inner ring
  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(150,200,255,0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Star / spade-like center symbol
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = 'rgba(180,210,255,0.6)';
  ctx.strokeStyle = 'rgba(100,160,255,0.8)';
  ctx.lineWidth = 0.8;

  // 8-pointed star
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI * 2) / 8 - Math.PI / 2;
    const r = i % 2 === 0 ? 12 : 5;
    ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // ── Corner ornaments ──────────────────────────────────────────────────────────
  const crnr: [number, number, number][] = [
    [10, 10, 0],
    [W - 10, 10, Math.PI / 2],
    [W - 10, H - 10, Math.PI],
    [10, H - 10, -Math.PI / 2],
  ];
  for (const [ox, oy, rot] of crnr) {
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(rot);
    ctx.strokeStyle = 'rgba(120,180,255,0.45)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(6, 0);
    ctx.moveTo(0, 0); ctx.lineTo(0, 6);
    ctx.stroke();
    ctx.restore();
  }

  // ── Top specular sheen ────────────────────────────────────────────────────────
  const sheen = ctx.createLinearGradient(0, 0, 0, H * 0.4);
  sheen.addColorStop(0, 'rgba(255,255,255,0.12)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, W, H * 0.4);

  ctx.restore();

  // ── Outer border ──────────────────────────────────────────────────────────────
  roundedRect(ctx, 0.5, 0.5, W - 1, H - 1, CARD_RADIUS);
  ctx.strokeStyle = 'rgba(80,130,220,0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function drawAceCenter(
  ctx: CanvasRenderingContext2D,
  suit: Suit,
  cx: number,
  cy: number,
  W: number,
  H: number
): void {
  // Large suit centered, with a subtle radial glow behind it
  const suitColor = getSuitColor(suit);
  const isRed = suitColor === '#d63030';

  // Soft radial glow
  const glowRad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 38);
  glowRad.addColorStop(0, isRed ? 'rgba(220,80,80,0.18)' : 'rgba(20,20,60,0.18)');
  glowRad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glowRad;
  ctx.fillRect(0, 0, W, H);

  drawSuit(ctx, suit, cx, cy - 2, 42);
}

function drawFaceCard(
  ctx: CanvasRenderingContext2D,
  rank: string,
  suit: Suit | null,
  cx: number,
  cy: number,
  W: number,
  H: number,
  suitColor: string,
  isRed: boolean
): void {
  // Colored inner panel
  const panelPad = 10;
  const panelX = panelPad;
  const panelY = panelPad + 38; // below corner label
  const panelW = W - panelPad * 2;
  const panelH = H - (panelPad + 38) * 2;

  // Panel background with suit-tinted gradient
  roundedRect(ctx, panelX, panelY, panelW, panelH, 5);
  const panelGrad = ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelH);
  if (isRed) {
    panelGrad.addColorStop(0, 'rgba(220,80,80,0.12)');
    panelGrad.addColorStop(1, 'rgba(180,40,40,0.06)');
  } else {
    panelGrad.addColorStop(0, 'rgba(30,30,80,0.10)');
    panelGrad.addColorStop(1, 'rgba(10,10,40,0.05)');
  }
  ctx.fillStyle = panelGrad;
  ctx.fill();

  roundedRect(ctx, panelX, panelY, panelW, panelH, 5);
  ctx.strokeStyle = isRed ? 'rgba(200,80,80,0.25)' : 'rgba(60,60,100,0.22)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Large rank letter — styled
  ctx.fillStyle = suitColor;
  ctx.font = `bold 38px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Drop shadow
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#000000';
  ctx.fillText(rank, cx + 1.5, cy - 6);
  ctx.restore();

  ctx.fillStyle = suitColor;
  ctx.fillText(rank, cx, cy - 7);

  // Suit symbol below rank letter
  if (suit) {
    drawSuit(ctx, suit, cx, cy + 16, 18);
  }

  // Decorative corner suit symbols inside panel
  if (suit) {
    ctx.save();
    ctx.globalAlpha = 0.12;
    drawSuit(ctx, suit, panelX + 9, panelY + 9, 11);
    drawSuit(ctx, suit, panelX + panelW - 9, panelY + panelH - 9, 11);
    ctx.restore();
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

  const padX = 8;
  const padY = 34;
  const areaW = W - padX * 2;
  const areaH = H - padY * 2;

  const count = positions.length;
  const pipSize = Math.max(8, Math.min(15, 120 / count));

  for (const [fx, fy] of positions) {
    const px = padX + fx * areaW;
    const py = padY + fy * areaH;
    drawSuit(ctx, suit, px, py, pipSize);
  }
}

function drawStoneContent(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number
): void {
  const cx = W / 2;
  const cy = H / 2;

  // Gradient stone background
  const stoneGrad = ctx.createRadialGradient(cx - 4, cy - 8, 0, cx, cy, W * 0.6);
  stoneGrad.addColorStop(0, '#d8d0c8');
  stoneGrad.addColorStop(0.5, '#b8b0a0');
  stoneGrad.addColorStop(1, '#8a8078');
  ctx.fillStyle = stoneGrad;
  ctx.fillRect(0, 0, W, H);

  // Stone texture lines
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 5; i++) {
    const y = cy - 16 + i * 8;
    ctx.beginPath();
    ctx.moveTo(cx - 18 + i * 2, y);
    ctx.bezierCurveTo(cx - 5 + i, y + 3, cx + 5 - i, y - 2, cx + 18 - i * 2, y + 1);
    ctx.stroke();
  }
  ctx.restore();

  // Central stone symbol (stacked horizontal lines)
  const rw = W * 0.5;
  const rh = H * 0.35;
  roundedRect(ctx, cx - rw / 2, cy - rh / 2, rw, rh, 5);
  ctx.strokeStyle = '#ccbbaa';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // "STONE" tiny text
  ctx.fillStyle = '#aaa098';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('STONE', cx, cy);
}

function drawEnhancementBadge(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  enhancement: Enhancement
): void {
  if (enhancement === 'none' || enhancement === 'wild') return;

  const labels: Partial<Record<Enhancement, { text: string; color: string }>> = {
    bonus:  { text: 'BONUS', color: '#b8a000' },
    mult:   { text: 'MULT',  color: '#cc2222' },
    glass:  { text: 'GLASS', color: '#2266cc' },
    steel:  { text: 'STEEL', color: '#666688' },
    stone:  { text: '',      color: '#888888' },
    gold:   { text: 'GOLD',  color: '#cc8800' },
    lucky:  { text: 'LUCKY', color: '#228844' },
  };
  const info = labels[enhancement];
  if (!info || !info.text) return;

  const badgeW = 32;
  const badgeH = 10;
  const bx = W / 2 - badgeW / 2;
  const by = H - 13;

  // Badge background
  roundedRect(ctx, bx, by, badgeW, badgeH, 3);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fill();

  ctx.fillStyle = info.color;
  ctx.font = 'bold 7px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(info.text, W / 2, by + badgeH / 2);
}

function applyDebuff(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  isDebuffed: boolean
): void {
  if (!isDebuffed) return;

  ctx.save();
  roundedRect(ctx, 0, 0, W, H, CARD_RADIUS);
  ctx.clip();

  // Red translucent wash
  ctx.fillStyle = 'rgba(180,0,0,0.28)';
  ctx.fillRect(0, 0, W, H);

  // Bold X
  ctx.strokeStyle = 'rgba(220,0,0,0.7)';
  ctx.lineWidth = W * 0.15;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(W * 0.12, H * 0.12);
  ctx.lineTo(W * 0.88, H * 0.88);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(W * 0.88, H * 0.12);
  ctx.lineTo(W * 0.12, H * 0.88);
  ctx.stroke();

  ctx.restore();
}
