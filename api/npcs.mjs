import { redis, KEYS, json, parseAll } from './_redis.mjs';
import { validateNpc, newCode, venmoUrl, PRICE_USD } from '../shared/npc.mjs';

// GET  /api/npcs          -> everyone who has moved in (public)
// GET  /api/npcs?id=CODE  -> is my NPC pending or approved?
// POST /api/npcs          -> submit a new NPC; it waits for Kunal to see the Venmo

const MAX_PENDING = 300;
const PER_HOUR = 5;

export async function GET(request) {
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (id) {
      const code = id.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
      const [approved, pending] = await Promise.all([redis('HGET', KEYS.approved, code), redis('HGET', KEYS.pending, code)]);
      const row = approved ?? pending;
      return json({ id: code, status: approved ? 'approved' : pending ? 'pending' : 'unknown', name: row ? JSON.parse(row).name : undefined }, 200, { 'Cache-Control': 'no-store' });
    }
    const all = parseAll(await redis('HGETALL', KEYS.approved));
    all.sort((a, b) => (a.approvedAt ?? 0) - (b.approvedAt ?? 0));
    const npcs = all.map(({ id, name, line, look, zone }) => ({ id, name, line, look, zone }));
    return json({ npcs }, 200, { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300' });
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
