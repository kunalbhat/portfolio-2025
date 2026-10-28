// The desk as a designed object system, in real centimetres on the desk plane
// (the same frame as the Blender renders: +x runs up-right on screen, +y
// up-left, away from the viewer). Every object is square to the grid.
//
// Three depth bands, read back to front:
//
//   back    lamp · monitor · plant          the frame of the scene
//   middle  photo frame · Mac mini          work under the lamp; the machine
//   front   cube · notebook · cup · arcade  small things within reach, and play
//
// on a few columns. The lamp column (left) and plant column (right) carry an
// object in every row; the monitor's screen edge sits one gap from the plant,
// which keeps it clear of the lamp, and the notebook shares its centre line.
// The cup stands in the Mac mini's column, one spot left of the arcade.
// Nougat sits in the plant's column, just in front of the plant, clear of
// the arcade: a small discovery rather than a centrepiece.
//
// The same numbers drive the Blender study renders
// (illustrated-desk/tools/palette_study.py LAYOUT) and the night renders, whose
// lamp light falls where the lamp actually stands relative to each object.

const SCREEN_W = 61.5; // monitor screen width
const GAP = 13.72; // the system's spacing unit
const COL = {
  lamp: -46,
  plant: 68,
  monitor: 68 - 4.7 - GAP - SCREEN_W / 2, // ≈ 19: screen edge one gap from the plant pot
  macmini: SCREEN_W / 2 + GAP + 6.35, // where it stood beside the screen
};
const ROW = {
  back: 13.5 + GAP / 2 + 6.6,
  middle: 0,
  front: -21,
};

const SNAP = 0.5;
const snap = (v) => Math.round(v / SNAP) * SNAP;

/** Every object's position from the rows and columns above. */
export function composeSystem() {
  const objects = {
    lamp: { x: COL.lamp, y: ROW.back },
    monitor: { x: snap(COL.monitor), y: ROW.back },
    plant: { x: COL.plant, y: ROW.back },
    photoframe: { x: COL.lamp, y: ROW.middle },
    macmini: { x: snap(COL.macmini), y: 3 },
    rubiks: { x: COL.lamp, y: ROW.front },
    notebook: { x: snap(COL.monitor), y: ROW.front },
    cup: { x: snap(COL.macmini), y: ROW.front },
    arcade: { x: COL.plant, y: ROW.front },
    nougat: { x: COL.plant, y: 8 },
  };
  const surface = { x0: -62, x1: 84, y0: -45.5, y1: snap(ROW.back + 22), radius: 7, thickness: 1.8 };
  const guides = {
    xs: Object.values(COL),
    ys: Object.values(ROW),
    extent: { x0: surface.x0, x1: surface.x1, y0: surface.y0, y1: surface.y1 },
  };
  return { objects, gap: GAP, guides, surface, optical: { rubiks: 1.15, macmini: 1.05 } };
}

const SYSTEM = composeSystem();

// Where the lamp's beam meets the desk, relative to the lamp (from the Blender
// lamp rig: "[desk] lamp light ... hits desk at").
export const LAMP_POOL = { dx: 12.2, dy: -38.8, radius: 84 };

/**
 * Rose, in two lights. Day: open daylight, a warm peach room and a rose desk.
 * Night: the same room at dusk, lit by the lamp. Values sampled from the
 * study renders so the CSS planes match the Blender objects.
 */
export const TONES = {
  day: {
    env: "#e3beae",
    envEdge: "#d9ae9d",
    base: "#e2848f",
    lit: "#e9939d",
    edge: "#d65350",
    drop: "#9c4b50",
    rim: "rgba(255, 240, 236, 0.35)",
    ink: "#3b1a2a",
  },
  night: {
    env: "#3c1e40",
    envEdge: "#28132f",
    base: "#2f072e",
    lit: "#33082f",
    edge: "#210015",
    drop: "#0c0410",
    rim: "rgba(255, 210, 220, 0.06)",
    ink: "#f4e4e6",
  },
};

export const LAYOUT = {
  landscape: {
    // The whole desk, slab and all, with room around it.
    stage: { left: 0.06, right: 0.94, top: 0.11, bottom: 0.88, align: 0.5 },
    frameDesk: true,
    maxScale: 11.5,
  },
  portrait: {
    // Every object in view; the desk's corners run off the sides.
    stage: { left: 0.04, right: 0.96, top: 0.16, bottom: 0.9, align: 0.45 },
    maxScale: 11,
  },
};

/** Choose a crop by aspect ratio, not device type. */
export function pickLayout(width, height) {
  return width / height < 0.9 ? "portrait" : "landscape";
}

/** The layout scene.js lays out for one crop. */
export function resolveLayout(orientation) {
  const crop = LAYOUT[orientation];
  const objects = {};
  for (const [id, pos] of Object.entries(SYSTEM.objects)) {
    objects[id] = { ...pos, optical: SYSTEM.optical[id] };
  }
  const lamp = SYSTEM.objects.lamp;
  // Daylight: a soft pool of key light under the system. Night: the lamp's.
  const light = { x: 6, y: -8, radius: orientation === "portrait" ? 70 : 90 };
  const pool = { x: lamp.x + LAMP_POOL.dx, y: lamp.y + LAMP_POOL.dy, radius: LAMP_POOL.radius };
  const showGrid = new URLSearchParams(location.search).has("grid");
  return {
    ...crop,
    objects,
    desk: { light, pool, surface: SYSTEM.surface, guides: showGrid ? SYSTEM.guides : null },
  };
}
