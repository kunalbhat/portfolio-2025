(function () {
  const root = document.documentElement;
  const button = document.getElementById("theme");
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

  // The round paper button switches the light. The theme follows the
  // system until it is set here, and is remembered and kept in step
  // across tabs.
  function currentTheme() {
    return root.dataset.theme || (systemDark.matches ? "dark" : "light");
  }

  function show() {
    button.setAttribute("aria-pressed", String(currentTheme() === "dark"));
  }

  button.addEventListener("click", function () {
    const next = currentTheme() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch (e) {}
    show();
  });

  // Another tab or the system changing the theme keeps the button in step
  window.addEventListener("storage", function (event) {
    if (event.key !== "theme" || !event.newValue) return;
    root.dataset.theme = event.newValue;
    show();
  });
  systemDark.addEventListener("change", show);

  show();
})();
