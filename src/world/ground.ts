import { Bitmap } from '../art/bitmap';
import { hex, mix, shadow, sunlit } from '../art/color';
import { P } from '../art/palette';
import { bayer, noise2, smooth2, rng } from '../art/rng';
import {
  WORLD_W, WORLD_H, TRACK, SIDEWALK_N, STREET, SIDEWALK_S, PARK_TOP, PROMENADE, SEAWALL, LAKE_TOP,
  CROSSWALK, PLAYGROUND, POND, PLAZA, COURT, COURT_LINES, PATH_EW, PATH_NS, PATH_COURT, PATH_PLAY, PATH_PIER, PIER, PARK_GATES, FENCE_Y,
} from './layout';

// The ground plane: alley, sidewalks, street, the park's lawns and paths,
// the pond, the court, the promenade and the lake. Painted once.

const pick = (ramp: number[], v: number) => ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor(v * ramp.length)))];

export function paintGround(bm: Bitmap) {
  alley(bm);
  sidewalk(bm, SIDEWALK_N.top, SIDEWALK_N.bottom, 1);
  street(bm);
  sidewalk(bm, SIDEWALK_S.top, SIDEWALK_S.bottom, 2);
  park(bm);
  lakefront(bm);
}

function alley(bm: Bitmap) {
  // the alley: old patched concrete, lighter and warmer than the street
  for (let y = 0; y < SIDEWALK_N.top; y++)
    for (let x = 0; x < WORLD_W; x++) {
      const n = smooth2(x, y, 11, 3) * 0.5 + noise2(x, y, 4) * 0.5;
      let c = pick(P.concrete, 0.12 + n * 0.4);
      if (smooth2(x, y, 23, 5) > 0.72) c = mix(c, P.path[1], 0.2);
      bm.px(x, y, c);
    }
  // a strip of gravel and weeds along the back fences, cracks with grass
  for (let x = 0; x < WORLD_W; x++) {
    for (let y = TRACK.fasciaBottom; y < TRACK.fasciaBottom + 6; y++) if (noise2(x, y, 9) < 0.5) bm.px(x, y, pick(P.path, noise2(x, y, 2) * 0.5));
    if (noise2(x, 1, 11) < 0.3) bm.px(x, TRACK.fasciaBottom + 6, P.grass[2]);
    if (noise2(x, 2, 12) < 0.15) bm.px(x, TRACK.fasciaBottom + 5, P.grass[3]);
  }
  for (let y = 40; y < 140; y += 1) {
    const x = 300 + Math.round(Math.sin(y * 0.3) * 3 + y * 0.4);
    if (noise2(x, y, 13) < 0.5) bm.px(x, y, P.concrete[0]);
  }
}

function sidewalk(bm: Bitmap, top: number, bottom: number, seed: number) {
  for (let y = top; y < bottom; y++)
    for (let x = 0; x < WORLD_W; x++) {
      const slabX = (x + (y < (top + bottom) / 2 ? 0 : 8)) % 16;
      const seam = slabX === 0 || (y - top) % 12 === 0;
      let v = 0.62 + (noise2(x, y, seed) - 0.5) * 0.12 + smooth2(x, y, 20, seed) * 0.12;
      if (seam) v -= 0.22;
      bm.px(x, y, pick(P.concrete, v));
    }
  // curb edge
  bm.hline(0, top, WORLD_W, P.concrete[4]);
  bm.hline(0, bottom - 1, WORLD_W, P.concrete[1]);
  bm.hline(0, bottom, WORLD_W, P.concrete[0]);
  bm.hline(0, bottom + 1, WORLD_W, P.asphalt[0]);
  // a few cracks and a scatter of fallen leaves blown off the park
  const R = rng(seed * 77);
  for (let i = 0; i < 26; i++) {
    let x = R.int(0, WORLD_W), y = R.int(top + 2, bottom - 3);
    for (let k = 0; k < R.int(3, 7); k++) { bm.px(x, y, P.concrete[1]); x += R.int(0, 1); y += R.int(-1, 1); }
  }
  for (let i = 0; i < 160; i++) {
    const x = R.int(0, WORLD_W), y = R.int(top + 1, bottom - 2);
    bm.px(x, y, R.pick([P.leafOrange[3], P.leafGold[3], P.leafRed[3], P.leafOrange[2]]));
  }
}

