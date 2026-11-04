# Find Kunal

A personal site that's a tiny pixel town in the first week of November in Chicago. Somewhere in it, on a park bench with a laptop, a coffee and a pigeon on his head, is me. Find me, then keep looking around: most of the town is my life.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static output in dist/ (Vercel builds this)
npm run shot -- <url> <out.png> [w] [h] [dpr] [script.js]   # headless screenshot
```

## How it's made

Every pixel is drawn in code: no image assets. The world is painted once into a 1440×960 bitmap (ground, buildings), and everything that moves or that people walk behind is a sprite sorted by depth. Each frame composites the visible part at world resolution and scales it up with crisp pixels; at rest the zoom settles on a whole number of device pixels per world pixel.

| Path | What |
| --- | --- |
| `src/art/` | Palette, a pixel `Bitmap`, the pixel font, and the hand-drawn templates: `people.ts` (poses × hair × clothes × held items), `animals.ts` (Nougat, dogs, pigeons, ducks…), `props.ts` (trees, lamps, benches, the bean…), `vehicles.ts` |
| `src/world/layout.ts` | Where everything is |
| `src/world/ground.ts`, `buildings.ts` | The painted town |
| `src/world/actors.ts` | Entity types: props, townsfolk (idle loops, routes, scripts, hop-on-tap), critters, hotspots |
| `src/world/scene.ts` | The composition: every person, prop, ambient loop and easter egg |
| `src/engine/` | Camera (pan/zoom/fly/inertia), input (mouse, trackpad, touch, keys), the frame compositor, particles and speech bubbles |
| `src/ui/minigame.ts` | Ghost Hop, the game on the studio monitor |
| `src/main.ts` | The story: Find Kunal card, hints, the found moment, intro card, keyboard/screen-reader access |

## Little things to find

Nougat (with someone's tennis ball), the tennis rally, the game on a studio monitor, the rooftop cinema, a Rubik's cube in a pigeon's nest on a lamp, a trick-or-treater who is not a kid, the hot dog cart (no ketchup), the raccoon in the alley, the family at the swings, a coffee cup. Plus a lot of townsfolk with opinions.
