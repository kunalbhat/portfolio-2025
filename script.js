(function () {
  const header = document.getElementById("site-header");
  const logoLink = document.getElementById("logo-link");

  let isVisible = true;
  let lastScroll = 0;
  let lastHidePosition = 0;

  function onScroll() {
    const current = window.scrollY || 0;
    logoLink.toggleAttribute("data-scrolled", current > 12);

    const delta = current - lastScroll;

    // Always show near the top
    if (current < 20) {
      if (!isVisible) {
        isVisible = true;
        header.removeAttribute("data-hidden");
      }
      lastHidePosition = current;
      lastScroll = current;
      return;
    }

    // If scrolling further down while hidden, update the hide anchor
    if (!isVisible && delta > 0) {
      lastHidePosition = current;
    }

    // Hide when scrolling down
    if (delta > 0 && isVisible) {
      isVisible = false;
      header.setAttribute("data-hidden", "");
      lastHidePosition = current;
    }

    // Reveal after 120px of upward travel from the last hide point
    if (delta < 0 && !isVisible) {
      const upDistance = lastHidePosition - current;
      if (upDistance >= 120) {
        isVisible = true;
        header.removeAttribute("data-hidden");
      }
    }

    lastScroll = current;
  }

  window.addEventListener("scroll", onScroll, { passive: true });

  const year = document.getElementById("copyright-year");
  if (year) year.textContent = new Date().getFullYear();
})();
