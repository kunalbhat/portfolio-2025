import { Camera } from './camera';
import { WorldDraw } from './draw';
import { Particles, Bubbles } from './fx';
import { Entity, Ctx, Box } from '../world/actors';
import { WORLD_W, WORLD_H } from '../world/layout';

// One frame: composite the visible part of the town at world resolution
// (painted ground and buildings, then everything sorted by depth, then
// particles), and blow that up onto the screen with crisp pixels.

export class Game {
  readonly cam = new Camera();
  readonly fx = new Particles();
  readonly bubbles = new Bubbles();
  readonly buffer: HTMLCanvasElement;
  private bctx: CanvasRenderingContext2D;
  private sctx: CanvasRenderingContext2D;
  private draw: WorldDraw;
  entities: Entity[] = [];
  private byId = new Map<string, Entity>();
  t = 0;
  reduced = false;
  /** screen-space overlays drawn after the world (device px) */
  overlays: ((ctx: CanvasRenderingContext2D, cam: Camera, t: number) => void)[] = [];
  /** world-space overlays drawn after entities, before particles */
  worldOverlays: ((d: WorldDraw, t: number) => void)[] = [];
  readonly ctx: Ctx;
  onFrame?: (dt: number) => void;

  setGround(c: HTMLCanvasElement) {
    this.ground = c;
  }

  constructor(private screen: HTMLCanvasElement, private ground: HTMLCanvasElement) {
    this.buffer = document.createElement('canvas');
    this.buffer.width = WORLD_W;
    this.buffer.height = WORLD_H;
    this.bctx = this.buffer.getContext('2d')!;
    this.bctx.imageSmoothingEnabled = false;
    this.sctx = screen.getContext('2d', { alpha: false })!;
    this.draw = new WorldDraw(this.bctx);
    const self = this;
    this.ctx = {
      get t() { return self.t; },
      fx: this.fx,
      bubbles: this.bubbles,
      get reduced() { return self.reduced; },
      get: (id) => this.byId.get(id),
    };
  }

  add<T extends Entity>(e: T): T {
    this.entities.push(e);
    if (e.id) this.byId.set(e.id, e);
    return e;
  }

  get(id: string) {
    return this.byId.get(id);
  }

  resize() {
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const w = window.innerWidth, h = window.innerHeight;
    this.screen.width = Math.round(w * dpr);
    this.screen.height = Math.round(h * dpr);
    this.cam.resize(w, h, dpr);
  }

  frame(dt: number) {
    dt = Math.max(0, Math.min(dt, 1 / 20));
    this.t += dt;
    this.cam.update(dt);
    this.onFrame?.(dt);
    for (const e of this.entities) e.update(this.ctx, dt);
    this.fx.update(dt);
    this.bubbles.update(dt);
    this.render();
  }

  /** The world-pixel rectangle the screen currently shows. */
  view() {
    const { cam } = this;
    const s = cam.z * cam.dpr;
    const sw = this.screen.width, sh = this.screen.height;
    const ox = cam.x - sw / 2 / s, oy = cam.y - sh / 2 / s;
    return { ox, oy, s, sw, sh };
  }

  private render() {
    const { ox, oy, s, sw, sh } = this.view();
    const x0 = Math.max(0, Math.floor(ox)), y0 = Math.max(0, Math.floor(oy));
    const x1 = Math.min(WORLD_W, Math.ceil(ox + sw / s) + 1), y1 = Math.min(WORLD_H, Math.ceil(oy + sh / s) + 1);
    const b = this.bctx;
    b.drawImage(this.ground, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
    // the buffer keeps last frame's pixels outside the view; clip to it
    b.save();
    b.beginPath();
    b.rect(x0, y0, x1 - x0, y1 - y0);
    b.clip();
    this.draw.setView(x0, y0, x1, y1);
    const ground = this.entities.filter((e) => e.layer === 0 && !e.hidden);
    for (const e of ground) e.draw(this.draw, this.ctx);
    const sorted = this.entities.filter((e) => e.layer === 1 && !e.hidden).sort((a, c) => a.y + a.bias - (c.y + c.bias));
    for (const e of sorted) e.draw(this.draw, this.ctx);
    for (const e of this.entities) if (e.layer === 2 && !e.hidden) e.draw(this.draw, this.ctx);
    for (const o of this.worldOverlays) o(this.draw, this.t);
    this.fx.draw(this.draw);
    b.restore();

    const c = this.sctx;
    c.imageSmoothingEnabled = false;
    c.fillStyle = '#231b2e';
    c.fillRect(0, 0, sw, sh);
    // snap so world pixels land on device pixels
    const dx = Math.round((x0 - ox) * s), dy = Math.round((y0 - oy) * s);
    c.drawImage(this.buffer, x0, y0, x1 - x0, y1 - y0, dx, dy, Math.round((x1 - x0) * s), Math.round((y1 - y0) * s));
    for (const o of this.overlays) o(c, this.cam, this.t);
    this.bubbles.draw(c, this.cam);
  }

  /** The thing under a world point, generously, preferring important things. */
  hit(wx: number, wy: number): Entity | null {
    const minCss = 30;
    const pad = Math.min(6, Math.max(0, minCss / this.cam.z / 2 - 4));
    let best: Entity | null = null, bestScore = Infinity;
    for (const e of this.entities) {
      if (e.hidden || !e.tap) continue;
      const bx = e.hitBox();
      if (!bx) continue;
      const p = e.priority >= 5 ? pad + 2 : pad;
      if (wx < bx.x - p || wx > bx.x + bx.w + p || wy < bx.y - p || wy > bx.y + bx.h + p) continue;
      const cx = bx.x + bx.w / 2, cy = bx.y + bx.h / 2;
      const inside = wx >= bx.x && wx <= bx.x + bx.w && wy >= bx.y && wy <= bx.y + bx.h;
      // smaller, nearer, front-most, higher priority things win
      const score = Math.hypot(wx - cx, wy - cy) + (inside ? 0 : 20) - e.priority * 8 - e.y * 0.01 + Math.sqrt(bx.w * bx.h) * 0.2;
      if (score < bestScore) { bestScore = score; best = e; }
    }
    return best;
  }

  boxOf(e: Entity): Box | null {
    return e.hitBox() ?? e.bounds();
  }
}
