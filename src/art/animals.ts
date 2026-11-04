import { Bitmap, Palette } from './bitmap';
import { hex } from './color';
import { P } from './palette';
import { Sprite, spriteFrom } from './people';

// Animals are hand-drawn, facing right; flip for left.

const cache = new Map<string, Sprite>();
function make(key: string, rows: string[], pal: Palette, flip: boolean, outline = true): Sprite {
  const k = key + flip;
  let s = cache.get(k);
  if (!s) {
    const w = rows.reduce((m, r) => Math.max(m, r.length), 0);
    const bm = new Bitmap(w + 2, rows.length + 2);
    bm.stamp(rows, 1, 1, pal, flip);
    if (outline) bm.outline();
    s = spriteFrom(bm, Math.floor((w + 2) / 2), bm.h - 1);
    cache.set(k, s);
  }
  return s;
}

// ---- Nougat ----------------------------------------------------------------
// A Shih Tzu: cream with caramel ears, a topknot with a pink bow, a plume of a
// tail held over her back, and short legs lost in fluff.

const NOUGAT_PAL: Palette = {
  W: hex('#f6eedf'), w: hex('#d8c8b0'), C: hex('#c48a52'), c: hex('#9a6a3a'),
  E: hex('#1c1418'), N: hex('#2a1a1a'), B: hex('#e2668a'), T: hex('#e87a8a'), O: hex('#d8e84a'), o: hex('#a8b830'),
};

export type NougatPose = 'stand' | 'run0' | 'run1' | 'sit' | 'ball' | 'ballRun0' | 'ballRun1' | 'happy' | 'bark' | 'beg';

const NOUGAT: Record<NougatPose, string[]> = {
  stand: [
    '.........BB..',
    '.WW.....CWWC.',
    'WwWW...CWWEWW',
    '.WWWWWWCWWWWN',
    '.WWWWWWWCCWw.',
    '.wWWWWWWWCw..',
    '..ww.w..w.w..',
  ],
  run0: [
    '.........BB..',
    'WWW.....CWWC.',
    '.wWWW..CWWEWW',
    '..WWWWWCWWWWN',
    '.WWWWWWWCCWw.',
    'ww.wWWWWWw...',
    '........ww...',
  ],
  run1: [
    '.........BB..',
    '.WW.....CWWC.',
    'WwWWW..CWWEWW',
    '.WWWWWWCWWWWN',
    '.wWWWWWWCCw..',
    '...wWWWWw.w..',
    '...ww....ww..',
  ],
  sit: [
    '.....BB..',
    '....CWWC.',
    'W..CWWEWW',
    'WW.CWWWWN',
    '.WWWCCWw.',
    '.WWWWWCw.',
    '.wwWWWww.',
  ],
  ball: [
    '.........BB...',
    '.WW.....CWWC..',
    'WwWW...CWWEWW.',
    '.WWWWWWCWWWWNO',
    '.WWWWWWWCCWwOo',
    '.wWWWWWWWCw...',
    '..ww.w..w.w...',
  ],
  ballRun0: [
    '.........BB...',
    'WWW.....CWWC..',
    '.wWWW..CWWEWW.',
    '..WWWWWCWWWWNO',
    '.WWWWWWWCCWwOo',
    'ww.wWWWWWw....',
    '........ww....',
  ],
  ballRun1: [
    '.........BB...',
    '.WW.....CWWC..',
    'WwWWW..CWWEWW.',
    '.WWWWWWCWWWWNO',
    '.wWWWWWWCCwOo.',
    '...wWWWWw.w...',
    '...ww....ww...',
  ],
  happy: [
    '.....BB..',
    '....CWWC.',
    'W..CWEWEW',
    'WW.CWWNWW',
    '.WWWCTTC.',
    '.WWWWWWw.',
    '.wwWWWww.',
  ],
  bark: [
    '.........BB..',
    '.WW.....CWWC.',
    'WwWW...CWWEWW',
    '.WWWWWWCWWWWN',
    '.WWWWWWWCCWT.',
    '.wWWWWWWWCw..',
    '..ww.w..w.w..',
  ],
  beg: [
    '....BB..',
    '...CWWC.',
    '..CWWEWW',
    '..CWWWWN',
    '..WCCWw.',
    '.WWWWw..',
    'WWWWWW..',
    '.WWWW...',
    '.ww.ww..',
  ],
};

export function nougat(pose: NougatPose, flip = false): Sprite {
  return make('nougat-' + pose, NOUGAT[pose], NOUGAT_PAL, flip);
}

// ---- Other dogs -------------------------------------------------------------

