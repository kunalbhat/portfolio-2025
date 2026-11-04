import { Bitmap } from '../art/bitmap';
import { Color, hex, mix, shadow, sunlit } from '../art/color';
import { P } from '../art/palette';
import { bayer, noise2, rng } from '../art/rng';
import { drawText, drawTextCentered } from '../art/font';
import { Look, personGrid } from '../art/people';
import { FACADE_BASE, TRACK, WORLD_W } from './layout';

// The row of buildings along the north side of the street. Each is drawn as
// a roof (seen from above) and a facade (seen from the front), with a sharp
// cornice between them, like a little cardboard model of the block.

type Material = 'brick' | 'brickTan' | 'greystone' | 'modern' | 'stucco' | 'siding' | 'brickRed';

export interface Spot { x: number; y: number; w: number; h: number }

/** Places the scene needs to know about once the buildings are painted. */
export const SPOTS: Record<string, Spot> = {};

const pick = (ramp: number[], v: number) => ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor(v * ramp.length)))];

function wall(bm: Bitmap, x0: number, y0: number, w: number, h: number, mat: Material, seed: number, ramp?: number[]) {
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++) {
      const lx = x - x0, ly = y - y0;
      let c: Color;
      switch (mat) {
        case 'brick':
        case 'brickTan':
        case 'brickRed': {
          const r = ramp ?? (mat === 'brickTan' ? P.brickTan : P.brick);
          const row = Math.floor(ly / 3);
          const off = row % 2 ? 3 : 0;
          const mortar = ly % 3 === 2 || (lx + off) % 6 === 5;
          const brickId = Math.floor((lx + off) / 6) * 31 + row * 17;
          let v = 0.5 + (noise2(brickId, seed, 7) - 0.5) * 0.35 + (noise2(x, y, seed) - 0.5) * 0.08;
          if (noise2(brickId, seed, 8) < 0.06) v -= 0.25;
          c = mortar ? mix(r[1], P.concrete[1], 0.35) : pick(r, v);
          break;
        }
        case 'greystone': {
          const row = Math.floor(ly / 6);
          const off = row % 2 ? 7 : 0;
          const seam = ly % 6 === 5 || (lx + off) % 14 === 13;
          const v = 0.55 + (noise2(Math.floor((lx + off) / 14), row, seed) - 0.5) * 0.18 + (noise2(x, y, seed) - 0.5) * 0.14;
          c = seam ? P.greystone[1] : pick(P.greystone, v);
          break;
        }
        case 'modern': {
          const seam = lx % 18 === 17 || ly % 22 === 21;
          c = seam ? P.charcoal[1] : pick(P.charcoal, 0.62 + (noise2(x, y, seed) - 0.5) * 0.08);
          break;
        }
        case 'stucco': {
          const r = ramp ?? P.stucco;
          c = pick(r, 0.55 + (noise2(x, y, seed) - 0.5) * 0.25 + (bayer(x, y) - 0.5) * 0.1);
          break;
        }
        case 'siding': {
          const r = ramp ?? P.stucco;
          const edge = ly % 4 === 3;
          c = edge ? r[0] : pick(r, 0.6 + (noise2(x, Math.floor(ly / 4), seed) - 0.5) * 0.1 - (ly % 4) * 0.04);
          break;
        }
      }
      // weathering: a little darker toward the street and at the edges
      if (lx === 0) c = sunlit(c, 0.5);
      if (lx === w - 1) c = shadow(c, 0.5);
      bm.px(x, y, c);
    }
}

function roof(bm: Bitmap, x0: number, y0: number, w: number, d: number, seed: number, coping: Color) {
  for (let y = y0; y < y0 + d; y++)
    for (let x = x0; x < x0 + w; x++) {
      let v = 0.5 + (noise2(x, y, seed + 300) - 0.5) * 0.3 + (bayer(x, y) - 0.5) * 0.15;
      if (noise2(x >> 3, y >> 3, seed) < 0.15) v -= 0.12;
      bm.px(x, y, pick(P.roofTar, v));
    }
  // parapet coping: back and sides thin, front lip thicker and catching sun
  bm.hline(x0, y0, w, coping);
  bm.hline(x0, y0 + 1, w, shadow(coping, 0.5));
  bm.vline(x0, y0, d, sunlit(coping));
  bm.vline(x0 + 1, y0 + 1, d - 1, shadow(coping, 0.3));
  bm.vline(x0 + w - 1, y0, d, shadow(coping, 0.4));
  bm.hline(x0, y0 + d - 3, w, sunlit(coping, 0.8));
  bm.hline(x0, y0 + d - 2, w, coping);
  // shadow of the parapet on the roof
  bm.hline(x0 + 2, y0 + 2, w - 3, shadow(bm.get(x0 + 3, y0 + 3), 0.4));
}

function cornice(bm: Bitmap, x0: number, y: number, w: number, c: Color, dentils = true) {
  bm.hline(x0 - 1, y, w + 2, sunlit(c, 1.2));
  bm.hline(x0 - 1, y + 1, w + 2, c);
  bm.hline(x0 - 1, y + 2, w + 2, shadow(c, 0.5));
  if (dentils) for (let x = x0; x < x0 + w; x += 3) { bm.px(x, y + 3, shadow(c, 0.3)); bm.px(x + 1, y + 3, c); }
  bm.hline(x0, y + 4, w, shadow(bm.get(x0 + 2, y + 6) || c, 0.6));
}

interface WinOpts {
  frame?: Color;
  lit?: boolean;
  curtain?: Color;
  blinds?: boolean;
  plant?: boolean;
  bust?: Look;
  cat?: boolean;
  sill?: Color;
  lintel?: Color;
  panes?: 'cross' | 'two' | 'none';
  dark?: boolean;
}

