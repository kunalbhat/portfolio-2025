import { timingSafeEqual } from 'node:crypto';
import { redis, KEYS, json, parseAll } from './_redis.mjs';

// Kunal's side. Every request needs `Authorization: Bearer <ADMIN_TOKEN>`.
// GET  -> { pending, approved }
// POST { action: 'approve' | 'reject' | 'remove', id }

function authorised(request) {
  const want = process.env.ADMIN_TOKEN;
  if (!want) return 'unconfigured';
  const got = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  const a = Buffer.from(got), b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request) {
  const ok = authorised(request);
  if (ok === 'unconfigured') return json({ error: 'ADMIN_TOKEN is not set on this deployment.' }, 503);
  if (!ok) return json({ error: 'Not allowed.' }, 401);
  const [pending, approved] = await Promise.all([redis('HGETALL', KEYS.pending), redis('HGETALL', KEYS.approved)]);
  const p = parseAll(pending).sort((a, b) => a.createdAt - b.createdAt);
  const ap = parseAll(approved).sort((a, b) => (b.approvedAt ?? 0) - (a.approvedAt ?? 0));
  return json({ pending: p, approved: ap }, 200, { 'Cache-Control': 'no-store' });
}

export async function POST(request) {
  const ok = authorised(request);
  if (ok === 'unconfigured') return json({ error: 'ADMIN_TOKEN is not set on this deployment.' }, 503);
  if (!ok) return json({ error: 'Not allowed.' }, 401);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Bad request.' }, 400); }
  const id = String(body.id ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!id) return json({ error: 'Which one?' }, 400);
  if (body.action === 'approve') {
    const row = await redis('HGET', KEYS.pending, id);
    if (!row) return json({ error: 'Not pending.' }, 404);
    const npc = { ...JSON.parse(row), approvedAt: Date.now() };
    await redis('HSET', KEYS.approved, id, JSON.stringify(npc));
    await redis('HDEL', KEYS.pending, id);
    return json({ ok: true, npc });
  }
  if (body.action === 'reject') { await redis('HDEL', KEYS.pending, id); return json({ ok: true }); }
  if (body.action === 'remove') { await redis('HDEL', KEYS.approved, id); return json({ ok: true }); }
  return json({ error: 'Unknown action.' }, 400);
}
