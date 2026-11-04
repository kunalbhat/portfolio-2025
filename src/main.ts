import './style.css';
import { Game } from './engine/game';
import { attachInput } from './engine/input';
import { buildScene, KUNAL_LOOK, celebrate, Story } from './world/scene';
import { Person, Entity, Custom } from './world/actors';
import { person } from './art/people';
import { pigeon } from './art/animals';
import { openGhostHop } from './ui/minigame';
import { openCreator, MY_NPC_KEY } from './ui/creator';
import { loadVisitors, visitors } from './world/visitors';
import { WORLD_W, WORLD_H } from './world/layout';

// Find Kunal. A tiny town in the first week of November; somewhere in it,
// on a bench, with a laptop and a coffee and a pigeon, is me.

const LINKS: { label: string; href: string }[] = [
  { label: 'GitHub', href: 'https://github.com/kunalbhat' },
];

const DISCOVERIES = ['nougat', 'tennis', 'game', 'cinema', 'cube', 'ghost', 'hotdog', 'raccoon', 'family', 'coffee'] as const;

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;
const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const touch = window.matchMedia('(pointer: coarse)').matches;

const canvas = $<HTMLCanvasElement>('#world');
const live = $<HTMLDivElement>('#live');
const announce = (msg: string) => { live.textContent = ''; requestAnimationFrame(() => (live.textContent = msg)); };

// ---- state -------------------------------------------------------------------
let found = false;
const discovered = new Set<string>();
let hintLevel = 0;
let rings: { x: number; y: number; r: number; t: number }[] = [];
let focused: Entity | null = null;

const story: Story = {
  discover(id) {
    if (discovered.has(id)) return;
    discovered.add(id);
    updateChip();
    if (found && discovered.size === DISCOVERIES.length) {
      toast('You found every little thing. Thanks for looking around ♥', 5000);
    }
  },
  found: () => onFound(),
  isFound: () => found,
  openGame: () => openGhostHop(() => canvas.focus()),
  moveIn: () => openCreator({ onDone: () => canvas.focus(), announce }),
};

// ---- world ----------------------------------------------------------------
const loading = $<HTMLDivElement>('#loading');
const game = new Game(canvas, document.createElement('canvas'));
game.reduced = reducedQuery.matches;
reducedQuery.addEventListener('change', (e) => (game.reduced = e.matches));
const { ground, refs } = buildScene(game, story);
game.setGround(ground);
const kunal = refs.kunal;

game.resize();
window.addEventListener('resize', () => game.resize());

// opening: the whole poster, then a glide in toward the street
const cam = game.cam;
cam.z = cam.minZ;
cam.x = WORLD_W / 2;
cam.y = WORLD_H / 2;
cam.clamp();
let userMoved = false;
const startView = () => {
  const z = touch || innerWidth < 700 ? Math.max(cam.coverZ, 1.25) : Math.max(cam.coverZ * 1.05, 1.5);
  const crisp = Math.max(z, Math.round(z * cam.dpr) / cam.dpr);
  cam.flyTo(560, 400, crisp, game.reduced ? 0 : 2.2);
};

const input = attachInput(canvas, cam, {
  onTap(wx, wy) {
    const e = game.hit(wx, wy);
    if (e?.tap) e.tap(game.ctx);
    else if (!game.reduced) game.fx.burst(wx, wy, ['#f6f1e6'], 4, 20, 40, 0.4);
    dismissGuide();
  },
  onHover(wx, wy) {
    const e = game.hit(wx, wy);
    canvas.classList.toggle('can-tap', !!e);
  },
  onFirstMove() {
    userMoved = true;
    dismissGuide();
  },
});

