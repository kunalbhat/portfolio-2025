import { Camera } from './camera';

// Mouse, trackpad, touch and keyboard all drive the one camera.
//  · drag (any pointer) pans, with a little glide when you let go
//  · a mouse wheel zooms around the cursor; a trackpad's two-finger scroll
//    pans and its pinch zooms (browsers report pinch as ctrl + wheel)
//  · two fingers pinch-zoom and pan together; double-tap zooms in
//  · arrow keys / WASD pan, + and - zoom
// A press that barely moves is a tap, and goes to onTap in world coordinates.

export interface InputHandlers {
  onTap(wx: number, wy: number, pointerType: string): void;
  onHover(wx: number, wy: number): void;
  onFirstMove(): void;
}

export function attachInput(el: HTMLElement, cam: Camera, h: InputHandlers) {
  const pointers = new Map<number, { x: number; y: number; sx: number; sy: number; t: number }>();
  let pinchStart: null | { d: number; z: number; cx: number; cy: number } = null;
  let lastTap = { t: 0, x: 0, y: 0 };
  let moved = false;
  let lastMove = { t: 0, x: 0, y: 0 };
  let announced = false;
  const first = () => { if (!announced) { announced = true; h.onFirstMove(); } };

  const local = (e: { clientX: number; clientY: number }) => {
    const r = el.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  };

  el.addEventListener('pointerdown', (e) => {
    el.setPointerCapture(e.pointerId);
    const [x, y] = local(e);
    pointers.set(e.pointerId, { x, y, sx: x, sy: y, t: performance.now() });
    cam.vx = cam.vy = 0;
    if (pointers.size === 1) { moved = false; cam.dragging = true; lastMove = { t: performance.now(), x, y }; }
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchStart = { d: Math.hypot(a.x - b.x, a.y - b.y), z: cam.z, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
      cam.pinching = true;
      moved = true;
    }
  });

  el.addEventListener('pointermove', (e) => {
    const [x, y] = local(e);
    if (!pointers.size) { const [wx, wy] = cam.screenToWorld(x, y); h.onHover(wx, wy); return; }
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const dx = x - p.x, dy = y - p.y;
    p.x = x; p.y = y;
    if (pointers.size === 1) {
      if (!moved && Math.hypot(x - p.sx, y - p.sy) > (e.pointerType === 'touch' ? 10 : 5)) { moved = true; first(); el.classList.add('grabbing'); }
      if (moved) {
        cam.panBy(dx, dy);
        const now = performance.now();
        const dtm = Math.max(1, now - lastMove.t);
        // velocity in css px per second, smoothed
        cam.vx = cam.vx * 0.6 + ((x - lastMove.x) / dtm) * 1000 * 0.4;
        cam.vy = cam.vy * 0.6 + ((y - lastMove.y) / dtm) * 1000 * 0.4;
        lastMove = { t: now, x, y };
      }
    } else if (pointers.size === 2 && pinchStart) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
      cam.panBy(cx - pinchStart.cx, cy - pinchStart.cy);
      pinchStart.cx = cx; pinchStart.cy = cy;
      const target = pinchStart.z * (d / pinchStart.d);
      cam.zoomAt(target / cam.z, cx, cy);
      first();
    }
  });

  const end = (e: PointerEvent) => {
    const p = pointers.get(e.pointerId);
    pointers.delete(e.pointerId);
    if (pointers.size < 2) { pinchStart = null; cam.pinching = false; }
    if (pointers.size === 1) {
      // continuing with one finger after a pinch: re-anchor it
      const [q] = [...pointers.values()];
      q.sx = q.x; q.sy = q.y;
      lastMove = { t: performance.now(), x: q.x, y: q.y };
      return;
    }
    cam.dragging = false;
    el.classList.remove('grabbing');
    if (!p) return;
    // only glide if the finger was still moving when it let go
    if (performance.now() - lastMove.t > 60) cam.vx = cam.vy = 0;
    if (!moved && e.type === 'pointerup') {
      const [wx, wy] = cam.screenToWorld(p.x, p.y);
      const now = performance.now();
      if (e.pointerType === 'touch' && now - lastTap.t < 300 && Math.hypot(p.x - lastTap.x, p.y - lastTap.y) < 30) {
        cam.zoomToward(cam.step(1), p.x, p.y);
        lastTap = { t: 0, x: 0, y: 0 };
        return;
      }
      lastTap = { t: now, x: p.x, y: p.y };
      h.onTap(wx, wy, e.pointerType);
    }
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('dblclick', (e) => {
    const [x, y] = local(e);
    cam.zoomToward(cam.step(1), x, y);
  });

  el.addEventListener('wheel', (e) => {
    e.preventDefault();
    first();
    const [x, y] = local(e);
    let dy = e.deltaY, dx = e.deltaX;
    if (e.deltaMode === 1) { dy *= 16; dx *= 16; }
    if (e.ctrlKey) {
      // trackpad pinch
      cam.zoomAt(Math.exp(-dy * 0.012), x, y);
      return;
    }
    const looksLikeMouse = e.deltaMode === 1 || (dx === 0 && Math.abs(dy) >= 50 && Number.isInteger(dy));
    if (looksLikeMouse) {
      cam.zoomToward(cam.step(dy < 0 ? 1 : -1), x, y);
    } else {
      cam.panBy(-dx, -dy);
    }
  }, { passive: false });

  // Safari's own gesture events, so a pinch never zooms the page
  for (const t of ['gesturestart', 'gesturechange', 'gestureend']) el.addEventListener(t, (e) => e.preventDefault());

  const held = new Set<string>();
  window.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
    if (document.body.classList.contains('modal-open')) return;
    const k = e.key;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 'd', 'w', 's', 'A', 'D', 'W', 'S'].includes(k)) {
      if (target?.closest?.('.card, .game-pop')) return;
      held.add(k.toLowerCase());
      e.preventDefault();
      first();
    } else if (k === '+' || k === '=') { cam.zoomToward(cam.step(1)); first(); }
    else if (k === '-' || k === '_') { cam.zoomToward(cam.step(-1)); first(); }
  });
  window.addEventListener('keyup', (e) => held.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => held.clear());

  return {
    /** Apply held keys; call every frame. */
    update(dt: number) {
      if (!held.size) return;
      const sp = 520 * dt;
      let dx = 0, dy = 0;
      if (held.has('arrowleft') || held.has('a')) dx += sp;
      if (held.has('arrowright') || held.has('d')) dx -= sp;
      if (held.has('arrowup') || held.has('w')) dy += sp;
      if (held.has('arrowdown') || held.has('s')) dy -= sp;
      cam.panBy(dx, dy);
    },
  };
}
