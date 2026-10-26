(function () {
  const { Engine, Body, Bodies, Composite, Events, Query, Vertices } = Matter;

  const canvas = document.getElementById("sculpture");
  const ctx = canvas.getContext("2d");
  const rebuildButton = document.getElementById("rebuild");
  const masthead = document.querySelector(".masthead");
  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // KUNAL BHAT built like a pile of heavy blocks that hold each other up,
  // in one of two arrangements: wide, for most windows, and tall, for
  // phones and other narrow windows.
  //
  // Wide stacks it KUN / ALB / HAT. The A stands on the H and leans out
  // past it. The L's foot runs under the A and doubles as its right leg, so
  // pulling it brings the A down. The K's lower arm bridges the A and the
  // L, the U spans the L and the B, and the N's long right stem runs down
  // to the T, whose crossbar reaches out past it.
  //
  // Tall stacks it KU / NA / L / BH / AT with the same pieces, in the same
  // order. The T's crossbar carries the B and the H, the L's foot spans
  // them, and the N's long stem stands on the end of the foot. The A runs
  // its long legs down beside the L onto the H, the U bridges the N and the
  // A, and the K's arms rest on the flat top of the N's diagonal. The A
  // needs its own right leg here, added last.
  //
  // Pieces are placed on a grid by bounding box, `x` from the left and `y`
  // up from the floor, and coloured by the colourway below.
  //
  //   rect     a block or beam
  //   quarter  a quarter disc centred on `corner` (bl, br, tl, tr)
  //   wedge    a right triangle with its square corner at `corner`
  //   bowl     a block rounded on its right end
  //   cradle   a block with a half-round hollow of radius `r` in its top
  //   cap      a block with rounded shoulders and a half-round opening of
  //            radius `r` underneath
  const WIDE = [
    // H
    { cut: "rect", x: 0.5, y: 0, w: 1.5, h: 4 },
    { cut: "rect", x: 3.5, y: 0, w: 1.5, h: 4 },
    { cut: "rect", x: 2, y: 1.5, w: 1.5, h: 1 },
    // A
    { cut: "rect", x: 5, y: 0, w: 1.5, h: 1.25 },
    { cut: "rect", x: 7.5, y: 0, w: 1.5, h: 1.25 },
    { cut: "rect", x: 5, y: 1.25, w: 4, h: 0.75 },
    { cut: "cap", x: 5, y: 2, w: 4, h: 2, r: 0.5 },
    // T, its crossbar reaching out past the N above it
    { cut: "rect", x: 10.5, y: 0, w: 1.5, h: 2.5 },
    { cut: "rect", x: 9, y: 2.5, w: 5, h: 1.5 },

    // A, half a unit out past the H, its right leg the L's foot
    { cut: "rect", x: 0, y: 4, w: 1.5, h: 1.25 },
    { cut: "rect", x: 0, y: 5.25, w: 4, h: 0.75 },
    { cut: "cap", x: 0, y: 6, w: 4, h: 2, r: 0.5 },
    // L
    { cut: "rect", x: 2.5, y: 4, w: 5.5, h: 1.25 },
    { cut: "rect", x: 4, y: 5.25, w: 1.5, h: 2.75 },
    // B
    { cut: "rect", x: 8, y: 4, w: 1.5, h: 4 },
    { cut: "bowl", x: 9.5, y: 4, w: 2.5, h: 2 },
    { cut: "bowl", x: 9.5, y: 6, w: 2.5, h: 2 },

    // K, its lower arm bridging the A and the L
    { cut: "rect", x: 1, y: 8, w: 1.5, h: 4 },
    { cut: "quarter", corner: "bl", x: 2.5, y: 8, w: 2, h: 2 },
    { cut: "quarter", corner: "tl", x: 2.5, y: 10, w: 2, h: 2 },
    // U
    { cut: "cradle", x: 4.5, y: 8, w: 4, h: 1.5, r: 0.5 },
    { cut: "rect", x: 4.5, y: 9.5, w: 1.5, h: 2.5 },
    { cut: "rect", x: 7, y: 9.5, w: 1.5, h: 2.5 },
    // N, its right stem standing on the T two rows down
    { cut: "rect", x: 8.5, y: 8, w: 1.5, h: 4 },
    { cut: "wedge", corner: "bl", x: 10, y: 8, w: 2, h: 4 },
    { cut: "rect", x: 12, y: 4, w: 1.5, h: 8 },
  ];

  const TALL = [
      // H
      { cut: "rect", x: 4.5, y: 4, w: 1.5, h: 4 },
      { cut: "rect", x: 7.5, y: 4, w: 1.5, h: 4 },
      { cut: "rect", x: 6, y: 5.5, w: 1.5, h: 1 },
      // A
      { cut: "rect", x: 0, y: 0, w: 1.5, h: 1.25 },
      { cut: "rect", x: 2.5, y: 0, w: 1.5, h: 1.25 },
      { cut: "rect", x: 0, y: 1.25, w: 4, h: 0.75 },
      { cut: "cap", x: 0, y: 2, w: 4, h: 2, r: 0.5 },
      // T
      { cut: "rect", x: 5.5, y: 0, w: 1.5, h: 2.5 },
      { cut: "rect", x: 4, y: 2.5, w: 5, h: 1.5 },
      // A
      { cut: "rect", x: 5, y: 8, w: 1.5, h: 5.25 },
      { cut: "rect", x: 5, y: 13.25, w: 4, h: 0.75 },
      { cut: "cap", x: 5, y: 14, w: 4, h: 2, r: 0.5 },
      // L
      { cut: "rect", x: 0.5, y: 8, w: 4.5, h: 1.25 },
      { cut: "rect", x: 0.5, y: 9.25, w: 1.5, h: 2.75 },
      // B
      { cut: "rect", x: 0.5, y: 4, w: 1.5, h: 4 },
      { cut: "bowl", x: 2, y: 4, w: 2.5, h: 2 },
      { cut: "bowl", x: 2, y: 6, w: 2.5, h: 2 },
      // K
      { cut: "rect", x: 0, y: 16, w: 1.5, h: 4 },
      { cut: "quarter", corner: "bl", x: 1.5, y: 16, w: 2, h: 2 },
      { cut: "quarter", corner: "tl", x: 1.5, y: 18, w: 2, h: 2 },
      // U
      { cut: "cradle", x: 3.5, y: 16, w: 4, h: 1.5, r: 0.5 },
      { cut: "rect", x: 3.5, y: 17.5, w: 1.5, h: 2.5 },
      { cut: "rect", x: 6, y: 17.5, w: 1.5, h: 2.5 },
      // N
      { cut: "rect", x: 0, y: 12, w: 1.5, h: 4 },
      { cut: "wedge", corner: "tr", x: 1.5, y: 12, w: 2, h: 4 },
      { cut: "rect", x: 3.5, y: 9.25, w: 1.5, h: 6.75 },
      // A's right leg, which the L's foot is in the wide arrangement
      { cut: "rect", x: 7.5, y: 8, w: 1.5, h: 5.25 },
  ];

  const ARRANGEMENTS = {
    wide: { key: "wide", pieces: WIDE, span: { x: 14, y: 12 } },
    tall: { key: "tall", pieces: TALL, span: { x: 9, y: 20 } },
  };

  // Three colourways for review, one tone per piece in the order above. Each
  // has one dominant colour, one supporting, a sparing accent and neutrals,
  // laid across the whole sculpture rather than letter by letter. Choose
  // one with ?colorway=name in the address, or press 1, 2 or 3.
  //
  //   c cobalt  l lavender  o coral  s slate  b bone  f fog
  const TONES = {
    c: "cobalt",
    l: "lavender",
    o: "coral",
    s: "slate",
    b: "bone",
    f: "fog",
  };
  // Each arrangement has its own, as the neighbours differ.
  const COLORWAYS = {
    cobalt: {
      //     H      A        T    A      L    B      K      U      N
      wide: "s c b  s s b l  s c  s b l  c c  s l b  c l o  l c b  c s c",
      tall: "s c b  s s b l  s c  s b l  l l  s l b  c l o  l c b  s s c  c",
    },
    lavender: {
      wide: "l l o  b b f l  s c  l b l  c s  l l f  c l l  c b b  s o l",
      tall: "s l b  s s b c  s l  s b c  c c  s c b  l c o  c l b  s s l  l",
    },
    coral: {
      wide: "o s b  o o f o  s o  b o o  s f  o b c  s o o  b s o  b o s",
      tall: "f o b  f f b s  f o  f b s  s s  f s b  o s c  s o b  f f o  o",
    },
  };

  // Touching pieces of one colour are told apart by a faint shade on one of
  // them, so the joints still show where colours run together
  function touches(a, b) {
    const across = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const along = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    return (
      (Math.abs(across) < 1e-9 && along > 1e-9) ||
      (Math.abs(along) < 1e-9 && across > 1e-9)
    );
  }

  function colorway(name, key) {
    const list = ARRANGEMENTS[key].pieces;
    const tones = COLORWAYS[name][key]
      .trim()
      .split(/\s+/)
      .map((t) => TONES[t]);
    const shaded = [];
    list.forEach(function (p, i) {
      shaded[i] = list.some(
        (q, j) =>
          j < i && tones[j] === tones[i] && !shaded[j] && touches(p, q),
      );
    });
    return { tones, shaded };
  }

  const COLORWAY_NAMES = Object.keys(COLORWAYS);
  let colorwayName =
    COLORWAY_NAMES.find(
      (name) => name === new URLSearchParams(location.search).get("colorway"),
    ) || COLORWAY_NAMES[0];

  // Heavy, dead blocks: no bounce, lots of grip, a little air drag. Static
  // friction much above sliding friction lets a contact store sideways
  // force and then let go all at once, which throws pieces upward.
  const MATERIAL = {
    friction: 1,
    frictionStatic: 1,
    restitution: 0,
    frictionAir: 0.012,
    slop: 0.01,
  };
  const MAX_SPIN = 0.08;

  // Pieces in the sculpture collide with each other. A piece pulled out by
  // a tap comes forward, clear of the sculpture, and lands in front of it.
  const FLOOR = 0x1;
  const SCULPTURE = 0x2;
  const FRONT = 0x4;
  // Matter treats filters with matching groups as one group, so group 0
  // must be spelled out
  const IN_SCULPTURE = {
    group: 0,
    category: SCULPTURE,
    mask: FLOOR | SCULPTURE,
  };
  const IN_FRONT = { group: 0, category: FRONT, mask: FLOOR | FRONT };

  const engine = Engine.create({
    positionIterations: 20,
    velocityIterations: 12,
  });
  engine.gravity.scale = 0.002;

  let width = 0;
  let height = 0;
  let unit = 1;
  let ground = 0;
  let pieces = [];
  let untouched = true;
  let quiet = 0;
  let colors = {};
  let thud = 0;
  let arrangement = ARRANGEMENTS.wide;
  let palette = null;
  let hovered = null;

  function arc(r, d) {
    return Math.sqrt(Math.max(0, r * r - d * d));
  }

  // Every cut is a run of vertical slices, so it is described by its
  // bottom and top edge over x, in units from its lower-left corner
  function profile(p) {
    const { w, h } = p;
    const fromLeft = p.corner && p.corner[1] === "l";
    const fromBottom = p.corner && p.corner[0] === "b";
    const dx = (x) => (fromLeft ? x : w - x);

    switch (p.cut) {
      case "rect":
        return { lo: () => 0, hi: () => h, convex: true };
      case "quarter":
        return {
          lo: (x) => (fromBottom ? 0 : h - arc(w, dx(x))),
          hi: (x) => (fromBottom ? arc(w, dx(x)) : h),
          convex: true,
          circles: [[fromLeft ? 0 : w, w]],
        };
      case "wedge":
        return {
          lo: (x) => (fromBottom ? 0 : (h * dx(x)) / w),
          hi: (x) => (fromBottom ? h - (h * dx(x)) / w : h),
          convex: true,
        };
      case "bowl": {
        const r = h / 2;
        const flat = w - r;
        return {
          lo: (x) => (x < flat ? 0 : r - arc(r, x - flat)),
          hi: (x) => (x < flat ? h : r + arc(r, x - flat)),
          convex: true,
          circles: [[flat, r]],
        };
      }
      case "cradle":
        return {
          lo: () => 0,
          hi: (x) => h - arc(p.r, x - w / 2),
          circles: [[w / 2, p.r]],
        };
      case "cap": {
        // Shoulders are rounded with a radius of a quarter of the width
        const rc = w / 4;
        return {
          lo: (x) => arc(p.r, x - w / 2),
          hi: (x) =>
            x < rc
              ? h - rc + arc(rc, rc - x)
              : x > w - rc
                ? h - rc + arc(rc, x - (w - rc))
                : h,
          circles: [
            [rc, rc],
            [w - rc, rc],
            [w / 2, p.r],
          ],
        };
      }
    }
  }

  // Curves are sampled by angle so they stay round where they turn steep
  function samplesFor(p, prof, steps) {
    const xs = new Set([0, p.w]);
    (prof.circles || []).forEach(function ([cx, r]) {
      for (let i = 0; i <= steps; i++) {
        xs.add(+(cx + r * Math.cos((Math.PI * i) / steps)).toFixed(6));
      }
    });
    return [...xs].filter((x) => x >= 0 && x <= p.w).sort((a, b) => a - b);
  }

  function dedupe(points) {
    return points.filter(function (pt, i) {
      const prev = points[(i + points.length - 1) % points.length];
      return Math.hypot(pt.x - prev.x, pt.y - prev.y) > 1e-6;
    });
  }

  function convex(poly) {
    let turn = 0;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const c = poly[(i + 2) % poly.length];
      const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
      if (Math.abs(cross) < 1e-9) continue;
      if (turn && Math.sign(cross) !== turn) return false;
      turn = Math.sign(cross);
    }
    return true;
  }

  function edgesOf(p, prof, steps) {
    const xs = samplesFor(p, prof, steps);
    return {
      top: xs.map((x) => ({ x: p.x + x, y: p.y + prof.hi(x) })),
      bottom: xs.map((x) => ({ x: p.x + x, y: p.y + prof.lo(x) })),
    };
  }

  // Outline for drawing, plus convex slices for the physics, in grid units
  function shapeOf(p) {
    const prof = profile(p);
    const fine = edgesOf(p, prof, 48);
    const outline = dedupe(fine.top.concat(fine.bottom.slice().reverse()));
    if (prof.convex) return { outline, slices: [outline] };

    // The physics gets a coarser cut into as few slices as stay convex.
    // Matter resolves every part's contacts on its own, and a body made of
    // dozens of slivers fights itself and kicks whatever it rests on.
    const { top, bottom } = edgesOf(p, prof, 12);
    const span = (a, b) =>
      dedupe(bottom.slice(a, b + 1).concat(top.slice(a, b + 1).reverse()));
    const slices = [];
    let start = 0;
    for (let i = 1; i < top.length; i++) {
      if (i < top.length - 1 && convex(span(start, i + 1))) continue;
      const slice = span(start, i);
      if (slice.length >= 3) slices.push(slice);
      start = i;
    }
    return { outline, slices };
  }

  Object.values(ARRANGEMENTS).forEach(function (arrangement) {
    arrangement.shapes = arrangement.pieces.map(shapeOf);
  });

  // The sculpture stands just above the bottom of the window and runs up
  // as far as it can, in whichever arrangement covers more of it. Wide
  // reaches the very top; tall leaves room for the name above it.
  function layout() {
    const narrow = width < 640;
    const below = narrow ? 8 : 12;
    const fit = (span, above) =>
      Math.min(
        (width - (narrow ? 16 : 64)) / span.x,
        (height - below - above) / span.y,
      );
    const wide = fit(ARRANGEMENTS.wide.span, 0);
    const tall = fit(
      ARRANGEMENTS.tall.span,
      masthead.getBoundingClientRect().bottom + (narrow ? 12 : 20),
    );
    const cover = (u, span) => u * u * span.x * span.y;
    const useTall =
      cover(tall, ARRANGEMENTS.tall.span) > cover(wide, ARRANGEMENTS.wide.span);
    arrangement = useTall ? ARRANGEMENTS.tall : ARRANGEMENTS.wide;
    unit = useTall ? tall : wide;
    ground = height - below;
    root.style.setProperty("--ground", ground + "px");
  }

  function toWorld(pt) {
    return {
      x: width / 2 + (pt.x - arrangement.span.x / 2) * unit,
      y: ground - pt.y * unit,
    };
  }

  function makeBody(shape) {
    const parts = shape.slices.map(function (slice) {
      const verts = Vertices.clockwiseSort(slice.map(toWorld));
      return Body.create(
        Object.assign(
          { position: Vertices.centre(verts), vertices: verts },
          MATERIAL,
        ),
      );
    });
    const body =
      parts.length === 1
        ? parts[0]
        : Body.create(Object.assign({ parts }, MATERIAL));
    body.parts.forEach((part) => (part.collisionFilter = { ...IN_SCULPTURE }));
    return body;
  }

  function build() {
    Composite.clear(engine.world, false);
    untouched = true;
    rebuild = null;
    rebuildButton.classList.remove("is-shown");
    layout();
    palette = colorway(colorwayName, arrangement.key);

    pieces = arrangement.shapes.map(function (shape, i) {
      const body = makeBody(shape);
      // Pinned after creation so Matter remembers the real mass for later
      Body.setStatic(body, true);
      return {
        index: i,
        body,
        outline: shape.outline.map(toWorld),
        origin: { x: body.position.x, y: body.position.y },
        held: true,
        front: false,
        lift: 0,
        rattle: 0,
      };
    });

    const t = 400;
    const walls = [
      Bodies.rectangle(width / 2, ground + t / 2, width * 3, t),
      Bodies.rectangle(-t / 2, ground - height, t, height * 4),
      Bodies.rectangle(width + t / 2, ground - height, t, height * 4),
      Bodies.rectangle(width / 2, -t / 2, width * 3, t),
    ];
    walls.forEach(function (wall) {
      Body.set(wall, MATERIAL);
      wall.collisionFilter = {
        group: 0,
        category: FLOOR,
        mask: SCULPTURE | FRONT,
      };
      Body.setStatic(wall, true);
    });
    Composite.add(engine.world, walls.concat(pieces.map((p) => p.body)));
  }

  // Where a piece is right now, in screen space
  function polygonOf(piece) {
    const { body, origin } = piece;
    const cos = Math.cos(body.angle);
    const sin = Math.sin(body.angle);
    return piece.outline.map(function (pt) {
      const dx = pt.x - origin.x;
      const dy = pt.y - origin.y;
      return {
        x: body.position.x + dx * cos - dy * sin,
        y: body.position.y + dx * sin + dy * cos,
      };
    });
  }

  function contains(poly, x, y) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i];
      const b = poly[j];
      if (
        a.y > y !== b.y > y &&
        x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x
      ) {
        inside = !inside;
      }
    }
    return inside;
  }

  // Points every tenth of a unit around a polygon
  function edgePoints(poly) {
    const points = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const steps = Math.max(
        1,
        Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / (unit * 0.1)),
      );
      for (let k = 0; k < steps; k++) {
        points.push({
          x: a.x + ((b.x - a.x) * k) / steps,
          y: a.y + ((b.y - a.y) * k) / steps,
        });
      }
    }
    return points;
  }

  function near(a, b) {
    const pad = unit * 0.2;
    return (
      a.bounds.min.x - pad < b.bounds.max.x &&
      b.bounds.min.x - pad < a.bounds.max.x &&
      a.bounds.min.y - pad < b.bounds.max.y &&
      b.bounds.min.y - pad < a.bounds.max.y
    );
  }

  function touching(a, b) {
    if (!near(a.body, b.body)) return false;
    const reach = unit * 0.08;
    const other = polygonOf(b);
    return edgePoints(polygonOf(a)).some(
      (pt) =>
        contains(other, pt.x + reach, pt.y) ||
        contains(other, pt.x - reach, pt.y) ||
        contains(other, pt.x, pt.y + reach) ||
        contains(other, pt.x, pt.y - reach),
    );
  }

  // A held piece stands if its centre of mass sits over the places where
  // it rests on the floor or on other held pieces of the sculpture
  function stands(piece) {
    const poly = polygonOf(piece);
    const below = pieces.filter(
      (p) => p !== piece && p.held && !p.front && near(p.body, piece.body),
    );
    const reach = unit * 0.08;
    let left = Infinity;
    let right = -Infinity;
    const centre = piece.body.position.x;
    edgePoints(poly).forEach(function (pt) {
      // Probing a hair inside the piece keeps a neighbour's side, flush
      // against this one, from counting as something underneath it
      const x = pt.x + Math.sign(centre - pt.x) * unit * 0.03;
      const y = pt.y + reach;
      if (contains(poly, x, y) || !contains(poly, x, pt.y - reach)) return;
      const resting =
        y >= ground || below.some((p) => contains(polygonOf(p), x, y));
      if (!resting) return;
      left = Math.min(left, x);
      right = Math.max(right, x);
    });
    return centre >= left - unit * 0.02 && centre <= right + unit * 0.02;
  }

  // Checks spread outward from a disturbed piece to whatever touched it;
  // anything that no longer stands joins the physics and is checked in turn
  function recheck(start) {
    const queue = pieces.filter(
      (p) => p.held && !p.front && touching(p, start),
    );
    while (queue.length) {
      const piece = queue.shift();
      if (!piece.held || stands(piece)) continue;
      loosen(piece);
      pieces.forEach(function (p) {
        if (p.held && !p.front && !queue.includes(p) && touching(p, piece)) {
          queue.push(p);
        }
      });
    }
  }

  function loosen(piece) {
    piece.held = false;
    quiet = 0;
    Body.setStatic(piece.body, false);
  }

  // A tap draws the piece forward out of the sculpture and lets it drop,
  // with a little drift away from the finger and a turn from where it was
  // touched
  function pullOut(piece, point) {
    const wasInSculpture = !piece.front;
    if (wasInSculpture) {
      piece.front = true;
      piece.body.parts.forEach(
        (part) => (part.collisionFilter = { ...IN_FRONT }),
      );
    }
    loosen(piece);

    const { body } = piece;
    const side = Math.sign(body.position.x - point.x) || 1;
    const push = { x: side * unit * 0.05, y: -unit * 0.06 };
    const arm = { x: point.x - body.position.x, y: point.y - body.position.y };
    const turn = ((arm.x * push.y - arm.y * push.x) * body.mass) / body.inertia;
    Body.setVelocity(body, push);
    // Always a slight lean the way it was pushed, so a piece standing on
    // the floor tips over rather than just standing there
    Body.setAngularVelocity(
      body,
      side * 0.025 + Math.max(-0.02, Math.min(0.02, turn)),
    );

    if (wasInSculpture) recheck(piece);
  }

  function pieceAt(point) {
    const hits = Query.point(
      pieces.map((p) => p.body),
      point,
    );
    // Pieces brought forward sit in front of the sculpture
    const found = hits.map((body) => pieces.find((p) => p.body === body));
    return found.find((p) => p.front) || found[0] || null;
  }

  function pointFrom(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  canvas.addEventListener("pointerdown", function (event) {
    if (rebuild) return;
    const point = pointFrom(event);
    const piece = pieceAt(point);
    if (!piece) return;
    untouched = false;
    rebuildButton.classList.add("is-shown");
    pullOut(piece, point);
  });

  // Putting it back: every displaced piece comes forward, is lifted clear
  // and lowered into its place, from the ground up, the way it would be
  // built. Bodies are pinned while they travel, and the world is rebuilt
  // fresh once the last one has landed.
  const TRAVEL = 720;
  const STAGGER = 55;
  let rebuild = null;

  function easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function displaced(piece) {
    const { body, origin } = piece;
    const upright = Math.round(body.angle / (2 * Math.PI)) * 2 * Math.PI;
    return (
      Math.hypot(body.position.x - origin.x, body.position.y - origin.y) >
        0.5 || Math.abs(body.angle - upright) > 0.002
    );
  }

  function putBack() {
    if (rebuild) return;
    rebuildButton.classList.remove("is-shown");
    if (reducedMotion.matches) return build();

    pieces.forEach(function (piece) {
      piece.held = true;
      Body.setStatic(piece.body, true);
    });
    const moved = pieces
      .filter(displaced)
      .sort(
        (a, b) =>
          arrangement.pieces[a.index].y - arrangement.pieces[b.index].y ||
          arrangement.pieces[a.index].x - arrangement.pieces[b.index].x,
      );
    rebuild = {
      start: performance.now(),
      trips: moved.map(function (piece, k) {
        piece.front = true;
        const { body } = piece;
        return {
          piece,
          from: { x: body.position.x, y: body.position.y },
          angle: body.angle,
          upright: Math.round(body.angle / (2 * Math.PI)) * 2 * Math.PI,
          delay: k * STAGGER,
          landed: false,
        };
      }),
    };
  }

  rebuildButton.addEventListener("click", putBack);

  function carry(now) {
    let travelling = false;
    rebuild.trips.forEach(function (trip) {
      const { piece, from } = trip;
      const elapsed = now - rebuild.start - trip.delay;
      const t = Math.min(1, Math.max(0, elapsed / TRAVEL));
      if (t < 1) travelling = true;
      const e = easeInOut(t);
      // Lifted clear on the way, highest a little before halfway, so the
      // last part of the trip is a lowering into place
      const lift = unit * 0.8 * Math.sin(Math.PI * Math.min(1, t * 1.25));
      Body.setPosition(piece.body, {
        x: from.x + (piece.origin.x - from.x) * e,
        y: from.y + (piece.origin.y - from.y) * e - lift,
      });
      Body.setAngle(piece.body, trip.angle + (trip.upright - trip.angle) * e);
      if (t === 1 && !trip.landed) {
        trip.landed = true;
        piece.front = false;
        if (!reducedMotion.matches) thud = Math.max(thud, 0.8);
      }
    });
    if (!travelling) build();
  }

  canvas.addEventListener("pointermove", function (event) {
    const piece = pieceAt(pointFrom(event));
    canvas.style.cursor = piece ? "pointer" : "default";
    // Touch has no hover, and a finger dragging across would set it off
    hovered = event.pointerType === "mouse" ? piece : null;
  });

  canvas.addEventListener("pointerleave", function () {
    hovered = null;
  });

  // Landings register as a faint jolt, scaled by how hard and how heavy
  Events.on(engine, "collisionStart", function (event) {
    if (reducedMotion.matches) return;
    event.pairs.forEach(function (pair) {
      const a = pair.bodyA.parent;
      const b = pair.bodyB.parent;
      const n = pair.collision.normal;
      const closing = Math.abs(
        (a.velocity.x - b.velocity.x) * n.x +
          (a.velocity.y - b.velocity.y) * n.y,
      );
      const light = Math.min(a.mass, b.mass);
      const weight = Math.min(1, light / (unit * unit * 4e-3));
      thud = Math.max(thud, Math.min(1.5, (closing / unit) * 4 * weight));
    });
  });

  // Spin is capped so nothing cartwheels, and once every loose piece has
  // nearly stopped they are all set down where they lie
  function settle() {
    const loose = pieces.filter((p) => !p.held);
    if (!loose.length) return;
    let still = true;
    loose.forEach(function ({ body }) {
      if (Math.abs(body.angularVelocity) > MAX_SPIN) {
        Body.setAngularVelocity(
          body,
          Math.sign(body.angularVelocity) * MAX_SPIN,
        );
      }
      if (
        body.speed > unit * 0.004 ||
        Math.abs(body.angularVelocity) > 0.0015
      ) {
        still = false;
      }
    });
    quiet = still ? quiet + 1 : 0;
    if (quiet < 40) return;
    loose.forEach(function (piece) {
      piece.held = true;
      Body.setStatic(piece.body, true);
    });
  }

  function rgbOf(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  // Tones are drawn as hue, saturation and lightness so a hovered piece can
  // be turned a little way round the colour wheel
  function hslOf([r, g, b]) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    if (!d) return { h: 0, s: 0, l };
    const s = d / (1 - Math.abs(2 * l - 1));
    const h =
      max === r
        ? ((g - b) / d + 6) % 6
        : max === g
          ? (b - r) / d + 2
          : (r - g) / d + 4;
    return { h: h * 60, s, l };
  }

  // When the theme changes the sculpture's colours turn a beat after the
  // room around them, and over a little longer, as if the light reaches it
  // last. A change partway through turns from whatever is showing.
  const TURN_DELAY = 60;
  const TURN = 340;
  let shown = null;
  let turn = null;

  function readColors() {
    const style = getComputedStyle(root);
    const target = {};
    Object.values(TONES).forEach(function (tone) {
      target[tone] = rgbOf(style.getPropertyValue("--block-" + tone).trim());
    });
    if (!shown || reducedMotion.matches) {
      shown = target;
      turn = null;
    } else {
      turn = { from: shown, to: target, start: performance.now() + TURN_DELAY };
    }
    showColors(performance.now());
  }

  function showColors(now) {
    if (turn) {
      const t = Math.min(1, Math.max(0, (now - turn.start) / TURN));
      const e = 1 - Math.pow(1 - t, 3);
      shown = {};
      Object.keys(turn.to).forEach(function (tone) {
        shown[tone] = turn.from[tone].map(
          (c, i) => c + (turn.to[tone][i] - c) * e,
        );
      });
      if (t === 1) turn = null;
    }
    colors = {};
    Object.keys(shown).forEach((tone) => (colors[tone] = hslOf(shown[tone])));
  }

  new MutationObserver(readColors).observe(root, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", readColors);

  function drawPiece(piece) {
    const { body, origin, outline, index } = piece;
    // Brought forward, a piece reads a touch larger, as if nearer
    piece.lift += ((piece.front ? 1 : 0) - piece.lift) * 0.2;
    const scale = 1 + 0.03 * piece.lift;
    // A piece under the pointer rattles a little in place, as if loose, and
    // its colour turns slightly, both easing in and out so nothing jumps.
    // Drawing only; the body stays put.
    const over = piece === hovered && piece.held && !rebuild;
    piece.rattle += ((over ? 1 : 0) - piece.rattle) * 0.06;
    const now = performance.now();
    const wobble = reducedMotion.matches
      ? 0
      : piece.rattle *
        (0.009 * Math.sin(now * 0.016) + 0.003 * Math.sin(now * 0.0255));
    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle + wobble);
    ctx.scale(scale, scale);
    ctx.translate(-origin.x, -origin.y);
    ctx.beginPath();
    outline.forEach((pt, i) =>
      i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y),
    );
    ctx.closePath();
    // Neutrals have next to no hue to turn, so a touch of light shows theirs
    const tone = colors[palette.tones[index]];
    const hue = tone.h + 12 * piece.rattle;
    const light = tone.l + 0.025 * piece.rattle;
    ctx.fillStyle = `hsl(${hue} ${tone.s * 100}% ${light * 100}%)`;
    ctx.fill();
    if (palette.shaded[index]) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.07)";
      ctx.fill();
    }
    ctx.restore();
  }

  function draw() {
    if (turn) showColors(performance.now());
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.translate(0, thud);
    pieces.filter((p) => !p.front).forEach(drawPiece);
    pieces.filter((p) => p.front).forEach(drawPiece);
  }

  // Small fixed steps keep a loaded stack from sinking into itself and the
  // fall the same speed on any refresh rate
  const STEP = 1000 / 120;
  let last = performance.now();
  let pending = 0;

  function frame(now) {
    pending = Math.min(pending + now - last, STEP * 8);
    last = now;
    while (pending >= STEP) {
      Engine.update(engine, STEP);
      settle();
      pending -= STEP;
    }
    if (rebuild) carry(now);
    thud *= 0.8;
    draw();
    requestAnimationFrame(frame);
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    // Size from the canvas box itself so drawing is never stretched
    const box = canvas.getBoundingClientRect();
    const changedWidth = box.width !== width;
    const changedHeight = Math.abs(box.height - height) > 120;
    width = box.width;
    height = box.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    // Mobile toolbars nudge the height constantly, so a disturbed
    // sculpture keeps its arrangement
    if (changedWidth || changedHeight || untouched) build();
  }

  window.addEventListener("keydown", function (event) {
    const name = COLORWAY_NAMES[event.key - 1];
    if (!name || event.metaKey || event.ctrlKey || event.altKey) return;
    colorwayName = name;
    palette = colorway(name, arrangement.key);
    const url = new URL(location.href);
    url.searchParams.set("colorway", name);
    history.replaceState(null, "", url);
  });

  readColors();
  resize();
  new ResizeObserver(resize).observe(canvas);
  requestAnimationFrame(frame);
})();
