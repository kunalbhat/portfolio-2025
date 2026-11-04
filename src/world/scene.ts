import { Bitmap } from '../art/bitmap';
import { hex, toCss } from '../art/color';
import { P } from '../art/palette';
import { rng, bayer } from '../art/rng';
import { Look, Pose, person, Sprite, spriteFrom } from '../art/people';
import * as props from '../art/props';
import { nougat, NougatPose, dog, pigeon, duck, squirrel, cat, raccoon, ghost, sheetKid, butterfly } from '../art/animals';
import { carSprite, bus, trainCar, bicycle, CarKind } from '../art/vehicles';
import { drawTextCentered, textWidth } from '../art/font';
import { paintGround } from './ground';
import { paintTrack, paintBuildings, SPOTS } from './buildings';
import { addVignettes, paintYards } from './vignettes';
import { Entity, Prop, Person, Custom, Critter, Hotspot, Ctx, Box } from './actors';
import { Game } from '../engine/game';
import { WorldDraw, propSprite } from '../engine/draw';
import {
  WORLD_W, WORLD_H, STREET, FENCE_Y, PARK_GATES, COURT, COURT_LINES, POND, PLAZA, PIER, TRACK,
} from './layout';

// The town, composed. Everything here is placed by hand; only small things
// (leaf litter, grass tufts) are scattered by the painters.

export interface Story {
  discover(id: string): void;
  moveIn(): void;
  found(): void;
  isFound(): boolean;
  openGame(): void;
}

/** Things the rest of the app needs a handle on. */
export interface SceneRefs {
  kunal: Person;
  nougat: Entity;
  hintSpots: [number, number][];
}

const C = (h: string) => toCss(hex(h));
const CONFETTI = ['#e0402e', '#f2d03a', '#3a7ad0', '#3f9a56', '#f08a2a', '#ff9ac8', '#f6f1e6'].map(C);

export const KUNAL_LOOK: Look = { skin: 'brown', hair: 'black', style: 'swoop', top: 'mustard', bottom: 'denim', shoes: 'white' };

