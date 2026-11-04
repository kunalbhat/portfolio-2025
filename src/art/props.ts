import { Bitmap } from './bitmap';
import { Color, hex, mix, shadow, sunlit } from './color';
import { P } from './palette';
import { rng, bayer, noise2 } from './rng';

// Freestanding things that people can walk in front of and behind: trees,
// lamps, benches, café furniture. Each returns a Bitmap whose anchor is the
// bottom-centre (where it meets the ground) unless noted.

export interface PropArt {
  bm: Bitmap;
  ax: number;
  ay: number;
}

export type Foliage = 'green' | 'orange' | 'gold' | 'red' | 'mixed' | 'turning';

function foliageRamps(kind: Foliage): number[][] {
  switch (kind) {
    case 'green': return [P.leafGreen];
    case 'orange': return [P.leafOrange];
    case 'gold': return [P.leafGold];
    case 'red': return [P.leafRed];
    case 'mixed': return [P.leafOrange, P.leafGold, P.leafRed];
    case 'turning': return [P.leafGreen, P.leafGold, P.leafGreen, P.leafOrange];
  }
}

/**
 * A round deciduous tree. The canopy is a cluster of leafy clumps, each lit
 * from the upper left, so it reads as volume rather than a disc.
 */
export function tree(kind: Foliage, r: number, seed: number): PropArt {
  const R = rng(seed);
  const trunkH = Math.round(r * 0.55) + 4;
  const w = Math.ceil(r * 2.3) + 4;
  const ry = r * 0.86;
  const h = Math.ceil(ry * 2) + trunkH + 4;
  const bm = new Bitmap(w, h);
  const cx = w / 2, cy = ry + 2;
  const ramps = foliageRamps(kind);

  // trunk and a couple of limbs first, canopy on top
  const baseY = h - 2;
  const tw = r > 14 ? 4 : 3;
  for (let y = Math.floor(cy); y <= baseY; y++) {
    const flare = y > baseY - 2 ? 1 : 0;
    for (let x = -flare; x < tw + flare; x++) {
      const px = Math.round(cx - tw / 2) + x;
      const c = x <= 0 ? P.trunk[3] : x === tw - 1 + flare ? P.trunk[1] : P.trunk[2];
      bm.px(px, y, c);
    }
  }
  bm.line(Math.round(cx), Math.round(cy + 2), Math.round(cx - r * 0.5), Math.round(cy - r * 0.2), P.trunk[1]);
  bm.line(Math.round(cx + 1), Math.round(cy + 3), Math.round(cx + r * 0.55), Math.round(cy - r * 0.1), P.trunk[1]);

  // clumps: a ring around the edge and a few inside
  const clumps: { x: number; y: number; r: number; ramp: number[] }[] = [];
  const n = Math.round(6 + r / 2.5);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + R.range(-0.2, 0.2);
    const d = R.range(0.55, 0.78);
    clumps.push({ x: cx + Math.cos(a) * r * d, y: cy + Math.sin(a) * ry * d, r: r * R.range(0.36, 0.5), ramp: R.pick(ramps) });
  }
  for (let i = 0; i < Math.round(n / 2); i++) {
    clumps.push({ x: cx + R.range(-0.4, 0.4) * r, y: cy + R.range(-0.45, 0.3) * ry, r: r * R.range(0.38, 0.52), ramp: R.pick(ramps) });
  }
  // draw back-to-front: lower clumps last so they overlap the ones above
  clumps.sort((a, b) => a.y - b.y);
  // a dark interior mass so gaps between clumps read as depth
  bm.ellipse(cx, cy + 1, r * 0.92, ry * 0.86, (x, y) => (bayer(x, y) < 0.5 ? ramps[0][0] : ramps[0][1]));
  for (const c of clumps) {
    for (let y = Math.floor(c.y - c.r); y <= Math.ceil(c.y + c.r); y++)
      for (let x = Math.floor(c.x - c.r); x <= Math.ceil(c.x + c.r); x++) {
        const dx = (x + 0.5 - c.x) / c.r, dy = (y + 0.5 - c.y) / (c.r * 0.92);
        const d = dx * dx + dy * dy;
        if (d > 1) continue;
        // local light from the upper left + global light across the canopy
        const local = -(dx * 0.6 + dy * 0.8);
        const gx = (x - cx) / r, gy = (y - cy) / ry;
        const global = -(gx * 0.55 + gy * 0.75);
        let v = 0.5 + local * 0.32 + global * 0.3 + (noise2(x, y, seed) - 0.5) * 0.28;
        if (d > 0.72 && dx + dy > 0.2) v -= 0.22; // clump rim in shade
        v += (bayer(x, y) - 0.5) * 0.18;
        const ramp = c.ramp;
        const idx = Math.max(0, Math.min(ramp.length - 1, Math.floor(v * ramp.length)));
        bm.px(x, y, ramp[idx]);
      }
  }
  // scattered sparkle leaves on the lit side
  for (let i = 0; i < r * 1.6; i++) {
    const a = R.range(Math.PI * 0.95, Math.PI * 1.75);
    const d = R.range(0.2, 0.85);
    const x = Math.round(cx + Math.cos(a) * r * d), y = Math.round(cy + Math.sin(a) * ry * d);
    if (bm.get(x, y)) bm.px(x, y, R.pick(ramps)[4] ?? R.pick(ramps)[3]);
  }
  bm.outline();
  return { bm, ax: Math.round(cx), ay: baseY };
}

