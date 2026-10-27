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
    // One small text label, popped by a click or tap (and announced).
    this.label = el("p", "desk-label");
    this.label.setAttribute("role", "status");
    this.label.setAttribute("aria-live", "polite");
    root.append(this.desk, this.shadowLayer, this.objectLayer, this.label);
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
    const shadow = el("div", `shadow shadow-${obj.id}`);
    const wcm = geo.size[0];
    // One set of layers per light (day, night), stacked; the scene's mode
    // crossfades between them. Both share one crop, anchor and silhouette.
    const modes = {};
    for (const [m, g] of Object.entries(geo.modes)) {
      const layer = el("div", `layer m-${m}`);
      const base = img(g.layers.object, "base", wcm);
      layer.append(base);
      let state = null;
      if (obj.interaction.state) {
        state = img(g.states[obj.interaction.state], "state", wcm);
        layer.append(state);
      }
      let sprite = null;
      if (obj.interaction.frames) {
        sprite = el("div", "sprite");
        layer.append(sprite);
      }
      visual.append(layer);
      const sh = img(g.layers.shadow, `m-${m}`, wcm);
      shadow.append(sh);
      modes[m] = { geo: g, base, state, sprite, shadow: sh };
    }

    const hit = el("button", "hit");
    hit.type = "button";
    hit.setAttribute("aria-label", obj.interaction.label);
    if (obj.interaction.light) hit.setAttribute("aria-pressed", "false");
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

    const item = { obj, geo, wrap, visual, modes, shadow, hit, frame: 0 };
    const lift = (on) => {
      wrap.classList.toggle("is-lifted", on);
      shadow.classList.toggle("is-lifted", on);
    };
    // Hover (mouse) or keyboard focus brings an object into its state; a
    // click or tap is reported separately, with how it happened, so touch
    // (which has no hover) can play the state on tap instead.
    const hover = (on) => this.onHover?.(obj, on);
    let pointer = "mouse";
    hit.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse") return;
      lift(true);
      hover(true);
    });
    hit.addEventListener("pointerleave", (e) => {
      lift(false);
      if (e.pointerType === "mouse") hover(false);
    });
    hit.addEventListener("focus", () => {
      const keyboard = hit.matches(":focus-visible");
      lift(keyboard);
      if (keyboard) hover(true);
    });
    hit.addEventListener("blur", () => {
      lift(false);
      hover(false);
    });
    // Pressed state for pointer and keyboard, so a tap visibly lands.
    const press = (on) => wrap.classList.toggle("is-pressed", on);
    hit.addEventListener("pointerdown", (e) => {
      pointer = e.pointerType || "mouse";
      press(true);
    });
    for (const ev of ["pointerup", "pointerleave", "pointercancel", "blur"]) {
      hit.addEventListener(ev, () => press(false));
    }
    hit.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && press(true));
    hit.addEventListener("keyup", () => press(false));
    hit.addEventListener("click", (e) => this.onActivate(obj, hit, e.detail === 0 ? "keyboard" : pointer));
    return item;
  }

  /** All image elements, for a coordinated reveal once they have decoded. */
  images() {
    const m = this.mode;
    return [...this.root.querySelectorAll(`.layer.m-${m} img.base, .shadow img.m-${m}`)];
  }

  /** Daylight or lamplight: the whole scene follows the lamp. */
  setMode(mode) {
    this.mode = mode;
    this.root.dataset.mode = mode;
  }

  layout() {
    const box = this.root.getBoundingClientRect();
    const W = box.width;
    const H = box.height;
    if (!W || !H) return;
    const orientation = pickLayout(W, H);
    const L = resolveLayout(orientation);
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
    // Optionally the whole desk slab too, so its edges never clip.
    if (L.frameDesk) {
      const S = L.desk.surface;
      const corners = [[S.x0, S.y0], [S.x1, S.y0], [S.x1, S.y1], [S.x0, S.y1]];
      const p = corners.map(([x, y]) => this.project(x, y, 0)).concat(corners.map(([x, y]) => this.project(x, y, -S.thickness)));
      framed.push({ x0: Math.min(...p.map((q) => q[0])), x1: Math.max(...p.map((q) => q[0])), y0: Math.min(...p.map((q) => q[1])), y1: Math.max(...p.map((q) => q[1])) });
    }
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
      for (const im of [...item.wrap.querySelectorAll("img"), ...item.shadow.querySelectorAll("img")]) {
        im.sizes = `${Math.ceil(width)}px`;
        if (!im.getAttribute("srcset")) {
          im.srcset = im.dataset.srcset;
          im.src = im.dataset.src;
        }
      }
      item.density = scale * s * dpr > this.manifest.densities[0] * 1.15 ? 1 : 0;
      if (item.obj.interaction.frames) this.#prepareSprite(item);
    }

    this.#drawDesk(L.desk, ox, oy, scale, W, H);
  }

  /**
   * The desk is one continuous surface that runs past every edge of the
   * window: no edges, no thickness, nothing that reads as a platform. A very
   * soft pool of light, centred where the key light falls on the arrangement,
   * ties the objects into one lit scene instead of stickers on a flat colour.
   */
  /**
   * Three planes: the surround (CSS background + vignette), the desk surface
   * drawn here on the desk plane with the renders' own camera, and the
   * objects above it. The desk is a rounded slab: a soft drop shadow onto the
   * surround, a thin front face, and a top with a gentle pool of key light.
   */
  #drawDesk(desk, ox, oy, scale, W, H) {
    const P = (x, y, z = 0) => {
      const [px, py] = this.project(x, y, z);
      return [ox + px * scale, oy + py * scale];
    };
    const pts = (list) => list.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ");
    const S = desk.surface;
    const outline = roundedRect(S.x0, S.y0, S.x1, S.y1, S.radius);
    const top = outline.map(([x, y]) => P(x, y));
    const under = outline.map(([x, y]) => P(x, y, -S.thickness));
    const [lx, ly] = P(desk.light.x, desk.light.y);
    // The lamp's pool: a circle on the desk plane, so its gradient is mapped
    // through the camera (a projected circle is an ellipse).
    const { ca, sa, se } = this.k;
    const R = desk.pool.radius * scale;
    const [qx, qy] = P(desk.pool.x, desk.pool.y);
    const pm = [ca * R, sa * se * R, sa * R, -ca * se * R, qx, qy].map((v) => v.toFixed(2)).join(" ");
    const r = desk.light.radius * scale;
    const blur = Math.max(6, scale * 2.2);
    const drop = scale * 2.4;
    this.desk.setAttribute("viewBox", `0 0 ${W} ${H}`);
    this.desk.innerHTML = `
      <defs>
        <radialGradient id="desk-light" gradientUnits="userSpaceOnUse"
          cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="${r.toFixed(1)}"
          gradientTransform="translate(${lx.toFixed(1)} ${ly.toFixed(1)}) scale(1.4 0.82) translate(${(-lx).toFixed(1)} ${(-ly).toFixed(1)})">
          <stop offset="0" class="desk-lit"/>
          <stop offset="1" class="desk-base"/>
        </radialGradient>
        <radialGradient id="lamp-pool" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1"
          gradientTransform="matrix(${pm})">
          <stop offset="0" stop-color="#fff1ea"/>
          <stop offset="0.12" stop-color="#ffd8cd"/>
          <stop offset="0.3" stop-color="#ee6d64" stop-opacity="0.96"/>
          <stop offset="0.5" stop-color="#b21d36" stop-opacity="0.8"/>
          <stop offset="0.72" stop-color="#7e0a32" stop-opacity="0.42"/>
          <stop offset="1" stop-color="#600832" stop-opacity="0"/>
        </radialGradient>
        <filter id="desk-drop" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="${blur.toFixed(1)}"/>
        </filter>
      </defs>
      <polygon class="desk-drop" filter="url(#desk-drop)" transform="translate(0 ${drop.toFixed(1)})" points="${pts(under)}"/>
      <polygon class="desk-side" points="${pts(under)}"/>
      <polygon class="desk-side" points="${pts(sweep(top, under))}"/>
      <polygon class="desk-top" fill="url(#desk-light)" points="${pts(top)}"/>
      <polygon class="lamp-pool" fill="url(#lamp-pool)" points="${pts(top)}"
        style="transform-origin: ${qx.toFixed(1)}px ${qy.toFixed(1)}px"/>
      <polygon class="desk-rim" points="${pts(top)}"/>
      ${desk.guides ? this.#guides(desk.guides, ox, oy, scale) : ""}`;
  }

  /** Construction lines of the layout system, drawn on the desk plane (?grid). */
  #guides(g, ox, oy, scale) {
    const P = (x, y) => {
      const [px, py] = this.project(x, y);
      return `${(ox + px * scale).toFixed(1)},${(oy + py * scale).toFixed(1)}`;
    };
    const { x0, x1, y0, y1 } = g.extent;
    const lines = [
      ...g.xs.map((x) => `<polyline points="${P(x, y0)} ${P(x, y1)}"/>`),
      ...g.ys.map((y) => `<polyline points="${P(x0, y)} ${P(x1, y)}"/>`),
    ];
    return `<g class="guides">${lines.join("")}</g>`;
  }

  // -- frame sequences --------------------------------------------------------
  #prepareSprite(item) {
    for (const m of Object.values(item.modes)) {
      const f = m.geo.frames[item.obj.interaction.frames];
      const files = f.files;
      const key = Object.keys(files)[item.density] ?? Object.keys(files)[0];
      const url = `/desk/assets/${files[key]}`;
      if (m.sprite.dataset.url !== url) {
        m.sprite.dataset.url = url;
        m.sprite.style.backgroundImage = `url("${url}")`;
        m.sprite.style.backgroundSize = `${f.cols * 100}% ${f.rows * 100}%`;
      }
    }
    this.#showFrame(item, item.frame);
  }

  /** Warm the sprite sheets once the scene is visible, so first taps are instant. */
  preloadSprites() {
    for (const item of this.items.values()) {
      for (const m of Object.values(item.modes)) {
        if (m.sprite?.dataset.url) {
          const im = new Image();
          im.src = m.sprite.dataset.url;
        }
      }
    }
  }

  #frames(item) {
    return item.geo.modes.day.frames[item.obj.interaction.frames];
  }

  #showFrame(item, i) {
    const f = this.#frames(item);
    const col = i % f.cols;
    const row = Math.floor(i / f.cols);
    const showing = i !== 0;
    for (const m of Object.values(item.modes)) {
      m.sprite.style.backgroundPosition = `${(col / (f.cols - 1)) * 100}% ${(row / Math.max(1, f.rows - 1)) * 100}%`;
      m.sprite.classList.toggle("is-on", showing);
      m.base.classList.toggle("is-off", showing);
    }
  }

  /** Play `step` frames forward with an ease-out; resolves when done. */
  playFrames(id) {
    const item = this.items.get(id);
    const ix = item.obj.interaction;
    const f = this.#frames(item);
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

  isActive(id) {
    return this.items.get(id)?.wrap.classList.contains("is-active") ?? false;
  }

  /** Pop the label for a moment. */
  showLabel(text) {
    clearTimeout(this.labelTimer);
    this.label.textContent = text;
    this.label.classList.remove("is-shown");
    void this.label.offsetWidth; // restart the pop if one is already showing
    this.label.classList.add("is-shown");
    this.labelTimer = setTimeout(() => this.label.classList.remove("is-shown"), 2600);
  }

  /** Show or hide an object's alternate render (screen on, notebook open). */
  setActive(id, on) {
    const item = this.items.get(id);
    if (!item?.obj.interaction.state) return;
    item.wrap.classList.toggle("is-active", on);
  }
}

/** A rounded rectangle on the desk plane, as a list of [x, y] points. */
function roundedRect(x0, y0, x1, y1, r, seg = 10) {
  const out = [];
  const corners = [
    [x1 - r, y1 - r, 0],
    [x0 + r, y1 - r, 90],
    [x0 + r, y0 + r, 180],
    [x1 - r, y0 + r, 270],
  ];
  for (const [cx, cy, start] of corners) {
    for (let i = 0; i <= seg; i++) {
      const a = ((start + (90 * i) / seg) * Math.PI) / 180;
      out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  }
  return out;
}

/**
 * The slab's side, as one polygon: every top point joined to the point
 * below it. Drawn behind the top face, only the front-facing band shows.
 */
function sweep(top, under) {
  return [...top, ...under.slice().reverse(), top[0]];
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