function street(bm: Bitmap) {
  for (let y = STREET.top; y < STREET.bottom; y++)
    for (let x = 0; x < WORLD_W; x++) {
      const n = noise2(x, y, 21) * 0.5 + smooth2(x, y, 14, 22) * 0.5;
      let v = 0.35 + n * 0.45;
      // tyre-polished bands in each lane
      const dy1 = Math.abs(y - (STREET.laneN - 6)), dy2 = Math.abs(y - (STREET.laneS - 6));
      if (dy1 > 6 && dy1 < 9) v += 0.08;
      if (dy2 > 6 && dy2 < 9) v += 0.08;
      bm.px(x, y, pick(P.asphalt, v));
    }
  // gutters
  bm.hline(0, STREET.top + 1, WORLD_W, P.asphalt[0]);
  bm.hline(0, STREET.bottom - 2, WORLD_W, P.asphalt[0]);
  // double yellow centre line
  for (let x = 0; x < WORLD_W; x++) {
    if (x >= CROSSWALK.x - 6 && x < CROSSWALK.x + CROSSWALK.w + 6) continue;
    const worn = noise2(x, 0, 30) < 0.08;
    if (!worn) { bm.px(x, STREET.centre - 1, P.lane); bm.px(x, STREET.centre + 1, P.lane); }
  }
  // zebra crossing to the park gate
  for (let x = CROSSWALK.x; x < CROSSWALK.x + CROSSWALK.w; x++)
    for (let y = STREET.top + 4; y < STREET.bottom - 4; y++)
      if (Math.floor((x - CROSSWALK.x) / 5) % 2 === 0 && noise2(x, y, 31) > 0.07) bm.px(x, y, mix(P.paint, P.asphalt[3], noise2(x, y, 3) * 0.3));
  // stop lines
  bm.vline(CROSSWALK.x - 6, STREET.centre + 3, STREET.bottom - STREET.centre - 7, P.paint);
  bm.vline(CROSSWALK.x + CROSSWALK.w + 5, STREET.top + 4, STREET.centre - STREET.top - 7, P.paint);
  // bike lane symbol and manholes
  for (const [x, y] of [[300, 350], [980, 394], [1330, 352]]) {
    bm.ellipse(x, y, 5, 3, P.asphalt[0]);
    bm.ellipse(x, y, 4, 2.2, (xx, yy) => ((xx + yy) % 2 ? P.metal[0] : P.asphalt[1]));
  }
  for (const x of [120, 520, 880, 1250]) {
    bm.rect(x, STREET.bottom - 4, 8, 2, P.asphalt[0]);
    for (let i = 0; i < 8; i += 2) bm.px(x + i, STREET.bottom - 3, P.metal[1]);
  }
}

// ---- the park ---------------------------------------------------------------

function inEllipse(x: number, y: number, cx: number, cy: number, rx: number, ry: number) {
  const dx = (x - cx) / rx, dy = (y - cy) / ry;
  return dx * dx + dy * dy;
}

function brushPath(bm: Bitmap, pts: [number, number][], width: number, mask: Uint8Array) {
  const r = width / 2;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    const len = Math.hypot(x1 - x0, y1 - y0);
    for (let s = 0; s <= len; s += 1) {
      // Catmull-Rom-ish softening: ease between segment points
      const t = s / len;
      const cx = x0 + (x1 - x0) * t, cy = y0 + (y1 - y0) * t;
      for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
        for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++) {
          if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) continue;
          const d = Math.hypot((x - cx) / 1.25, y - cy);
          const i2 = y * WORLD_W + x;
          if (d < r - 1.2) mask[i2] = 2;
          else if (d < r && mask[i2] < 2) mask[i2] = Math.max(mask[i2], 1);
        }
    }
  }
}