type DogKind = 'lab' | 'dachshund' | 'corgi' | 'poodle';
const DOGS: Record<DogKind, { pal: Palette; frames: string[][] }> = {
  lab: {
    pal: { D: hex('#d8a860'), d: hex('#b0803e'), L: hex('#f0cc88'), E: hex('#1c1418'), N: hex('#2a1a1a'), K: hex('#d23a32'), T: hex('#e87a8a') },
    frames: [
      ['............DD..', '...........DDEDN', 'D.........KDDDDD', '.DLLLLLLLLKDDT..', '.DDDDDDDDDDDd...', '.dDDDDDDDDDd....', '.d.d.....d.d....', '.d.d.....d.d....'],
      ['............DD..', '...........DDEDN', '.D........KDDDDD', 'D.LLLLLLLLKDDT..', '.DDDDDDDDDDDd...', '.dDDDDDDDDDd....', 'd...d...d...d...', '................'],
    ],
  },
  dachshund: {
    pal: { D: hex('#8a4a26'), d: hex('#5e3018'), L: hex('#a86238'), E: hex('#1c1418'), N: hex('#1c1418'), K: hex('#3a7ad0') },
    frames: [
      ['..........DD..', '.........DDEDN', 'D........KDDDD', '.DLLLLLLLKDd..', '.dDDDDDDDDd...', '..d.d...d.d...'],
      ['..........DD..', '.........DDEDN', '.D.......KDDDD', 'D.LLLLLLLKDd..', '.dDDDDDDDDd...', '.d...d.d...d..'],
    ],
  },
  corgi: {
    pal: { D: hex('#d8783a'), d: hex('#a85a28'), L: hex('#f6eedf'), E: hex('#1c1418'), N: hex('#1c1418'), K: hex('#3f8a56') },
    frames: [
      ['.........D.D..', '.........DDDD.', '.........DDEDN', 'DD.......KLLLL', '.DDDDDDDDKDL..', '.LLLLLLLLLL...', '..d.d...d.d...'],
      ['.........D.D..', '.........DDDD.', '.........DDEDN', '.DD......KLLLL', 'D.DDDDDDDKDL..', '.LLLLLLLLLL...', '.d...d.d...d..'],
    ],
  },
  poodle: {
    pal: { D: hex('#2a2430'), d: hex('#1a1620'), L: hex('#3a3442'), E: hex('#e8e0d0'), N: hex('#0e0a10'), K: hex('#e2668a') },
    frames: [
      ['..........DD..', 'D........DDDD.', 'DD.......DDEDN', '.D..LLL..KDD..', '..DDDDDDDKD...', '..DDDDDDDD....', '..d.d...d.d...', '..D.D...D.D...'],
      ['..........DD..', '.D.......DDDD.', 'DD.......DDEDN', '.D..LLL..KDD..', '..DDDDDDDKD...', '..DDDDDDDD....', '.d...d.d...d..', '.D...D.D...D..'],
    ],
  },
};

export function dog(kind: DogKind, frame: number, flip = false): Sprite {
  const d = DOGS[kind];
  const f = frame % d.frames.length;
  return make(`dog-${kind}-${f}`, d.frames[f], d.pal, flip);
}

// ---- Birds and small things -------------------------------------------------

const PIGEON_PAL: Palette = { G: hex('#8a8c9a'), g: hex('#6a6c7a'), L: hex('#b4b6c0'), N: hex('#5a8a7a'), k: hex('#2a2430'), o: hex('#d0604a'), W: hex('#c8cad2') };
const PIGEON: Record<string, string[]> = {
  stand: ['...Gk', 'LGGN.', '.gGg.', '..o..'],
  peck: ['.....', 'LGGGG', '.gGgN', '..o.k'],
  fly0: ['W...W', '.WGW.', '.LGNk', '.....'],
  fly1: ['.....', 'WWGWW', '.LGNk', '.....'],
  sit: ['...Gk', 'LGGN.', '.gGg.'],
};
export function pigeon(pose: keyof typeof PIGEON, flip = false): Sprite {
  return make('pigeon-' + pose, PIGEON[pose], PIGEON_PAL, flip);
}

