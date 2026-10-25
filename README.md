# Kunal Bhat

A small personal website. My name is built as a sculpture of blocks, and you can take it apart a piece at a time.

## Tech Stack
Plain static HTML, CSS, and vanilla JavaScript — no framework, no build step. Physics comes from [Matter.js](https://brm.io/matter-js/), vendored in `vendor/`.

- `sculpture.js` — the name sculpture: the letters, their blocks, and how they come apart

## Local Development
Serve the directory with any static file server, e.g.:
```bash
python3 -m http.server 4173
```

## Deploy
Push to `main` — Vercel serves this as a static site with zero build configuration.