/** A slim conifer, for corners that need a dark accent. */
export function conifer(h: number, seed: number): PropArt {
  const R = rng(seed);
  const w = Math.round(h * 0.6) + 2;
  const bm = new Bitmap(w, h + 3);
  const cx = w / 2;
  bm.rect(Math.round(cx) - 1, h - 3, 2, 4, P.trunk[2]);
  for (let y = 0; y < h - 2; y++) {
    const t = y / (h - 2);
    const half = Math.max(1, t * (w / 2 - 1) * (0.85 + 0.15 * Math.sin(y * 1.3)));
    for (let x = Math.floor(cx - half); x <= Math.ceil(cx + half); x++) {
      const dx = (x - cx) / (half + 0.01);
      let v = 0.55 - dx * 0.35 - (y % 4 === 3 ? 0.25 : 0) + (R.next() - 0.5) * 0.15;
      v += (bayer(x, y) - 0.5) * 0.2;
      const idx = Math.max(0, Math.min(3, Math.floor(v * 4)));
      bm.px(x, y, P.leafGreen[idx]);
    }
  }
  bm.outline();
  return { bm, ax: Math.round(cx), ay: h + 1 };
}

/** The town's lamps: a dark green pole and a frosted acorn globe. */
export function lamppost(lit = false): PropArt {
  const bm = new Bitmap(7, 30);
  const pole = hex('#2c3a30'), poleL = hex('#4a5e4c');
  bm.rect(2, 8, 3, 2, pole);
  bm.rect(3, 10, 1, 16, pole);
  bm.px(2, 10, poleL); bm.vline(2, 12, 13, poleL);
  bm.vline(4, 12, 13, pole);
  bm.rect(1, 25, 5, 4, pole); bm.hline(1, 25, 5, poleL); bm.vline(1, 25, 4, poleL);
  bm.rect(0, 28, 7, 1, pole);
  const glass = lit ? P.glow[3] : hex('#efe6d0');
  const glassS = lit ? P.glow[2] : hex('#c9bfae');
  bm.rect(1, 2, 5, 6, glass);
  bm.vline(5, 2, 6, glassS); bm.vline(4, 3, 4, mix(glass, glassS, 0.5));
  bm.px(2, 3, P.white);
  bm.rect(2, 0, 3, 2, pole); bm.px(3, 0, poleL);
  bm.hline(1, 8, 5, pole);
  bm.outline();
  return { bm, ax: 3, ay: 29 };
}

/** Park bench seen from the front (sitters face the viewer) or the back. */
export function bench(back = false, w = 20): PropArt {
  const bm = new Bitmap(w + 2, 12);
  const slat = P.wood[3], slatL = P.wood[4], slatD = P.wood[1];
  const iron = hex('#2a2a30');
  if (!back) {
    bm.hline(1, 1, w, slatL); bm.hline(1, 2, w, slat);
    bm.hline(1, 3, w, slatD);
    bm.hline(1, 4, w, slatL); bm.hline(1, 5, w, slat);
    bm.vline(2, 1, 9, iron); bm.vline(w - 1, 1, 9, iron);
    bm.hline(1, 6, w, slatL); bm.hline(1, 7, w, slat); bm.hline(1, 8, w, slatD);
    bm.vline(2, 8, 3, iron); bm.vline(w - 1, 8, 3, iron);
  } else {
    bm.hline(1, 1, w, slatL); bm.hline(1, 2, w, slat); bm.hline(1, 3, w, slatD);
    bm.hline(1, 5, w, slatL); bm.hline(1, 6, w, slat); bm.hline(1, 7, w, slatD);
    bm.vline(2, 1, 10, iron); bm.vline(w - 1, 1, 10, iron);
    bm.vline(3, 8, 3, iron); bm.vline(w - 2, 8, 3, iron);
  }
  bm.outline();
  return { bm, ax: Math.round((w + 2) / 2), ay: 10 };
}

export function bistroTable(): PropArt {
  const bm = new Bitmap(11, 10);
  const top = hex('#e8e2d6'), topS = hex('#bdb5a6'), iron = hex('#2e2c34');
  bm.ellipse(5.5, 2.5, 5, 2.2, top);
  bm.hline(2, 4, 7, topS);
  bm.vline(5, 5, 4, iron);
  bm.hline(3, 8, 5, iron);
  bm.outline();
  return { bm, ax: 5, ay: 8 };
}

export function bistroChair(flip = false): PropArt {
  const bm = new Bitmap(7, 10);
  const c = hex('#3b6e5a'), cl = hex('#4f8a72');
  bm.vline(1, 0, 9, c); bm.vline(1, 0, 4, cl);
  bm.hline(1, 5, 5, cl); bm.hline(1, 6, 5, c);
  bm.vline(5, 6, 3, c);
  bm.outline();
  if (flip) { const f = new Bitmap(7, 10); f.blit(bm, 0, 0, true); return { bm: f, ax: 3, ay: 9 }; }
  return { bm, ax: 3, ay: 9 };
}