export interface ParkMasks {
  path: Uint8Array;
}

function park(bm: Bitmap) {
  const top = PARK_TOP - 4;
  // lawn: a calm mid green with fine texture, faint patches, and mowing
  // stripes across the big lawn
  for (let y = top; y < PROMENADE.top; y++)
    for (let x = 0; x < WORLD_W; x++) {
      let v = 0.52 + (smooth2(x, y, 34, 40) - 0.5) * 0.22 + (smooth2(x, y, 6, 41) - 0.5) * 0.14;
      v += (noise2(x, y, 42) - 0.5) * 0.16;
      const inLawn = x > 400 && x < 990 && y > 470;
      if (inLawn && Math.floor((x - y * 0.5) / 18) % 2 === 0) v += 0.09;
      v += (bayer(x, y) - 0.5) * 0.12;
      let c = pick(P.grass, 0.2 + v * 0.7);
      // drier, browner grass in a few patches (it is November)
      const dry = smooth2(x, y, 48, 44);
      if (dry > 0.7) c = mix(c, P.grassDry[1], Math.min(0.5, (dry - 0.7) * 3));
      bm.px(x, y, c);
    }
  // grass tufts with a lighter tip
  const R = rng(5);
  for (let i = 0; i < 1800; i++) {
    const x = R.int(0, WORLD_W - 1), y = R.int(top + 2, PROMENADE.top - 2);
    const c = bm.get(x, y);
    bm.px(x, y - 1, sunlit(c, 0.9));
    bm.px(x, y, shadow(c, 0.3));
  }

  // paths
  const mask = new Uint8Array(WORLD_W * WORLD_H);
  brushPath(bm, PATH_EW, 14, mask);
  brushPath(bm, PATH_NS, 16, mask);
  brushPath(bm, PATH_COURT, 14, mask);
  brushPath(bm, PATH_PLAY, 10, mask);
  brushPath(bm, PATH_PIER, 10, mask);
  for (const g of PARK_GATES) for (let y = top; y < PARK_TOP + 14; y++) for (let x = g.x + 4; x < g.x + g.w - 4; x++) mask[y * WORLD_W + x] = 2;
  // plaza: an oval of pavers
  for (let y = PLAZA.cy - PLAZA.ry - 2; y < PLAZA.cy + PLAZA.ry + 2; y++)
    for (let x = PLAZA.cx - PLAZA.rx - 2; x < PLAZA.cx + PLAZA.rx + 2; x++) {
      const d = inEllipse(x, y, PLAZA.cx, PLAZA.cy, PLAZA.rx, PLAZA.ry);
      if (d < 1) mask[y * WORLD_W + x] = 3;
      else if (d < 1.06) mask[y * WORLD_W + x] = 4;
    }
  for (let y = top; y < PROMENADE.top; y++)
    for (let x = 0; x < WORLD_W; x++) {
      const m = mask[y * WORLD_W + x];
      if (m === 2) {
        let v = 0.55 + (noise2(x, y, 50) - 0.5) * 0.3 + (bayer(x, y) - 0.5) * 0.15;
        if (noise2(x, y, 51) < 0.03) v -= 0.3; // pebbles
        if (noise2(x, y, 52) < 0.02) v += 0.3;
        bm.px(x, y, pick(P.path, v));
      } else if (m === 1) {
        bm.px(x, y, noise2(x, y, 53) < 0.5 ? P.path[0] : shadow(bm.get(x, y), 0.25));
      } else if (m === 3) {
        // pavers in rings around the bean
        const a = Math.atan2((y - PLAZA.cy) * 1.9, x - PLAZA.cx) + Math.PI;
        const d = Math.sqrt(inEllipse(x, y, PLAZA.cx, PLAZA.cy, PLAZA.rx, PLAZA.ry));
        const ring = Math.floor(d * 11);
        const seg = Math.floor((a / (Math.PI * 2)) * (20 + ring * 8) + ring * 0.5);
        const edgeR = (d * 11) % 1 < 0.12;
        const edgeA = ((a / (Math.PI * 2)) * (20 + ring * 8) + ring * 0.5) % 1 < 0.1;
        let c = (seg + ring) % 5 === 0 ? P.concrete[3] : P.concrete[4];
        if (ring % 3 === 2) c = mix(P.brickTan[3], P.concrete[4], 0.5);
        if (edgeR || edgeA) c = P.concrete[2];
        c = mix(c, P.concrete[2], noise2(x, y, 60) * 0.2);
        bm.px(x, y, c);
      } else if (m === 4) {
        bm.px(x, y, P.concrete[1]);
      }
    }

  playground(bm);
  pond(bm);
  court(bm);
  flowerBeds(bm, mask);
  fenceBase(bm);
}

