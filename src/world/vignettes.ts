import { Bitmap } from '../art/bitmap';
import { hex, mix, shadow, toCss } from '../art/color';
import { P } from '../art/palette';
import { rng, noise2, bayer } from '../art/rng';
import { Look, Pose, person } from '../art/people';
import * as props from '../art/props';
import { dog, pigeon } from '../art/animals';
import { Entity, Person, Custom, Critter, Prop, Ctx } from './actors';
import { Game } from '../engine/game';
import { propSprite } from '../engine/draw';
import { flock, leash, blanket, randomLook } from './scene';
import { WORLD_W } from './layout';

// Little stories. Each one is a small, authored chain of cause and effect
// that plays on its own now and then, and can be set off by a tap: a
// balloon gets away, a dog finds a picnic, a coffee hits the pavement.

const css = (h: string) => toCss(hex(h));
const wait = (t: number) => ({ kind: 'wait' as const, t });

/** Fires `fn` every `period` seconds (after `first`), unless motion is reduced. */
function every(game: Game, period: number, first: number, fn: (c: Ctx) => void) {
  let t = period - first;
  let busy = 0;
  const e = game.add(new Custom(0, 0, {
    update: (_s, c, dt) => {
      if (busy > 0) busy -= dt;
      if (c.reduced) return;
      t += dt;
      if (t >= period) { t = 0; run(c); }
    },
    draw: () => {}, bounds: () => ({ x: 0, y: 0, w: 0, h: 0 }),
  }));
  e.layer = 0;
  const run = (c: Ctx) => { busy = period * 0.6; fn(c); };
  return {
    /** start it now (from a tap), if it isn't already playing */
    fire: (c: Ctx) => { if (busy > 0) return false; t = 0; run(c); return true; },
  };
}

type Who = (look: Look, x: number, y: number, pose?: Pose, flip?: boolean, lines?: string[]) => Person;

export interface VignetteApi {
  game: Game;
  bm: Bitmap;
  who: Who;
  prop: (art: props.PropArt, x: number, y: number, shadowW?: number) => Entity;
}

/** Painted before the trees and buildings: little back yards along the alley. */
export function paintYards(bm: Bitmap) {
  // [x0, x1, building top] – a strip of yard behind each building
  const lots: [number, number, number][] = [[0, 128, 108], [128, 284, 150], [284, 456, 114], [704, 822, 164], [822, 962, 130], [962, 1112, 152], [1112, 1272, 136], [1272, 1440, 96]];
  const skip = (x: number) => (x >= 984 && x <= 1082) || (x >= 556 && x <= 644);
  for (const [x0, x1, top] of lots) {
    const y0 = top - 26;
    for (let y = y0; y < top; y++)
      for (let x = x0 + 2; x < x1 - 2; x++) {
        if (skip(x)) continue;
        let v = 0.45 + (noise2(x, y, 31) - 0.5) * 0.3 + (bayer(x, y) - 0.5) * 0.15;
        let c = P.grass[Math.max(0, Math.min(4, Math.floor(v * 5)))];
        if (noise2(x, y, 32) > 0.94) c = noise2(x, y, 33) > 0.5 ? P.leafOrange[3] : P.leafGold[3];
        bm.px(x, y, c);
      }
    // picket fence across the back of each yard, gaps for gates
    for (let x = x0 + 2; x < x1 - 2; x++) {
      if (skip(x) || (x - x0) % 40 < 6) continue;
      bm.px(x, y0 - 1, P.wood[2]);
      if (x % 3 === 0) { bm.vline(x, y0 - 5, 5, P.cream); bm.px(x, y0 - 6, P.paper); }
    }
    bm.hline(x0 + 2, y0 - 3, x1 - x0 - 4, P.paper);
  }
  // raised garden beds behind the studio
  for (let i = 0; i < 4; i++) {
    const x = 300 + i * 26, y = 101;
    bm.rect(x, y, 20, 8, P.wood[2]); bm.hline(x, y, 20, P.wood[4]);
    for (let k = 1; k < 19; k += 2) bm.px(x + k, y + 2 + (k % 3), [P.leafGreen[3], hex('#e0402e'), P.leafGold[3]][(k + i) % 3]);
  }
  // a mural on the back of the garage behind the arcade
  const mx = 1012, my = 68, mw = 56, mh = 22;
  for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) {
    const band = Math.floor((x + y * 0.6) / 7) % 5;
    bm.px(mx + x, my + y, [hex('#e0402e'), hex('#f2b43a'), hex('#3a7ad0'), hex('#3f9a56'), hex('#c45a86')][band]);
  }
  // a big pixel heart on it
  const heart = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
  heart.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === '#') bm.rect(mx + 20 + i * 2, my + 4 + j * 2, 2, 2, P.white); });
}

export function addVignettes(api: VignetteApi) {
  const { game, bm, who } = api;
  coffeeSpill(game, who);
  cafeDog(game, who);
  cinemaQueue(game, who);
  scooter(game, who);
  market(game, bm, who, api.prop);
  chess(game, who, api.prop);
  balloon(game, who);
  yoga(game, bm, who);
  jazz(game, who, api.prop);
  picnicDog(game, bm, who);
  friesThief(game, who);
  blockTower(game, who);
  strollers(game);
  bbq(game, who, api.prop);
  skater(game);
  windowLife(game);
  moreLife(game, bm, who, api.prop);
  // pigeons near Nougat, for her to scatter
  const f = flock(game, 1212, 692, 5, 9);
  (f as Entity & { nougatFlock?: boolean }).nougatFlock = true;
}

// ---- the street ---------------------------------------------------------------

/** Someone leaves the café, trips, drops their coffee; others step around it until it's mopped. */
function coffeeSpill(game: Game, who: Who) {
  const y = 326;
  const puddle = game.add(new Custom(380, y + 2, {
    draw: (s, d) => {
      d.rect(s.x - 4, s.y - 1, 9, 2, css('#6a4028')); d.rect(s.x - 3, s.y - 2, 6, 1, css('#6a4028')); d.rect(s.x - 2, s.y + 1, 4, 1, css('#6a4028'));
      d.rect(s.x - 2, s.y - 1, 2, 1, css('#8a5a3a'));
      d.rect(s.x + 5, s.y - 3, 2, 3, css('#f6f1e6'));
    },
    bounds: (s) => ({ x: s.x - 5, y: s.y - 3, w: 12, h: 5 }),
  }));
  puddle.layer = 0;
  puddle.hidden = true;
  const clumsy = who({ skin: 'fair', hair: 'brown', style: 'bun', top: 'sky', topKind: 'coat', bottom: 'black', item: 'cup' }, 206, 304, 'stand');
  clumsy.hidden = true;
  const barista = who({ skin: 'olive', hair: 'black', style: 'cap', hat: 'teal', top: 'white', topKind: 'apron', extra: 'teal', bottom: 'black', item: 'mop' }, 206, 304, 'stand');
  barista.hidden = true;
  barista.lines = ['I GOT IT, I GOT IT.', 'THIRD ONE TODAY.'];
  const v = every(game, 30, 4, () => {
    clumsy.hidden = false; clumsy.x = 206; clumsy.y = 304;
    clumsy.look = { ...clumsy.look, item: 'cup' };
    clumsy.run([
      { kind: 'walk', x: 206, y, speed: 14 },
      { kind: 'walk', x: 374, y, speed: 16 },
      { kind: 'hop', h: 3 },
      { kind: 'do', fn: (p, c) => { puddle.hidden = false; p.look = { ...p.look, item: 'none' }; c.fx.burst(380, y, ['#8a5a3a', '#6a4028', '#f6f1e6'], 10, 30, 160, 0.6); } },
      { kind: 'say', text: 'NOOOO.', t: 1.6, tone: 'shout' },
      { kind: 'pose', pose: 'crouch', t: 1.2 },
      { kind: 'walk', x: 206, y, speed: 14 },
      { kind: 'walk', x: 206, y: 304, speed: 14 },
      { kind: 'do', fn: (p) => { p.hidden = true; } },
    ]);
    barista.hidden = true;
    barista.x = 206; barista.y = 304;
    barista.run([
      wait(12),
      { kind: 'do', fn: (p) => { p.hidden = false; } },
      { kind: 'walk', x: 206, y: 318, speed: 14 },
      { kind: 'walk', x: 370, y: 324, speed: 18 },
      { kind: 'pose', pose: 'side', t: 0.4 },
      { kind: 'say', text: 'SWISH SWISH', t: 1.4 },
      { kind: 'pose', pose: 'crouch', t: 1.6 },
      { kind: 'do', fn: () => { puddle.hidden = true; } },
      { kind: 'walk', x: 206, y: 318, speed: 16 },
      { kind: 'walk', x: 206, y: 304, speed: 14 },
      { kind: 'do', fn: (p) => { p.hidden = true; } },
    ]);
  });
  // a passer-by who has to step around the mess when it's there
  const passer = who({ skin: 'deep', hair: 'black', style: 'short', top: 'grey', topKind: 'coat', bottom: 'navy', item: 'bag', extra: 'brown', glasses: true }, 470, y, 'side');
  const loop = () => {
    passer.run([
      { kind: 'walk', x: 392, y, speed: 15 },
      { kind: 'do', fn: (p, c) => {
        if (!puddle.hidden) {
          p.run([{ kind: 'say', text: 'EW.', t: 1 }, { kind: 'walk', x: 384, y: y - 7, speed: 12 }, { kind: 'walk', x: 372, y: y - 7, speed: 12 }, { kind: 'walk', x: 364, y, speed: 12 }]);
        } else p.run([{ kind: 'walk', x: 364, y, speed: 15 }]);
        void c;
      } },
      wait(0.01),
    ]);
    passer.run([
      { kind: 'do', fn: (p) => p.run([{ kind: 'walk', x: 300, y, speed: 15 }, wait(2), { kind: 'walk', x: 470, y, speed: 15 }, wait(2.5), { kind: 'do', fn: () => loop() }]) },
    ]);
  };
  loop();
  puddle.tap = (c) => c.bubbles.say(puddle.x, puddle.y - 4, 'SPLAT.', 1);
  clumsy.tap = (c) => clumsy.say(c, 'DON\'T LOOK AT ME.', 1.6);
  const door = game.add(new Custom(206, 302, { draw: () => {}, bounds: () => ({ x: 198, y: 270, w: 16, h: 32 }) }));
  door.layer = 0;
  door.label = 'The café door';
  door.tap = (c) => { if (!v.fire(c)) c.bubbles.say(206, 268, 'ONE OAT LATTE!', 1.4); };
}

