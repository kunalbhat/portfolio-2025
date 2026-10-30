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

// A click (or tap, or Enter) puts an object in its state: the screen lights,
// the notebook opens, the cube twists. Toggles stay until clicked again. The
// lamp is the room's light switch. Every other object also pops its label.
function activate(obj, hit) {
  const ix = obj.interaction;
  if (ix.light) {
    setMode(scene.mode === "night" ? "day" : "night");
    return;
  }
  if (ix.kind === "embed") {
    scene.openEmbed(obj.id, ix);
    return;
  }
  if (ix.kind === "frames") {
    scene.playFrames(obj.id);
  } else if (ix.kind === "cycle") {
    // rest -> each pose in turn -> rest
    const poses = ["", ...ix.states];
    const next = poses[(poses.indexOf(hit.dataset.pose ?? "") + 1) % poses.length];
    hit.dataset.pose = next;
    scene.setPose(obj.id, next || null);
  } else {
    const on = hit.getAttribute("aria-pressed") !== "true";
    hit.setAttribute("aria-pressed", String(on));
    scene.setActive(obj.id, on);
  }
  scene.showLabel(obj.note ?? obj.name);
}

const scene = new DeskScene(root, manifest, OBJECTS, activate);

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
