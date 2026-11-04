import { Bitmap, Palette } from './bitmap';
import { Color, hex, ink } from './color';
import { P, ClothName, SkinName, HairName } from './palette';

// Townsfolk are composed from hand-drawn templates: a pose, then a hairstyle,
// then clothes and whatever they're holding, then an outline tinted from the
// pixels it wraps. Adults are 8x15 inside the outline, children 8x11.
//
// Template key: H hair · S/s skin (lit/shade) · E eye · T/t/u top (mid/shade/
// light) · P/p bottom · F shoes · C/c hat · G/g glasses · X/Y/W held things.

export type Pose =
  | 'stand' | 'walk0' | 'walk1' | 'walk2' | 'side' | 'back' | 'sit' | 'sitBack'
  | 'wave0' | 'wave1' | 'cheer' | 'sitSide' | 'crouch' | 'swing0' | 'swing1';

export type HairStyle =
  | 'short' | 'swoop' | 'buzz' | 'bald' | 'long' | 'bob' | 'bun' | 'ponytail' | 'curly' | 'cap' | 'beanie' | 'scarf';

export type Item =
  | 'none' | 'cup' | 'phone' | 'bag' | 'icecream' | 'racket' | 'book' | 'laptop' | 'popcorn' | 'leash' | 'camera'
  | 'guitar' | 'paper' | 'cube' | 'kite' | 'broom' | 'tongs' | 'flowers' | 'balloon' | 'sax' | 'trumpet' | 'fries' | 'mop' | 'tray';

export interface Look {
  skin: SkinName;
  hair: HairName;
  style: HairStyle;
  top: ClothName;
  topKind?: 'long' | 'tee' | 'coat' | 'dress' | 'apron';
  bottom: ClothName;
  bottomKind?: 'pants' | 'shorts' | 'skirt';
  shoes?: ClothName;
  hat?: ClothName;
  glasses?: boolean;
  beard?: boolean;
  item?: Item;
  kid?: boolean;
  /** apron or scarf colour */
  extra?: ClothName;
}

type Grid = string[][];

const FRONT = [
  '........',
  '..HHHH..',
  '.HHHHHH.',
  '.HSSSSH.',
  '.SESSEs.',
  '.SSSSSs.',
  '..SSss..',
  '.TuTTTt.',
  '.TTTTTt.',
  '.TTTTTt.',
  '.STTTTs.',
  '..PPPp..',
  '..PPPp..',
  '..P..p..',
  '..F..F..',
];

const SIDE_HEAD = [
  '........',
  '..HHHH..',
  '.HHHHHH.',
  '.HHHSSS.',
  '.HHSSES.',
  '.HSSSSSS',
  '..SSSs..',
];

const SIDE_BODY: Record<string, string[]> = {
  side: ['..TuTT..', '..TtTT..', '..TtTT..', '..TSTT..', '..PPPp..', '..PPPp..', '..PP.p..', '..FF.FF.'],
  walk0: ['..TuTT..', '..TTtT..', '..TTTt..', '..TTTTS.', '..PPPp..', '..P..p..', '.P....p.', '.FF...FF'],
  walk1: ['..TuTT..', '..TtTT..', '..TtTT..', '..TSTT..', '..PPPp..', '...Pp...', '...Pp...', '...FFF..'],
  walk2: ['..TuTT..', '..TTtT..', '..TTTt..', '.STTTT..', '..PPPp..', '..p..P..', '.p....P.', '.FF...FF'],
  sitSide: ['..TuTT..', '..TtTT..', '..TtTT..', '..TtTTS.', '..PPPPPP', '.....p..', '.....p..', '.....FF.'],
  crouch: ['........', '..TuTT..', '..TtTT..', '..TTTTSS', '..PPPPp.', '..PPPPp.', '..F..FF.', '........'],
};

const BACK = [
  '........',
  '..HHHH..',
  '.HHHHHH.',
  '.HHHHHH.',
  '.HHHHHH.',
  '.SHHHHs.',
  '..SSss..',
  '.TuTTTt.',
  '.TTTTTt.',
  '.TTTTTt.',
  '.STTTTs.',
  '..PPPp..',
  '..PPPp..',
  '..P..p..',
  '..F..F..',
];

