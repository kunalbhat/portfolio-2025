// Desk objects and how each one reacts. Geometry (image size, ground anchor,
// hit polygon) comes from the render manifest; placement from layouts.js.

/**
 * @typedef {Object} DeskObject
 * @property {string} id          key in the render manifest
 * @property {string} name        accessible name
 * @property {number} optical     display scale for legibility (1 = true scale)
 * @property {Object} interaction
 * @property {"toggle" | "frames"} interaction.kind
 *   toggle: shows an alternate state while hovered (or, for the lamp, switches
 *   the whole scene between daylight and lamplight on click)
 *   frames: plays part of a frame sequence (the cube turns, the plant sways)
 * @property {string} [interaction.state]   alternate render for toggles
 * @property {string} interaction.label     accessible name of the control; toggles
 *   report on/off (or open/closed) through aria-pressed
 * @property {string} [interaction.frames]  frame sequence name
 * @property {number} [interaction.step]    frames advanced per activation
 * @property {boolean} [interaction.loop]   sequence returns to rest (plant)
 * @property {boolean} [interaction.light]  this toggle is the room's light (lamp)
 * @property {string} [note]  label popped on click (defaults to the name)
 */

/** @type {DeskObject[]} */
export const OBJECTS = [
  {
    id: "lamp",
    name: "Desk lamp",
    optical: 1,
    interaction: { kind: "toggle", light: true, label: "Desk lamp" },
  },
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
    optical: 1.15,
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
  {
    id: "photoframe",
    name: "Photo frame",
    optical: 1,
    interaction: { kind: "toggle", state: "next", label: "Photo frame: product work at Aura" },
    note: "Product work at Aura",
  },
  {
    id: "arcade",
    name: "Arcade cabinet",
    optical: 1,
    interaction: { kind: "toggle", state: "play", label: "Arcade cabinet: games and experiments" },
    note: "Games & experiments",
  },
];
