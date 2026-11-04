import { Sprite } from '../art/people';
import { PropArt } from '../art/props';

// Drawing in world space, onto the world-resolution buffer. Everything lands
// on whole world pixels, so sprites and the painted town share one grid.

export class WorldDraw {
  x0 = 0;
  y0 = 0;
  x1 = 0;
  y1 = 0;
  constructor(public ctx: CanvasRenderingContext2D) {}

  setView(x0: number, y0: number, x1: number, y1: number) {
    this.x0 = x0; this.y0 = y0; this.x1 = x1; this.y1 = y1;
  }
  visible(x: number, y: number, w: number, h: number) {
    return x + w >= this.x0 && y + h >= this.y0 && x <= this.x1 && y <= this.y1;
  }
  sprite(s: Sprite, x: number, y: number, alpha = 1) {
    const dx = Math.round(x) - s.ax, dy = Math.round(y) - s.ay;
    if (!this.visible(dx, dy, s.w, s.h)) return;
    if (alpha !== 1) this.ctx.globalAlpha = alpha;
    this.ctx.drawImage(s.canvas, dx, dy);
    if (alpha !== 1) this.ctx.globalAlpha = 1;
  }
  /** Draw only the top `rows` rows of a sprite (for people half in water etc). */
  spriteCrop(s: Sprite, x: number, y: number, rows: number) {
    const dx = Math.round(x) - s.ax, dy = Math.round(y) - s.ay;
    if (rows <= 0 || !this.visible(dx, dy, s.w, s.h)) return;
    this.ctx.drawImage(s.canvas, 0, 0, s.w, rows, dx, dy, s.w, rows);
  }
  canvas(c: HTMLCanvasElement, x: number, y: number) {
    x = Math.round(x); y = Math.round(y);
    if (!this.visible(x, y, c.width, c.height)) return;
    this.ctx.drawImage(c, x, y);
  }
  rect(x: number, y: number, w: number, h: number, css: string) {
    this.ctx.fillStyle = css;
    this.ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }
  /** A soft pixel shadow under something standing on the ground. */
  shadow(x: number, y: number, w: number, alpha = 0.28) {
    x = Math.round(x); y = Math.round(y);
    this.ctx.fillStyle = `rgba(40,26,70,${alpha})`;
    const half = Math.floor(w / 2);
    this.ctx.fillRect(x - half + 1, y - 1, w - 2, 1);
    this.ctx.fillRect(x - half, y, w, 1);
    this.ctx.fillRect(x - half + 1, y + 1, w - 2, 1);
  }
  line(x0: number, y0: number, x1: number, y1: number, css: string) {
    this.ctx.fillStyle = css;
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (let i = 0; i < 2000; i++) {
      this.ctx.fillRect(x0, y0, 1, 1);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
}

const artCache = new WeakMap<PropArt, Sprite>();
export function propSprite(a: PropArt): Sprite {
  let s = artCache.get(a);
  if (!s) {
    s = { canvas: a.bm.canvas(), w: a.bm.w, h: a.bm.h, ax: a.ax, ay: a.ay };
    artCache.set(a, s);
  }
  return s;
}
