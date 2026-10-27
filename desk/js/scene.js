// Renders the desk: projects scene centimetres to the screen with the same
// orthographic camera as the Blender renders, draws the desk surface, and
// places each object as a component (shadow layer + visual + hit region).

import { LAYOUTS, pickLayout } from "./layouts.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)");

export class DeskScene {
  /**
   * @param {HTMLElement} root  .scene element
   * @param {object} manifest   render manifest (geometry in cm)
   * @param {import("./objects.js").DeskObject[]} objects
   * @param {(obj: import("./objects.js").DeskObject, el: HTMLElement) => void} onActivate
   */
  constructor(root, manifest, objects, onActivate) {
    this.root = root;
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
    wrap.dataset.role = obj.role;
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
    hit.setAttribute(
      "aria-label",
      obj.role === "nav" ? `${obj.name} — open ${obj.tag}` : `${obj.name} — give it a nudge`,
    );
    if (obj.section) hit.dataset.section = obj.section;
    const [w, h] = geo.size;
    hit.style.clipPath = `polygon(${geo.hull
      .map(([x, y]) => `${((x / w) * 100).toFixed(2)}% ${((y / h) * 100).toFixed(2)}%`)
      .join(",")})`;

    wrap.append(visual, hit);
    let tag = null;
    if (obj.tag) {
      tag = el("span", "tag");
      tag.textContent = obj.tag;
      tag.setAttribute("aria-hidden", "true");
      wrap.append(tag);
    }
    this.objectLayer.append(wrap);
    this.shadowLayer.append(shadow);

    const item = { obj, geo, wrap, visual, base, state, sprite, shadow, hit, tag, frame: 0 };
    const lift = (on) => {
      wrap.classList.toggle("is-lifted", on);
      shadow.classList.toggle("is-lifted", on);
    };
    hit.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && lift(true));
    hit.addEventListener("pointerleave", () => lift(false));
    hit.addEventListener("focus", () => lift(hit.matches(":focus-visible")));
    hit.addEventListener("blur", () => lift(false));
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
    const L = LAYOUTS[pickLayout(W, H)];
    this.root.dataset.layout = pickLayout(W, H);

    // Composition bounds (projected cm) from each object's image box.
    const rects = [];
    for (const item of this.items.values()) {
      const pos = L.objects[item.obj.id];
      if (!pos) continue;
      const [px, py] = this.project(pos.x, pos.y);
      const s = item.obj.optical;
      const [w, h] = item.geo.size;
      const [ax, ay] = item.geo.anchor;
      // Use the object's hull, not its shadow padding, for framing.
      const xs = item.geo.hull.map(([x]) => px + (x - ax) * s);
      const ys = item.geo.hull.map(([, y]) => py + (y - ay) * s);
      rects.push({ item, px, py, s, w, h, ax, ay, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) });
    }
    const bx0 = Math.min(...rects.map((r) => r.x0));
    const bx1 = Math.max(...rects.map((r) => r.x1));
    const by0 = Math.min(...rects.map((r) => r.y0));
    const by1 = Math.max(...rects.map((r) => r.y1));

    const st = L.stage;
    const sw = (st.right - st.left) * W;
    const sh = (st.bottom - st.top) * H;
    const scale = Math.min(sw / (bx1 - bx0), sh / (by1 - by0), L.maxScale);
    const ox = st.left * W + (sw - (bx1 - bx0) * scale) / 2 - bx0 * scale;
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
      if (item.tag) {
        const [tx, ty] = tagPoint(item.geo.hull);
        item.tag.style.left = `${((tx / r.w) * 100).toFixed(2)}%`;
        item.tag.style.top = `${((ty / r.h) * 100).toFixed(2)}%`;
      }
      item.density = scale * s * dpr > this.manifest.densities[0] * 1.15 ? 1 : 0;
      if (item.sprite) this.#prepareSprite(item);
    }

    this.#drawDesk(L.desk, ox, oy, scale, W, H);
  }

  #drawDesk(desk, ox, oy, scale, W, H) {
    const P = (x, y, z = 0) => {
      const [px, py] = this.project(x, y, z);
      return [ox + px * scale, oy + py * scale];
    };
    const far = 2000;
    const { front, right, thickness: t } = desk;
    const poly = (pts) => pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ");
    const top = [P(-far, front), P(right, front), P(right, far), P(-far, far)];
    const frontFace = [P(-far, front), P(right, front), P(right, front, -t), P(-far, front, -t)];
    const rightFace = [P(right, front), P(right, far), P(right, far, -t), P(right, front, -t)];
    const edge = [P(-far, front), P(right, front), P(right, far)];
    this.desk.setAttribute("viewBox", `0 0 ${W} ${H}`);
    this.desk.innerHTML = `
      <defs>
        <linearGradient id="desk-floor" gradientUnits="userSpaceOnUse"
          x1="${P(right, front)[0]}" y1="${P(right, front, -t)[1]}" x2="${P(right, front)[0] - 0.3 * W}" y2="${P(right, front, -t)[1] + 0.35 * H}">
          <stop offset="0" class="floor-near"/><stop offset="1" class="floor-far"/>
        </linearGradient>
      </defs>
      <rect class="floor" width="${W}" height="${H}" fill="url(#desk-floor)"/>
      <polygon class="desk-top" points="${poly(top)}"/>
      <polygon class="desk-front" points="${poly(frontFace)}"/>
      <polygon class="desk-right" points="${poly(rightFace)}"/>
      <polyline class="desk-edge" points="${poly(edge)}"/>`;
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

  setRecede(on) {
    this.root.classList.toggle("is-receded", on);
  }
}

/** Where a label sits: on the silhouette's top edge, above its horizontal centre. */
function tagPoint(hull) {
  const xs = hull.map(([x]) => x);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  let top = Infinity;
  for (let i = 0; i < hull.length; i++) {
    const [x1, y1] = hull[i];
    const [x2, y2] = hull[(i + 1) % hull.length];
    if ((x1 - cx) * (x2 - cx) <= 0 && x1 !== x2) {
      top = Math.min(top, y1 + ((cx - x1) / (x2 - x1)) * (y2 - y1));
    }
  }
  return [cx, Number.isFinite(top) ? top : Math.min(...hull.map(([, y]) => y))];
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
