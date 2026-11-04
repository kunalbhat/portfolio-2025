(function () {
  const { Engine, Bodies, Body, Composite, Query, Vector } = Matter;

  const canvas = document.getElementById("blocks");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const lampSwitch = document.getElementById("lamp-switch");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const theme = window.siteTheme;

  // A handful of wooden toy blocks in primary colours, set out on the rule
  // above the footer, and a little toy lamp that switches the page between
  // light and dark. Positions are in block units: `x` from the left, `y`
  // up from the floor, by bounding box.
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

  const SET = [
    // A gate: two pillars, a lintel, and a roof
    { cut: "rect", x: 0, y: 0, w: 1.25, h: 2.25, c: "blue" },
    { cut: "rect", x: 2.75, y: 0, w: 1.25, h: 2.25, c: "blue" },
    { cut: "rect", x: -0.25, y: 2.25, w: 4.5, h: 0.75, c: "yellow" },
    { cut: "roof", x: 0.25, y: 3, w: 3.5, h: 1.5, c: "red" },
    // A cube with a dome on it
    { cut: "rect", x: 4.75, y: 0, w: 1.75, h: 1.75, c: "red" },
    { cut: "dome", x: 4.75, y: 1.75, w: 1.75, h: 0.875, c: "yellow" },
    // A wedge and a cylinder, loose on the floor
    { cut: "wedge", x: 7.25, y: 0, w: 1.5, h: 1, c: "blue" },
    { cut: "disc", x: 9, y: 0, w: 1.25, h: 1.25, c: "red" },
  ];

  // The lamp: a heavy round foot, a thin stem, and a tapered shade, all one
  // body. `x` is the centre line.
  const LAMP = {
    x: 11.5,
    base: { w: 1.6, h: 0.35, c: "yellow" },
    stem: { w: 0.22, h: 1.65, c: "blue" },
    shade: { bottom: 1.8, top: 0.95, h: 1.05, c: "red" },
  };
  const SPAN = 12.75;

  // Heavy, dead wood: no bounce, lots of grip, a little air drag so a
  // rolling cylinder comes to rest
  const MATERIAL = {
    restitution: 0,
    friction: 0.9,
    frictionStatic: 1.2,
    frictionAir: 0.012,
    density: 0.004,
    slop: 0.02,
  };

  // The lamp's light, warm in either theme
  const BULB_ON = "#fff4d6";
  const BULB_OFF = "rgba(128, 128, 128, 0.35)";

  let engine, bodies, lamp, unit, width, height, dpr;
  let grip = null;
  let press = null;
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

  function shape(piece, ox, floor) {
    const w = piece.w * unit;
    const h = piece.h * unit;
    const left = ox + piece.x * unit;
    const bottom = floor - piece.y * unit;
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

  function makeLamp(ox, floor) {
    const cx = ox + LAMP.x * unit;
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

  function build() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    unit = Math.min(26, (width - 8) / SPAN);
    const floor = height;

    // No sleeping: a sleeping block left resting on one that is pulled away
    // stays hanging in the air. The loop stops itself once all is still.
    engine = Engine.create({ enableSleeping: false });
    engine.gravity.y = 1;
    engine.positionIterations = 12;
    engine.velocityIterations = 8;

    // A floor, two walls, and a ceiling at the top of the canvas, so
    // nothing can be thrown out of sight
    const t = 400;
    Composite.add(engine.world, [
      Bodies.rectangle(width / 2, floor + t / 2, width + t * 2, t, { isStatic: true, friction: 1 }),
      Bodies.rectangle(-t / 2, height / 2, t, height + t * 2, { isStatic: true }),
      Bodies.rectangle(width + t / 2, height / 2, t, height + t * 2, { isStatic: true }),
      Bodies.rectangle(width / 2, -t / 2, width + t * 2, t, { isStatic: true }),
    ]);

    lamp = makeLamp(2, floor);
    bodies = SET.map((piece) => shape(piece, 2, floor)).concat(lamp);

    // Built in place, then lifted and let go one at a time from the bottom
    // up, so the set drops to the floor and settles. The lamp comes last.
    const lift = reducedMotion.matches ? 0 : height * 0.35;
    const order = bodies
      .map((body, i) => ({ body, i }))
      .sort(
        (a, b) =>
          (a.body.isLamp ? 1 : 0) - (b.body.isLamp ? 1 : 0) ||
          b.body.bounds.max.y - a.body.bounds.max.y ||
          a.i - b.i,
      );
    drops = order.map(({ body }, n) => {
      Body.setPosition(body, { x: body.position.x, y: body.position.y - lift });
      return { body, at: reducedMotion.matches ? 0 : 120 + n * 70 };
    });
    grip = null;
    press = null;
    quiet = 0;
    acc = 0;
  }

  // The bulb's position on the canvas, wherever the lamp has got to
  function bulbAt() {
    return Vector.add(lamp.position, Vector.rotate(lamp.bulb, lamp.angle));
  }

  // Dragging. Rather than a spring, which winds up and whips the block
  // around, each step the held block is given the velocity that carries
  // the point you grabbed toward the pointer, capped so it can't outrun
  // the collisions. Gravity still turns it gently about that point, so a
  // block lifted by its corner swings to hang, and its spin is damped so it
  // settles rather than twirls. Let go, and it keeps the speed it had,
  // within limits: a flick throws it, a drop just drops it.
  //
  // A quick tap on the lamp, with hardly any movement, switches it instead.

  const HOLD = {
    follow: 0.45, // how much of the gap to the pointer to close each step
    maxSpeed: 14, // px per step while held
    spinDamp: 0.86, // angular velocity kept each step while held
    swing: 0.35, // how strongly gravity turns a held block about the grip
  };
  const THROW = { speed: 9, spin: 0.12 }; // px and radians per step
  const LIMIT = { speed: 16, spin: 0.35 }; // for any block, any time

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
      x: Math.max(pad, Math.min(width - pad, p.x)),
      y: Math.max(pad, Math.min(height - pad, p.y)),
    };
  }

  function hold() {
    if (!grip) return;
    const body = grip.body;
    const at = Vector.add(body.position, Vector.rotate(grip.offset, body.angle));
    const want = clampVector(
      Vector.mult(Vector.sub(clampTarget(grip.target), at), HOLD.follow),
      HOLD.maxSpeed,
    );
    // Ease toward that velocity, so a sudden jerk of the pointer doesn't
    // become a sudden jerk of the block
    Body.setVelocity(body, Vector.add(Vector.mult(body.velocity, 0.35), Vector.mult(want, 0.65)));

    // Gravity's turn about the grip: the centre wants to hang below it
    const arm = Vector.sub(body.position, at);
    const lever = Math.hypot(arm.x, arm.y);
    let spin = body.angularVelocity * HOLD.spinDamp;
    if (lever > unit * 0.15) {
      const lean = Math.atan2(arm.x, arm.y); // 0 when hanging straight down
      spin += Math.sin(lean) * HOLD.swing * 0.01;
    }
    Body.setAngularVelocity(body, spin);
  }

  function limit() {
    for (const body of bodies) {
      if (!body.added) continue;
      const v = clampVector(body.velocity, LIMIT.speed);
      if (v !== body.velocity) Body.setVelocity(body, v);
      if (Math.abs(body.angularVelocity) > LIMIT.spin) {
        Body.setAngularVelocity(body, Math.sign(body.angularVelocity) * LIMIT.spin);
      }
    }
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (grip || !bodies) return;
    const p = local(e);
    const body = hit(p);
    if (!body) return;
    e.preventDefault();
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (err) {}
    press = { body, x: e.clientX, y: e.clientY, t: performance.now(), moved: false };
    grip = {
      id: e.pointerId,
      body,
      target: p,
      offset: Vector.rotate(Vector.sub(p, body.position), -body.angle),
    };
    canvas.classList.add("is-holding");
    wake();
  });

  canvas.addEventListener("pointermove", (e) => {
    const p = local(e);
    if (grip) {
      if (e.pointerId !== grip.id) return;
      if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 5) {
        press.moved = true;
      }
      grip.target = p;
      wake();
    } else if (bodies) {
      const body = hit(p);
      canvas.classList.toggle("is-over", !!body && !body.isLamp);
      canvas.classList.toggle("is-over-lamp", !!body && body.isLamp);
    }
  });

  function release(e) {
    if (!grip || (e && e.pointerId !== undefined && e.pointerId !== grip.id)) return;
    const body = grip.body;
    Body.setVelocity(body, clampVector(body.velocity, THROW.speed));
    Body.setAngularVelocity(
      body,
      Math.max(-THROW.spin, Math.min(THROW.spin, body.angularVelocity)),
    );
    try {
      if (canvas.hasPointerCapture(grip.id)) canvas.releasePointerCapture(grip.id);
    } catch (err) {}
    grip = null;
    canvas.classList.remove("is-holding");
    const tap =
      press &&
      press.body.isLamp &&
      !press.moved &&
      e &&
      e.type === "pointerup" &&
      performance.now() - press.t < 450;
    press = null;
    quiet = 0;
    wake();
    if (tap) switchLamp();
  }

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
    const b = lamp && lamp.added ? bulbAt() : { x: width - 40, y: height - 60 };
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
      }
    }

    while (acc >= STEP) {
      hold();
      Engine.update(engine, STEP);
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
      drops.every((d) => d.body.added) &&
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

  let lastWidth = canvas.clientWidth;
  new ResizeObserver(() => {
    if (canvas.clientWidth === lastWidth) return;
    lastWidth = canvas.clientWidth;
    start();
  }).observe(canvas);

  start();
})();