function windowAt(bm: Bitmap, x: number, y: number, w: number, h: number, o: WinOpts = {}) {
  const frame = o.frame ?? P.white;
  // lintel and sill
  if (o.lintel !== 0) { bm.hline(x - 1, y - 2, w + 2, o.lintel ?? P.greystone[3]); bm.hline(x - 1, y - 1, w + 2, shadow(o.lintel ?? P.greystone[3], 0.4)); }
  bm.rect(x, y, w, h, frame);
  // glass: sky reflected at the top and a diagonal glint, interior below
  for (let j = 1; j < h - 1; j++)
    for (let i = 1; i < w - 1; i++) {
      const t = j / h;
      let c = o.lit ? (t < 0.3 ? P.glow[2] : P.glow[1]) : t < 0.35 ? P.glass[2] : t < 0.6 ? P.glass[1] : P.glass[0];
      if (o.dark) c = t < 0.3 ? P.glass[1] : P.glass[0];
      const g = (i + j) % 9;
      if (!o.lit && (g === 0 || g === 1) && t < 0.7) c = P.glass[3];
      bm.px(x + i, y + j, c);
    }
  if (o.bust) {
    const g = personGrid(o.bust, 'stand');
    const rows = g.slice(1, Math.min(g.length, h - 1)).map((r) => r.join(''));
    const tmp = new Bitmap(10, rows.length + 2);
    tmp.stamp(rows, 1, 1, bustPalette(o.bust));
    tmp.outline();
    for (let j = 0; j < tmp.h; j++)
      for (let i = 0; i < tmp.w; i++) {
        const px = x + Math.floor(w / 2) - 5 + i, py = y + 2 + j;
        if (px > x && px < x + w - 1 && py > y && py < y + h - 1) bm.px(px, py, tmp.get(i, j));
      }
  }
  if (o.cat) {
    const cx = x + 2, cy = y + h - 6;
    bm.stamp(['O.O..', 'OOO..', 'EoOO.', 'OOOOO'], cx, cy, { O: hex('#d8783a'), o: hex('#a85a28'), E: hex('#d8e84a') });
  }
  if (o.curtain) {
    bm.vline(x + 1, y + 1, h - 2, o.curtain); bm.vline(x + 2, y + 1, Math.floor(h * 0.6), o.curtain);
    bm.vline(x + w - 2, y + 1, h - 2, shadow(o.curtain, 0.4)); bm.vline(x + w - 3, y + 1, Math.floor(h * 0.6), shadow(o.curtain, 0.4));
    bm.hline(x + 1, y + 1, w - 2, shadow(o.curtain, 0.2));
  }
  if (o.blinds) for (let j = 2; j < h * 0.5; j += 2) bm.hline(x + 1, y + j, w - 2, P.paper);
  const panes = o.panes ?? 'cross';
  if (panes !== 'none') {
    bm.hline(x + 1, y + Math.floor(h / 2), w - 2, frame);
    if (panes === 'cross') bm.vline(x + Math.floor(w / 2), y + 1, h - 2, frame);
  }
  bm.vline(x + w - 1, y, h, shadow(frame, 0.4));
  // sill
  const sill = o.sill ?? P.greystone[4];
  bm.hline(x - 1, y + h, w + 2, sill);
  bm.hline(x - 1, y + h + 1, w + 2, shadow(sill, 0.6));
  if (o.plant) {
    for (let i = 0; i < w; i++) {
      const hh = 1 + (noise2(x + i, y, 5) * 3) | 0;
      for (let k = 0; k < hh; k++) bm.px(x + i, y + h - 1 - k, k === hh - 1 && noise2(i, y, 6) < 0.4 ? hex('#e0584a') : P.leafGreen[2 + (k % 2)]);
    }
    bm.hline(x, y + h - 1, w, hex('#a8502a'));
  }
}

function bustPalette(look: Look) {
  const skin = P.skin[look.skin], top = P.cloth[look.top], hair = P.hair[look.hair];
  const hat = P.cloth[look.hat ?? look.top];
  return { H: hair, S: skin[1], s: skin[0], E: hex('#1c1418'), T: top[1], t: top[0], u: top[2], P: top[1], p: top[0], F: top[0], C: hat[1], c: hat[0], G: hex('#2a2430'), g: P.metal[1], X: P.white, Y: P.white, W: P.white };
}

interface AwningOpts { a: Color; b: Color; depth?: number; scallop?: boolean }

function awning(bm: Bitmap, x: number, y: number, w: number, o: AwningOpts) {
  const d = o.depth ?? 8;
  for (let j = 0; j < d; j++)
    for (let i = 0; i < w; i++) {
      const stripe = Math.floor(i / 4) % 2 === 0;
      let c = stripe ? o.a : o.b;
      c = j < 2 ? sunlit(c, 0.9) : j > d - 3 ? shadow(c, 0.25) : c;
      bm.px(x + i, y + j, c);
    }
  // valance
  for (let i = 0; i < w; i++) {
    const stripe = Math.floor(i / 4) % 2 === 0;
    const c = shadow(stripe ? o.a : o.b, 0.35);
    bm.px(x + i, y + d, c);
    if (o.scallop !== false && i % 4 !== 3) bm.px(x + i, y + d + 1, c);
  }
  // shadow it throws on the wall below
  for (let j = 0; j < 4; j++) for (let i = 1; i < w; i++) if (j < 2 || bayer(x + i, y + j) < 0.5) bm.shade(x + i, y + d + 2 + j, 0.7);
}

function signBoard(bm: Bitmap, x: number, y: number, w: number, h: number, bg: Color, fg: Color, text: string, border?: Color) {
  bm.rect(x, y, w, h, bg);
  if (border) { bm.hline(x, y, w, border); bm.hline(x, y + h - 1, w, border); bm.vline(x, y, h, border); bm.vline(x + w - 1, y, h, border); }
  bm.hline(x + 1, y + h, w - 1, shadow(bg, 1));
  drawTextCentered(bm, text, x + w / 2, y + Math.floor((h - 5) / 2), fg);
}

function door(bm: Bitmap, x: number, y: number, w: number, h: number, c: Color, glass = true) {
  bm.rect(x, y, w, h, c);
  bm.vline(x, y, h, sunlit(c));
  bm.vline(x + w - 1, y, h, shadow(c, 0.6));
  if (glass) bm.rect(x + 2, y + 2, w - 4, Math.floor(h * 0.45), P.glass[1]);
  bm.px(x + w - 3, y + Math.floor(h * 0.6), P.glow[3]);
}

function roofBox(bm: Bitmap, x: number, y: number, w: number, d: number, h: number, c: Color) {
  // a box on the roof: top face (lit) + front face, with its shadow to the right
  for (let j = 0; j < h + 2; j++) for (let i = 0; i < 4; i++) bm.shade(x + w + i, y + d - 2 + j - i, 0.8);
  bm.rect(x, y, w, d, sunlit(c, 0.8));
  bm.rect(x, y + d, w, h, c);
  bm.hline(x, y + d, w, sunlit(c, 0.3));
  bm.vline(x + w - 1, y, d + h, shadow(c, 0.5));
}

function acUnit(bm: Bitmap, x: number, y: number) {
  roofBox(bm, x, y, 12, 6, 6, P.metal[3]);
  bm.ellipse(x + 6, y + 3, 3.4, 2.2, P.metal[1]);
  bm.ellipse(x + 6, y + 3, 2, 1.2, P.metal[2]);
  for (let i = 1; i < 11; i += 2) bm.vline(x + i, y + 7, 4, P.metal[2]);
}

function chimney(bm: Bitmap, x: number, y: number, c: Color) {
  roofBox(bm, x, y, 7, 4, 10, c);
  bm.rect(x + 1, y + 1, 5, 2, P.ink);
}

function skylight(bm: Bitmap, x: number, y: number, w: number, d: number) {
  roofBox(bm, x, y, w, d, 2, P.metal[2]);
  bm.rect(x + 1, y + 1, w - 2, d - 2, P.glass[2]);
  bm.line(x + 1, y + d - 2, x + w - 3, y + 1, P.glass[4]);
}

function solarPanels(bm: Bitmap, x: number, y: number, n: number) {
  for (let k = 0; k < n; k++) {
    const px = x + k * 13;
    bm.rect(px, y, 11, 8, hex('#2a3a6a'));
    for (let j = 0; j < 8; j += 2) bm.hline(px, y + j, 11, hex('#3a4e86'));
    for (let i = 0; i < 11; i += 4) bm.vline(px + i, y, 8, hex('#4a5e96'));
    bm.hline(px, y + 8, 11, P.metal[2]);
    bm.hline(px, y + 9, 11, shadow(P.roofTar[1], 0.8));
  }
}

