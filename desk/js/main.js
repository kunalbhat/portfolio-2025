// Desk page entry: builds the scene, wires each object's reaction, and
// reveals everything together once the images are ready.
//
// The lamp is the room's light switch. Off: daylight. On: dusk, lit by the
// lamp. Both lights are rendered in Blender (same materials, different light),
// and the page crossfades between them in a choreographed order (desk.css).

import manifest from "../assets/manifest.js";
import { TONES } from "./layouts.js";
import { OBJECTS } from "./objects.js";
import { DeskScene } from "./scene.js";

const root = document.querySelector(".scene");
const html = document.documentElement;

// Both palettes as CSS custom properties; desk.css picks one by data-mode.
for (const [mode, tone] of Object.entries(TONES)) {
  for (const [key, value] of Object.entries(tone)) {
    html.style.setProperty(`--${mode}-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`, value);
  }
}

function setMode(mode) {
  scene.setMode(mode);
  html.dataset.mode = mode;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", TONES[mode].env);
  const lamp = root.querySelector(".obj-lamp .hit");
  lamp?.setAttribute("aria-pressed", String(mode === "night"));
}

// Hover (or keyboard focus) brings an object into its state: the screen
// lights, the notebook opens, the cube twists. The lamp is the exception: it
// is a switch, so it only answers a click.
function hover(obj, on) {
  const ix = obj.interaction;
  if (ix.light) return;
  if (ix.kind === "frames") {
    if (on) scene.playFrames(obj.id);
  } else {
    scene.setActive(obj.id, on);
  }
}

// A click pops the object's label. Touch has no hover, so a tap also plays the
// state (and the state leaves again when focus moves on); the keyboard replays
// one-shot motions (cube, plant) on Enter.
function activate(obj, hit, how) {
  const ix = obj.interaction;
  if (ix.light) {
    setMode(scene.mode === "night" ? "day" : "night");
    return;
  }
  if (how === "touch" || how === "pen") {
    if (ix.kind === "frames") scene.playFrames(obj.id);
    else scene.setActive(obj.id, !scene.isActive(obj.id));
  } else if (how === "keyboard" && ix.kind === "frames") {
    scene.playFrames(obj.id);
  }
  scene.showLabel(obj.note ?? obj.name);
}

const scene = new DeskScene(root, manifest, OBJECTS, activate);
scene.onHover = hover;

// Start in the light the visitor's system prefers (?mode= overrides, for review).
const asked = new URLSearchParams(location.search).get("mode");
const prefersDark = matchMedia("(prefers-color-scheme: dark)").matches;
html.classList.add("no-transition");
setMode(asked === "night" || asked === "day" ? asked : prefersDark ? "night" : "day");

// Coordinated entrance: lay out, wait for every resting image of the current
// light to decode (or fail), then bring in the desk and the objects (desk.css).
scene.layout();
requestAnimationFrame(() => requestAnimationFrame(() => html.classList.remove("no-transition")));
const ready = scene.images().map((im) =>
  (im.complete ? Promise.resolve() : new Promise((r) => im.addEventListener("load", r, { once: true }))).then(
    () => im.decode().catch(() => {}),
  ),
);
const timeout = new Promise((r) => setTimeout(r, 4000));
Promise.race([Promise.all(ready), timeout]).then(() => {
  // Start the entrance on a fresh frame, after the hidden state has painted
  // with transitions on, so every step animates from the very start.
  html.classList.remove("no-transition");
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      root.classList.add("is-ready");
      html.classList.add("is-ready");
      setTimeout(() => root.classList.add("is-settled"), 1900);
      setTimeout(() => scene.preloadSprites(), 900);
    }),
  );
});
