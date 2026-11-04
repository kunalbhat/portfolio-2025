// Where everything is. One coordinate system for the whole town, in world
// pixels; the view is an elevated three-quarter look northward, so things
// further down the page are closer to you.

export const WORLD_W = 1440;
export const WORLD_H = 960;

// The L runs along the very top on its steel structure.
export const TRACK = { deckTop: 6, deckBottom: 20, fasciaBottom: 28, alleyBottom: 120 };

// Buildings stand on this line; the top sidewalk runs in front of them.
export const FACADE_BASE = 300;
export const SIDEWALK_N = { top: 300, bottom: 332 };
export const STREET = { top: 334, bottom: 410, laneN: 363, laneS: 389, park: 407, centre: 371 };
export const SIDEWALK_S = { top: 412, bottom: 436 };
export const FENCE_Y = 440;
export const PARK_TOP = 444;
export const PROMENADE = { top: 880, bottom: 900 };
export const SEAWALL = { top: 900, bottom: 908 };
export const LAKE_TOP = 908;

export const CROSSWALK = { x: 610, w: 54 };
export const PARK_GATES = [{ x: 610, w: 54 }, { x: 1180, w: 40 }, { x: 150, w: 36 }];

export const PLAYGROUND = { x: 34, y: 470, w: 300, h: 168 };
export const POND = { cx: 236, cy: 780, rx: 160, ry: 58 };
export const PLAZA = { cx: 690, cy: 588, rx: 118, ry: 62 };
export const COURT = { x: 1000, y: 470, w: 400, h: 184 };
export const COURT_LINES = { x: 1056, y: 510, w: 288, h: 104 };
export const PIER = { x: 300, w: 26, top: 880, bottom: 948 };

/** The long east-west park path, as a polyline. */
export const PATH_EW: [number, number][] = [
  [-10, 668], [120, 662], [260, 662], [400, 676], [520, 698], [640, 708], [760, 704], [880, 694], [990, 698], [1120, 716], [1260, 724], [1450, 718],
];
/** The north-south path from the main gate through the plaza to the lake. */
export const PATH_NS: [number, number][] = [
  [637, 438], [640, 480], [654, 530], [690, 560], [700, 640], [716, 704], [744, 780], [772, 840], [786, 884],
];
/** A path from the east gate down to the tennis court gate. */
export const PATH_COURT: [number, number][] = [[1200, 438], [1204, 456], [1200, 470]];
/** A path that wanders from the plaza to the playground. */
export const PATH_PLAY: [number, number][] = [[600, 560], [500, 548], [400, 560], [338, 566]];
/** And a little one from the main path to the pier. */
export const PATH_PIER: [number, number][] = [[640, 708], [560, 760], [470, 840], [380, 872], [313, 884]];