function waterTower(bm: Bitmap, x: number, y: number) {
  // legs
  const leg = P.steel[1];
  bm.vline(x + 2, y + 18, 14, leg); bm.vline(x + 16, y + 18, 14, leg);
  bm.vline(x + 6, y + 20, 12, shadow(leg)); bm.vline(x + 12, y + 20, 12, shadow(leg));
  bm.line(x + 2, y + 22, x + 16, y + 30, leg); bm.line(x + 16, y + 22, x + 2, y + 30, leg);
  // tank: vertical cedar staves with steel hoops
  for (let j = 0; j < 18; j++)
    for (let i = 0; i < 19; i++) {
      const t = i / 18;
      let c = pick(P.wood, 0.85 - t * 0.7 + (i % 3 === 0 ? -0.1 : 0));
      if (j % 6 === 4) c = P.metal[1];
      bm.px(x + i, y + 4 + j, c);
    }
  // conical roof
  for (let j = 0; j < 6; j++) {
    const half = 2 + j * 1.5;
    for (let i = -half; i <= half; i++) bm.px(Math.round(x + 9 + i), y - 1 + j, i < 0 ? P.roof[3] : P.roof[1]);
  }
  bm.px(x + 9, y - 2, P.roof[0]);
  // shadow to the right
  for (let j = 0; j < 30; j++) for (let i = 0; i < 6; i++) if (bayer(i, j) < 0.6) bm.shade(x + 20 + i, y + 6 + j, 0.7);
}

function stringLights(bm: Bitmap, x0: number, y0: number, x1: number, y1: number, sag: number) {
  const n = Math.abs(x1 - x0);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = Math.round(x0 + (x1 - x0) * t);
    const y = Math.round(y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag);
    bm.px(x, y, P.ink);
    if (i % 5 === 2) bm.px(x, y + 1, [P.glow[3], hex('#f2a0b6'), hex('#9ad0e0')][(i / 5) % 3 | 0]);
  }
}

function pottedPlant(bm: Bitmap, x: number, y: number, c: Color = P.leafGreen[3]) {
  bm.rect(x, y + 3, 4, 3, hex('#b0583a')); bm.hline(x, y + 3, 4, hex('#d0784a'));
  bm.ellipse(x + 2, y + 2, 2.6, 2.2, (xx, yy) => ((xx + yy) % 3 ? c : shadow(c, 0.5)));
}

function backPorch(bm: Bitmap, x: number, yTop: number, yBottom: number, w = 30) {
  // the wooden back-porch stair towers that line every Chicago alley
  const post = P.wood[2], rail = P.wood[3], dark = P.wood[0];
  const levels = Math.floor((yBottom - yTop) / 16);
  for (let k = 0; k < levels; k++) {
    const y = yTop + k * 16;
    bm.rect(x, y, w, 3, rail); bm.hline(x, y, w, P.wood[4]);
    for (let i = 0; i < w; i += 3) bm.vline(x + i, y + 3, 7, post);
    bm.hline(x, y + 10, w, dark);
    bm.line(x + 3, y + 15, x + w - 6, y + 3, P.wood[1]);
  }
  bm.vline(x, yTop, yBottom - yTop, post); bm.vline(x + w - 1, yTop, yBottom - yTop, dark);
}

// ---- the L ---------------------------------------------------------------

export function paintTrack(bm: Bitmap) {
  const { deckTop, deckBottom, fasciaBottom } = TRACK;
  const steel = hex('#3e4a44'), steelL = hex('#56665c'), steelD = hex('#2a332e');
  // columns down into the alley (most hidden by the buildings later)
  for (let x = 20; x < WORLD_W; x += 96) {
    bm.rect(x, fasciaBottom, 4, 100, steel); bm.vline(x, fasciaBottom, 100, steelL); bm.vline(x + 3, fasciaBottom, 100, steelD);
    bm.line(x + 4, fasciaBottom + 2, x + 18, fasciaBottom + 16, steel);
    bm.line(x - 1, fasciaBottom + 2, x - 15, fasciaBottom + 16, steel);
    for (let j = 0; j < 40; j++) for (let i = 0; i < 5; i++) if (bayer(i, j) < 0.6) bm.shade(x + 5 + i, fasciaBottom + 60 + j, 0.6);
  }
  // deck: ties and two pairs of rails
  for (let y = deckTop; y < deckBottom; y++)
    for (let x = 0; x < WORLD_W; x++) {
      const tie = x % 4 < 2;
      let c = tie ? P.wood[1] : hex('#2a2628');
      if (y === deckTop || y === deckBottom - 1) c = steelL;
      bm.px(x, y, c);
    }
  for (const ry of [deckTop + 3, deckTop + 6, deckTop + 9, deckTop + 12]) bm.hline(0, ry, WORLD_W, P.metal[3]);
  // girder fascia with rivets
  for (let y = deckBottom; y < fasciaBottom; y++)
    for (let x = 0; x < WORLD_W; x++) {
      let c = y === deckBottom ? steelL : y === fasciaBottom - 1 ? steelD : steel;
      if ((y === deckBottom + 2 || y === fasciaBottom - 3) && x % 5 === 0) c = steelL;
      if (x % 24 === 0) c = steelD;
      bm.px(x, y, c);
    }
  // its shadow on the alley
  for (let y = fasciaBottom; y < fasciaBottom + 6; y++) for (let x = 0; x < WORLD_W; x++) if (y < fasciaBottom + 3 || bayer(x, y) < 0.5) bm.shade(x, y, 0.8);
  // above the track, the backs of the next street over
  for (let y = 0; y < deckTop; y++) for (let x = 0; x < WORLD_W; x++) bm.px(x, y, pick(P.roof, 0.3 + noise2(x >> 2, y, 4) * 0.4));
  bm.hline(0, deckTop - 1, WORLD_W, P.roof[0]);
}

// ---- the block ------------------------------------------------------------

