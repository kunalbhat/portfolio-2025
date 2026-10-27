// Art-directed desk compositions, one per viewport shape.
//
// Scene coordinates are real centimetres on the desk plane, in the same frame
// as the Blender renders: +x runs along the desk (toward the lower right on
// screen), +y runs away from the viewer (upper right), z is up. scene.js
// projects them with the renders' orthographic camera, so these read as one
// desk seen through one lens: moving an object here moves it across that desk.
//
// Arrangement notes (true scale unless an `optical` override is given). The
// view is the mirrored v1.2 camera (front-left), so the desk reads right to left:
//   monitor   the anchor, set back on the desk
//   macmini   tucked in front of the screen's left side
//   notebook  front right, at its natural slight angle
//   rubiks    within reach, just left of the notebook
//   plant     standing apart on the right as a counterweight
//
// `stage` is the screen region (fractions of the viewport) the `frame`
// objects are fitted into; `align`/`alignX` bias where spare room goes.
// Objects outside `frame` may run off the window, like a crop of the desk.
// The desk surface itself never shows an edge.

export const LAYOUTS = {
  landscape: {
    stage: { left: 0.14, right: 0.86, top: 0.13, bottom: 0.91, alignX: 0.5, align: 0.52 },
    maxScale: 11.5, // CSS px per cm, so huge windows don't blow objects up
    objects: {
      plant: { x: 62, y: 13 },
      monitor: { x: 0, y: 10 },
      macmini: { x: -21, y: 0 },
      notebook: { x: 17, y: -14 },
      rubiks: { x: -2, y: -20 },
    },
    desk: { light: { x: 6, y: -4, radius: 90 } },
  },
  portrait: {
    // A closer, editorial crop of the same desk: the monitor runs off the
    // left edge, the plant is cut by the right one, and the notebook, cube
    // and Mac mini gather in front of the screen as the focal cluster.
    stage: { left: -0.2, right: 0.98, top: 0.08, bottom: 0.94, alignX: 0.6, align: 0.4 },
    maxScale: 12,
    frame: ["monitor", "macmini", "rubiks", "notebook"],
    objects: {
      plant: { x: 54, y: 6 },
      monitor: { x: 0, y: 8 },
      macmini: { x: -12, y: -9 },
      notebook: { x: 25, y: -15 },
      rubiks: { x: 3, y: -21, optical: 1.35 },
    },
    desk: { light: { x: 4, y: -6, radius: 70 } },
  },
};

/** Choose a composition by aspect ratio, not device type. */
export function pickLayout(width, height) {
  return width / height < 0.9 ? "portrait" : "landscape";
}
