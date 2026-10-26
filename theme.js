(function () {
  const root = document.documentElement;
  const pull = document.getElementById("theme-pull");
  const svg = pull.querySelector("svg");
  const chain = pull.querySelector(".pull-chain");
  const beads = pull.querySelector("#pull-beads");
  const weight = pull.querySelector(".pull-weight");
  const narrow = window.matchMedia("(max-width: 639px)");
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // A pull-chain light switch, in three movements:
  //
  //   pull    the chain comes out with the pointer, a little less the
  //           further it goes, as if against a spring inside
  //   click   at ENGAGE pixels of chain the switch catches, the handle
  //           drops a short step, and the light changes, once per pull
  //   return  let go, the chain is drawn back up quickly, rides a hair
  //           past where it hangs and settles without bouncing
  //
  // A tap or a key press plays the same movements on its own.
  const GIVE = 120;
  const ENGAGE = 40;
  const TAP_DEPTH = 46;
  const TAP_TIME = 130;
  const LEAN = 5;

  // Held, the chain chases the pointer this quickly (seconds), so it moves
  // smoothly between pointer events but never feels behind the hand
  const FOLLOW = 0.03;

  // The return spring: stiff and nearly critically damped, so it overshoots
  // by a few percent once and comes to rest
  const STIFFNESS = 900;
  const DAMPING = 2 * 0.72 * Math.sqrt(STIFFNESS);

  function currentTheme() {
    return root.dataset.theme || (systemDark.matches ? "dark" : "light");
  }

  // The button names the theme it switches to
  function updateLabel() {
    const next = currentTheme() === "dark" ? "light" : "dark";
    pull.setAttribute("aria-label", "Switch to " + next + " mode");
  }

  function flip() {
    const next = currentTheme() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch (e) {}
    updateLabel();
  }

  // Chain out (px) and lean (deg), each with a speed for the springs
  let out = 0;
  let outSpeed = 0;
  let lean = 0;
  let leanSpeed = 0;
  let gesture = null;
  let tap = null;
  let last = 0;
  let running = false;
  // A hovering pointer lowers the weight a touch; the click drops it a
  // short step and holds it there until the chain is let go
  let hover = 0;
  let hoverTo = 0;
  let detent = 0;

  // The drawing, top down: the fitting (SOCKET tall), the chain hanging
  // its resting length plus however far it is out, the weight and its
  // connector (WEIGHT), and room below so the handle is easy to catch
  const SOCKET = 8;
  const WEIGHT = 28.5;
  const BELOW = 10;
  const hanging = () => (narrow.matches ? 44 : 60);

  function render() {
    const length = Math.max(4, hanging() + out + hover + detent);
    const end = SOCKET + length;
    chain.setAttribute("height", length.toFixed(2));
    // Beads count up from the weight, so the last always meets it whole
    const at = (x, y) => "translate(" + x + " " + y.toFixed(2) + ")";
    beads.setAttribute("patternTransform", at(0, end));
    weight.setAttribute("transform", at(22, end + 4.5));
    const tall = Math.ceil(end + WEIGHT + BELOW);
    svg.setAttribute("height", tall);
    svg.setAttribute("viewBox", "0 0 44 " + tall);
    pull.style.setProperty("--sway", lean.toFixed(2) + "deg");
  }

  // Resistance: pointer travel maps to less and less chain
  const extension = (travel) => GIVE * (1 - Math.exp(-travel / GIVE));
  const travelFor = (chain) =>
    -GIVE * Math.log(1 - Math.min(chain, GIVE - 1) / GIVE);

  function engage(state) {
    if (state.engaged) return;
    state.engaged = true;
    if (navigator.vibrate) navigator.vibrate(6);
    flip();
  }

  // Stepped in quarters of a frame; a spring this stiff stepped a whole
  // frame at a time loses its overshoot to the arithmetic
  function settle(dt) {
    const h = dt / 4;
    for (let i = 0; i < 4; i++) {
      outSpeed += (-STIFFNESS * out - DAMPING * outSpeed) * h;
      out += outSpeed * h;
      // The lean comes back critically damped, never swinging through
      const k = 500;
      leanSpeed += (-k * lean - 2 * Math.sqrt(k) * leanSpeed) * h;
      lean += leanSpeed * h;
    }
  }

  function step(now) {
    // A frame can be stamped a little before the animation was started, so
    // time never runs backwards here
    const dt = Math.max(0, Math.min(1 / 30, (now - last) / 1000));
    last = now;
    if (tap) {
      // The tap's own pull, easing into the catch, timed from its first frame
      if (tap.start === null) tap.start = now;
      const t = Math.min(1, (now - tap.start) / TAP_TIME);
      out = tap.from + (TAP_DEPTH - tap.from) * t * t * (3 - 2 * t);
      if (out >= ENGAGE) engage(tap);
      if (t === 1) {
        tap = null;
        outSpeed = 0;
        letGo();
      }
    } else if (gesture) {
      // Following the hand, keeping its speed for when it lets go
      const k = 1 - Math.exp(-dt / FOLLOW);
      const was = { out, lean };
      out += (gesture.out - out) * k;
      lean += (gesture.lean - lean) * k;
      if (dt > 0) {
        outSpeed = (out - was.out) / dt;
        leanSpeed = (lean - was.lean) / dt;
      }
      if (out >= ENGAGE) engage(gesture);
    } else {
      settle(dt);
    }
    // The click and the hover each close in quickly on where they belong
    const engaged = (gesture && gesture.engaged) || (tap && tap.engaged);
    const detentTo = engaged ? 2 : 0;
    detent += (detentTo - detent) * (1 - Math.exp(-dt / 0.018));
    hover += (hoverTo - hover) * (1 - Math.exp(-dt / 0.09));
    render();
    const resting =
      !gesture &&
      !tap &&
      Math.abs(detent - detentTo) < 0.01 &&
      Math.abs(hover - hoverTo) < 0.01 &&
      Math.abs(out) < 0.05 &&
      Math.abs(outSpeed) < 1 &&
      Math.abs(lean) < 0.02 &&
      Math.abs(leanSpeed) < 0.5;
    if (!resting) return requestAnimationFrame(step);
    out = outSpeed = lean = leanSpeed = 0;
    detent = detentTo;
    hover = hoverTo;
    render();
    running = false;
  }

  function run() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(step);
  }

  function letGo() {
    if (reducedMotion.matches) {
      out = outSpeed = lean = leanSpeed = detent = 0;
      render();
      return;
    }
    run();
  }

  function tug() {
    if (gesture || tap) return;
    if (reducedMotion.matches) return flip();
    tap = { start: null, from: Math.max(0, out), engaged: false };
    run();
  }

  pull.addEventListener("pointerdown", function (event) {
    if (event.button !== 0 || gesture) return;
    tap = null;
    // Taking hold of a chain still on its way back picks it up where it is
    gesture = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY - travelFor(Math.max(0, out)),
      // How long the button is without the chain pulled out, measured
      // once here rather than on every move
      hangs: pull.offsetHeight - out,
      out: Math.max(0, out),
      lean,
      moved: false,
      engaged: false,
    };
    pull.setPointerCapture(event.pointerId);
    pull.classList.add("is-held");
    root.classList.add("is-pulling");
    run();
  });

  pull.addEventListener("pointermove", function (event) {
    if (!gesture || event.pointerId !== gesture.id) return;
    const dx = event.clientX - gesture.x;
    const travel = Math.max(0, event.clientY - gesture.y);
    const wander = Math.hypot(
      event.clientX - gesture.startX,
      event.clientY - gesture.startY,
    );
    if (wander > 4) gesture.moved = true;
    gesture.out = extension(travel);
    const reach = gesture.hangs + gesture.out;
    const angle = (-Math.atan2(dx, reach) * 180) / Math.PI;
    gesture.lean = Math.max(-LEAN, Math.min(LEAN, angle));
  });

  function release(event, cancelled) {
    if (!gesture || event.pointerId !== gesture.id) return;
    const { moved, engaged } = gesture;
    gesture = null;
    pull.classList.remove("is-held");
    root.classList.remove("is-pulling");
    // A press that never really pulled is a tap
    if (!cancelled && !moved && !engaged) return tug();
    letGo();
  }

  pull.addEventListener("pointerup", (event) => release(event, false));
  pull.addEventListener("pointercancel", (event) => release(event, true));
  // The browser can take the pointer away without either of those, such as
  // when the window loses focus mid-pull; the chain must not stay down
  pull.addEventListener("lostpointercapture", (event) => release(event, true));

  // Pointer presses are handled above, so the click that follows them is
  // ignored; Enter and Space arrive as a click with no pointer behind it
  pull.addEventListener("click", function (event) {
    if (event.detail === 0) tug();
  });

  // Another tab or the system changing the theme keeps the label in step
  window.addEventListener("storage", function (event) {
    if (event.key !== "theme" || !event.newValue) return;
    root.dataset.theme = event.newValue;
    updateLabel();
  });
  pull.addEventListener("pointerenter", function (event) {
    if (event.pointerType !== "mouse") return;
    hoverTo = reducedMotion.matches ? 0 : 2;
    run();
  });
  pull.addEventListener("pointerleave", function () {
    hoverTo = 0;
    run();
  });

  systemDark.addEventListener("change", updateLabel);
  narrow.addEventListener("change", render);
  updateLabel();
  render();
})();
