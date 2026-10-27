// Desk page entry: builds the scene, wires each object's reaction, and
// reveals everything together once the images are ready.

import manifest from "../assets/manifest.js";
import { VARIANTS, currentVariant } from "./layouts.js";
import { OBJECTS } from "./objects.js";
import { DeskScene } from "./scene.js";

const root = document.querySelector(".scene");

// Desk tone comes from the chosen variation (?v=a|b|c).
const variant = currentVariant();
const tone = VARIANTS[variant].tone;
document.documentElement.style.setProperty("--desk-top", tone.base);
document.documentElement.style.setProperty("--desk-lit", tone.lit);
document.querySelector('meta[name="theme-color"]')?.setAttribute("content", tone.base);
document.documentElement.dataset.variant = variant;

function activate(obj, hit) {
  const ix = obj.interaction;
  if (ix.kind === "frames") {
    scene.playFrames(obj.id);
  } else {
    const on = hit.getAttribute("aria-pressed") !== "true";
    hit.setAttribute("aria-pressed", String(on));
    scene.setActive(obj.id, on);
  }
}

const scene = new DeskScene(root, manifest, OBJECTS, activate, variant);

// Coordinated reveal: lay out, wait for every resting image to decode (or
// fail), then fade the objects in together over the already-drawn desk.
scene.layout();
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