export function buildScene(game: Game, story: Story): { ground: HTMLCanvasElement; refs: SceneRefs } {
  const bm = new Bitmap(WORLD_W, WORLD_H);
  paintGround(bm);
  paintTrack(bm);
  paintYards(bm);
  backyardTrees(bm);
  paintBuildings(bm);
  const add = <T extends Entity>(e: T) => game.add(e);

  // ---- helpers ------------------------------------------------------------
  const treeAt = (x: number, y: number, kind: props.Foliage, r: number, seed: number, leaves = true) => {
    const art = props.tree(kind, r, seed);
    // November: the lawn under each tree is littered with its own leaves
    if (kind !== 'green' && y > 440) {
      const ramp = kind === 'gold' ? P.leafGold : kind === 'red' ? P.leafRed : P.leafOrange;
      const LR = rng(seed * 31);
      for (let i = 0; i < r * 9; i++) {
        const a = LR.next() * Math.PI * 2, d = Math.sqrt(LR.next());
        const lx = Math.round(x + 3 + Math.cos(a) * r * 1.3 * d), ly = Math.round(y + 2 + Math.sin(a) * r * 0.55 * d);
        const under = bm.get(lx, ly);
        if (under && (under === P.grass[0] || under === P.grass[1] || under === P.grass[2] || under === P.grass[3] || under === P.grass[4] || LR.chance(0.5))) bm.px(lx, ly, ramp[LR.int(2, 4)]);
      }
    }
    bm.shadeEllipse(x + r * 0.45, y - 1, r * 0.95, r * 0.42, 0.9, 0.6);
    const t = add(new Prop(art, x, y));
    if (leaves && kind !== 'green') leafFall(game, x, y - art.ay + art.bm.h * 0.4, r, kind);
    return t;
  };
  const prop = (art: props.PropArt, x: number, y: number, shadowW = 0) => {
    if (shadowW) bm.shadeEllipse(x + 2, y, shadowW / 2, 2, 0.7, 0.5);
    return add(new Prop(art, x, y));
  };
  const who = (look: Look, x: number, y: number, pose: Pose = 'stand', flip = false, lines?: string[]) => {
    const p = add(new Person(look, x, y, pose, flip));
    if (lines) p.lines = lines;
    return p;
  };
  const walker = (look: Look, pts: [number, number][], speed = 16, loop = false, lines?: string[]) => {
    const p = who(look, pts[0][0], pts[0][1], 'side', false, lines);
    p.route = { pts, speed, loop, pause: 1.5 + Math.random() * 2 };
    return p;
  };

  // ---- the top sidewalk -----------------------------------------------------
  for (const x of [30, 248, 420, 720, 1140, 1386]) prop(props.lamppost(), x, 330, 6);
  const nestLamp = prop(props.lamppost(), 960, 330, 6);
  treeAt(96, 328, 'gold', 12, 11);
  treeAt(474, 328, 'orange', 13, 12);
  treeAt(800, 328, 'red', 12, 13);
  treeAt(1070, 328, 'turning', 13, 14);
  treeAt(1300, 328, 'gold', 12, 15);
  prop(props.hydrant(), 600, 328, 5);
  prop(props.hydrant(), 1250, 330, 5);
  prop(props.mailbox(), 446, 330, 7);
  prop(props.newsBox(hex('#c83a32')), 290, 329, 6);
  prop(props.newsBox(hex('#2e5aa8')), 298, 329, 6);
  prop(props.trashCan(), 690, 330, 6);
  prop(props.trashCan(), 1104, 330, 6);
  prop(props.bikeRack([hex('#e0402e'), hex('#3a7ad0'), hex('#3f9a56'), hex('#f2d03a')]), 340, 330, 20);
  prop(props.planter(hex('#e0584a')), 150, 304);
  prop(props.planter(hex('#f2b43a')), 268, 304);
  prop(props.busStop(), 1196, 330, 30);
  prop(props.streetSign(), 608, 332);

  // café tables: two under umbrellas, one in the open
  const cafeTables: [number, number, boolean][] = [[166, 322, true], [214, 322, true], [258, 324, false]];
  for (const [tx, ty, umb] of cafeTables) {
    prop(props.bistroChair(), tx - 7, ty - 1);
    prop(props.bistroChair(true), tx + 7, ty - 1);
    prop(props.bistroTable(), tx, ty, 10);
    if (umb) { const u = add(new Prop(props.umbrella(hex('#2f6c64'), hex('#f2e6cc')), tx, ty + 1)); u.bias = 6; }
  }
  // café regulars
  const decoyCafe = who({ skin: 'brown', hair: 'black', style: 'beanie', hat: 'charcoal', top: 'mustard', bottom: 'charcoal', beard: true, item: 'cup' }, 160, 321, 'sit', false,
    ['NOT KUNAL.', 'I GET THAT A LOT.', 'HE HAS GLASSES? NO...', 'TRY THE PARK.']);
  decoyCafe.bias = 2;
  const cafeReader = who({ skin: 'fair', hair: 'auburn', style: 'bob', top: 'teal', bottom: 'denim', item: 'book' }, 172, 321, 'sit', true, ['SHH. GOOD PART.', 'CHAPTER NINE.']);
  cafeReader.bias = 2;
  who({ skin: 'deep', hair: 'black', style: 'curly', top: 'coral', bottom: 'khaki', item: 'cup' }, 208, 321, 'sit', false, ['OAT MILK. ALWAYS.']).bias = 2;
  who({ skin: 'light', hair: 'blonde', style: 'ponytail', top: 'navy', bottom: 'black', item: 'phone' }, 220, 321, 'sit', true, ['ONE SEC, TYPING.']).bias = 2;
  who({ skin: 'olive', hair: 'grey', style: 'bald', top: 'tan', topKind: 'coat', bottom: 'brown', glasses: true, item: 'paper' }, 264, 323, 'sit', true, ['THE CUBS...', 'NEXT YEAR.']).bias = 2;
  // steam off the café cups
  steam(game, [[166, 314], [214, 314], [258, 316]]);
  // the coffee cup easter egg: a cup on the open table
  const cup = add(new Custom(254, 318, {
    draw: (s, d) => { d.rect(s.x, s.y - 3, 3, 3, C('#f6f1e6')); d.rect(s.x, s.y - 2, 3, 1, C('#8a5a3a')); d.rect(s.x + 3, s.y - 2, 1, 1, C('#f6f1e6')); },
    bounds: (s) => ({ x: s.x - 1, y: s.y - 5, w: 6, h: 6 }),
  }));
  cup.label = 'A coffee cup on a café table';
  cup.priority = 3;
  cup.tap = (c) => {
    for (let i = 0; i < 9; i++) {
      // the steam curls into a heart
      const a = (i / 9) * Math.PI * 2;
      const hx = 16 * Math.pow(Math.sin(a), 3) / 6, hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 6;
      c.fx.add({ x: cup.x + 1 + hx, y: cup.y - 10 + hy, vy: -3, life: 1.6, color: C('#f6f1e6') });
    }
    c.fx.add({ x: cup.x + 1, y: cup.y - 10, vy: -3, life: 1.6, color: C('#e0584a') });
    c.bubbles.say(cup.x + 1, cup.y - 14, '♥', 1.2);
    story.discover('coffee');
  };

  // pigeons by the café
  flock(game, 236, 330, 4, 1);

  // the busker outside the record shop
  prop(props.guitarCase(), 760, 330);
  const busker = who({ skin: 'deep', hair: 'black', style: 'cap', hat: 'red', top: 'olive', topKind: 'coat', bottom: 'denim', item: 'guitar' }, 746, 326, 'stand', false, ['♪ ♪', 'REQUESTS? NO.', 'THIS ONE IS NEW.']);
  busker.idle = [['stand', 0.4], ['stand', 0.4]];
  add(new Custom(746, 326, {
    update: (s, c, dt) => {
      s.state.t = (s.state.t ?? 0) + dt;
      if (s.state.t > 2.6 && !c.reduced) { s.state.t = 0; c.fx.add({ x: 750 + Math.random() * 4, y: 306, vy: -10, vx: (Math.random() - 0.5) * 6, life: 1.5, color: C('#2a2430'), size: 1, wobble: 4 }); }
    },
    draw: () => {}, bounds: () => ({ x: 0, y: 0, w: 0, h: 0 }),
  }));
  who({ skin: 'fair', hair: 'brown', style: 'long', top: 'plum', bottom: 'denim', item: 'bag', extra: 'tan' }, 772, 326, 'stand', true, ['HE\'S GOOD.']);

  // the greystone stoop, still dressed for Halloween
  prop(props.skeleton(), 916, 288);
  prop(props.pumpkin(true), 906, 297);
  prop(props.pumpkin(), 934, 298);
  prop(props.pumpkin(), 900, 306);
  const sheet = add(new Custom(948, 318, {
    update: (s, c, dt) => {
      s.state.t = (s.state.t ?? 0) + dt;
      if (s.state.flying) {
        s.state.ft += dt;
        const k = s.state.ft;
        s.z = Math.min(140, k * k * 30);
        s.x = 948 + Math.sin(k * 3) * 6 + k * 8;
        if (k > 4.5) { s.state.flying = false; s.state.back = 0; s.z = 0; s.x = 948; s.hidden = true; }
      }
      if (s.hidden) { s.state.back = (s.state.back ?? 0) + dt; if (s.state.back > 8) s.hidden = false; }
    },
    draw: (s, d, c) => {
      if (!s.state.flying) d.shadow(s.x, s.y, 8);
      const f = Math.floor((s.state.t ?? 0) * 3);
      d.sprite(s.state.flying ? ghost(f) : sheetKid(c.reduced ? 0 : Math.floor(f / 2)), s.x, s.y - s.z);
    },
    bounds: (s) => ({ x: s.x - 5, y: s.y - 12 - s.z, w: 10, h: 12 }),
  }));
  sheet.label = 'A trick-or-treater in a bedsheet, a few days late';
  sheet.tap = (c) => {
    if (sheet.state.flying) return;
    c.bubbles.say(sheet.x, sheet.y - 14, 'BOO!', 1.4, 'shout');
    if (c.reduced) { sheet.hidden = true; story.discover('ghost'); return; }
    sheet.state.flying = true; sheet.state.ft = 0;
    for (let i = 0; i < 10; i++) c.fx.add({ x: sheet.x + (Math.random() - 0.5) * 8, y: sheet.y - 4, vy: -8 - Math.random() * 8, life: 1, color: C('#c8c2d6') });
    story.discover('ghost');
  };
  who({ skin: 'olive', hair: 'black', style: 'short', top: 'orange', bottom: 'black', kid: true, item: 'bag', extra: 'orange' }, 960, 320, 'stand', true, ['WE\'RE STILL GOING.', 'HALLOWEEN IS A WEEK.']);

  // kids glued to the arcade window
  who({ skin: 'light', hair: 'brown', style: 'short', top: 'red', bottom: 'denim', kid: true }, 998, 316, 'back', false, ['HIGH SCORE!', 'ONE MORE QUARTER.']);
  who({ skin: 'brown', hair: 'black', style: 'ponytail', top: 'sky', bottom: 'navy', kid: true }, 1012, 316, 'back', false, ['MY TURN NEXT.']);

  // pizza window lean and the bus stop crowd
  who({ skin: 'fair', hair: 'dark', style: 'short', top: 'red', topKind: 'tee', bottom: 'denim', beard: true }, 1160, 322, 'stand', false, ['DEEP DISH. FIGHT ME.', 'IT\'S A CASSEROLE? NO.']);
  who({ skin: 'deep', hair: 'grey', style: 'scarf', hat: 'purple', top: 'purple', topKind: 'coat', bottom: 'black', item: 'bag', extra: 'brown' }, 1190, 324, 'stand', false, ['BUS IS LATE.', 'ANY MINUTE NOW.']);
  who({ skin: 'light', hair: 'blonde', style: 'long', top: 'sky', bottom: 'denim', item: 'phone' }, 1206, 326, 'stand', true, ['THE APP SAYS 2 MIN.', 'IT SAID THAT BEFORE.']);

  // walkers along the top sidewalk
  walker({ skin: 'brown', hair: 'brown', style: 'bun', top: 'green', topKind: 'coat', bottom: 'black', item: 'bag', extra: 'tan' }, [[20, 318], [430, 318]], 15);
  walker({ skin: 'fair', hair: 'auburn', style: 'short', top: 'navy', bottom: 'khaki', item: 'phone' }, [[690, 324], [1120, 324]], 14, false, ['SORRY, ON A CALL.']);
  walker({ skin: 'olive', hair: 'black', style: 'long', top: 'white', bottom: 'blue', item: 'bag', extra: 'pink' }, [[1290, 316], [1430, 316]], 12);
  dropper(game, { skin: 'light', hair: 'grey', style: 'bun', top: 'coral', topKind: 'coat', bottom: 'navy', item: 'bag', extra: 'khaki' }, 520, 900, 320);

  // the Rubik's cube, in a pigeon's nest on top of a street lamp
  const nest = add(new Custom(960, 300, {
    update: (s, c, dt) => {
      s.state.t = (s.state.t ?? 0) + dt;
      if (s.state.twist !== undefined) {
        s.state.twist += dt;
        if (s.state.twist > 2.2) { s.state.solved = true; }
        if (s.state.twist > 6) { s.state.twist = undefined; s.state.solved = false; s.state.away = 0; }
      }
      if (s.state.away !== undefined) { s.state.away += dt; }
    },
    draw: (s, d, c) => {
      const t = s.state.twist;
      const step = t === undefined ? 0 : Math.floor(t * 8);
      d.sprite(propSprite(props.cube(!!s.state.solved, step)), s.x + 1, s.y - 2);
      d.sprite(propSprite(nestArt), s.x, s.y);
      const away = s.state.away;
      if (t !== undefined || (away !== undefined && away < 3)) {
        const k = t !== undefined ? Math.min(1, t) : Math.max(0, 1 - (away - 1.5) / 1.5);
        const f = Math.floor((s.state.t ?? 0) * 10) % 2;
        d.sprite(pigeon(f ? 'fly0' : 'fly1'), s.x + 6 + k * 10, s.y - 6 - k * 14);
      } else {
        d.sprite(pigeon('sit'), s.x - 1, s.y - 3);
      }
      void c;
    },
    bounds: (s) => ({ x: s.x - 6, y: s.y - 10, w: 12, h: 12 }),
  }));
  const nestArt = props.nest();
  nest.bias = 40;
  nest.label = 'A pigeon nesting on top of a street lamp';
  nest.priority = 3;
  nest.tap = (c) => {
    if (nest.state.twist !== undefined) return;
    nest.state.twist = 0;
    nest.state.away = undefined;
    c.bubbles.say(nest.x, nest.y - 16, 'COO?!', 1.2);
    setTimeout(() => c.bubbles.say(nest.x, nest.y - 10, 'SOLVED', 1.8), 2300);
    story.discover('cube');
  };
  void nestLamp;

  // window waver in the three-flat
  {
    const w = SPOTS.waveWindow;
    const look: Look = { skin: 'olive', hair: 'black', style: 'bob', top: 'pink', bottom: 'pink' };
    const waver = add(new Custom(w.x + w.w / 2, w.y + w.h, {
      update: (s, c, dt) => { s.state.t = (s.state.t ?? 0) + dt; s.state.c = (s.state.c ?? 0) + dt; },
      draw: (s, d, c) => {
        const cyc = (s.state.t ?? 0) % 9;
        const waving = (cyc > 6 || (s.state.wave ?? 0) > 0) && !c.reduced;
        const pose: Pose = waving ? (Math.floor((s.state.t ?? 0) * 4) % 2 ? 'wave0' : 'wave1') : 'stand';
        const spr = person(look, pose);
        d.ctx.drawImage(spr.canvas, 0, 0, spr.w, 12, Math.round(s.x - spr.ax), w.y + 3, spr.w, Math.min(12, w.h - 4));
        if (s.state.wave > 0) s.state.wave -= 1 / 60;
      },
      bounds: () => ({ x: w.x, y: w.y, w: w.w, h: w.h }),
    }));
    waver.layer = 2;
    waver.tap = (c) => { waver.state.wave = 2; c.bubbles.say(waver.x, w.y + 2, 'HELLO DOWN THERE!', 2); };
  }

  // ---- the street -----------------------------------------------------------
  const parked: [number, CarKind, string][] = [[40, 'sedan', '#2e5aa8'], [102, 'hatch', '#c8c2b4'], [300, 'wagon', '#5a3a2a'], [370, 'sedan', '#c83a32'], [520, 'van', '#e8e2d6'], [760, 'hatch', '#3f8a56'], [830, 'sedan', '#2a2a30'], [1010, 'sedan', '#7a8a9a'], [1080, 'hatch', '#d8783a'], [1330, 'wagon', '#3a5a7a']];
  for (const [x, kind, col] of parked) {
    const s = carSprite(kind, hex(col), Math.random() < 0.5, x);
    for (let i = 0; i < s.w; i++) bm.shade(x - s.ax + i + 2, STREET.park + 1, 0.8);
    add(new Prop(s, x, STREET.park));
  }
  traffic(game);
  // the L
  train(game);

  // the bottom sidewalk
  for (const x of [150, 380, 760, 900, 1100, 1260]) prop(props.lamppost(), x, 434, 6);
  for (const [x, k, r, s] of [[60, 'red', 13, 21], [258, 'gold', 14, 22], [470, 'orange', 13, 23], [830, 'gold', 14, 24], [1010, 'red', 13, 25], [1320, 'orange', 14, 26], [1424, 'turning', 12, 27]] as const)
    treeAt(x, 434, k, r, s);
  // hot dog cart by the park gate
  const cart = prop(props.hotdogCart(), 580, 432, 26);
  const vendor = who({ skin: 'light', hair: 'dark', style: 'cap', hat: 'red', top: 'white', topKind: 'apron', bottom: 'black', extra: 'red', beard: true, item: 'tongs' }, 572, 422, 'stand');
  vendor.bias = -1;
  const customer = who({ skin: 'fair', hair: 'blonde', style: 'cap', hat: 'navy', top: 'sky', bottom: 'khaki', item: 'camera' }, 556, 436, 'side');
  customer.lines = ['KETCHUP?'];
  const ketchup = (c: Ctx) => {
    customer.say(c, 'KETCHUP, PLEASE?', 1.6);
    setTimeout(() => { vendor.hop(3); vendor.say(c, 'NO.', 1.8, 'shout'); }, 1200);
    setTimeout(() => customer.say(c, '...OK.', 1.4), 2800);
    story.discover('hotdog');
  };
  vendor.tap = ketchup; customer.tap = ketchup;
  (cart as Prop).tap = ketchup;
  cart.label = 'The hot dog cart by the park gate';
  walker({ skin: 'deep', hair: 'black', style: 'bun', top: 'red', topKind: 'coat', bottom: 'black', item: 'leash' }, [[90, 426], [530, 426]], 13);
  dogWalk(game, 'poodle', [[90, 426], [530, 426]], 13, 12);
  walker({ skin: 'olive', hair: 'brown', style: 'short', top: 'grey', topKind: 'coat', bottom: 'navy', item: 'cup' }, [[700, 428], [1400, 428]], 16);
  walker({ skin: 'fair', hair: 'blonde', style: 'ponytail', top: 'pink', bottom: 'black', bottomKind: 'shorts' }, [[1400, 424], [680, 424]], 30, false, ['ON A RUN!']);

  // park fence (static), drawn after the sidewalk painting
  for (let x = 0; x < WORLD_W; x++) {
    if (PARK_GATES.some((g) => x >= g.x && x < g.x + g.w)) continue;
    if (x % 3 === 0) bm.vline(x, FENCE_Y - 7, 9, hex('#24222a'));
    if (x % 3 === 0) bm.px(x, FENCE_Y - 8, hex('#3e3a46'));
  }
  for (let x = 0; x < WORLD_W; x++) if (!PARK_GATES.some((g) => x >= g.x && x < g.x + g.w)) { bm.px(x, FENCE_Y - 5, hex('#24222a')); bm.px(x, FENCE_Y + 1, hex('#24222a')); }
  for (const g of PARK_GATES) for (const gx of [g.x - 1, g.x + g.w]) { bm.rect(gx - 1, FENCE_Y - 10, 3, 12, hex('#24222a')); bm.px(gx, FENCE_Y - 11, hex('#e0b84a')); }

  // ---- the park -------------------------------------------------------------
  // trees
  const parkTrees: [number, number, props.Foliage, number][] = [
    [372, 502, 'orange', 20], [430, 640, 'gold', 17], [554, 478, 'green', 15], [866, 506, 'red', 19], [962, 612, 'mixed', 21],
    [556, 786, 'turning', 18], [436, 792, 'green', 15], [888, 838, 'orange', 19], [1046, 772, 'gold', 21], [1186, 830, 'red', 17],
    [1338, 800, 'mixed', 23], [1424, 690, 'green', 15], [34, 704, 'red', 17], [104, 866, 'gold', 15], [640, 860, 'red', 16], [26, 520, 'gold', 14],
  ];
  parkTrees.forEach(([x, y, k, r], i) => treeAt(x, y, k, r, 100 + i));
  for (const [x, y, h] of [[984, 470, 30], [330, 866, 26], [1418, 474, 28]] as const) { bm.shadeEllipse(x + 6, y, 7, 3, 0.8); prop(props.conifer(h, x), x, y); }
  for (const [x, y] of [[480, 690], [880, 686], [1240, 718], [250, 652], [700, 820]] as const) prop(props.lamppost(), x, y, 6);
  prop(props.trashCan(), 494, 690, 6);
  prop(props.trashCan(), 1228, 718, 6);

  // benches: [x, y, back?]
  for (const [x, y] of [[90, 478], [606, 528], [776, 528], [1110, 742], [1262, 752], [300, 690]] as const) prop(props.bench(), x, y, 18);

  // ---- playground: Rendi, Kavi, Niam --------------------------------------
  playground(game, story);

  // the bean and its plaza
  prop(props.bean(), PLAZA.cx, PLAZA.cy + 6, 0);
  bm.shadeEllipse(PLAZA.cx + 10, PLAZA.cy + 6, 40, 5, 0.9, 0.6);
  who({ skin: 'light', hair: 'brown', style: 'beanie', hat: 'red', top: 'navy', topKind: 'coat', bottom: 'denim', item: 'camera' }, 690, 626, 'back', false, ['SMILE, BEAN!', 'ONE MORE.']);
  who({ skin: 'brown', hair: 'black', style: 'long', top: 'mustard', topKind: 'dress', bottom: 'mustard', item: 'phone' }, 660, 618, 'cheer', false, ['NOPE, NOT KUNAL!', 'I\'M IN THE BEAN!', 'HE HAD A LAPTOP...']);
  who({ skin: 'fair', hair: 'blonde', style: 'short', top: 'green', bottom: 'khaki', kid: true }, 650, 604, 'wave0', true, ['I SEE ME!', 'I SEE YOU!']);
  who({ skin: 'deep', hair: 'black', style: 'buzz', top: 'white', bottom: 'denim', glasses: true }, 726, 612, 'stand', true, ['IT\'S CALLED CLOUD... WAIT.']);
  who({ skin: 'olive', hair: 'auburn', style: 'curly', top: 'purple', topKind: 'coat', bottom: 'black' }, 742, 618, 'stand', true);
  who({ skin: 'fair', hair: 'grey', style: 'bald', top: 'tan', topKind: 'coat', bottom: 'grey', beard: true }, 606, 527, 'sit', false, ['I COME HERE TO THINK.', 'AND TO SIT.']).bias = 2;
  who({ skin: 'brown', hair: 'brown', style: 'bun', top: 'teal', bottom: 'denim', item: 'icecream' }, 772, 527, 'sit', false, ['NOVEMBER IS ICE CREAM SEASON.']).bias = 2;
  who({ skin: 'light', hair: 'dark', style: 'long', top: 'coral', bottom: 'denim', item: 'icecream' }, 782, 527, 'sit', true).bias = 2;
  prop(props.iceCreamCart(), 806, 566, 18);
  who({ skin: 'deep', hair: 'white', style: 'cap', hat: 'white', top: 'white', topKind: 'apron', bottom: 'navy', extra: 'pink' }, 818, 560, 'stand', true, ['LAST SCOOPS OF THE YEAR!']);
  flock(game, 636, 640, 6, 2);
  // the painter
  prop(props.easel(), 512, 520, 10);
  who({ skin: 'olive', hair: 'black', style: 'beanie', hat: 'teal', top: 'white', topKind: 'coat', bottom: 'denim', glasses: true }, 498, 522, 'side', false, ['STILL LIFE WITH BEAN.', 'IT\'S HARDER THAN IT LOOKS.']);

  // picnic lawn
  blanket(bm, 590, 726, 30, 18, hex('#c83a32'));
  blanket(bm, 456, 738, 26, 16, hex('#3a7ad0'));
  blanket(bm, 610, 800, 28, 16, hex('#f2b43a'));
  prop(props.picnicBasket(), 608, 738);
  who({ skin: 'fair', hair: 'brown', style: 'long', top: 'green', bottom: 'denim', item: 'book' }, 596, 738, 'sit', false, ['GREAT BOOK.', 'NO SPOILERS.']).seated = true;
  who({ skin: 'brown', hair: 'black', style: 'short', top: 'red', bottom: 'khaki', item: 'cup' }, 614, 736, 'sitSide', true).seated = true;
  who({ skin: 'deep', hair: 'black', style: 'curly', top: 'coral', bottom: 'khaki', glasses: true }, 466, 748, 'sitSide', false, ['THE GRASS IS DAMP.']).seated = true;
  who({ skin: 'light', hair: 'blonde', style: 'bob', top: 'sky', bottom: 'navy' }, 476, 750, 'sit', true).seated = true;
  who({ skin: 'olive', hair: 'grey', style: 'scarf', hat: 'mustard', top: 'mustard', topKind: 'coat', bottom: 'brown' }, 622, 812, 'sit', false, ['NO DEAR, I\'M NOT HIM.', 'HE LIKES BENCHES.']).seated = true;
  who({ skin: 'fair', hair: 'auburn', style: 'short', top: 'navy', topKind: 'coat', bottom: 'grey', item: 'paper' }, 470, 816, 'stand', false, ['ZZZ']);
  butterflies(game, 520, 750);

  // ---- Kunal ------------------------------------------------------------------
  prop(props.bench(), 520, 822, 18);
  const kunal = add(new Person({ ...KUNAL_LOOK, item: 'laptop' }, 515, 821, 'sit'));
  kunal.id = 'kunal';
  kunal.priority = 6;
  kunal.bias = 2;
  kunal.label = 'Kunal';
  kunal.state = { pigeon: true };
  // the pigeon that has decided his head is a fine place to sit
  kunal.extra = (d, p, c) => {
    if (p.state.pigeon) {
      const bob = Math.floor(c.t * 1.3) % 5 === 0 ? 1 : 0;
      d.sprite(pigeon(bob ? 'peck' : 'stand', true), p.x + 1, p.y - p.height() - 1 - Math.round(p.z));
    }
  };
  // his coffee, on the bench beside him
  add(new Custom(527, 813, {
    draw: (s, d) => { d.rect(s.x, s.y - 3, 3, 3, C('#f6f1e6')); d.rect(s.x, s.y - 2, 3, 1, C('#8a5a3a')); },
    bounds: (s) => ({ x: s.x, y: s.y - 3, w: 3, h: 3 }),
  })).bias = 3;
  steam(game, [[528, 806]]);
  kunal.tap = () => story.found();
  // camouflage: a stranger sharing the bench, a low tree in front, people about
  who({ skin: 'olive', hair: 'brown', style: 'bun', top: 'orange', topKind: 'coat', bottom: 'brown', item: 'phone' }, 525, 821, 'sit', true, ['HE\'S BEEN TYPING FOR AN HOUR.', 'NOT ME!']).bias = 2;
  treeAt(534, 852, 'orange', 14, 777);
  who({ skin: 'deep', hair: 'black', style: 'cap', hat: 'orange', top: 'orange', bottom: 'denim' }, 488, 828, 'stand', false, ['HAVE YOU TRIED THE BENCHES?']);
  who({ skin: 'light', hair: 'auburn', style: 'long', top: 'red', topKind: 'coat', bottom: 'black', item: 'bag' }, 498, 832, 'side', true, ['WE\'RE WAITING FOR A FRIEND.']);
  who({ skin: 'brown', hair: 'black', style: 'short', top: 'coral', bottom: 'khaki', kid: true }, 548, 830, 'cheer', false, ['A PIGEON! ON A MAN!']);

  // ---- the tennis court and Nougat -------------------------------------
  const nougatE = tennis(game, bm, story);

  // the east lawn: frisbee, a kite, a squirrel, a sleeping man
  frisbee(game);
  kite(game, 1172, 864);
  const sq = add(new Critter((f, i, m) => squirrel(m ? (i % 2 ? 'run0' : 'run1') : 'sit', f), 1040, 790, 4));
  sq.route = [[1060, 790], [1030, 800], [1020, 784], [1050, 776]];
  sq.speed = 26;
  sq.tap = (c) => c.bubbles.say(sq.x, sq.y - 8, '!', 0.8);
  const sleeper = who({ skin: 'light', hair: 'brown', style: 'short', top: 'olive', topKind: 'coat', bottom: 'khaki', item: 'paper' }, 1110, 741, 'sit', false);
  sleeper.bias = 2;
  sleeper.extra = (d, p, c) => { if (Math.floor(c.t) % 4 === 0) d.rect(p.x + 5, p.y - 20 - (c.t % 1) * 4, 1, 1, '#f6f1e6'); };
  sleeper.lines = ['ZZZ...', 'FIVE MORE MINUTES.'];
  who({ skin: 'deep', hair: 'grey', style: 'bald', top: 'brown', topKind: 'coat', bottom: 'grey', glasses: true }, 1256, 751, 'sit', false, ['THE PIGEONS KNOW ME.']).bias = 2;
  who({ skin: 'fair', hair: 'white', style: 'bun', top: 'purple', topKind: 'coat', bottom: 'grey' }, 1268, 751, 'sit', true, ['HE FEEDS THEM TOO MUCH.']).bias = 2;
  flock(game, 1262, 772, 5, 3);
  dogWalk(game, 'lab', [[980, 712], [1440, 724]], 22, 0, { skin: 'brown', hair: 'black', style: 'ponytail', top: 'teal', bottom: 'black', bottomKind: 'shorts' });

  // path walkers through the park
  walker({ skin: 'olive', hair: 'black', style: 'scarf', hat: 'green', top: 'green', topKind: 'coat', bottom: 'black', item: 'bag', extra: 'olive' }, [[10, 666], [260, 662], [400, 676], [520, 698], [640, 708], [760, 704], [880, 694], [990, 698], [1120, 716], [1260, 724], [1430, 718]], 14);
  walker({ skin: 'fair', hair: 'brown', style: 'short', top: 'red', topKind: 'coat', bottom: 'denim', item: 'cup' }, [[640, 452], [652, 528], [690, 560], [702, 640], [716, 704], [744, 780], [772, 840], [786, 880]], 13);

  // ---- the pond -------------------------------------------------------------
  reeds(bm);
  ducks(game);
  const boat = add(new Custom(POND.cx + 40, POND.cy + 10, {
    update: (s, c, dt) => { if (!c.reduced) { s.state.t = (s.state.t ?? 0) + dt; s.x = POND.cx + 40 + Math.sin(s.state.t * 0.12) * 60; s.y = POND.cy + 6 + Math.sin(s.state.t * 0.2) * 14; } },
    draw: (s, d, c) => {
      d.sprite(propSprite(boatArt), s.x, s.y);
      const a = person({ skin: 'brown', hair: 'black', style: 'curly', top: 'orange', bottom: 'denim' }, 'sitBack');
      const b = person({ skin: 'fair', hair: 'blonde', style: 'long', top: 'sky', bottom: 'denim' }, 'sit');
      d.spriteCrop(b, s.x - 4, s.y - 2, 11);
      d.spriteCrop(a, s.x + 4, s.y - 1, 12);
      if (Math.floor(c.t * 2) % 2) { d.rect(s.x - 10, s.y - 1, 2, 1, '#86b59c'); d.rect(s.x + 10, s.y, 2, 1, '#86b59c'); }
    },
    bounds: (s) => ({ x: s.x - 9, y: s.y - 14, w: 18, h: 15 }),
  }));
  const boatArt = props.rowboat();
  boat.tap = (c) => c.bubbles.say(boat.x, boat.y - 16, 'WE\'RE LOST.', 1.8);
  who({ skin: 'deep', hair: 'grey', style: 'cap', hat: 'mustard', top: 'mustard', topKind: 'coat', bottom: 'brown', beard: true }, 300, 710, 'stand', false, ['NOT KUNAL. BUT CLOSE.', 'HE\'S EAST OF HERE.', 'THE DUCKS KNOW.']);
  who({ skin: 'light', hair: 'auburn', style: 'short', top: 'lemon', topKind: 'coat', bottom: 'denim', kid: true }, 316, 714, 'crouch', false, ['DUCK!', 'DUCKS!!']);

  // ---- the lakefront --------------------------------------------------------
  for (const x of [560, 1000, 1240]) { const b = prop(props.bench(true), x, 892); b.bias = 4; }
  who({ skin: 'olive', hair: 'black', style: 'long', top: 'plum', bottom: 'denim' }, 554, 889, 'sitBack', false, ['GOOD WAVES TODAY.']);
  who({ skin: 'fair', hair: 'brown', style: 'short', top: 'blue', topKind: 'coat', bottom: 'khaki' }, 566, 889, 'sitBack', false);
  who({ skin: 'deep', hair: 'white', style: 'bald', top: 'charcoal', topKind: 'coat', bottom: 'grey' }, 1000, 889, 'sitBack', false, ['I\'VE SAT HERE 40 YEARS.']);
  // fisherman on the pier
  fisherman(game);
  // promenade traffic
  cyclist(game);
  walker({ skin: 'brown', hair: 'black', style: 'cap', hat: 'mustard', top: 'mustard', bottom: 'black', bottomKind: 'shorts' }, [[20, 884], [1420, 884]], 34, false, ['CAN\'T STOP!', 'NOT HIM! KEEP LOOKING!']);
  walker({ skin: 'light', hair: 'blonde', style: 'ponytail', top: 'pink', bottom: 'black' }, [[1420, 888], [60, 888]], 30, false, ['MILE SIX!']);
  walker({ skin: 'olive', hair: 'grey', style: 'short', top: 'navy', topKind: 'coat', bottom: 'grey' }, [[200, 886], [780, 886]], 10, false, ['LOVELY DAY.']);
  dogWalk(game, 'dachshund', [[820, 886], [1400, 886]], 11, 12, { skin: 'fair', hair: 'auburn', style: 'bob', top: 'olive', topKind: 'coat', bottom: 'black' });
  // the lake
  boats(game);
  gulls(game);

  // ---- rooftops and the alley -------------------------------------------
  rooftopCinema(game, bm, story);
  // café roof: a quiet date under the string lights
  bm.rect(196, 172, 10, 5, P.wood[3]);
  who({ skin: 'brown', hair: 'black', style: 'bun', top: 'red', bottom: 'black' }, 192, 176, 'sit', false, ['SHH, WE\'RE ON A DATE.']);
  who({ skin: 'fair', hair: 'brown', style: 'short', top: 'navy', bottom: 'khaki', beard: true }, 210, 176, 'sit', true);
  // three-flat roof deck
  who({ skin: 'light', hair: 'grey', style: 'cap', hat: 'green', top: 'green', topKind: 'tee', bottom: 'khaki', item: 'book' }, 60, 132, 'sit', false, ['MY TOMATOES. MINE.']);
  // laundry day on the pizza roof
  const laundry = who({ skin: 'olive', hair: 'black', style: 'scarf', hat: 'coral', top: 'coral', bottom: 'navy' }, 1196, 160, 'back');
  laundry.idle = [['back', 2], ['cheer', 0.6], ['back', 3]];
  // the pigeon keeper
  const keeper = who({ skin: 'light', hair: 'white', style: 'bald', top: 'brown', topKind: 'coat', bottom: 'grey', beard: true }, 1340, 124, 'stand', false, ['THEY ALWAYS COME BACK.', 'EXCEPT GARY.']);
  keeper.idle = [['stand', 3], ['wave0', 0.5], ['wave1', 0.5], ['stand', 2]];
  coopFlight(game);
  // studio roof: someone doing yoga
  const yogi = who({ skin: 'deep', hair: 'black', style: 'bun', top: 'teal', bottom: 'black' }, 410, 140, 'stand', false, ['NAMASTE.', 'BREATHING.']);
  yogi.idle = [['stand', 3], ['cheer', 3]];

  // alley: the raccoon, a cat, a kid shooting hoops
  raccoonBin(game, story);
  const alleyCat = add(new Critter((f, i) => cat(i % 6 < 5 ? 'loaf' : 'stretch', f), 768, 58, 0));
  alleyCat.tap = (c) => c.bubbles.say(alleyCat.x, alleyCat.y - 8, 'MRRP.', 1);
  hoops(game);
  // a squirrel on the track girder
  const sq2 = add(new Critter((f, i, m) => squirrel(m ? (i % 2 ? 'run0' : 'run1') : 'sit', f), 300, 26, 0));
  sq2.route = [[300, 26], [420, 26], [420, 26], [300, 26]];
  sq2.speed = 30;

  // the studio window: a little game running on one monitor
  const scr = SPOTS.studioScreen;
  const screenBlink = add(new Custom(scr.x + 8, scr.y + 14, {
    draw: (s, d, c) => {
      const x = scr.x + 2, y = scr.y + 3;
      d.rect(x, y, 10, 8, '#1e2440');
      const f = Math.floor(c.t * 4);
      d.rect(x + 1, y + 6, 8, 1, '#3f9a56');
      d.rect(x + 2 + (f % 6), y + 2 + (f % 3 === 0 ? 0 : 1), 2, 3, '#f6f1e6');
      d.rect(x + 8 - (f % 8), y + 5, 1, 1, '#f08a2a');
    },
    bounds: () => ({ x: scr.x, y: scr.y, w: scr.w, h: scr.h }),
  }));
  screenBlink.layer = 2;
  const studioTap = (c: Ctx) => { c.bubbles.say(scr.x + 7, scr.y, 'WANNA PLAY?', 1.2); story.openGame(); story.discover('game'); };
  add(new Hotspot({ x: scr.x - 30, y: scr.y - 6, w: scr.w + 50, h: scr.h + 14 }, 'A tiny game on a monitor in the design studio', studioTap, 2));

  // record shop: a needle drop
  add(new Hotspot(SPOTS.recordShop, 'The record shop window', (c) => {
    c.bubbles.say(SPOTS.recordShop.x + 32, SPOTS.recordShop.y - 2, '♪ NOW SPINNING: SIDE B ♪', 2.2);
  }, 1));
  // arcade neon
  add(new Hotspot(SPOTS.arcadeWindow, 'The arcade', (c) => {
    c.bubbles.say(SPOTS.arcadeWindow.x + 50, SPOTS.arcadeWindow.y - 4, 'INSERT COIN', 1.6, 'shout');
  }, 1));

  // ---- a sign by the main gate: you can live here too --------------------
  {
    const sb = new Bitmap(40, 26);
    sb.vline(6, 12, 13, P.wood[1]); sb.vline(33, 12, 13, P.wood[1]);
    sb.rect(1, 1, 38, 13, P.cream); sb.hline(1, 1, 38, P.white);
    sb.rect(1, 13, 38, 1, P.wood[2]);
    drawTextCentered(sb, 'MOVE IN!', 20, 2, hex('#c8302a'));
    drawTextCentered(sb, 'ONLY $5', 20, 8, P.ink);
    sb.outline();
    const signE = prop({ bm: sb, ax: 20, ay: 25 }, 690, 462, 26);
    signE.label = 'A sign: move into town, $5';
    signE.priority = 3;
    signE.tap = () => story.moveIn();
  }

  // ---- little stories, then the crowds that make it a search -------------
  addVignettes({ game, bm, who, prop });
  crowds(game, who, walker);

  // ---- static ground shadows for everything sitting still -----------------
  const ground = bm.canvas();

  const hintSpots: [number, number][] = [[560, 760], [520, 806]];
  return { ground, refs: { kunal, nougat: nougatE, hintSpots } };
}