/** Striped café umbrella on a pole; anchor at the foot of the pole. */
export function umbrella(a: Color, b: Color, w = 25): PropArt {
  const h = 24;
  const bm = new Bitmap(w + 2, h);
  const cx = (w + 2) / 2;
  bm.vline(Math.floor(cx), 6, h - 7, hex('#3a3530'));
  for (let y = 0; y < 8; y++) {
    const half = Math.min(w / 2, 2 + y * 1.9);
    for (let x = Math.floor(cx - half); x < Math.ceil(cx + half); x++) {
      const stripe = Math.floor(((x - cx) / (half + 0.01)) * 3 + 3) % 2 === 0;
      let col = stripe ? a : b;
      if (y < 2) col = sunlit(col, 0.8);
      if (x > cx + half * 0.4) col = shadow(col, 0.5);
      bm.px(x, y + 1, col);
    }
  }
  // scalloped valance
  for (let x = Math.floor(cx - w / 2); x < Math.ceil(cx + w / 2); x++) {
    if (x % 3 !== 2) bm.px(x, 9, shadow(Math.floor((x / 3)) % 2 ? a : b, 0.3));
  }
  bm.px(Math.floor(cx), 0, hex('#3a3530'));
  bm.outline();
  return { bm, ax: Math.floor(cx), ay: h - 1 };
}

export function hydrant(): PropArt {
  const bm = new Bitmap(6, 9);
  const c = hex('#d8a72a'), cs = hex('#a87a1a'), cl = hex('#f0cf5a');
  bm.rect(1, 1, 4, 7, c); bm.vline(1, 1, 7, cl); bm.vline(4, 1, 7, cs);
  bm.hline(0, 3, 6, c); bm.px(0, 3, cl); bm.px(5, 3, cs);
  bm.rect(2, 0, 2, 1, cs);
  bm.hline(0, 7, 6, cs);
  bm.outline();
  return { bm, ax: 3, ay: 8 };
}

export function trashCan(): PropArt {
  const bm = new Bitmap(7, 10);
  const c = hex('#2f4a3a'), cl = hex('#456a52'), mesh = hex('#24382c');
  bm.rect(1, 1, 5, 8, c);
  for (let y = 2; y < 8; y++) for (let x = 1; x < 6; x++) if ((x + y) % 2) bm.px(x, y, mesh);
  bm.vline(1, 1, 8, cl);
  bm.hline(0, 0, 7, cl); bm.hline(0, 1, 7, c);
  bm.outline();
  return { bm, ax: 3, ay: 9 };
}

export function mailbox(): PropArt {
  const bm = new Bitmap(8, 12);
  const c = hex('#2e4f8e'), cl = hex('#4a6eb0'), cs = hex('#203a6a');
  bm.rect(1, 1, 6, 7, c); bm.hline(2, 0, 4, cl); bm.vline(1, 1, 7, cl); bm.vline(6, 1, 7, cs);
  bm.hline(2, 3, 4, cs);
  bm.rect(2, 8, 1, 3, cs); bm.rect(5, 8, 1, 3, cs);
  bm.outline();
  return { bm, ax: 4, ay: 10 };
}

export function bikeRack(bikes: Color[]): PropArt {
  // bikes parked nose-in, seen from the side, leaning on a low rail
  const w = 6 + bikes.length * 5;
  const bm = new Bitmap(w, 11);
  const tyre = hex('#2a2830');
  bm.hline(1, 6, w - 2, P.metal[3]); bm.vline(1, 6, 4, P.metal[2]); bm.vline(w - 2, 6, 4, P.metal[2]);
  bikes.forEach((col, i) => {
    const x = 3 + i * 5;
    bm.vline(x, 3, 7, tyre); bm.vline(x + 1, 2, 8, tyre);
    bm.vline(x + 2, 4, 3, col); bm.px(x + 2, 3, col); bm.px(x + 3, 3, hex('#2a2830'));
  });
  bm.outline();
  return { bm, ax: Math.floor(w / 2), ay: 10 };
}

export function planter(flower: Color): PropArt {
  const bm = new Bitmap(14, 9);
  const box = P.wood[2], boxL = P.wood[3];
  bm.rect(1, 4, 12, 4, box); bm.hline(1, 4, 12, boxL);
  const R = rng(flower);
  for (let x = 1; x < 13; x++) {
    const hh = R.int(1, 3);
    for (let y = 0; y < hh; y++) bm.px(x, 4 - y - 1, R.chance(0.5) ? P.leafGreen[2] : P.leafGreen[3]);
    if (R.chance(0.45)) bm.px(x, 4 - hh - 1, R.chance(0.7) ? flower : P.white);
  }
  bm.outline();
  return { bm, ax: 7, ay: 8 };
}

export function streetSign(text: Color = hex('#2e6e4a')): PropArt {
  const bm = new Bitmap(13, 24);
  bm.vline(6, 4, 19, P.metal[1]);
  bm.rect(0, 1, 13, 3, text); bm.hline(1, 2, 11, P.white);
  for (let x = 1; x < 12; x += 2) bm.px(x, 2, text);
  bm.outline();
  return { bm, ax: 6, ay: 23 };
}

