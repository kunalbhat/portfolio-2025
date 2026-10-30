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

let nightTimer;
function setMode(mode, { initial = false } = {}) {
  scene.setMode(mode);
  html.dataset.mode = mode;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", TONES[mode].env);
  const lamp = root.querySelector(".obj-lamp .hit");
  lamp?.setAttribute("aria-pressed", String(mode === "night"));
  // The neon name follows the room: on at night, buzzing on just after the
  // lamp catches; off with the daylight. (On load it buzzes on with the
  // entrance instead, whatever the light.)
  if (initial) return;
  clearTimeout(nightTimer);
  if (mode === "night") nightTimer = setTimeout(() => setNeon(true), 900);
  else setNeon(false);
}

// The name in the corner, in neon: the Blender sign's renders, cropped to its
// tubes. Unlit and lit, once per light, crossfading like the desk objects.
const logo = document.querySelector(".logo");
function buildLogo() {
  const geo = manifest.objects.neon;
  const xs = geo.hull.map(([x]) => x);
  const ys = geo.hull.map(([, y]) => y);
  const [x0, y0] = [Math.min(...xs), Math.min(...ys)];
  const crop = document.createElement("span");
  crop.className = "logo-crop";
  crop.setAttribute("aria-hidden", "true");
  crop.style.aspectRatio = `${Math.max(...xs) - x0} / ${Math.max(...ys) - y0}`;
  const w = Math.max(...xs) - x0;
  for (const [m, g] of Object.entries(geo.modes)) {
    for (const [cls, files] of [["off", g.layers.object], ["on", g.states.on]]) {
      const im = document.createElement("img");
      im.className = `logo-${cls} m-${m}`;
      im.src = `/desk/assets/${files["16"]}`;
      im.alt = "";
      im.decoding = "async";
      // Position the full render so only the tubes show in the crop.
      im.style.width = `${(geo.size[0] / w) * 100}%`;
      im.style.left = `${(-x0 / w) * 100}%`;
      im.style.top = `${(-y0 / w) * 100}cqw`;
      crop.append(im);
    }
  }
  logo.prepend(crop);
}
buildLogo();
logo.addEventListener("click", () => setNeon(logo.getAttribute("aria-pressed") !== "true"));

function setNeon(on) {
  logo.setAttribute("aria-pressed", String(on));
}

function setToggle(id, on) {
  root.querySelector(`.obj-${id} .hit`)?.setAttribute("aria-pressed", String(on));
  scene.setActive(id, on);
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
    setToggle(obj.id, hit.getAttribute("aria-pressed") !== "true");
  }
  scene.showLabel(obj.note ?? obj.name);
}

const scene = new DeskScene(root, manifest, OBJECTS, activate);

// Start in the light the visitor's system prefers (?mode= overrides, for review).
const asked = new URLSearchParams(location.search).get("mode");
const prefersDark = matchMedia("(prefers-color-scheme: dark)").matches;
html.classList.add("no-transition");
setMode(asked === "night" || asked === "day" ? asked : prefersDark ? "night" : "day", { initial: true });

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
      // The name fades in unlit, then buzzes on.
      nightTimer = setTimeout(() => setNeon(true), 700);
      setTimeout(() => scene.preloadSprites(), 900);
    }),
  );
});
