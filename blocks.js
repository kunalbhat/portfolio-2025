(function () {
  const { Engine, Events, Bodies, Body, Composite, Query, Vector } = Matter;

  const canvas = document.getElementById("blocks");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const lampSwitch = document.getElementById("lamp-switch");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const theme = window.siteTheme;

  // A handful of wooden toy blocks in primary colours, tossed in from the
  // left edge of the window to land in a jumble on the rule above the
  // footer, for visitors to build with; and a little toy lamp, standing at
  // the right, that switches the page between light and dark. Sizes are in
  // block units.
  //
  //   rect      a block or plank
  //   roof      an isosceles triangle, point up
  //   wedge     a right triangle, square corner bottom left
  //   dome      a half disc, flat side down
  //   disc      a cylinder seen end on
  const COLORS = {
    red: "#d83a2e",
    blue: "#2350b4",
    yellow: "#f2b827",
  };

  // Enough for a gate with a roof, a domed tower, and a few odd pieces
  const SET = [
    { cut: "rect", w: 1.25, h: 2.25, c: "blue" },
    { cut: "rect", w: 1.25, h: 2.25, c: "blue" },
    { cut: "rect", w: 4.5, h: 0.75, c: "yellow" },
    { cut: "roof", w: 3.5, h: 1.5, c: "red" },
    { cut: "rect", w: 1.75, h: 1.75, c: "red" },
    { cut: "dome", w: 1.75, h: 0.875, c: "yellow" },
    { cut: "wedge", w: 1.5, h: 1, c: "blue" },
    { cut: "disc", w: 1.25, h: 1.25, c: "red" },
  ];

  // The lamp: a heavy round foot, a thin stem, and a tapered shade, all one
  // body
  const LAMP = {
    base: { w: 1.6, h: 0.35, c: "yellow" },
    stem: { w: 0.22, h: 1.65, c: "blue" },
    shade: { bottom: 1.8, top: 0.95, h: 1.05, c: "red" },
  };
  const SPAN = 12.75;

  // Heavy, dead wood for building with: no bounce, a lot of grip so a
  // block set on another stays put, and enough air drag that things come
  // to rest promptly instead of sliding and rolling about
  const MATERIAL = {
    restitution: 0,
    friction: 1,
    frictionStatic: 2,
    frictionAir: 0.025,
    density: 0.004,
    slop: 0.015,
  };

  // The left wall is left out of a block's collisions until it has been
  // tossed in past it
  const WALL = 0x0002;
  const ALL = 0xffffffff;

  // The lamp's light, warm in either theme
  const BULB_ON = "#fff4d6";
  const BULB_OFF = "rgba(128, 128, 128, 0.35)";

  let engine, bodies, lamp, unit, width, height, dpr, bleed, column;
  let grip = null;
  let press = null;
  let lastTap = null;
  let quiet = 0;
  let focused = false;
  let running = false;
  let visible = true;
  let last = 0;
  let acc = 0;
  let drops = [];
  let started = 0;

  // How lit the lamp is, 0 to 1, easing toward `glowTarget`
  let glowTarget = theme && theme.current() === "dark" ? 0 : 1;
  let glow = glowTarget;
  let glowFrom = glow;
  let glowStart = 0;
  const GLOW_MS = 650;

  function place(body, left, top) {
    // fromVertices recentres on the centroid; move it so the bounding box
    // lands where the piece says
    const b = body.bounds;
    Body.setPosition(body, {
      x: body.position.x + left - b.min.x,
      y: body.position.y + top - b.min.y,
    });
    return body;
  }

  // Each piece is cut with its bounding box at the origin; build() moves
  // it to where it starts
  function shape(piece) {
    const w = piece.w * unit;
    const h = piece.h * unit;
    const left = 0;
    const bottom = h;
    let verts;

    switch (piece.cut) {
      case "roof":
        verts = [
          { x: 0, y: h },
          { x: w / 2, y: 0 },
          { x: w, y: h },
        ];
        break;
      case "wedge":
        verts = [
          { x: 0, y: h },
          { x: 0, y: 0 },
          { x: w, y: h },
        ];
        break;
      case "dome": {
        verts = [];
        const steps = 18;
        for (let i = 0; i <= steps; i++) {
          const a = Math.PI + (i / steps) * Math.PI;
          verts.push({
            x: w / 2 + Math.cos(a) * (w / 2),
            y: h + Math.sin(a) * h,
          });
        }
        break;
      }
      case "disc": {
        const body = Bodies.circle(left + w / 2, bottom - h / 2, w / 2, MATERIAL, 28);
        body.piece = piece;
        return body;
      }
      default: {
        const body = Bodies.rectangle(left + w / 2, bottom - h / 2, w, h, {
          ...MATERIAL,
          chamfer: { radius: Math.min(2, unit * 0.06) },
        });
        body.piece = piece;
        return body;
      }
    }

    const body = place(Bodies.fromVertices(0, 0, [verts], MATERIAL), left, bottom - h);
    body.piece = piece;
    return body;
  }

  function makeLamp(cx, floor) {
    const { base, stem, shade } = LAMP;
    const r = Math.min(2, unit * 0.06);

    // The foot is dense, so the lamp stands up and rights itself easily
    const foot = Bodies.rectangle(cx, floor - (base.h * unit) / 2, base.w * unit, base.h * unit, {
      density: 0.02,
      chamfer: { radius: r },
    });
    const stemTop = floor - (base.h + stem.h) * unit;
    const pole = Bodies.rectangle(cx, floor - (base.h + stem.h / 2) * unit, stem.w * unit, stem.h * unit + 2, {
      density: 0.003,
    });
    const sw = shade.bottom * unit;
    const st = shade.top * unit;
    const sh = shade.h * unit;
    const hood = place(
      Bodies.fromVertices(
        0,
        0,
        [
          [
            { x: 0, y: sh },
            { x: (sw - st) / 2, y: 0 },
            { x: (sw + st) / 2, y: 0 },
            { x: sw, y: sh },
          ],
        ],
        { density: 0.002 },
      ),
      cx - sw / 2,
      stemTop - sh + 0.25 * unit,
    );
    foot.fill = COLORS[base.c];
    pole.fill = COLORS[stem.c];
    hood.fill = COLORS[shade.c];

    const { density, ...wood } = MATERIAL;
    const body = Body.create({ ...wood, parts: [foot, pole, hood] });
    body.piece = { cut: "lamp" };
    body.isLamp = true;
    // Where the bulb hangs, under the middle of the shade, relative to the
    // body's centre while it stands upright
    const bulb = { x: cx, y: stemTop + 0.25 * unit };
    body.bulb = Vector.sub(bulb, body.position);
    body.bulbR = unit * 0.3;
    body.coneHalf = sw / 2 - unit * 0.06;
    return body;
  }

  function shuffle(list) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }

  function build() {
    // The canvas reaches left past the text column to the edge of the
    // window, so the blocks can come in from off screen. `bleed` is that
    // extra width; the column, where they land and play, starts after it.
    const figure = canvas.parentElement;
    column = figure.clientWidth;
    bleed = Math.max(0, Math.round(figure.getBoundingClientRect().left));
    canvas.style.marginLeft = `${-bleed}px`;
    canvas.style.width = `${column + bleed}px`;

    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = column + bleed;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    unit = Math.min(26, (column - 8) / SPAN);
    const floor = height;

    // No sleeping: a sleeping block left resting on one that is pulled away
    // stays hanging in the air. The loop stops itself once all is still.
    engine = Engine.create({ enableSleeping: false });
    engine.gravity.y = 1;
    engine.positionIterations = 14;
    engine.velocityIterations = 10;

    // A floor, walls at either end of the column, and a ceiling at the top
    // of the canvas, so nothing can get out of sight
    const t = 400;
    Composite.add(engine.world, [
      Bodies.rectangle(width / 2, floor + t / 2, width + t * 2, t, { isStatic: true, friction: 1 }),
      Bodies.rectangle(bleed - t / 2, height / 2, t, height + t * 2, {
        isStatic: true,
        collisionFilter: { category: WALL },
      }),
      Bodies.rectangle(width + t / 2, height / 2, t, height + t * 2, { isStatic: true }),
      Bodies.rectangle(width / 2, -t / 2, width + t * 2, t, { isStatic: true }),
    ]);

    // The lamp stands at the right end from the start
    lamp = makeLamp(width - unit * 1.3, floor);
    lamp.added = true;
    Composite.add(engine.world, lamp);

    // Where each block will come down: spread along the floor between the
    // start of the column and the lamp, in no particular order
    const pieces = SET.map((piece) => shape(piece));
    const from = bleed + unit * 1.4;
    const to = lamp.bounds.min.x - unit * 3.2;
    const slots = shuffle(pieces.map((_, i) => from + ((i + 0.5) / pieces.length) * (to - from)));
    const g = 0.001 * engine.gravity.y * (1000 / 60) ** 2; // px per frame²

    // The farthest spots are thrown to first, so later throws don't have
    // to clear the ones already down
    bodies = [lamp];
    const throws = pieces
      .map((body, i) => ({ body, tx: slots[i] + (Math.random() - 0.5) * unit * 0.6 }))
      .sort((a, b) => b.tx - a.tx);
    drops = throws.map(({ body, tx }, n) => {
      const bw = body.bounds.max.x - body.bounds.min.x;
      const bh = body.bounds.max.y - body.bounds.min.y;
      bodies.push(body);

      if (reducedMotion.matches) {
        Body.setPosition(body, { x: tx, y: floor - bh / 2 - 1 });
        return { body, at: 0, v: { x: 0, y: 0 }, spin: 0 };
      }

      // Thrown underarm from just off the left edge of the window: a short,
      // low arc timed to come down on its spot, turning as it goes
      const r = Math.hypot(bw, bh) / 2;
      const x0 = -r - 4;
      const y0 = height * (0.42 + Math.random() * 0.16);
      const frames = 40 + Math.random() * 14;
      const land = floor - bh / 2;
      let vy = (land - y0 - 0.5 * g * frames * frames) / frames;
      // Keep the top of the arc under the ceiling
      const apex = y0 - (vy * vy) / (2 * g);
      if (apex < r + 4) vy = -Math.sqrt(Math.max(0, 2 * g * (y0 - r - 4)));
      const vx = (tx - x0) / frames;

      // No air drag in flight, so the arc comes down where it's aimed;
      // it comes back on the first touch
      Body.setPosition(body, { x: x0, y: y0 });
      Body.setAngle(body, (Math.random() - 0.5) * 0.8);
      body.collisionFilter.mask = ALL & ~WALL;
      body.entering = true;
      body.flying = true;
      body.frictionAir = 0;
      return {
        body,
        at: 250 + n * 150,
        v: { x: vx, y: vy },
        spin: (Math.random() - 0.5) * 0.16,
      };
    });
    Events.on(engine, "collisionStart", (event) => {
      for (const pair of event.pairs) {
        for (const body of [pair.bodyA.parent, pair.bodyB.parent]) {
          if (body.flying) {
            body.flying = false;
            body.frictionAir = MATERIAL.frictionAir;
          }
        }
      }
    });

    grip = null;
    press = null;
    lastTap = null;
    quiet = 0;
    acc = 0;
  }

  // The bulb's position on the canvas, wherever the lamp has got to
  function bulbAt() {
    return Vector.add(lamp.position, Vector.rotate(lamp.bulb, lamp.angle));
  }

  // Dragging, tuned for building rather than throwing. Each step the held
  // block is given the velocity that carries the point you grabbed toward
  // the pointer, capped, and while held it is made light, so knocking into
  // the others it gives way and nudges them rather than barging through. It doesn't
  // swing: it eases to the nearest quarter turn and holds it, so it lines
  // up with whatever you set it on. Let go and it is set down, not thrown.
  //
  // To turn a block: while holding it, scroll or press R (Shift+R the
  // other way); or double-click it where it lies. A quick tap on the lamp
  // switches it instead.

  const QUARTER = Math.PI / 2;
  const HOLD = {
    follow: 0.38, // how much of the gap to the pointer to close each step
    ease: 0.6, // how much of that velocity to take on each step
    maxSpeed: 8, // px per frame while held
    lightness: 0.12, // a held block's mass, as a share of its own
    turn: 0.18, // how much of the gap to the target angle to close
    maxTurn: 0.12, // radians per frame
  };
  const SET_DOWN = { speed: 2.5, spin: 0.03 }; // what a block keeps on release
  const LIMIT = { speed: 14, spin: 0.3 }; // for any block, once it's in play

  function local(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function hit(p) {
    const found = Query.point(bodies.filter((b) => b.added), p);
    return found[found.length - 1] || null;
  }

  function clampVector(v, max) {
    const m = Math.hypot(v.x, v.y);
    return m > max ? Vector.mult(v, max / m) : v;
  }

  function clampTarget(p) {
    const pad = unit * 0.25;
    return {
      x: Math.max(bleed + pad, Math.min(width - pad, p.x)),
      y: Math.max(pad, Math.min(height - pad, p.y)),
    };
  }

  function squared(angle) {
    return Math.round(angle / QUARTER) * QUARTER;
  }

  function hold() {
    if (!grip) return;
    const body = grip.body;
    const at = Vector.add(body.position, Vector.rotate(grip.offset, body.angle));
    const gap = Vector.sub(clampTarget(grip.target), at);
    const want = clampVector(Vector.mult(gap, HOLD.follow), HOLD.maxSpeed);
    Body.setVelocity(
      body,
      Vector.add(Vector.mult(body.velocity, 1 - HOLD.ease), Vector.mult(want, HOLD.ease)),
    );
    const turn = grip.angle - body.angle;
    Body.setAngularVelocity(
      body,
      Math.max(-HOLD.maxTurn, Math.min(HOLD.maxTurn, turn * HOLD.turn)),
    );

    // A turn in place finishes by itself once the block is square again
    if (grip.auto) {
      grip.frames++;
      const done =
        (Math.abs(turn) < 0.02 && Math.hypot(gap.x, gap.y) < 2 && grip.frames > 10) ||
        grip.frames > 70;
      if (done) letGo();
    }
  }

  function limit() {
    for (const body of bodies) {
      if (!body.added || body.entering) continue;
      const v = clampVector(body.velocity, LIMIT.speed);
      if (v !== body.velocity) Body.setVelocity(body, v);
      if (Math.abs(body.angularVelocity) > LIMIT.spin) {
        Body.setAngularVelocity(body, Math.sign(body.angularVelocity) * LIMIT.spin);
      }
    }
  }

  // Once a tossed block is clear of the left wall, it collides with it. One
  // that knocks into another and stalls before it's in is nudged along.
  function admit() {
    for (const body of bodies) {
      if (!body.entering) continue;
      if (body.bounds.min.x > bleed + 1) {
        body.entering = false;
        body.collisionFilter.mask = ALL;
      } else if (!body.flying && body.velocity.x < 1.5 && !(grip && grip.body === body)) {
        Body.setVelocity(body, { x: 2.5, y: Math.min(body.velocity.y, 0) - 0.4 });
      }
    }
  }

  function take(next) {
    next.mass = next.body.mass;
    Body.setMass(next.body, next.mass * HOLD.lightness);
    grip = next;
  }

  // Set the held block down: it keeps only a little of its motion, and if
  // it is all but square, it is squared exactly so stacks sit flush
  function letGo() {
    if (!grip) return;
    const body = grip.body;
    Body.setVelocity(body, clampVector(body.velocity, SET_DOWN.speed));
    Body.setAngularVelocity(
      body,
      Math.max(-SET_DOWN.spin, Math.min(SET_DOWN.spin, body.angularVelocity)),
    );
    if (Math.abs(grip.angle - body.angle) < 0.05) {
      Body.setAngle(body, grip.angle);
      Body.setAngularVelocity(body, 0);
    }
    Body.setMass(body, grip.mass);
    if (grip.id !== null) {
      try {
        if (canvas.hasPointerCapture(grip.id)) canvas.releasePointerCapture(grip.id);
      } catch (err) {}
    }
    grip = null;
    canvas.classList.remove("is-holding");
    quiet = 0;
    wake();
  }

  // Turn a block a quarter: the held one, or one lying on the floor, which
  // is lifted just clear, turned, and set back down
  function turn(body, dir) {
    if (grip && !grip.auto && grip.body === body) {
      grip.angle += dir * QUARTER;
      wake();
      return;
    }
    if (grip) letGo();
    const bw = body.bounds.max.x - body.bounds.min.x;
    const bh = body.bounds.max.y - body.bounds.min.y;
    const lift = Math.max(0, (bw - bh) / 2) + 3;
    take({
      id: null,
      auto: true,
      frames: 0,
      body,
      offset: { x: 0, y: 0 },
      target: { x: body.position.x, y: body.position.y - lift },
      angle: squared(body.angle) + dir * QUARTER,
    });
    wake();
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (!bodies) return;
    if (grip && !grip.auto) return;
    const p = local(e);
    const body = hit(p);
    if (!body) return;
    if (grip) letGo();
    e.preventDefault();
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (err) {}
    press = { body, x: e.clientX, y: e.clientY, t: performance.now(), moved: false };
    take({
      id: e.pointerId,
      body,
      target: p,
      offset: Vector.rotate(Vector.sub(p, body.position), -body.angle),
      angle: squared(body.angle),
    });
    canvas.classList.add("is-holding");
    wake();
  });

  canvas.addEventListener("pointermove", (e) => {
    const p = local(e);
    if (grip && !grip.auto) {
      if (e.pointerId !== grip.id) return;
      if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 5) {
        press.moved = true;
      }
      grip.target = p;
      wake();
    } else if (bodies) {
      // Booleans, always: classList.toggle with `undefined` flips the class
      // on every move instead of setting it, and the cursor flickers
      const body = hit(p);
      const lampy = !!(body && body.isLamp);
      canvas.classList.toggle("is-over", !!body && !lampy);
      canvas.classList.toggle("is-over-lamp", lampy);
    }
  });

  function release(e) {
    if (!grip || grip.auto) return;
    if (e && e.pointerId !== undefined && e.pointerId !== grip.id) return;
    const now = performance.now();
    const tap =
      press && !press.moved && e && e.type === "pointerup" && now - press.t < 350;
    const body = press && press.body;
    press = null;
    letGo();
    if (!tap) {
      lastTap = null;
      return;
    }
    if (body.isLamp) {
      lastTap = null;
      switchLamp();
    } else if (lastTap && lastTap.body === body && now - lastTap.t < 400) {
      lastTap = null;
      turn(body, 1);
    } else {
      lastTap = { body, t: now };
    }
  }

  canvas.addEventListener(
    "wheel",
    (e) => {
      if (!grip || grip.auto) return;
      e.preventDefault();
      const now = performance.now();
      if (now - (grip.wheel || 0) < 240) return;
      const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (Math.abs(d) < 1) return;
      grip.wheel = now;
      turn(grip.body, Math.sign(d));
    },
    { passive: false },
  );

  window.addEventListener("keydown", (e) => {
    if (!grip || grip.auto || (e.key !== "r" && e.key !== "R")) return;
    e.preventDefault();
    turn(grip.body, e.shiftKey ? -1 : 1);
  });

  // However the press ends, the block is let go: released over the page,
  // outside the window, cancelled by the browser, or the tab hidden
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("lostpointercapture", release);
  window.addEventListener("blur", () => release());
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) release();
  });
  canvas.addEventListener("pointerleave", () => {
    if (grip) return;
    canvas.classList.remove("is-over", "is-over-lamp");
  });

  function switchLamp() {
    if (!theme) return;
    const r = canvas.getBoundingClientRect();
    const b = lamp ? bulbAt() : { x: width - 40, y: height - 60 };
    theme.toggle({ x: r.left + b.x, y: r.top + b.y });
  }

  if (lampSwitch) {
    lampSwitch.addEventListener("click", switchLamp);
    lampSwitch.addEventListener("focus", () => {
      focused = true;
      draw();
    });
    lampSwitch.addEventListener("blur", () => {
      focused = false;
      draw();
    });
  }

  function labelSwitch() {
    if (!lampSwitch) return;
    const on = glowTarget === 1;
    lampSwitch.setAttribute("aria-pressed", String(on));
    lampSwitch.textContent = on ? "Turn the lamp off (dark mode)" : "Turn the lamp on (light mode)";
  }
  labelSwitch();

  window.addEventListener("themechange", (e) => {
    glowTarget = e.detail.theme === "dark" ? 0 : 1;
    labelSwitch();
    if (!e.detail.animated) {
      // A view transition is about to snapshot the page, and the bloom out
      // of the bulb is the animation, so show the lamp in its new state now
      glow = glowFrom = glowTarget;
      draw();
      return;
    }
    glowFrom = glow;
    glowStart = performance.now();
    wake();
  });

  // Drawing

  function easeGlow(now) {
    if (glow === glowTarget) return;
    const t = Math.min(1, (now - glowStart) / GLOW_MS);
    const k = 1 - Math.pow(1 - t, 3);
    glow = t >= 1 ? glowTarget : glowFrom + (glowTarget - glowFrom) * k;
  }

  function trace(part) {
    const v = part.vertices;
    ctx.moveTo(v[0].x, v[0].y);
    for (let i = 1; i < v.length; i++) ctx.lineTo(v[i].x, v[i].y);
    ctx.closePath();
  }

  function drawLight() {
    if (!lamp || !lamp.added || glow <= 0.001) return;
    const b = bulbAt();
    const down = Vector.rotate({ x: 0, y: 1 }, lamp.angle);
    const across = Vector.perp(down);
    const reach = Math.max(height, unit * 6);
    const near = lamp.coneHalf;
    const farHalf = near + reach * 0.55;

    // A soft cone of light falling from the shade
    ctx.save();
    const cone = ctx.createLinearGradient(b.x, b.y, b.x + down.x * reach, b.y + down.y * reach);
    cone.addColorStop(0, `rgba(255, 214, 120, ${0.3 * glow})`);
    cone.addColorStop(0.6, `rgba(255, 214, 120, ${0.08 * glow})`);
    cone.addColorStop(1, "rgba(255, 214, 120, 0)");
    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.moveTo(b.x + across.x * near, b.y + across.y * near);
    ctx.lineTo(b.x - across.x * near, b.y - across.y * near);
    ctx.lineTo(
      b.x - across.x * farHalf + down.x * reach,
      b.y - across.y * farHalf + down.y * reach,
    );
    ctx.lineTo(
      b.x + across.x * farHalf + down.x * reach,
      b.y + across.y * farHalf + down.y * reach,
    );
    ctx.closePath();
    ctx.fill();

    // And a halo round the bulb
    const halo = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, unit * 3.2);
    halo.addColorStop(0, `rgba(255, 226, 150, ${0.45 * glow})`);
    halo.addColorStop(1, "rgba(255, 226, 150, 0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(b.x, b.y, unit * 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawBulb() {
    const b = bulbAt();
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(lamp.angle);
    ctx.fillStyle = BULB_OFF;
    ctx.beginPath();
    ctx.arc(0, 0, lamp.bulbR, 0, Math.PI);
    ctx.fill();
    if (glow > 0.001) {
      ctx.globalAlpha = glow;
      ctx.fillStyle = BULB_ON;
      ctx.fill();
    }
    ctx.restore();
  }

  function draw() {
    if (!bodies) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    drawLight();

    for (const body of bodies) {
      if (!body.added) continue;

      if (body.isLamp) {
        for (const part of body.parts.slice(1)) {
          ctx.fillStyle = part.fill;
          ctx.beginPath();
          trace(part);
          ctx.fill();
        }
        drawBulb();
        if (focused) {
          const bb = body.bounds;
          ctx.strokeStyle = getComputedStyle(canvas).color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(bb.min.x - 5, bb.min.y - 5, bb.max.x - bb.min.x + 10, bb.max.y - bb.min.y + 8, 4);
          ctx.stroke();
        }
        continue;
      }

      ctx.fillStyle = COLORS[body.piece.c];
      ctx.beginPath();
      if (body.circleRadius) {
        ctx.arc(body.position.x, body.position.y, body.circleRadius, 0, Math.PI * 2);
      } else {
        for (const part of body.parts.length > 1 ? body.parts.slice(1) : [body]) {
          trace(part);
        }
      }
      ctx.fill();

      // A small dot marks the cylinder's axle, so you can see it roll
      if (body.circleRadius) {
        const r = body.circleRadius * 0.55;
        ctx.fillStyle = "rgba(0,0,0,0.14)";
        ctx.beginPath();
        ctx.arc(
          body.position.x + Math.cos(body.angle) * r,
          body.position.y + Math.sin(body.angle) * r,
          body.circleRadius * 0.12,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }
  }

  // The loop runs while the blocks are on screen and anything is moving

  // Two physics steps a frame keep fast blocks from passing through thin
  // ones. The loop stops once everything has been still for half a second.
  const STEP = 1000 / 120;
  const STILL = { speed: 0.06, spin: 0.002, frames: 30 };

  function frame(now) {
    if (!running) return;
    if (!last) last = now;
    acc += Math.min(now - last, 100);
    last = now;

    const elapsed = now - started;
    for (const d of drops) {
      if (!d.body.added && elapsed >= d.at) {
        d.body.added = true;
        Composite.add(engine.world, d.body);
        Body.setVelocity(d.body, d.v);
        Body.setAngularVelocity(d.body, d.spin);
      }
    }

    while (acc >= STEP) {
      hold();
      Engine.update(engine, STEP);
      admit();
      limit();
      acc -= STEP;
    }
    easeGlow(now);
    draw();

    const still = bodies.every(
      (b) => b.speed < STILL.speed && Math.abs(b.angularVelocity) < STILL.spin,
    );
    quiet = still ? quiet + 1 : 0;
    const settled =
      !grip &&
      glow === glowTarget &&
      drops.every((d) => d.body.added && !d.body.entering) &&
      quiet > STILL.frames;
    if (settled || !visible) {
      running = false;
      last = 0;
      return;
    }
    requestAnimationFrame(frame);
  }

  function wake() {
    if (running || !visible) return;
    running = true;
    last = 0;
    requestAnimationFrame(frame);
  }

  function start() {
    build();
    started = performance.now();
    running = false;
    wake();
    draw();
  }

  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible) wake();
  }).observe(canvas);

  // Rebuild when the column changes size or moves; the blocks are tossed
  // in afresh
  let layout = "";
  let pending = 0;
  function relayout() {
    const figure = canvas.parentElement;
    const next = `${figure.clientWidth}:${Math.round(figure.getBoundingClientRect().left)}`;
    if (next === layout) return;
    layout = next;
    clearTimeout(pending);
    pending = setTimeout(start, 150);
  }
  new ResizeObserver(relayout).observe(canvas.parentElement);
  window.addEventListener("resize", relayout);

  layout = `${canvas.parentElement.clientWidth}:${Math.round(
    canvas.parentElement.getBoundingClientRect().left,
  )}`;
  start();
})();
