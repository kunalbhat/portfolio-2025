(function () {
  const root = document.documentElement;
  const toggle = document.getElementById("theme-toggle");
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

  function currentTheme() {
    return root.dataset.theme || (systemDark.matches ? "dark" : "light");
  }

  // The button names the theme it switches to
  function updateLabel() {
    const next = currentTheme() === "dark" ? "Light" : "Dark";
    toggle.textContent = next;
    toggle.setAttribute("aria-label", "Switch to " + next.toLowerCase() + " mode");
  }

  toggle.addEventListener("click", function () {
    const next = currentTheme() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch (e) {}
    updateLabel();
  });

  systemDark.addEventListener("change", updateLabel);
  updateLabel();
})();
