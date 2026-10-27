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

function activate(obj, hit) {
  const ix = obj.interaction;
  if (ix.kind === "frames") {
    scene.playFrames(obj.id);
  } else if (ix.light) {
    setMode(scene.mode === "night" ? "day" : "night");
  } else {
    const on = hit.getAttribute("aria-pressed") !== "true";
    hit.setAttribute("aria-pressed", String(on));
    scene.setActive(obj.id, on);
  }
}

const scene = new DeskScene(root, manifest, OBJECTS, activate);

// Start in the light the visitor's system prefers (?mode= overrides, for review).
const asked = new URLSearchParams(location.search).get("mode");
const prefersDark = matchMedia("(prefers-color-scheme: dark)").matches;
html.classList.add("no-transition");
setMode(asked === "night" || asked === "day" ? asked : prefersDark ? "night" : "day");

// Coordinated reveal: lay out, wait for every resting image of the current
// light to decode (or fail), then fade the objects in together.
scene.layout();
requestAnimationFrame(() => requestAnimationFrame(() => html.classList.remove("no-transition")));
const ready = scene.images().map((im) =>
  (im.complete ? Promise.resolve() : new Promise((r) => im.addEventListener("load", r, { once: true }))).then(
    () => im.decode().catch(() => {}),
  ),
);
const timeout = new Promise((r) => setTimeout(r, 4000));
Promise.race([Promise.all(ready), timeout]).then(() => {
  root.classList.add("is-ready");
  setTimeout(() => scene.preloadSprites(), 400);
});