function playground(bm: Bitmap) {
  const { x, y, w, h } = PLAYGROUND;
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      // rounded corners
      const cx = i < 12 ? 12 - i : i > w - 13 ? i - (w - 13) : 0;
      const cy = j < 12 ? 12 - j : j > h - 13 ? j - (h - 13) : 0;
      if (cx * cx + cy * cy > 144) continue;
      const edge = cx * cx + cy * cy > 110 || i === 0 || j === 0 || i === w - 1 || j === h - 1;
      let c = noise2(x + i, y + j, 70) < 0.12 ? P.rubber[2] : P.rubber[1];
      if (noise2(x + i, y + j, 71) < 0.05) c = hex('#c8a04a');
      if (noise2(x + i, y + j, 72) < 0.03) c = hex('#4a7ab0');
      if (edge) c = P.concrete[3];
      bm.px(x + i, y + j, c);
    }
  // hopscotch painted on
  const hx = x + 230, hy = y + 120;
  const cells = [[0, 0], [0, 1], [-1, 2], [1, 2], [0, 3], [-1, 4], [1, 4], [0, 5]];
  for (const [cx, cy] of cells) {
    const px = hx + cx * 9, py = hy - cy * 7;
    for (let i = 0; i < 9; i++) { bm.px(px + i, py, P.white); bm.px(px + i, py + 6, P.white); }
    for (let j = 0; j < 7; j++) { bm.px(px, py + j, P.white); bm.px(px + 8, py + j, P.white); }
  }
  // sandbox
  const sx = x + 172, sy = y + 104, sw = 46, sh = 34;
  bm.rect(sx - 2, sy - 2, sw + 4, sh + 4, P.wood[2]);
  bm.hline(sx - 2, sy - 2, sw + 4, P.wood[4]);
  bm.hline(sx - 2, sy + sh + 1, sw + 4, P.wood[0]);
  for (let j = 0; j < sh; j++) for (let i = 0; i < sw; i++) bm.px(sx + i, sy + j, pick(P.sand, 0.45 + (noise2(i, j, 73) - 0.5) * 0.4 + (bayer(i, j) - 0.5) * 0.2));
}

function pond(bm: Bitmap) {
  const { cx, cy, rx, ry } = POND;
  for (let y = Math.floor(cy - ry - 6); y < cy + ry + 6; y++)
    for (let x = Math.floor(cx - rx - 8); x < cx + rx + 8; x++) {
      const wob = Math.sin(x * 0.05) * 0.05 + Math.sin(y * 0.11 + 1) * 0.04;
      const d = inEllipse(x, y, cx, cy, rx, ry) + wob;
      if (d < 0.86) {
        // deeper water towards the centre, the north bank's reflection on top
        let v = 0.25 + d * 0.5 + (noise2(x, y, 80) - 0.5) * 0.08 + (bayer(x, y) - 0.5) * 0.12;
        if (y < cy - ry * 0.55) v -= 0.15;
        let c = pick(P.pond, v);
        if ((y + Math.floor(x / 9)) % 6 === 0 && noise2(x, y, 81) < 0.25) c = P.pond[4];
        bm.px(x, y, c);
      } else if (d < 0.92) bm.px(x, y, P.pond[0]);
      else if (d < 1.06) bm.px(x, y, pick(P.path, 0.3 + noise2(x, y, 82) * 0.5));
    }
  // stones around the edge
  const R = rng(83);
  for (let i = 0; i < 40; i++) {
    const a = R.next() * Math.PI * 2;
    const x = cx + Math.cos(a) * (rx * 1.0), y = cy + Math.sin(a) * (ry * 1.0);
    bm.ellipse(x, y, R.range(1.5, 3), R.range(1, 2), P.concrete[R.int(2, 3)]);
    bm.px(Math.round(x - 1), Math.round(y - 1), P.concrete[4]);
  }
  // lily pads
  for (let i = 0; i < 14; i++) {
    const a = R.next() * Math.PI * 2, d = R.range(0.35, 0.75);
    const x = cx + 30 + Math.cos(a) * rx * d * 0.6, y = cy + Math.sin(a) * ry * d;
    bm.ellipse(x, y, 2.5, 1.5, P.leafGreen[2]);
    bm.px(Math.round(x), Math.round(y), P.pond[2]);
    if (R.chance(0.3)) bm.px(Math.round(x - 1), Math.round(y - 1), hex('#f2a0b6'));
  }
}