function cafeDog(game: Game, who: Who) {
  const d = game.add(new Critter((f, i) => dog('dachshund', 0, true), 284, 320, 9));
  game.add(new Custom(276, 322, { draw: (s, dd) => { dd.rect(s.x, s.y - 2, 5, 2, css('#3a7ad0')); dd.rect(s.x + 1, s.y - 2, 3, 1, css('#73afd0')); }, bounds: (s) => ({ x: s.x, y: s.y - 2, w: 5, h: 2 }) })).layer = 0;
  d.tap = (c) => { c.bubbles.say(d.x, d.y - 10, 'WOOF?', 1); setTimeout(() => c.bubbles.say(264, 302, 'HE\'S WAITING FOR ME.', 1.6), 700); };
  void who;
}

/** A line forms because something is on: tickets for the scary one. */
function cinemaQueue(game: Game, who: Who) {
  const R = rng(55);
  const lines = [['IS IT SCARY?'], ['I HEARD IT\'S LONG.'], ['SAVE ME A SEAT.'], ['TWO FOR BOO, PLEASE.'], ['WE\'VE BEEN HERE AN HOUR.']];
  [[608, 319], [619, 320], [630, 321], [641, 320], [652, 321]].forEach(([x, y], i) => {
    const p = who(randomLook(R), x, y, i === 0 ? 'back' : 'side', true, lines[i]);
    p.idle = [[p.pose, 2 + i], [i === 0 ? 'back' : 'stand', 1.4, true]];
  });
}

/** A kid on a scooter weaves down the park-side sidewalk; people hop out of the way. */
function scooter(game: Game, who: Who) {
  const kid = who({ skin: 'brown', hair: 'black', style: 'cap', hat: 'red', top: 'orange', bottom: 'denim', kid: true }, -20, 431, 'side');
  const ducked = new Set<Entity>();
  let t = 0;
  kid.update = function (c: Ctx, dt: number) {
    if (c.reduced) { this.x = 860; this.pose = 'side'; return; }
    t += dt;
    if (t < 9) { this.hidden = true; return; }
    this.hidden = false;
    this.x += 62 * dt;
    this.pose = 'side';
    this.z = Math.floor(t * 8) % 4 === 0 ? 1 : 0;
    if (Math.random() < 0.02) this.say(c, 'BEEP BEEP!', 0.8);
    for (const e of game.entities) {
      if (!(e instanceof Person) || e === this || ducked.has(e)) continue;
      if (Math.abs(e.y - this.y) < 9 && e.x - this.x > 0 && e.x - this.x < 12) {
        ducked.add(e);
        e.hop(4);
        if (Math.random() < 0.5) e.say(c, ['WHOA!', 'HEY!', 'SLOW DOWN!'][Math.floor(Math.random() * 3)], 1);
      }
    }
    if (this.x > WORLD_W + 20) { this.x = -20; t = 0; ducked.clear(); }
  };
  game.worldOverlays.push((d) => {
    if (kid.hidden) return;
    d.rect(kid.x - 5, kid.y, 9, 1, css('#3a7ad0'));
    d.rect(kid.x + 3, kid.y - 9, 1, 9, css('#5a5e68'));
    d.rect(kid.x + 2, kid.y - 9, 3, 1, css('#5a5e68'));
    d.rect(kid.x - 5, kid.y + 1, 2, 1, css('#1e1c22')); d.rect(kid.x + 3, kid.y + 1, 2, 1, css('#1e1c22'));
  });
}

// ---- the park ------------------------------------------------------------------

/** An autumn market: cider with a line that moves, pumpkins, flowers. */
function market(game: Game, bm: Bitmap, who: Who, prop: VignetteApi['prop']) {
  // trampled grass where the stalls stand
  bm.ellipse(866, 772, 78, 20, (x, y) => (noise2(x, y, 71) < 0.55 ? mix(bm.get(x, y), P.path[2], 0.55) : undefined));
  const stalls: [number, string, string, string[], string][] = [
    [820, '#c83a32', '#f2e6cc', ['#c83a32', '#7ab048', '#e0402e', '#d8a43a'], 'HOT CIDER!'],
    [868, '#e07a26', '#f2e6cc', ['#e07a26', '#c8601e', '#f2b43a', '#7a8a3a'], 'GOURDS! GOURDS!'],
    [916, '#3f8a56', '#f2e6cc', ['#e05a7a', '#f2d03a', '#f6f1e6', '#c45a86'], 'FRESH FLOWERS!'],
  ];
  const vendors: Person[] = [];
  const vlooks: Look[] = [
    { skin: 'light', hair: 'grey', style: 'beanie', hat: 'green', top: 'red', topKind: 'apron', extra: 'tan', bottom: 'denim', beard: true },
    { skin: 'deep', hair: 'black', style: 'scarf', hat: 'orange', top: 'olive', topKind: 'apron', extra: 'khaki', bottom: 'brown' },
    { skin: 'fair', hair: 'blonde', style: 'bun', top: 'sky', topKind: 'apron', extra: 'pink', bottom: 'denim' },
  ];
  stalls.forEach(([x, a, b, goods, shout], i) => {
    const v = who(vlooks[i], x + 19, 766, 'stand', true, [shout, 'CASH OR CARD!']);
    vendors.push(v);
    const s = prop(props.marketStall(hex(a), hex(b), goods.map(hex), hex(a)), x, 762, 30);
    s.tap = (c) => v.tap?.(c);
    s.label = i === 0 ? 'The cider stall at the market' : undefined;
  });
  // the cider line: the front person gets a cup and goes, someone new joins
  const R = rng(77);
  const slots: [number, number][] = [[822, 778], [810, 781], [798, 783], [786, 786], [774, 788]];
  const queue: Person[] = slots.map(([x, y], i) => who(randomLook(R), x, y, i === 0 ? 'back' : 'side', false, ['WORTH THE WAIT.', 'IS IT SPIKED?', 'I\'M NEXT.', 'NICE DAY FOR IT.', 'IT\'S SO GOOD.'].slice(i, i + 1)));
  every(game, 7, 3, (c) => {
    const front = queue.shift()!;
    vendors[0].say(c, 'NEXT!', 1);
    front.look = { ...front.look, item: 'cup' };
    const out: [number, number] = [740 + Math.random() * 20, 820];
    front.run([
      { kind: 'pose', pose: 'stand', t: 0.6 },
      { kind: 'walk', x: 840, y: 792, speed: 14 },
      { kind: 'say', text: Math.random() < 0.5 ? 'MMM.' : 'HOT HOT HOT', t: 1.2 },
      { kind: 'walk', x: out[0], y: out[1], speed: 13 },
      wait(2),
      { kind: 'do', fn: (p) => { p.look = { ...p.look, item: 'none' }; } },
      { kind: 'walk', x: 760, y: 792, speed: 13 },
      { kind: 'walk', x: slots[slots.length - 1][0], y: slots[slots.length - 1][1], speed: 13 },
      { kind: 'pose', pose: 'side', t: 0.1, flip: false },
    ]);
    queue.forEach((p, i) => p.run([{ kind: 'walk', x: slots[i][0], y: slots[i][1], speed: 10 }, { kind: 'pose', pose: i === 0 ? 'back' : 'side', t: 0.1, flip: false }]));
    queue.push(front);
  });
  // a kid trying to lift the biggest pumpkin
  const pk = prop(props.pumpkin(true), 884, 784);
  const kid = who({ skin: 'olive', hair: 'auburn', style: 'curly', top: 'green', bottom: 'denim', kid: true }, 876, 786, 'crouch', false);
  kid.idle = [['crouch', 1.4], ['cheer', 0.4], ['crouch', 2]];
  const parent = who({ skin: 'olive', hair: 'black', style: 'short', top: 'navy', topKind: 'coat', bottom: 'khaki', beard: true }, 896, 788, 'stand', true, ['WE\'RE NOT GETTING THAT ONE.']);
  kid.lines = ['HNNNG!', 'THIS ONE!'];
  pk.tap = (c) => { kid.hop(3); kid.say(c, 'HNNNG!', 1); setTimeout(() => parent.say(c, 'PUT IT DOWN, BUD.', 1.6), 900); };
  // someone leaving with flowers
  who({ skin: 'brown', hair: 'brown', style: 'long', top: 'plum', topKind: 'coat', bottom: 'black', item: 'flowers' }, 930, 784, 'stand', true, ['FOR MY MOM.', 'FOR ME, ACTUALLY.']);
}

