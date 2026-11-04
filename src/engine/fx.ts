import { Bitmap } from '../art/bitmap';
import { hex } from '../art/color';
import { drawText, textWidth } from '../art/font';
import { P } from '../art/palette';
import { WorldDraw } from './draw';
import { Camera } from './camera';

// Particles live in the world (confetti, leaves, steam, splashes). Speech
// bubbles are drawn over the world at a readable size, so a little "ARF!"
// stays legible even when you're zoomed all the way out.

interface Particle {
  x: number; y: number; vx: number; vy: number; g: number; drag: number;
  life: number; age: number; color: string; size: number; floor?: number; wobble?: number;
}

export class Particles {
  list: Particle[] = [];
  add(p: Partial<Particle> & { x: number; y: number; color: string }) {
    this.list.push({ vx: 0, vy: 0, g: 0, drag: 0, life: 1, age: 0, size: 1, ...p });
  }
  burst(x: number, y: number, colors: string[], n: number, speed = 60, g = 120, life = 1.4) {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
      const sp = speed * (0.4 + Math.random() * 0.8);
      this.add({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g, drag: 1.2, life: life * (0.7 + Math.random() * 0.6), color: colors[i % colors.length], floor: y + 6 + Math.random() * 10, wobble: Math.random() * 6 });
    }
  }
  update(dt: number) {
    for (const p of this.list) {
      p.age += dt;
      p.vx *= Math.exp(-p.drag * dt);
      p.vy = p.vy * Math.exp(-p.drag * dt) + p.g * dt;
      p.x += p.vx * dt + (p.wobble ? Math.sin(p.age * p.wobble) * 0.15 : 0);
      p.y += p.vy * dt;
      if (p.floor !== undefined && p.y > p.floor) { p.y = p.floor; p.vy = 0; p.vx *= 0.5; }
    }
    this.list = this.list.filter((p) => p.age < p.life);
  }
  draw(d: WorldDraw) {
    for (const p of this.list) {
      const fade = p.age > p.life * 0.75 ? Math.floor((p.age * 20) % 2) : 1;
      if (!fade) continue;
      d.rect(p.x, p.y, p.size, p.size, p.color);
    }
  }
}

interface Bubble {
  x: number; y: number; text: string; age: number; life: number; canvas: HTMLCanvasElement; follow?: () => [number, number];
}

const bubbleCache = new Map<string, HTMLCanvasElement>();
function bubbleCanvas(text: string, tone: 'say' | 'think' | 'shout'): HTMLCanvasElement {
  const key = text + tone;
  let c = bubbleCache.get(key);
  if (c) return c;
  const lines = text.split('\n');
  const tw = Math.max(...lines.map((l) => textWidth(l)));
  const w = tw + 8, h = lines.length * 7 + 5;
  const bm = new Bitmap(w + 2, h + 5);
  const bg = tone === 'shout' ? hex('#fff3c4') : P.white;
  const edge = P.ink;
  bm.rect(2, 1, w - 2, h, bg);
  bm.rect(1, 2, w, h - 2, bg);
  // outline with soft corners
  bm.hline(2, 0, w - 2, edge); bm.hline(2, h + 1, w - 2, edge);
  bm.vline(0, 2, h - 2, edge); bm.vline(w + 1, 2, h - 2, edge);
  bm.px(1, 1, edge); bm.px(w, 1, edge); bm.px(1, h, edge); bm.px(w, h, edge);
  // tail
  const tx = Math.floor(w / 2);
  if (tone === 'think') {
    bm.rect(tx, h + 2, 2, 2, bg); bm.px(tx - 1, h + 2, edge); bm.px(tx + 2, h + 2, edge); bm.px(tx, h + 4, edge); bm.px(tx + 1, h + 4, edge);
  } else {
    bm.hline(tx - 1, h + 1, 4, bg); bm.px(tx, h + 2, bg); bm.px(tx + 1, h + 2, bg); bm.px(tx, h + 3, bg);
    bm.px(tx - 2, h + 1, edge); bm.px(tx + 3, h + 1, edge); bm.px(tx - 1, h + 2, edge); bm.px(tx + 2, h + 2, edge); bm.px(tx - 1, h + 3, edge); bm.px(tx + 1, h + 3, edge); bm.px(tx, h + 4, edge);
  }
  lines.forEach((l, i) => drawText(bm, l, 1 + Math.round((w - textWidth(l)) / 2), 3 + i * 7, tone === 'shout' ? hex('#b8302a') : P.ink));
  c = bm.canvas();
  bubbleCache.set(key, c);
  return c;
}

export class Bubbles {
  list: Bubble[] = [];
  say(x: number, y: number, text: string, life = 2.2, tone: 'say' | 'think' | 'shout' = 'say', follow?: () => [number, number]) {
    // one bubble per speaker spot at a time
    this.list = this.list.filter((b) => Math.hypot(b.x - x, b.y - y) > 4);
    this.list.push({ x, y, text, age: 0, life, canvas: bubbleCanvas(text, tone), follow });
  }
  update(dt: number) {
    for (const b of this.list) {
      b.age += dt;
      if (b.follow) [b.x, b.y] = b.follow();
    }
    this.list = this.list.filter((b) => b.age < b.life);
  }
  /** Draw in screen space (device pixels). */
  draw(ctx: CanvasRenderingContext2D, cam: Camera) {
    const dpr = cam.dpr;
    // bubble pixels: never smaller than 2 css px, never bigger than 3
    const k = Math.max(2 * dpr, Math.min(3 * dpr, Math.round(cam.z * dpr)));
    for (const b of this.list) {
      const [sx, sy] = cam.worldToScreen(b.x, b.y);
      const pop = b.age < 0.12 ? 0.6 + (b.age / 0.12) * 0.4 : b.age > b.life - 0.15 ? Math.max(0, (b.life - b.age) / 0.15) : 1;
      const w = b.canvas.width * k * pop, h = b.canvas.height * k * pop;
      const x = Math.round(sx * dpr - w / 2), y = Math.round(sy * dpr - h);
      ctx.drawImage(b.canvas, x, y, Math.round(w), Math.round(h));
    }
  }
}
