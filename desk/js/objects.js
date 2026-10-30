// Desk objects and how each one reacts. Geometry (image size, ground anchor,
// hit polygon) comes from the render manifest; placement from layouts.js.

/**
 * @typedef {Object} DeskObject
 * @property {string} id          key in the render manifest
 * @property {string} name        accessible name
 * @property {number} optical     display scale for legibility (1 = true scale)
 * @property {Object} interaction
 * @property {"toggle" | "frames" | "cycle" | "embed"} interaction.kind
 *   toggle: switches between the resting render and an alternate state (or,
 *   for the lamp, the whole scene between daylight and lamplight)
 *   frames: plays part of a frame sequence (the cube turns, the plant sways)
 *   cycle: each click shows the next pose, then returns to rest (Nougat)
 *   embed: opens a live page in a card over the desk (the Orbit player)
 * @property {string} [interaction.url]     page an embed opens
 * @property {string} [interaction.title]   accessible name of that page
 * @property {string} [interaction.state]   alternate render for toggles
 * @property {string[]} [interaction.states] poses for cycles, in order
 * @property {string} interaction.label     accessible name of the control; toggles
 *   report on/off (or open/closed) through aria-pressed
 * @property {string} [interaction.frames]  frame sequence name
 * @property {number} [interaction.step]    frames advanced per activation
 * @property {boolean} [interaction.loop]   sequence returns to rest (plant)
 * @property {boolean} [interaction.light]  this toggle is the room's light (lamp)
 * @property {boolean} [interaction.night]  this toggle follows the room: on at
 *   night, off by day, and still clickable (the neon sign)
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
  {
    id: "cup",
    name: "Coffee cup",
    optical: 1,
    interaction: { kind: "toggle", state: "empty", label: "Coffee cup" },
    note: "Coffee",
  },
  {
    id: "nougat",
    name: "Nougat",
    optical: 1,
    interaction: { kind: "cycle", states: ["curious", "happy"], label: "Nougat" },
    note: "Nougat",
  },
  {
    id: "turntable",
    name: "Orbit turntable",
    optical: 1,
    interaction: {
      kind: "embed",
      url: "https://my.spline.design/orbitmusicplayer-vezc8aVt508k2edHtSjm1vNz/",
      title: "Orbit music player",
      label: "Orbit: open the music player",
    },
  },
  {
    id: "neon",
    name: "Neon sign",
    optical: 1,
    interaction: { kind: "toggle", state: "on", night: true, label: "Neon sign: kunal" },
    note: "Kunal Bhat",
  },
];