export function paintBuildings(bm: Bitmap) {
  const base = FACADE_BASE;
  alleyLife(bm);

  // 1. brick three-flat with a bay
  {
    const x = 0, w = 128, top = 108, d = 34, f = top + d;
    backPorch(bm, x + 70, top - 34, top + 2);
    roof(bm, x, top, w, d, 1, P.brick[3]);
    chimney(bm, x + 12, top + 6, P.brick[2]);
    // roof deck with tomatoes and a folding chair
    bm.rect(x + 40, top + 10, 34, 16, P.wood[3]);
    for (let i = 0; i < 34; i += 3) bm.vline(x + 40 + i, top + 10, 16, P.wood[2]);
    for (const px of [x + 42, x + 50, x + 66]) pottedPlant(bm, px, top + 8, P.leafGreen[3]);
    bm.px(x + 44, top + 9, hex('#e0402e')); bm.px(x + 52, top + 10, hex('#e0402e'));
    bm.stamp(['GGGGG', 'G...G', 'GGGGG', '.G.G.'], x + 56, top + 16, { G: hex('#3f8a56') });
    wall(bm, x, f, w, base - f, 'brick', 1);
    cornice(bm, x, f, w, P.brick[4]);
    // bay window column (projects a little: lit left face, shaded right)
    const bx = x + 46, bw = 36;
    for (let y = f + 6; y < base - 30; y++) { bm.px(bx - 1, y, P.brick[4]); bm.px(bx + bw, y, P.brick[0]); }
    const floors = [f + 12, f + 54, f + 96];
    floors.forEach((fy, k) => {
      windowAt(bm, x + 12, fy, 12, 22, { curtain: k === 1 ? hex('#e0d080') : undefined, plant: k === 2 });
      windowAt(bm, bx + 3, fy, 10, 22, { blinds: k === 0 });
      windowAt(bm, bx + 15, fy, 8, 22, { bust: k === 1 ? undefined : undefined, lit: k === 2 });
      windowAt(bm, bx + 25, fy, 9, 22, { curtain: k === 0 ? hex('#c45a86') : undefined });
      windowAt(bm, x + 100, fy, 12, 22, { cat: k === 2, dark: k === 0 });
    });
    SPOTS.waveWindow = { x: x + 100, y: f + 54, w: 12, h: 22 };
    // garden-level door and steps
    door(bm, x + 16, base - 26, 10, 22, hex('#2e4a6a'));
    stoopSteps(bm, x + 12, base - 6, 18, 6, P.greystone[3]);
    windowAt(bm, bx + 6, base - 22, 24, 12, { dark: true, sill: P.greystone[3], panes: 'two' });
  }

  // 2. the café
  {
    const x = 128, w = 156, top = 150, d = 36, f = top + d;
    roof(bm, x, top, w, d, 2, P.brickTan[4]);
    acUnit(bm, x + 10, top + 8);
    chimney(bm, x + 132, top + 6, P.brickTan[2]);
    stringLights(bm, x + 40, top + 8, x + 120, top + 10, 4);
    stringLights(bm, x + 40, top + 22, x + 120, top + 24, 3);
    for (const px of [x + 44, x + 70, x + 96]) pottedPlant(bm, px, top + 14, P.leafGold[3]);
    bm.rect(x + 56, top + 16, 10, 6, P.wood[3]); bm.rect(x + 82, top + 16, 10, 6, P.wood[3]);
    wall(bm, x, f, w, base - f, 'brickTan', 2);
    cornice(bm, x, f, w, P.brickTan[4]);
    for (const wx of [x + 16, x + 52, x + 90, x + 126]) windowAt(bm, wx, f + 14, 14, 22, { lintel: P.brickTan[4], sill: P.brickTan[4], curtain: wx === x + 52 ? hex('#7ac0c8') : undefined, plant: wx === x + 126 });
    SPOTS.cafeUpstairs = { x: x + 90, y: f + 14, w: 14, h: 22 };
    // shopfront
    const sy = base - 54;
    bm.rect(x + 4, sy, w - 8, 54, hex('#2f5a52'));
    bm.hline(x + 4, sy, w - 8, hex('#4a7a70'));
    signBoard(bm, x + 30, sy + 3, 96, 9, hex('#f2e6cc'), hex('#2f5a52'), 'BEAN THERE  COFFEE');
    // big windows with the counter inside
    for (const [wx, ww] of [[x + 8, 58], [x + 90, 58]] as const) {
      bm.rect(wx, sy + 22, ww, 28, P.glow[1]);
      bm.rect(wx, sy + 22, ww, 9, P.glow[2]);
      // back shelves, mugs, a chalkboard
      for (let i = 4; i < ww - 4; i += 3) bm.px(wx + i, sy + 25, i % 2 ? P.white : hex('#c83a32'));
      bm.hline(wx + 2, sy + 27, ww - 4, P.wood[1]);
      bm.rect(wx + 2, sy + 38, ww - 4, 10, P.wood[2]); bm.hline(wx + 2, sy + 38, ww - 4, P.wood[4]);
      for (let i = 0; i < ww; i++) if ((i + 3) % 11 < 2) bm.vline(wx + i, sy + 22, 28, mix(P.glow[3], P.white, 0.5));
      bm.rect(wx - 1, sy + 21, ww + 2, 1, hex('#1f3e38'));
      bm.rect(wx - 1, sy + 50, ww + 2, 2, hex('#1f3e38'));
    }
    SPOTS.cafeCounter = { x: x + 90, y: sy + 22, w: 58, h: 28 };
    SPOTS.cafeWindowL = { x: x + 8, y: sy + 22, w: 58, h: 28 };
    bm.rect(x + 22, sy + 30, 12, 7, hex('#2a2a2a'));
    drawText(bm, 'BREW', x + 23, sy + 31, P.white);
    // espresso machine
    bm.rect(x + 112, sy + 32, 14, 6, P.metal[3]); bm.hline(x + 112, sy + 32, 14, P.metal[4]); bm.px(x + 116, sy + 37, P.ink);
    door(bm, x + 70, sy + 18, 16, 34, hex('#2f5a52'));
    awning(bm, x + 6, sy + 12, w - 12, { a: hex('#2f6c64'), b: hex('#f2e6cc'), depth: 8 });
    // a chalkboard A-frame out front
    bm.rect(x + 66, base + 2, 9, 11, P.wood[2]); bm.rect(x + 67, base + 3, 7, 8, hex('#2a2a2a'));
    bm.hline(x + 68, base + 5, 4, P.white); bm.hline(x + 68, base + 7, 5, hex('#f2b43a')); bm.hline(x + 68, base + 9, 3, P.white);
    SPOTS.chalkboard = { x: x + 66, y: base + 2, w: 9, h: 11 };
  }

  // 3. the studio
  {
    const x = 284, w = 172, top = 114, d = 34, f = top + d;
    roof(bm, x, top, w, d, 3, P.charcoal[4]);
    solarPanels(bm, x + 10, top + 8, 5);
    acUnit(bm, x + 84, top + 12);
    skylight(bm, x + 118, top + 8, 20, 12);
    // satellite dish
    bm.ellipse(x + 152, top + 14, 5, 4, P.metal[3]); bm.ellipse(x + 152, top + 14, 3, 2, P.metal[2]); bm.vline(x + 152, top + 18, 5, P.metal[1]);
    wall(bm, x, f, w, base - f, 'modern', 3);
    bm.hline(x - 1, f, w + 2, P.charcoal[4]); bm.hline(x - 1, f + 1, w + 2, P.charcoal[2]);
    // two floors of ribbon windows with people working inside
    for (const [fy, row] of [[f + 10, 0], [f + 56, 1]] as const) studioFloor(bm, x + 6, fy, w - 12, 38, row);
    SPOTS.studioScreen = { x: x + 6 + 84, y: f + 56 + 14, w: 14, h: 14 };
    // ground floor: glass, a sign, the door
    const sy = base - 46;
    bm.rect(x + 4, sy, w - 8, 46, P.charcoal[1]);
    bm.rect(x + 8, sy + 12, w - 16, 32, P.glass[1]);
    for (let j = 0; j < 32; j++) for (let i = 0; i < w - 16; i++) {
      if ((i + j) % 13 < 2) bm.px(x + 8 + i, sy + 12 + j, P.glass[3]);
      if (j > 18) bm.px(x + 8 + i, sy + 12 + j, mix(P.glass[0], P.glow[1], 0.18));
    }
    for (let i = 0; i < w - 16; i += 26) bm.vline(x + 8 + i, sy + 12, 32, P.charcoal[3]);
    // reception: a big potted fig and a bench
    pottedPlant(bm, x + 20, sy + 33, P.leafGreen[3]);
    bm.rect(x + 40, sy + 38, 24, 3, P.wood[3]);
    // sign: STUDIO in pixel caps with a little cursor
    signBoard(bm, x + 46, sy + 2, 80, 8, P.charcoal[0], hex('#f2b43a'), 'PIXEL & PATH STUDIO');
    door(bm, x + 128, sy + 14, 14, 30, P.charcoal[3]);
    // bike rack shadow area handled by props
  }

  // the gangway between studio and cinema
  {
    const x = 456, w = 36;
    for (let y = TRACK.alleyBottom; y < base; y++) for (let i = 0; i < w; i++) bm.px(x + i, y, pick(P.concrete, 0.45 + noise2(x + i, y, 8) * 0.2 - (i < 6 ? 0.2 : 0)));
    // wooden gate partway along
    bm.rect(x + 2, 220, w - 4, 3, P.wood[3]);
    for (let i = 2; i < w - 2; i += 3) bm.vline(x + i, 200, 22, i % 2 ? P.wood[2] : P.wood[3]);
    bm.hline(x + 2, 200, w - 4, P.wood[4]);
    // shadow from the studio
    for (let y = 150; y < base; y++) for (let i = 0; i < 10; i++) if (i < 6 || bayer(i, y) < 0.5) bm.shade(x + i, y, 0.9);
    SPOTS.gangway = { x, y: 230, w, h: 70 };
  }

  // 4. the cinema, with movies on the roof
  {
    const x = 492, w = 212, top = 124, d = 72, f = top + d;
    roof(bm, x, top, w, d, 4, hex('#e8d8b8'));
    // rooftop deck boards
    for (let y = top + 4; y < top + d - 4; y++) for (let i = 4; i < w - 4; i++) bm.px(x + i, y, (y - top) % 4 === 0 ? P.wood[1] : pick(P.wood, 0.5 + noise2(x + i, y, 4) * 0.25));
    SPOTS.rooftop = { x: x + 4, y: top + 4, w: w - 8, h: d - 8 };
    stringLights(bm, x + 6, top + 6, x + w - 6, top + 6, 3);
    wall(bm, x, f, w, base - f, 'stucco', 4, [hex('#b8946a'), hex('#d4b48a'), hex('#e6cfa4'), hex('#f2e2c0')]);
    // art deco banding
    cornice(bm, x, f, w, hex('#c8603a'), false);
    for (let i = 0; i < w; i += 18) for (let j = 0; j < 10; j++) bm.px(x + i + 9, f + 8 + j, hex('#c8603a'));
    bm.hline(x, f + 20, w, hex('#c8603a'));
    for (const wx of [x + 18, x + 54, x + 150, x + 186]) windowAt(bm, wx, f + 26, 12, 16, { frame: hex('#c8603a'), lintel: 0, sill: hex('#c8603a'), panes: 'two' });
    // marquee: a lit box projecting over the entrance
    const mx = x + 70, my = f + 26, mw = 72;
    bm.rect(mx - 4, my - 2, mw + 8, 4, hex('#c8603a'));
    bm.rect(mx, my + 2, mw, 16, P.white);
    for (let i = 0; i < mw; i += 3) { bm.px(mx + i, my + 2, P.glow[3]); bm.px(mx + i, my + 17, P.glow[3]); }
    SPOTS.marquee = { x: mx, y: my + 2, w: mw, h: 16 };
    bm.rect(mx - 4, my + 18, mw + 8, 3, hex('#8a3a24'));
    for (let i = 0; i < mw + 8; i += 2) bm.px(mx - 4 + i, my + 19, P.glow[2]);
    // lobby doors, poster cases, ticket booth
    const ly = base - 36;
    bm.rect(x + 60, ly, 92, 36, hex('#6a2a24'));
    for (const dx of [x + 66, x + 84, x + 112, x + 130]) door(bm, dx, ly + 8, 14, 28, hex('#8a3a24'));
    bm.rect(x + 98, ly + 10, 12, 18, P.glow[2]); bm.rect(x + 99, ly + 11, 10, 6, P.glass[2]);
    for (const px of [x + 16, x + 176]) {
      bm.rect(px, ly + 2, 20, 28, hex('#c8a04a')); bm.rect(px + 2, ly + 4, 16, 24, hex('#2a2440'));
      bm.ellipse(px + 10, ly + 13, 5, 6, P.white); bm.px(px + 8, ly + 12, P.ink); bm.px(px + 12, ly + 12, P.ink);
      drawTextCentered(bm, px === x + 16 ? 'BOO' : 'ZOOM', px + 10, ly + 21, hex('#f2b43a'));
    }
    SPOTS.posterL = { x: x + 16, y: ly + 2, w: 20, h: 28 };
    // vertical sign on the left pier, rising above the roofline
    const vx = x + 2, vy = top - 26;
    bm.rect(vx, vy, 13, base - 60 - vy, hex('#8a2a24'));
    bm.vline(vx, vy, base - 60 - vy, hex('#b84a34'));
    const letters = 'PALACE';
    for (let i = 0; i < letters.length; i++) drawTextCentered(bm, letters[i], vx + 6.5, vy + 4 + i * 9, P.glow[3]);
    for (let j = vy; j < base - 60; j += 3) { bm.px(vx + 1, j, P.glow[3]); bm.px(vx + 11, j, P.glow[3]); }
    SPOTS.verticalSign = { x: vx, y: vy, w: 13, h: base - 60 - vy };
  }

  // 5. the record shop
  {
    const x = 704, w = 118, top = 164, d = 34, f = top + d;
    roof(bm, x, top, w, d, 5, P.brick[4]);
    acUnit(bm, x + 84, top + 10);
    // a forgotten sneaker on the roof
    bm.stamp(['..WW', 'WWWR'], x + 30, top + 18, { W: P.white, R: hex('#d23a32') });
    wall(bm, x, f, w, base - f, 'brick', 5);
    cornice(bm, x, f, w, P.brick[4]);
    windowAt(bm, x + 16, f + 12, 16, 22, { curtain: hex('#5a3a7a'), bust: { skin: 'olive', hair: 'black', style: 'curly', top: 'charcoal', bottom: 'charcoal', item: 'none' } });
    windowAt(bm, x + 70, f + 12, 16, 22, { plant: true });
    SPOTS.recordWindow = { x: x + 16, y: f + 12, w: 16, h: 22 };
    const sy = base - 50;
    bm.rect(x + 2, sy, w - 4, 50, hex('#245a74'));
    bm.hline(x + 2, sy, w - 4, hex('#3a7a96'));
    signBoard(bm, x + 18, sy + 3, 82, 9, hex('#f2b43a'), hex('#1e2a3a'), 'SIDE B RECORDS');
    // window full of sleeves
    bm.rect(x + 8, sy + 18, 64, 28, hex('#1a2430'));
    const cols = [hex('#e0402e'), hex('#f2d03a'), hex('#3a7ad0'), P.white, hex('#c45a86'), hex('#3f9a56'), hex('#f08a2a')];
    for (let i = 0; i < 6; i++) {
      const rx = x + 11 + i * 10, ry = sy + 22 + (i % 2) * 10;
      bm.rect(rx, ry, 8, 8, cols[i % cols.length]);
      bm.ellipse(rx + 4, ry + 4, 2.5, 2.5, P.ink); bm.px(rx + 4, ry + 4, cols[(i + 3) % cols.length]);
    }
    for (let i = 0; i < 64; i += 7) bm.px(x + 8 + i, sy + 18, P.glass[3]);
    door(bm, x + 84, sy + 16, 16, 34, hex('#1a3a4c'));
    SPOTS.recordShop = { x: x + 8, y: sy + 18, w: 64, h: 28 };
  }

  // 6. the greystone (home)
  {
    const x = 822, w = 140, top = 130, d = 34, f = top + d;
    backPorch(bm, x + 90, top - 34, top + 2, 34);
    roof(bm, x, top, w, d, 6, P.greystone[4]);
    chimney(bm, x + 16, top + 6, P.brick[2]);
    chimney(bm, x + 112, top + 6, P.brick[2]);
    skylight(bm, x + 52, top + 10, 16, 10);
    wall(bm, x, f, w, base - f, 'greystone', 6);
    cornice(bm, x, f, w, P.greystone[4]);
    // carved band under the cornice
    for (let i = 2; i < w - 2; i += 6) { bm.px(x + i, f + 6, P.greystone[1]); bm.px(x + i + 1, f + 7, P.greystone[1]); bm.px(x + i + 2, f + 6, P.greystone[1]); }
    // rounded bay with three windows on each floor
    const bx = x + 12, bw = 58;
    for (let y = f + 10; y < base - 24; y++) { bm.px(bx - 1, y, P.greystone[4]); bm.px(bx + bw, y, P.greystone[0]); }
    for (const [fy, k] of [[f + 14, 0], [f + 58, 1]] as const) {
      windowAt(bm, bx + 4, fy, 12, 26, { curtain: k === 0 ? hex('#e0d080') : undefined });
      windowAt(bm, bx + 23, fy, 12, 26, { lit: k === 1, plant: k === 0 });
      windowAt(bm, bx + 42, fy, 12, 26, { blinds: true });
      windowAt(bm, x + 100, fy, 14, 26, { curtain: hex('#7ac0c8') });
    }
    SPOTS.homeWindow = { x: bx + 23, y: f + 58, w: 12, h: 26 };
    // garden level and the stoop
    windowAt(bm, bx + 10, base - 22, 34, 12, { dark: true, sill: P.greystone[3], panes: 'two' });
    const dx = x + 96;
    door(bm, dx, base - 50, 16, 30, hex('#5a2a2a'));
    bm.ellipse(dx + 8, base - 40, 4, 4, P.leafOrange[2]); bm.ellipse(dx + 8, base - 40, 2, 2, hex('#5a2a2a'));
    bm.rect(dx - 2, base - 54, 20, 3, P.greystone[4]);
    stoopSteps(bm, dx - 6, base - 20, 28, 20, P.greystone[3], true);
    SPOTS.stoop = { x: dx - 6, y: base - 20, w: 28, h: 20 };
    // little front garden behind a short iron fence, with the leaf pile
    for (let i = 0; i < 70; i++) for (let j = 0; j < 7; j++) {
      const leaf = noise2(i, j, 66) < 0.12;
      bm.px(x + 8 + i, base + 1 + j, leaf ? pick(P.leafOrange, 0.4 + noise2(i, j, 67) * 0.6) : pick(P.grass, 0.35 + noise2(i, j, 68) * 0.4));
    }
    for (let i = 0; i < 70; i++) { if (i % 3 === 0) bm.vline(x + 8 + i, base + 5, 4, hex('#24222a')); bm.px(x + 8 + i, base + 6, hex('#24222a')); }
    SPOTS.leafPile = { x: x + 30, y: base + 1, w: 24, h: 8 };
  }

  // 7. the arcade
  {
    const x = 962, w = 150, top = 152, d = 36, f = top + d;
    roof(bm, x, top, w, d, 7, hex('#7a6a8a'));
    // rooftop billboard on stilts
    const bx = x + 24, by = top - 18;
    bm.vline(bx + 10, by + 22, 26, P.steel[1]); bm.vline(bx + 80, by + 22, 26, P.steel[1]);
    bm.rect(bx, by, 92, 24, hex('#f2e6cc'));
    bm.rect(bx + 2, by + 2, 88, 20, hex('#2a5aa8'));
    // falling blocks on the billboard
    const blocks: [number, number, string][] = [[6, 12, '#f2d03a'], [10, 12, '#f2d03a'], [10, 8, '#f2d03a'], [14, 12, '#f2d03a'], [74, 4, '#e0402e'], [78, 4, '#e0402e'], [78, 8, '#e0402e'], [82, 8, '#e0402e'], [74, 12, '#3f9a56'], [78, 12, '#3f9a56'], [82, 12, '#3f9a56'], [82, 16, '#3f9a56']];
    for (const [ox, oy, c] of blocks) { bm.rect(bx + 2 + ox, by + 2 + oy, 4, 4, hex(c)); bm.px(bx + 2 + ox, by + 2 + oy, P.white); }
    drawTextCentered(bm, 'PLAY MORE', bx + 46, by + 7, P.white);
    drawTextCentered(bm, 'GAMES', bx + 46, by + 14, hex('#f2d03a'));
    wall(bm, x, f, w, base - f, 'stucco', 7, [hex('#3a2a4a'), hex('#4a3660'), hex('#5a4474'), hex('#6a5488')]);
    cornice(bm, x, f, w, hex('#8a7aa0'));
    for (const wx of [x + 14, x + 50, x + 86, x + 122]) windowAt(bm, wx, f + 12, 14, 20, { frame: hex('#c8c0d8'), sill: hex('#c8c0d8'), lintel: 0, blinds: wx === x + 86, lit: wx === x + 14 });
    const sy = base - 56;
    bm.rect(x + 4, sy, w - 8, 56, hex('#221a30'));
    // neon ARCADE in pink with a cyan underline
    const nx = x + 40, ny = sy + 4;
    bm.rect(nx - 3, ny - 2, 74, 11, hex('#1a1424'));
    drawTextCentered(bm, 'ARCADE', nx + 34, ny, hex('#ff6aa8'));
    drawTextCentered(bm, 'ARCADE', nx + 34, ny + 1, hex('#ff9ac8'));
    bm.hline(nx, ny + 7, 68, hex('#5ae0e8'));
    SPOTS.neon = { x: nx - 3, y: ny - 2, w: 74, h: 11 };
    // cabinets glowing in the window
    bm.rect(x + 10, sy + 18, w - 50, 34, hex('#120e1a'));
    for (let i = 0; i < 4; i++) {
      const cx = x + 14 + i * 22;
      bm.rect(cx, sy + 22, 14, 30, ['#c83a32', '#2a5aa8', '#3f8a56', '#e8b83a'].map(hex)[i]);
      bm.rect(cx + 2, sy + 25, 10, 8, hex('#0a0a12'));
      bm.rect(cx + 3, sy + 26, 8, 6, ['#5ae0e8', '#f2d03a', '#ff6aa8', '#7ad86a'].map(hex)[i]);
      bm.px(cx + 5 + (i % 3), sy + 28, P.ink); bm.px(cx + 7, sy + 29 + (i % 2), P.white);
      bm.rect(cx + 2, sy + 36, 10, 3, hex('#2a2430')); bm.px(cx + 4, sy + 36, hex('#e0402e')); bm.px(cx + 8, sy + 36, hex('#f2d03a'));
    }
    for (let i = 0; i < w - 50; i += 9) bm.px(x + 10 + i, sy + 18, hex('#5ae0e8'));
    SPOTS.arcadeWindow = { x: x + 10, y: sy + 18, w: w - 50, h: 34 };
    door(bm, x + w - 34, sy + 18, 18, 38, hex('#3a2a4a'));
    drawText(bm, '1UP', x + w - 31, sy + 24, hex('#5ae0e8'));
  }

  // 8. pizza, with the water tower
  {
    const x = 1112, w = 160, top = 136, d = 40, f = top + d;
    roof(bm, x, top, w, d, 8, P.brickTan[4]);
    waterTower(bm, x + 104, top - 6);
    SPOTS.waterTower = { x: x + 104, y: top - 8, w: 20, h: 40 };
    // clothesline with laundry
    bm.vline(x + 14, top + 6, 14, P.wood[1]); bm.vline(x + 70, top + 6, 14, P.wood[1]);
    for (let i = 0; i < 56; i++) bm.px(x + 14 + i, top + 7 + Math.round(Math.sin((i / 56) * Math.PI) * 3), P.ink);
    const laundry: [number, string, number, number][] = [[6, '#f2e6cc', 6, 8], [16, '#e0402e', 5, 6], [26, '#3a7ad0', 7, 9], [38, '#f2d03a', 5, 5], [46, '#c45a86', 4, 7]];
    for (const [ox, c, ww, hh] of laundry) { const ly = top + 8 + Math.round(Math.sin((ox / 56) * Math.PI) * 3); bm.rect(x + 14 + ox, ly, ww, hh, hex(c)); bm.vline(x + 14 + ox + ww - 1, ly, hh, shadow(hex(c), 0.4)); }
    SPOTS.laundry = { x: x + 14, y: top + 6, w: 56, h: 18 };
    wall(bm, x, f, w, base - f, 'brickTan', 8);
    cornice(bm, x, f, w, P.brickTan[4]);
    for (const fy of [f + 12]) for (const wx of [x + 14, x + 48, x + 96, x + 130]) windowAt(bm, wx, fy, 14, 22, { lintel: P.brickTan[4], sill: P.brickTan[4], curtain: wx === x + 48 ? hex('#e0402e') : undefined, plant: wx === x + 130, bust: wx === x + 96 ? { skin: 'light', hair: 'white', style: 'bun', top: 'pink', bottom: 'pink' } : undefined });
    SPOTS.grandmaWindow = { x: x + 96, y: f + 12, w: 14, h: 22 };
    const sy = base - 66;
    bm.rect(x + 4, sy, w - 8, 66, hex('#f2e6cc'));
    bm.rect(x + 4, sy + 58, w - 8, 8, hex('#2f6c44'));
    signBoard(bm, x + 30, sy + 4, 100, 10, hex('#2f6c44'), hex('#f2e6cc'), 'DEEP DISH PIZZA', hex('#e0402e'));
    awning(bm, x + 8, sy + 16, w - 16, { a: hex('#2f6c44'), b: hex('#f2e6cc'), depth: 7 });
    bm.rect(x + 12, sy + 28, 80, 26, P.glow[1]); bm.rect(x + 12, sy + 28, 80, 6, P.glow[2]);
    // a pie on a stand in the window
    bm.ellipse(x + 34, sy + 46, 9, 4, hex('#c8843a')); bm.ellipse(x + 34, sy + 45, 7, 3, hex('#c83a32'));
    bm.px(x + 31, sy + 44, hex('#f2e070')); bm.px(x + 36, sy + 45, hex('#f2e070')); bm.px(x + 34, sy + 46, hex('#3f8a56'));
    // red-checked tables inside
    for (const tx of [x + 54, x + 72]) for (let i = 0; i < 12; i++) bm.px(tx + i, sy + 48, i % 2 ? hex('#e0402e') : P.white);
    door(bm, x + 104, sy + 26, 16, 32, hex('#2f6c44'));
    windowAt(bm, x + 126, sy + 28, 24, 22, { lit: true, sill: P.brickTan[4], lintel: 0, panes: 'none' });
    SPOTS.pizzaWindow = { x: x + 12, y: sy + 28, w: 80, h: 26 };
  }

  // 9. the tall walk-up with the fire escape and the laundromat
  {
    const x = 1272, w = 168, top = 96, d = 38, f = top + d;
    roof(bm, x, top, w, d, 9, P.brick[4]);
    // pigeon coop
    bm.rect(x + 20, top + 6, 30, 16, P.wood[2]); bm.rect(x + 20, top + 6, 30, 4, P.wood[4]);
    for (let i = 0; i < 30; i += 2) bm.vline(x + 20 + i, top + 10, 12, (i / 2) % 2 ? P.wood[1] : P.wood[2]);
    for (let i = 2; i < 30; i += 3) for (let j = 12; j < 20; j += 3) bm.px(x + 20 + i, top + j, hex('#c8c2b4'));
    SPOTS.coop = { x: x + 20, y: top + 6, w: 30, h: 16 };
    acUnit(bm, x + 120, top + 12);
    chimney(bm, x + 90, top + 8, P.brick[1]);
    wall(bm, x, f, w, base - f, 'brick', 9, [hex('#5a2a22'), hex('#7a3a2a'), hex('#9a4a32'), hex('#b45e3e'), hex('#c87a52')]);
    cornice(bm, x, f, w, P.greystone[4]);
    const fl = [f + 10, f + 44, f + 78];
    for (const [k, fy] of fl.entries()) {
      windowAt(bm, x + 10, fy, 12, 22, { curtain: k === 1 ? hex('#3f9a56') : undefined, dark: k === 2 });
      windowAt(bm, x + 34, fy, 12, 22, { blinds: k === 0, plant: k === 2 });
      windowAt(bm, x + 76, fy, 12, 22, { lit: k === 1 });
      windowAt(bm, x + 98, fy, 12, 22, {});
      windowAt(bm, x + 140, fy, 12, 22, { curtain: k === 0 ? hex('#f2b43a') : undefined, bust: k === 2 ? { skin: 'deep', hair: 'black', style: 'buzz', top: 'teal', bottom: 'teal' } : undefined });
    }
    SPOTS.escapeWindow = { x: x + 76, y: fl[1], w: 12, h: 22 };
    fireEscape(bm, x + 70, fl);
    const sy = base - 40;
    bm.rect(x + 4, sy, w - 8, 40, hex('#e8e2d6'));
    signBoard(bm, x + 30, sy + 3, 108, 8, hex('#3a7ad0'), P.white, 'SUDS LAUNDROMAT');
    bm.rect(x + 10, sy + 14, 110, 24, hex('#c8d8e0'));
    for (let i = 0; i < 7; i++) {
      const cx = x + 18 + i * 15;
      bm.rect(cx - 6, sy + 18, 13, 17, P.white); bm.hline(cx - 6, sy + 18, 13, P.metal[4]);
      bm.ellipse(cx, sy + 27, 4.5, 4.5, P.metal[2]); bm.ellipse(cx, sy + 27, 3.4, 3.4, i % 3 === 0 ? hex('#e0402e') : i % 3 === 1 ? hex('#3a7ad0') : P.glass[2]);
    }
    SPOTS.washers = { x: x + 10, y: sy + 14, w: 110, h: 24 };
    door(bm, x + 128, sy + 10, 16, 30, hex('#3a7ad0'));
  }

  // shadows that taller buildings cast onto lower roofs to their right
  const tops: [number, number, number][] = [[0, 128, 108], [128, 284, 150], [284, 456, 114], [492, 704, 124], [704, 822, 164], [822, 962, 130], [962, 1112, 152], [1112, 1272, 136], [1272, 1440, 96]];
  for (let i = 0; i < tops.length - 1; i++) {
    const [, x1, t0] = tops[i];
    const [x2, , t1] = tops[i + 1];
    if (x2 !== x1 || t1 <= t0) continue;
    const diff = t1 - t0;
    const sw = Math.min(22, Math.round(diff * 0.5));
    for (let y = t1; y < t1 + 34; y++) for (let k = 0; k < sw; k++) if (k < sw - 3 || bayer(k, y) < 0.5) bm.shade(x2 + k, y, 0.7);
  }
}

