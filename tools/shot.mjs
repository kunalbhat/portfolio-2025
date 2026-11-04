// Screenshot a page in headless Chrome: node tools/shot.mjs <url> <out.png> [w] [h] [dpr] [script.js]
// The optional script is evaluated in the page (async) before the capture.
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';

const [url, out, w = '1440', h = '900', dpr = '2', script] = process.argv.slice(2);
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--force-color-profile=srgb'],
});
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +dpr, hasTouch: +w < 700, isMobile: +w < 700 });
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.stack}`));
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
if (script) {
  const code = readFileSync(script, 'utf8');
  const r = await page.evaluate(`(async () => { ${code} })()`);
  if (r !== undefined) console.log('result:', JSON.stringify(r));
}
await page.screenshot({ path: out });
if (logs.length) console.log(logs.join('\n'));
await browser.close();
