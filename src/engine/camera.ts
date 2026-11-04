import { WORLD_W, WORLD_H } from '../world/layout';

// The camera looks at a point in the world (x, y) at a zoom z, measured in
// CSS pixels per world pixel. At rest the zoom settles on a whole number of
// device pixels per world pixel, so the pixel art stays perfectly crisp.

export class Camera {
  x = WORLD_W / 2;
  y = WORLD_H / 2;
  z = 1;
  vx = 0;
  vy = 0;
  viewW = 1;
  viewH = 1;
  dpr = 1;
  minZ = 0.5;
  maxZ = 8;
  private flight: null | { x0: number; y0: number; z0: number; x1: number; y1: number; z1: number; t: number; dur: number } = null;
  private zoomTarget: null | { z: number; sx: number; sy: number } = null;
  dragging = false;
  pinching = false;
  /** seconds since the camera last moved for any reason */
  still = 0;

  resize(w: number, h: number, dpr: number) {
    this.viewW = w;
    this.viewH = h;
    this.dpr = dpr;
    // whole poster fits at the minimum zoom; never so far in that a person
    // is bigger than a thumbnail
    const fit = Math.min(w / WORLD_W, h / WORLD_H);
    this.minZ = Math.max(0.2, fit * 0.96);
    this.maxZ = Math.max(6, Math.min(10, 8 * Math.min(1.25, Math.max(0.8, Math.min(w, h) / 700))));
    this.z = Math.max(this.minZ, Math.min(this.maxZ, this.z));
    this.clamp();
  }

  /** The zoom at which the world just covers the screen. */
  get coverZ() {
    return Math.max(this.viewW / WORLD_W, this.viewH / WORLD_H);
  }

  screenToWorld(sx: number, sy: number): [number, number] {
    return [this.x + (sx - this.viewW / 2) / this.z, this.y + (sy - this.viewH / 2) / this.z];
  }
  worldToScreen(wx: number, wy: number): [number, number] {
    return [(wx - this.x) * this.z + this.viewW / 2, (wy - this.y) * this.z + this.viewH / 2];
  }

  clamp() {
    const hw = this.viewW / 2 / this.z, hh = this.viewH / 2 / this.z;
    // allow a little overscroll past the edge so the poster feels like paper
    const m = 24 / this.z;
    if (hw * 2 >= WORLD_W) this.x = WORLD_W / 2;
    else this.x = Math.max(hw - m, Math.min(WORLD_W - hw + m, this.x));
    if (hh * 2 >= WORLD_H) this.y = WORLD_H / 2;
    else this.y = Math.max(hh - m, Math.min(WORLD_H - hh + m, this.y));
  }

  panBy(dxCss: number, dyCss: number) {
    this.flight = null;
    this.x -= dxCss / this.z;
    this.y -= dyCss / this.z;
    this.clamp();
    this.still = 0;
  }

  /** Zoom by a factor around a screen point, immediately. */
  zoomAt(factor: number, sx: number, sy: number) {
    this.flight = null;
    const [wx, wy] = this.screenToWorld(sx, sy);
    this.z = Math.max(this.minZ, Math.min(this.maxZ, this.z * factor));
    this.x = wx - (sx - this.viewW / 2) / this.z;
    this.y = wy - (sy - this.viewH / 2) / this.z;
    this.clamp();
    this.still = 0;
  }

  /** Ease toward a zoom level around a screen point (wheel steps, buttons). */
  zoomToward(z: number, sx = this.viewW / 2, sy = this.viewH / 2) {
    this.flight = null;
    this.zoomTarget = { z: Math.max(this.minZ, Math.min(this.maxZ, z)), sx, sy };
  }

  /** The next crisp zoom step in or out from the current zoom. */
  step(dir: 1 | -1): number {
    const s = this.z * this.dpr;
    const steps = this.crispSteps();
    if (dir > 0) return (steps.find((v) => v > s * 1.05) ?? steps[steps.length - 1]) / this.dpr;
    const lower = steps.filter((v) => v < s * 0.95);
    return (lower[lower.length - 1] ?? steps[0]) / this.dpr;
  }

  crispSteps(): number[] {
    const out: number[] = [this.minZ * this.dpr];
    for (let s = 1; s <= this.maxZ * this.dpr + 0.01; s++) if (s > this.minZ * this.dpr * 1.08) out.push(s);
    if (this.minZ * this.dpr < 1) out.splice(1, 0, ...[0.5, 0.75].filter((v) => v > this.minZ * this.dpr * 1.08));
    return out.sort((a, b) => a - b);
  }

  /** Nearest crisp zoom to the current one. */
  crispNearest(): number {
    const s = this.z * this.dpr;
    if (s < 1.5) return this.z;
    return Math.round(s) / this.dpr;
  }

  flyTo(x: number, y: number, z: number, dur = 1.1) {
    this.zoomTarget = null;
    this.vx = this.vy = 0;
    z = Math.max(this.minZ, Math.min(this.maxZ, z));
    if (dur <= 0) {
      this.x = x; this.y = y; this.z = z; this.clamp(); this.flight = null; return;
    }
    this.flight = { x0: this.x, y0: this.y, z0: this.z, x1: x, y1: y, z1: z, t: 0, dur };
  }

  get flying() {
    return !!this.flight;
  }

  update(dt: number) {
    this.still += dt;
    if (this.flight) {
      const f = this.flight;
      f.t += dt;
      const k = Math.min(1, f.t / f.dur);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      // zoom out a touch mid-flight on long trips, like a map does
      const dist = Math.hypot(f.x1 - f.x0, f.y1 - f.y0);
      const dip = Math.min(0.35, dist / 2000) * Math.sin(k * Math.PI);
      const zLog = Math.log(f.z0) + (Math.log(f.z1) - Math.log(f.z0)) * e - dip;
      this.z = Math.exp(zLog);
      this.x = f.x0 + (f.x1 - f.x0) * e;
      this.y = f.y0 + (f.y1 - f.y0) * e;
      this.clamp();
      this.still = 0;
      if (k >= 1) this.flight = null;
      return;
    }
    if (this.zoomTarget) {
      const t = this.zoomTarget;
      const k = 1 - Math.exp(-dt * 14);
      const nz = Math.exp(Math.log(this.z) + (Math.log(t.z) - Math.log(this.z)) * k);
      this.zoomAt(nz / this.z, t.sx, t.sy);
      if (Math.abs(Math.log(this.z / t.z)) < 0.002) { this.zoomAt(t.z / this.z, t.sx, t.sy); this.zoomTarget = null; }
      this.still = 0;
    }
    if (!this.dragging && (Math.abs(this.vx) > 0.5 || Math.abs(this.vy) > 0.5)) {
      this.x -= (this.vx * dt) / this.z;
      this.y -= (this.vy * dt) / this.z;
      const decay = Math.exp(-dt * 5);
      this.vx *= decay;
      this.vy *= decay;
      this.clamp();
      this.still = 0;
    } else if (!this.dragging) {
      this.vx = this.vy = 0;
    }
    // settle onto a crisp zoom once the hands are off
    if (!this.pinching && !this.zoomTarget && this.still > 0.25 && this.still < 0.3) {
      const c = this.crispNearest();
      if (Math.abs(c - this.z) > 1e-4) this.zoomToward(c, this.viewW / 2, this.viewH / 2);
    }
  }
}
