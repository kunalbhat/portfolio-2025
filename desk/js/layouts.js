// The desk as a designed object system, in real centimetres on the desk plane
// (the same frame as the Blender renders: +x runs up-right on screen, +y
// up-left, away from the viewer). Every object is square to the grid.
//
// Three depth bands, read back to front:
//
//   back    lamp · plant          the two objects that frame the scene
//   middle  monitor · Mac mini    the anchor, and the machine beside it
//   front   cube · notebook       small things within reach
//
// and four columns. The monitor's screen width sets the system and the gap;
// the lamp and plant columns sit outside it, and the front row reuses them:
// the cube stands in the lamp's column, the notebook in the plant's.
//
// The same numbers drive the Blender study renders
// (illustrated-desk/tools/palette_study.py LAYOUT) and the night renders, whose
// lamp light falls where the lamp actually stands relative to each object.

const SCREEN_W = 61.5; // monitor screen width
const GAP = 13.72; // the system's spacing unit
const COL = {
  lamp: -46, // one gap and a bit outside the screen's left edge
  monitor: 0,
  macmini: SCREEN_W / 2 + GAP + 6.35, // one gap right of the screen
  plant: 68, // right edge column
};
const ROW = {
  back: 13.5 + GAP / 2 + 6.6, // behind the monitor's foot, half a gap clear
  middle: 0,
  front: -21,
};

const SNAP = 0.5;
const snap = (v) => Math.round(v / SNAP) * SNAP;

/** Every object's position from the rows and columns above. */
export function composeSystem() {
  const objects = {
    lamp: { x: COL.lamp, y: ROW.back },
    plant: { x: COL.plant, y: ROW.back },
    monitor: { x: COL.monitor, y: ROW.middle },
    macmini: { x: snap(COL.macmini), y: 3 },
    rubiks: { x: COL.lamp, y: ROW.front },
    notebook: { x: COL.plant, y: ROW.front },
  };
  const surface = { x0: -62, x1: 84, y0: -45.5, y1: snap(ROW.back + 16), radius: 7, thickness: 1.8 };
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
export const LAMP_POOL = { dx: 9.3, dy: -29.3, radius: 48 };

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
    stage: { left: 0.06, right: 0.94, top: 0.12, bottom: 0.94, align: 0.5 },
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