// ----------------------------------------------------------------------------
// Pieces of the town that need a little more machinery.

function backyardTrees(bm: Bitmap) {
  const list: [number, number, props.Foliage, number][] = [[38, 104, 'gold', 13], [250, 146, 'orange', 14], [228, 120, 'green', 11], [440, 110, 'red', 12], [770, 160, 'gold', 12], [1094, 150, 'orange', 12], [1250, 134, 'turning', 12], [690, 120, 'green', 10]];
  list.forEach(([x, y, k, r], i) => {
    const t = props.tree(k, r, 300 + i);
    bm.shadeEllipse(x + r * 0.45, y - 1, r * 0.9, r * 0.4, 0.8, 0.6);
    bm.blit(t.bm, x - t.ax, y - t.ay);
  });
}

export function blanket(bm: Bitmap, x: number, y: number, w: number, h: number, c: number) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const check = (Math.floor(i / 3) + Math.floor(j / 3)) % 2 === 0;
    bm.px(x + i, y + j, check ? c : P.cream);
  }
  for (let i = 0; i < w; i++) bm.px(x + i, y + h, P.grass[0]);
}

function reeds(bm: Bitmap) {
  const R = rng(9);
  for (let i = 0; i < 46; i++) {
    const a = R.range(-2.6, -0.4);
    const x = Math.round(POND.cx + Math.cos(a) * POND.rx * 0.93), y = Math.round(POND.cy + Math.sin(a) * POND.ry * 0.93);
    const h = R.int(4, 9);
    bm.vline(x, y - h, h, R.chance(0.5) ? P.leafGreen[2] : P.grassDry[1]);
    if (R.chance(0.4)) { bm.px(x, y - h, P.wood[1]); bm.px(x, y - h + 1, P.wood[1]); }
  }
}