function grid(rows: string[]): Grid {
  return rows.map((r) => r.padEnd(8, '.').split(''));
}

/** Write an overlay onto a grid. '.' leaves a pixel, '_' erases it. */
function over(g: Grid, rows: (string | null)[], at = 0) {
  rows.forEach((row, j) => {
    if (!row) return;
    const y = at + j;
    if (y < 0 || y >= g.length) return;
    for (let i = 0; i < row.length && i < 8; i++) {
      const ch = row[i];
      if (ch === '.') continue;
      g[y][i] = ch === '_' ? '.' : ch;
    }
  });
}

type View = 'front' | 'side' | 'back';

function viewOf(pose: Pose): View {
  if (pose === 'back' || pose === 'sitBack' || pose === 'swing0' || pose === 'swing1') return pose.startsWith('swing') ? 'front' : 'back';
  if (pose === 'side' || pose.startsWith('walk') || pose === 'sitSide' || pose === 'crouch') return 'side';
  return 'front';
}

function baseGrid(pose: Pose): Grid {
  const v = viewOf(pose);
  if (v === 'side') {
    const body = SIDE_BODY[pose === 'side' ? 'side' : pose];
    return grid([...SIDE_HEAD, ...body]);
  }
  const g = grid(v === 'back' ? BACK : FRONT);
  if (pose === 'sit' || pose === 'swing0' || pose === 'swing1') {
    over(g, ['.PPPPPp.', '..P..p..', '..F..F..', '________'], 11);
  }
  if (pose === 'sitBack') over(g, ['.PPPPPp.', '________', '________', '________'], 11);
  if (pose === 'wave0') over(g, [null, null, null, '.......S', '.......T', '.......T', '.TTTTT_.', '.TTTTT..', '.STTTT_.'], 2);
  if (pose === 'wave1') over(g, [null, null, '.......S', '......T.', '......T.', '.......T', '.TTTTT_.', '.TTTTT..', '.STTTT_.'], 2);
  if (pose === 'cheer') over(g, ['S......S', 'T......T', 'T......T', null, '._TTTT_.', '..TTTT..', '._TTTT_.'], 3);
  if (pose === 'swing0' || pose === 'swing1') over(g, [null, null, null, '.TTTTTT.', '.TTTTTT.'], 7);
  return g;
}

