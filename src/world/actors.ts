import { Look, Pose, Sprite, person } from '../art/people';
import { PropArt } from '../art/props';
import { WorldDraw, propSprite } from '../engine/draw';
import { Particles, Bubbles } from '../engine/fx';

// Everything that's drawn on top of the painted town and sorted by depth:
// props people pass behind, townsfolk, animals, traffic.

export interface Box { x: number; y: number; w: number; h: number }

export interface Ctx {
  t: number;
  fx: Particles;
  bubbles: Bubbles;
  reduced: boolean;
  get(id: string): Entity | undefined;
}

export abstract class Entity {
  x: number;
  y: number;
  /** height above the ground (jumps, flight) */
  z = 0;
  id?: string;
  /** accessible name; anything with a label can be tabbed to */
  label?: string;
  /** hit priority when things overlap */
  priority = 0;
  hidden = false;
  /** extra depth bias: positive draws later */
  bias = 0;
  /** layer 0 is drawn flat on the ground before everything sorted */
  layer: 0 | 1 | 2 = 1;
  tap?: (c: Ctx) => void;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  update(_c: Ctx, _dt: number): void {}
  abstract draw(d: WorldDraw, c: Ctx): void;
  abstract bounds(): Box;
  /** Tap target, by default the drawn bounds. */
  hitBox(): Box | null {
    return this.tap ? this.bounds() : null;
  }
}

export class Prop extends Entity {
  sprite: Sprite;
  constructor(art: PropArt | Sprite, x: number, y: number) {
    super(x, y);
    this.sprite = 'bm' in art ? propSprite(art) : art;
  }
  draw(d: WorldDraw) {
    if (!this.hidden) d.sprite(this.sprite, this.x, this.y - this.z);
  }
  bounds(): Box {
    const s = this.sprite;
    return { x: this.x - s.ax, y: this.y - s.ay - this.z, w: s.w, h: s.h };
  }
}

/** Anything bespoke: give it update/draw/bounds inline. */
export class Custom extends Entity {
  constructor(
    x: number, y: number,
    private fns: { update?: (self: Custom, c: Ctx, dt: number) => void; draw: (self: Custom, d: WorldDraw, c: Ctx) => void; bounds: (self: Custom) => Box },
    public state: Record<string, any> = {},
  ) {
    super(x, y);
  }
  update(c: Ctx, dt: number) { this.fns.update?.(this, c, dt); }
  draw(d: WorldDraw, c: Ctx) { if (!this.hidden) this.fns.draw(this, d, c); }
  bounds() { return this.fns.bounds(this); }
}

type Step =
  | { kind: 'wait'; t: number }
  | { kind: 'pose'; pose: Pose; t: number; flip?: boolean }
  | { kind: 'walk'; x: number; y: number; speed?: number; run?: boolean }
  | { kind: 'hop'; h?: number }
  | { kind: 'say'; text: string; t?: number; tone?: 'say' | 'think' | 'shout' }
  | { kind: 'do'; fn: (p: Person, c: Ctx) => void };

const ICONS = ['!', '?', '♥', '♪', ':)', 'HI!', 'OH!', 'HM?', '...'];

export class Person extends Entity {
  look: Look;
  pose: Pose;
  basePose: Pose;
  flip: boolean;
  shadowW: number;
  /** idle loop of poses and how long to hold each */
  idle: [Pose, number, boolean?][] | null = null;
  private idleI = 0;
  private idleT = 0;
  route: { pts: [number, number][]; speed: number; loop: boolean; pause: number } | null = null;
  private routeI = 1;
  private routeDir = 1;
  private pauseT = 0;
  script: Step[] = [];
  private stepT = 0;
  private hopT = -1;
  private hopH = 4;
  private walkT = 0;
  moving = false;
  lines: string[] | null = null;
  private lineI = 0;
  /** an item drawn above the head: a pigeon, a balloon... */
  extra?: (d: WorldDraw, p: Person, c: Ctx) => void;
  seated = false;
  state: Record<string, any> = {};

  constructor(look: Look, x: number, y: number, pose: Pose = 'stand', flip = false) {
    super(x, y);
    this.look = look;
    this.pose = pose;
    this.basePose = pose;
    this.flip = flip;
    this.shadowW = look.kid ? 6 : 8;
    this.seated = pose === 'sit' || pose === 'sitBack' || pose === 'sitSide' || pose.startsWith('swing');
    this.tap = (c) => this.react(c);
  }

  get sprite(): Sprite {
    if (!this.pose) this.pose = this.basePose ?? 'stand';
    return person(this.look, this.pose, this.flip);
  }

  say(c: Ctx, text: string, life = 2, tone: 'say' | 'think' | 'shout' = 'say') {
    c.bubbles.say(this.x, this.y - this.height() - 2, text, life, tone, () => [this.x, this.y - this.height() - 2 - this.z]);
  }
  height() {
    return this.look.kid ? 12 : 16;
  }

  /** The default reaction to being tapped: a hop and a little remark. */
  react(c: Ctx) {
    this.hop();
    if (this.lines && this.lines.length) {
      this.say(c, this.lines[this.lineI % this.lines.length], 2.4);
      this.lineI++;
    } else {
      this.say(c, ICONS[Math.floor(Math.random() * ICONS.length)], 1.2);
    }
  }

  hop(h = 4) {
    if (this.hopT < 0) { this.hopT = 0; this.hopH = h; }
  }

  run(steps: Step[]) {
    this.script.push(...steps);
  }

