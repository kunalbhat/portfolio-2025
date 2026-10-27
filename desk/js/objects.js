// Desk objects and how each one reacts. Geometry (image size, ground anchor,
// hit polygon) comes from the render manifest; placement from layouts.js.

/**
 * @typedef {Object} DeskObject
 * @property {string} id          key in the render manifest
 * @property {string} name        accessible name
 * @property {number} optical     display scale for legibility (1 = true scale)
 * @property {Object} interaction
 * @property {"toggle" | "frames"} interaction.kind
 *   toggle: switches between the resting render and an alternate state
 *   frames: plays part of a frame sequence (the cube turns, the plant sways)
 * @property {string} [interaction.state]   alternate render for toggles
 * @property {string} interaction.label     accessible name of the control; toggles
 *   report on/off (or open/closed) through aria-pressed
 * @property {string} [interaction.frames]  frame sequence name
 * @property {number} [interaction.step]    frames advanced per activation
 * @property {boolean} [interaction.loop]   sequence returns to rest (plant)
 */

/** @type {DeskObject[]} */
export const OBJECTS = [
  {
    id: "monitor",
    name: "Monitor",
    optical: 1,
    interaction: { kind: "toggle", state: "on", label: "Monitor screen" },
  },
  {
    id: "macmini",
    name: "Mac mini",
    optical: 1.05,
    interaction: { kind: "toggle", state: "on", label: "Mac mini" },
  },
  {
    id: "rubiks",
    name: "Rubik's cube",
    optical: 1.3,
    interaction: { kind: "frames", frames: "twist", step: 9, label: "Twist the Rubik’s cube" },
  },
  {
    id: "notebook",
    name: "Notebook",
    optical: 1,
    interaction: { kind: "toggle", state: "open", label: "Notebook cover" },
  },
  {
    id: "plant",
    name: "Pilea plant",
    optical: 1,
    interaction: { kind: "frames", frames: "sway", step: 12, loop: true, label: "Nudge the plant" },
  },
];
