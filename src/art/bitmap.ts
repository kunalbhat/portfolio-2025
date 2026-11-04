import { Color, shadow, sunlit, ink, A } from './color';
import { bayer } from './rng';

export type Palette = Record<string, Color | undefined>;

/**
 * A grid of pixels. All the art in the town is painted into these, one
 * pixel at a time, and only turned into canvases at the end.
 */
export class Bitmap {
  readonly data: Uint32Array;
  constructor(readonly w: number, readonly h: number) {
    this.data = new Uint32Array(w * h);
  }

  inside(x: number, y: number) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }
  get(x: number, y: number): Color {
    x |= 0; y |= 0;
    return this.inside(x, y) ? this.data[y * this.w + x] : 0;
  }
  px(x: number, y: number, c: Color | undefined) {
    x |= 0; y |= 0;
    if (c === undefined || c === 0 || !this.inside(x, y)) return;
    this.data[y * this.w + x] = c;
  }
  clear(x: number, y: number) {
    x |= 0; y |= 0;
    if (this.inside(x, y)) this.data[y * this.w + x] = 0;
  }
  rect(x: number, y: number, w: number, h: number, c: Color) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c);
  }
  hline(x: number, y: number, w: number, c: Color) {
    for (let i = 0; i < w; i++) this.px(x + i, y, c);
  }
  vline(x: number, y: number, h: number, c: Color) {
    for (let j = 0; j < h; j++) this.px(x, y + j, c);
  }
  /** Rect with a 1px darker border on the bottom and right, lighter top-left. */
  block(x: number, y: number, w: number, h: number, c: Color) {
    this.rect(x, y, w, h, c);
    this.hline(x, y, w, sunlit(c));
    this.vline(x, y, h, sunlit(c, 0.6));
    this.hline(x, y + h - 1, w, shadow(c, 0.7));
    this.vline(x + w - 1, y, h, shadow(c, 0.7));
  }
  line(x0: number, y0: number, x1: number, y1: number, c: Color) {
    x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.px(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  ellipse(cx: number, cy: number, rx: number, ry: number, c: Color | ((x: number, y: number, d: number) => Color | undefined)) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        const d = dx * dx + dy * dy;
        if (d <= 1) this.px(x, y, typeof c === 'number' ? c : c(x, y, d));
      }
    }
  }
  /** Darken whatever is already here, as if a shadow fell across it. */
  shade(x: number, y: number, k = 1) {
    x |= 0; y |= 0;
    if (!this.inside(x, y)) return;
    const i = y * this.w + x;
    if (this.data[i]) this.data[i] = shadow(this.data[i], k);
  }
  shadeRect(x: number, y: number, w: number, h: number, k = 1) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.shade(x + i, y + j, k);
  }
  /** Shadow with a dithered soft edge: d<inner is solid, fades out by 1. */
  shadeEllipse(cx: number, cy: number, rx: number, ry: number, k = 1, soft = 0.7) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > 1) continue;
        if (d > soft && bayer(x, y) < (d - soft) / (1 - soft)) continue;
        this.shade(x, y, k);
      }
    }
  }
  /**
   * Stamp a hand-drawn template. Each character is looked up in the palette;
   * '.' and characters missing from the palette leave the pixel alone.
   */
  stamp(rows: readonly string[], x: number, y: number, pal: Palette, flip = false) {
    const w = rows.reduce((m, r) => Math.max(m, r.length), 0);
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '.' || ch === ' ') continue;
        const c = pal[ch];
        if (c !== undefined) this.px(flip ? x + w - 1 - i : x + i, y + j, c);
      }
    });
  }
  blit(src: Bitmap, x: number, y: number, flip = false) {
    for (let j = 0; j < src.h; j++)
      for (let i = 0; i < src.w; i++) {
        const c = src.data[j * src.w + (flip ? src.w - 1 - i : i)];
        if (c) this.px(x + i, y + j, c);
      }
  }
  /**
   * Add a one-pixel outline around everything opaque, tinted from the pixel
   * it borders, so silhouettes read without hard black lines.
   */
  outline(only?: (x: number, y: number) => boolean) {
    const src = this.data.slice();
    const at = (x: number, y: number) => (x >= 0 && y >= 0 && x < this.w && y < this.h ? src[y * this.w + x] : 0);
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (at(x, y)) continue;
        const n = at(x, y - 1) || at(x, y + 1) || at(x - 1, y) || at(x + 1, y);
        if (n && A(n) === 255 && (!only || only(x, y))) this.data[y * this.w + x] = ink(n);
      }
  }
  canvas(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = this.w;
    c.height = this.h;
    const ctx = c.getContext('2d')!;
    const img = ctx.createImageData(this.w, this.h);
    new Uint32Array(img.data.buffer).set(this.data);
    ctx.putImageData(img, 0, 0);
    return c;
  }
}
