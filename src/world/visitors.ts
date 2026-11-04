import { Look } from '../art/people';
import { Game } from '../engine/game';
import { Person } from './actors';

// People who paid to move in. They're fetched after the town is up, given a
// spot in the part of town they chose, and they blend in like everyone else:
// finding yourself is half the fun.

export interface VisitorNpc {
  id: string;
  name: string;
  line: string;
  look: Look;
  zone: 'park' | 'street' | 'lake';
}

const SPOTS: Record<VisitorNpc['zone'], [number, number][]> = {
  park: [[452, 580], [620, 668], [780, 690], [840, 722], [990, 742], [1030, 846], [1150, 700], [1290, 772], [1410, 762], [320, 640], [60, 692], [140, 704], [540, 470], [704, 522], [962, 480], [1250, 862], [880, 862], [760, 870]],
  street: [[24, 324], [70, 326], [412, 322], [522, 326], [682, 324], [860, 326], [1012, 322], [1092, 326], [1252, 322], [1322, 326], [1402, 324], [40, 428], [200, 430], [330, 426], [432, 430], [702, 428], [822, 430], [962, 426], [1152, 430], [1302, 428], [1382, 430]],
  lake: [[40, 886], [120, 890], [250, 884], [420, 892], [480, 886], [640, 890], [720, 884], [860, 892], [940, 886], [1080, 890], [1160, 884], [1300, 892], [1380, 886]],
};

export const visitors = new Map<string, Person>();

/**
 * Place a sample of residents: each part of town fills its hand-picked spots
 * and stops, so a popular town never turns into a crowd that buries the art.
 * The API sends a fresh random sample (with your own resident first).
 */
export function placeVisitors(game: Game, npcs: VisitorNpc[]) {
  const count: Record<string, number> = { park: 0, street: 0, lake: 0 };
  for (const n of npcs) {
    if (visitors.has(n.id)) continue;
    const zone = SPOTS[n.zone] ? n.zone : 'park';
    const list = SPOTS[zone];
    if (count[zone] >= list.length) continue;
    const i = count[zone]++;
    const [x, y] = list[i];
    const p = game.add(new Person({ ...n.look, kid: false, shoes: n.look.shoes ?? 'charcoal' }, x, y, 'stand', i % 2 === 1));
    p.label = `${titleCase(n.name)}, who moved in`;
    p.idle = [['stand', 3 + (i % 3)], ['wave0', 0.3], ['wave1', 0.3], ['stand', 2], [i % 2 ? 'side' : 'back', 1.5]];
    p.tap = (c) => {
      p.hop(4);
      p.say(c, `HI! I'M ${n.name}.`, 1.6);
      if (n.line) setTimeout(() => p.say(c, n.line, 2.4), 1700);
    };
    visitors.set(n.id, p);
  }
}

export async function loadVisitors(game: Game, me?: string): Promise<VisitorNpc[]> {
  try {
    const url = me && /^[A-Z0-9]{5}$/.test(me) ? `/api/npcs?me=${me}` : '/api/npcs';
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const { npcs } = (await res.json()) as { npcs: VisitorNpc[] };
    placeVisitors(game, npcs ?? []);
    return npcs ?? [];
  } catch {
    return [];
  }
}

const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
