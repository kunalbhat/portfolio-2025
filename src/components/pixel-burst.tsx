"use client";

import { useEffect, useRef } from "react";

type Props = {
  colors: string[]; // colors[0] is the accent (status-bar) tone
  bg: string;
  onDone: () => void;
};

const DURATION = 700; // ms — short and restrained

/**
 * A one-shot pixel explosion. Chunky squares scatter outward from center with
 * a little gravity, fading as they go, then the screen settles to `bg`. Used
 * to "destroy" the terminal when powering down.
 */
export default function PixelBurst({ colors, bg, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const doneRef = useRef(onDone);

  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d", { alpha: false });
    if (!ctx) return;
    const canvas = cv;
    const context = ctx;

    const W = (canvas.width = window.innerWidth);
    const H = (canvas.height = window.innerHeight);
    context.imageSmoothingEnabled = false;

    const settle = () => {
      context.fillStyle = bg;
      context.fillRect(0, 0, W, H);
      doneRef.current();
    };

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) {
      const t = window.setTimeout(settle, 120);
      return () => window.clearTimeout(t);
    }

    const cx = W / 2;
    const cy = H * 0.48;
    const barTop = H - 28; // status-bar band → accent-colored pixels
    const count = Math.min(700, Math.floor((W * H) / 2600));

    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      s: number;
      c: string;
    };
    const parts: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const dx = x - cx;
      const dy = y - cy;
      const d = Math.hypot(dx, dy) || 1;
      const speed = 2 + Math.random() * 6;
      parts.push({
        x,
        y,
        vx: (dx / d) * speed + (Math.random() - 0.5) * 2,
        vy: (dy / d) * speed - (1 + Math.random() * 2), // slight upward pop
        s: 3 + ((Math.random() * 3) | 0),
        c:
          y > barTop
            ? colors[0]
            : colors[1 + ((Math.random() * (colors.length - 1)) | 0)],
      });
    }

    const gravity = 0.35;
    let raf = 0;
    let start = 0;

    const frame = (t: number) => {
      if (!start) start = t;
      const elapsed = t - start;

      context.fillStyle = bg;
      context.fillRect(0, 0, W, H);
      context.globalAlpha = Math.max(0, 1 - elapsed / DURATION);
      for (const p of parts) {
        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;
        context.fillStyle = p.c;
        context.fillRect(p.x | 0, p.y | 0, p.s, p.s);
      }
      context.globalAlpha = 1;

      if (elapsed < DURATION) {
        raf = requestAnimationFrame(frame);
      } else {
        settle();
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [colors, bg]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 h-full w-full"
    />
  );
}