export function newsBox(c: Color): PropArt {
  const bm = new Bitmap(7, 11);
  bm.rect(1, 1, 5, 8, c); bm.vline(1, 1, 8, sunlit(c)); bm.vline(5, 1, 8, shadow(c, 0.6));
  bm.rect(2, 2, 3, 3, hex('#cfd6dc')); bm.px(2, 2, P.white);
  bm.rect(2, 9, 1, 1, shadow(c)); bm.rect(4, 9, 1, 1, shadow(c));
  bm.outline();
  return { bm, ax: 3, ay: 10 };
}

/** A low clipped hedge with a little height. Anchor at the bottom-left. */
export function hedge(w: number, seed: number): PropArt {
  const bm = new Bitmap(w, 9);
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < w; x++) {
      if (y === 0 && noise2(x, 0, seed) < 0.4) continue;
      const top = y < 3;
      let v = top ? 0.75 : 0.35 - (y - 3) * 0.05;
      v += (noise2(x, y, seed) - 0.5) * 0.3 + (bayer(x, y) - 0.5) * 0.15;
      bm.px(x, y, P.leafGreen[Math.max(0, Math.min(4, Math.floor(v * 5)))]);
    }
  bm.outline();
  return { bm, ax: 0, ay: 8 };
}

export function busStop(): PropArt {
  const bm = new Bitmap(36, 26);
  const frame = hex('#3a3c44'), glass = hex('#b8d4e0');
  // roof
  bm.rect(0, 0, 36, 4, frame); bm.hline(0, 0, 36, P.metal[2]);
  // back glass
  for (let y = 4; y < 19; y++) for (let x = 1; x < 35; x++) if (bayer(x, y) < 0.35) bm.px(x, y, glass);
  bm.vline(1, 4, 20, frame); bm.vline(34, 4, 20, frame);
  // ad panel
  bm.rect(24, 6, 9, 12, hex('#e8c04a')); bm.rect(25, 7, 7, 4, hex('#d0602e'));
  bm.hline(25, 13, 6, P.ink); bm.hline(25, 15, 4, P.ink);
  // bench
  bm.rect(4, 16, 18, 2, P.metal[2]); bm.hline(4, 16, 18, P.metal[3]);
  bm.vline(5, 18, 4, frame); bm.vline(20, 18, 4, frame);
  bm.outline();
  return { bm, ax: 18, ay: 24 };
}

export function hotdogCart(): PropArt {
  const bm = new Bitmap(30, 34);
  // umbrella
  const y0 = 0;
  for (let y = 0; y < 7; y++) {
    const half = 3 + y * 2;
    for (let x = 15 - half; x < 15 + half; x++) {
      const stripe = Math.floor((x - 15 + 30) / 4) % 2 === 0;
      let c = stripe ? hex('#d23a32') : hex('#f2e6cc');
      if (x > 15 + half * 0.4) c = shadow(c, 0.4);
      bm.px(x, y0 + y, c);
    }
  }
  bm.vline(15, 7, 12, P.metal[1]);
  // cart body
  bm.rect(2, 18, 26, 10, hex('#e8e2d6'));
  bm.hline(2, 18, 26, P.white);
  bm.rect(2, 21, 26, 3, hex('#d23a32'));
  bm.hline(2, 27, 26, hex('#b0a898'));
  bm.rect(3, 16, 24, 2, P.metal[3]); bm.hline(3, 16, 24, P.metal[4]);
  // a row of buns in the window
  for (let x = 6; x < 22; x += 5) { bm.rect(x, 15, 3, 1, hex('#d9a660')); bm.px(x + 1, 15, hex('#b5452a')); }
  // wheel
  bm.ellipse(8, 29.5, 3, 3, hex('#2a2830')); bm.px(8, 29, P.metal[2]);
  bm.rect(24, 28, 1, 4, P.metal[1]);
  bm.outline();
  return { bm, ax: 15, ay: 32 };
}

export function iceCreamCart(): PropArt {
  const bm = new Bitmap(24, 18);
  bm.rect(2, 5, 18, 9, hex('#f2d8e2')); bm.hline(2, 5, 18, P.white);
  bm.rect(2, 9, 18, 2, hex('#7ac0c8'));
  bm.ellipse(5, 14.5, 2.5, 2.5, hex('#2a2830'));
  bm.ellipse(17, 14.5, 2.5, 2.5, hex('#2a2830'));
  bm.rect(20, 3, 1, 6, P.metal[1]); bm.hline(20, 3, 3, P.metal[1]);
  // three cones on top
  [[5, '#f2a0b6'], [9, '#f4ecd4'], [13, '#8a5a3a']].forEach(([x, c]) => {
    bm.rect(x as number, 2, 3, 2, hex(c as string)); bm.px((x as number) + 1, 4, hex('#d9a660'));
  });
  bm.outline();
  return { bm, ax: 11, ay: 16 };
}