function leafFall(game: Game, x: number, y: number, r: number, kind: props.Foliage) {
  const ramp = kind === 'gold' ? P.leafGold : kind === 'red' ? P.leafRed : P.leafOrange;
  const cols = [toCss(ramp[2]), toCss(ramp[3]), toCss(ramp[4])];
  let t = Math.random() * 6;
  game.add(new Custom(x, y, {
    update: (_s, c, dt) => {
      if (c.reduced) return;
      t -= dt;
      if (t < 0) {
        t = 3 + Math.random() * 7;
        c.fx.add({ x: x + (Math.random() - 0.5) * r * 1.6, y: y - Math.random() * r * 0.6, vy: 7, vx: 3, drag: 0, life: 5, color: cols[Math.floor(Math.random() * 3)], floor: y + r * 0.5 + 4 + Math.random() * 8, wobble: 2.5 });
      }
    },
    draw: () => {}, bounds: () => ({ x: 0, y: 0, w: 0, h: 0 }),
  }));
}

function steam(game: Game, cups: [number, number][]) {
  let t = 0;
  game.add(new Custom(0, 0, {
    update: (_s, c, dt) => {
      if (c.reduced) return;
      t += dt;
      if (t > 0.35) {
        t = 0;
        const [x, y] = cups[Math.floor(Math.random() * cups.length)];
        c.fx.add({ x: x + Math.random() * 2, y, vy: -6, vx: 0, life: 1.4, color: 'rgba(246,241,230,0.85)', wobble: 3 });
      }
    },
    draw: () => {}, bounds: () => ({ x: 0, y: 0, w: 0, h: 0 }),
  }));
}

/** A little flock of pigeons, pecking. Scatters when tapped or crowded. */
export function flock(game: Game, cx: number, cy: number, n: number, seed: number) {
  const R = rng(seed * 13);
  const birds = Array.from({ length: n }, () => ({ x: cx + R.range(-14, 14), y: cy + R.range(-5, 5), hx: 0, hy: 0, flip: R.chance(0.5), peck: R.range(0, 3), fly: 0, vx: 0, vy: 0 }));
  birds.forEach((b) => { b.hx = b.x; b.hy = b.y; });
  let away = 0;
  const e = game.add(new Custom(cx, cy, {
    update: (_s, c, dt) => {
      if (away > 0) {
        away -= dt;
        for (const b of birds) { b.fly += dt; b.x += b.vx * dt; b.y += b.vy * dt; b.vy -= 4 * dt; }
        if (away <= 0) for (const b of birds) { b.x = b.hx + (Math.random() - 0.5) * 6; b.y = b.hy; b.fly = 0; }
        return;
      }
      if (c.reduced) return;
      for (const b of birds) {
        b.peck -= dt;
        if (b.peck < 0) { b.peck = 0.6 + Math.random() * 2.5; if (Math.random() < 0.35) { b.x += b.flip ? -2 : 2; } if (Math.random() < 0.2) b.flip = !b.flip; }
        b.x = Math.max(b.hx - 16, Math.min(b.hx + 16, b.x));
      }
    },
    draw: (_s, d, c) => {
      for (const b of birds) {
        if (b.fly > 0) { d.sprite(pigeon(Math.floor(c.t * 12) % 2 ? 'fly0' : 'fly1', b.vx < 0), b.x, b.y - b.fly * 30); continue; }
        d.shadow(b.x, b.y, 4, 0.2);
        d.sprite(pigeon(b.peck < 0.25 ? 'peck' : 'stand', b.flip), b.x, b.y);
      }
    },
    bounds: () => ({ x: cx - 18, y: cy - 10, w: 36, h: 18 }),
  }));
  e.tap = (c) => {
    if (away > 0) return;
    away = 6;
    for (const b of birds) { const a = -Math.PI / 2 + (Math.random() - 0.5) * 2; b.vx = Math.cos(a) * 60; b.vy = Math.sin(a) * 20; b.fly = 0.01; }
    c.bubbles.say(cx, cy - 10, 'FLAP FLAP', 1);
  };
  e.y = cy + 2;
  return e;
}

/** Someone who drops an orange, chases it, picks it up, and carries on. */
function dropper(game: Game, look: Look, x0: number, x1: number, y: number) {
  const p = game.add(new Person(look, x0, y, 'side'));
  const orange = game.add(new Custom(0, y + 1, {
    draw: (s, d) => { d.rect(s.x, s.y - 2, 2, 2, '#f08a2a'); d.rect(s.x, s.y - 2, 1, 1, '#f6c060'); },
    bounds: (s) => ({ x: s.x, y: s.y - 2, w: 2, h: 2 }),
  }));
  orange.hidden = true;
  const loop = () => {
    const mid = (x0 + x1) / 2;
    p.run([
      { kind: 'walk', x: mid, y, speed: 14 },
      { kind: 'do', fn: (q, c) => { orange.hidden = false; orange.x = q.x + 2; orange.state.roll = 1; if (!c.reduced) q.say(c, 'OOPS!', 1.2); } },
      { kind: 'wait', t: 1.2 },
      { kind: 'walk', x: mid + 18, y, speed: 14 },
      { kind: 'pose', pose: 'crouch', t: 0.8 },
      { kind: 'do', fn: () => { orange.hidden = true; } },
      { kind: 'walk', x: x1, y, speed: 14 },
      { kind: 'wait', t: 2 },
      { kind: 'walk', x: x0, y, speed: 14 },
      { kind: 'wait', t: 2 },
      { kind: 'do', fn: () => loop() },
    ]);
  };
  orange.update = function (c: Ctx, dt: number) { if (this.state.roll && !c.reduced) { this.x += 16 * dt; if (this.x > (x0 + x1) / 2 + 20) this.state.roll = 0; } };
  loop();
}

function dogWalk(game: Game, kind: 'lab' | 'dachshund' | 'corgi' | 'poodle', pts: [number, number][], speed: number, offset: number, ownerLook?: Look) {
  let owner: Person | null = null;
  if (ownerLook) {
    owner = game.add(new Person({ ...ownerLook, item: 'leash' }, pts[0][0], pts[0][1], 'side'));
    owner.route = { pts, speed, loop: false, pause: 2 };
  }
  const d = game.add(new Critter((f, i, m) => dog(kind, m ? i : 0, f), pts[0][0] + offset, pts[0][1] + 1, 10));
  const follow = owner;
  d.update = function (c: Ctx, dt: number) {
    Critter.prototype.update.call(this, c, dt);
    // trot ahead of whoever is walking along this route
    const lead = follow ?? (game.entities.find((e) => e instanceof Person && (e as Person).route?.pts === pts) as Person | undefined) ?? null;
    const target = lead ?? null;
    if (!target) return;
    const dir = (target as Person).flip ? -1 : 1;
    const tx = target.x + dir * 12, ty = target.y + 1;
    const dx = tx - this.x;
    this.moving = Math.abs(dx) > 1;
    this.x += Math.max(-speed * 1.6 * dt, Math.min(speed * 1.6 * dt, dx));
    this.y = ty;
    if (this.moving) this.flip = dx < 0;
    else this.flip = dir < 0;
  };
  d.tap = (c) => c.bubbles.say(d.x, d.y - 10, 'WOOF!', 1);
  game.worldOverlays.push((dd) => {
    const lead = follow ?? (game.entities.find((e) => e instanceof Person && (e as Person).route?.pts === pts) as Person | undefined);
    if (!lead) return;
    const hx = lead.x + (lead.flip ? -3 : 3), hy = lead.y - 6;
    const nx = d.x + (d.flip ? -3 : 3), ny = d.y - 5;
    leash(dd, hx, hy, nx, ny, '#c83a32');
  });
}

