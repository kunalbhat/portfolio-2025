import { redis, KEYS, json, parseAll } from './_redis.mjs';
import { validateNpc, newCode, venmoUrl, PRICE_USD } from '../shared/npc.mjs';

// GET  /api/npcs          -> a random sample of the people who've moved in
// GET  /api/npcs?me=CODE  -> the same, always including that resident
// POST /api/npcs          -> submit a new NPC; it waits for Kunal to see the Venmo
//
// The town has room for about fifty residents on screen at once, so each
// response is a fresh random handful rather than everyone. The CDN caches it
// for 30 seconds, so the crowd rotates while the database barely notices.

const SAMPLE = 90; // comfortably more than the ~52 spots, so every part of town fills
const MAX_PENDING = 300;
const PER_HOUR = 5;

export async function GET(request) {
  try {
    const me = (new URL(request.url).searchParams.get('me') ?? '').toUpperCase();
    const mine = /^[A-Z0-9]{5}$/.test(me) ? me : '';
    const [sample, own, total] = await Promise.all([
      redis('HRANDFIELD', KEYS.approved, String(SAMPLE), 'WITHVALUES'),
      mine ? redis('HGET', KEYS.approved, mine) : null,
      redis('HLEN', KEYS.approved),
    ]);
    let rows = parseAll(sample ?? []);
    if (own) {
      const o = JSON.parse(own);
      rows = [o, ...rows.filter((r) => r.id !== o.id)];
    }
    const npcs = rows.map(({ id, name, line, look, zone }) => ({ id, name, line, look, zone }));
    return json({ npcs, total }, 200, { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' });
  } catch (e) {
    return json({ npcs: [], error: 'unavailable' }, 503);
  }
}

export async function POST(request) {
  try {
    const text = await request.text();
    if (text.length > 4000) return json({ error: 'That is a lot of NPC.' }, 413);
    let body;
    try { body = JSON.parse(text); } catch { return json({ error: 'Could not read that.' }, 400); }
    const { npc, error } = validateNpc(body);
    if (error) return json({ error }, 400);

    const ip = (request.headers.get('x-forwarded-for') ?? 'local').split(',')[0].trim();
    const hits = await redis('INCR', KEYS.rate(ip));
    if (hits === 1) await redis('EXPIRE', KEYS.rate(ip), 3600);
    if (hits > PER_HOUR) return json({ error: 'Easy! Try again in a bit.' }, 429);
    if ((await redis('HLEN', KEYS.pending)) >= MAX_PENDING) return json({ error: 'The town is full up for now. Try again soon.' }, 503);

    let id = newCode();
    for (let i = 0; i < 5 && ((await redis('HEXISTS', KEYS.pending, id)) || (await redis('HEXISTS', KEYS.approved, id))); i++) id = newCode();
    const row = { id, ...npc, createdAt: Date.now() };
    await redis('HSET', KEYS.pending, id, JSON.stringify(row));
    return json({ id, price: PRICE_USD, venmo: venmoUrl(id) }, 201, { 'Cache-Control': 'no-store' });
  } catch (e) {
    return json({ error: 'Something went wrong. Try again?' }, 500);
  }
}
