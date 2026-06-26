import { CARD_RADIUS } from '../config.ts';

// ---------------------------------------------------------------------------
// Shared helpers
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

function clearAndClip(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  fillColor: string
): void {
  ctx.clearRect(0, 0, W, H);
  roundedRect(ctx, 0, 0, W, H, CARD_RADIUS);
  ctx.fillStyle = fillColor;
  ctx.fill();
  roundedRect(ctx, 0, 0, W, H, CARD_RADIUS);
  ctx.clip();
}

function drawNameAtBottom(
  ctx: CanvasRenderingContext2D,
  name: string,
  cx: number,
  bottomY: number,
  color: string,
  maxWidth: number
): void {
  ctx.fillStyle = color;
  ctx.font = 'bold 11px Nunito, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';

  let displayName = name;
  while (ctx.measureText(displayName).width > maxWidth && displayName.length > 0) {
    displayName = displayName.slice(0, -1);
  }
  if (displayName.length < name.length) {
    displayName = displayName.slice(0, -1) + '…';
  }
  ctx.fillText(displayName, cx, bottomY);
}

/** Simple deterministic hash → 0..(mod-1) */
function hashId(id: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h % mod;
}

// ---------------------------------------------------------------------------
// Tarot symbols (arcana-derived geometric shapes)
// ---------------------------------------------------------------------------

type GeometricFn = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
) => void;

function drawHexagram(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
): void {
  const r = size * 0.42;
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.06;

  // Two overlapping triangles (Star of David)
  for (let t = 0; t < 2; t++) {
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const angle = (Math.PI * 2 * i) / 3 + (t === 0 ? -Math.PI / 2 : Math.PI / 2);
      const px = cx + r * Math.cos(angle);
      const py = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  }
}

function drawPentagram(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
): void {
  const r = size * 0.44;
  const innerR = r * 0.38;
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.06;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const next = (Math.PI * 2 * ((i + 2) % 5)) / 5 - Math.PI / 2;
    ctx.moveTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    ctx.lineTo(cx + r * Math.cos(next), cy + r * Math.sin(next));
  }
  ctx.stroke();
  // Inner pentagon
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const px = cx + innerR * Math.cos(angle);
    const py = cy + innerR * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
}

function drawEye(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
): void {
  const hw = size * 0.44;
  const hh = size * 0.2;
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.07;
  ctx.beginPath();
  ctx.moveTo(cx - hw, cy);
  ctx.quadraticCurveTo(cx, cy - hh * 2.2, cx + hw, cy);
  ctx.quadraticCurveTo(cx, cy + hh * 2.2, cx - hw, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, hh * 0.68, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawCross(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
): void {
  const arm = size * 0.44;
  const thickness = size * 0.14;
  ctx.fillStyle = color;
  ctx.fillRect(cx - thickness / 2, cy - arm, thickness, arm * 2);
  ctx.fillRect(cx - arm, cy - arm * 0.35, arm * 2, thickness);
}

function drawInfinitySymbol(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
): void {
  const r = size * 0.22;
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.08;
  ctx.beginPath();
  // Left loop
  ctx.arc(cx - r, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  // Right loop
  ctx.arc(cx + r, cy, r, 0, Math.PI * 2);
  ctx.stroke();
}

function drawSun(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
): void {
  const r = size * 0.28;
  const rayLen = size * 0.16;
  const rayCount = 8;
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.07;
  ctx.lineCap = 'round';
  for (let i = 0; i < rayCount; i++) {
    const angle = (Math.PI * 2 * i) / rayCount;
    ctx.beginPath();
    ctx.moveTo(cx + (r + 2) * Math.cos(angle), cy + (r + 2) * Math.sin(angle));
    ctx.lineTo(cx + (r + rayLen) * Math.cos(angle), cy + (r + rayLen) * Math.sin(angle));
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawMoon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
): void {
  const r = size * 0.38;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Carve out crescent
  ctx.fillStyle = '#2d1b69';
  ctx.beginPath();
  ctx.arc(cx + r * 0.35, cy - r * 0.1, r * 0.78, 0, Math.PI * 2);
  ctx.fill();
}

function drawWheelOfFortune(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
): void {
  const r = size * 0.42;
  const innerR = r * 0.45;
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.07;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.stroke();
  // Spokes
  const spokes = 8;
  for (let i = 0; i < spokes; i++) {
    const angle = (Math.PI * 2 * i) / spokes;
    ctx.beginPath();
    ctx.moveTo(cx + innerR * Math.cos(angle), cy + innerR * Math.sin(angle));
    ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    ctx.stroke();
  }
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
): void {
  const r = size * 0.45;
  const inner = r * 0.4;
  ctx.fillStyle = color;
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
  ctx.fill();
}

function drawSkull(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
): void {
  ctx.fillStyle = color;
  // Cranium
  ctx.beginPath();
  ctx.arc(cx, cy - size * 0.08, size * 0.36, 0, Math.PI * 2);
  ctx.fill();
  // Jaw
  ctx.fillRect(cx - size * 0.22, cy + size * 0.2, size * 0.44, size * 0.16);
  // Eye sockets (carved out)
  ctx.fillStyle = '#2d1b69';
  ctx.beginPath();
  ctx.arc(cx - size * 0.13, cy - size * 0.1, size * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + size * 0.13, cy - size * 0.1, size * 0.09, 0, Math.PI * 2);
  ctx.fill();
}

function drawTower(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
): void {
  ctx.fillStyle = color;
  // Tower body
  const tw = size * 0.38;
  const th = size * 0.7;
  ctx.fillRect(cx - tw / 2, cy - th / 2, tw, th);
  // Battlements at top
  const bw = tw / 4;
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(cx - tw / 2 + i * bw * 1.4, cy - th / 2 - size * 0.1, bw, size * 0.12);
  }
  // Window
  ctx.fillStyle = '#2d1b69';
  ctx.fillRect(cx - size * 0.07, cy - size * 0.08, size * 0.14, size * 0.18);
}

function drawAngel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
): void {
  ctx.fillStyle = color;
  // Body
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.18, 0, Math.PI * 2);
  ctx.fill();
  // Wings (two arcs)
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.08;
  ctx.beginPath();
  ctx.arc(cx - size * 0.28, cy - size * 0.05, size * 0.28, -Math.PI * 0.2, Math.PI * 0.9);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + size * 0.28, cy - size * 0.05, size * 0.28, Math.PI * 0.1, Math.PI * 1.2);
  ctx.stroke();
}

