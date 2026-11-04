import './style.css';
import { person, Look } from './art/people';

// Town hall: Kunal approves new residents once their Venmo shows up.

interface Row { id: string; name: string; line: string; look: Look; zone: string; createdAt: number; approvedAt?: number }

const KEY = 'findkunal:adminToken';
const $ = <T extends HTMLElement>(s: string) => document.querySelector(s) as T;
const login = $<HTMLFormElement>('#login');
const board = $<HTMLElement>('#board');
let token = '';
try { token = localStorage.getItem(KEY) ?? ''; } catch { /* none */ }

async function api(method: 'GET' | 'POST', body?: unknown) {
  const res = await fetch('/api/admin', { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || `Error ${res.status}`), { status: res.status });
  return data;
}

function sprite(look: Look) {
  const s = person({ ...look, shoes: 'charcoal' }, 'stand');
  const c = document.createElement('canvas');
  c.width = s.w; c.height = s.h;
  c.getContext('2d')!.drawImage(s.canvas, 0, 0);
  c.className = 'admin-sprite';
  return c;
}

const ago = (t: number) => { const m = Math.round((Date.now() - t) / 60000); return m < 60 ? `${m}m ago` : m < 2880 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`; };

function card(r: Row, approved: boolean) {
  const el = document.createElement('article');
  el.className = 'card admin-card';
  el.append(sprite(r.look));
  const info = document.createElement('div');
  info.innerHTML = `<div class="admin-code"></div><div class="admin-name"></div><div class="admin-line"></div><div class="admin-meta"></div>`;
  info.querySelector('.admin-code')!.textContent = r.id;
  info.querySelector('.admin-name')!.textContent = r.name;
  info.querySelector('.admin-line')!.textContent = r.line ? `“${r.line}”` : '(no line)';
  info.querySelector('.admin-meta')!.textContent = `${r.zone} · ${approved ? 'moved in ' + ago(r.approvedAt ?? r.createdAt) : 'asked ' + ago(r.createdAt)}`;
  el.append(info);
  const actions = document.createElement('div');
  actions.className = 'admin-actions';
  const btn = (label: string, cls: string, action: string, confirmText?: string) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = cls; b.textContent = label;
    b.addEventListener('click', async () => {
      if (confirmText && !confirm(confirmText)) return;
      b.disabled = true;
      try { await api('POST', { action, id: r.id }); await refresh(); } catch (e) { alert((e as Error).message); b.disabled = false; }
    });
    actions.append(b);
  };
  if (approved) btn('Remove', 'ghost-btn', 'remove', `Remove ${r.name} from town?`);
  else {
    btn('Approve', 'primary', 'approve');
    btn('Reject', 'ghost-btn', 'reject', `Reject ${r.name}? (This deletes the request.)`);
  }
  el.append(actions);
  return el;
}

async function refresh() {
  try {
    const { pending, approved } = (await api('GET')) as { pending: Row[]; approved: Row[] };
    login.hidden = true; board.hidden = false;
    const p = $<HTMLDivElement>('#pending'), a = $<HTMLDivElement>('#approved');
    p.replaceChildren(...pending.map((r) => card(r, false)));
    a.replaceChildren(...approved.map((r) => card(r, true)));
    if (!pending.length) p.innerHTML = '<p class="admin-empty">Nobody waiting. Quiet day in town.</p>';
    if (!approved.length) a.innerHTML = '<p class="admin-empty">No residents yet.</p>';
    $<HTMLSpanElement>('#pcount').textContent = `(${pending.length})`;
    $<HTMLSpanElement>('#acount').textContent = `(${approved.length})`;
  } catch (e) {
    board.hidden = true; login.hidden = false;
    $<HTMLParagraphElement>('.admin-error').textContent = token ? (e as Error).message : '';
  }
}

login.addEventListener('submit', (e) => {
  e.preventDefault();
  token = (new FormData(login).get('token') as string).trim();
  try { localStorage.setItem(KEY, token); } catch { /* fine */ }
  refresh();
});
$<HTMLButtonElement>('#logout').addEventListener('click', () => { try { localStorage.removeItem(KEY); } catch { /* fine */ } token = ''; board.hidden = true; login.hidden = false; });
refresh();
