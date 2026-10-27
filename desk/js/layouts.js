// The desk as a designed object system.
//
// Objects are not hand-placed. Their positions are derived from a few rules on
// a shared axonometric grid, in real centimetres on the desk plane (the same
// frame as the Blender renders, style v1.3: +x runs up-right on screen, +y
// up-left, away from the viewer). Every object is square to the grid.
//
//   1. The monitor anchors the back row. Its screen width is the width of the
//      whole system, and its screen plane is the back baseline.
//   2. A front row (Mac mini · cube · notebook) is justified across exactly the
//      monitor's width, with equal gaps between items, all centred on one
//      shared axis parallel to the screen.
//   3. That axis sits so the deepest item clears the monitor's foot by half a
//      gap.
//   4. The plant stands on the back baseline, one gap outside the screen's
//      edge: the single, deliberate asymmetry, balancing the row's weight.
//
// Footprints are the objects' real plan dimensions (cm), measured from the
// Blender models; `optical` scale is applied to the footprint too, so the
// spacing is honest to what you see.

const FOOTPRINT = {
  monitor: { w: 61.5, front: -3.5 }, // screen width; foot's front edge (y)
  macmini: { w: 12.7, d: 12.7 },
  rubiks: { w: 5.7, d: 5.7 },
  notebook: { w: 14.8, d: 21.0 },
  plant: { r: 4.7 }, // pot rim radius
};

const SNAP = 0.5; // cm: everything lands on a half-centimetre grid
const snap = (v) => Math.round(v / SNAP) * SNAP;

/** Derive every object's position from the rules above. */
export function composeSystem({ cubeScale = 1.15 } = {}) {
  const M = FOOTPRINT.monitor;
  const left = -M.w / 2;
  const right = M.w / 2;

  const row = [
    { id: "macmini", w: FOOTPRINT.macmini.w, d: FOOTPRINT.macmini.d },
    { id: "rubiks", w: FOOTPRINT.rubiks.w * cubeScale, d: FOOTPRINT.rubiks.d * cubeScale },
    { id: "notebook", w: FOOTPRINT.notebook.w, d: FOOTPRINT.notebook.d },
  ];
  const gap = (M.w - row.reduce((sum, r) => sum + r.w, 0)) / (row.length - 1);

  // Row axis: the deepest item clears the monitor's foot by half a gap.
  const deepest = Math.max(...row.map((r) => r.d));
  const axis = M.front - gap / 2 - deepest / 2;

  const objects = { monitor: { x: 0, y: 0 } };
  let x = left;
  for (const r of row) {
    objects[r.id] = { x: snap(x + r.w / 2), y: snap(axis) };
    x += r.w + gap;
  }
  objects.plant = { x: snap(right + gap + FOOTPRINT.plant.r), y: 0 };

  // Construction lines, for the optional ?grid overlay.
  const guides = {
    xs: [
      left,
      right,
      ...row.flatMap((r) => [objects[r.id].x - r.w / 2, objects[r.id].x + r.w / 2]),
      objects.plant.x - FOOTPRINT.plant.r,
      objects.plant.x + FOOTPRINT.plant.r,
    ],
    ys: [axis - deepest / 2, axis, axis + deepest / 2, M.front, 0],
    extent: { x0: left - 6, x1: objects.plant.x + FOOTPRINT.plant.r + 6, y0: axis - deepest / 2 - 6, y1: 26 },
  };
  // The desk surface: a margin of 0.6 gap around the whole system, so the
  // desk's edges echo the system's own spacing.
  const e = guides.extent;
  const m = gap * 0.6;
  const surface = {
    x0: e.x0 - m,
    x1: e.x1 + m,
    y0: e.y0 - m,
    y1: 36, // behind the monitor; the back edge sits under the screen
    radius: 7, // rounded plan corners
    thickness: 1.8, // a thin, refined slab
  };
  return { objects, gap, guides, surface, optical: { rubiks: cubeScale } };
}

const SYSTEM = composeSystem();

export const LAYOUT = {
  // v2.1 dark: three planes. A deep warm-graphite surround, a dark desk that
  // reads distinct from it, and the light clay objects on top.
  tone: {
    env: "#24211f", // surround, centre of the vignette
    envEdge: "#191716", // surround, at the corners
    base: "#3a3531", // desk top (matches the renders' ground bounce)
    lit: "#454039", // where the key light pools on the desk
    edge: "#302c28", // the desk's front faces
  },
  landscape: {
    stage: { left: 0.16, right: 0.84, top: 0.15, bottom: 0.89, align: 0.5 },
    maxScale: 11.5,
  },
  portrait: {
    // A closer crop of the same system: frame the front row and the plant,
    // and let the monitor run off the left edge.
    stage: { left: 0.06, right: 0.94, top: 0.16, bottom: 0.9, align: 0.5 },
    frame: ["macmini", "rubiks", "notebook", "plant"],
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
  // A soft pool of light on the desk, centred under the system.
  const light = { x: 4, y: SYSTEM.guides.ys[1] + 6, radius: orientation === "portrait" ? 62 : 82 };
  const showGrid = new URLSearchParams(location.search).has("grid");
  return {
    ...crop,
    objects,
    desk: { light, surface: SYSTEM.surface, guides: showGrid ? SYSTEM.guides : null },
  };
}