  update(c: Ctx, dt: number) {
    if (this.hopT >= 0) {
      this.hopT += dt;
      const k = this.hopT / 0.32;
      this.z = k >= 1 ? 0 : Math.sin(k * Math.PI) * this.hopH;
      if (k >= 1) this.hopT = -1;
    }
    this.moving = false;
    if (this.script.length) { this.runScript(c, dt); return; }
    if (this.route && !c.reduced) { this.followRoute(dt); return; }
    if (this.idle && !c.reduced) {
      this.idleT += dt;
      const [p, d, f] = this.idle[this.idleI % this.idle.length];
      this.pose = p;
      if (f !== undefined) this.flip = f;
      if (this.idleT > d) { this.idleT = 0; this.idleI++; }
    }
  }

  private runScript(c: Ctx, dt: number) {
    const s = this.script[0];
    this.stepT += dt;
    const next = () => { this.script.shift(); this.stepT = 0; };
    switch (s.kind) {
      case 'wait': if (this.stepT >= s.t) next(); break;
      case 'pose':
        this.pose = s.pose;
        if (s.flip !== undefined) this.flip = s.flip;
        if (this.stepT >= s.t) next();
        break;
      case 'walk': {
        const sp = (s.speed ?? 22) * dt;
        const arrived = this.stepToward(s.x, s.y, sp);
        if (arrived) { next(); this.pose = this.basePose === 'sit' ? 'stand' : this.pose.startsWith('walk') ? 'side' : this.pose; }
        break;
      }
      case 'hop': this.hop(s.h); next(); break;
      case 'say': this.say(c, s.text, s.t ?? 2, s.tone); next(); break;
      case 'do': s.fn(this, c); next(); break;
    }
  }

  /** Move toward a point; returns true on arrival. */
  stepToward(tx: number, ty: number, sp: number): boolean {
    const dx = tx - this.x, dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= sp) { this.x = tx; this.y = ty; return true; }
    this.x += (dx / dist) * sp;
    this.y += (dy / dist) * sp;
    this.moving = true;
    this.walkT += sp;
    if (Math.abs(dx) > Math.abs(dy) * 0.6) {
      this.flip = dx < 0;
      const f = Math.floor(this.walkT / 3) % 4;
      this.pose = (['walk0', 'walk1', 'walk2', 'walk1'] as Pose[])[f];
    } else {
      this.pose = dy < 0 ? 'back' : 'stand';
      this.z = Math.floor(this.walkT / 3) % 2 ? 1 : 0;
    }
    return false;
  }

  private followRoute(dt: number) {
    const r = this.route!;
    if (this.pauseT > 0) {
      this.pauseT -= dt;
      this.pose = 'side';
      if (this.pauseT <= 0 && this.idle) this.pose = this.idle[0][0];
      return;
    }
    const [tx, ty] = r.pts[this.routeI];
    if (this.stepToward(tx, ty, r.speed * dt)) {
      if (r.loop) this.routeI = (this.routeI + 1) % r.pts.length;
      else {
        if (this.routeI + this.routeDir >= r.pts.length || this.routeI + this.routeDir < 0) { this.routeDir *= -1; this.pauseT = r.pause; }
        this.routeI += this.routeDir;
      }
    }
  }

  draw(d: WorldDraw, c: Ctx) {
    if (this.hidden) return;
    if (!this.seated) d.shadow(this.x, this.y, this.shadowW);
    const s = this.sprite;
    d.sprite(s, this.x, this.y - Math.round(this.z));
    this.extra?.(d, this, c);
  }

  bounds(): Box {
    const s = this.sprite;
    return { x: this.x - s.ax, y: this.y - s.ay - this.z, w: s.w, h: s.h };
  }
}

/** A generic animal that cycles frames and can wander a route. */
export class Critter extends Entity {
  frame = 0;
  flip = false;
  route: [number, number][] | null = null;
  speed = 20;
  private ri = 0;
  private ft = 0;
  constructor(public frames: (flip: boolean, i: number, moving: boolean) => Sprite, x: number, y: number, public shadowW = 8) {
    super(x, y);
  }
  moving = false;
  update(c: Ctx, dt: number) {
    this.ft += dt;
    this.moving = false;
    if (this.route && !c.reduced) {
      const [tx, ty] = this.route[this.ri];
      const dx = tx - this.x, dy = ty - this.y, dist = Math.hypot(dx, dy);
      const sp = this.speed * dt;
      if (dist <= sp) { this.x = tx; this.y = ty; this.ri = (this.ri + 1) % this.route.length; }
      else { this.x += (dx / dist) * sp; this.y += (dy / dist) * sp; this.flip = dx < 0; this.moving = true; }
    }
    this.frame = Math.floor(this.ft * (this.moving ? 8 : 2));
  }
  draw(d: WorldDraw) {
    if (this.hidden) return;
    if (this.shadowW) d.shadow(this.x, this.y, this.shadowW);
    d.sprite(this.frames(this.flip, this.frame, this.moving), this.x, this.y - Math.round(this.z));
  }
  bounds(): Box {
    const s = this.frames(this.flip, this.frame, this.moving);
    return { x: this.x - s.ax, y: this.y - s.ay - this.z, w: s.w, h: s.h };
  }
}

/** A tappable region with no drawing of its own (a window, a sign). */
export class Hotspot extends Entity {
  constructor(public box: Box, label: string, tap: (c: Ctx) => void, priority = 1) {
    super(box.x + box.w / 2, box.y + box.h);
    this.label = label;
    this.tap = tap;
    this.priority = priority;
    this.layer = 0;
  }
  draw() {}
  bounds() { return this.box; }
}