function court(bm: Bitmap) {
  const { x, y, w, h } = COURT;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) bm.px(x + i, y + j, pick(P.courtSurround, 0.5 + (noise2(i, j, 90) - 0.5) * 0.25));
  const L = COURT_LINES;
  const m = 18;
  for (let j = -m; j < L.h + m; j++)
    for (let i = -m * 1.6; i < L.w + m * 1.6; i++)
      bm.px(L.x + i, L.y + j, pick(P.court, 0.55 + (noise2(i, j, 91) - 0.5) * 0.18));
  const line = P.white;
  // doubles and singles lines, baselines, service boxes, centre marks
  bm.hline(L.x, L.y, L.w + 1, line); bm.hline(L.x, L.y + L.h, L.w + 1, line);
  bm.hline(L.x, L.y + 12, L.w + 1, line); bm.hline(L.x, L.y + L.h - 12, L.w + 1, line);
  bm.vline(L.x, L.y, L.h + 1, line); bm.vline(L.x + L.w, L.y, L.h + 1, line);
  const sv = Math.round(L.w * 0.27);
  bm.vline(L.x + L.w / 2 - sv, L.y + 12, L.h - 24, line); bm.vline(L.x + L.w / 2 + sv, L.y + 12, L.h - 24, line);
  bm.hline(L.x + L.w / 2 - sv, L.y + L.h / 2, sv * 2, line);
  bm.hline(L.x, L.y + L.h / 2, 3, line); bm.hline(L.x + L.w - 2, L.y + L.h / 2, 3, line);
  // the net's shadow
  for (let j = 0; j < L.h + 8; j++) { bm.shade(L.x + L.w / 2 + 3, L.y - 4 + j, 0.8); bm.shade(L.x + L.w / 2 + 4, L.y - 4 + j, 0.5); }
}

function flowerBeds(bm: Bitmap, mask: Uint8Array) {
  const R = rng(100);
  const beds: [number, number, number, number, number[]][] = [
    [PLAZA.cx - 40, PLAZA.cy + PLAZA.ry + 10, 26, 7, [hex('#e0584a'), hex('#f2b43a')]],
    [PLAZA.cx + 60, PLAZA.cy - PLAZA.ry - 12, 22, 6, [hex('#c45a86'), P.white]],
    [470, 458, 60, 6, [hex('#f08a2a'), hex('#e8c04a'), hex('#c83a32')]],
    [880, 458, 70, 6, [hex('#c45a86'), hex('#f2b43a')]],
  ];
  for (const [bx, by, bw, bh, cols] of beds) {
    bm.ellipse(bx + bw / 2, by + bh / 2, bw / 2 + 1, bh / 2 + 1, P.wood[1]);
    bm.ellipse(bx + bw / 2, by + bh / 2, bw / 2, bh / 2, (x, y) => (noise2(x, y, 101) < 0.5 ? P.leafGreen[1] : P.leafGreen[2]));
    for (let i = 0; i < bw * bh * 0.5; i++) {
      const x = bx + R.int(1, bw - 2), y = by + R.int(0, bh - 1);
      if (inEllipse(x, y, bx + bw / 2, by + bh / 2, bw / 2, bh / 2) < 0.8 && mask[y * WORLD_W + x] === 0) bm.px(x, y, R.pick(cols));
    }
  }
}