/** Chess tables: a pigeon lands on a board mid-game. And a kid with a cube and a timer. */
function chess(game: Game, who: Who, prop: VignetteApi['prop']) {
  prop(props.chessTable(), 498, 610, 14);
  prop(props.chessTable(), 548, 628, 14);
  const a = who({ skin: 'deep', hair: 'grey', style: 'cap', hat: 'navy', top: 'brown', topKind: 'coat', bottom: 'grey', beard: true }, 487, 610, 'sitSide', false, ['YOUR MOVE.', 'I\'VE PLAYED HERE SINCE 1979.']);
  const b = who({ skin: 'fair', hair: 'brown', style: 'short', top: 'teal', bottom: 'denim', glasses: true }, 509, 610, 'sitSide', true, ['HMM.', 'HMMMM.']);
  a.seated = b.seated = true;
  const watchers = [who({ skin: 'olive', hair: 'black', style: 'bald', top: 'tan', topKind: 'coat', bottom: 'brown' }, 500, 600, 'stand', false, ['DON\'T DO IT.']), who({ skin: 'light', hair: 'auburn', style: 'bob', top: 'pink', bottom: 'denim' }, 488, 598, 'stand', true, ['SHH.'])];
  let bird: { t: number } | null = null;
  const v = every(game, 24, 10, (c) => {
    bird = { t: 0 };
    setTimeout(() => { c.fx.add({ x: 500, y: 605, vx: 18, vy: -20, g: 120, life: 0.8, color: css('#f6f1e6'), floor: 612 }); a.hop(4); a.say(c, 'MY KNIGHT!', 1.6, 'shout'); }, 1500);
    setTimeout(() => { watchers[0].say(c, 'HA!', 1.2); watchers[1].hop(2); }, 2300);
    setTimeout(() => b.say(c, 'DOES THAT COUNT?', 1.6), 3400);
  });
  game.add(new Custom(498, 604, {
    update: (_s, _c, dt) => { if (bird) { bird.t += dt; if (bird.t > 4.5) bird = null; } },
    draw: (_s, d, c) => {
      if (!bird) return;
      const t = bird.t;
      const k = t < 1.2 ? 1 - t / 1.2 : t > 3.2 ? (t - 3.2) / 1.3 : 0;
      const x = 498 + k * 40, y = 604 - k * 30;
      d.sprite(pigeon(k > 0 ? (Math.floor(c.t * 12) % 2 ? 'fly0' : 'fly1') : t > 1.4 && t < 1.8 ? 'peck' : 'stand', k > 0 && t < 2), x, y);
    },
    bounds: () => ({ x: 486, y: 592, w: 24, h: 18 }),
  })).layer = 2;
  const tableTap = (c: Ctx) => { if (!v.fire(c)) a.say(c, 'CHECK.', 1.2); };
  a.tap = tableTap; b.tap = tableTap;
  // the speedcuber at the second table
  const cuber = who({ skin: 'brown', hair: 'black', style: 'swoop', top: 'red', bottom: 'denim', item: 'cube', kid: true }, 548, 622, 'stand', false);
  cuber.bias = 1;
  const fans = [who({ skin: 'fair', hair: 'blonde', style: 'ponytail', top: 'purple', bottom: 'denim', kid: true }, 538, 634, 'back'), who({ skin: 'deep', hair: 'black', style: 'curly', top: 'lemon', bottom: 'navy', kid: true }, 560, 634, 'back')];
  const solve = every(game, 16, 6, (c) => {
    cuber.say(c, 'GO!', 0.8);
    let k = 0;
    const tick = () => { k++; cuber.pose = k % 2 ? 'stand' : 'wave1'; if (k < 10) setTimeout(tick, 150); else { cuber.pose = 'cheer'; cuber.hop(4); const tm = (8 + Math.random() * 6).toFixed(1); cuber.say(c, tm + ' SECONDS!', 1.8, 'shout'); fans.forEach((f, i) => setTimeout(() => { f.hop(3); f.pose = 'cheer'; }, 200 + i * 150)); setTimeout(() => { cuber.pose = 'stand'; fans.forEach((f) => (f.pose = 'back')); }, 2200); } };
    tick();
  });
  cuber.tap = (c) => { if (!solve.fire(c)) cuber.say(c, 'ONE SEC.', 0.8); };
  cuber.label = 'A kid speed-solving a cube at the chess tables';
}

/** A kid lets go of a balloon; they point, people look up, the vendor sorts it out. */
function balloon(game: Game, who: Who) {
  const vx = 566, vy = 572;
  const colours = ['#e0402e', '#f2d03a', '#3a7ad0', '#3f9a56', '#c45a86', '#f08a2a'];
  const vendor = who({ skin: 'light', hair: 'white', style: 'cap', hat: 'red', top: 'red', topKind: 'coat', bottom: 'navy', beard: true }, vx, vy, 'stand', false, ['BALLOONS! A DOLLAR!', 'HOLD ON TIGHT.']);
  const kid = who({ skin: 'deep', hair: 'black', style: 'bun', top: 'sky', bottom: 'denim', kid: true }, 584, 580, 'stand', true);
  const mum = who({ skin: 'deep', hair: 'black', style: 'long', top: 'coral', topKind: 'coat', bottom: 'black', item: 'bag', extra: 'tan' }, 596, 578, 'stand', true, ['IT HAPPENS EVERY TIME.']);
  const onlookers = [who({ skin: 'fair', hair: 'brown', style: 'short', top: 'olive', bottom: 'khaki' }, 606, 590, 'stand'), who({ skin: 'olive', hair: 'grey', style: 'bun', top: 'purple', topKind: 'coat', bottom: 'grey' }, 576, 596, 'side', true)];
  let held = true;
  let away: { x: number; y: number; t: number } | null = null;
  const bunch = colours.map((c, i) => ({ c, dx: -6 + i * 2.5, dy: -24 - (i % 3) * 4 }));
  const v = every(game, 26, 14, (c) => {
    held = false;
    away = { x: kid.x + 2, y: kid.y - 18, t: 0 };
    kid.hop(3);
    kid.say(c, 'MY BALLOON!', 1.8, 'shout');
    setTimeout(() => { kid.pose = 'wave1'; onlookers.forEach((o, i) => setTimeout(() => { o.pose = 'back'; if (i === 0) o.say(c, 'OH NO.', 1.2); }, 300 + i * 250)); mum.pose = 'back'; }, 600);
    setTimeout(() => vendor.run([{ kind: 'walk', x: kid.x - 8, y: kid.y, speed: 16 }, { kind: 'say', text: 'HERE YOU GO.', t: 1.4 }, { kind: 'do', fn: () => { held = true; kid.pose = 'cheer'; kid.hop(4); } }, wait(1.2), { kind: 'walk', x: vx, y: vy, speed: 16 }, { kind: 'pose', pose: 'stand', t: 0.1, flip: false }]), 4200);
    setTimeout(() => { kid.pose = 'stand'; mum.pose = 'stand'; onlookers[0].pose = 'stand'; onlookers[1].pose = 'side'; }, 7600);
  });
  game.add(new Custom(vx, vy, {
    update: (_s, c, dt) => { if (away) { away.t += dt; away.y -= 16 * dt; away.x += (6 + Math.sin(away.t) * 4) * dt; if (away.y < -20) away = null; } void c; },
    draw: (_s, d, c) => {
      const bob = (i: number) => Math.round(Math.sin(c.t * 1.5 + i) * 1);
      // the vendor's bunch
      for (const [i, b] of bunch.entries()) {
        const bx = vendor.x + b.dx, by = vendor.y + b.dy + bob(i);
        d.line(vendor.x + 3, vendor.y - 8, bx + 1, by + 4, 'rgba(246,241,230,0.7)');
        balloonAt(d, bx, by, b.c);
      }
      if (held) {
        const bx = kid.x + 3, by = kid.y - 22 + bob(9);
        d.line(kid.x + 3, kid.y - 6, bx + 1, by + 4, 'rgba(246,241,230,0.7)');
        balloonAt(d, bx, by, '#c45a86');
      }
      if (away) { d.line(away.x + 1, away.y + 4, away.x + 2 + Math.sin(away.t * 3) * 2, away.y + 12, 'rgba(246,241,230,0.6)'); balloonAt(d, away.x, away.y, '#c45a86'); }
    },
    bounds: () => ({ x: vx - 10, y: vy - 34, w: 22, h: 34 }),
  })).layer = 2;
  const tap = (c: Ctx) => { if (!v.fire(c)) kid.say(c, 'I HAVE A BALLOON.', 1.2); };
  kid.tap = tap;
  kid.label = 'A kid holding a balloon, for now';
  vendor.tap = (c) => vendor.say(c, 'BALLOONS! A DOLLAR!', 1.4);
}

