// Desk objects: what each one is, what it does, and where it leads.
// Geometry (image size, ground anchor, hit polygon) comes from the render
// manifest; placement comes from layouts.js. Nothing here knows about pixels.

/**
 * @typedef {"nav" | "decor"} ObjectRole
 * @typedef {"state" | "frames"} InteractionKind
 *
 * @typedef {Object} DeskObject
 * @property {string} id                  key in the render manifest
 * @property {string} name                what it is (accessible name)
 * @property {ObjectRole} role            nav objects open a section; decor objects only react
 * @property {string} [section]           section id in content.js (nav objects)
 * @property {string} [tag]               short visible label
 * @property {number} optical             display scale for legibility (1 = true scale)
 * @property {Object} interaction
 * @property {InteractionKind} interaction.kind
 * @property {string} [interaction.state]   alternate render shown while active
 * @property {string} [interaction.frames]  frame sequence played on activation
 * @property {number} [interaction.step]    frames advanced per activation
 * @property {boolean} [interaction.holdWhileOpen] keep the active state while its section is open
 */

/** @type {DeskObject[]} */
export const OBJECTS = [
  {
    id: "monitor",
    name: "Monitor",
    role: "nav",
    section: "work",
    tag: "Work",
    optical: 1,
    interaction: { kind: "state", state: "on", holdWhileOpen: true },
  },
  {
    id: "macmini",
    name: "Mac mini",
    role: "nav",
    section: "builds",
    tag: "Builds",
    optical: 1.12,
    interaction: { kind: "state", state: "on", holdWhileOpen: true },
  },
  {
    id: "rubiks",
    name: "Rubik's cube",
    role: "nav",
    section: "play",
    tag: "Play",
    optical: 1.5,
    interaction: { kind: "frames", frames: "twist", step: 9 },
  },
  {
    id: "notebook",
    name: "Notebook",
    role: "nav",
    section: "about",
    tag: "About",
    optical: 1,
    interaction: { kind: "state", state: "open", holdWhileOpen: true },
  },
  {
    id: "plant",
    name: "Pilea plant",
    role: "decor",
    optical: 1.08,
    interaction: { kind: "frames", frames: "sway", step: 12, loop: true },
  },
];
