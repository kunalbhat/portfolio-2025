import { OPTIONS, NAME_MAX, LINE_MAX, PRICE_USD, VENMO_USER, TEXT_RE } from '../../shared/npc.mjs';
import { person, Look, Pose } from '../art/people';
import { P, ClothName, SkinName, HairName } from '../art/palette';
import { toCss } from '../art/color';

// "Move in": a visitor designs a little townsperson, pays $5 by Venmo with a
// code in the note, and Kunal moves them in once the payment lands.

export const MY_NPC_KEY = 'findkunal:myNpc';

interface Draft {
  name: string;
  line: string;
  zone: 'park' | 'street' | 'lake';
  look: Look;
}

const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];
const COLOURS = OPTIONS.colour as ClothName[];
const HATTED = new Set(['cap', 'beanie', 'scarf']);
const ITEM_LABEL: Record<string, string> = { none: 'Nothing', cup: 'Coffee', phone: 'Phone', bag: 'Bag', book: 'Book', icecream: 'Ice cream', camera: 'Camera', guitar: 'Guitar', flowers: 'Flowers', paper: 'Newspaper' };
const STYLE_LABEL: Record<string, string> = { short: 'Short', swoop: 'Swoop', buzz: 'Buzz', bald: 'Bald', long: 'Long', bob: 'Bob', bun: 'Bun', ponytail: 'Ponytail', curly: 'Curly', cap: 'Cap', beanie: 'Beanie', scarf: 'Headscarf' };
const ZONE_LABEL = { park: 'The park', street: 'Main street', lake: 'The lakefront' };

function randomDraft(): Draft {
  const style = pick(OPTIONS.style) as Look['style'];
  return {
    name: '',
    line: '',
    zone: 'park',
    look: {
      skin: pick(OPTIONS.skin) as SkinName,
      hair: pick(OPTIONS.hair) as HairName,
      style,
      hat: HATTED.has(style) ? (pick(COLOURS) as ClothName) : undefined,
      top: pick(COLOURS),
      topKind: pick(['long', 'long', 'tee', 'coat'] as const),
      bottom: pick(['denim', 'navy', 'black', 'khaki', 'grey', 'brown'] as ClothName[]),
      bottomKind: 'pants',
      item: 'none',
      glasses: Math.random() < 0.2,
      beard: false,
    },
  };
}