function balloonAt(d: import('../engine/draw').WorldDraw, x: number, y: number, c: string) {
  d.rect(x, y, 3, 4, c);
  d.rect(x - 1, y + 1, 5, 2, c);
  d.rect(x, y, 1, 1, 'rgba(255,255,255,0.75)');
  d.rect(x + 1, y + 4, 1, 1, c);
}

/** A yoga class in sync, except one beginner who's always a beat behind (and sometimes falls over). */
function yoga(game: Game, bm: Bitmap, who: Who) {
  const mats = ['#c45a86', '#3a7ad0', '#3f8a56', '#f2b43a', '#7a5aa0', '#e07a26'];
  const spots: [number, number][] = [[850, 652], [872, 652], [894, 652], [916, 652], [861, 668], [883, 668]];
  spots.forEach(([x, y], i) => { bm.rect(x - 5, y - 3, 11, 5, hex(mats[i])); bm.hline(x - 5, y - 3, 11, mix(hex(mats[i]), P.white, 0.3)); bm.hline(x - 5, y + 2, 11, shadow(hex(mats[i]), 0.5)); });
  const R = rng(91);
  const people = spots.map(([x, y], i) => who({ ...randomLook(R), item: 'none', topKind: 'tee', bottom: 'black' }, x, y, 'stand', false, ['BREATHE IN.', 'MY HAMSTRINGS.', 'NAMASTE.']));
  const beginner = people[5];
  beginner.lines = ['WAIT, WHICH ONE?', 'I\'M FINE!'];
  const teacher = who({ skin: 'brown', hair: 'black', style: 'bun', top: 'teal', topKind: 'tee', bottom: 'black' }, 872, 636, 'stand', false, ['AND... TREE POSE.', 'FIND YOUR CENTRE.']);
  bm.rect(866, 633, 13, 5, hex('#e0402e'));
  const seq: Pose[] = ['stand', 'cheer', 'crouch', 'cheer'];
  let t = 0, cycle = 0;
  game.add(new Custom(0, 0, {
    update: (_s, c, dt) => {
      if (c.reduced) return;
      t += dt;
      const step = Math.floor(t / 2.2);
      const lagStep = Math.floor((t - 0.9) / 2.2);
      teacher.pose = seq[step % 4];
      if (step % 4 === 2) { teacher.flip = false; }
      people.forEach((p) => { if (p !== beginner && !p.script.length) p.pose = seq[step % 4]; });
      if (!beginner.script.length) beginner.pose = seq[((lagStep % 4) + 4) % 4];
      if (step !== cycle) {
        cycle = step;
        if (step % 4 === 0) teacher.say(c, ['BREATHE IN...', 'AND OUT.', 'REACH UP.'][Math.floor(step / 4) % 3], 1.4);
        // every third round the beginner topples, and a neighbour helps
        if (step % 12 === 7) {
          beginner.run([{ kind: 'hop', h: 3 }, { kind: 'pose', pose: 'sitSide', t: 1.6 }, { kind: 'say', text: 'OOF.', t: 1.2 }, wait(0.6)]);
          setTimeout(() => people[4].say(c, 'YOU OK?', 1.2), 900);
        }
      }
    },
    draw: () => {}, bounds: () => ({ x: 0, y: 0, w: 0, h: 0 }),
  })).layer = 0;
  teacher.label = 'A yoga class on the lawn';
}

/** A trio by the pond, a small crowd, a toddler who dances like nobody's watching. */
function jazz(game: Game, who: Who, prop: VignetteApi['prop']) {
  const band: Person[] = [
    who({ skin: 'deep', hair: 'grey', style: 'cap', hat: 'charcoal', top: 'charcoal', topKind: 'coat', bottom: 'black', item: 'sax', beard: true }, 394, 838),
    who({ skin: 'light', hair: 'dark', style: 'short', top: 'plum', bottom: 'black', item: 'trumpet', glasses: true }, 408, 836),
    who({ skin: 'olive', hair: 'black', style: 'long', top: 'olive', bottom: 'denim', item: 'guitar' }, 422, 838),
  ];
  band[0].lines = ['TAKE IT, MILES.', 'ONE MORE TIME.'];
  band[1].lines = ['THAT WAS A WRONG NOTE.', 'ON PURPOSE.'];
  band[2].lines = ['WE TAKE REQUESTS.', 'NOT THAT ONE.'];
  prop(props.musicStand(), 380, 840);
  prop(props.guitarCase(), 410, 846);
  const R = rng(31);
  const crowd = [[396, 856], [412, 858], [428, 856], [440, 850]].map(([x, y]) => who(randomLook(R), x, y, 'back', false, ['GOOD STUFF.', 'IS THIS JAZZ?', 'BRAVO!']));
  const toddler = who({ skin: 'brown', hair: 'brown', style: 'curly', top: 'lemon', bottom: 'denim', kid: true }, 404, 850, 'cheer', false, ['WHEE!', '♪']);
  const couple = [who({ skin: 'fair', hair: 'white', style: 'bun', top: 'pink', topKind: 'coat', bottom: 'grey' }, 444, 838, 'wave0'), who({ skin: 'fair', hair: 'white', style: 'bald', top: 'navy', topKind: 'coat', bottom: 'grey' }, 452, 838, 'wave0', true)];
  couple[0].lines = ['WE MET DANCING.', '1968.'];
  let t = 0;
  const notes = ['♪', '♫'];
  game.add(new Custom(408, 836, {
    update: (_s, c, dt) => {
      if (c.reduced) return;
      t += dt;
      const beat = Math.floor(t * 2.6);
      band.forEach((b, i) => { b.z = (beat + i) % 2 ? 1 : 0; });
      toddler.pose = beat % 4 < 2 ? 'cheer' : 'stand';
      toddler.flip = beat % 8 < 4;
      couple[0].pose = beat % 2 ? 'wave0' : 'wave1';
      couple[1].pose = beat % 2 ? 'wave1' : 'wave0';
      if (Math.random() < dt * 0.9) c.fx.add({ x: 394 + Math.random() * 30, y: 818, vy: -9, vx: 3, life: 1.8, color: css('#2a2430'), wobble: 4 });
    },
    draw: () => {}, bounds: () => ({ x: 0, y: 0, w: 0, h: 0 }),
  })).layer = 0;
  const bandTap = (c: Ctx) => {
    c.bubbles.say(408, 816, notes[Math.floor(Math.random() * 2)] + ' ONE MORE TIME! ' + notes[0], 1.6);
    crowd.forEach((p, i) => setTimeout(() => { p.hop(3); if (i === 1) p.say(c, 'ENCORE!', 1.2); }, 300 + i * 120));
  };
  band.forEach((b) => (b.tap = bandTap));
  band[0].label = 'A jazz trio by the pond';
}

