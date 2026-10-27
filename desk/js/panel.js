// Content panel: a modal <dialog> (focus trap, Escape, inert background for
// free) with a real URL per section, so sections deep-link and the browser's
// back/forward buttons open and close them.

import { SECTIONS } from "./content.js";

const BASE = "/desk/";
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)");

export class Panel {
  /**
   * @param {HTMLDialogElement} dialog
   * @param {{ onOpen?: (id: string) => void, onClose?: (id: string) => void }} hooks
   */
  constructor(dialog, hooks = {}) {
    this.dialog = dialog;
    this.hooks = hooks;
    this.current = null;
    this.title = dialog.querySelector("#panel-title");
    this.eyebrow = dialog.querySelector(".panel-eyebrow");
    this.body = dialog.querySelector(".panel-body");
    this.scroller = dialog.querySelector(".panel-scroll");
    this.baseTitle = document.title;

    dialog.querySelector(".panel-close").addEventListener("click", () => this.requestClose());
    dialog.addEventListener("cancel", (e) => {
      e.preventDefault();
      this.requestClose();
    });
    // A click outside the sheet lands on the dialog itself. The page behind is
    // inert while the panel is open, so if the click was on a visible header
    // link, switch to that section; otherwise close and return to the desk.
    dialog.addEventListener("click", (e) => {
      if (e.target !== dialog) return;
      const link = [...document.querySelectorAll("[data-nav]")].find((a) => {
        const r = a.getBoundingClientRect();
        return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      });
      if (link) this.open(link.dataset.nav);
      else this.requestClose();
    });
    window.addEventListener("popstate", () => this.syncToUrl());
  }

  /** Section id encoded in the current URL, if any. */
  static sectionFromUrl() {
    const m = location.pathname.match(/^\/desk\/([a-z]+)\/?$/);
    return m && SECTIONS[m[1]] ? m[1] : null;
  }

  syncToUrl() {
    const id = Panel.sectionFromUrl();
    if (id && id !== this.current) this.#show(id);
    else if (!id && this.current) this.#hide();
  }

  /** Open from an interaction: adds a history entry. */
  open(id) {
    if (this.current === id) return;
    const replace = this.current !== null;
    const url = `${BASE}${id}`;
    if (replace) history.replaceState({ panel: id, pushed: history.state?.pushed }, "", url);
    else history.pushState({ panel: id, pushed: true }, "", url);
    this.#show(id);
  }

  requestClose() {
    if (!this.current) return;
    // If we added the history entry, step back so Back doesn't reopen it.
    if (history.state?.pushed) history.back();
    else {
      history.replaceState({}, "", BASE);
      this.#hide();
    }
  }

  #render(section) {
    this.eyebrow.textContent = section.eyebrow;
    this.title.textContent = section.title;
    if (section.html) {
      this.body.innerHTML = section.html;
      return;
    }
    const parts = [];
    if (section.lede) parts.push(`<p class="lede">${section.lede}</p>`);
    parts.push('<ul class="items">');
    for (const it of section.items) {
      const link = it.href
        ? `<a class="item-link" href="${it.href}" target="_blank" rel="noopener noreferrer">${it.linkLabel || "Visit"}<span aria-hidden="true"> ↗</span></a>`
        : "";
      parts.push(`<li class="item">
        <h3>${it.title}</h3>
        ${it.meta ? `<p class="item-meta">${it.meta}</p>` : ""}
        <p>${it.text}</p>
        ${link}
      </li>`);
    }
    parts.push("</ul>");
    this.body.innerHTML = parts.join("");
  }

  #show(id) {
    const section = SECTIONS[id];
    const prev = this.current;
    this.current = id;
    this.#render(section);
    this.scroller.scrollTop = 0;
    document.title = `${section.title} — Kunal Bhat`;
    this.dialog.classList.remove("is-closing");
    if (!this.dialog.open) this.dialog.showModal();
    this.title.focus({ preventScroll: true });
    if (prev && prev !== id) this.hooks.onClose?.(prev);
    this.hooks.onOpen?.(id);
    document.querySelectorAll("[data-nav]").forEach((a) => {
      if (a.dataset.nav === id) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  #hide() {
    const id = this.current;
    this.current = null;
    document.title = this.baseTitle;
    document.querySelectorAll("[data-nav]").forEach((a) => a.removeAttribute("aria-current"));
    this.hooks.onClose?.(id);
    if (REDUCED.matches) {
      this.dialog.close();
      return;
    }
    this.dialog.classList.add("is-closing");
    const done = () => {
      if (this.current) return; // reopened meanwhile
      this.dialog.classList.remove("is-closing");
      this.dialog.close();
    };
    setTimeout(done, 220);
  }
}
