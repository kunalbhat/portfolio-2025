// Art-directed desk compositions.
//
// Scene coordinates are real centimetres on the desk plane, in the same frame
// as the Blender renders (style v1.3, the mirrored front-left camera): +x runs
// to the right on screen and toward the viewer, +y away from the viewer.
// scene.js projects them with the renders' orthographic camera, so every
// arrangement is one physical desk seen through one lens.
//
// The monitor sits at the origin in every variation (its foot spans roughly
// x −10…10, y 7…23; the screen stands at y≈10, x −31…31, bottom edge 10.5 cm
// up). Everything else is placed in relation to it.
//
// Each variation has a desk tone and two crops: `landscape` and `portrait`.
// `stage` is the screen region (fractions of the viewport) the `frame`
// objects are fitted into; `align`/`alignX` bias where spare room goes;
// objects outside `frame` may run off the window like a crop of the desk.

const MONITOR = { x: 0, y: 10 };

export const VARIANTS = {
  // A — Workstation. The Mac mini sits square beside the stand, the notebook
  // and cube gather front-right as one small group, and the plant stands
  // just behind the screen's right edge.
  a: {
    name: "Workstation",
    tone: { base: "#e7e2d8", lit: "#ebe7de" },
    objects: {
      monitor: MONITOR,
      macmini: { x: -18, y: 7 },
      notebook: { x: 16, y: -12 },
      rubiks: { x: 4, y: -17 },
      plant: { x: 47, y: 21 },
    },
    landscape: { stage: { left: 0.18, right: 0.84, top: 0.14, bottom: 0.9, align: 0.5 }, maxScale: 11.5 },
    portrait: {
      // Frame the front group within the screen; the monitor rises behind it
      // and may run off an edge, the plant may crop.
      stage: { left: 0.05, right: 0.95, top: 0.44, bottom: 0.84, align: 0.5 },
      frame: ["macmini", "rubiks", "notebook"],
      maxScale: 11,
      optical: { rubiks: 1.35 },
    },
  },

  // B — Corner. The Mac mini tucks under the screen's right corner, the
  // notebook and cube sit front-left, and the plant balances from the far
  // left, set back.
  b: {
    name: "Corner",
    tone: { base: "#e9e5dd", lit: "#eeebe4" },
    objects: {
      monitor: MONITOR,
      macmini: { x: 19, y: 3 },
      notebook: { x: -19, y: -13 },
      rubiks: { x: -6, y: -19 },
      plant: { x: -42, y: 9 },
    },
    landscape: { stage: { left: 0.16, right: 0.86, top: 0.14, bottom: 0.9, align: 0.5 }, maxScale: 11.5 },
    portrait: {
      // Frame the front group within the screen; the monitor rises behind it
      // and may run off an edge, the plant may crop.
      stage: { left: 0.05, right: 0.95, top: 0.44, bottom: 0.84, align: 0.5 },
      frame: ["macmini", "rubiks", "notebook"],
      maxScale: 11,
      optical: { rubiks: 1.35 },
    },
  },

  // C — Close still life. Everything pulled in tight: the notebook against
  // the stand's front corner, the cube between it and the Mac mini, and the
  // plant partly hidden behind the screen, so the desk reads as one
  // overlapping silhouette.
  c: {
    name: "Close",
    tone: { base: "#e3ded4", lit: "#e8e4db" },
    objects: {
      monitor: { x: 0, y: 12 },
      macmini: { x: -16, y: 3 },
      notebook: { x: 13, y: -7 },
      rubiks: { x: -2, y: -12 },
      plant: { x: 45, y: 25 },
    },
    landscape: { stage: { left: 0.22, right: 0.8, top: 0.14, bottom: 0.9, align: 0.5 }, maxScale: 12.5 },
    portrait: {
      // Frame the front group within the screen; the monitor rises behind it
      // and may run off an edge, the plant may crop.
      stage: { left: 0.05, right: 0.95, top: 0.44, bottom: 0.84, align: 0.5 },
      frame: ["macmini", "rubiks", "notebook"],
      maxScale: 11,
      optical: { rubiks: 1.3 },
    },
  },
};

export const DEFAULT_VARIANT = "a";

/** The variation named by ?v= in the URL, else the default. */
export function currentVariant() {
  const v = new URLSearchParams(location.search).get("v");
  return VARIANTS[v] ? v : DEFAULT_VARIANT;
}

/** Choose a crop by aspect ratio, not device type. */
export function pickLayout(width, height) {
  return width / height < 0.9 ? "portrait" : "landscape";
}

/** Resolve one variation + crop into the layout scene.js lays out. */
export function resolveLayout(variantId, orientation) {
  const V = VARIANTS[variantId];
  const crop = V[orientation];
  const objects = {};
  for (const [id, pos] of Object.entries(V.objects)) {
    objects[id] = { ...pos, optical: crop.optical?.[id] };
  }
  // The faint pool of light sits under the main group, in front of the screen.
  const m = V.objects.monitor;
  const light = { x: m.x + 2, y: m.y - 14, radius: orientation === "portrait" ? 62 : 80 };
  return { ...crop, objects, desk: { light } };
}