export function picnicBasket(): PropArt {
  const bm = new Bitmap(8, 7);
  bm.rect(1, 3, 6, 3, P.wood[3]); bm.hline(1, 3, 6, P.wood[4]);
  bm.hline(1, 4, 6, P.wood[2]);
  bm.line(2, 2, 3, 0, P.wood[2]); bm.line(5, 2, 4, 0, P.wood[2]);
  bm.rect(2, 2, 2, 1, hex('#d23a32'));
  bm.outline();
  return { bm, ax: 4, ay: 6 };
}

export function easel(): PropArt {
  const bm = new Bitmap(12, 20);
  bm.line(2, 19, 6, 0, P.wood[2]); bm.line(10, 19, 6, 0, P.wood[2]); bm.line(6, 4, 6, 19, P.wood[1]);
  bm.rect(1, 3, 10, 8, P.white);
  bm.rect(2, 4, 8, 3, hex('#7ab0d0')); bm.rect(2, 7, 8, 3, hex('#6aa050'));
  bm.ellipse(7, 6, 2, 1.5, hex('#e08a3a'));
  bm.hline(1, 11, 10, P.wood[1]);
  bm.outline();
  return { bm, ax: 6, ay: 19 };
}

/** The shiny bean: a mirrored blob that reflects sky above and grass below. */
export function bean(): PropArt {
  const w = 72, h = 34;
  const bm = new Bitmap(w + 2, h + 2);
  const sky = [hex('#5a7a9a'), hex('#86a8c4'), hex('#b8d0e0'), hex('#e6f0f2')];
  const ground = [hex('#4a5a4a'), hex('#6a7c66'), hex('#8a9c80')];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const nx = (x - w / 2) / (w / 2), ny = (y - h * 0.5) / (h / 2);
      // bean silhouette: wider at the top, a little arch underneath
      const pinch = ny > 0.55 && Math.abs(nx) < 0.28 ? 1 : 0;
      const d = nx * nx * (1 + ny * 0.12) + ny * ny;
      if (d > 1 || pinch) continue;
      // reflection: the upper half shows sky with the town's warm light
      const t = (ny + 1) / 2;
      let col: Color;
      const swirl = Math.sin(nx * 3.2 + ny * 1.4) * 0.12;
      if (t + swirl < 0.52) {
        const k = Math.max(0, Math.min(3, Math.floor((1 - t * 1.6 - nx * 0.3 + swirl) * 4)));
        col = sky[k];
        if (Math.abs(nx + 0.38 - ny * 0.2) < 0.06) col = P.white;
      } else {
        const k = Math.max(0, Math.min(2, Math.floor((1 - t + 0.3 - nx * 0.2) * 3)));
        col = ground[k];
        // a band of tiny reflected people and trees
        if (t > 0.58 && t < 0.66 && noise2(x, 3, 7) < 0.3) col = mix(col, hex('#d0602e'), 0.6);
      }
      if (nx > 0.62) col = shadow(col, 0.35);
      bm.px(x + 1, y + 1, col);
    }
  bm.outline();
  return { bm, ax: w / 2 + 1, ay: h };
}

export function sandcastle(): PropArt {
  const bm = new Bitmap(10, 8);
  const s = P.sand[2], sd = P.sand[1];
  bm.rect(1, 3, 8, 4, s); bm.rect(2, 1, 2, 2, s); bm.rect(6, 1, 2, 2, s);
  bm.px(2, 0, sd); bm.px(7, 0, sd); bm.vline(8, 3, 4, sd); bm.px(4, 5, sd); bm.px(5, 5, sd);
  bm.px(7, -1 + 1, hex('#d23a32'));
  bm.outline();
  return { bm, ax: 5, ay: 7 };
}

export function swingSet(): PropArt {
  const w = 44, h = 30;
  const bm = new Bitmap(w, h);
  const c = hex('#c8462e'), cl = hex('#e0684a');
  bm.hline(2, 1, w - 4, c); bm.hline(2, 0, w - 4, cl);
  bm.line(3, 1, 0, h - 1, c); bm.line(3, 1, 7, h - 1, c);
  bm.line(w - 4, 1, w - 8, h - 1, c); bm.line(w - 4, 1, w - 1, h - 1, c);
  bm.outline();
  return { bm, ax: w / 2, ay: h - 1 };
}

export function slide(): PropArt {
  const bm = new Bitmap(34, 34);
  const frame = hex('#3a6aa8'), frameL = hex('#5a8ac8');
  const chute = hex('#e8b83a'), chuteL = hex('#f4d468'), chuteS = hex('#c08a1e');
  // tower
  bm.rect(2, 4, 12, 4, hex('#a8642e')); bm.hline(2, 4, 12, hex('#c8844e'));
  bm.vline(2, 8, 24, frame); bm.vline(13, 8, 24, frame);
  bm.vline(3, 8, 24, frameL);
  for (let y = 11; y < 30; y += 4) bm.hline(3, y, 10, frameL);
  // roof
  for (let y = 0; y < 4; y++) bm.hline(4 - y, y, 8 + y * 2, y < 2 ? hex('#e0402e') : hex('#b8302a'));
  // chute curving down to the right
  for (let i = 0; i < 20; i++) {
    const x = 14 + i, y = 7 + Math.round(i * 1.1 + Math.max(0, i - 14) * -0.6);
    bm.vline(x, y, 3, chute); bm.px(x, y, chuteL); bm.px(x, y + 3, chuteS);
  }
  bm.outline();
  return { bm, ax: 10, ay: 32 };
}

