export function hexToRGB(hex: number): { r: number; g: number; b: number } {
  return { r: (hex >> 16) & 0xff, g: (hex >> 8) & 0xff, b: hex & 0xff };
}

export function rgbToHex(r: number, g: number, b: number): number {
  return (r << 16) | (g << 8) | b;
}

export function numToHexStr(n: number): string {
  return '#' + n.toString(16).padStart(6, '0');
}

export function lerpColor(a: number, b: number, t: number): number {
  const ca = hexToRGB(a), cb = hexToRGB(b);
  return rgbToHex(
    Math.round(ca.r + (cb.r - ca.r) * t),
    Math.round(ca.g + (cb.g - ca.g) * t),
    Math.round(ca.b + (cb.b - ca.b) * t),
  );
}
