// What a visitor's NPC can be made of. Shared by the creator in the page and
// the API, so the server only ever accepts looks the town can draw.
// (Lives outside api/ so the dev server can hand it to the browser too.)

export const PRICE_USD = 5;
export const VENMO_USER = 'kunalbhat';

export const OPTIONS = {
  skin: ['fair', 'light', 'olive', 'brown', 'deep'],
  hair: ['black', 'dark', 'brown', 'lightBrown', 'dirtyBlonde', 'blonde', 'auburn', 'grey', 'white', 'pink'],
  style: ['short', 'swoop', 'buzz', 'bald', 'long', 'bob', 'bun', 'ponytail', 'curly', 'cap', 'beanie', 'scarf'],
  colour: ['red', 'coral', 'orange', 'lemon', 'olive', 'green', 'teal', 'sky', 'blue', 'denim', 'navy', 'purple', 'pink', 'plum', 'brown', 'tan', 'khaki', 'grey', 'charcoal', 'white', 'black'],
  topKind: ['long', 'tee', 'coat', 'dress'],
  bottomKind: ['pants', 'shorts', 'skirt'],
  item: ['none', 'cup', 'phone', 'bag', 'book', 'icecream', 'camera', 'guitar', 'flowers', 'paper'],
  zone: ['park', 'street', 'lake'],
};

// Mustard is Kunal's. Nobody else gets to wear it.
export const RESERVED_COLOUR = 'mustard';

/** Characters the town's pixel font can draw. */
export const TEXT_RE = /^[A-Z0-9 .,!?'&:+\-/()]*$/;
export const NAME_MAX = 14;
export const LINE_MAX = 28;

const pick = (v, list, fallback) => (list.includes(v) ? v : fallback);
const clean = (s, max) => String(s ?? '').toUpperCase().replace(/\s+/g, ' ').trim().slice(0, max);

/**
 * Validate a submitted NPC. Returns { npc } or { error }.
 * Unknown fields are dropped; every value is checked against OPTIONS.
 */
export function validateNpc(input) {
  if (!input || typeof input !== 'object') return { error: 'Nothing to add.' };
  const name = clean(input.name, NAME_MAX);
  const line = clean(input.line, LINE_MAX);
  if (!name) return { error: 'Give your NPC a name.' };
  if (!TEXT_RE.test(name) || !TEXT_RE.test(line)) return { error: 'Letters, numbers and simple punctuation only.' };
  const l = input.look ?? {};
  if (l.top === RESERVED_COLOUR || l.bottom === RESERVED_COLOUR || l.hat === RESERVED_COLOUR) return { error: 'Mustard is taken.' };
  const look = {
    skin: pick(l.skin, OPTIONS.skin, 'light'),
    hair: pick(l.hair, OPTIONS.hair, 'brown'),
    style: pick(l.style, OPTIONS.style, 'short'),
    top: pick(l.top, OPTIONS.colour, 'teal'),
    topKind: pick(l.topKind, OPTIONS.topKind, 'long'),
    bottom: pick(l.bottom, OPTIONS.colour, 'navy'),
    bottomKind: pick(l.bottomKind, OPTIONS.bottomKind, 'pants'),
    item: pick(l.item, OPTIONS.item, 'none'),
    glasses: l.glasses === true,
    beard: l.beard === true,
  };
  if (look.style === 'cap' || look.style === 'beanie' || look.style === 'scarf') look.hat = pick(l.hat, OPTIONS.colour, 'red');
  if (look.topKind === 'dress') look.bottom = look.top;
  const zone = pick(input.zone, OPTIONS.zone, 'park');
  return { npc: { name, line, look, zone } };
}

/** A short code for the Venmo note: no 0/O, 1/I, 2/Z or 5/S to misread. */
export function newCode() {
  const A = 'ABCDEFGHJKLMNPQRTUVWXY346789';
  let s = '';
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  for (const b of bytes) s += A[b % A.length];
  return s;
}

export function venmoUrl(code) {
  const note = encodeURIComponent(`Find Kunal NPC ${code}`);
  return `https://venmo.com/${VENMO_USER}?txn=pay&amount=${PRICE_USD}&note=${note}`;
}