function stoopSteps(bm: Bitmap, x: number, y: number, w: number, h: number, c: Color, railing = false) {
  for (let j = 0; j < h; j++) {
    const step = Math.floor(j / 3);
    const cc = j % 3 === 0 ? sunlit(c, 0.8) : j % 3 === 2 ? shadow(c, 0.5) : c;
    bm.hline(x - step, y + j, w + step * 2, cc);
  }
  if (railing) {
    const iron = hex('#24222a');
    bm.line(x - 1, y - 6, x - 1 - Math.floor(h / 3), y + h - 1, iron);
    bm.line(x + w, y - 6, x + w + Math.floor(h / 3), y + h - 1, iron);
    for (let j = 0; j < h; j += 3) { bm.px(x - 1 - Math.floor(j / 3), y + j - 4, iron); bm.px(x + w + Math.floor(j / 3), y + j - 4, iron); }
  }
}

function fireEscape(bm: Bitmap, x: number, floors: number[]) {
  const iron = hex('#26242c'), ironL = hex('#3e3a46');
  for (const fy of floors) {
    const py = fy + 24;
    bm.rect(x - 2, py, 46, 2, iron); bm.hline(x - 2, py, 46, ironL);
    for (let i = 0; i < 46; i += 3) bm.vline(x - 2 + i, py - 7, 7, iron);
    bm.hline(x - 2, py - 7, 46, iron);
    for (let j = 0; j < 6; j++) for (let i = -2; i < 44; i++) if (bayer(i, j) < 0.4) bm.shade(x + i + 2, py + 2 + j, 0.6);
  }
  for (let k = 0; k < floors.length - 1; k++) {
    const y0 = floors[k] + 26, y1 = floors[k + 1] + 17;
    bm.line(x + 4, y1, x + 34, y0, iron);
    bm.line(x + 5, y1, x + 35, y0, ironL);
  }
  // drop ladder
  bm.vline(x + 36, floors[floors.length - 1] + 26, 14, iron); bm.vline(x + 40, floors[floors.length - 1] + 26, 14, iron);
  for (let j = 0; j < 14; j += 3) bm.hline(x + 36, floors[floors.length - 1] + 26 + j, 5, iron);
}

