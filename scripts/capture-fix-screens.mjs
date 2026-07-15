import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', (err) => console.log('PAGEERROR', err.message));
await page.goto('http://127.0.0.1:4175/', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(5000);

// Expand remaining collapsed groups (stable loop)
while (true) {
  const btn = page.locator('aside[aria-label="LAYERS"] button[aria-expanded="false"]').first();
  if ((await btn.count()) === 0) break;
  await btn.click();
  await page.waitForTimeout(200);
}

await page.waitForTimeout(400);
await page.screenshot({ path: 'fix-default-1920.png' });
console.log('default ok');

const videoCard = page.locator('section').filter({ hasText: 'VIDEO FEED' }).first();
await videoCard.getByLabel('Maximize').click();
await page.waitForTimeout(700);
await page.screenshot({ path: 'fix-maximized-1920.png' });
console.log('maximized ok');

await page.getByLabel('Restore').click();
await page.waitForTimeout(400);
for (const title of ['3D VIEW', 'VIDEO FEED', 'INTEL FEED']) {
  const card = page.locator('section').filter({ hasText: title }).first();
  if (await card.count()) {
    await card.getByLabel('Close').click();
    await page.waitForTimeout(350);
  }
}
await page.waitForTimeout(700);
const layout = await page.evaluate(
  () => document.querySelector('[data-right-layout]')?.getAttribute('data-right-layout'),
);
console.log('layout', layout);
await page.screenshot({ path: 'fix-single-1920.png' });
console.log('single ok');
await browser.close();
