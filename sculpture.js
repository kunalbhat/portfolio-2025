(function () {
  const { Engine, Body, Bodies, Composite, Events, Query, Vertices } = Matter;

  const canvas = document.getElementById("sculpture");
  const ctx = canvas.getContext("2d");
  const rebuildButton = document.getElementById("rebuild");
  const masthead = document.querySelector(".masthead");
  const controls = document.querySelector(".controls");
  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // KUNAL BHAT built like a pile of heavy blocks that hold each other up,
  // in one of two arrangements: wide, for most windows, and compact, for
  // phones and other narrow windows.
  //
  // Wide stacks it KUN / ALB / HAT. The A stands on the H and leans out
  // past it. The L's foot runs under the A and doubles as its right leg, so
  // pulling it brings the A down. The K's lower arm bridges the A and the
  // L, the U spans the L and the B, and the N's long right stem runs down
  // to the T, whose crossbar reaches out past it.
  //
  // Compact is its own, smaller sculpture with the same rows, built to be
  // seen whole on a phone: narrower letters with slimmer stems, each row
  // ten units across. The A stands on the H's stems; the L stands on the A
  // beside the B, its foot resting on the A's cap; the B rides the A and
  // the T's crossbar; the K's arms sit on the second A; the U bridges the
  // L and the B; and the N stands on the B.
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

  const COMPACT = [
    // H
    { cut: "rect", x: 0, y: 0, w: 1, h: 4 },
    { cut: "rect", x: 2.5, y: 0, w: 1, h: 4 },
    { cut: "rect", x: 1, y: 1.5, w: 1.5, h: 1 },
    // A
    { cut: "rect", x: 3.5, y: 0, w: 1, h: 1.25 },
    { cut: "rect", x: 5.5, y: 0, w: 1, h: 1.25 },
    { cut: "rect", x: 3.5, y: 1.25, w: 3, h: 0.75 },
    { cut: "cap", x: 3.5, y: 2, w: 3, h: 2, r: 0.5 },
    // T
    { cut: "rect", x: 7.75, y: 0, w: 1, h: 2.5 },
    { cut: "rect", x: 6.5, y: 2.5, w: 3.5, h: 1.5 },

    // A
    { cut: "rect", x: 0, y: 4, w: 1, h: 1.25 },
    { cut: "rect", x: 2, y: 4, w: 1, h: 1.25 },
    { cut: "rect", x: 0, y: 5.25, w: 3, h: 0.75 },
    { cut: "cap", x: 0, y: 6, w: 3, h: 2, r: 0.5 },
    // L
    { cut: "rect", x: 3, y: 4, w: 1, h: 4 },
    { cut: "rect", x: 4, y: 4, w: 2, h: 1 },
    // B
    { cut: "rect", x: 6, y: 4, w: 1, h: 4 },
    { cut: "bowl", x: 7, y: 4, w: 3, h: 2 },
    { cut: "bowl", x: 7, y: 6, w: 3, h: 2 },

    // K
    { cut: "rect", x: 0, y: 8, w: 1, h: 4 },
    { cut: "quarter", corner: "bl", x: 1, y: 8, w: 2, h: 2 },
    { cut: "quarter", corner: "tl", x: 1, y: 10, w: 2, h: 2 },
    // U
    { cut: "cradle", x: 3.5, y: 8, w: 3, h: 1.25, r: 0.5 },
    { cut: "rect", x: 3.5, y: 9.25, w: 1, h: 2.75 },
    { cut: "rect", x: 5.5, y: 9.25, w: 1, h: 2.75 },
    // N
    { cut: "rect", x: 6.5, y: 8, w: 1, h: 4 },
    { cut: "wedge", corner: "bl", x: 7.5, y: 8, w: 1.5, h: 4 },
    { cut: "rect", x: 9, y: 8, w: 1, h: 4 },
  ];

  const ARRANGEMENTS = {
    wide: { key: "wide", pieces: WIDE, span: { x: 14, y: 12 } },
    compact: { key: "compact", pieces: COMPACT, span: { x: 10, y: 12 } },
  };

  // Which letter each piece belongs to, in the order above. The second A
  // is written a.
  const LETTERS = {
    wide: "H H H  A A A A  T T  a a a  L L  B B B  K K K  U U U  N N N",
    compact: "H H H  A A A A  T T  a a a a  L L  B B B  K K K  U U U  N N N",
  };

  // Everything is paper, in a few close tones read from the stylesheet:
  // the wall, the sheets lifted from it, the recess under the wall where a
  // sheet has been taken out, and the reverse of a sheet, seen only where
  // a corner curls
  const TONES = ["paper", "sheet", "recess", "reverse"];

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

  // The diagonal strokes are folded: a quarter along the radius that halves
  // it, a wedge from its square corner to the middle of its long side, so
  // each is a ridge with one face turned to the light and one away
  function creaseOf(p) {
    if (p.cut !== "quarter" && p.cut !== "wedge") return null;
    const sx = p.corner[1] === "l" ? 1 : -1;
    const sy = p.corner[0] === "b" ? 1 : -1;
    const from = { x: p.x + (sx > 0 ? 0 : p.w), y: p.y + (sy > 0 ? 0 : p.h) };
    if (p.cut === "wedge") return [from, { x: p.x + p.w / 2, y: p.y + p.h / 2 }];
    const reach = p.w / Math.SQRT2;
    return [from, { x: from.x + sx * reach, y: from.y + sy * reach }];
  }

  // Outline for drawing, plus convex slices for the physics, in grid units
  function shapeOf(p) {
    const prof = profile(p);
    const fine = edgesOf(p, prof, 48);
    const outline = dedupe(fine.top.concat(fine.bottom.slice().reverse()));
    const crease = creaseOf(p);
    if (prof.convex) return { outline, slices: [outline], crease };

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
    return { outline, slices, crease };
  }

  // Each letter is cut from the sheet and lifted to its own height, so its
  // pieces read as one continuous piece of paper and neighbouring letters
  // are told apart by the shadow one casts on the other. Heights are dealt
  // out so no two letters that touch share one. Folded pieces stand a
  // little proud of their letter.
  const HEIGHTS = [1, 1.9, 1.45, 2.4];
  const FOLD_HEIGHT = 0.4;

  function boxesTouch(a, b) {
    const across = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const along = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    return across > -1e-9 && along > -1e-9 && (across > 1e-9 || along > 1e-9);
  }

  function heightsOf(list, letters) {
    const names = [...new Set(letters)];
    const near = {};
    names.forEach((n) => (near[n] = new Set()));
    list.forEach(function (a, i) {
      list.forEach(function (b, j) {
        if (letters[i] !== letters[j] && boxesTouch(a, b)) {
          near[letters[i]].add(letters[j]);
        }
      });
    });
    const height = {};
    names
      .slice()
      .sort((a, b) => near[b].size - near[a].size)
      .forEach(function (n) {
        const taken = [...near[n]].map((m) => height[m]);
        height[n] = HEIGHTS.find((h) => !taken.includes(h)) || HEIGHTS[0];
      });
    return height;
  }

  Object.values(ARRANGEMENTS).forEach(function (arrangement) {
    arrangement.shapes = arrangement.pieces.map(shapeOf);
    arrangement.letters = LETTERS[arrangement.key].trim().split(/\s+/);
    arrangement.heights = heightsOf(arrangement.pieces, arrangement.letters);
  });

  // The sculpture runs as large as it can, in whichever arrangement covers
  // more of the window. Wide stands just above the bottom of the window
  // and reaches the very top, unless its top corners would run under the
  // name or the buttons, and then it starts below them. Compact is set
  // with the name as one piece: the name, then the sculpture on its shelf
  // just beneath it, the two together a little above the middle.
  function layout() {
    const narrow = width < 640;
    const below = narrow ? 8 : 12;
    // The name and buttons go back to their usual place to be measured
    root.style.removeProperty("--top");
    const name = masthead.getBoundingClientRect();
    const tools = controls.getBoundingClientRect();

    const wideSpan = ARRANGEMENTS.wide.span;
    const fit = (above) =>
      Math.min((width - 64) / wideSpan.x, (height - below - above) / wideSpan.y);
    const reach = fit(0);
    // The K's stem and the N's long stem stand at the top corners
    const left = width / 2 - 6 * reach;
    const right = width / 2 + 6.5 * reach;
    const wide =
      name.right + 12 > left || tools.left - 12 < right
        ? fit(Math.max(name.bottom, tools.bottom) + 20)
        : reach;

    const compactSpan = ARRANGEMENTS.compact.span;
    const gap = narrow ? 28 : 40;
    const edge = narrow ? 20 : 32;
    const compact = Math.min(
      (width - 2 * (narrow ? 16 : 32)) / compactSpan.x,
      (height - name.height - gap - 2 * edge) / compactSpan.y,
    );

    const cover = (u, span) => u * u * span.x * span.y;
    if (cover(compact, compactSpan) > cover(wide, wideSpan)) {
      arrangement = ARRANGEMENTS.compact;
      unit = compact;
      const group = name.height + gap + compactSpan.y * unit;
      const top = Math.max(edge, (height - group) * 0.36);
      root.style.setProperty("--top", top + "px");
      ground = top + name.height + gap + compactSpan.y * unit;
    } else {
      arrangement = ARRANGEMENTS.wide;
      unit = wide;
      ground = height - below;
    }
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
    drawn = false;
    Composite.clear(engine.world, false);
    untouched = true;
    rebuild = null;
    disturbed(false);
    layout();

    const letterNames = [...new Set(arrangement.letters)];
    pieces = arrangement.shapes.map(function (shape, i) {
      const body = makeBody(shape);
      // Pinned after creation so Matter remembers the real mass for later
      Body.setStatic(body, true);
      const letter = arrangement.letters[i];
      const outline = shape.outline.map(toWorld);
      return {
        index: i,
        body,
        outline,
        crease: shape.crease && shape.crease.map(toWorld),
        corner: shape.crease ? null : peelCorner(outline),
        height:
          arrangement.heights[letter] + (shape.crease ? FOLD_HEIGHT : 0),
        // Each letter's paper is a hair lighter or darker than the next
        tint: ((letterNames.indexOf(letter) * 3) % 5) - 2,
        origin: { x: body.position.x, y: body.position.y },
        held: true,
        front: false,
        lift: 0,
        raise: 0,
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
    pieces.forEach((piece) => (piece.edges = exposedEdges(piece)));
  }

  // The edges of a piece that stand clear: not against a piece standing as
  // high or higher, where the paper meets paper rather than air. Only these
  // catch the lamp, so a letter's pieces meet without a seam.
  function exposedEdges(piece) {
    const { outline } = piece;
    const step = unit * 0.06;
    const edges = [];
    outline.forEach(function (start, i) {
      const end = outline[(i + 1) % outline.length];
      const len = Math.hypot(end.x - start.x, end.y - start.y);
      if (len < 1e-6) return;
      // Long sides are judged a short length at a time, as only part of
      // one may be against another piece
      const parts = Math.ceil(len / (unit * 0.2));
      for (let k = 0; k < parts; k++) {
        const at = (t) => ({
          x: start.x + (end.x - start.x) * t,
          y: start.y + (end.y - start.y) * t,
        });
        const a = at(k / parts);
        const b = at((k + 1) / parts);
        const mid = at((k + 0.5) / parts);
        let n = { x: (b.y - a.y) / (len / parts), y: -(b.x - a.x) / (len / parts) };
        if (contains(outline, mid.x + n.x * step, mid.y + n.y * step)) {
          n = { x: -n.x, y: -n.y };
        }
        const out = { x: mid.x + n.x * step, y: mid.y + n.y * step };
        const covered = pieces.some(
          (other) =>
            other !== piece &&
            other.height >= piece.height - 1e-6 &&
            contains(other.outline, out.x, out.y),
        );
        if (!covered) edges.push({ a, b, n });
      }
    });
    return edges;
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
    disturbed(true);
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
    disturbed(false);
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

  // The restore tile rises from the wall once something has been knocked
  // loose, and sinks flush again as the sculpture goes back together
  function disturbed(on) {
    rebuildButton.classList.toggle("is-disturbed", on);
    rebuildButton.setAttribute("aria-disabled", String(!on));
  }

  rebuildButton.addEventListener("click", function () {
    if (rebuildButton.getAttribute("aria-disabled") !== "true") putBack();
  });

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

  // Tones are drawn as hue, saturation and lightness so the light can
  // brighten or deepen them
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
    drawn = false;
    const style = getComputedStyle(root);
    const target = {};
    TONES.forEach(function (tone) {
      target[tone] = rgbOf(style.getPropertyValue("--" + tone).trim());
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

  // One lamp lights the whole sheet from up and to the left. Every sheet
  // stands some height off the wall and catches a little more of the lamp
  // the higher it stands; its shadow falls away from the lamp, a little
  // longer the higher it is, and its clear edges facing the lamp catch a
  // fine line of light. Folds turn one face toward the lamp and one away.
  // Cuts sink below the wall, shadowed on the lamp's side and catching it
  // on the far wall. The pointer nudges the lamp a little, which moves the
  // light and never the paper. The dark theme is the same paper in a dim
  // studio: a softer, warmer lamp, a charcoal wall, and the sheets standing
  // out from it by the light they catch. Canvas shadows ignore the
  // transform, so the light stays put however a piece turns.
  const LAMP = Math.atan2(0.85, 0.52);
  let aim = { x: 0, y: 0 };
  let aimTo = { x: 0, y: 0 };

  window.addEventListener("pointermove", function (event) {
    if (event.pointerType !== "mouse" || reducedMotion.matches) return;
    aimTo = {
      x: (event.clientX / width) * 2 - 1,
      y: (event.clientY / height) * 2 - 1,
    };
  });

  function light() {
    // How bright the room is, read from the wall itself, so the light
    // turns with the colours when the theme changes
    const day = Math.min(1, Math.max(0, (colors.paper.l - 0.2) / 0.7));
    const dusk = 1 - day;
    const angle = LAMP + 0.2 * aim.x;
    const reach = (1 + 0.3 * dusk) * (1 + 0.2 * aim.y);
    const lamp = (a) =>
      `rgba(255, ${Math.round(255 - 18 * dusk)}, ${Math.round(255 - 44 * dusk)}, ${a})`;
    const shade = (a) =>
      `rgba(${Math.round(18 - 8 * dusk)}, ${Math.round(20 - 10 * dusk)}, ${Math.round(28 - 19 * dusk)}, ${a})`;
    return {
      u: unit * (window.devicePixelRatio || 1),
      dx: Math.cos(angle) * reach,
      dy: Math.sin(angle) * reach,
      rise: 0.003 * day + 0.014 * dusk,
      highlight: 0.45 * day + 0.12 * dusk,
      highlightColor: lamp(1),
      lip: lamp(0.5 * day + 0.12 * dusk),
      contact: shade(0.27 + 0.2 * dusk),
      ambient: shade(0.1 + 0.16 * dusk),
      pit: shade(0.4 + 0.2 * dusk),
      pool: lamp(0.06 * day + 0.07 * dusk),
      falloff: shade(0.05 + 0.26 * dusk),
      fold: 0.045 + 0.03 * dusk,
    };
  }

  // How far a piece stands off the wall: its letter's height, more when
  // the pointer is over it, and a good deal more once knocked forward
  function elevation(piece) {
    return piece.height + 0.6 * piece.raise + 2.5 * piece.lift;
  }

  // A piece under the pointer lifts a little and curls up a corner, slowly
  // and stiffly, as paper would
  function animate(piece) {
    piece.lift += ((piece.front ? 1 : 0) - piece.lift) * 0.2;
    const to = piece === hovered && piece.held && !rebuild ? 1 : 0;
    piece.raise = reducedMotion.matches
      ? to
      : piece.raise + (to - piece.raise) * 0.14;
  }

  // The corner a hovered piece curls up from is the one furthest from the
  // lamp, and it folds back along a line square to the diagonal
  const CURL = { x: -Math.SQRT1_2, y: -Math.SQRT1_2 };

  function peelCorner(outline) {
    const corner = outline.reduce((best, pt) =>
      pt.x + pt.y > best.x + best.y ? pt : best,
    );
    const depth = Math.max(
      ...outline.map(
        (pt) => (pt.x - corner.x) * CURL.x + (pt.y - corner.y) * CURL.y,
      ),
    );
    return { ...corner, reach: Math.min(0.6 * unit, 0.4 * depth) };
  }

  // The part of a polygon on the side of a line where `side` is positive
  function clip(poly, side) {
    const out = [];
    poly.forEach(function (a, i) {
      const b = poly[(i + 1) % poly.length];
      const sa = side(a);
      const sb = side(b);
      if (sa >= 0) out.push(a);
      if (sa >= 0 !== sb >= 0) {
        const t = sa / (sa - sb);
        out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      }
    });
    return out;
  }

  // A curled corner: what is left of the face, and the corner turned back
  // over it, showing the paper's reverse
  function peelOf(piece) {
    const { corner, outline } = piece;
    const d = corner && piece.raise * corner.reach;
    if (!d || d < 0.5) return null;
    const along = (pt) =>
      (pt.x - corner.x) * CURL.x + (pt.y - corner.y) * CURL.y;
    const flap = clip(outline, (pt) => d - along(pt)).map(function (pt) {
      const t = 2 * (d - along(pt));
      return { x: pt.x + t * CURL.x, y: pt.y + t * CURL.y };
    });
    return {
      face: clip(outline, (pt) => along(pt) - d),
      flap,
      fold: { x: corner.x + d * CURL.x, y: corner.y + d * CURL.y },
      tip: { x: corner.x + 2 * d * CURL.x, y: corner.y + 2 * d * CURL.y },
    };
  }

  // Sets the canvas to the piece's pose, in the coordinates its outline was
  // built in
  function pose(piece) {
    const { body, origin } = piece;
    const scale = 1 + 0.03 * piece.lift;
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);
    ctx.scale(scale, scale);
    ctx.translate(-origin.x, -origin.y);
  }

  function trace(poly) {
    ctx.beginPath();
    poly.forEach((pt, i) =>
      i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y),
    );
    ctx.closePath();
  }

  const paint = (tone, dl) =>
    `hsl(${tone.h} ${tone.s * 100}% ${Math.max(0, Math.min(1, tone.l + dl)) * 100}%)`;

  // How far a piece stands out from the wall, from nearly flush (0) to
  // well off it (1). Edges are defined by depth: a piece barely lifted
  // leaves a seam you can hardly see, a higher one a firmer shadow and a
  // brighter edge.
  function standing(piece) {
    return Math.min(1, Math.max(0, (elevation(piece) - 0.6) / 1.8));
  }

  // The shadow a piece throws on whatever is below it, as the shadow of a
  // fill that the piece's face then covers. A raised sheet throws a tight
  // shadow away from the lamp where it leaves the surface and a short
  // ambient one that lengthens with its height, both firmer the further it
  // stands out. A fold rests its edges on the sheet, so it throws only the
  // tight shadow, at full strength; its depth is in its shaded face.
  function castShadow(piece, poly) {
    const h = elevation(piece);
    const s = standing(piece);
    const cast = function (color, strength, blur, distance) {
      ctx.globalAlpha = strength;
      ctx.shadowColor = color;
      ctx.shadowBlur = blur * lit.u;
      ctx.shadowOffsetX = distance * lit.dx * lit.u;
      ctx.shadowOffsetY = distance * lit.dy * lit.u;
      ctx.fill();
    };
    ctx.save();
    pose(piece);
    trace(poly);
    ctx.fillStyle = "#000";
    if (piece.crease && !piece.lift) {
      cast(lit.contact, 1, 0.024, 0.014);
    } else {
      cast(lit.ambient, 0.5 + 0.5 * s, 0.05 + 0.03 * h, 0.035 * h);
      cast(lit.contact, 0.3 + 0.7 * s, 0.016 + 0.008 * h, 0.016 * h);
    }
    ctx.restore();
  }


  // Filled with a hairline of the same colour round it, which closes the
  // gaps antialiasing would otherwise leave where pieces meet
  function fillSealed(color) {
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.fill();
    ctx.stroke();
  }

  // The clear edges that face the lamp, each as bright as it squarely
  // faces it, inside the face so nothing is cast onto the paper around
  function highlightEdges(piece) {
    const { angle } = piece.body;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const reach = Math.hypot(lit.dx, lit.dy);
    const buckets = [[], [], [], []];
    piece.edges.forEach(function (edge) {
      const nx = edge.n.x * cos - edge.n.y * sin;
      const ny = edge.n.x * sin + edge.n.y * cos;
      const facing = -(nx * lit.dx + ny * lit.dy) / reach;
      if (facing > 0.15) buckets[Math.min(3, Math.floor(facing * 4))].push(edge);
    });
    ctx.strokeStyle = lit.highlightColor;
    ctx.lineWidth = 1;
    buckets.forEach(function (edges, k) {
      if (!edges.length) return;
      ctx.globalAlpha =
        (lit.highlight * (0.35 + 0.65 * standing(piece)) * (k + 1)) / 4;
      ctx.beginPath();
      edges.forEach(function ({ a, b }) {
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      });
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }

  function drawFace(piece, curl) {
    const tone = colors.sheet;
    const dl = 0.004 * piece.tint + lit.rise * elevation(piece);
    ctx.save();
    pose(piece);
    if (piece.crease) {
      // Each face of the fold is lit by how squarely it turns to the lamp
      const [a, b] = piece.crease;
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const n = { x: -(b.y - a.y) / len, y: (b.x - a.x) / len };
      const { angle } = piece.body;
      const turned = {
        x: n.x * Math.cos(angle) - n.y * Math.sin(angle),
        y: n.x * Math.sin(angle) + n.y * Math.cos(angle),
      };
      const reach = Math.hypot(lit.dx, lit.dy);
      const facing = -(turned.x * lit.dx + turned.y * lit.dy) / reach;
      const side = (pt) => (pt.x - a.x) * n.x + (pt.y - a.y) * n.y;
      [
        [clip(piece.outline, side), facing],
        [clip(piece.outline, (pt) => -side(pt)), -facing],
      ].forEach(function ([poly, f]) {
        trace(poly);
        fillSealed(paint(tone, dl + lit.fold * f));
      });
    } else {
      trace(curl ? curl.face : piece.outline);
      fillSealed(paint(tone, dl));
    }
    ctx.save();
    trace(curl ? curl.face : piece.outline);
    ctx.clip();
    highlightEdges(piece);
    ctx.restore();
    if (curl) {
      // The reverse, darker in the crook of the fold and catching the lamp
      // toward its tip, with a small shadow on the face below it
      const under = colors.reverse;
      const grade = ctx.createLinearGradient(
        curl.fold.x,
        curl.fold.y,
        curl.tip.x,
        curl.tip.y,
      );
      grade.addColorStop(0, paint(under, -0.06));
      grade.addColorStop(1, paint(under, 0.02));
      trace(curl.flap);
      ctx.fillStyle = grade;
      ctx.shadowColor = lit.contact;
      ctx.shadowBlur = 0.02 * lit.u;
      ctx.shadowOffsetX = 0.02 * lit.dx * lit.u;
      ctx.shadowOffsetY = 0.02 * lit.dy * lit.u;
      ctx.fill();
    }
    ctx.restore();
  }

  // Where a piece has been taken out, the cut in the wall shows the recess
  // behind it. The cut's edge on the lamp's side shades the recess below
  // it, crisply at the edge and fading a short way in, and the far wall of
  // the cut catches a thin line of the lamp.
  function drawCut(piece) {
    const hole = piece.outline;
    ctx.save();
    trace(hole);
    ctx.fillStyle = paint(colors.recess, 0);
    ctx.fill();
    ctx.clip();
    const xs = hole.map((pt) => pt.x);
    const ys = hole.map((pt) => pt.y);
    ctx.rect(
      Math.min(...xs) - unit,
      Math.min(...ys) - unit,
      Math.max(...xs) - Math.min(...xs) + 2 * unit,
      Math.max(...ys) - Math.min(...ys) + 2 * unit,
    );
    ctx.fillStyle = "#000";
    [
      [lit.ambient, 0.06, 0.07],
      [lit.pit, 0.012, 0.022],
      [lit.lip, 0.004, -0.008],
    ].forEach(function ([color, blur, distance]) {
      ctx.shadowColor = color;
      ctx.shadowBlur = blur * lit.u;
      ctx.shadowOffsetX = distance * lit.dx * lit.u;
      ctx.shadowOffsetY = distance * lit.dy * lit.u;
      ctx.fill("evenodd");
    });
    ctx.restore();
  }

  // The lamp's pool of light across the whole sheet, falling away from it
  function shine() {
    const x = width * (0.2 + 0.1 * aim.x);
    const y = height * (-0.1 + 0.1 * aim.y);
    const pool = ctx.createRadialGradient(
      x,
      y,
      0,
      x,
      y,
      Math.hypot(width, height),
    );
    pool.addColorStop(0, lit.pool);
    pool.addColorStop(1, lit.falloff);
    ctx.fillStyle = pool;
    ctx.fillRect(0, -thud - 2, width, height + 4);
  }

  let lit = null;

  // The page's controls are paper under the same lamp, so they are told
  // where it is, in the same units their shadows are drawn in
  let lampShared = "";
  function shareLamp() {
    const x = lit.dx.toFixed(2);
    const y = lit.dy.toFixed(2);
    if (x + y === lampShared) return;
    lampShared = x + y;
    root.style.setProperty("--lamp-x", x);
    root.style.setProperty("--lamp-y", y);
  }

  // The light is costly to draw, so once everything has come to rest, with
  // nothing curling and no colour turning, the picture is left as it is
  // until something changes
  let drawn = false;
  function resting() {
    return (
      !rebuild &&
      !turn &&
      thud < 0.01 &&
      Math.abs(aim.x - aimTo.x) < 0.002 &&
      Math.abs(aim.y - aimTo.y) < 0.002 &&
      pieces.every(
        (p) =>
          p.held &&
          Math.abs(p.raise - (p === hovered && !rebuild ? 1 : 0)) < 0.002 &&
          Math.abs(p.lift - (p.front ? 1 : 0)) < 0.002,
      )
    );
  }

  function draw() {
    if (turn) showColors(performance.now());
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.translate(0, thud);
    aim.x += (aimTo.x - aim.x) * 0.08;
    aim.y += (aimTo.y - aim.y) * 0.08;
    lit = light();
    shareLamp();
    pieces.forEach(animate);
    pieces.filter(displaced).forEach(drawCut);
    // Lowest first, a level at a time: within a level every shadow goes
    // down before any face, so pieces of one letter meet without a seam,
    // and a higher piece's shadow lands on the ones below it
    const order = pieces
      .map((piece) => ({ piece, h: elevation(piece), curl: peelOf(piece) }))
      .sort((a, b) => a.h - b.h);
    for (let i = 0; i < order.length; ) {
      let j = i;
      while (j < order.length && order[j].h - order[i].h < 0.01) j++;
      const level = order.slice(i, j);
      level.forEach(({ piece, curl }) =>
        castShadow(piece, curl ? curl.face : piece.outline),
      );
      level.forEach(({ piece, curl }) => drawFace(piece, curl));
      i = j;
    }
    shine();
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
    if (!drawn || !resting()) draw();
    drawn = true;
    requestAnimationFrame(frame);
  }

  function resize() {
    drawn = false;
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

  readColors();
  resize();
  new ResizeObserver(resize).observe(canvas);
  requestAnimationFrame(frame);
})();
