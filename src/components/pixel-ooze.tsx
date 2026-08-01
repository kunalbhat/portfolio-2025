"use client";

import { useEffect, useRef } from "react";

/**
 * A full-screen field of near-black pixels that ooze and drip downward on a
 * pure-black background. The liquid is only a few luminance steps above the
 * background, so motion is felt more than seen — intrigue over spectacle.
 *
 * Model: a coarse grid of "density" cells. Sources open at the top and feed
 * columns; gravity drains each cell into the one below (leaving a sticky
 * residue that becomes a trail), pooling spreads sideways, and everything
 * slowly evaporates so drips appear, reach, and dissolve.
 */
export default function PixelOoze() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d", { alpha: false });
    if (!ctx) return;
    const canvas: HTMLCanvasElement = cv;
    const context: CanvasRenderingContext2D = ctx;

    const CELL = 7; // chunky pixels
    const MAX_STACK = 1.25; // how much a cell can hold before it spreads
    const STICK = 0.14; // residue left behind → the trail
    const FLOW = 0.6; // viscosity (0..1); lower = slower ooze
    const EVAP = 0.0022; // per-frame fade of the trails

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const spawnChance = reduced ? 0.02 : 0.14;

    let W = 0;
    let H = 0;
    let density = new Float32Array(0);
    let sources: { x: number; ttl: number; strength: number }[] = [];
    let raf = 0;
    let frame = 0;

    function resize() {
      const cssW = window.innerWidth;
      const cssH = window.innerHeight;
      canvas.width = cssW;
      canvas.height = cssH;
      W = Math.ceil(cssW / CELL);
      H = Math.ceil(cssH / CELL);
      density = new Float32Array(W * H);
      sources = [];
      context.imageSmoothingEnabled = false;
    }

    // Deterministic per-cell jitter so the ooze isn't flat gray.
    function jitter(x: number, y: number) {
      const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      return n - Math.floor(n); // 0..1
    }

    function step() {
      frame++;

      // Open new sources at the top — thin faucets that run for a while.
      if (Math.random() < spawnChance) {
        sources.push({
          x: (Math.random() * W) | 0,
          ttl: 30 + ((Math.random() * 150) | 0),
          strength: 0.18 + Math.random() * 0.4,
        });
      }
      for (let s = sources.length - 1; s >= 0; s--) {
        const src = sources[s];
        const i = src.x;
        density[i] += src.strength;
        if (src.x + 1 < W) density[i + 1] += src.strength * 0.3;
        src.ttl--;
        if (src.ttl <= 0) sources.splice(s, 1);
      }

      // Gravity + spreading, resolved bottom-up so density moves once per frame.
      for (let y = H - 2; y >= 0; y--) {
        for (let x = 0; x < W; x++) {
          const i = y * W + x;
          const d = density[i];
          if (d <= 0.001) continue;

          const avail = d - STICK;
          if (avail <= 0) continue;

          const below = i + W;
          const space = MAX_STACK - density[below];
          if (space > 0.02) {
            const move = Math.min(avail, space) * FLOW;
            density[below] += move;
            density[i] -= move;
          } else {
            // Below is full — pool sideways into whichever neighbor has room.
            const give = Math.min(avail, 0.25) * FLOW;
            const goRight = jitter(x, y + frame) > 0.5;
            const nx = goRight ? x + 1 : x - 1;
            if (nx >= 0 && nx < W) {
              const ni = y * W + nx;
              if (density[ni] < MAX_STACK) {
                density[ni] += give;
                density[i] -= give;
              }
            }
          }
        }
      }

      // Evaporate so trails fade and the screen never saturates.
      for (let i = 0; i < density.length; i++) {
        const v = density[i] - EVAP;
        density[i] = v > 0 ? v : 0;
      }

      // Render.
      context.fillStyle = "#000";
      context.fillRect(0, 0, canvas.width, canvas.height);

      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = y * W + x;
          const d = density[i];
          if (d <= 0.02) continue;

          const v = d > 1 ? 1 : d;
          // Base luminance stays very low — black on black.
          let lum = 5 + v * 34 + jitter(x, y) * 4;

          // Wet sheen at a drip's leading tip (dense cell, empty below).
          const belowD = y + 1 < H ? density[i + W] : 1;
          if (belowD < 0.06 && d > 0.35) lum += 26;

          const c = lum > 255 ? 255 : lum | 0;
          // A whisper of cool tint to feel like liquid, not dust.
          context.fillStyle = `rgb(${(c * 0.92) | 0},${(c * 0.96) | 0},${c})`;
          context.fillRect(x * CELL, y * CELL, CELL, CELL);
        }
      }

      raf = requestAnimationFrame(step);
    }

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 h-full w-full"
    />
  );
}