const DUCK_PAL: Palette = { H: hex('#2f6c44'), W: P.white, B: hex('#7a4a30'), G: hex('#a8a49c'), g: hex('#7a766e'), Y: hex('#e8b83a'), E: hex('#1c1418'), F: hex('#c4a26c'), f: hex('#9a7c50') };
const DUCKS: Record<string, string[]> = {
  drake: ['....HH..', '....HEY.', '.g..W...', 'gGGGBB..', '.gggg...'],
  hen: ['....FF..', '....FEY.', '.f..F...', 'fFFFFF..', '.ffff...'],
  dive: ['........', '........', '.g......', 'gGg.....', '.gg.....'],
  duckling: ['..Yy', '.YYE', 'YYY.'],
};
export function duck(kind: keyof typeof DUCKS, flip = false): Sprite {
  return make('duck-' + kind, DUCKS[kind], { ...DUCK_PAL, y: hex('#e08a2a') }, flip);
}

const SQUIRREL_PAL: Palette = { S: hex('#8a6048'), s: hex('#6a4430'), L: hex('#b48a6a'), E: hex('#1c1418'), A: hex('#7a4a28') };
const SQUIRREL: Record<string, string[]> = {
  sit: ['SS....', 'SsS.SE', '.SsSSS', '.sSSL.', '..SLA.'],
  run0: ['SSS......', '..SS..SSE', '...SSSSS.', '...s..s..'],
  run1: ['.SS......', 'S..S..SSE', '...SSSSS.', '....ss...'],
};
export function squirrel(pose: keyof typeof SQUIRREL, flip = false): Sprite {
  return make('squirrel-' + pose, SQUIRREL[pose], SQUIRREL_PAL, flip);
}

const CAT_PAL: Palette = { C: hex('#3a3440'), c: hex('#2a2430'), E: hex('#d8e84a'), W: P.white, O: hex('#d8783a'), o: hex('#a85a28') };
const CATS: Record<string, string[]> = {
  sit: ['C.C...', 'CCC...', 'EcE...', 'CCC..C', 'CCCC.C', 'CCCCC.'],
  loaf: ['O.O.....', 'OOO.....', 'oEoO....', 'OOOOOOO.', '.oooooO.'],
  stretch: ['O.O.......', 'OOOO......', 'EoOOOOOOO.', '..OOOOOOOO', '..o.....oO'],
};
export function cat(pose: keyof typeof CATS, flip = false): Sprite {
  return make('cat-' + pose, CATS[pose], CAT_PAL, flip);
}

const RACCOON_PAL: Palette = { R: hex('#7a7680'), r: hex('#56525c'), K: hex('#24222a'), W: hex('#d6d2cc'), E: hex('#e8e0d0') };
export function raccoon(peek: boolean): Sprite {
  return make('raccoon-' + peek, peek
    ? ['.R..R.', 'RRRRRR', 'KEKKEK', 'WRWWRW', '.RRRR.']
    : ['.R..R.', 'RRRRRR', 'KKKKKK', '......', '......'], RACCOON_PAL, false);
}

const GHOST_PAL: Palette = { W: hex('#f6f1e6'), w: hex('#c8c2d6'), E: hex('#2a2430'), P: hex('#e88aa6') };
export function ghost(frame: number): Sprite {
  const frames = [
    ['..WWWW..', '.WWWWWW.', 'WWEWWEWW', 'WWWWWWWW', 'WPWEEWPW', 'WWWWWWWw', 'WWWWWWWw', 'WWWWWWww', 'W.WW.WW.', '..W...W.'],
    ['..WWWW..', '.WWWWWW.', 'WWEWWEWW', 'WWWWWWWW', 'WPWEEWPW', 'WWWWWWWw', 'WWWWWWWw', 'WWWWWWww', '.WW.WW.W', '.W...W..'],
  ];
  return make('ghost-' + (frame % 2), frames[frame % 2], GHOST_PAL, false);
}

/** A kid under a bedsheet, two eyeholes, sneakers poking out. */
export function sheetKid(frame: number): Sprite {
  const pal: Palette = { ...GHOST_PAL, F: hex('#d23a32') };
  const frames = [
    ['..WWWW..', '.WWWWWW.', '.WEWWEW.', '.WWWWWW.', 'WWWWWWWw', 'WWWWWWWw', 'WWWWWWww', 'WWWWWWww', 'W.WWW.Ww', '..F..F..'],
    ['..WWWW..', '.WWWWWW.', '.WEWWEW.', '.WWWWWW.', 'WWWWWWWw', 'WWWWWWWw', 'WWWWWWww', 'WWWWWWww', '.WWW.WWw', '..F...F.'],
  ];
  return make('sheetkid-' + (frame % 2), frames[frame % 2], pal, false);
}

export function butterfly(frame: number): Sprite {
  return make('bfly' + (frame % 2), frame % 2 ? ['O.O', '.k.'] : ['.O.', 'OkO'], { O: hex('#f08a2a'), k: hex('#2a2430') }, false, false);
}
