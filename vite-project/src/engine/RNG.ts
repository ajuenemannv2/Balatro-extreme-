export class RNG {
  private state: number;

  constructor(seed: number | string) {
    this.state = typeof seed === 'string' ? RNG.hashString(seed) : seed >>> 0;
    if (this.state === 0) this.state = 1;
  }

  private static hashString(s: string): number {
    let h = 0xdeadbeef;
    for (let i = 0; i < s.length; i++) {
      h = Math.imul(h ^ s.charCodeAt(i), 2654435761);
    }
    return (h ^ (h >>> 16)) >>> 0;
  }

  next(): number {
    this.state += 0x6d2b79f5;
    let z = this.state;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 0x100000000;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextBool(probability = 0.5): boolean {
    return this.next() < probability;
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  shuffle<T>(arr: T[]): T[] {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  getState(): number { return this.state; }
  setState(s: number): void { this.state = s >>> 0; }
}
