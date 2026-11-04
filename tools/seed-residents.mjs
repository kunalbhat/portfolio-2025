// Fill (or clear) the *dev* resident list to test a popular town.
//   node --env-file=.env.local tools/seed-residents.mjs 200
//   node --env-file=.env.local tools/seed-residents.mjs clear
// Only ever touches the dev: namespace.
import { OPTIONS } from '../shared/npc.mjs';

const url = process.env.KV_REST_API_URL, token = process.env.KV_REST_API_TOKEN;
const KEY = 'dev:npc:approved';
const call = (body, path = '') => fetch(url + path, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(body) }).then((r) => r.json());
const arg = process.argv[2] ?? '200';
if (arg === 'clear') {
  console.log(await call(['DEL', KEY, 'dev:npc:pending']));
} else {
  const n = +arg;
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const cmds = [];
  for (let i = 0; i < n; i++) {
    const id = `T${String(i).padStart(4, '0')}`;
    const npc = { id, name: `RESIDENT ${i}`, line: 'HELLO!', zone: pick(OPTIONS.zone), approvedAt: Date.now() + i,
      look: { skin: pick(OPTIONS.skin), hair: pick(OPTIONS.hair), style: pick(OPTIONS.style), top: pick(OPTIONS.colour), topKind: 'long', bottom: 'navy', bottomKind: 'pants', item: 'none', glasses: false, beard: false } };
    cmds.push(['HSET', KEY, id, JSON.stringify(npc)]);
  }
  const res = await call(cmds, '/pipeline');
  console.log('seeded', res.length, 'residents');
}