/** A dog drags its person straight through a picnic and makes off with a sandwich. */
function picnicDog(game: Game, bm: Bitmap, who: Who) {
  const bx = 1096, by = 766;
  blanket(bm, bx, by, 30, 14, hex('#3f8a56'));
  game.add(new Prop(props.picnicBasket(), bx + 24, by + 6));
  const sandwich = game.add(new Custom(bx + 14, by + 8, {
    draw: (s, d) => { d.rect(s.x, s.y - 2, 4, 1, css('#d9a660')); d.rect(s.x, s.y - 1, 4, 1, css('#7ab048')); d.rect(s.x, s.y, 4, 1, css('#d9a660')); },
    bounds: (s) => ({ x: s.x, y: s.y - 2, w: 4, h: 3 }),
  }));
  sandwich.layer = 0;
  const R = rng(13);
  const eaters = [who(randomLook(R), bx + 6, by + 7, 'sit', false), who(randomLook(R), bx + 18, by + 4, 'sitSide', true), who({ skin: 'olive', hair: 'black', style: 'curly', top: 'red', bottom: 'denim', kid: true }, bx + 10, by + 13, 'sit', false)];
  eaters.forEach((e) => { e.seated = true; e.lines = ['LOVELY PICNIC.', 'PASS THE GRAPES.']; });
  const owner = who({ skin: 'fair', hair: 'auburn', style: 'ponytail', top: 'navy', topKind: 'coat', bottom: 'black', item: 'leash' }, 1060, 808, 'side');
  const pup = game.add(new Critter((f, i, m) => dog('lab', m ? i : 0, f), 1072, 809, 10));
  pup.tap = (c) => c.bubbles.say(pup.x, pup.y - 12, 'WOOF!', 1);
  let mode: 'walk' | 'dash' | 'steal' | 'flee' | 'back' = 'walk';
  let dir = 1, t = 0, carry = false;
  const tAt = (x: number) => 1060 + x;
  const v = every(game, 24, 12, (c) => {
    if (mode !== 'walk') return;
    mode = 'dash'; t = 0;
    c.bubbles.say(pup.x, pup.y - 14, '!', 0.8, 'shout');
    owner.say(c, 'BISCUIT, NO!', 1.4, 'shout');
  });
  game.add(new Custom(0, 0, {
    update: (_s, c, dt) => {
      if (c.reduced) return;
      t += dt;
      pup.moving = true;
      const toward = (e: { x: number; y: number }, tx: number, ty: number, sp: number) => {
        const dx = tx - e.x, dy = ty - e.y, dist = Math.hypot(dx, dy);
        if (dist < sp * dt) { e.x = tx; e.y = ty; return true; }
        e.x += (dx / dist) * sp * dt; e.y += (dy / dist) * sp * dt; return false;
      };
      if (mode === 'walk') {
        if (toward(pup, dir > 0 ? tAt(110) : tAt(0), 809, 14)) dir *= -1;
        pup.flip = dir < 0;
        owner.stepToward(pup.x - dir * 14, 808, 16 * dt * 1.2);
      } else if (mode === 'dash') {
        pup.flip = pup.x > bx + 14;
        const arrived = toward(pup, bx + 16, by + 10, 70);
        owner.stepToward(pup.x - 12, pup.y + 4, 60 * dt);
        if (arrived) {
          mode = 'steal'; t = 0; sandwich.hidden = true; carry = true;
          eaters.forEach((e, i) => setTimeout(() => { e.hop(5); if (i === 0) e.say(c, 'MY SANDWICH!', 1.6, 'shout'); if (i === 2) e.say(c, 'DOGGY!', 1.2); }, i * 120));
        }
      } else if (mode === 'steal') {
        if (t > 0.6) { mode = 'flee'; t = 0; }
      } else if (mode === 'flee') {
        const a = t * 2.4;
        const tx = bx + 15 + Math.cos(a) * 34, ty = by + 22 + Math.sin(a) * 12;
        pup.flip = -Math.sin(a) < 0;
        toward(pup, tx, ty, 80);
        owner.stepToward(pup.x - 10, pup.y + 2, 46 * dt);
        if (t > 0.3 && t < 0.35) owner.say(c, 'SORRY! SORRY!', 1.6);
        if (t > 4) { mode = 'back'; t = 0; }
      } else if (mode === 'back') {
        if (t < 0.05) { carry = false; owner.say(c, 'I\'LL BUY YOU A NEW ONE.', 1.8); }
        if (toward(pup, tAt(40), 809, 24) && t > 1) { mode = 'walk'; dir = 1; }
        owner.stepToward(pup.x - 12, 808, 24 * dt);
        if (t > 9) sandwich.hidden = false;
      }
      if (mode === 'walk' && sandwich.hidden && t > 2) sandwich.hidden = false;
    },
    draw: () => {}, bounds: () => ({ x: 0, y: 0, w: 0, h: 0 }),
  })).layer = 0;
  game.worldOverlays.push((d) => {
    leash(d, owner.x + (owner.flip ? -3 : 3), owner.y - 6, pup.x + (pup.flip ? -5 : 5), pup.y - 6, '#2e5aa8');
    if (carry) { const mx = pup.x + (pup.flip ? -8 : 7); d.rect(mx, pup.y - 6, 3, 1, css('#d9a660')); d.rect(mx, pup.y - 5, 3, 1, css('#7ab048')); }
  });
  const tap = (c: Ctx) => { if (!v.fire(c)) owner.say(c, 'HE\'S USUALLY SO GOOD.', 1.4); };
  owner.tap = tap;
  owner.label = 'Someone walking a dog that has noticed a picnic';
  eaters[0].tap = tap;
}

/** A pigeon steals a fry and gets chased, briefly, in a small circle. */
function friesThief(game: Game, who: Who) {
  const eater = who({ skin: 'brown', hair: 'black', style: 'beanie', hat: 'green', top: 'charcoal', topKind: 'coat', bottom: 'denim', item: 'fries' }, 296, 689, 'sit', false, ['THEY KNOW.', 'MY FRIES.']);
  eater.bias = 2;
  let b: { x: number; y: number; t: number; fry: boolean } | null = null;
  const v = every(game, 20, 8, (c) => {
    b = { x: 336, y: 696, t: 0, fry: false };
    setTimeout(() => {
      if (!b) return;
      b.fry = true;
      eater.hop(3);
      eater.say(c, 'HEY! MY FRY!', 1.6, 'shout');
      eater.run([{ kind: 'walk', x: 316, y: 700, speed: 26, run: true }, { kind: 'walk', x: 300, y: 708, speed: 26 }, { kind: 'say', text: '...FINE.', t: 1.4 }, { kind: 'walk', x: 296, y: 689, speed: 14 }, { kind: 'pose', pose: 'sit', t: 0.1, flip: false }]);
    }, 2300);
  });
  eater.update = function (c: Ctx, dt: number) { Person.prototype.update.call(this, c, dt); this.seated = !this.script.length; };
  game.add(new Custom(300, 690, {
    update: (_s, c, dt) => {
      if (!b) return;
      b.t += dt;
      if (b.t < 2) { b.x += (302 - b.x) * Math.min(1, dt * 1.6); b.y += (692 - b.y) * Math.min(1, dt * 1.6); }
      else if (b.t < 6) { const a = (b.t - 2) * 3; b.x = 312 + Math.cos(a) * 14; b.y = 702 + Math.sin(a) * 5; }
      else { b.x += 40 * dt; b.y -= 30 * dt; }
      if (b.t > 8) b = null;
      void c;
    },
    draw: (_s, d, c) => {
      if (!b) return;
      const flying = b.t > 6;
      d.sprite(pigeon(flying ? (Math.floor(c.t * 12) % 2 ? 'fly0' : 'fly1') : b.t > 1.8 && b.t < 2.2 ? 'peck' : 'stand', b.t < 2 || flying ? false : Math.cos((b.t - 2) * 3) > 0), b.x, b.y);
      if (b.fry) d.rect(b.x + 3, b.y - 3, 3, 1, css('#f2d03a'));
    },
    bounds: () => ({ x: 0, y: 0, w: 0, h: 0 }),
  })).layer = 1;
  eater.tap = (c) => { if (!v.fire(c)) eater.say(c, 'GET YOUR OWN.', 1.2); };
}

/** A tower of blocks in the playground, and the toddler who will knock it down. */
function blockTower(game: Game, who: Who) {
  const x = 150, y = 612;
  const builder = who({ skin: 'fair', hair: 'blonde', style: 'short', top: 'green', bottom: 'denim', kid: true }, x - 10, y, 'crouch', false, ['DON\'T TOUCH IT.', 'IT\'S A SKYSCRAPER.']);
  const toddler = who({ skin: 'brown', hair: 'black', style: 'curly', top: 'pink', bottom: 'denim', kid: true }, x + 30, y + 14, 'stand', true);
  const dad = who({ skin: 'fair', hair: 'brown', style: 'short', top: 'olive', topKind: 'coat', bottom: 'khaki', beard: true, item: 'cup' }, x + 22, y - 8, 'stand', true, ['GENTLE HANDS!']);
  let height = 2;
  const cols = ['#e0402e', '#3a7ad0', '#f2d03a', '#3f9a56', '#f08a2a', '#c45a86', '#7ab0d0'];
  let t = 0;
  const v = every(game, 18, 9, (c) => {
    toddler.run([
      { kind: 'walk', x: x + 6, y: y + 2, speed: 9 },
      { kind: 'pose', pose: 'cheer', t: 0.4 },
      { kind: 'do', fn: () => { c.fx.burst(x + 2, y - height * 3, cols.slice(0, height).map(css), height, 40, 160, 1.2); height = 0; } },
      { kind: 'say', text: 'BOOM!', t: 1.2, tone: 'shout' },
      wait(0.4),
    ]);
    setTimeout(() => { builder.hop(4); builder.say(c, 'HEY!!', 1.4, 'shout'); }, 2600);
    setTimeout(() => dad.say(c, 'GENTLE HANDS!', 1.4), 3500);
    setTimeout(() => toddler.run([{ kind: 'walk', x: x + 30, y: y + 14, speed: 9 }, { kind: 'pose', pose: 'stand', t: 0.1, flip: true }]), 4400);
  });
  game.add(new Custom(x, y, {
    update: (_s, c, dt) => { t += dt; if (!c.reduced && t > 1.2 && height < 7) { t = 0; height++; } },
    draw: (_s, d) => { for (let i = 0; i < height; i++) { d.rect(x - 1 + (i % 2), y - 3 - i * 3, 4, 3, css(cols[i])); d.rect(x - 1 + (i % 2), y - 3 - i * 3, 4, 1, 'rgba(255,255,255,0.35)'); } },
    bounds: () => ({ x: x - 2, y: y - 24, w: 6, h: 24 }),
  }));
  builder.update = function (c: Ctx, dt: number) { Person.prototype.update.call(this, c, dt); };
  toddler.tap = (c) => { if (!v.fire(c)) toddler.say(c, 'BLOCK!', 1); };
  toddler.label = 'A toddler eyeing a tower of blocks';
}