function applyHair(g: Grid, look: Look, v: View) {
  const s = look.style;
  if (v === 'front') {
    switch (s) {
      case 'swoop': over(g, ['...HHH..', '..HHHHH.', '.HHHHHH.', '.HSSSSH.']); break;
      case 'buzz': over(g, [null, null, null, '.SSSSSs.']); break;
      case 'bald': over(g, [null, '..SSSS..', '.SSSSSs.', '.HSSSSH.']); break;
      case 'long': over(g, [null, null, null, 'HHSSSSHH', 'HSESSEsH', 'HSSSSSsH', 'HHSSssHH', '.HTTTTH.', '.H....H.']); break;
      case 'bob': over(g, [null, null, '.HHHHHH.', 'HHSSSSHH', 'HSESSEsH', 'HHSSSSHH']); break;
      case 'bun': over(g, ['...HH...', '..HHHH..']); break;
      case 'ponytail': over(g, [null, null, null, '.HSSSSHH']); break;
      case 'curly': over(g, ['..HHHH..', '.HHHHHH.', 'HHHHHHHH', 'HHSSSSHH', 'HSESSEsH']); break;
      case 'cap': over(g, [null, '..CCCC..', '.CCCCCC.', '.cccccc.']); break;
      case 'beanie': over(g, ['...CC...', '..CCCC..', '.CCCCCC.', '.cccccc.']); break;
      case 'scarf': over(g, [null, '..CCCC..', '.CCCCCC.', 'CCSSSSCC', 'CSESSEsC', 'CSSSSSsC', 'CCSSssCC', '.CTTTTC.']); break;
    }
    if (look.beard) over(g, [null, null, null, null, null, '.HSSSSH.', '..HHHH..'], 0);
    if (look.glasses) over(g, [null, null, null, null, '.SGggGs.'], 0);
  } else if (v === 'side') {
    switch (s) {
      case 'swoop': over(g, ['...HHH..', '..HHHHH.', '.HHHHHHH']); break;
      case 'buzz': over(g, [null, null, null, '.HSSSSS.', '.HSSSES.']); break;
      case 'bald': over(g, [null, '..SSSS..', '.SSSSSS.', '.HSSSSS.', '.HSSSES.']); break;
      case 'long': over(g, [null, null, null, null, null, 'HHSSSSSS', 'HH.SSs..', '.H......', '.H......']); break;
      case 'bob': over(g, [null, null, null, null, 'HHHSSES.', 'HHSSSSSS']); break;
      case 'bun': over(g, ['.HH.....', 'HHHHHH..']); break;
      case 'ponytail': over(g, [null, null, 'HHHHHHH.', 'HHHHSSS.', 'H.HSSES.', 'H.SSSSSS']); break;
      case 'curly': over(g, ['..HHHH..', '.HHHHHH.', 'HHHHHHH.', 'HHHHSSS.', 'HHHSSES.', 'HHSSSSSS']); break;
      case 'cap': over(g, [null, '..CCCC..', '.CCCCCC.', '.CCCcccc']); break;
      case 'beanie': over(g, ['..CC....', '.CCCCC..', 'CCCCCCC.', '.cccccc.']); break;
      case 'scarf': over(g, [null, '..CCCC..', '.CCCCCC.', 'CCCCSSS.', 'CCCSSES.', 'CCSSSSSS', '.CCSSs..']); break;
    }
    if (look.beard) over(g, [null, null, null, null, null, '.HHSSSSS', '..HHHH..']);
    if (look.glasses) over(g, [null, null, null, null, '.HHSgGS.']);
  } else {
    switch (s) {
      case 'bald': over(g, [null, '..SSSS..', '.SSSSSS.', '.SSSSSS.', '.HSSSSH.']); break;
      case 'buzz': break;
      case 'swoop': over(g, ['...HHH..', '..HHHHH.']); break;
      case 'long': over(g, [null, null, null, 'HHHHHHHH', 'HHHHHHHH', 'HHHHHHHH', '.HHHHHH.', '.HHHHHH.', '..HHHH..']); break;
      case 'bob': over(g, [null, null, null, 'HHHHHHHH', 'HHHHHHHH', 'HHHHHHHH']); break;
      case 'bun': over(g, ['...HH...', '..HHHH..']); break;
      case 'ponytail': over(g, [null, null, null, null, '.HHHHHH.', '.SHHHHs.', '...HH...', '...HH...']); break;
      case 'curly': over(g, ['..HHHH..', '.HHHHHH.', 'HHHHHHHH', 'HHHHHHHH', 'HHHHHHHH', '.HHHHHH.']); break;
      case 'cap': over(g, [null, '..CCCC..', '.CCCCCC.', '.cccccc.']); break;
      case 'beanie': over(g, ['...CC...', '..CCCC..', '.CCCCCC.', '.cccccc.']); break;
      case 'scarf': over(g, [null, '..CCCC..', '.CCCCCC.', 'CCCCCCCC', 'CCCCCCCC', 'CCCCCCCC', '.CCCCCC.', '.CCCCCC.']); break;
    }
  }
}

function applyClothes(g: Grid, look: Look, v: View, pose: Pose) {
  const top = look.topKind ?? 'long';
  const bottom = look.bottomKind ?? 'pants';
  const sitting = pose === 'sit' || pose === 'sitBack' || pose === 'sitSide' || pose.startsWith('swing');
  if (top === 'tee' && v !== 'side') over(g, [null, null, '.S....s.'], 7);
  if (top === 'tee' && v === 'side') over(g, [null, null, '...S....'], 7);
  if (top === 'coat' && !sitting) {
    if (v === 'side') over(g, [null, null, null, null, '..TTTt..'], 7);
    else over(g, [null, null, null, null, '.tTTTTt.', '..TTTt..'], 7);
  }
  if (top === 'apron' && v === 'front') over(g, [null, '..XXXX..', '..XXXX..', '..XXXX..', '..XXXX..', '..XXXX..'], 7);
  if (top === 'apron' && v === 'side') over(g, [null, '.....X..', '.....X..', '.....X..', '.....X..'], 7);
  if ((top === 'dress' || bottom === 'skirt') && !sitting) {
    const c = top === 'dress' ? 'T' : 'P';
    const d = top === 'dress' ? 't' : 'p';
    if (v === 'side') over(g, [`..${c}${c}${c}${d}..`, `.${c}${c}${c}${c}${d}..`, null, null], 11);
    else over(g, [`..${c}${c}${c}${d}..`, `.${c}${c}${c}${c}${d}${d}.`, null, null], 11);
    // legs below the hem
    for (const y of [13]) for (let x = 0; x < 8; x++) if (g[y][x] === 'P' || g[y][x] === 'p') g[y][x] = 'S';
  }
  if (bottom === 'shorts' && !sitting) {
    for (const y of [13]) for (let x = 0; x < 8; x++) if (g[y][x] === 'P' || g[y][x] === 'p') g[y][x] = 'S';
  }
}

