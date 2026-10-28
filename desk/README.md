# /desk — illustrated desk (experiment)

An alternate homepage at `/desk`: Kunal's desk, drawn in the browser, with
Blender-rendered objects you can play with (the screen and Mac mini switch on,
the notebook opens, the cube twists, the plant sways, the photo frame turns to
the next photo, the arcade starts a game, the coffee cup empties). A click (or tap, or Enter) puts an
object in its state and pops a small label; hover only blooms its shadow.
Nothing navigates away.
The desk lamp is the
room's light: off is daylight, on is dusk lit by the lamp. The existing
homepage is untouched.

Still plain static files, like the rest of the site — no build step.

## Structure

    desk/
      index.html        page shell
      desk.css          layout, desk colour, object states (lift, press, focus)
      js/main.js        wiring: object reactions, coordinated reveal
      js/scene.js       projection, fitting, desk surface, object components
      js/layouts.js     art-directed compositions (landscape / portrait), in desk cm
      js/objects.js     object names, reactions, optical scale
      assets/           generated WebP layers, sprites, manifest — do not edit

## How the scene works

Objects are rendered in `~/Repos/illustrated-desk` with one orthographic
camera (37° elevation, −38° azimuth, the mirrored view), in the Rose palette,
under two lights: day (soft daylight) and night (dim dusk + the lamp's spot,
placed where the lamp stands relative to each object). The export
(`tools/export_web.py`) writes each object's size, ground anchor and silhouette
polygon in **real centimetres** to `assets/manifest.js`.

`scene.js` projects desk-plane centimetres with that same camera, so a layout
entry like `rubiks: { x: -2, y: -20 }` puts the cube 2 cm along the desk and
20 cm toward the viewer. Each object is a component:

- a shadow layer (in a shared layer under all objects),
- a visual (resting render, alternate state, or frame sprite),
  once per light; the night set fades in over the day set,
- a `<button>` clipped to the object's silhouette, so clicks never land on
  transparent padding or shadows.

Placement is entirely in the frontend; nothing is baked into one big image.
The desk, the surround and the lamp's pool of light are drawn in the page, so
they recolour with the light (`desk.css`, tones in `layouts.js`). Add
`?mode=night` or `?mode=day` to review one light; otherwise the page starts in
the visitor's system preference.

## Updating assets

    # in ~/Repos/illustrated-desk, with the render listener running
    tools/job.sh "--world rose2 --mode day,night --objects lamp,rubiks,notebook,macmini,plant,monitor --states --state-samples 128"
    python3 tools/export_web.py ~/Repos/portfolio-2025/desk/assets