// Map arcana number (mod 8) → symbol function
const TAROT_SYMBOLS: GeometricFn[] = [
  drawSun,           // 0 - The Fool
  drawInfinitySymbol, // 1 - The Magician
  drawMoon,          // 2 - The High Priestess
  drawStar,          // 3 - The Empress
  drawCross,         // 4 - The Emperor
  drawHexagram,      // 5 - The Hierophant
  drawHexagram,      // 6 - The Lovers
  drawPentagram,     // 7 - The Chariot
];

// Extended list for arcana 8–21
const TAROT_SYMBOLS_EXT: GeometricFn[] = [
  ...TAROT_SYMBOLS,
  drawEye,           // 8 - Justice
  drawEye,           // 9 - The Hermit
  drawWheelOfFortune,// 10 - Wheel of Fortune
  drawSkull,         // 11 - Strength
  drawSkull,         // 12 - The Hanged Man
  drawSkull,         // 13 - Death
  drawCross,         // 14 - Temperance
  drawTower,         // 15 - The Devil
  drawTower,         // 16 - The Tower
  drawStar,          // 17 - The Star
  drawMoon,          // 18 - The Moon
  drawSun,           // 19 - The Sun
  drawAngel,         // 20 - Judgement
  drawHexagram,      // 21 - The World
];

// ---------------------------------------------------------------------------
// Planet colors
// ---------------------------------------------------------------------------

const PLANET_COLORS: Record<string, string> = {
  planet_pluto:    '#aaaaaa',  // gray
  planet_mercury:  '#ff8833',  // orange
  planet_uranus:   '#88ddff',  // light blue
  planet_venus:    '#ffaacc',  // pink
  planet_saturn:   '#ffcc44',  // gold
  planet_jupiter:  '#d4a574',  // tan
  planet_earth:    '#44aaaa',  // blue-green
  planet_mars:     '#cc3300',  // red
  planet_neptune:  '#2244cc',  // deep blue
  planet_planet_x: '#9933cc',  // purple
  planet_ceres:    '#ccbb88',  // beige
  planet_eris:     '#660011',  // dark red
};