export function openCreator(opts: { onDone: () => void; announce: (s: string) => void }) {
  let draft = randomDraft();
  const wrap = document.createElement('div');
  wrap.className = 'creator-pop';
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-modal', 'true');
  wrap.setAttribute('aria-labelledby', 'mi-title');
  wrap.innerHTML = `
    <div class="card creator">
      <button type="button" class="creator-close" aria-label="Close">✕</button>
      <div class="creator-step" data-step="design">
        <header>
          <h2 id="mi-title">Move into town</h2>
          <p>Make a little you. For <span class="num">$${PRICE_USD}</span>, they’ll live here for good.</p>
        </header>
        <div class="creator-body">
          <div class="creator-preview">
            <canvas width="10" height="17" aria-hidden="true"></canvas>
            <button type="button" class="ghost-btn" data-act="random">Shuffle</button>
          </div>
          <div class="creator-fields">
            <label class="field"><span>Name</span><input name="name" maxlength="${NAME_MAX}" autocomplete="off" placeholder="SAM" required /></label>
            <label class="field"><span>They say…</span><input name="line" maxlength="${LINE_MAX}" autocomplete="off" placeholder="NICE DAY FOR IT." /></label>
            <div class="row" data-row="skin"><span>Skin</span><div class="swatches"></div></div>
            <div class="row" data-row="style"><span>Hair</span><div class="chips"></div></div>
            <div class="row" data-row="hair"><span></span><div class="swatches"></div></div>
            <div class="row" data-row="hat" hidden><span>Hat</span><div class="swatches"></div></div>
            <div class="row" data-row="topKind"><span>Top</span><div class="chips"></div></div>
            <div class="row" data-row="top"><span></span><div class="swatches"></div></div>
            <div class="row" data-row="bottomKind"><span>Bottom</span><div class="chips"></div></div>
            <div class="row" data-row="bottom"><span></span><div class="swatches"></div></div>
            <div class="row" data-row="extras"><span>Extras</span><div class="chips"></div></div>
            <div class="row" data-row="item"><span>Holding</span><div class="chips"></div></div>
            <div class="row" data-row="zone"><span>Lives in</span><div class="chips"></div></div>
          </div>
        </div>
        <p class="creator-error" role="alert"></p>
        <footer>
          <small>Kunal approves every new resident by hand, usually within a day.</small>
          <button type="button" class="primary" data-act="submit">Move in · <span class="num">$${PRICE_USD}</span></button>
        </footer>
      </div>
      <div class="creator-step" data-step="pay" hidden>
        <header>
          <h2>Almost home!</h2>
          <p>Send <span class="num">$${PRICE_USD}</span> on Venmo to <b>@${VENMO_USER}</b> with this code in the note:</p>
        </header>
        <div class="code-row"><span class="code"></span><button type="button" class="ghost-btn" data-act="copy">Copy</button></div>
        <p class="pay-note">Once the payment lands, Kunal moves you in and you’ll be somewhere in town for good. This browser will remember your code, so come back to see where you live.</p>
        <footer>
          <button type="button" class="ghost-btn" data-act="close">Later</button>
          <a class="primary venmo" target="_blank" rel="noopener">Pay <span class="num">$${PRICE_USD}</span> on Venmo</a>
        </footer>
      </div>
    </div>`;
  document.body.appendChild(wrap);
  document.body.classList.add('modal-open');
  const $ = <T extends Element>(s: string) => wrap.querySelector(s) as T;
  const canvas = $<HTMLCanvasElement>('.creator-preview canvas');
  const ctx = canvas.getContext('2d')!;
  const name = $<HTMLInputElement>('input[name=name]');
  const line = $<HTMLInputElement>('input[name=line]');
  const err = $<HTMLParagraphElement>('.creator-error');

  // ---- controls ----
  const swatchRow = (row: string, values: readonly string[], colour: (v: string) => string, label: (v: string) => string, get: () => string | undefined, set: (v: string) => void) => {
    const box = $<HTMLDivElement>(`[data-row=${row}] .swatches`);
    box.setAttribute('role', 'radiogroup');
    box.setAttribute('aria-label', row);
    box.innerHTML = '';
    for (const v of values) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch';
      b.style.setProperty('--c', colour(v));
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-label', label(v));
      b.title = label(v);
      b.addEventListener('click', () => { set(v); render(); });
      b.dataset.v = v;
      box.appendChild(b);
    }
    return () => box.querySelectorAll<HTMLButtonElement>('.swatch').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.v === get())));
  };
  const chipRow = (row: string, values: { v: string; label: string }[], isOn: (v: string) => boolean, toggle: (v: string) => void) => {
    const box = $<HTMLDivElement>(`[data-row=${row}] .chips`);
    box.innerHTML = '';
    for (const { v, label } of values) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip-btn';
      b.textContent = label;
      b.dataset.v = v;
      b.addEventListener('click', () => { toggle(v); render(); });
      box.appendChild(b);
    }
    return () => box.querySelectorAll<HTMLButtonElement>('.chip-btn').forEach((b) => b.setAttribute('aria-pressed', String(isOn(b.dataset.v!))));
  };
  const nice = (s: string) => s.replace(/([A-Z])/g, ' $1').replace(/^./, (m) => m.toUpperCase());
  const cloth = (v: string) => toCss(P.cloth[v as ClothName][1]);
  const L = () => draft.look;
  const refreshers = [
    swatchRow('skin', OPTIONS.skin, (v) => toCss(P.skin[v as SkinName][1]), nice, () => L().skin, (v) => (L().skin = v as SkinName)),
    chipRow('style', OPTIONS.style.map((v: string) => ({ v, label: STYLE_LABEL[v] })), (v) => L().style === v, (v) => { L().style = v as Look['style']; if (HATTED.has(v) && !L().hat) L().hat = 'red'; }),
    swatchRow('hair', OPTIONS.hair, (v) => toCss(P.hair[v as HairName]), nice, () => L().hair, (v) => (L().hair = v as HairName)),
    swatchRow('hat', COLOURS, cloth, nice, () => L().hat, (v) => (L().hat = v as ClothName)),
    chipRow('topKind', [{ v: 'long', label: 'Sweater' }, { v: 'tee', label: 'T-shirt' }, { v: 'coat', label: 'Coat' }, { v: 'dress', label: 'Dress' }], (v) => L().topKind === v, (v) => (L().topKind = v as Look['topKind'])),
    swatchRow('top', COLOURS, cloth, nice, () => L().top, (v) => (L().top = v as ClothName)),
    chipRow('bottomKind', [{ v: 'pants', label: 'Trousers' }, { v: 'shorts', label: 'Shorts' }, { v: 'skirt', label: 'Skirt' }], (v) => L().bottomKind === v, (v) => (L().bottomKind = v as Look['bottomKind'])),
    swatchRow('bottom', COLOURS, cloth, nice, () => L().bottom, (v) => (L().bottom = v as ClothName)),
    chipRow('extras', [{ v: 'glasses', label: 'Glasses' }, { v: 'beard', label: 'Beard' }], (v) => !!L()[v as 'glasses' | 'beard'], (v) => { const k = v as 'glasses' | 'beard'; L()[k] = !L()[k]; }),
    chipRow('item', OPTIONS.item.map((v: string) => ({ v, label: ITEM_LABEL[v] })), (v) => (L().item ?? 'none') === v, (v) => (L().item = v as Look['item'])),
    chipRow('zone', OPTIONS.zone.map((v: string) => ({ v, label: ZONE_LABEL[v as Draft['zone']] })), (v) => draft.zone === v, (v) => (draft.zone = v as Draft['zone'])),
  ];

  // ---- preview: a little walk cycle on a patch of grass ----
  const poses: Pose[] = ['stand', 'stand', 'walk0', 'walk1', 'walk2', 'walk1', 'wave0', 'wave1', 'wave0', 'wave1'];
  let frame = 0;
  const draw = () => {
    const look: Look = { ...L(), bottom: L().topKind === 'dress' ? L().top : L().bottom, shoes: 'charcoal' };
    const s = person(look, poses[frame % poses.length]);
    canvas.width = s.w + 8; canvas.height = s.h + 4;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = toCss(P.grass[2]); ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = toCss(P.grass[3]); for (let i = 0; i < canvas.width; i += 3) ctx.fillRect(i, (i * 7) % canvas.height, 1, 1);
    ctx.fillStyle = 'rgba(40,26,70,0.3)'; ctx.fillRect(4 + s.ax - 3, s.h + 1, 7, 1);
    ctx.drawImage(s.canvas, 4, 2);
  };
  const timer = window.setInterval(() => { frame++; draw(); }, 220);
  function render() {
    refreshers.forEach((r) => r());
    $<HTMLDivElement>('[data-row=hat]').hidden = !HATTED.has(L().style);
    $<HTMLDivElement>('[data-row=bottomKind]').hidden = L().topKind === 'dress';
    $<HTMLDivElement>('[data-row=bottom]').hidden = L().topKind === 'dress';
    draw();
  }
  render();

  name.addEventListener('input', () => { name.value = name.value.toUpperCase(); err.textContent = ''; });
  line.addEventListener('input', () => { line.value = line.value.toUpperCase(); });
  $<HTMLButtonElement>('[data-act=random]').addEventListener('click', () => { const keep = { name: draft.name, line: draft.line, zone: draft.zone }; draft = { ...randomDraft(), ...keep }; render(); });

  const submitBtn = $<HTMLButtonElement>('[data-act=submit]');
  submitBtn.addEventListener('click', async () => {
    draft.name = name.value.trim();
    draft.line = line.value.trim();
    if (!draft.name) { err.textContent = 'Give them a name.'; name.focus(); return; }
    if (!TEXT_RE.test(draft.name) || !TEXT_RE.test(draft.line)) { err.textContent = 'Letters, numbers and simple punctuation only (the town’s sign painter is limited).'; return; }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Packing boxes…';
    try {
      const res = await fetch('/api/npcs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again?');
      try { localStorage.setItem(MY_NPC_KEY, JSON.stringify({ id: data.id, name: draft.name, at: Date.now() })); } catch { /* private mode */ }
      showPay(data.id, data.venmo);
    } catch (e) {
      err.textContent = e instanceof Error && e.message !== 'Failed to fetch' ? e.message : 'Couldn’t reach the town hall. Try again?';
      submitBtn.disabled = false;
      submitBtn.innerHTML = `Move in · <span class="num">$${PRICE_USD}</span>`;
    }
  });

  function showPay(code: string, venmo: string) {
    $<HTMLDivElement>('[data-step=design]').hidden = true;
    $<HTMLDivElement>('[data-step=pay]').hidden = false;
    $<HTMLSpanElement>('.code').textContent = code;
    const a = $<HTMLAnchorElement>('a.venmo');
    a.href = venmo;
    a.focus();
    opts.announce(`Your code is ${code.split('').join(' ')}. Send $${PRICE_USD} on Venmo to at ${VENMO_USER} with the code in the note.`);
  }
  $<HTMLButtonElement>('[data-act=copy]').addEventListener('click', async (e) => {
    const b = e.currentTarget as HTMLButtonElement;
    try { await navigator.clipboard.writeText($<HTMLSpanElement>('.code').textContent ?? ''); b.textContent = 'Copied'; } catch { b.textContent = 'Select it'; }
  });

  const close = () => {
    window.clearInterval(timer);
    window.removeEventListener('keydown', onKey);
    wrap.remove();
    document.body.classList.remove('modal-open');
    opts.onDone();
  };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
  window.addEventListener('keydown', onKey);
  $<HTMLButtonElement>('.creator-close').addEventListener('click', close);
  $<HTMLButtonElement>('[data-act=close]').addEventListener('click', close);
  wrap.addEventListener('pointerdown', (e) => { if (e.target === wrap) close(); });
  setTimeout(() => name.focus(), 50);
}