export function leash(d: WorldDraw, x0: number, y0: number, x1: number, y1: number, css: string) {
  const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0)));
  d.ctx.fillStyle = css;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * 3;
    d.ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  }
}

function traffic(game: Game) {
  const kinds: CarKind[] = ['sedan', 'hatch', 'taxi', 'van', 'wagon', 'taxi', 'sedan', 'hatch'];
  const colours = ['#3a7ad0', '#c83a32', '#e8c040', '#e8e2d6', '#3f8a56', '#e8c040', '#2a2a30', '#d8783a'];
  const lanes = [{ y: STREET.laneN, dir: -1 }, { y: STREET.laneS, dir: 1 }];
  const loopW = WORLD_W + 200;
  lanes.forEach((lane, li) => {
    for (let i = 0; i < 4; i++) {
      const k = li * 4 + i;
      const spr = carSprite(kinds[k], hex(colours[k]), lane.dir < 0, k);
      const speed = 38 + ((k * 7) % 5) * 4;
      const car = game.add(new Custom(((i * loopW) / 4 + li * 90) % loopW - 100, lane.y, {
        update: (s, c, dt) => {
          if (c.reduced) return;
          s.x += lane.dir * speed * dt;
          if (lane.dir > 0 && s.x > WORLD_W + 100) s.x -= loopW;
          if (lane.dir < 0 && s.x < -100) s.x += loopW;
          s.state.b = (s.state.b ?? 0) + dt;
        },
        draw: (s, d) => {
          d.shadow(s.x, s.y + 1, spr.w - 4, 0.3);
          d.sprite(spr, s.x, s.y + (Math.floor((s.state.b ?? 0) * 6) % 7 === 0 ? -1 : 0));
        },
        bounds: (s) => ({ x: s.x - spr.ax, y: s.y - spr.ay, w: spr.w, h: spr.h }),
      }));
      car.tap = (c) => c.bubbles.say(car.x, car.y - 18, kinds[k] === 'taxi' ? 'TAXI!' : 'BEEP BEEP', 1);
    }
  });
  // the bus comes along now and then and stops at the shelter
  const bs = bus(true);
  game.add(new Custom(WORLD_W + 200, STREET.laneN, {
    update: (s, c, dt) => {
      if (c.reduced) { s.x = WORLD_W + 300; return; }
      s.state.t = (s.state.t ?? 20) - dt;
      if (s.state.t > 0) return;
      const stop = 1196;
      if (s.state.wait > 0) { s.state.wait -= dt; return; }
      const before = s.x;
      s.x -= 40 * dt;
      if (before > stop && s.x <= stop && !s.state.stopped) { s.x = stop; s.state.wait = 3.5; s.state.stopped = true; }
      if (s.x < -120) { s.x = WORLD_W + 120; s.state.t = 34; s.state.stopped = false; }
    },
    draw: (s, d) => { d.shadow(s.x, s.y + 1, 60, 0.3); d.sprite(bs, s.x, s.y); },
    bounds: (s) => ({ x: s.x - bs.ax, y: s.y - bs.ay, w: bs.w, h: bs.h }),
  })).tap = (c) => c.bubbles.say(1196, 330, 'DOORS OPENING', 1.4);
}

function train(game: Game) {
  const cars = [trainCar('left').canvas(), trainCar('none').canvas(), trainCar('none').canvas(), trainCar('right').canvas()];
  const len = 64 * 4;
  const e = game.add(new Custom(-400, 0, {
    update: (s, c, dt) => {
      if (c.reduced) return;
      s.state.t = (s.state.t ?? 4) - dt;
      if (s.state.t > 0) return;
      s.state.dir = s.state.dir ?? 1;
      s.x += s.state.dir * (s.state.fast ? 260 : 130) * dt;
      if ((s.state.dir > 0 && s.x > WORLD_W + 20) || (s.state.dir < 0 && s.x < -len - 20)) {
        s.state.dir *= -1;
        s.x = s.state.dir > 0 ? -len - 20 : WORLD_W + 20;
        s.state.t = 18 + Math.random() * 10;
        s.state.fast = false;
      }
    },
    draw: (s, d) => {
      for (let i = 0; i < 4; i++) d.canvas(cars[i], s.x + i * 64, TRACK.deckTop - 4);
      // sparks from the third rail, now and then
      if (s.state.t <= 0 && Math.random() < 0.05) d.rect(s.x + Math.random() * len, TRACK.deckBottom - 2, 1, 1, '#9ad8ff');
    },
    bounds: (s) => ({ x: s.x, y: TRACK.deckTop - 4, w: len, h: 20 }),
  }));
  e.bias = -1000;
  e.label = 'The L train';
  e.tap = (c) => { c.bubbles.say(Math.max(40, Math.min(WORLD_W - 40, e.x + len / 2)), 2, 'DING DONG! DOORS CLOSING', 1.8, 'shout'); e.state.fast = true; };
}

function playground(game: Game, story: Story) {
  const add = <T extends Entity>(e: T) => game.add(e);
  // swings: Niam on one, a neighbour kid on the other, Rendi pushing
  const set = add(new Prop(props.swingSet(), 110, 528));
  void set;
  const barY = 528 - 29;
  const niam: Look = { skin: 'fair', hair: 'lightBrown', style: 'swoop', top: 'red', bottom: 'navy', kid: true };
  const kavi: Look = { skin: 'fair', hair: 'lightBrown', style: 'short', top: 'sky', bottom: 'denim', kid: true };
  const rendi: Look = { skin: 'light', hair: 'dirtyBlonde', style: 'long', top: 'green', topKind: 'coat', bottom: 'black' };
  const swing = (sx: number, look: Look, phase: number, id: string) =>
    add(new Custom(sx, 524, {
      update: (s, c, dt) => {
        s.state.t = (s.state.t ?? phase) + dt;
        s.state.amp = Math.max(1, (s.state.amp ?? 1) - dt * 0.12);
      },
      draw: (s, d, c) => {
        const a = c.reduced ? 0 : Math.sin(s.state.t * 2.4) * 0.5 * (s.state.amp ?? 1);
        const seatY = 520 + Math.round(Math.sin(a) * 7);
        const lift = Math.round((1 - Math.cos(a)) * 9);
        d.line(sx - 4, barY + 1, sx - 4, seatY - lift - 6, '#5a5e68');
        d.line(sx + 3, barY + 1, sx + 3, seatY - lift - 6, '#5a5e68');
        d.rect(sx - 5, seatY - lift - 1, 10, 2, '#2a2430');
        d.shadow(sx, 528, 6, 0.2);
        d.sprite(person(look, a > 0.1 ? 'swing1' : 'swing0'), sx, seatY - lift + 3);
      },
      bounds: (s) => ({ x: s.x - 6, y: 500, w: 12, h: 28 }),
    }, { id }));
  const sN = swing(102, niam, 0, 'niam');
  sN.label = 'Niam on the swings';
  const sO = swing(120, { skin: 'fair', hair: 'blonde', style: 'ponytail', top: 'lemon', topKind: 'coat', bottom: 'denim', kid: true }, 1.4, 'other');
  sO.tap = (c) => c.bubbles.say(120, 500, 'I\'M NOT KUNAL! I\'M FIVE.', 2);
  const r = add(new Person(rendi, 100, 508, 'stand'));
  r.id = 'rendi';
  r.label = 'Rendi, pushing the swing';
  r.update = function (c: Ctx, dt: number) {
    Person.prototype.update.call(this, c, dt);
    if (this.script.length) return;
    const ph = Math.sin((sN.state.t ?? 0) * 2.4);
    this.pose = !c.reduced && ph < -0.6 ? 'cheer' : 'stand';
  };
  const famTap = (who: 'rendi' | 'niam' | 'kavi') => (c: Ctx) => {
    const found = story.isFound();
    if (who === 'rendi') { r.hop(); r.say(c, found ? 'YOU FOUND HIM!' : 'KUNAL? WITH HIS LAPTOP, I BET.', 2.4); }
    if (who === 'niam') { sN.state.amp = 1.9; c.bubbles.say(102, 496, 'HIGHER!!', 1.6, 'shout'); }
    if (who === 'kavi') c.bubbles.say(kid.x, kid.y - 14 - kid.z, found ? 'HI DAD!' : 'DAD\'S HIDING!', 1.8);
    story.discover('family');
  };
  r.tap = famTap('rendi');
  sN.tap = famTap('niam');

  // Kavi on the slide, round and round
  add(new Prop(props.slide(), 230, 548));
  const kid = add(new Person(kavi, 252, 549, 'stand'));
  kid.id = 'kavi';
  kid.label = 'Kavi on the slide';
  kid.tap = famTap('kavi');
  kid.bias = 1;
  const slideLoop = () => {
    kid.run([
      { kind: 'walk', x: 222, y: 549, speed: 20 },
      { kind: 'do', fn: (p) => { p.state = { climb: 0 }; } },
      { kind: 'do', fn: (p, c) => climb(p, c) },
    ]);
  };
  const climb = (p: Person, c: Ctx) => {
    if (c.reduced) { p.pose = 'cheer'; p.z = 22; return; }
    // up the ladder
    let z = 0;
    const up = () => {
      z += 1;
      p.z = z; p.pose = 'back';
      if (z < 24) setTimeout(up, 70);
      else { p.pose = 'cheer'; setTimeout(down, 700); }
    };
    const down = () => {
      p.pose = 'sitSide'; p.flip = false;
      let k = 0;
      const step = () => {
        k += 1;
        p.x = 222 + k * 1.4; p.z = Math.max(0, 24 - k * 1.25);
        if (k < 20) setTimeout(step, 30);
        else { p.z = 0; p.pose = 'stand'; p.say(c, 'WHEE!', 0.8); setTimeout(slideLoop, 1200); }
      };
      step();
    };
    up();
  };
  slideLoop();

  // sandbox builders and a sandcastle
  add(new Prop(props.sandcastle(), 228, 596));
  add(new Person({ skin: 'deep', hair: 'black', style: 'curly', top: 'orange', bottom: 'denim', kid: true }, 218, 600, 'crouch', false)).lines = ['IT\'S A CASTLE.', 'FOR A BEAN.'];
  add(new Person({ skin: 'fair', hair: 'auburn', style: 'bob', top: 'purple', bottom: 'denim', kid: true }, 242, 594, 'crouch', true)).lines = ['MOAT!'];
  // the seesaw
  const ss = [props.seesaw(-1), props.seesaw(0), props.seesaw(1)].map(propSprite);
  const kidA: Look = { skin: 'olive', hair: 'brown', style: 'short', top: 'green', bottom: 'navy', kid: true };
  const kidB: Look = { skin: 'light', hair: 'blonde', style: 'bun', top: 'pink', bottom: 'denim', kid: true };
  add(new Custom(296, 612, {
    draw: (s, d, c) => {
      const tilt = c.reduced ? 0 : Math.sin(c.t * 1.6);
      const i = tilt > 0.35 ? 2 : tilt < -0.35 ? 0 : 1;
      d.shadow(296, 612, 26, 0.2);
      d.sprite(ss[i], 296, 612);
      const off = (i - 1) * 3;
      d.sprite(person(kidA, 'sit'), 284, 608 + off);
      d.sprite(person(kidB, 'sit', true), 308, 608 - off);
    },
    bounds: () => ({ x: 280, y: 590, w: 32, h: 24 }),
  })).tap = (c) => c.bubbles.say(296, 588, 'UP! DOWN!', 1.2);
  // climbing dome with a kid on top
  add(new Prop(props.climbingDome(), 76, 618));
  const domeKid = add(new Person({ skin: 'brown', hair: 'black', style: 'cap', hat: 'orange', top: 'navy', bottom: 'denim', kid: true }, 76, 619, 'cheer'));
  domeKid.z = 14;
  domeKid.lines = ['KING OF THE DOME!'];
  domeKid.bias = 1;
  // a parent on the bench, half watching
  add(new Person({ skin: 'olive', hair: 'black', style: 'short', top: 'charcoal', topKind: 'coat', bottom: 'denim', item: 'phone', beard: true }, 86, 477, 'sit')).lines = ['I\'M WATCHING! I\'M WATCHING.'];
}