const PLANET_SIZE_SCALE: Record<string, number> = {
  planet_jupiter:  1.0,
  planet_saturn:   0.95,
  planet_uranus:   0.8,
  planet_neptune:  0.82,
  planet_earth:    0.75,
  planet_venus:    0.72,
  planet_mars:     0.6,
  planet_mercury:  0.5,
  planet_pluto:    0.4,
  planet_planet_x: 0.7,
  planet_ceres:    0.52,
  planet_eris:     0.55,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function drawTarotFace(
  canvas: HTMLCanvasElement,
  id: string,
  name: string
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;

  ctx.save();
  clearAndClip(ctx, W, H, '#2d1b69');

  // Subtle vignette/gradient overlay
  const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.1, W / 2, H / 2, H * 0.75);
  vignette.addColorStop(0, 'rgba(80,40,160,0.15)');
  vignette.addColorStop(1, 'rgba(10,5,40,0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  // Border
  roundedRect(ctx, 1, 1, W - 2, H - 2, CARD_RADIUS);
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Roman numeral at top-center
  // Derive arcana number from id hash (fallback if name not in map)
  const arcanaNum = hashId(id, 22);
  const roman = toRoman(arcanaNum);

  ctx.fillStyle = '#c9a227';
  ctx.font = 'bold 11px Nunito, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(roman, W / 2, 6);

  // Symbol in center
  const cx = W / 2;
  const cy = H * 0.46;
  const size = Math.min(W, H) * 0.38;

  const symbolFn = TAROT_SYMBOLS_EXT[arcanaNum % TAROT_SYMBOLS_EXT.length];
  symbolFn(ctx, cx, cy, size, '#c9a227');

  // Name at bottom
  drawNameAtBottom(ctx, name, W / 2, H - 5, '#c9a227', W - 6);

  ctx.restore();
}

export function drawPlanetFace(
  canvas: HTMLCanvasElement,
  id: string,
  name: string
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;

  ctx.save();
  clearAndClip(ctx, W, H, '#0a0a1e');

  // Starfield
  ctx.fillStyle = '#ffffff';
  const starSeed = hashId(id, 100);
  for (let i = 0; i < 28; i++) {
    const sx = ((starSeed * (i * 7 + 3)) % (W - 4)) + 2;
    const sy = ((starSeed * (i * 11 + 5)) % (H - 4)) + 2;
    const sr = ((i % 3) === 0) ? 1.2 : 0.7;
    ctx.globalAlpha = 0.4 + (i % 5) * 0.12;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Border
  roundedRect(ctx, 1, 1, W - 2, H - 2, CARD_RADIUS);
  ctx.strokeStyle = '#334466';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const cx = W / 2;
  const cy = H * 0.45;
  const planetColor = PLANET_COLORS[id] ?? '#888888';
  const sizeScale = PLANET_SIZE_SCALE[id] ?? 0.65;
  const r = Math.min(W, H) * 0.28 * sizeScale;

  // Planet glow
  const glow = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r * 1.4);
  glow.addColorStop(0, planetColor + 'cc');
  glow.addColorStop(0.6, planetColor + '44');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.4, 0, Math.PI * 2);
  ctx.fill();

  // Planet body
  const bodyGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.05, cx, cy, r);
  bodyGrad.addColorStop(0, lightenColor(planetColor, 0.35));
  bodyGrad.addColorStop(1, darkenColor(planetColor, 0.4));
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Saturn ring (special case)
  if (id === 'planet_saturn') {
    ctx.strokeStyle = '#ffcc44';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 1.55, r * 0.35, -Math.PI * 0.18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Uranus ring (perpendicular)
  if (id === 'planet_uranus') {
    ctx.strokeStyle = '#88ddff';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.35, r * 1.45, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Name at bottom
  drawNameAtBottom(ctx, name, W / 2, H - 5, '#ffffff', W - 6);

  ctx.restore();
}

export function drawSpectralFace(
  canvas: HTMLCanvasElement,
  id: string,
  name: string
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;

  ctx.save();
  clearAndClip(ctx, W, H, '#0d0d1a');

  // Eerie gradient
  const bg = ctx.createRadialGradient(W / 2, H * 0.4, H * 0.05, W / 2, H * 0.4, H * 0.7);
  bg.addColorStop(0, '#1a1a3a');
  bg.addColorStop(1, '#0a0a14');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Border
  roundedRect(ctx, 1, 1, W - 2, H - 2, CARD_RADIUS);
  ctx.strokeStyle = '#3399bb';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Wavy wisp lines
  const wispColor = '#88ccdd';
  const seed = hashId(id, 7);
  const wispCount = 5;

  for (let w = 0; w < wispCount; w++) {
    const baseY = H * (0.2 + w * 0.13) + seed * 2;
    const amplitude = 5 + (w % 3) * 3;
    const freq = 0.06 + (w % 4) * 0.02;
    const phase = (seed + w) * 0.8;

    ctx.beginPath();
    ctx.strokeStyle = wispColor;
    ctx.lineWidth = 0.8 + (w % 3) * 0.4;
    ctx.globalAlpha = 0.25 + (w % 3) * 0.12;
    ctx.lineCap = 'round';

    for (let px = 2; px <= W - 2; px += 2) {
      const py = baseY + amplitude * Math.sin(px * freq + phase);
      if (px === 2) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Ghost shape: semi-transparent teardrop/spirit form
  const cx = W / 2;
  const ghostTop = H * 0.18;
  const ghostBot = H * 0.72;
  const ghostW = W * 0.34;

  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#aaddee';
  ctx.beginPath();
  // Head arc
  ctx.arc(cx, ghostTop + ghostW, ghostW, Math.PI, 0, false);
  // Right side
  ctx.lineTo(cx + ghostW, ghostBot);
  // Wavy bottom
  const waveSegs = 3;
  const segW = (ghostW * 2) / waveSegs;
  for (let i = waveSegs; i >= 0; i--) {
    const bx = cx - ghostW + i * segW;
    const by = ghostBot - (i % 2 === 0 ? 0 : 5);
    ctx.lineTo(bx, by);
  }
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // Glowing eyes on ghost
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = '#88eeff';
  ctx.beginPath();
  ctx.ellipse(cx - ghostW * 0.32, ghostTop + ghostW * 0.82, 3, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + ghostW * 0.32, ghostTop + ghostW * 0.82, 3, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Particle wisps (dots)
  for (let p = 0; p < 12; p++) {
    const px = 4 + ((seed * (p * 13 + 7)) % (W - 8));
    const py = 4 + ((seed * (p * 17 + 3)) % (H - 8));
    const pr = 0.8 + (p % 3) * 0.5;
    ctx.globalAlpha = 0.15 + (p % 5) * 0.06;
    ctx.fillStyle = '#88ccdd';
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Name at bottom
  drawNameAtBottom(ctx, name, W / 2, H - 5, '#88ccdd', W - 6);

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Utility: Roman numerals
// ---------------------------------------------------------------------------

function toRoman(n: number): string {
  if (n === 0) return '0';
  const vals = [10, 9, 5, 4, 1];
  const syms = ['X', 'IX', 'V', 'IV', 'I'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) {
      result += syms[i];
      n -= vals[i];
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Utility: color manipulation
// ---------------------------------------------------------------------------

function lightenColor(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.min(255, Math.round(r + (255 - r) * amount));
  const lg = Math.min(255, Math.round(g + (255 - g) * amount));
  const lb = Math.min(255, Math.round(b + (255 - b) * amount));
  return `rgb(${lr},${lg},${lb})`;
}

function darkenColor(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const dr = Math.max(0, Math.round(r * (1 - amount)));
  const dg = Math.max(0, Math.round(g * (1 - amount)));
  const db = Math.max(0, Math.round(b * (1 - amount)));
  return `rgb(${dr},${dg},${db})`;
}

// ---------------------------------------------------------------------------
// Pack face card
// ---------------------------------------------------------------------------

const PACK_THEME: Record<string, { bg: string; border: string; label: string; emoji: string }> = {
  arcana:          { bg: '#2d1b69', border: '#c9a227', label: '#c9a227', emoji: '✦' },
  mega_arcana:     { bg: '#3d2880', border: '#ffe066', label: '#ffe066', emoji: '✦✦' },
  celestial:       { bg: '#0a0a1e', border: '#334466', label: '#88aadd', emoji: '★' },
  mega_celestial:  { bg: '#0a0a22', border: '#4455aa', label: '#aabbee', emoji: '★★' },
  spectral:        { bg: '#0d0d1a', border: '#3399bb', label: '#88ccdd', emoji: '👁' },
  buffoon:         { bg: '#1a0d0d', border: '#cc4444', label: '#ffaaaa', emoji: '🃏' },
  mega_buffoon:    { bg: '#220d0d', border: '#ff6666', label: '#ffcccc', emoji: '🃏🃏' },
  standard:        { bg: '#111827', border: '#556677', label: '#aabbcc', emoji: '♠' },
  mega_standard:   { bg: '#0d151f', border: '#667788', label: '#bbccdd', emoji: '♠♠' },
};

export function drawPackFace(canvas: HTMLCanvasElement, packType: string): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;
  const theme = PACK_THEME[packType] ?? { bg: '#1a1a2e', border: '#888888', label: '#aaaaaa', emoji: '?' };

  ctx.save();
  clearAndClip(ctx, W, H, theme.bg);

  // Subtle inner glow
  const glow = ctx.createRadialGradient(W / 2, H * 0.4, H * 0.05, W / 2, H * 0.4, H * 0.7);
  glow.addColorStop(0, 'rgba(255,255,255,0.06)');
  glow.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Border
  roundedRect(ctx, 1, 1, W - 2, H - 2, CARD_RADIUS);
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner border
  roundedRect(ctx, 4, 4, W - 8, H - 8, CARD_RADIUS - 2);
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 0.8;
  ctx.globalAlpha = 0.4;
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Emoji / symbol in center
  ctx.font = `bold ${Math.round(W * 0.3)}px Nunito, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = theme.label;
  ctx.globalAlpha = 0.85;
  ctx.fillText(theme.emoji, W / 2, H * 0.42);
  ctx.globalAlpha = 1;

  // "PACK" label
  ctx.font = `bold 10px Nunito, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = theme.border;
  ctx.fillText('PACK', W / 2, 6);

  // Name at bottom
  const name = packType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  drawNameAtBottom(ctx, name, W / 2, H - 5, theme.label, W - 6);

  ctx.restore();
}