export function climbingDome(): PropArt {
  const bm = new Bitmap(30, 18);
  const c = hex('#3f8a56');
  for (let a = 0; a <= 8; a++) {
    const ang = (a / 8) * Math.PI;
    for (let t = 0; t < 1; t += 0.02) {
      const x = 15 + Math.cos(ang) * 13 * Math.sin(t * Math.PI);
      const y = 16 - Math.sin(t * Math.PI) * 15;
      bm.px(Math.round(15 + (x - 15) * 1), Math.round(y), c);
    }
  }
  for (let k = 1; k <= 3; k++) {
    const yy = 16 - k * 4;
    const half = Math.sqrt(Math.max(0, 1 - Math.pow((16 - yy) / 15, 2))) * 13;
    bm.hline(Math.round(15 - half), yy, Math.round(half * 2), hex('#5aa870'));
  }
  bm.outline();
  return { bm, ax: 15, ay: 17 };
}

export function seesaw(tilt: number): PropArt {
  const bm = new Bitmap(30, 12);
  bm.rect(13, 7, 4, 4, hex('#3a6aa8'));
  bm.line(1, 6 + tilt * 3, 28, 6 - tilt * 3, hex('#e0402e'));
  bm.line(1, 7 + tilt * 3, 28, 7 - tilt * 3, hex('#b8302a'));
  bm.outline();
  return { bm, ax: 15, ay: 11 };
}

export function tennisNet(len: number): PropArt {
  // the net runs top to bottom across the court; seen from above it's a
  // thin band with posts at each end and a little height
  const bm = new Bitmap(6, len + 8);
  bm.vline(1, 0, len + 7, P.metal[0]);
  bm.vline(4, 0, len + 7, P.metal[0]);
  for (let y = 0; y < len + 4; y++) for (let x = 2; x <= 3; x++) if ((x + y) % 2) bm.px(x, y + 2, hex('#2a2a30'));
  for (let y = 2; y < len + 5; y++) bm.px(2, y, P.white);
  bm.rect(0, 0, 6, 3, P.metal[1]); bm.rect(0, len + 5, 6, 3, P.metal[1]);
  return { bm, ax: 3, ay: len + 7 };
}

export function sailboat(): PropArt {
  const bm = new Bitmap(22, 26);
  bm.vline(10, 1, 19, P.wood[1]);
  for (let y = 2; y < 18; y++) { const half = (y - 2) * 0.55; bm.hline(11, y, Math.round(half), y < 6 ? P.white : P.cream); }
  for (let y = 6; y < 18; y++) { const half = (y - 6) * 0.5; bm.hline(Math.round(10 - half), y, Math.round(half), hex('#d0602e')); }
  bm.rect(3, 19, 17, 3, P.white); bm.hline(4, 22, 15, hex('#2e4482')); bm.hline(5, 23, 13, hex('#2e4482'));
  bm.outline();
  return { bm, ax: 11, ay: 23 };
}

export function rowboat(): PropArt {
  const bm = new Bitmap(18, 7);
  bm.rect(2, 1, 14, 4, P.wood[3]); bm.hline(2, 1, 14, P.wood[4]); bm.hline(3, 5, 12, P.wood[1]);
  bm.rect(5, 2, 8, 2, P.wood[2]);
  bm.outline();
  return { bm, ax: 9, ay: 6 };
}

export function screenFrame(w: number, h: number): PropArt {
  // the rooftop cinema screen: white canvas on a black frame and two legs
  const bm = new Bitmap(w + 4, h + 10);
  bm.rect(0, 0, w + 4, h + 4, hex('#18161e'));
  bm.vline(4, h + 4, 6, hex('#18161e')); bm.vline(w - 1, h + 4, 6, hex('#18161e'));
  return { bm, ax: (w + 4) / 2, ay: h + 9 };
}

export function deckChair(c: Color): PropArt {
  const bm = new Bitmap(9, 8);
  bm.rect(1, 1, 7, 5, c); bm.hline(1, 1, 7, sunlit(c));
  bm.vline(1, 5, 2, P.wood[2]); bm.vline(7, 5, 2, P.wood[2]);
  bm.outline();
  return { bm, ax: 4, ay: 7 };
}

export function projector(): PropArt {
  const bm = new Bitmap(10, 12);
  bm.line(2, 11, 5, 5, P.metal[1]); bm.line(8, 11, 5, 5, P.metal[1]);
  bm.rect(1, 1, 8, 5, P.metal[1]); bm.ellipse(3, 1, 2, 2, P.metal[2]); bm.ellipse(7, 1, 2, 2, P.metal[2]);
  bm.rect(4, 2, 2, 2, P.glow[3]);
  bm.outline();
  return { bm, ax: 5, ay: 11 };
}

