import { chromium } from 'playwright';
const URL = 'https://360projectos.github.io/qwenallinstudio/';
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
page.on('requestfailed', r => errors.push('REQFAIL: ' + r.url() + ' ' + (r.failure() ? r.failure().errorText : '')));
try { await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 }); } catch (e) { errors.push('GOTO: ' + e.message); }
await page.waitForTimeout(2500);
const bodyText = await page.evaluate(() => document.body.innerText);
console.log('=== BODY (800 chars) ===');
console.log(bodyText.slice(0, 800));
console.log('=== has LAB STUDIO:', bodyText.includes('LAB STUDIO'), '| has Wizard:', bodyText.includes('Wizard'), '| buttons:', await page.locator('button').count());
// click a wizard action
try {
  for (const name of ['Raise', 'Call', 'Fold', 'Bet', 'Check']) {
    const b = page.locator('button', { hasText: new RegExp('^' + name + '$') }).first();
    if (await b.count()) { await b.click({ timeout: 3000 }); console.log('=== clicked action:', name); break; }
  }
  await page.waitForTimeout(800);
  const after = await page.evaluate(() => document.body.innerText);
  console.log('=== feedback visible:', after.includes('GTO') || after.includes('elecci') || after.includes('Fuga') || after.includes('fuga'));
} catch (e) { errors.push('CLICK: ' + e.message); }
// click through pillars
for (const p of ['Entrenador', 'Rangos', 'Herramientas', 'Academia', 'Math']) {
  try {
    const loc = page.locator('header button', { hasText: p }).first();
    await loc.click({ timeout: 3000 });
    await page.waitForTimeout(1500);
    const txt = await page.evaluate(() => document.body.innerText);
    console.log('=== PILLAR', p, 'renders:', txt.length > 100, '|', txt.slice(0, 70).replace(/\n/g, ' '));
  } catch (e) { errors.push('PILLAR ' + p + ': ' + e.message); }
}
console.log('=== ERRORS (' + errors.length + ') ===');
errors.forEach(e => console.log(e));
await page.screenshot({ path: 'smoke.png', fullPage: true });
await browser.close();
process.exit(errors.length > 0 ? 1 : 0);
