// Desk page entry: builds the scene, wires objects and navigation to the
// content panel, and reveals everything together once the images are ready.

import manifest from "../assets/manifest.js";
import { OBJECTS } from "./objects.js";
import { Panel } from "./panel.js";
import { DeskScene } from "./scene.js";

const root = document.querySelector(".scene");
const bySection = new Map(OBJECTS.filter((o) => o.section).map((o) => [o.section, o]));
const offTimers = new Map();

const panel = new Panel(document.querySelector(".panel"), {
  onOpen(id) {
    const obj = bySection.get(id);
    if (obj?.interaction.holdWhileOpen) {
      clearTimeout(offTimers.get(obj.id));
      scene.setActive(obj.id, true);
    }
    scene.setRecede(true);
  },
  onClose(id) {
    const obj = bySection.get(id);
    if (obj?.interaction.holdWhileOpen) {
      // Let the panel slide away before the screen goes dark / cover closes.
      offTimers.set(obj.id, setTimeout(() => scene.setActive(obj.id, false), 260));
    }
    scene.setRecede(false);
  },
});

async function activate(obj) {
  const ix = obj.interaction;
  if (ix.kind === "frames") {
    const playing = scene.playFrames(obj.id);
    if (obj.section) {
      // Let the cube start turning before the panel arrives.
      await Promise.race([playing, new Promise((r) => setTimeout(r, 200))]);
    }
  } else if (ix.state) {
    scene.setActive(obj.id, true);
    await new Promise((r) => setTimeout(r, 140));
  }
  if (obj.section) panel.open(obj.section);
}

const scene = new DeskScene(root, manifest, OBJECTS, activate);

// Header navigation opens the same panels without leaving the page.
document.querySelectorAll("[data-nav]").forEach((a) => {
  a.addEventListener("click", (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    const obj = bySection.get(a.dataset.nav);
    if (obj?.interaction.state) scene.setActive(obj.id, true);
    panel.open(a.dataset.nav);
  });
});

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
  panel.syncToUrl();
  setTimeout(() => scene.preloadSprites(), 400);
});