function applyItem(g: Grid, look: Look, v: View, pose: Pose) {
  const item = look.item ?? 'none';
  if (item === 'none') return;
  const sitting = pose === 'sit';
  if (v === 'front') {
    switch (item) {
      case 'cup': over(g, sitting ? [null, null, '.......W', '.......X'] : ['.......W', '.......X'], 9); break;
      case 'phone': over(g, ['......G.'], 9); break;
      case 'bag': over(g, ['.g......', 'XX......', 'XX......'], 9); break;
      case 'icecream': over(g, ['.......Y', '.......X'], 8); break;
      case 'racket': over(g, ['......gg', '.....g.g', '......gg', '......X.', '......X.'], 6); break;
      case 'book': over(g, ['...XX...', '...XX...'], 8); break;
      case 'laptop': over(g, ['..WWWW..', '..WWWW..'], 9); break;
      case 'popcorn': over(g, ['..WYWY..', '..XWXW..'], 8); break;
      case 'camera': over(g, ['..GGGG..', '..GWGG..'], 4); break;
      case 'guitar': over(g, ['......g.', '.....g..', '..XXX...', '.XYXXX..', '.XXXX...'], 6); break;
      case 'paper': over(g, ['.WWWWW..', '.WgWgW..'], 9); break;
      case 'cube': over(g, ['...XY...', '...WG...'], 9); break;
      case 'flowers': over(g, ['.......X', '.......Y', '.......g'], 7); break;
      case 'tongs': over(g, ['.......g', '......g.'], 9); break;
      case 'broom': over(g, ['.......g', '.......g', '.......g', '.......g', '......XX', '......XX'], 8); break;
      case 'mop': over(g, ['.......g', '.......g', '.......g', '.......g', '......WW', '.....WWW'], 8); break;
      case 'sax': over(g, ['....X...', '...XY...', '...XX...', '..YXX...', '..XX....'], 6); break;
      case 'trumpet': over(g, [null, '......XY', 'XXXXXX..'], 3); break;
      case 'fries': over(g, ['..YYY...', '..XXX...'], 9); break;
      case 'tray': over(g, ['.WXWXW..', '.gggggg.'], 8); break;
      default: break;
    }
  } else if (v === 'side') {
    switch (item) {
      case 'cup': over(g, ['.....W..', '.....X..'], 9); break;
      case 'phone': over(g, ['.....G..'], 9); break;
      case 'bag': over(g, ['.g......', '.XX.....', '.XX.....'], 9); break;
      case 'icecream': over(g, ['......Y.', '......X.'], 9); break;
      case 'racket': over(g, ['......gg', '.....g.g', '......gg', '.....X..'], 7); break;
      case 'book': over(g, ['......X.', '......X.'], 8); break;
      case 'paper': over(g, ['.....WWW', '.....WGW'], 8); break;
      case 'leash': break;
      case 'broom': over(g, ['......g.', '......g.', '......g.', '......g.', '.....g..', '.....XX.'], 7); break;
      default: break;
    }
  } else {
    if (item === 'popcorn') over(g, ['.WY.....', '.XW.....'], 8);
  }
}

const EYE = hex('#1c1418');
const GLASS = hex('#2a2430');

