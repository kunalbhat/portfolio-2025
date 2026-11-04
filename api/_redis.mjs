// A tiny Upstash Redis client over its REST API: no dependencies, so the
// functions also run on the build-free main branch.

function creds() {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('Redis is not configured');
  return { url, token };
}

export async function redis(...command) {
  const { url, token } = creds();
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  const body = await res.json();
  if (body.error) throw new Error(body.error);
  return body.result;
}

// Production uses the real keys; previews and local dev get their own, so
// testing never touches the town everyone sees.
const NS = process.env.VERCEL_ENV === 'production' ? '' : `${process.env.VERCEL_ENV || 'dev'}:`;

export const KEYS = {
  pending: `${NS}npc:pending`,
  approved: `${NS}npc:approved`,
  rate: (ip) => `${NS}npc:rl:${ip}`,
};

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...headers } });
}

export function parseAll(hash) {
  // HGETALL comes back as [field, value, field, value, ...]
  const out = [];
  for (let i = 0; i + 1 < (hash?.length ?? 0); i += 2) {
    try { out.push(JSON.parse(hash[i + 1])); } catch { /* skip a bad row */ }
  }
  return out;
}