// ---- overlays drawn over the world -----------------------------------------
game.overlays.push((ctx, c, t) => {
  const dpr = c.dpr;
  // hint rings
  rings = rings.filter((r) => t - r.t < 4.5);
  for (const r of rings) {
    const [sx, sy] = c.worldToScreen(r.x, r.y);
    const age = t - r.t;
    const pulse = game.reduced ? 1 : 1 + Math.sin(age * 4) * 0.06;
    const rad = Math.max(18, r.r * c.z * pulse) * dpr;
    ctx.globalAlpha = age > 3.5 ? Math.max(0, 4.5 - age) : 1;
    pixelRing(ctx, sx * dpr, sy * dpr, rad, Math.max(2, Math.round(dpr * 2)));
    ctx.globalAlpha = 1;
  }
  // keyboard focus brackets
  if (focused) {
    const b = game.boxOf(focused);
    if (b) {
      const [x0, y0] = c.worldToScreen(b.x - 2, b.y - 2);
      const [x1, y1] = c.worldToScreen(b.x + b.w + 2, b.y + b.h + 2);
      brackets(ctx, x0 * dpr, y0 * dpr, x1 * dpr, y1 * dpr, Math.max(2, Math.round(dpr * 2)));
    }
  }
});

function pixelRing(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, k: number) {
  const steps = Math.max(24, Math.round(r / k));
  for (let i = 0; i < steps; i++) {
    if (i % 3 === 2) continue;
    const a = (i / steps) * Math.PI * 2;
    const x = Math.round((cx + Math.cos(a) * r) / k) * k, y = Math.round((cy + Math.sin(a) * r * 0.8) / k) * k;
    ctx.fillStyle = '#221a2c'; ctx.fillRect(x - k, y - k, k * 3, k * 3);
    ctx.fillStyle = '#ffd25a'; ctx.fillRect(x, y, k, k);
  }
}
function brackets(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, k: number) {
  const L = k * 5;
  ctx.fillStyle = '#ffd25a';
  for (const [x, y, dx, dy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) {
    ctx.fillRect(dx > 0 ? x : x - L, y - (dy > 0 ? 0 : k), L, k);
    ctx.fillRect(x - (dx > 0 ? 0 : k), dy > 0 ? y : y - L, k, L);
  }
}

// ---- the HUD ---------------------------------------------------------------
const card = $<HTMLDivElement>('#find');
const portrait = $<HTMLCanvasElement>('#portrait');
{
  const s = person({ ...KUNAL_LOOK, item: 'cup' }, 'stand');
  const k = 4;
  portrait.width = s.w * k; portrait.height = s.h * k;
  const p = portrait.getContext('2d')!;
  p.imageSmoothingEnabled = false;
  p.drawImage(s.canvas, 0, 0, s.w * k, s.h * k);
}
const hintBtn = $<HTMLButtonElement>('#hint');
hintBtn.addEventListener('click', () => giveHint());
$<HTMLButtonElement>('#reveal').addEventListener('click', () => { cam.flyTo(kunal.x, kunal.y - 8, 5, game.reduced ? 0 : 1); setTimeout(() => onFound(), game.reduced ? 0 : 900); });

function giveHint() {
  hintLevel = Math.min(3, hintLevel + 1);
  dismissGuide();
  const [ax, ay] = refs.hintSpots[0];
  const dur = game.reduced ? 0 : 1.2;
  if (hintLevel === 1) {
    cam.flyTo(ax, ay, Math.max(cam.minZ, Math.min(1.6, cam.maxZ)), dur);
    rings.push({ x: ax, y: ay, r: 110, t: game.t + dur });
    toast('He’s somewhere in this part of the park.');
    hintBtn.textContent = 'Warmer';
  } else if (hintLevel === 2) {
    const [bx, by] = refs.hintSpots[1];
    cam.flyTo(bx, by, 3, dur);
    rings.push({ x: bx, y: by, r: 40, t: game.t + dur });
    toast('Look for a mustard sweater. And a pigeon.');
    hintBtn.textContent = 'Show me';
  } else {
    cam.flyTo(kunal.x, kunal.y - 8, 5, dur);
    rings.push({ x: kunal.x, y: kunal.y - 8, r: 12, t: game.t + dur });
    toast('There he is. Go on, tap him.');
    hintBtn.hidden = true;
  }
  announce(toastEl.textContent ?? '');
}

const toastEl = $<HTMLDivElement>('#toast');
let toastTimer = 0;
function toast(msg: string, ms = 3200) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl.classList.remove('show'), ms);
}

