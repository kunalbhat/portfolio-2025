// Desk page entry: builds the scene, wires each object's reaction, and
// reveals everything together once the images are ready.

import manifest from "../assets/manifest.js";
import { LAYOUT } from "./layouts.js";
import { OBJECTS } from "./objects.js";
import { DeskScene } from "./scene.js";

const root = document.querySelector(".scene");

const tone = LAYOUT.tone;
const rootStyle = document.documentElement.style;
rootStyle.setProperty("--env", tone.env);
rootStyle.setProperty("--env-edge", tone.envEdge);
rootStyle.setProperty("--desk-top", tone.base);
rootStyle.setProperty("--desk-lit", tone.lit);
rootStyle.setProperty("--desk-edge", tone.edge);
document.querySelector('meta[name="theme-color"]')?.setAttribute("content", tone.env);

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

const scene = new DeskScene(root, manifest, OBJECTS, activate);

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
