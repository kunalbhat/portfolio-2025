// End-to-end check of "Move in": design an NPC, submit, approve it in the
// town hall, come back and get welcomed home. Needs `vercel dev` running with
// ADMIN_TOKEN set:  node tools/e2e-movein.mjs http://localhost:5180 <token>
import { chromium } from 'playwright-core';

const [base = 'http://localhost:5180', token = 'local-test-token'] = process.argv.slice(2);
const out = 'tools/out';
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const errors = [];
const watch = (p) => p.on('pageerror', (e) => errors.push(e.message));

// 1. a visitor on a phone designs someone and submits
const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await phone.newPage();
watch(page);
await page.goto(base + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.evaluate(() => window.__town.story.moveIn());
await page.waitForTimeout(400);
await page.fill('.creator input[name=name]', 'priya');
await page.fill('.creator input[name=line]', 'hello neighbour!');
await page.click('[data-row=style] .chip-btn[data-v=bun]');
await page.click('[data-row=top] .swatch[data-v=teal]');
await page.click('[data-row=item] .chip-btn[data-v=flowers]');
await page.click('[data-row=zone] .chip-btn[data-v=park]');
await page.screenshot({ path: `${out}/e2e-1-design.png` });
await page.click('[data-act=submit]');
await page.waitForSelector('[data-step=pay]:not([hidden])');
const code = (await page.textContent('.code')).trim();
const venmo = await page.getAttribute('a.venmo', 'href');
await page.screenshot({ path: `${out}/e2e-2-pay.png` });
console.log('code', code, venmo);

// 2. Kunal approves it in the town hall
const desk = await browser.newPage({ viewport: { width: 1280, height: 900 } });
watch(desk);
await desk.goto(base + '/admin.html', { waitUntil: 'networkidle' });
await desk.fill('input[name=token]', token);
await desk.click('#login button[type=submit]');
await desk.waitForSelector('#board:not([hidden])');
await desk.screenshot({ path: `${out}/e2e-3-admin.png` });
desk.on('dialog', (d) => d.accept());
const cardSel = `.admin-card:has(.admin-code:text-is("${code}"))`;
await desk.click(`${cardSel} button.primary`);
await desk.waitForTimeout(800);
console.log('approved card now in', await desk.$eval(cardSel, (el) => el.closest('#pending') ? 'pending' : 'approved'));

// 3. the visitor comes back and is welcomed home
await page.waitForTimeout(500);
await page.goto(base + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(4200);
const toast = await page.textContent('#toast');
const placed = await page.evaluate((c) => {
  const t = window.__town;
  const p = t.game.entities.find((e) => e.label && e.label.startsWith('Priya'));
  if (p) t.game.cam.flyTo(p.x, p.y - 10, 5, 0);
  return p ? { x: Math.round(p.x), y: Math.round(p.y) } : null;
}, code);
await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/e2e-4-home.png` });
console.log('toast:', toast, '| placed at', JSON.stringify(placed));
console.log('errors:', errors);
await browser.close();