const guide = $<HTMLDivElement>('#guide');
guide.textContent = touch ? 'Drag to look around · pinch to zoom' : 'Drag to look around · scroll to zoom';
let guideGone = false;
function dismissGuide() {
  if (guideGone) return;
  guideGone = true;
  guide.classList.remove('show');
}

const chip = $<HTMLButtonElement>('#chip');
function updateChip() {
  const n = discovered.size;
  chip.innerHTML = `<span class="tick">✓</span> Found Kunal <span class="dot">·</span> ${n} of ${DISCOVERIES.length} little things`;
  chip.setAttribute('aria-label', `You found Kunal and ${n} of ${DISCOVERIES.length} little things. Open the introduction.`);
}
chip.addEventListener('click', () => showIntro());

const intro = $<HTMLDivElement>('#intro');
$<HTMLDivElement>('#links').innerHTML = LINKS.map((l) => `<a href="${l.href}" target="_blank" rel="noopener">${l.label}</a>`).join('');
$<HTMLButtonElement>('#explore').addEventListener('click', () => hideIntro());
function showIntro() {
  intro.hidden = false;
  requestAnimationFrame(() => intro.classList.add('show'));
  chip.hidden = true;
  ($<HTMLButtonElement>('#explore')).focus({ preventScroll: true });
}
function hideIntro() {
  intro.classList.remove('show');
  setTimeout(() => { intro.hidden = true; }, 250);
  chip.hidden = false;
  updateChip();
  chip.focus({ preventScroll: true });
}
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !intro.hidden) hideIntro(); });

// ---- the big moment --------------------------------------------------------
function onFound() {
  if (found) {
    kunal.hop(5);
    kunal.say(game.ctx, ['HI AGAIN!', 'STILL HERE!', 'NOUGAT, NO.'][Math.floor(Math.random() * 3)], 1.6);
    showIntro();
    return;
  }
  found = true;
  card.classList.add('gone');
  hintBtn.hidden = true;
  announce('You found Kunal!');
  const c = game.ctx;
  // the pigeon takes off, the laptop goes on the bench, he stands and waves
  const bird = game.add(new Custom(kunal.x + 1, kunal.y - 17, {
    update: (s, _c, dt) => { s.state.t = (s.state.t ?? 0) + dt; s.x += 40 * dt; s.y -= 30 * dt; if (s.state.t > 3) s.hidden = true; },
    draw: (s, d, cc) => d.sprite(pigeon(Math.floor(cc.t * 12) % 2 ? 'fly0' : 'fly1'), s.x, s.y),
    bounds: (s) => ({ x: s.x - 3, y: s.y - 4, w: 6, h: 5 }),
  }));
  bird.layer = 2;
  kunal.state.pigeon = false;
  kunal.look = { ...KUNAL_LOOK, item: 'cup' };
  kunal.seated = false;
  kunal.y += 4;
  kunal.basePose = 'stand';
  kunal.run([
    { kind: 'hop', h: 6 },
    { kind: 'pose', pose: 'cheer', t: 0.6 },
    { kind: 'say', text: 'YOU FOUND ME!', t: 2.4, tone: 'shout' },
    { kind: 'pose', pose: 'wave0', t: 0.25 }, { kind: 'pose', pose: 'wave1', t: 0.25 },
    { kind: 'pose', pose: 'wave0', t: 0.25 }, { kind: 'pose', pose: 'wave1', t: 0.25 },
    { kind: 'pose', pose: 'stand', t: 0.1 },
  ]);
  kunal.idle = [['stand', 3], ['wave0', 0.3], ['wave1', 0.3], ['wave0', 0.3], ['wave1', 0.3]];
  // a laptop left on the bench
  game.add(new Custom(522, 815, {
    draw: (s, d) => { d.rect(s.x, s.y - 2, 6, 2, '#a2a7ae'); d.rect(s.x, s.y - 2, 6, 1, '#cfd3d6'); },
    bounds: (s) => ({ x: s.x, y: s.y - 2, w: 6, h: 2 }),
  })).bias = 3;
  if (!game.reduced) celebrate(game, kunal.x, kunal.y);
  // everyone nearby notices
  for (const e of game.entities) {
    if (!(e instanceof Person) || e === kunal) continue;
    const d = Math.hypot(e.x - kunal.x, e.y - kunal.y);
    if (d < 160) setTimeout(() => { e.hop(4); if (d < 90 && Math.random() < 0.6) e.say(c, ['!', 'HEY!', 'YAY!', '♥', 'FOUND HIM!'][Math.floor(Math.random() * 5)], 1.6); }, 150 + d * 4);
  }
  // Nougat comes running, ball forgotten
  const n = refs.nougat as Custom;
  n.state.dropped = true;
  n.state.mode = 'go';
  n.state.tx = kunal.x - 14;
  n.state.ty = kunal.y + 3;
  if (game.reduced) { n.x = n.state.tx; n.y = n.state.ty; n.state.mode = 'idle'; n.state.happy = true; }
  cam.flyTo(kunal.x, kunal.y - 10, Math.max(cam.z, Math.min(cam.maxZ, 4)), game.reduced ? 0 : 1.2);
  setTimeout(showIntro, game.reduced ? 300 : 2300);
}

