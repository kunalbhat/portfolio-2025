import { Bitmap } from './bitmap';
import { Color, hex, mix, shadow, sunlit } from './color';
import { P } from './palette';
import { Sprite, spriteFrom } from './people';
import { drawText } from './font';

// Vehicles drive left and right along the street. Seen from above and a
// little in front: the roof and hood catch the light, the side is the colour.

const TYRE = hex('#1e1c22');
const HUB = hex('#8a8690');
const GLASS = P.glass;

export type CarKind = 'sedan' | 'hatch' | 'van' | 'taxi' | 'wagon';

function wheel(bm: Bitmap, x: number, y: number) {
  bm.rect(x, y, 6, 3, TYRE);
  bm.hline(x + 1, y - 1, 4, TYRE);
  bm.rect(x + 2, y, 2, 1, HUB);
}

export function car(kind: CarKind, body: Color, seed = 0): Bitmap {
  const long = kind === 'van' ? 34 : kind === 'wagon' ? 33 : kind === 'hatch' ? 28 : 32;
  const bm = new Bitmap(long + 2, 17);
  const L = sunlit(body), LL = sunlit(body, 1.8), D = shadow(body, 0.6), DD = shadow(body, 1.1);
  const o = 1;
  // hood/trunk top planes and the lower body
  const cabin0 = kind === 'van' ? 4 : kind === 'hatch' ? 6 : kind === 'wagon' ? 6 : 8;
  const cabin1 = kind === 'van' ? long - 6 : kind === 'hatch' ? long - 9 : long - 9;
  // top planes (hood, trunk)
  bm.rect(o + 1, 5, long - 2, 3, L);
  bm.hline(o + 2, 4, long - 4, LL);
  // side
  bm.rect(o, 7, long, 5, body);
  bm.hline(o, 7, long, L);
  bm.hline(o, 11, long, D);
  bm.hline(o + 1, 12, long - 2, DD);
  // cabin: roof and windows
  const roofTop = kind === 'van' ? 0 : 1;
  bm.rect(o + cabin0 + 2, roofTop, cabin1 - cabin0 - 3, 2, LL);
  bm.hline(o + cabin0 + 1, roofTop + 2, cabin1 - cabin0 - 1, L);
  for (let y = roofTop + 3; y < 7; y++) {
    const k = y - roofTop - 3;
    const x0 = o + cabin0 + (kind === 'van' ? 0 : 1 - Math.min(1, k));
    const x1 = o + cabin1 + Math.min(2, k + (kind === 'van' ? 0 : 1));
    for (let x = x0; x <= x1; x++) {
      const front = x > o + cabin1 - 1;
      const g = front ? GLASS[2] : (x + y) % 7 === 0 ? GLASS[3] : GLASS[1];
      bm.px(x, y, g);
    }
  }
  // pillars
  const mid = Math.round(o + (cabin0 + cabin1) / 2);
  bm.vline(mid, roofTop + 3, 4, body);
  if (kind === 'van' || kind === 'wagon') bm.vline(o + cabin1 - 6, roofTop + 3, 4, body);
  // reflection streak
  bm.px(o + cabin0 + 3, roofTop + 3, GLASS[4]); bm.px(o + cabin0 + 4, roofTop + 4, GLASS[4]);
  // door seam + handle
  bm.vline(mid, 7, 4, D);
  bm.px(mid - 3, 8, LL); bm.px(mid + 3, 8, LL);
  // lights
  bm.rect(o + long - 1, 7, 1, 2, hex('#f6ecc0'));
  bm.rect(o, 7, 1, 2, hex('#d23a32'));
  // bumpers
  bm.hline(o + long - 3, 11, 3, P.metal[2]); bm.hline(o, 11, 3, P.metal[2]);
  wheel(bm, o + 3, 12);
  wheel(bm, o + long - 9, 12);
  if (kind === 'taxi') {
    bm.rect(mid - 3, 0, 6, 2, hex('#f2e6cc'));
    drawText(bm, '', mid - 2, 0, P.ink);
    for (let x = o + 2; x < o + long - 2; x += 2) bm.px(x, 9, (x / 2) % 2 ? P.ink : P.white);
  }
  if (seed % 3 === 0 && kind !== 'taxi' && kind !== 'van') {
    // a roof rack with something strapped on
    bm.rect(mid - 5, roofTop - 1 < 0 ? 0 : roofTop - 1, 10, 1, P.metal[1]);
  }
  bm.outline();
  return bm;
}

export function carSprite(kind: CarKind, body: Color, flip: boolean, seed = 0): Sprite {
  const bm = car(kind, body, seed);
  if (!flip) return spriteFrom(bm, Math.floor(bm.w / 2), bm.h - 1);
  const f = new Bitmap(bm.w, bm.h);
  f.blit(bm, 0, 0, true);
  return spriteFrom(f, Math.floor(bm.w / 2), bm.h - 1);
}

