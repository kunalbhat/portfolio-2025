# Kunal Bhat

A small personal website: a few paragraphs of type, and a set of toy blocks you can push around.

## Tech Stack
Plain static HTML, CSS, and vanilla JavaScript — no framework, no build step. Physics comes from [Matter.js](https://brm.io/matter-js/), vendored in `vendor/`.

- `blocks.js` — the toy blocks: the set, how they drop to the floor, dragging them around, and the toy lamp
- `theme.js` — light and dark: the lamp switches it, and the new theme wipes out from the bulb

## Local Development
Serve the directory with any static file server, e.g.:
```bash
python3 -m http.server 4173
```

## Deploy
Push to `main` — Vercel serves this as a static site with zero build configuration.