function strollers(game: Game) {
  const routes: [number, number][][] = [
    [[20, 666], [260, 662], [400, 676], [520, 698], [640, 708], [760, 704]],
    [[1430, 718], [1260, 724], [1120, 716], [990, 698], [880, 694]],
  ];
  const looks: Look[] = [
    { skin: 'brown', hair: 'black', style: 'ponytail', top: 'teal', topKind: 'coat', bottom: 'black' },
    { skin: 'fair', hair: 'brown', style: 'beanie', hat: 'orange', top: 'grey', topKind: 'coat', bottom: 'denim', beard: true },
  ];
  const art = [propSprite(props.stroller(hex('#2e5aa8'))), propSprite(props.stroller(hex('#c45a86')))];
  routes.forEach((pts, i) => {
    const p = game.add(new Person(looks[i], pts[0][0], pts[0][1], 'side'));
    p.route = { pts, speed: 10, loop: false, pause: 3 };
    p.lines = ['FINALLY ASLEEP. SHH.', 'DON\'T WAKE HIM.'];
    p.extra = (d, q) => {
      const dir = q.flip ? -1 : 1;
      const s = art[i];
      if (dir > 0) d.ctx.drawImage(s.canvas, Math.round(q.x + 5), Math.round(q.y - s.ay));
      else { d.ctx.save(); d.ctx.translate(Math.round(q.x - 5), Math.round(q.y - s.ay)); d.ctx.scale(-1, 1); d.ctx.drawImage(s.canvas, 0, 0); d.ctx.restore(); }
    };
  });
}

/** A back-yard barbecue in the alley behind the greystone. */
function bbq(game: Game, who: Who, prop: VignetteApi['prop']) {
  prop(props.grill(), 858, 124);
  const chef = who({ skin: 'brown', hair: 'black', style: 'short', top: 'red', topKind: 'apron', extra: 'white', bottom: 'khaki', item: 'tongs', beard: true }, 848, 124, 'stand', false, ['WHO WANTS ONE?', 'MEDIUM RARE IS A LIFESTYLE.']);
  const R = rng(5);
  who(randomLook(R), 874, 122, 'stand', true, ['SMELLS GREAT.']);
  who(randomLook(R), 886, 126, 'stand', true, ['WE BROUGHT CHIPS.']);
  let t = 0;
  game.add(new Custom(858, 116, {
    update: (_s, c, dt) => {
      if (c.reduced) return;
      t += dt;
      if (Math.random() < dt * 3) c.fx.add({ x: 856 + Math.random() * 4, y: 116, vy: -8, vx: 4, life: 2, color: 'rgba(220,214,206,0.7)', wobble: 2 });
      chef.pose = Math.floor(t * 1.2) % 5 === 0 ? 'wave1' : 'stand';
    },
    draw: () => {}, bounds: () => ({ x: 0, y: 0, w: 0, h: 0 }),
  })).layer = 0;
}

function skater(game: Game) {
  const look: Look = { skin: 'olive', hair: 'black', style: 'beanie', hat: 'mustard', top: 'charcoal', topKind: 'tee', bottom: 'khaki' };
  const pts: [number, number][] = [[-20, 670], [120, 662], [260, 662], [400, 676], [520, 698], [640, 708], [760, 704], [880, 694], [990, 698], [1120, 716], [1260, 724], [1460, 718]];
  const p = game.add(new Person(look, pts[0][0], pts[0][1], 'side'));
  p.lines = ['NOT KUNAL! WRONG HAT.', 'SICK, RIGHT?'];
  p.route = { pts, speed: 48, loop: true, pause: 0 };
  p.update = function (c: Ctx, dt: number) {
    Person.prototype.update.call(this, c, dt);
    if (this.moving) this.pose = 'side';
    if (this.x > 1450) { this.x = -20; this.y = 670; }
  };
  p.extra = (d, q) => { d.rect(q.x - 5, q.y + 1, 10, 1, css('#c83a32')); d.rect(q.x - 4, q.y + 2, 2, 1, css('#1e1c22')); d.rect(q.x + 2, q.y + 2, 2, 1, css('#1e1c22')); };
}

/** More faces at windows: someone watering plants, someone on the phone pacing. */
function windowLife(game: Game) {
  const spots: [number, number, number, Look, Pose[]][] = [
    [12 + 6, 142 + 12, 12, { skin: 'brown', hair: 'black', style: 'curly', top: 'teal', bottom: 'teal' }, ['stand', 'wave1']],
    [1272 + 34 + 6, 134 + 44, 12, { skin: 'fair', hair: 'blonde', style: 'bun', top: 'coral', bottom: 'coral', item: 'phone' }, ['stand', 'side']],
    [962 + 50 + 7, 188 + 12, 14, { skin: 'olive', hair: 'grey', style: 'bald', top: 'green', bottom: 'green', glasses: true }, ['stand', 'stand', 'side']],
  ];
  for (const [x, y, w, look, poses] of spots) {
    const e = game.add(new Custom(x, y, {
      draw: (s, d, c) => {
        const pose = c.reduced ? poses[0] : poses[Math.floor(c.t / 2.5 + x) % poses.length];
        const spr = person(look, pose);
        d.ctx.drawImage(spr.canvas, 0, 0, spr.w, 11, Math.round(s.x - spr.ax), s.y + 3, spr.w, 11);
      },
      bounds: (s) => ({ x: s.x - w / 2, y: s.y, w, h: 20 }),
    }));
    e.layer = 2;
    e.tap = (c) => c.bubbles.say(x, y, ['HELLO?', 'CAN YOU HEAR ME NOW?', 'NICE DAY OUT THERE.'][Math.floor(Math.random() * 3)], 1.4);
  }
}

// ---- second batch: a story in every empty pocket ---------------------------

function moreLife(game: Game, bm: Bitmap, who: Who, prop: VignetteApi['prop']) {
  leafPile(game, who);
  garageBand(game, bm, who);
  bubbles(game, who);
  kickabout(game, who);
  wedding(game, who);
  bookClub(game, bm, who, prop);
  iceCreamLine(who);
  dogMeetup(game, who);
  birthday(game, bm, who, prop);
  toyBoat(game, who);
}

/** Someone rakes the greystone's leaves into a pile; a kid keeps jumping in it. */
function leafPile(game: Game, who: Who) {
  const px = 864, py = 309;
  const raker = who({ skin: 'olive', hair: 'grey', style: 'cap', hat: 'green', top: 'brown', topKind: 'coat', bottom: 'khaki', item: 'broom', beard: true }, 846, 313, 'stand', false, ['EVERY. SINGLE. TIME.', 'IT\'S FINE.']);
  const kid = who({ skin: 'brown', hair: 'black', style: 'beanie', hat: 'red', top: 'navy', topKind: 'coat', bottom: 'denim', kid: true }, 892, 314, 'stand', true, ['AGAIN!', 'CANNONBALL!']);
  let size = 1;
  const leaves = [P.leafOrange[2], P.leafOrange[3], P.leafGold[3], P.leafRed[3]].map(toCss);
  game.add(new Custom(px, py, {
    update: (_s, c, dt) => { if (!c.reduced && size < 1) size = Math.min(1, size + dt * 0.08); },
    draw: (s, d) => {
      const w = Math.round(6 + size * 16), h = Math.round(1 + size * 6);
      for (let j = 0; j < h; j++) {
        const half = Math.round(w * Math.sqrt(1 - (j / h) ** 2) / 2);
        for (let i = -half; i <= half; i++) d.rect(s.x + i, s.y - j, 1, 1, leaves[Math.abs(i * 7 + j * 3) % 4]);
      }
    },
    bounds: (s) => ({ x: s.x - 9, y: s.y - 6, w: 18, h: 7 }),
  })).layer = 1;
  raker.idle = [['stand', 0.5], ['wave1', 0.5]];
  const v = every(game, 19, 7, (c) => {
    kid.run([
      { kind: 'walk', x: 880, y: 312, speed: 20 },
      { kind: 'say', text: 'CANNONBALL!', t: 1, tone: 'shout' },
      { kind: 'hop', h: 8 },
      wait(0.3),
      { kind: 'do', fn: () => { size = 0.15; c.fx.burst(px, py - 3, leaves, 26, 55, 70, 2.4); } },
      { kind: 'pose', pose: 'sitSide', t: 1.2 },
      { kind: 'walk', x: 892, y: 314, speed: 14 },
      { kind: 'pose', pose: 'stand', t: 0.1, flip: true },
    ]);
    setTimeout(() => { raker.hop(2); raker.say(c, '...', 1.6, 'think'); }, 1900);
  });
  kid.tap = (c) => { if (!v.fire(c)) kid.say(c, 'AGAIN!', 0.8); };
  kid.label = 'A kid eyeing a pile of raked leaves';
}