export function kiteArt(): PropArt {
  const bm = new Bitmap(9, 14);
  bm.line(4, 0, 0, 4, hex('#d23a32')); bm.line(4, 0, 8, 4, hex('#e8b83a'));
  for (let y = 0; y < 9; y++) { const half = y < 4 ? y : 8 - y; bm.hline(4 - half, y, half * 2 + 1, y < 4 ? hex('#e8b83a') : hex('#d23a32')); }
  bm.vline(4, 0, 9, hex('#2e4482')); bm.hline(1, 4, 7, hex('#2e4482'));
  bm.px(4, 10, P.white); bm.px(3, 11, hex('#d23a32')); bm.px(4, 12, P.white); bm.px(5, 13, hex('#e8b83a'));
  return { bm, ax: 4, ay: 9 };
}

export function crate(c: Color = P.wood[3]): PropArt {
  const bm = new Bitmap(8, 7);
  bm.rect(0, 0, 8, 7, c); bm.hline(0, 0, 8, sunlit(c)); bm.rect(1, 2, 6, 1, shadow(c)); bm.rect(1, 4, 6, 1, shadow(c));
  bm.outline();
  return { bm, ax: 4, ay: 6 };
}

export function dumpster(): PropArt {
  const bm = new Bitmap(24, 15);
  const c = hex('#2f5a44'), cl = hex('#3f7458'), cs = hex('#224634');
  bm.rect(1, 3, 22, 9, c); bm.hline(1, 3, 22, cl); bm.vline(22, 3, 9, cs);
  bm.rect(0, 1, 24, 3, hex('#2a2a30')); bm.hline(0, 1, 24, hex('#45454e'));
  bm.rect(3, 12, 2, 2, hex('#2a2830')); bm.rect(19, 12, 2, 2, hex('#2a2830'));
  bm.hline(4, 6, 16, cs);
  bm.outline();
  return { bm, ax: 12, ay: 14 };
}

export function garbageBin(c: Color = hex('#2a2a30')): PropArt {
  const bm = new Bitmap(8, 12);
  bm.rect(1, 2, 6, 9, c); bm.vline(1, 2, 9, sunlit(c)); bm.hline(0, 1, 8, sunlit(c));
  bm.rect(2, 0, 4, 1, sunlit(c));
  bm.outline();
  return { bm, ax: 4, ay: 11 };
}

export function pumpkin(big = false): PropArt {
  const w = big ? 8 : 6, h = big ? 6 : 5;
  const bm = new Bitmap(w + 2, h + 2);
  bm.ellipse((w + 2) / 2, h / 2 + 1.5, w / 2, h / 2, (x) => (x % 2 ? hex('#e07a26') : hex('#c8601e')));
  bm.px(Math.floor((w + 2) / 2), 0, P.leafGreen[1]); bm.px(Math.floor((w + 2) / 2), 1, P.leafGreen[2]);
  bm.px(Math.floor((w + 2) / 2) - 1, 2, hex('#f4a050'));
  bm.outline();
  return { bm, ax: Math.floor((w + 2) / 2), ay: h + 1 };
}

export function skeleton(): PropArt {
  // a plastic porch skeleton slumped in a chair, waving to no one
  const W = P.white, S = hex('#c8c2b4'), D = hex('#2a2430');
  const bm = new Bitmap(10, 16);
  bm.stamp([
    '...WWW....',
    '..WDWDW...',
    '..WWWWW...',
    '...WDW....',
    '....W..W..',
    '.WWWWWWW..',
    '.W..W.....',
    '.W.WWW....',
    '.W..W.....',
    '...WWW....',
    '..W...W...',
    '.SSSSSSSS.',
    '.S..W...WS',
    '.S..W...WS',
    '.S..WW..WW',
    '.S.......S',
  ], 0, 0, { W, S, D });
  bm.outline();
  return { bm, ax: 5, ay: 15 };
}

export function guitarCase(): PropArt {
  const bm = new Bitmap(14, 6);
  bm.rect(1, 1, 12, 4, hex('#2a2430')); bm.rect(2, 2, 10, 2, hex('#7a2a40'));
  bm.px(4, 2, hex('#e8c04a')); bm.px(7, 3, hex('#c0c0c0')); bm.px(9, 2, hex('#e8c04a'));
  bm.outline();
  return { bm, ax: 7, ay: 5 };
}

export function fireHydrantSpray(): PropArt {
  return hydrant();
}

export function nest(): PropArt {
  const bm = new Bitmap(10, 5);
  for (let x = 0; x < 10; x++) for (let y = 1; y < 4; y++) if ((x + y) % 2 || y === 2) bm.px(x, y, (x * 7 + y) % 3 ? P.wood[2] : P.wood[3]);
  bm.hline(1, 4, 8, P.wood[1]);
  bm.outline();
  return { bm, ax: 5, ay: 4 };
}