function fenceBase(bm: Bitmap) {
  // a low curb the park fence stands on
  for (let x = 0; x < WORLD_W; x++) {
    if (PARK_GATES.some((g) => x >= g.x + 2 && x < g.x + g.w - 2)) continue;
    bm.px(x, FENCE_Y + 2, P.concrete[3]);
    bm.px(x, FENCE_Y + 3, P.concrete[1]);
  }
}

function lakefront(bm: Bitmap) {
  // promenade
  for (let y = PROMENADE.top; y < PROMENADE.bottom; y++)
    for (let x = 0; x < WORLD_W; x++) {
      const seam = x % 24 === 0 || y === PROMENADE.top + 9;
      let v = 0.6 + (noise2(x, y, 110) - 0.5) * 0.12;
      if (seam) v -= 0.2;
      bm.px(x, y, pick(P.concrete, v));
    }
  bm.hline(0, PROMENADE.top, WORLD_W, P.concrete[2]);
  // the painted bike lane line down the promenade
  for (let x = 0; x < WORLD_W; x++) if (Math.floor(x / 8) % 2 === 0) bm.px(x, PROMENADE.top + 9, P.lane);
  // sea wall: big limestone blocks
  for (let y = SEAWALL.top; y < SEAWALL.bottom; y++)
    for (let x = 0; x < WORLD_W; x++) {
      const bx = Math.floor((x + (y > SEAWALL.top + 3 ? 10 : 0)) / 20);
      const seam = (x + (y > SEAWALL.top + 3 ? 10 : 0)) % 20 === 0 || y === SEAWALL.top + 4;
      let c = (bx % 3 === 0 ? P.greystone[3] : P.greystone[2]);
      if (y === SEAWALL.top) c = P.greystone[4];
      if (seam) c = P.greystone[1];
      bm.px(x, y, c);
    }
  // the lake: Lake Michigan blue, darker further out, lines of chop
  for (let y = LAKE_TOP; y < WORLD_H; y++)
    for (let x = 0; x < WORLD_W; x++) {
      const t = (y - LAKE_TOP) / (WORLD_H - LAKE_TOP);
      let v = 0.75 - t * 0.55 + (smooth2(x, y, 18, 120) - 0.5) * 0.2 + (bayer(x, y) - 0.5) * 0.12;
      const chop = Math.sin(x * 0.21 + y * 0.9 + Math.sin(x * 0.03) * 3);
      if (chop > 0.93) v += 0.25;
      let c = pick(P.water, v);
      if (y < LAKE_TOP + 2) c = P.water[1];
      if (y === LAKE_TOP + 2 && noise2(x, y, 121) < 0.6) c = P.water[5];
      bm.px(x, y, c);
    }
  // the pier: wooden boards out over the water
  for (let y = PIER.top; y < PIER.bottom; y++)
    for (let x = PIER.x; x < PIER.x + PIER.w; x++) {
      const board = (y - PIER.top) % 4 === 3;
      let c = board ? P.wood[1] : (Math.floor((y - PIER.top) / 4) % 2 ? P.wood[3] : P.wood[2]);
      if (x === PIER.x) c = P.wood[4];
      if (x === PIER.x + PIER.w - 1) c = P.wood[0];
      bm.px(x, y, c);
    }
  for (const yy of [PIER.top + 26, PIER.bottom - 1]) {
    bm.rect(PIER.x - 1, yy, 2, 4, P.wood[0]); bm.rect(PIER.x + PIER.w - 1, yy, 2, 4, P.wood[0]);
  }
  for (let y = PIER.top + 10; y < PIER.bottom + 3; y++) bm.shade(PIER.x + PIER.w + 1, y, 0.6);
  bm.hline(PIER.x, PIER.bottom, PIER.w, P.wood[0]);
}