function palette(look: Look): Palette {
  const skin = P.skin[look.skin];
  const top = P.cloth[look.top];
  const bottom = P.cloth[look.bottom];
  const shoes = P.cloth[look.shoes ?? 'charcoal'];
  const hat = P.cloth[look.hat ?? look.top];
  const extra = P.cloth[look.extra ?? 'white'];
  const hair = P.hair[look.hair];
  const item = look.item ?? 'none';
  const itemPal: Record<string, [Color, Color]> = {
    cup: [hex('#8a5a3a'), P.white],
    icecream: [hex('#d9a660'), hex('#f2a0b6')],
    book: [hex('#a8323a'), P.white],
    laptop: [P.metal[2], P.metal[3]],
    popcorn: [hex('#c83a3a'), hex('#f4e08a')],
    guitar: [hex('#a8642e'), hex('#3a2418')],
    cube: [hex('#e0402e'), hex('#f2d03a')],
    flowers: [hex('#e05a7a'), hex('#f2d03a')],
    bag: [P.cloth[look.extra ?? 'tan'][1], P.cloth[look.extra ?? 'tan'][0]],
    broom: [hex('#c8a050'), hex('#c8a050')],
    sax: [hex('#d8a83a'), hex('#f2d870')],
    trumpet: [hex('#d8a83a'), hex('#f2d870')],
    fries: [hex('#d23a32'), hex('#f2d03a')],
    mop: [hex('#c8a050'), hex('#c8a050')],
    tray: [hex('#8a5a3a'), hex('#c8a050')],
  };
  const [X, Y] = itemPal[item] ?? [P.metal[1], P.metal[3]];
  return {
    H: hair, S: skin[1], s: skin[0], E: EYE,
    T: top[1], t: top[0], u: top[2],
    P: bottom[1], p: bottom[0], F: shoes[1],
    C: hat[1], c: hat[0],
    G: GLASS, g: look.top === 'black' || look.top === 'charcoal' ? P.metal[2] : P.metal[1],
    X: look.topKind === 'apron' && item === 'none' ? extra[1] : X,
    Y, W: item === 'cube' ? hex('#3a7ad0') : item === 'laptop' ? P.metal[3] : P.white,
  };
}

export interface Sprite {
  canvas: HTMLCanvasElement;
  w: number;
  h: number;
  /** anchor (feet) inside the canvas */
  ax: number;
  ay: number;
}

const cache = new Map<string, Sprite>();

const KID_ROWS: Record<View, number[]> = {
  front: [0, 1, 2, 3, 4, 6, 7, 10, 11, 13, 14],
  back: [0, 1, 2, 3, 4, 6, 7, 10, 11, 13, 14],
  side: [0, 1, 2, 3, 4, 5, 7, 10, 11, 13, 14],
};

export function personGrid(look: Look, pose: Pose): Grid {
  const v = viewOf(pose);
  const g = baseGrid(pose);
  applyHair(g, look, v);
  applyClothes(g, look, v, pose);
  applyItem(g, look, v, pose);
  if (look.kid) {
    let rows = KID_ROWS[v].map((i) => g[i]);
    if (pose === 'cheer') rows = [g[0], g[1], g[2], g[3], g[4], g[6], g[7], g[10], g[11], g[13], g[14]].map((r, i) => (i === 7 ? g[10] : r));
    return rows;
  }
  return g;
}

/** Bitmap of a person in a pose, with the outline already added. */
export function personBitmap(look: Look, pose: Pose, flip = false): Bitmap {
  const g = personGrid(look, pose);
  const bm = new Bitmap(10, g.length + 2);
  bm.stamp(g.map((r) => r.join('')), 1, 1, palette(look), flip);
  bm.outline();
  return bm;
}

export function person(look: Look, pose: Pose, flip = false): Sprite {
  const key = JSON.stringify(look) + pose + flip;
  let s = cache.get(key);
  if (!s) {
    const bm = personBitmap(look, pose, flip);
    s = { canvas: bm.canvas(), w: bm.w, h: bm.h, ax: 5, ay: bm.h - 1 };
    cache.set(key, s);
  }
  return s;
}

export function spriteFrom(bm: Bitmap, ax = Math.floor(bm.w / 2), ay = bm.h - 1): Sprite {
  return { canvas: bm.canvas(), w: bm.w, h: bm.h, ax, ay };
}

/** Stand-in for ink() on a single colour, re-exported for props. */
export const outlineOf = ink;