function tennis(game: Game, bm: Bitmap, story: Story): Entity {
  const L = COURT_LINES;
  const netX = L.x + L.w / 2;
  // chain-link fence: posts and a dithered mesh along the back and sides
  const fence = hex('#5a5e68'), post = hex('#3d4048');
  for (let x = COURT.x; x < COURT.x + COURT.w; x++) {
    if (x > 1186 && x < 1212) continue;
    for (let j = 0; j < 14; j++) if ((x + j) % 3 === 0) bm.px(x, COURT.y - j, fence);
    bm.px(x, COURT.y - 14, post);
    if (x % 32 === 0) bm.vline(x, COURT.y - 14, 15, post);
  }
  for (const x of [COURT.x, COURT.x + COURT.w - 1]) for (let y = COURT.y - 14; y < COURT.y + COURT.h; y++) { bm.px(x, y, post); if (y % 3 === 0) bm.px(x + (x === COURT.x ? 1 : -1), y, fence); }
  // the near fence is a sprite so it draws in front of the players
  const nf = new Bitmap(COURT.w, 16);
  for (let x = 0; x < COURT.w; x++) {
    if (x > 186 && x < 212) continue;
    for (let j = 1; j < 15; j++) if ((x + j) % 3 === 0 && bayer(x, j) < 0.75) nf.px(x, j, fence);
    nf.px(x, 0, post);
    if (x % 32 === 0) nf.vline(x, 0, 16, post);
  }
  game.add(new Prop({ canvas: nf.canvas(), w: nf.w, h: nf.h, ax: 0, ay: 15 } as Sprite, COURT.x, COURT.y + COURT.h));
  const net = props.tennisNet(L.h + 6);
  game.add(new Prop(net, netX, L.y + L.h + 4));

  const p1: Look = { skin: 'fair', hair: 'auburn', style: 'ponytail', top: 'white', topKind: 'tee', bottom: 'navy', bottomKind: 'skirt', item: 'racket' };
  const p2: Look = { skin: 'deep', hair: 'black', style: 'buzz', top: 'coral', topKind: 'tee', bottom: 'white', bottomKind: 'shorts', item: 'racket' };
  const A = game.add(new Person(p1, L.x + 20, L.y + 56, 'stand'));
  const B = game.add(new Person(p2, L.x + L.w - 20, L.y + 50, 'stand', true));
  A.lines = ['15-LOVE!', 'OUT? THAT WAS IN.']; B.lines = ['MY DOG? NO, NOT MINE.', 'THAT WAS OUT.'];
  // spectators
  game.add(new Prop(props.bench(), 1110, 640));
  const specs = [
    game.add(new Person({ skin: 'olive', hair: 'black', style: 'cap', hat: 'navy', top: 'sky', bottom: 'khaki' }, 1104, 639, 'sit', false)),
    game.add(new Person({ skin: 'light', hair: 'blonde', style: 'bun', top: 'pink', bottom: 'white' }, 1116, 639, 'sit', true)),
  ];
  specs[0].lines = ['GREAT RALLY!']; specs[1].lines = ['WHO\'S WINNING?'];

  const ball = { x: A.x + 4, y: A.y - 8, z: 0, vx: 0, vy: 0, vz: 0, live: false, hits: 0, next: 'B' as 'A' | 'B', out: false };
  const court = game.add(new Custom(netX, L.y + L.h / 2, {
    update: (s, c, dt) => {
      s.state.t = (s.state.t ?? 0) + dt;
      if (!ball.live) {
        // A bounces the ball, getting ready to serve
        const k = (s.state.t * 2) % 1;
        ball.x = A.x + 5; ball.y = A.y; ball.z = 8 * Math.abs(Math.sin(k * Math.PI));
        if (c.reduced) ball.z = 4;
        A.pose = 'stand';
        if (!c.reduced && s.state.t > 9) { s.state.t = 0; serve(3 + Math.floor(Math.random() * 3)); }
        return;
      }
      ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.vz -= 260 * dt; ball.z += ball.vz * dt;
      if (ball.z < 0) { ball.z = 0; ball.vz = Math.abs(ball.vz) * 0.55; }
      if (ball.out) {
        if (ball.z <= 0 && ball.y > COURT.y + COURT.h) {
          ball.out = false; ball.live = false; s.state.t = 0;
          // the spectators flinch; Nougat, delighted, has a ball again
          specs.forEach((p, i) => setTimeout(() => { p.hop(4); if (i === 0) p.say(c, 'WATCH IT!', 1.2); }, i * 120));
          const n = c.get('nougat') as Custom | undefined;
          if (n && !n.state.happy) { n.state.dropped = false; c.bubbles.say(n.x, n.y - 12, 'ARF!', 1); }
          s.state.hideBall = true;
          setTimeout(() => (s.state.hideBall = false), 4000);
        }
        return;
      }
      const hitter = ball.next === 'B' ? B : A;
      // the receiver drifts toward the ball's line
      hitter.y += Math.max(-30 * dt, Math.min(30 * dt, ball.y - hitter.y));
      if ((ball.next === 'B' && ball.x >= B.x - 4) || (ball.next === 'A' && ball.x <= A.x + 4)) {
        if (s.state.left <= 0) {
          // the last shot sails over the fence, right to where Nougat waits
          hitter.pose = 'wave1'; setTimeout(() => (hitter.pose = 'stand'), 200);
          const n = c.get('nougat') as Custom | undefined;
          const tx = n && !n.state.happy ? n.x + 4 : 1250, ty = n && !n.state.happy ? n.y : 690;
          ball.next = 'out' as 'A'; ball.out = true;
          ball.vx = (tx - ball.x) / 1.3; ball.vy = (ty - ball.y) / 1.3; ball.vz = 120; ball.z = Math.max(ball.z, 8);
          s.state.left = 99;
          setTimeout(() => (ball.next === ('out' as 'A') ? hitter.say(c, 'OUT!', 1.2) : 0), 300);
          return;
        }
        s.state.left--;
        hitter.pose = 'wave1'; setTimeout(() => (hitter.pose = 'stand'), 200);
        hit(ball.next === 'B' ? A : B);
      }
    },
    draw: (s, d) => {
      if (!ball.live && s.state.hideBall) return;
      d.rect(ball.x + 1, ball.y, 2, 1, 'rgba(40,26,70,0.35)');
      d.rect(ball.x, ball.y - 3 - Math.round(ball.z), 2, 2, '#d8e84a');
    },
    bounds: () => ({ x: COURT.x + 20, y: COURT.y + 10, w: COURT.w - 40, h: COURT.h - 30 }),
  }));
  court.layer = 2;
  const hit = (to: Person) => {
    ball.next = to === A ? 'A' : 'B';
    const tx = to.x + (to === A ? 4 : -4), ty = L.y + 20 + Math.random() * (L.h - 40);
    const dur = 0.9 + Math.random() * 0.25;
    ball.vx = (tx - ball.x) / dur; ball.vy = (ty - ball.y) / dur; ball.vz = 70; ball.z = Math.max(ball.z, 6);
    to.y += 0;
  };
  const serve = (n: number) => {
    court.state.left = n;
    ball.live = true; ball.z = 14; ball.x = A.x + 4; ball.y = A.y;
    A.pose = 'wave0';
    setTimeout(() => (A.pose = 'stand'), 250);
    hit(B);
  };
  court.label = 'The tennis court';
  court.priority = -2;
  court.tap = (c) => { if (!ball.live) { serve(6 + Math.floor(Math.random() * 4)); c.bubbles.say(netX, COURT.y - 6, 'RALLY!', 1.2); story.discover('tennis'); } };

  // ---- Nougat ----
  // She has a ball that is not hers, and a leash with nobody on the end.
  const home = { x: 1238, y: 676 };
  const n = game.add(new Custom(home.x, home.y, {
    update: (s, c, dt) => {
      s.state.t = (s.state.t ?? 0) + dt;
      const st = s.state;
      if (st.mode === 'zoom') {
        st.zt += dt;
        const a = st.zt * 5;
        s.x = st.cx + Math.cos(a) * 14; s.y = st.cy + Math.sin(a) * 6;
        st.flip = Math.sin(a) > 0;
        if (st.zt > 2.2) { st.mode = 'idle'; s.x = st.cx; s.y = st.cy; st.dropped = true; }
      } else if (st.mode === 'go') {
        const dx = st.tx - s.x, dy = st.ty - s.y, dist = Math.hypot(dx, dy);
        const sp = 170 * dt;
        st.flip = dx < 0;
        if (dist < sp) { s.x = st.tx; s.y = st.ty; st.mode = 'idle'; st.happy = true; st.flip = false; }
        else { s.x += (dx / dist) * sp; s.y += (dy / dist) * sp; }
      }
    },
    draw: (s, d, c) => {
      const st = s.state;
      const running = st.mode === 'zoom' || st.mode === 'go';
      const f = Math.floor((st.t ?? 0) * 10) % 2;
      let pose: NougatPose;
      if (running) pose = st.dropped ? (f ? 'run0' : 'run1') : (f ? 'ballRun0' : 'ballRun1');
      else if (st.happy) pose = Math.floor((st.t ?? 0) * 2) % 4 === 0 ? 'beg' : 'happy';
      else if (st.dropped) pose = Math.floor((st.t ?? 0) * 1.5) % 6 === 0 ? 'bark' : 'sit';
      else pose = !c.reduced && Math.floor((st.t ?? 0) * 0.7) % 5 === 0 ? 'stand' : 'ball';
      d.shadow(s.x, s.y, 10);
      if (!st.happy) {
        // a leash trailing behind her, nobody on the other end
        const back = st.flip ? 1 : -1;
        d.line(s.x + back * 3, s.y - 5, s.x + back * 10, s.y, '#c83a32');
        d.line(s.x + back * 10, s.y, s.x + back * 16, s.y + 1, '#c83a32');
      }
      d.sprite(nougat(pose, !!st.flip), s.x, s.y);
      if (st.dropped && !st.happy && st.mode !== 'go') { d.rect(s.x + (st.flip ? -12 : 10), s.y - 2, 2, 2, '#d8e84a'); }
    },
    bounds: (s) => ({ x: s.x - 8, y: s.y - 10, w: 16, h: 11 }),
  }, { flip: true, mode: 'idle' }));
  n.id = 'nougat';
  n.label = 'Nougat, a Shih Tzu, with a tennis ball that isn\'t hers';
  n.priority = 4;
  n.tap = (c) => {
    const st = n.state;
    c.bubbles.say(n.x, n.y - 12, st.happy ? '♥ ARF ♥' : 'ARF!', 1.2);
    if (st.mode === 'idle' && !c.reduced) {
      st.mode = 'zoom'; st.zt = 0; st.cx = n.x; st.cy = n.y;
      const f = game.entities.find((e) => (e as Entity & { nougatFlock?: boolean }).nougatFlock);
      setTimeout(() => f?.tap?.(c), 400);
    }
    else st.dropped = true;
    story.discover('nougat');
  };
  return n;
}

function frisbee(game: Game) {
  const a = game.add(new Person({ skin: 'brown', hair: 'brown', style: 'short', top: 'purple', bottom: 'khaki' }, 852, 558, 'stand'));
  const b = game.add(new Person({ skin: 'fair', hair: 'blonde', style: 'cap', hat: 'green', top: 'white', topKind: 'tee', bottom: 'navy', bottomKind: 'shorts' }, 944, 590, 'stand', true));
  a.lines = ['NICE THROW!']; b.lines = ['GO LONG!'];
  const corgi = game.add(new Critter((f, i, m) => dog('corgi', m ? i : 0, f), 898, 574, 9));
  corgi.tap = (c) => c.bubbles.say(corgi.x, corgi.y - 10, 'YIP!', 1);
  let t = 0;
  game.add(new Custom(0, 0, {
    update: (s, c, dt) => {
      if (c.reduced) return;
      t += dt;
      const period = 2.4;
      const k = (t % period) / period;
      const toB = Math.floor(t / period) % 2 === 0;
      const [from, to] = toB ? [a, b] : [b, a];
      const fx = from.x + (to.x - from.x) * k, fy = from.y + (to.y - from.y) * k;
      s.x = fx; s.y = fy; s.z = 10 + Math.sin(k * Math.PI) * 18;
      from.pose = k < 0.12 ? 'wave0' : 'stand';
      to.pose = k > 0.88 ? 'cheer' : 'stand';
      // the corgi always runs after it, always a little late
      const dx = fx - corgi.x;
      corgi.x += Math.max(-46 * dt, Math.min(46 * dt, dx));
      corgi.y += Math.max(-20 * dt, Math.min(20 * dt, fy + 4 - corgi.y));
      corgi.flip = dx < 0;
      corgi.moving = Math.abs(dx) > 1;
    },
    draw: (s, d) => {
      if (!s.x) return;
      d.rect(s.x - 1, s.y - Math.round(s.z), 4, 1, '#f2d03a');
      d.rect(s.x, s.y - Math.round(s.z) - 1, 2, 1, '#f2e070');
    },
    bounds: (s) => ({ x: s.x - 2, y: s.y - s.z - 2, w: 4, h: 3 }),
  })).layer = 2;
}

function kite(game: Game, x: number, y: number) {
  const flyer = game.add(new Person({ skin: 'deep', hair: 'black', style: 'curly', top: 'lemon', topKind: 'coat', bottom: 'denim', kid: true }, x, y, 'wave1'));
  flyer.lines = ['IT\'S FLYING!', 'DON\'T TOUCH THE STRING.'];
  const art = propSprite(props.kiteArt());
  game.add(new Custom(x, y, {
    draw: (s, d, c) => {
      const kx = x - 40 + Math.sin(c.t * 0.7) * 6, ky = y - 74 + Math.sin(c.t * 1.3) * 4;
      leash(d, x + 3, y - 10, kx, ky + 5, 'rgba(246,241,230,0.8)');
      d.sprite(art, kx, ky);
    },
    bounds: () => ({ x: x - 50, y: y - 90, w: 20, h: 20 }),
  })).layer = 2;
}