export function cube(solved: boolean, step = 0): PropArt {
  // a 3x3 cube drawn at 1px per sticker with a top face and front face
  const cols = [hex('#e0402e'), hex('#f2d03a'), hex('#3a7ad0'), hex('#3f9a56'), hex('#f08a2a'), P.white];
  const bm = new Bitmap(5, 7);
  for (let y = 0; y < 2; y++) for (let x = 0; x < 3; x++) bm.px(x + 1, y + 1, solved ? P.white : cols[(x * 3 + y * 5 + step) % 6]);
  for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) bm.px(x + 1, y + 3, solved ? cols[0] : cols[(x * 2 + y * 4 + step * 2 + 1) % 6]);
  bm.outline();
  return { bm, ax: 2, ay: 6 };
}

// ---- refinement pass: market, games, families -----------------------------

/** A market stall: striped canopy on poles, a counter piled with goods. */
export function marketStall(a: Color, b: Color, goods: Color[], sign?: Color): PropArt {
  const w = 34, h = 30;
  const bm = new Bitmap(w, h);
  // canopy, seen from above and a little in front
  for (let y = 0; y < 8; y++)
    for (let x = 1; x < w - 1; x++) {
      let c = Math.floor((x - 1) / 4) % 2 ? a : b;
      if (y < 2) c = sunlit(c, 0.9);
      if (y > 5) c = shadow(c, 0.25);
      bm.px(x, y, c);
    }
  for (let x = 1; x < w - 1; x++) if (x % 4 !== 3) bm.px(x, 8, shadow(Math.floor((x - 1) / 4) % 2 ? a : b, 0.4));
  // poles
  bm.vline(2, 9, 18, P.wood[1]); bm.vline(w - 3, 9, 18, P.wood[1]);
  // counter
  bm.rect(1, 18, w - 2, 9, P.wood[3]); bm.hline(1, 18, w - 2, P.wood[4]);
  for (let x = 2; x < w - 2; x += 5) bm.vline(x, 20, 7, P.wood[2]);
  bm.hline(1, 26, w - 2, P.wood[1]);
  // goods piled on the counter (crates of round things)
  for (let i = 0; i < 6; i++) {
    const gx = 3 + i * 5, c = goods[i % goods.length];
    bm.rect(gx, 15, 4, 3, c); bm.px(gx, 15, sunlit(c)); bm.px(gx + 2, 14, c); bm.px(gx + 3, 16, shadow(c, 0.5));
  }
  if (sign) { bm.rect(10, 20, 14, 5, P.cream); bm.hline(11, 22, 12, sign); }
  bm.outline();
  return { bm, ax: w / 2, ay: 27 };
}

export function chessTable(): PropArt {
  const bm = new Bitmap(14, 10);
  const stone = P.concrete[3], stoneD = P.concrete[1];
  bm.rect(1, 1, 12, 5, stone); bm.hline(1, 1, 12, P.concrete[4]);
  for (let y = 0; y < 3; y++) for (let x = 0; x < 6; x++) if ((x + y) % 2) bm.px(4 + x, 2 + y, P.ink); else bm.px(4 + x, 2 + y, P.cream);
  bm.hline(1, 6, 12, stoneD);
  bm.rect(5, 7, 4, 2, stoneD);
  bm.outline();
  return { bm, ax: 7, ay: 8 };
}

export function stroller(c: Color): PropArt {
  const bm = new Bitmap(12, 11);
  // hood, basket, handle, wheels
  bm.rect(2, 1, 6, 4, c); bm.hline(2, 1, 6, sunlit(c)); bm.px(7, 2, shadow(c));
  bm.rect(2, 5, 7, 2, shadow(c, 0.4));
  bm.line(9, 5, 11, 1, P.metal[1]);
  bm.rect(2, 8, 2, 2, hex('#2a2830')); bm.rect(7, 8, 2, 2, hex('#2a2830'));
  bm.line(3, 7, 8, 7, P.metal[1]);
  bm.outline();
  return { bm, ax: 6, ay: 10 };
}

export function grill(): PropArt {
  const bm = new Bitmap(10, 11);
  bm.ellipse(5, 3.5, 4, 2.6, hex('#2a2830'));
  bm.hline(2, 2, 6, hex('#d0602e')); bm.px(4, 3, hex('#f2b43a'));
  bm.line(2, 5, 1, 10, hex('#2a2830')); bm.line(8, 5, 9, 10, hex('#2a2830')); bm.line(5, 6, 5, 10, hex('#2a2830'));
  bm.outline();
  return { bm, ax: 5, ay: 10 };
}

export function musicStand(): PropArt {
  const bm = new Bitmap(8, 14);
  bm.rect(1, 1, 6, 4, P.white); bm.hline(2, 2, 4, P.ink); bm.hline(2, 3, 3, P.ink);
  bm.vline(4, 5, 8, P.metal[1]); bm.line(2, 13, 4, 11, P.metal[1]); bm.line(6, 13, 4, 11, P.metal[1]);
  bm.outline();
  return { bm, ax: 4, ay: 13 };
}

export function bubbleArt(r: number): PropArt {
  const s = Math.ceil(r * 2 + 2);
  const bm = new Bitmap(s, s);
  bm.ellipse(s / 2, s / 2, r, r, (x, y, d) => (d > 0.6 ? hex('#cfe8f0') : undefined));
  bm.px(Math.floor(s / 2 - r / 2), Math.floor(s / 2 - r / 2), P.white);
  return { bm, ax: s / 2, ay: s / 2 };
}
