import { ghost } from '../art/animals';
import { pumpkin } from '../art/props';
import { propSprite } from '../engine/draw';
import { Bitmap } from '../art/bitmap';
import { drawText } from '../art/font';
import { hex } from '../art/color';

// GHOST HOP: the little game running on a monitor in the studio. A ghost
// floats over a hill of pumpkins; tap, click or press space to hop.

const W = 120, H = 68;

export function openGhostHop(onClose: () => void) {
  const wrap = document.createElement('div');
  wrap.className = 'game-pop';
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-label', 'Ghost Hop, a tiny game. Press space or tap to hop. Escape to close.');
  wrap.innerHTML = `
    <div class="monitor">
      <canvas width="${W}" height="${H}" aria-hidden="true"></canvas>
      <div class="monitor-foot"><span>GHOST HOP</span><span class="hint">space / tap to hop</span><button type="button" class="close" aria-label="Close the game">✕</button></div>
    </div>`;
  document.body.appendChild(wrap);
  document.body.classList.add('modal-open');
  const canvas = wrap.querySelector('canvas')!;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const close = wrap.querySelector('.close') as HTMLButtonElement;
  close.focus();

  const g0 = ghost(0), g1 = ghost(1);
  const pk = propSprite(pumpkin(true));
  let y = 0, vy = 0, t = 0, score = 0, best = 0, over = false, started = false;
  let obs: { x: number; passed: boolean }[] = [];
  let spawn = 1.2;
  const textCanvas = (s: string, c = '#f6f1e6') => { const b = new Bitmap(120, 6); drawText(b, s, 0, 0, hex(c)); return b.canvas(); };
  let scoreC = textCanvas('0');
  const titleC = textCanvas('TAP TO HOP'), overC = textCanvas('BOO. AGAIN?', '#f2d03a');

  const hop = () => {
    if (over) { over = false; obs = []; score = 0; scoreC = textCanvas('0'); t = 0; spawn = 1; }
    started = true;
    if (y <= 0.5) vy = 95;
  };
  const key = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); done(); }
    else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'Enter') { if (e.target === close && e.key === 'Enter') return; e.preventDefault(); hop(); }
  };
  canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); hop(); });
  window.addEventListener('keydown', key);
  wrap.addEventListener('pointerdown', (e) => { if (e.target === wrap) done(); });
  close.addEventListener('click', done);

  let raf = 0, last = performance.now();
  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    if (started && !over) {
      vy -= 300 * dt; y = Math.max(0, y + vy * dt); if (y === 0) vy = 0;
      spawn -= dt;
      if (spawn < 0) { obs.push({ x: W + 6, passed: false }); spawn = 0.9 + Math.random() * 1.1; }
      const speed = 52 + score * 2;
      for (const o of obs) {
        o.x -= speed * dt;
        if (!o.passed && o.x < 18) { o.passed = true; score++; best = Math.max(best, score); scoreC = textCanvas(String(score)); }
        if (Math.abs(o.x - 20) < 6 && y < 7) over = true;
      }
      obs = obs.filter((o) => o.x > -10);
    }
    // night sky, moon, hill
    ctx.fillStyle = '#1e2440'; ctx.fillRect(0, 0, W, H);
    for (let j = 0; j < 10; j++) for (let i = 0; i < 10; i++) {
      const a = (i - 4.5) ** 2 + (j - 4.5) ** 2, b = (i - 7) ** 2 + (j - 3) ** 2;
      if (a < 22 && b > 14) { ctx.fillStyle = '#f2e6b0'; ctx.fillRect(92 + i, 6 + j, 1, 1); }
    }
    for (let i = 0; i < 14; i++) { ctx.fillStyle = '#c8c2d6'; ctx.fillRect((i * 37 + Math.floor(t * 3)) % W, (i * 13) % 30, 1, 1); }
    ctx.fillStyle = '#2f5d38'; ctx.fillRect(0, H - 12, W, 12);
    ctx.fillStyle = '#467a40'; ctx.fillRect(0, H - 12, W, 1);
    for (const o of obs) ctx.drawImage(pk.canvas, Math.round(o.x) - pk.ax, H - 12 - pk.ay + 1);
    const gs = Math.floor(t * 4) % 2 ? g0 : g1;
    ctx.drawImage(gs.canvas, 20 - gs.ax, Math.round(H - 12 - gs.ay - y + Math.sin(t * 4) * 1));
    ctx.drawImage(scoreC, 4, 4);
    if (!started) ctx.drawImage(titleC, 40, 30);
    if (over) ctx.drawImage(overC, 38, 30);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  function done() {
    cancelAnimationFrame(raf);
    window.removeEventListener('keydown', key);
    wrap.remove();
    document.body.classList.remove('modal-open');
    onClose();
  }
}