/** A city bus, long and white with a blue band. */
export function bus(flip: boolean): Sprite {
  const w = 66, h = 24;
  const bm = new Bitmap(w + 2, h);
  const body = hex('#e8e6e0'), L = P.white, D = hex('#b8b4ac'), band = hex('#2e5aa8'), red = hex('#c83a32');
  bm.rect(1, 1, w, 4, L); bm.hline(2, 0, w - 2, P.white);
  bm.hline(1, 4, w, D);
  bm.rect(1, 5, w, 14, body);
  // windows
  for (let x = 5; x < w - 8; x += 7) {
    bm.rect(x, 7, 5, 5, GLASS[1]); bm.px(x, 7, GLASS[3]); bm.px(x + 1, 8, GLASS[3]);
  }
  // windscreen
  bm.rect(w - 5, 6, 5, 7, GLASS[2]); bm.px(w - 4, 7, GLASS[4]);
  bm.hline(1, 14, w, band); bm.hline(1, 15, w, band); bm.hline(1, 16, w, red);
  // door
  bm.rect(w - 12, 7, 5, 11, GLASS[0]); bm.vline(w - 10, 7, 11, D);
  // route sign
  bm.rect(w - 7, 5, 6, 1, hex('#f2b43a'));
  bm.hline(1, 18, w, D);
  wheel(bm, 8, 19); wheel(bm, w - 18, 19);
  bm.outline();
  const out = flip ? (() => { const f = new Bitmap(bm.w, bm.h); f.blit(bm, 0, 0, true); return f; })() : bm;
  return spriteFrom(out, Math.floor(out.w / 2), out.h - 1);
}

/** One car of the elevated train, silver with a red and blue stripe. */
export function trainCar(front: 'left' | 'right' | 'none'): Bitmap {
  const w = 64, h = 20;
  const bm = new Bitmap(w, h);
  const roof = hex('#c8ccd2'), roofL = hex('#e4e8ea'), side = hex('#aeb3ba'), sideD = hex('#8a9098');
  bm.rect(1, 0, w - 2, 5, roof); bm.hline(2, 0, w - 4, roofL);
  for (let x = 8; x < w - 8; x += 12) bm.rect(x, 1, 5, 2, sideD);
  bm.rect(0, 5, w, 13, side);
  bm.hline(0, 5, w, roofL);
  for (let x = 0; x < w; x += 3) bm.vline(x, 6, 11, mix(side, sideD, 0.35));
  // windows and doors
  for (let x = 4; x < w - 6; x += 10) {
    bm.rect(x, 7, 6, 4, GLASS[1]); bm.px(x, 7, GLASS[3]);
  }
  bm.rect(Math.floor(w / 2) - 3, 7, 6, 10, sideD);
  bm.rect(Math.floor(w / 2) - 2, 8, 4, 4, GLASS[0]);
  bm.hline(0, 13, w, hex('#c83a32'));
  bm.hline(0, 14, w, hex('#2e5aa8'));
  bm.hline(0, 17, w, sideD);
  if (front !== 'none') {
    const x = front === 'right' ? w - 4 : 0;
    bm.rect(x, 6, 4, 6, GLASS[2]);
    bm.px(front === 'right' ? w - 1 : 0, 14, hex('#f6ecc0'));
  }
  bm.outline();
  return bm;
}

export function bicycle(color: Color, frame: number): Bitmap {
  const bm = new Bitmap(16, 10);
  const spoke = frame % 2 ? HUB : TYRE;
  for (const cx of [3.5, 12.5]) {
    bm.ellipse(cx, 6, 3.2, 3.2, TYRE);
    bm.ellipse(cx, 6, 2.2, 2.2, (x, y) => ((x + y + frame) % 2 ? spoke : 0) || undefined);
  }
  for (const cx of [3, 12]) for (let y = 4; y < 9; y++) for (let x = cx - 1; x <= cx + 2; x++) {
    const dx = x + 0.5 - (cx + 0.5), dy = y + 0.5 - 6;
    if (dx * dx + dy * dy < 4.6 && dx * dx + dy * dy > 0.4 && (x + y + frame) % 2 === 0) bm.clear(x, y);
  }
  bm.line(4, 6, 8, 6, color); bm.line(8, 6, 11, 2, color); bm.line(4, 6, 7, 2, color); bm.line(7, 2, 11, 2, color);
  bm.line(12, 6, 11, 1, color); bm.hline(10, 0, 3, P.metal[1]);
  bm.hline(6, 1, 3, hex('#2a2430'));
  return bm;
}
