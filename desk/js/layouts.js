// Art-directed desk compositions, one per viewport shape.
//
// Scene coordinates are real centimetres on the desk plane, in the same frame
// as the Blender renders: +x runs along the desk's front edge (toward the
// lower right on screen), +y runs away from the viewer (upper right), z is up.
// scene.js projects them with the renders' orthographic camera, so moving an
// object here moves it across a physically consistent desk.
//
// `stage` is the screen region (fractions of the viewport) the composition is
// fitted into; the desk itself always runs off the edges of the window.

export const LAYOUTS = {
  landscape: {
    stage: { left: 0.3, right: 0.94, top: 0.11, bottom: 0.92 },
    maxScale: 13, // CSS px per cm, so huge windows don't blow objects up
    objects: {
      plant: { x: -58, y: 8 },
      monitor: { x: -2, y: 4 },
      macmini: { x: 40, y: -3 },
      notebook: { x: -34, y: -38 },
      rubiks: { x: 15, y: -33 },
    },
    desk: { front: -60, right: 400, thickness: 3.4 },
  },
  portrait: {
    stage: { left: 0.04, right: 0.96, top: 0.27, bottom: 0.9, align: 0.35 },
    maxScale: 11,
    objects: {
      monitor: { x: 6, y: 18 },
      plant: { x: -44, y: 24 },
      macmini: { x: 46, y: 6 },
      notebook: { x: -16, y: -26 },
      rubiks: { x: 22, y: -22 },
    },
    desk: { front: -66, right: 400, thickness: 3.4 },
  },
};

/** Choose a composition by aspect ratio, not device type. */
export function pickLayout(width, height) {
  return width / height < 0.9 ? "portrait" : "landscape";
}
