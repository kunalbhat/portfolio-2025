(function () {
  // Some browsers don't reliably honor the declarative `autoplay` attribute;
  // an explicit play() call is a standard, more reliable fallback.
  document.querySelectorAll(".portfolio-card video").forEach((video) => {
    video.play().catch(() => {});
  });

  const header = document.getElementById("site-header");
  const logoLink = document.getElementById("logo-link");

  let isVisible = true;
  let lastScroll = 0;
  let lastHidePosition = 0;

  function onScroll() {
    const current = window.scrollY || 0;
    logoLink.classList.toggle("is-scrolled", current > 12);

    const delta = current - lastScroll;

    // Always show near the top
    if (current < 20) {
      if (!isVisible) {
        isVisible = true;
        header.classList.remove("site-header--hidden");
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
      header.classList.add("site-header--hidden");
      lastHidePosition = current;
    }

    // Reveal after 120px of upward travel from the last hide point
    if (delta < 0 && !isVisible) {
      const upDistance = lastHidePosition - current;
      if (upDistance >= 120) {
        isVisible = true;
        header.classList.remove("site-header--hidden");
      }
    }

    lastScroll = current;
  }

  window.addEventListener("scroll", onScroll, { passive: true });
})();