function studioFloor(bm: Bitmap, x: number, y: number, w: number, h: number, row: number) {
  // interior: warm back wall, a pinned-up board, desks with glowing screens
  bm.rect(x, y, w, h, P.charcoal[3]);
  bm.rect(x + 1, y + 1, w - 2, h - 2, hex('#e8dcc4'));
  bm.rect(x + 1, y + h - 12, w - 2, 11, hex('#c8b896'));
  // pinboard with sticky notes and wireframes
  if (row === 0) {
    bm.rect(x + 8, y + 4, 40, 14, hex('#a8845a'));
    const notes = ['#f2d03a', '#ff9ac8', '#7ac0c8', '#f2d03a', '#b8e07a', '#ff9ac8'];
    notes.forEach((c, i) => bm.rect(x + 10 + (i % 3) * 12, y + 5 + Math.floor(i / 3) * 6, 6, 5, hex(c)));
    bm.rect(x + 120, y + 4, 30, 18, P.white);
    bm.rect(x + 122, y + 6, 10, 6, hex('#7ac0c8')); bm.hline(x + 134, y + 7, 14, P.inkSoft); bm.hline(x + 134, y + 10, 10, P.inkSoft);
    bm.rect(x + 122, y + 14, 26, 6, hex('#f2b43a'));
  } else {
    // shelves of books and a little plant
    for (let i = 0; i < 30; i += 2) bm.vline(x + 120 + i, y + 6, 6, ['#e0402e', '#3a7ad0', '#f2d03a', '#3f8a56', '#c45a86'].map(hex)[(i / 2) % 5]);
    bm.hline(x + 118, y + 12, 34, P.wood[2]);
    pottedPlant(bm, x + 8, y + 6, P.leafGreen[3]);
  }
  // desks
  const desks = row === 0 ? [20, 60, 100, 136] : [24, 84, 130];
  const people: Look[] = row === 0
    ? [
        { skin: 'fair', hair: 'auburn', style: 'bun', top: 'sky', bottom: 'denim' },
        { skin: 'deep', hair: 'black', style: 'buzz', top: 'white', bottom: 'denim', glasses: true },
        { skin: 'olive', hair: 'brown', style: 'long', top: 'coral', bottom: 'denim' },
        { skin: 'light', hair: 'blonde', style: 'short', top: 'green', bottom: 'denim', beard: true },
      ]
    : [
        { skin: 'brown', hair: 'black', style: 'long', top: 'purple', bottom: 'denim' },
        { skin: 'light', hair: 'pink', style: 'bob', top: 'black', bottom: 'denim' },
        { skin: 'fair', hair: 'grey', style: 'short', top: 'navy', bottom: 'denim', glasses: true },
      ];
  desks.forEach((dx, i) => {
    const look = people[i];
    // person seen over the monitor's shoulder (at their desk, facing the window)
    const g = personGrid(look, 'stand').slice(1, 11).map((r) => r.join(''));
    const tmp = new Bitmap(10, g.length + 2);
    tmp.stamp(g, 1, 1, bustPalette(look)); tmp.outline();
    bm.blit(tmp, x + dx - 1, y + h - 26);
    // desk and monitor back in front of them
    bm.rect(x + dx - 6, y + h - 12, 22, 2, P.wood[3]);
    bm.hline(x + dx - 6, y + h - 12, 22, P.wood[4]);
    const screen = i % 2 ? hex('#3a4a6a') : hex('#2a2a34');
    bm.rect(x + dx + 8, y + h - 21, 8, 8, screen);
    bm.vline(x + dx + 11, y + h - 13, 1, P.metal[1]);
  });
  // the window glass over everything: mullions and a sheen
  for (let i = 0; i < w; i += 30) bm.vline(x + i, y, h, P.charcoal[2]);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if ((i + j * 2) % 37 < 3) bm.px(x + i, y + j, mix(bm.get(x + i, y + j), P.white, 0.35));
  bm.hline(x - 1, y + h, w + 2, P.charcoal[4]);
}

