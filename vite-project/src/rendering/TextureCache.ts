import Phaser from 'phaser';

const DEFAULT_MAX_SIZE = 256;

export class TextureCache {
  private readonly scene: Phaser.Scene;
  private readonly maxSize: number;
  /** Maps texture key → true (existence tracker) */
  private readonly keyMap: Map<string, true> = new Map();
  /** LRU queue: oldest entry at index 0, most-recently-used at the end */
  private readonly lruQueue: string[] = [];

  constructor(scene: Phaser.Scene, maxSize: number = DEFAULT_MAX_SIZE) {
    this.scene = scene;
    this.maxSize = maxSize;
  }

  /**
   * Returns the texture key for a given cache key, creating it if necessary.
   * The returned string can be used directly as a Phaser texture key.
   */
  getOrCreate(
    key: string,
    width: number,
    height: number,
    drawFn: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => void
  ): string {
    if (this.keyMap.has(key)) {
      this.touchLRU(key);
      return key;
    }

    // Evict if at capacity
    while (this.keyMap.size >= this.maxSize && this.lruQueue.length > 0) {
      const oldest = this.lruQueue.shift()!;
      this.evict(oldest);
    }

    // Create canvas, draw, register as Phaser texture
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawFn(canvas, ctx);
    }

    // Register (or replace) the texture in Phaser
    if (this.scene.textures.exists(key)) {
      this.scene.textures.remove(key);
    }
    this.scene.textures.addCanvas(key, canvas);

    this.keyMap.set(key, true);
    this.lruQueue.push(key);

    return key;
  }

  /** Remove a specific texture from the cache and from Phaser. */
  invalidate(key: string): void {
    if (!this.keyMap.has(key)) return;
    this.evict(key);
    const idx = this.lruQueue.indexOf(key);
    if (idx !== -1) this.lruQueue.splice(idx, 1);
  }

  /** Remove all textures managed by this cache. */
  clear(): void {
    for (const key of this.keyMap.keys()) {
      if (this.scene.textures.exists(key)) {
        this.scene.textures.remove(key);
      }
    }
    this.keyMap.clear();
    this.lruQueue.length = 0;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private evict(key: string): void {
    this.keyMap.delete(key);
    if (this.scene.textures.exists(key)) {
      this.scene.textures.remove(key);
    }
  }

  /** Move key to the end of the LRU queue (mark as recently used). */
  private touchLRU(key: string): void {
    const idx = this.lruQueue.indexOf(key);
    if (idx !== -1) {
      this.lruQueue.splice(idx, 1);
    }
    this.lruQueue.push(key);
  }
}
