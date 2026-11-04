// Colours are packed as 0xAABBGGRR so they can be written straight into an
// ImageData-backed Uint32Array on little-endian machines (all of them, here).

export type Color = number;

export function hex(h: string): Color {
  const n = parseInt(h.replace('#', ''), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return rgb(r, g, b);
}

export function rgb(r: number, g: number, b: number, a = 255): Color {
  return (((a & 255) << 24) | ((b & 255) << 16) | ((g & 255) << 8) | (r & 255)) >>> 0;
}

export const R = (c: Color) => c & 255;
export const G = (c: Color) => (c >>> 8) & 255;
export const B = (c: Color) => (c >>> 16) & 255;
export const A = (c: Color) => (c >>> 24) & 255;

const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v));

/** Mix two colours; t = 0 gives a, t = 1 gives b. */
export function mix(a: Color, b: Color, t: number): Color {
  return rgb(clamp(R(a) + (R(b) - R(a)) * t), clamp(G(a) + (G(b) - G(a)) * t), clamp(B(a) + (B(b) - B(a)) * t));
}

// Shadows lean cool and violet, highlights lean warm, the way the late
// afternoon light falls across the whole town.
const SHADOW = hex('#3b2f63');
const SUN = hex('#fff1c2');

/** The colour this surface would be in shadow. */
export function shadow(c: Color, k = 1): Color {
  const t = 0.42 * k;
  return rgb(
    clamp(R(c) * (1 - t) + R(SHADOW) * t * 0.6),
    clamp(G(c) * (1 - t) + G(SHADOW) * t * 0.6),
    clamp(B(c) * (1 - t * 0.75) + B(SHADOW) * t * 0.75),
  );
}

/** The colour this surface would be catching the sun. */
export function sunlit(c: Color, k = 1): Color {
  return mix(c, SUN, 0.28 * k);
}

/** A darker, slightly more saturated version for outlines. */
export function ink(c: Color): Color {
  return rgb(clamp(R(c) * 0.38 + 14), clamp(G(c) * 0.34 + 10), clamp(B(c) * 0.42 + 22));
}

export function toCss(c: Color): string {
  return `rgb(${R(c)},${G(c)},${B(c)})`;
}