// ---- keyboard / screen reader: everything with a label is tabbable --------
const list = $<HTMLUListElement>('#things');
function addToList(e: Entity, label = e.label!, before?: Element | null) {
  const li = document.createElement('li');
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.addEventListener('focus', () => {
    focused = e;
    const bx = game.boxOf(e)!;
    cam.flyTo(bx.x + bx.w / 2, bx.y + bx.h / 2, Math.max(cam.z, 3), game.reduced ? 0 : 0.6);
    dismissGuide();
  });
  b.addEventListener('blur', () => { if (focused === e) focused = null; });
  b.addEventListener('click', () => e.tap?.(game.ctx));
  li.appendChild(b);
  list.insertBefore(li, before ?? null);
  return li;
}
for (const e of game.entities.filter((e) => e.label && e !== kunal)) addToList(e);
const kunalItem = addToList(kunal, 'Kunal (this gives it away)');

// ---- people who moved in ----------------------------------------------------
$<HTMLButtonElement>('#movein').addEventListener('click', () => { hideIntro(); story.moveIn(); });
let mine: { id: string; name: string } | null = null;
try { mine = JSON.parse(localStorage.getItem(MY_NPC_KEY) ?? 'null'); } catch { /* none */ }
loadVisitors(game, mine?.id).then(async () => {
  for (const p of visitors.values()) addToList(p, p.label, kunalItem);
  if (!mine?.id) return;
  const me = visitors.get(mine.id);
  let welcomed = false;
  try { welcomed = sessionStorage.getItem('findkunal:welcomed') === mine.id; sessionStorage.setItem('findkunal:welcomed', mine.id); } catch { /* fine */ }
  if (me && !welcomed) {
    setTimeout(() => {
      toast(`Welcome home, ${mine!.name}! You live here now. Look for the ring.`, 6000);
      rings.push({ x: me.x, y: me.y - 8, r: 22, t: game.t });
      me.hop(5);
    }, 3200);
  }
});

// ---- go ----------------------------------------------------------------------
let last = performance.now();
let started = false;
function tick(now: number) {
  const dt = (now - last) / 1000;
  last = now;
  input.update(dt);
  game.frame(dt);
  if (!started) {
    started = true;
    loading.classList.add('done');
    setTimeout(() => card.classList.add('show'), game.reduced ? 0 : 500);
    setTimeout(() => { if (!userMoved) startView(); }, game.reduced ? 600 : 1400);
    setTimeout(() => { if (!guideGone) guide.classList.add('show'); }, 2600);
    setTimeout(() => dismissGuide(), 12000);
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// keep the canvas from ever scrolling the page on touch
document.addEventListener('touchmove', (e) => { if ((e.target as HTMLElement)?.closest?.('#world')) e.preventDefault(); }, { passive: false });

// for testing in the browser console
(window as unknown as Record<string, unknown>).__town = { game, story, kunal, onFound, giveHint };

$<HTMLButtonElement>('#zin').addEventListener('click', () => { cam.zoomToward(cam.step(1)); dismissGuide(); });
$<HTMLButtonElement>('#zout').addEventListener('click', () => { cam.zoomToward(cam.step(-1)); dismissGuide(); });
