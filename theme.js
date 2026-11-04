(function () {
  // Light and dark. The page follows the system until the visitor switches
  // the lamp, and remembers the choice after that.
  //
  // The switch is a view transition: the new theme wipes out of the lamp
  // (or the old one wipes back into it) in a clean-edged circle. Without
  // view transitions, or with reduced motion, the colours cross-fade instead.

  const root = document.documentElement;
  const system = window.matchMedia("(prefers-color-scheme: dark)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let busy = false;

  function current() {
    return root.dataset.theme || (system.matches ? "dark" : "light");
  }

  function announce(animated) {
    window.dispatchEvent(
      new CustomEvent("themechange", {
        detail: { theme: current(), animated },
      }),
    );
  }

  function apply(next) {
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch (e) {}
  }

  // `origin` is the point in the viewport the light comes from
  function toggle(origin) {
    if (busy) return;
    const next = current() === "dark" ? "light" : "dark";

    if (!document.startViewTransition || reducedMotion.matches || !origin) {
      root.classList.add("theme-fading");
      apply(next);
      announce(true);
      clearTimeout(toggle.fade);
      toggle.fade = setTimeout(() => root.classList.remove("theme-fading"), 700);
      return;
    }

    const { x, y } = origin;
    const far = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );
    root.style.setProperty("--vt-x", `${x}px`);
    root.style.setProperty("--vt-y", `${y}px`);
    root.style.setProperty("--vt-end", `${far}px`);
    root.dataset.lamp = next === "light" ? "on" : "off";

    busy = true;
    const transition = document.startViewTransition(() => {
      apply(next);
      announce(false);
    });
    transition.finished.finally(() => {
      delete root.dataset.lamp;
      busy = false;
    });
  }

  system.addEventListener("change", () => {
    if (root.dataset.theme) return;
    root.classList.add("theme-fading");
    announce(true);
    setTimeout(() => root.classList.remove("theme-fading"), 700);
  });

  window.siteTheme = { current, toggle };
})();