function alleyLife(bm: Bitmap) {
  // garages along the alley, a basketball hoop, bins: all behind the block
  const R = rng(17);
  const garages: [number, number, string][] = [[150, 56, '#8a6a4a'], [300, 44, '#6a7a8a'], [742, 48, '#a85a3a'], [1010, 60, '#5a6a5a'], [1170, 40, '#8a7a6a']];
  for (const [gx, gw, c] of garages) {
    const gy = 58;
    const col = hex(c);
    for (let j = 0; j < 8; j++) for (let i = 0; i < gw; i++) bm.px(gx + i, gy + j, pick(P.roof, 0.4 + noise2(gx + i, gy + j, 3) * 0.3));
    bm.hline(gx, gy, gw, P.roof[4]);
    for (let j = 8; j < 34; j++) for (let i = 0; i < gw; i++) bm.px(gx + i, gy + j, (j - 8) % 4 === 3 ? shadow(col, 0.5) : col);
    bm.rect(gx + 6, gy + 12, gw - 12, 22, shadow(col, 0.2));
    for (let j = 12; j < 34; j += 3) bm.hline(gx + 6, gy + j, gw - 12, shadow(col, 0.5));
  }
  // basketball hoop over the first garage door
  bm.rect(172, 40, 12, 9, P.white); bm.rect(175, 44, 6, 4, hex('#e0402e'));
  bm.hline(174, 49, 8, hex('#e0402e'));
  for (let i = 0; i < 8; i += 2) bm.vline(174 + i, 50, 3, P.white);
  SPOTS.hoop = { x: 172, y: 40, w: 12, h: 14 };
  void R;
}