/** The garage door's up and a band is practising inside. */
function garageBand(game: Game, bm: Bitmap, who: Who) {
  const gx = 748, gy = 70, gw = 36, gh = 22;
  bm.rect(gx, gy, gw, gh, hex('#2a2230'));
  bm.rect(gx, gy, gw, 3, hex('#8a5a3a'));
  bm.rect(gx + 2, gy + 6, 8, 3, hex('#e0b84a')); // a poster
  // drum kit
  bm.ellipse(gx + 26, gy + 16, 4, 2.5, hex('#c83a32')); bm.ellipse(gx + 26, gy + 15, 3, 1.5, P.white);
  bm.ellipse(gx + 32, gy + 12, 2, 1, hex('#e0b84a')); bm.vline(gx + 32, gy + 13, 6, P.metal[2]);
  // amp
  bm.rect(gx + 4, gy + 13, 6, 8, hex('#1a1620')); bm.rect(gx + 5, gy + 14, 4, 3, hex('#3a3440'));
  const R = rng(4);
  const drummer = who({ ...randomLook(R), item: 'none' }, gx + 24, gy + 18, 'stand');
  const guitarist = who({ skin: 'deep', hair: 'black', style: 'long', top: 'black', bottom: 'black', item: 'guitar' }, gx + 14, gy + 21, 'stand', false, ['WE\'RE CALLED THE THIRD RAIL.', 'WE HAVE ONE SONG.']);
  drummer.lines = ['A ONE, A TWO...'];
  let t = 0;
  game.add(new Custom(gx, gy, {
    update: (_s, c, dt) => {
      if (c.reduced) return;
      t += dt;
      drummer.pose = Math.floor(t * 5) % 2 ? 'cheer' : 'stand';
      guitarist.z = Math.floor(t * 2.5) % 2;
      if (Math.random() < dt * 1.2) c.fx.add({ x: gx + 8 + Math.random() * 20, y: gy, vy: -10, vx: 2, life: 1.6, color: css('#2a2430'), wobble: 3 });
    },
    draw: () => {}, bounds: () => ({ x: 0, y: 0, w: 0, h: 0 }),
  })).layer = 0;
  const neighbour = who({ skin: 'fair', hair: 'white', style: 'bald', top: 'sky', topKind: 'coat', bottom: 'grey', glasses: true }, gx - 10, gy + 24, 'stand', false, ['TURN IT DOWN!', 'ACTUALLY... NOT BAD.']);
  neighbour.idle = [['stand', 4], ['cheer', 0.4], ['stand', 3]];
}

/** A bubble artist; kids chase the bubbles and pop them. */
function bubbles(game: Game, who: Who) {
  const ax = 690, ay = 780;
  const artist = who({ skin: 'light', hair: 'auburn', style: 'bun', top: 'purple', topKind: 'coat', bottom: 'black' }, ax, ay, 'cheer', false, ['MAKE A WISH.', 'IT\'S MOSTLY SOAP.']);
  const R = rng(6);
  const kids = [0, 1, 2].map((i) => who(randomLook(R, true), ax + 18 + i * 10, ay + 6 + (i % 2) * 6, 'cheer', i % 2 === 0, ['POP!', 'GOT ONE!']));
  const art = [3, 4.5, 6].map((r) => propSprite(props.bubbleArt(r)));
  const list: { x: number; y: number; z: number; vx: number; s: number; t: number }[] = [];
  let t = 0;
  game.add(new Custom(ax, ay, {
    update: (_s, c, dt) => {
      if (c.reduced) return;
      t += dt;
      artist.pose = Math.floor(t / 1.5) % 2 ? 'cheer' : 'wave1';
      if (Math.random() < dt * 0.9 && list.length < 7) list.push({ x: ax + 4, y: ay, z: 16, vx: 6 + Math.random() * 8, s: Math.floor(Math.random() * 3), t: 0 });
      for (const b of list) { b.t += dt; b.x += b.vx * dt; b.z += Math.sin(b.t * 2) * 4 * dt + 2 * dt; }
      // the kids run after the nearest bubble and pop it
      kids.forEach((k, i) => {
        const target = list[i % Math.max(1, list.length)];
        if (!target || k.script.length) return;
        k.stepToward(target.x, ay + 6 + i * 3, 18 * dt);
        if (Math.abs(k.x - target.x) < 3 && target.t > 1) {
          c.fx.burst(target.x, ay - target.z, ['#cfe8f0', '#f6f1e6'], 6, 20, 0, 0.4);
          list.splice(list.indexOf(target), 1);
          k.hop(5);
          if (Math.random() < 0.4) k.say(c, 'POP!', 0.7);
        }
      });
      for (let i = list.length - 1; i >= 0; i--) if (list[i].t > 9 || list[i].x > ax + 90) list.splice(i, 1);
      kids.forEach((k) => { if (k.x > ax + 80) k.x = ax + 80; if (!k.moving) k.pose = 'cheer'; });
    },
    draw: (_s, d) => { for (const b of list) d.sprite(art[b.s], b.x, b.y - b.z); },
    bounds: () => ({ x: ax - 4, y: ay - 30, w: 60, h: 30 }),
  })).layer = 2;
  artist.label = 'A bubble artist and some very fast children';
}

/** A kickabout: four kids, a ball, backpacks for goalposts. */
function kickabout(game: Game, who: Who) {
  const R = rng(8);
  const spots: [number, number][] = [[606, 856], [636, 850], [664, 860], [694, 852]];
  const kids = spots.map(([x, y], i) => who(randomLook(R, true), x, y, 'stand', i > 1, ['GOAL!', 'THAT WAS OFFSIDE!', 'PASS IT!']));
  for (const x of [592, 600, 700, 708]) game.add(new Prop(props.crate(hex(x < 650 ? '#c83a32' : '#3a7ad0')), x, 862));
  const ball = { x: 606, y: 856, z: 0, from: 0, to: 1, t: 0 };
  game.add(new Custom(650, 856, {
    update: (_s, c, dt) => {
      if (c.reduced) return;
      ball.t += dt;
      const dur = 0.9;
      const k = Math.min(1, ball.t / dur);
      const a = kids[ball.from], b = kids[ball.to];
      ball.x = a.x + (b.x - a.x) * k; ball.y = a.y + (b.y - a.y) * k; ball.z = Math.sin(k * Math.PI) * 6;
      if (k >= 1) {
        b.pose = 'walk0'; setTimeout(() => (b.pose = 'stand'), 200);
        ball.from = ball.to; ball.to = (ball.to + 1 + Math.floor(Math.random() * 3)) % 4; ball.t = 0;
        if (ball.to === ball.from) ball.to = (ball.to + 1) % 4;
        if (Math.random() < 0.12) { kids[ball.from].say(c, 'GOAL!', 1.2, 'shout'); kids.forEach((q) => q.hop(3)); }
      }
    },
    draw: (_s, d) => { d.rect(ball.x, ball.y, 2, 1, 'rgba(40,26,70,0.3)'); d.rect(ball.x, ball.y - 2 - Math.round(ball.z), 2, 2, css('#f6f1e6')); d.rect(ball.x + 1, ball.y - 2 - Math.round(ball.z), 1, 1, css('#2a2430')); },
    bounds: () => ({ x: 590, y: 838, w: 120, h: 26 }),
  })).layer = 2;
}

/** A wedding photo shoot: the couple, a photographer crouching, an assistant with a reflector. */
function wedding(game: Game, who: Who) {
  const bride = who({ skin: 'brown', hair: 'black', style: 'bun', top: 'white', topKind: 'dress', bottom: 'white', item: 'flowers' }, 918, 522, 'stand', false, ['DOES MY HAIR LOOK OK?', 'BEST DAY!']);
  const groom = who({ skin: 'fair', hair: 'brown', style: 'short', top: 'charcoal', bottom: 'charcoal', shoes: 'black' }, 928, 522, 'stand', true, ['MY FACE HURTS FROM SMILING.']);
  const photog = who({ skin: 'deep', hair: 'black', style: 'cap', hat: 'black', top: 'black', bottom: 'black', item: 'camera' }, 922, 546, 'back', false, ['AND... NATURAL!', 'LESS NATURAL.']);
  const asst = who({ skin: 'olive', hair: 'auburn', style: 'ponytail', top: 'tan', bottom: 'denim' }, 940, 536, 'side', true, ['MY ARMS ARE TIRED.']);
  game.worldOverlays.push((d) => { d.rect(asst.x - 9, asst.y - 14, 4, 7, css('#f2e6b0')); d.rect(asst.x - 8, asst.y - 13, 2, 5, css('#fff6d0')); });
  every(game, 9, 3, (c) => {
    photog.run([{ kind: 'pose', pose: 'crouch', t: 1.4, flip: false }, { kind: 'say', text: 'SAY "DEEP DISH"!', t: 1.4 }, { kind: 'pose', pose: 'back', t: 0.1 }]);
    setTimeout(() => { c.fx.burst(922, 532, ['#ffffff'], 6, 30, 0, 0.25); bride.pose = 'cheer'; groom.pose = 'wave0'; }, 1300);
    setTimeout(() => { bride.pose = 'stand'; groom.pose = 'stand'; }, 2600);
  });
  // a toddler flower-girl wandering off with the petals
  const fg = who({ skin: 'brown', hair: 'black', style: 'curly', top: 'pink', topKind: 'dress', bottom: 'pink', kid: true }, 904, 530, 'stand', false, ['PETALS!', 'I\'M IN CHARGE.']);
  fg.route = { pts: [[904, 530], [890, 540], [880, 528]], speed: 6, loop: true, pause: 0 };
  let t = 0;
  game.add(new Custom(0, 0, { update: (_s, c, dt) => { t += dt; if (!c.reduced && t > 0.8) { t = 0; c.fx.add({ x: fg.x, y: fg.y - 1, life: 6, color: css(Math.random() < 0.5 ? '#f2a0b6' : '#f6f1e6') }); } }, draw: () => {}, bounds: () => ({ x: 0, y: 0, w: 0, h: 0 }) })).layer = 0;
  bride.label = 'A wedding photo shoot on the lawn';
}

