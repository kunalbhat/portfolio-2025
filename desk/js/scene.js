// Renders the desk: projects scene centimetres to the screen with the same
// orthographic camera as the Blender renders, draws the desk surface, and
// places each object as a component (shadow layer + visual + hit region).

import { pickLayout, resolveLayout } from "./layouts.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)");

export class DeskScene {
  /**
   * @param {HTMLElement} root  .scene element
   * @param {object} manifest   render manifest (geometry in cm)
   * @param {import("./objects.js").DeskObject[]} objects
   * @param {(obj: import("./objects.js").DeskObject, el: HTMLElement) => void} onActivate
   */
  constructor(root, manifest, objects, onActivate, variant) {
    this.root = root;
    this.variant = variant;
    this.manifest = manifest;
    this.objects = objects;
    this.onActivate = onActivate;
    const cam = manifest.camera;
    const a = (cam.azimuth * Math.PI) / 180;
    const e = (cam.elevation * Math.PI) / 180;
    this.k = { ca: Math.cos(a), sa: Math.sin(a), se: Math.sin(e), ce: Math.cos(e) };
    this.items = new Map();

    this.desk = document.createElementNS(SVG_NS, "svg");
    this.desk.classList.add("desk");
    this.desk.setAttribute("aria-hidden", "true");
    this.shadowLayer = el("div", "shadows");
    this.objectLayer = el("div", "objects");
    root.append(this.desk, this.shadowLayer, this.objectLayer);
    for (const obj of objects) this.items.set(obj.id, this.#create(obj));

    new ResizeObserver(() => this.layout()).observe(root);
  }

  /** Scene cm (x, y on the desk, z up) -> projected cm, screen-down y. */
  project(x, y, z = 0) {
    const { ca, sa, se, ce } = this.k;
    return [x * ca + y * sa, (x * sa - y * ca) * se - z * ce];
  }

  #create(obj) {
    const geo = this.manifest.objects[obj.id];
    const wrap = el("div", `obj obj-${obj.id}`);
        const visual = el("div", "visual");
    const wcm = geo.size[0];
    const base = img(geo.layers.object, "base", wcm);
    visual.append(base);
    let state = null;
    if (obj.interaction.state) {
      state = img(geo.states[obj.interaction.state], "state", wcm);
      visual.append(state);
    }
    let sprite = null;
    if (obj.interaction.frames) {
      sprite = el("div", "sprite");
      visual.append(sprite);
    }
    const shadow = img(geo.layers.shadow, "shadow", wcm);
    shadow.classList.add(`shadow-${obj.id}`);

    const hit = el("button", "hit");
    hit.type = "button";
    hit.setAttribute("aria-label", obj.interaction.label);
    if (obj.interaction.kind === "toggle") hit.setAttribute("aria-pressed", "false");
    const [w, h] = geo.size;
    hit.style.clipPath = `polygon(${geo.hull
      .map(([x, y]) => `${((x / w) * 100).toFixed(2)}% ${((y / h) * 100).toFixed(2)}%`)
      .join(",")})`;

    // Focus outline: the silhouette polygon itself, stroked, so keyboard focus
    // traces the object rather than a rectangle around its padding.
    const ring = document.createElementNS(SVG_NS, "svg");
    ring.classList.add("ring");
    ring.setAttribute("viewBox", `0 0 ${w} ${h}`);
    ring.setAttribute("preserveAspectRatio", "none");
    ring.setAttribute("aria-hidden", "true");
    const poly = document.createElementNS(SVG_NS, "polygon");
    poly.setAttribute("points", geo.hull.map(([x, y]) => `${x},${y}`).join(" "));
    poly.setAttribute("vector-effect", "non-scaling-stroke");
    ring.append(poly);
    visual.append(ring);
    wrap.append(visual, hit);
    this.objectLayer.append(wrap);
    this.shadowLayer.append(shadow);

    const item = { obj, geo, wrap, visual, base, state, sprite, shadow, hit, frame: 0 };
    const lift = (on) => {
      wrap.classList.toggle("is-lifted", on);
      shadow.classList.toggle("is-lifted", on);
    };
    hit.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && lift(true));
    hit.addEventListener("pointerleave", () => lift(false));
    hit.addEventListener("focus", () => lift(hit.matches(":focus-visible")));
    hit.addEventListener("blur", () => lift(false));
    // Pressed state for pointer and keyboard, so a tap visibly lands.
    const press = (on) => wrap.classList.toggle("is-pressed", on);
    hit.addEventListener("pointerdown", () => press(true));
    for (const ev of ["pointerup", "pointerleave", "pointercancel", "blur"]) {
      hit.addEventListener(ev, () => press(false));
    }
    hit.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && press(true));
    hit.addEventListener("keyup", () => press(false));
    hit.addEventListener("click", () => this.onActivate(obj, hit));
    return item;
  }

  /** All image elements, for a coordinated reveal once they have decoded. */
  images() {
    return [...this.root.querySelectorAll("img.base, img.shadow")];
  }

  layout() {
    const box = this.root.getBoundingClientRect();
    const W = box.width;
    const H = box.height;
    if (!W || !H) return;
    const orientation = pickLayout(W, H);
    const L = resolveLayout(this.variant, orientation);
    this.root.dataset.layout = orientation;

    // Composition bounds (projected cm) from each object's image box.
    const rects = [];
    for (const item of this.items.values()) {
      const pos = L.objects[item.obj.id];
      if (!pos) continue;
      const [px, py] = this.project(pos.x, pos.y);
      const s = pos.optical ?? item.obj.optical;
      const [w, h] = item.geo.size;
      const [ax, ay] = item.geo.anchor;
      // Use the object's hull, not its shadow padding, for framing.
      const xs = item.geo.hull.map(([x]) => px + (x - ax) * s);
      const ys = item.geo.hull.map(([, y]) => py + (y - ay) * s);
      rects.push({ item, px, py, s, w, h, ax, ay, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) });
    }
    // Frame the composition on its key objects only; anything else (the plant
    // on a phone, say) may run off the edge like a crop of a larger desk.
    const framed = rects.filter((r) => !L.frame || L.frame.includes(r.item.obj.id));
    const bx0 = Math.min(...framed.map((r) => r.x0));
    const bx1 = Math.max(...framed.map((r) => r.x1));
    const by0 = Math.min(...framed.map((r) => r.y0));
    const by1 = Math.max(...framed.map((r) => r.y1));

    const st = L.stage;
    const sw = (st.right - st.left) * W;
    const sh = (st.bottom - st.top) * H;
    const scale = Math.min(sw / (bx1 - bx0), sh / (by1 - by0), L.maxScale);
    const ox = st.left * W + (sw - (bx1 - bx0) * scale) * (st.alignX ?? 0.5) - bx0 * scale;
    const oy = st.top * H + (sh - (by1 - by0) * scale) * (st.align ?? 0.5) - by0 * scale;
    this.scale = scale;
    this.root.style.setProperty("--cm", `${scale}px`);

    const dpr = window.devicePixelRatio || 1;
    for (const r of rects) {
      const { item, s } = r;
      const left = ox + (r.px - r.ax * s) * scale;
      const top = oy + (r.py - r.ay * s) * scale;
      const width = r.w * s * scale;
      const height = r.h * s * scale;
      for (const node of [item.wrap, item.shadow]) {
        Object.assign(node.style, {
          left: `${left}px`,
          top: `${top}px`,
          width: `${width}px`,
          height: `${height}px`,
        });
      }
      // Farther objects (higher on screen) sit behind nearer ones.
      item.wrap.style.zIndex = String(Math.round(r.py * 10) + 1000);
      for (const im of [...item.wrap.querySelectorAll("img"), item.shadow]) {
        im.sizes = `${Math.ceil(width)}px`;
        if (!im.getAttribute("srcset")) {
          im.srcset = im.dataset.srcset;
          im.src = im.dataset.src;
        }
      }
      item.density = scale * s * dpr > this.manifest.densities[0] * 1.15 ? 1 : 0;
      if (item.sprite) this.#prepareSprite(item);
    }

    this.#drawDesk(L.desk, ox, oy, scale, W, H);
  }

  /**
   * The desk is one continuous surface that runs past every edge of the
   * window: no edges, no thickness, nothing that reads as a platform. A very
   * soft pool of light, centred where the key light falls on the arrangement,
   * ties the objects into one lit scene instead of stickers on a flat colour.
   */
  #drawDesk(desk, ox, oy, scale, W, H) {
    const [lx, ly] = this.project(desk.light.x, desk.light.y);
    const cx = ox + lx * scale;
    const cy = oy + ly * scale;
    const r = desk.light.radius * scale;
    this.desk.setAttribute("viewBox", `0 0 ${W} ${H}`);
    this.desk.innerHTML = `
      <defs>
        <radialGradient id="desk-light" gradientUnits="userSpaceOnUse"
          cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}"
          gradientTransform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) scale(1.35 0.8) translate(${(-cx).toFixed(1)} ${(-cy).toFixed(1)})">
          <stop offset="0" class="desk-lit"/>
          <stop offset="1" class="desk-base"/>
        </radialGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#desk-light)"/>`;
  }

  // -- frame sequences --------------------------------------------------------
  #prepareSprite(item) {
    const f = item.geo.frames[item.obj.interaction.frames];
    const files = f.files;
    const key = Object.keys(files)[item.density] ?? Object.keys(files)[0];
    const url = `/desk/assets/${files[key]}`;
    if (item.sprite.dataset.url !== url) {
      item.sprite.dataset.url = url;
      item.sprite.style.backgroundImage = `url("${url}")`;
      item.sprite.style.backgroundSize = `${f.cols * 100}% ${f.rows * 100}%`;
    }
    this.#showFrame(item, item.frame);
  }

  /** Warm the sprite sheets once the scene is visible, so first taps are instant. */
  preloadSprites() {
    for (const item of this.items.values()) {
      if (item.sprite?.dataset.url) {
        const im = new Image();
        im.src = item.sprite.dataset.url;
      }
    }
  }

  #showFrame(item, i) {
    const f = item.geo.frames[item.obj.interaction.frames];
    const col = i % f.cols;
    const row = Math.floor(i / f.cols);
    item.sprite.style.backgroundPosition = `${(col / (f.cols - 1)) * 100}% ${(row / Math.max(1, f.rows - 1)) * 100}%`;
    const showing = i !== 0;
    item.sprite.classList.toggle("is-on", showing);
    item.base.classList.toggle("is-off", showing);
  }

  /** Play `step` frames forward with an ease-out; resolves when done. */
  playFrames(id) {
    const item = this.items.get(id);
    const ix = item.obj.interaction;
    const f = item.geo.frames[ix.frames];
    if (item.playing) return item.playing;
    if (REDUCED.matches) return Promise.resolve();
    const from = item.frame;
    const steps = ix.step;
    const duration = ix.loop ? 900 : 380;
    const t0 = performance.now();
    item.playing = new Promise((resolve) => {
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / duration);
        const eased = ix.loop ? p : 1 - Math.pow(1 - p, 3);
        const i = (from + Math.round(eased * steps)) % f.count;
        this.#showFrame(item, i);
        if (p < 1) requestAnimationFrame(tick);
        else {
          item.frame = (from + steps) % f.count;
          this.#showFrame(item, item.frame);
          item.playing = null;
          resolve();
        }
      };
      requestAnimationFrame(tick);
    });
    return item.playing;
  }

  /** Show or hide an object's alternate render (screen on, notebook open). */
  setActive(id, on) {
    const item = this.items.get(id);
    if (!item?.state) return;
    item.wrap.classList.toggle("is-active", on);
  }
}

function el(tag, cls) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  return n;
}

/** Image with 1x/2x WebP width descriptors; `sizes` is set at layout time. */
function img(files, cls, widthCm) {
  const im = document.createElement("img");
  im.className = cls;
  im.alt = "";
  im.decoding = "async";
  im.draggable = false;
  const entries = Object.entries(files);
  // Sources are attached on first layout, once `sizes` is known, so the
  // browser fetches the right density exactly once.
  im.dataset.srcset = entries
    .map(([density, file]) => `/desk/assets/${file} ${Math.round(widthCm * Number(density))}w`)
    .join(", ");
  im.dataset.src = `/desk/assets/${entries[0][1]}`;
  return im;
}
