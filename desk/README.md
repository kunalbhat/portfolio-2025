# /desk — illustrated desk (experiment)

An alternate homepage at `/desk`: Kunal's desk, drawn in the browser, with
Blender-rendered objects that open sections of the site. The existing homepage
is untouched.

Still plain static files, like the rest of the site — no build step.

## Structure

    desk/
      index.html        page shell, header navigation, panel <dialog>
      desk.css          layout, desk colours, object states, panel, mobile sheet
      js/main.js        wiring: scene ↔ panel ↔ navigation, coordinated reveal
      js/scene.js       projection, fitting, desk surface, object components
      js/layouts.js     art-directed compositions (landscape / portrait), in desk cm
      js/objects.js     object roles, labels, interactions, optical scale
      js/content.js     section copy (from earlier versions of the site)
      js/panel.js       section panel, URL state (/desk/work …), history
      assets/           generated WebP layers, sprites, manifest — do not edit

## How the scene works

Objects are rendered in `~/Repos/illustrated-desk` with one orthographic
camera (37° elevation, 38° azimuth) and one light rig. The export
(`tools/export_web.py`) writes each object's size, ground anchor and silhouette
polygon in **real centimetres** to `assets/manifest.js`.

`scene.js` projects desk-plane centimetres with that same camera, so a layout
entry like `rubiks: { x: 15, y: -33 }` puts the cube 15 cm along the desk's
front edge and 33 cm toward the viewer. Each object is a component:

- a shadow layer (in a shared layer under all objects),
- a visual (resting render, alternate state, or frame sprite),
- a `<button>` clipped to the object's silhouette, so clicks never land on
  transparent padding or shadows.

Placement is entirely in the frontend; nothing is baked into one big image.

## Updating assets

    # in ~/Repos/illustrated-desk, with the render listener running
    tools/job.sh "--object rubiks --states --state-samples 160"
    python3 tools/export_web.py ~/Repos/portfolio-2025/desk/assets

## Routes

`/desk/work`, `/desk/builds`, `/desk/play`, `/desk/about` open their section
directly (Vercel rewrite in `vercel.json`).