function butterflies(game: Game, x: number, y: number) {
  for (let i = 0; i < 2; i++) {
    game.add(new Custom(x, y, {
      update: (s, c, dt) => {
        s.state.t = (s.state.t ?? i * 3) + dt;
        const t = s.state.t;
        if (!c.reduced) { s.x = x + Math.sin(t * 0.6 + i) * 30 + Math.sin(t * 2.3) * 4; s.y = y + Math.cos(t * 0.4 + i * 2) * 14; s.z = 8 + Math.sin(t * 3) * 3; }
      },
      draw: (s, d, c) => d.sprite(butterfly(Math.floor(c.t * 8 + i)), s.x, s.y - s.z),
      bounds: (s) => ({ x: s.x - 2, y: s.y - s.z - 2, w: 4, h: 3 }),
    })).layer = 2;
  }
}

function ducks(game: Game) {
  const { cx, cy, rx, ry } = POND;
  const swim = (kind: 'drake' | 'hen' | 'duckling', phase: number, speed: number, r: number) => {
    const d = game.add(new Custom(cx, cy, {
      update: (s, c, dt) => {
        s.state.t = (s.state.t ?? phase) + (c.reduced ? 0 : dt * speed);
        const a = s.state.t;
        s.x = cx - 50 + Math.cos(a) * rx * r * 0.6;
        s.y = cy + Math.sin(a) * ry * r;
        s.state.flip = Math.sin(a) > 0;
        if (s.state.dive > 0) s.state.dive -= dt;
      },
      draw: (s, d, c) => {
        const k = s.state.dive > 0 ? 'dive' : kind;
        d.sprite(duck(k as 'drake', s.state.flip), s.x, s.y + (Math.floor(c.t * 2 + phase) % 2));
        if (Math.floor(c.t * 3 + phase) % 3 === 0) d.rect(s.x + (s.state.flip ? 4 : -4), s.y + 1, 2, 1, '#86b59c');
      },
      bounds: (s) => ({ x: s.x - 5, y: s.y - 6, w: 10, h: 7 }),
    }));
    d.layer = 0;
    d.tap = (c) => { d.state.dive = 1.2; c.bubbles.say(d.x, d.y - 7, 'QUACK', 1); };
    return d;
  };
  swim('drake', 0, 0.16, 0.7);
  swim('hen', 0.25, 0.16, 0.7);
  for (let i = 0; i < 3; i++) swim('duckling', 0.42 + i * 0.07, 0.16, 0.7);
  swim('drake', 3, -0.11, 0.45);
  swim('hen', 3.3, -0.11, 0.45);
}

function fisherman(game: Game) {
  const x = PIER.x + 16, y = PIER.bottom - 6;
  const f = game.add(new Person({ skin: 'olive', hair: 'grey', style: 'cap', hat: 'olive', top: 'olive', topKind: 'coat', bottom: 'khaki', beard: true }, x, y, 'sit'));
  f.lines = ['NOTHING YET.', 'PATIENCE.'];
  game.add(new Prop(props.crate(), x, y + 1)).bias = -1;
  const boot = spriteFrom((() => { const b = new Bitmap(7, 7); b.stamp(['..BB.', '..BB.', '..BB.', 'BBBB.', 'BBBBB'], 1, 1, { B: hex('#4a3a2a') }); b.outline(); return b; })());
  const fish = spriteFrom((() => { const b = new Bitmap(8, 5); b.stamp(['.SSS.S', 'SSESSS', '.SSS.S'], 1, 1, { S: hex('#a8b4c0'), E: P.ink }); b.outline(); return b; })());
  game.add(new Custom(x, y, {
    update: (s, c, dt) => {
      s.state.t = (s.state.t ?? 0) + dt;
      if (s.state.catch !== undefined) { s.state.catch += dt; if (s.state.catch > 3) s.state.catch = undefined; }
      else if (!c.reduced && s.state.t > 22) { s.state.t = 0; s.state.catch = 0; s.state.what = Math.random() < 0.7 ? 'boot' : 'fish'; f.say(c, s.state.what === 'boot' ? 'A BOOT. AGAIN.' : 'A FISH!', 2); }
    },
    draw: (s, d, c) => {
      const tipX = x + 14, tipY = y - 26;
      d.line(x + 3, y - 8, tipX, tipY, '#4a2e22');
      const k = s.state.catch;
      if (k !== undefined) {
        const h = Math.min(1, k * 1.5);
        const cxp = tipX + 4, cyp = y + 20 - h * 30;
        d.line(tipX, tipY, cxp, cyp - 4, 'rgba(246,241,230,0.8)');
        d.sprite(s.state.what === 'boot' ? boot : fish, cxp, cyp + 3);
      } else {
        const bob = Math.floor(c.t * 1.5) % 2;
        d.line(tipX, tipY, tipX + 6, y + 24, 'rgba(246,241,230,0.7)');
        d.rect(tipX + 6, y + 24 + bob, 2, 1, '#e0402e');
      }
    },
    bounds: () => ({ x: x - 6, y: y - 30, w: 28, h: 60 }),
  })).layer = 2;
  f.tap = (c) => {
    const e = game.entities.find((q) => q instanceof Custom && q.x === x && q.y === y && q !== (f as Entity)) as Custom | undefined;
    if (e && e.state.catch === undefined) { e.state.catch = 0; e.state.what = 'boot'; f.say(c, 'A BOOT. AGAIN.', 2); story_noop(); }
  };
}
const story_noop = () => {};

function cyclist(game: Game) {
  const rider: Look = { skin: 'brown', hair: 'black', style: 'cap', hat: 'sky', top: 'sky', topKind: 'tee', bottom: 'black', bottomKind: 'shorts' };
  const frames = [0, 1].map((i) => bicycle(hex('#e0402e'), i).canvas());
  const e = game.add(new Custom(-30, 896, {
    update: (s, c, dt) => {
      if (c.reduced) { s.x = 980; return; }
      s.x += 58 * dt;
      if (s.x > WORLD_W + 40) s.x = -40;
    },
    draw: (s, d, c) => {
      d.shadow(s.x, s.y, 14);
      d.canvas(frames[Math.floor(c.t * 10) % 2], s.x - 8, s.y - 9);
      d.sprite(person(rider, 'sitSide'), s.x - 1, s.y - 4);
    },
    bounds: (s) => ({ x: s.x - 8, y: s.y - 20, w: 16, h: 20 }),
  }));
  e.tap = (c) => c.bubbles.say(e.x, e.y - 22, 'DING DING!', 1);
}

function boats(game: Game) {
  const art = propSprite(props.sailboat());
  for (const [x0, y, sp] of [[300, 948, 6], [1000, 938, -4]] as const) {
    const e = game.add(new Custom(x0, y, {
      update: (s, c, dt) => { if (!c.reduced) { s.x += sp * dt; if (s.x > WORLD_W + 30) s.x = -30; if (s.x < -30) s.x = WORLD_W + 30; } },
      draw: (s, d, c) => {
        d.sprite(art, s.x, s.y + (Math.floor(c.t + x0) % 2));
        d.rect(s.x - 8, s.y + 2, 4, 1, '#b6dbe8'); d.rect(s.x + 6, s.y + 2, 3, 1, '#b6dbe8');
      },
      bounds: (s) => ({ x: s.x - 11, y: s.y - 23, w: 22, h: 24 }),
    }));
    e.tap = (c) => c.bubbles.say(e.x, e.y - 24, 'AHOY!', 1);
  }
}

function gulls(game: Game) {
  game.add(new Custom(0, WORLD_H, {
    draw: (_s, d, c) => {
      if (c.reduced) return;
      for (let i = 0; i < 4; i++) {
        const x = ((c.t * (10 + i * 3) + i * 330) % (WORLD_W + 60)) - 30;
        const y = 916 + i * 9 + Math.sin(c.t * 0.8 + i) * 4;
        const up = Math.floor(c.t * 4 + i) % 2;
        d.rect(x - 2, y - up, 2, 1, '#f6f1e6'); d.rect(x, y, 1, 1, '#f6f1e6'); d.rect(x + 1, y - up, 2, 1, '#f6f1e6');
      }
    },
    bounds: () => ({ x: 0, y: 0, w: 0, h: 0 }),
  })).layer = 2;
}

function coopFlight(game: Game) {
  game.add(new Custom(1306, 110, {
    draw: (_s, d, c) => {
      if (c.reduced) return;
      const k = (c.t % 16) / 16;
      if (k > 0.55) return;
      for (let i = 0; i < 5; i++) {
        const a = k * Math.PI * 4 + i * 0.5;
        const x = 1306 + Math.cos(a) * 40, y = 96 + Math.sin(a) * 18 - 10;
        d.sprite(pigeon(Math.floor(c.t * 10 + i) % 2 ? 'fly0' : 'fly1', Math.sin(a) > 0), x, y);
      }
    },
    bounds: () => ({ x: 0, y: 0, w: 0, h: 0 }),
  })).layer = 2;
}

function raccoonBin(game: Game, story: Story) {
  game.add(new Prop(props.dumpster(), 820, 118));
  const binX = 846, binY = 120;
  game.add(new Prop(props.garbageBin(), binX, binY));
  game.add(new Prop(props.garbageBin(hex('#2e4f8e')), binX + 10, binY));
  const r = game.add(new Custom(binX, binY - 11, {
    update: (s, c, dt) => { s.state.t = (s.state.t ?? 0) + dt; if (s.state.out > 0) s.state.out -= dt; },
    draw: (s, d, c) => {
      const peek = s.state.out > 0 || (!c.reduced && (s.state.t % 11) > 9.5);
      d.sprite(raccoon(peek), s.x, s.y + (peek ? 0 : 2));
      if (s.state.out > 0 && s.state.out < 2.5) d.rect(s.x + 4, s.y - 5, 3, 2, '#d9a660');
    },
    bounds: (s) => ({ x: s.x - 5, y: s.y - 7, w: 10, h: 10 }),
  }));
  r.bias = 1;
  r.label = 'A raccoon in the alley bins';
  r.priority = 3;
  r.tap = (c) => { r.state.out = 3.5; c.bubbles.say(r.x, r.y - 9, 'THIS IS MY BIN.', 1.8); story.discover('raccoon'); };
}

function hoops(game: Game) {
  const kid = game.add(new Person({ skin: 'deep', hair: 'black', style: 'short', top: 'red', topKind: 'tee', bottom: 'black', bottomKind: 'shorts', kid: true }, 196, 116, 'back'));
  kid.lines = ['NOTHING BUT NET.', 'THAT ONE DIDN\'T COUNT.'];
  game.add(new Custom(196, 116, {
    draw: (_s, d, c) => {
      const k = (c.t % 3) / 3;
      let x: number, y: number;
      if (c.reduced) { x = 200; y = 106; }
      else if (k < 0.45) { const t = k / 0.45; x = 196 + (178 - 196) * t; y = 104 + (50 - 104) * t - Math.sin(t * Math.PI) * 26; }
      else if (k < 0.6) { const t = (k - 0.45) / 0.15; x = 178; y = 50 + t * 40; }
      else { const t = (k - 0.6) / 0.4; x = 178 + t * 18; y = 90 + t * 14 - Math.abs(Math.sin(t * Math.PI * 2)) * 8; }
      kid.pose = !c.reduced && k > 0.9 ? 'cheer' : 'back';
      d.rect(x, y, 3, 3, '#e07a26'); d.rect(x, y, 1, 1, '#f4a050');
    },
    bounds: () => ({ x: 0, y: 0, w: 0, h: 0 }),
  })).layer = 2;
}

