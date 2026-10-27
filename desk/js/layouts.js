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
  return { objects, gap, guides, optical: { rubiks: cubeScale } };
}

const SYSTEM = composeSystem();

export const LAYOUT = {
  tone: { base: "#e7e2d8", lit: "#ebe7de" },
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
  // A faint pool of light under the front row ties the system to one plane.
  const light = { x: 0, y: SYSTEM.guides.ys[1], radius: orientation === "portrait" ? 60 : 78 };
  const showGrid = new URLSearchParams(location.search).has("grid");
  return { ...crop, objects, desk: { light, guides: showGrid ? SYSTEM.guides : null } };
}