/** A book club in a circle by the little free library, one member asleep. */
function bookClub(game: Game, bm: Bitmap, who: Who, prop: VignetteApi['prop']) {
  // the little free library: a birdhouse full of books on a post
  const lib = new Bitmap(12, 22);
  lib.vline(5, 10, 12, P.wood[1]); lib.vline(6, 10, 12, P.wood[2]);
  lib.rect(1, 3, 10, 8, hex('#c83a32')); lib.rect(2, 5, 8, 5, hex('#2a2430'));
  for (let i = 0; i < 8; i += 2) lib.vline(2 + i, 6, 4, [hex('#f2d03a'), hex('#3a7ad0'), P.white, hex('#3f9a56')][i / 2]);
  for (let y = 0; y < 3; y++) lib.hline(1 + y, 2 - y + 0, 10 - y * 2, hex('#7a2028'));
  lib.outline();
  const libE = prop({ bm: lib, ax: 6, ay: 21 }, 424, 476, 6);
  libE.label = 'A little free library';
  libE.tap = (c) => c.bubbles.say(424, 452, 'TAKE A BOOK, LEAVE A BOOK.', 1.8);
  const R = rng(21);
  blanket(bm, 430, 504, 30, 14, hex('#7a5aa0'));
  const members = [[436, 510, 'sit'], [452, 508, 'sitSide'], [446, 518, 'sit'], [460, 516, 'sitSide']] as const;
  const people = members.map(([x, y, pose], i) => {
    const p = who({ ...randomLook(R), item: 'book' }, x, y, pose, i % 2 === 1, ['CHAPTER TWELVE THOUGH...', 'I DIDN\'T FINISH IT.', 'I SKIMMED.', 'THE ENDING!']);
    p.seated = true;
    return p;
  });
  people[3].look = { ...people[3].look, item: 'none' };
  people[3].extra = (d, p, c) => { if (Math.floor(c.t) % 3 === 0) d.rect(p.x + 4, p.y - 15 - (c.t % 1) * 3, 1, 1, '#f6f1e6'); };
  people[3].lines = ['ZZZ...', 'I LOVED IT. (I DIDN\'T READ IT.)'];
}

function iceCreamLine(who: Who) {
  const R = rng(44);
  [[794, 570], [784, 573], [774, 576]].forEach(([x, y], i) => {
    const k = who(randomLook(R, true), x, y, i === 0 ? 'side' : 'side', false, ['CHOCOLATE!', 'TWO SCOOPS!', 'IS IT COLD ENOUGH?']);
    k.idle = [['side', 1.5 + i], ['stand', 0.8]];
  });
}

/** Dogs having the best day of their lives; their people having a nice chat. */
function dogMeetup(game: Game, who: Who) {
  const cx = 984, cy = 838;
  const kinds = ['corgi', 'poodle', 'dachshund', 'lab'] as const;
  const dogs = kinds.map((k, i) => {
    const d = game.add(new Critter((f, j, m) => dog(k, m ? j : 0, f), cx, cy, 9));
    d.state = { a: i * 1.6, sp: 1.6 + i * 0.25 };
    d.tap = (c) => c.bubbles.say(d.x, d.y - 10, ['YIP!', 'ARF!', 'WOOF!', 'BORK!'][i], 0.8);
    return d;
  });
  game.add(new Custom(cx, cy, {
    update: (_s, c, dt) => {
      for (const d of dogs) {
        const st = d.state as { a: number; sp: number };
        if (c.reduced) { d.moving = false; continue; }
        st.a += dt * st.sp;
        const nx = cx + Math.cos(st.a) * 20, ny = cy + Math.sin(st.a * 1.3) * 7;
        d.flip = nx < d.x; d.x = nx; d.y = ny; d.moving = true;
      }
    },
    draw: () => {}, bounds: () => ({ x: 0, y: 0, w: 0, h: 0 }),
  })).layer = 0;
  const R = rng(66);
  who({ ...randomLook(R), item: 'leash' }, cx - 30, cy - 8, 'stand', false, ['WHICH ONE\'S YOURS?', 'THE LOUD ONE.']);
  who({ ...randomLook(R), item: 'cup' }, cx - 22, cy - 10, 'stand', true, ['THEY\'RE BEST FRIENDS NOW.']);
  who({ ...randomLook(R), item: 'leash' }, cx + 30, cy - 6, 'stand', true, ['HE\'S A RESCUE.']);
}

/** A birthday party: balloons tied to a bench, hats, a cake. Tap to sing. */
function birthday(game: Game, bm: Bitmap, who: Who, prop: VignetteApi['prop']) {
  const bx = 1384, by = 842;
  blanket(bm, bx - 18, by - 4, 34, 14, hex('#f2a0b6'));
  prop(props.bench(), bx + 22, by - 10, 18);
  const R = rng(12);
  const guests = [[bx - 12, by + 2], [bx - 2, by + 6], [bx + 8, by + 2], [bx - 8, by + 12], [bx + 6, by + 12]].map(([x, y], i) => who(randomLook(R, true), x, y, i < 3 ? 'sit' : 'stand', i % 2 === 1, ['CAKE!', 'IS IT TIME?', 'I\'M FIVE TOO.']));
  const birthdayKid = guests[1];
  birthdayKid.lines = ['IT\'S MY BIRTHDAY!', 'I\'M SIX!'];
  const grown = who({ ...randomLook(R), item: 'phone' }, bx + 18, by + 10, 'stand', true, ['SMILE, BIRTHDAY GIRL!']);
  void grown;
  game.add(new Custom(bx, by + 4, {
    draw: (s, d, c) => {
      // the cake, a candle that flickers
      d.rect(bx - 2, by + 1, 7, 3, css('#f6f1e6')); d.rect(bx - 2, by + 1, 7, 1, css('#f2a0b6'));
      d.rect(bx + 1, by - 2, 1, 3, css('#3a7ad0'));
      if (Math.floor(c.t * 6) % 3) d.rect(bx + 1, by - 3, 1, 1, css('#f2b43a'));
      // party hats
      for (const g of guests) { d.rect(g.x, g.y - (g.look.kid ? 13 : 17) - Math.round(g.z), 1, 2, css('#f2d03a')); d.rect(g.x - 1, g.y - (g.look.kid ? 12 : 16) - Math.round(g.z), 3, 1, css('#c83a32')); }
      // balloons on the bench
      ['#e0402e', '#f2d03a', '#3a7ad0'].forEach((col, i) => {
        const x = bx + 26 + i * 4, y = by - 34 + Math.round(Math.sin(c.t * 1.4 + i) * 1);
        d.line(bx + 26, by - 16, x + 1, y + 4, 'rgba(246,241,230,0.7)');
        balloonAt(d, x, y, col);
      });
    },
    bounds: () => ({ x: bx - 20, y: by - 20, w: 50, h: 34 }),
  })).layer = 2;
  const sing = (c: Ctx) => {
    c.bubbles.say(bx, by - 18, '♪ HAPPY BIRTHDAY TO YOU ♪', 2.4);
    guests.forEach((g, i) => setTimeout(() => g.hop(4), 600 + i * 150));
    setTimeout(() => c.fx.burst(bx, by - 8, ['#e0402e', '#f2d03a', '#3a7ad0', '#3f9a56', '#f2a0b6'], 30, 60, 90, 1.8), 1800);
  };
  birthdayKid.tap = sing;
  birthdayKid.label = 'A birthday party by the lake';
}

/** A kid on the pond's edge, steering a toy sailboat that won't steer. */
function toyBoat(game: Game, who: Who) {
  const kid = who({ skin: 'fair', hair: 'brown', style: 'short', top: 'sky', topKind: 'coat', bottom: 'navy', kid: true }, 180, 718, 'back', false, ['COME BACK, BOAT!', 'IT\'S NOT LISTENING.']);
  const grandpa = who({ skin: 'fair', hair: 'white', style: 'cap', hat: 'navy', top: 'tan', topKind: 'coat', bottom: 'brown', glasses: true }, 194, 714, 'stand', false, ['IN MY DAY BOATS LISTENED.']);
  void grandpa;
  game.add(new Custom(170, 746, {
    update: (s, c, dt) => { if (!c.reduced) { s.state.t = (s.state.t ?? 0) + dt; s.x = 170 + Math.sin(s.state.t * 0.3) * 40; s.y = 746 + Math.sin(s.state.t * 0.21) * 8; } },
    draw: (s, d, c) => {
      d.rect(s.x - 3, s.y, 7, 2, css('#c83a32')); d.rect(s.x, s.y - 6, 1, 6, css('#4a2e22'));
      d.rect(s.x + 1, s.y - 6, 3, 4, css('#f6f1e6')); d.rect(s.x + 1, s.y - 2, 2, 1, css('#f6f1e6'));
      if (Math.floor(c.t * 2) % 2) d.rect(s.x - 5, s.y + 2, 2, 1, css('#86b59c'));
    },
    bounds: (s) => ({ x: s.x - 4, y: s.y - 7, w: 9, h: 10 }),
  })).tap = (c) => kid.say(c, 'COME BACK, BOAT!', 1.4);
}