function rooftopCinema(game: Game, bm: Bitmap, story: Story) {
  // a screen standing on the back of the cinema roof, chairs in rows, a
  // projector at the front. The film loops; tapping it plays the scary bit.
  const sx = 562, sy = 92, sw = 76, sh = 34;
  bm.rect(sx - 3, sy - 3, sw + 6, sh + 6, hex('#18161e'));
  bm.rect(sx - 1, sy + sh + 3, 2, 6, hex('#18161e')); bm.rect(sx + sw - 1, sy + sh + 3, 2, 6, hex('#18161e'));
  for (let j = 0; j < 4; j++) for (let i = 0; i < sw + 6; i++) if (bayer(i, j) < 0.6) bm.shade(sx - 3 + i + 3, sy + sh + 3 + j, 0.6);
  const rows = [150, 164, 178];
  const audience: Person[] = [];
  const looks: Look[] = [
    { skin: 'fair', hair: 'brown', style: 'long', top: 'red', bottom: 'denim', item: 'popcorn' },
    { skin: 'deep', hair: 'black', style: 'buzz', top: 'navy', bottom: 'denim' },
    { skin: 'olive', hair: 'black', style: 'bun', top: 'teal', bottom: 'denim' },
    { skin: 'light', hair: 'blonde', style: 'cap', hat: 'red', top: 'grey', bottom: 'denim' },
    { skin: 'brown', hair: 'black', style: 'curly', top: 'orange', bottom: 'denim', item: 'popcorn' },
    { skin: 'fair', hair: 'auburn', style: 'ponytail', top: 'purple', bottom: 'denim' },
    { skin: 'light', hair: 'grey', style: 'bald', top: 'green', bottom: 'denim' },
    { skin: 'deep', hair: 'black', style: 'long', top: 'pink', bottom: 'denim' },
    { skin: 'olive', hair: 'brown', style: 'short', top: 'sky', bottom: 'denim', item: 'popcorn' },
    { skin: 'fair', hair: 'blonde', style: 'bob', top: 'coral', bottom: 'denim' },
    { skin: 'brown', hair: 'black', style: 'beanie', hat: 'mustard', top: 'charcoal', bottom: 'denim' },
  ];
  let li = 0;
  rows.forEach((ry, r) => {
    const n = r === 0 ? 4 : r === 1 ? 4 : 3;
    for (let i = 0; i < n; i++) {
      const x = 548 + i * 22 + (r % 2) * 10 + (r === 2 ? 12 : 0);
      const chair = props.deckChair([hex('#d23a32'), hex('#2e5aa8'), hex('#3f8a56'), hex('#e8b83a')][(i + r) % 4]);
      game.add(new Prop(chair, x, ry + 1)).bias = 1;
      const p = game.add(new Person(looks[li++ % looks.length], x, ry, 'sitBack'));
      p.bias = 2;
      p.lines = ['SHHH!', 'DOWN IN FRONT!', 'IS THIS THE SEQUEL?'];
      audience.push(p);
    }
  });
  game.add(new Prop(props.projector(), 598, 194));
  const screen = game.add(new Custom(sx + sw / 2, sy + sh, {
    update: (s, c, dt) => {
      s.state.t = (s.state.t ?? 0) + dt;
      if (s.state.scare !== undefined) s.state.scare += dt;
      if (s.state.scare > 4) s.state.scare = undefined;
    },
    draw: (s, d, c) => {
      const t = c.reduced ? 3 : s.state.t;
      const scare = s.state.scare;
      // a little film: a moonlit hill, a ghost drifting across
      const g = d.ctx;
      g.fillStyle = scare !== undefined && scare < 1.2 ? '#f6f1e6' : '#2a2a4a';
      g.fillRect(sx, sy, sw, sh);
      if (scare !== undefined && scare < 1.2) {
        // jump scare: a huge ghost face fills the screen
        g.fillStyle = '#2a2430';
        g.fillRect(sx + 22, sy + 8, 8, 10); g.fillRect(sx + 46, sy + 8, 8, 10);
        g.fillRect(sx + 30, sy + 22, 16, 8);
        return;
      }
      g.fillStyle = '#f2e6b0'; for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) if ((i - 3.5) ** 2 + (j - 3.5) ** 2 < 14 && (i - 5.5) ** 2 + (j - 2.5) ** 2 > 9) g.fillRect(sx + 56 + i, sy + 4 + j, 1, 1);
      g.fillStyle = '#3a4a3a';
      for (let i = 0; i < sw; i++) { const h = 6 + Math.round(Math.sin(i * 0.08) * 3); g.fillRect(sx + i, sy + sh - h, 1, h); }
      const gx = sx + ((t * 10) % (sw + 20)) - 10, gy = sy + 14 + Math.sin(t * 2) * 3;
      g.fillStyle = '#f6f1e6';
      g.fillRect(gx, gy, 6, 7); g.fillRect(gx + 1, gy - 1, 4, 1); g.fillRect(gx, gy + 7, 1, 1); g.fillRect(gx + 2, gy + 7, 2, 1); g.fillRect(gx + 5, gy + 7, 1, 1);
      g.fillStyle = '#2a2430'; g.fillRect(gx + 1, gy + 2, 1, 1); g.fillRect(gx + 4, gy + 2, 1, 1);
      // projector beam flicker
      if (Math.floor(c.t * 12) % 9 === 0) { g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(sx, sy, sw, sh); }
      // subtitles, because of course
      if (Math.floor(t / 4) % 3 === 1) { g.fillStyle = '#f6f1e6'; const w = 28; g.fillRect(sx + sw / 2 - w / 2, sy + sh - 4, w, 1); }
    },
    bounds: () => ({ x: sx - 3, y: sy - 3, w: sw + 6, h: sh + 6 }),
  }));
  screen.layer = 0;
  screen.label = 'The rooftop cinema';
  screen.priority = 2;
  screen.tap = (c) => {
    if (screen.state.scare !== undefined) return;
    screen.state.scare = 0;
    audience.forEach((p, i) => setTimeout(() => { p.hop(5); if (i % 4 === 0) p.say(c, ['AAH!', 'EEK!', 'NOPE!'][i % 3], 1.2, 'shout'); }, 120 + i * 40));
    // popcorn everywhere
    setTimeout(() => { for (const p of audience) if (p.look.item === 'popcorn') c.fx.burst(p.x, p.y - 10, ['#f4e08a', '#f6f1e6'], 10, 40, 140, 1.2); }, 160);
    story.discover('cinema');
  };
  // the marquee: what's showing, and later, what you just did
  const m = SPOTS.marquee;
  const marquee = game.add(new Custom(m.x, m.y, {
    draw: (s, d, c) => {
      const found = story.isFound();
      const text = found ? ['YOU FOUND', 'KUNAL!'] : ['TONIGHT', Math.floor(c.t / 5) % 2 ? 'THE LONG PAN' : 'ZOOM IN 2'];
      d.ctx.fillStyle = '#f6f1e6';
      d.ctx.fillRect(m.x, m.y, m.w, m.h);
      text.forEach((line, i) => textAt(d, line, m.x + m.w / 2, m.y + 2 + i * 7, found && Math.floor(c.t * 3) % 2 ? '#c8302a' : '#2a2430'));
    },
    bounds: () => m,
  }));
  marquee.layer = 0;
  marquee.tap = screen.tap;
}

/** Draw pixel text into the world at runtime (marquee). */
const textCache = new Map<string, HTMLCanvasElement>();
function textAt(d: WorldDraw, text: string, cx: number, y: number, css: string) {
  const key = text + css;
  let c = textCache.get(key);
  if (!c) {
    const w = textWidth(text);
    const b = new Bitmap(w + 2, 6);
    drawTextCentered(b, text, (w + 2) / 2, 0, hex(css));
    c = b.canvas();
    textCache.set(key, c);
  }
  d.canvas(c, Math.round(cx - c.width / 2), y);
}

export function celebrate(game: Game, x: number, y: number) {
  game.fx.burst(x, y - 14, CONFETTI, 70, 90, 70, 2.6);
}

export type { Box };

// Seeded townsfolk for the busy parts. Nobody random wears mustard: that
// colour belongs to Kunal and a handful of deliberate decoys.
const SKINS = ['fair', 'light', 'olive', 'brown', 'deep'] as const;
const HAIRS = ['black', 'dark', 'brown', 'auburn', 'blonde', 'grey', 'black', 'dark'] as const;
const STYLES = ['short', 'long', 'bob', 'bun', 'ponytail', 'curly', 'buzz', 'cap', 'beanie', 'short', 'long', 'bald'] as const;
const TOPS = ['red', 'coral', 'orange', 'olive', 'green', 'teal', 'sky', 'blue', 'navy', 'purple', 'pink', 'plum', 'brown', 'tan', 'grey', 'charcoal', 'white', 'khaki'] as const;
const BOTTOMS = ['denim', 'navy', 'black', 'charcoal', 'khaki', 'brown', 'grey', 'denim'] as const;
const ITEMS = ['none', 'none', 'none', 'cup', 'phone', 'bag', 'none', 'book', 'icecream'] as const;
const QUIPS = ['NICE DAY FOR IT.', 'HAVE YOU SEEN A DOG?', 'NOT ME.', 'I\'M JUST HERE.', 'HELLO!', 'WE\'RE LOST.', 'IS THAT THE L?', 'LOVE THIS PARK.', 'HM?', 'SAY HI TO NOUGAT.', 'COLD, ISN\'T IT?', 'OH, HI!'];

export function randomLook(R: ReturnType<typeof rng>, kid = false): Look {
  const style = R.pick(STYLES);
  return {
    skin: R.pick(SKINS), hair: R.pick(HAIRS), style, hat: style === 'cap' || style === 'beanie' ? R.pick(TOPS) : undefined,
    top: R.pick(TOPS), topKind: R.chance(0.35) ? 'coat' : R.chance(0.15) ? 'tee' : 'long',
    bottom: R.pick(BOTTOMS), bottomKind: R.chance(0.12) ? 'skirt' : 'pants',
    item: kid ? 'none' : R.pick(ITEMS), extra: R.pick(TOPS), kid,
    glasses: R.chance(0.15), beard: R.chance(0.12),
  };
}

type Who = (look: Look, x: number, y: number, pose?: Pose, flip?: boolean, lines?: string[]) => Person;
type Walker = (look: Look, pts: [number, number][], speed?: number, loop?: boolean, lines?: string[]) => Person;

function crowds(game: Game, who: Who, walker: Walker) {
  const R = rng(2026);
  const q = () => [R.pick(QUIPS)];
  const standers: [number, number, Pose?][] = [
    // around the bean
    [628, 586], [636, 596, 'back'], [748, 590], [756, 600, 'side'], [612, 610], [770, 616, 'back'], [676, 640], [700, 646, 'side'], [720, 636], [598, 572, 'back'],
    // north lawn
    [440, 470], [452, 472, 'side'], [700, 488], [714, 488, 'side'],
    // south lawn and paths
    [700, 790, 'back'], [990, 846], [1002, 848, 'side'],
    // east lawn
    [1360, 708], [1372, 712, 'side'], [1150, 790], [1300, 846], [1416, 846, 'back'],
    // pond and playground edges
    [180, 700], [192, 702, 'side'], [380, 740], [60, 652], [330, 470], [20, 600],
    // tennis court sidelines
    [1020, 600, 'side'], [1384, 520, 'back'],
    // promenade loiterers
    [140, 888, 'back'], [152, 888, 'back'], [700, 890, 'back'], [1340, 888, 'back'], [1352, 889, 'side'],
    // sidewalks
    [380, 316], [540, 320], [880, 322], [1030, 318], [1420, 322], [220, 428], [880, 426], [1180, 430],
  ];
  for (const [x, y, pose] of standers) {
    const p = who(randomLook(R), x, y, pose ?? 'stand', R.chance(0.5), q());
    if (R.chance(0.3)) p.idle = [[p.pose, 2 + R.next() * 3], [R.pick(['side', 'stand', 'back'] as Pose[]), 1 + R.next() * 2, R.chance(0.5)]];
  }
  // sitters on the grass, in little circles
  const circles: [number, number, number][] = [[820, 600, 4], [520, 610, 3], [1100, 860, 3], [360, 620, 2], [1240, 790, 3]];
  for (const [cx, cy, n] of circles) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const x = Math.round(cx + Math.cos(a) * 8), y = Math.round(cy + Math.sin(a) * 4);
      who(randomLook(R), x, y, Math.sin(a) < -0.3 ? 'sit' : 'sitSide', Math.cos(a) > 0, q()).seated = true;
    }
  }
  // more kids at the playground
  for (const [x, y] of [[150, 560], [170, 600], [290, 520], [60, 560], [200, 520]] as const) {
    const k = who(randomLook(R, true), x, y, R.pick(['stand', 'cheer', 'wave0'] as Pose[]), R.chance(0.5), ['TAG!', 'YOU\'RE IT!', 'WHEE!']);
    k.route = { pts: [[x, y], [x + R.int(-30, 30), y + R.int(-14, 14)]], speed: 24, loop: false, pause: 0.6 };
  }
  // walkers
  walker(randomLook(R), [[1440, 320], [1000, 320]], 15, false, q());
  walker(randomLook(R), [[140, 326], [600, 326]], 13, false, q());
  walker(randomLook(R), [[1430, 432], [900, 432]], 14, false, q());
  walker(randomLook(R), [[300, 892], [1300, 892]], 12, false, q());
  walker(randomLook(R), [[1300, 894], [100, 894]], 15, false, q());
  walker(randomLook(R), [[20, 885], [600, 885]], 11, false, q());
  walker(randomLook(R), [[1200, 470], [1204, 456], [1200, 440]], 9, false, q());
  walker(randomLook(R), [[640, 708], [560, 760], [470, 840], [380, 872], [313, 884]], 12, false, q());
  walker(randomLook(R), [[338, 566], [400, 560], [500, 548], [600, 560]], 11, false, q());
  walker(randomLook(R), [[1440, 720], [1260, 724], [1120, 716], [990, 698]], 13, false, q());
}
