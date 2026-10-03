import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

test('local media, corner geometry, output scaling, backup and reload work without external requests', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (['127.0.0.1', 'localhost'].includes(url.hostname) || url.protocol === 'blob:' || url.protocol === 'data:' || url.hostname === new URL(process.env.TEST_BASE_URL || 'http://localhost').hostname) return route.continue();
    return route.abort();
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Add Quad' }).click();
  await page.getByRole('button', { name: '16:9' }).click();
  await page.getByRole('button', { name: 'Media', exact: true }).click();
  await page.getByLabel('Upload media').setInputFiles('public/samples/calibration.svg');
  await page.getByRole('button', { name: 'Assign calibration.svg' }).click({ force: true });
  await page.getByLabel('X', { exact: true }).fill('400');
  await page.getByLabel('Width', { exact: true }).fill('600');
  // Actual corner drag, not just a state injection.
  const transformBeforeDrag = await page.locator('[data-surface-id] > div').first().evaluate(el => getComputedStyle(el).transform);
  const corner = page.locator('svg g circle.pointer-events-auto').first();
  const box = await corner.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2 + 24, box!.y + box!.height / 2 + 18, { steps: 3 });
  await page.mouse.up();
  await expect.poll(() => page.locator('[data-surface-id] > div').first().evaluate(el => getComputedStyle(el).transform)).not.toBe(transformBeforeDrag);
  const output = await context.newPage();
  await output.setViewportSize({ width: 960, height: 540 });
  await output.goto('/#output');
  await expect(output.getByTestId('projection-stage')).toHaveCSS('transform', /matrix\(0.5,/);
  await expect(output.getByAltText('calibration.svg')).toHaveJSProperty('naturalWidth', 1280);
  await page.getByLabel('X', { exact: true }).fill('500');
  const editorTransform = await page.locator('[data-surface-id] > div').first().evaluate(el => getComputedStyle(el).transform);
  await expect.poll(() => output.locator('[data-surface-id] > div').first().evaluate(el => getComputedStyle(el).transform)).toBe(editorTransform);
  await expect(page.getByRole('status')).toContainText('Saved locally');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export Project' }).click();
  const download = await downloadPromise;
  const file = await download.path();
  const backup = JSON.parse(await fs.readFile(file!, 'utf8'));
  expect(backup.project.surfaces).toHaveLength(1);
  expect(Object.values(backup.media)[0]).toMatch(/^data:image\/svg\+xml;base64,/);
  expect(JSON.stringify(backup)).not.toContain('blob:');
  await page.reload();
  await expect(page.getByLabel('X', { exact: true })).toHaveValue('500');
  await expect(page.locator('[data-surface-id] img')).toHaveJSProperty('naturalWidth', 1280);
  await page.getByLabel('X', { exact: true }).fill('800');
  page.on('dialog', d => d.accept());
  await page.getByLabel('Import Project').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
  await expect(page.getByLabel('X', { exact: true })).toHaveValue('500');
  await expect(output.getByAltText('calibration.svg')).toHaveJSProperty('naturalWidth', 1280);
  await page.getByLabel('Import Project').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"format":"no"}') });
  await expect(page.getByRole('alert')).toContainText('Import failed');
  await expect(page.getByLabel('X', { exact: true })).toHaveValue('500');
  await page.getByRole('button', { name: 'Dismiss' }).click();
  await page.screenshot({ path: `evidence/screenshots/editor_${process.env.TEST_BASE_URL ? 'production_' : ''}20261003.png`, fullPage: true });
  await output.screenshot({ path: `evidence/screenshots/output_${process.env.TEST_BASE_URL ? 'production_' : ''}20261003.png` });
  expect(errors).toEqual([]);
});

test('localStorage output fallback and default ad isolation', async ({ page, context }) => {
  await context.addInitScript(() => { Object.defineProperty(window, 'BroadcastChannel', { value: undefined }); });
  await page.goto('/');
  await page.getByRole('button', { name: 'Add Quad' }).click();
  await page.getByRole('button', { name: '16:9' }).click();
  await page.getByRole('button', { name: 'Media', exact: true }).click();
  await page.getByRole('button', { name: 'Load Calibration Sample' }).click();
  await page.getByRole('button', { name: 'Assign calibration.svg' }).click({ force: true });
  const output = await context.newPage();
  await output.goto('/#output');
  await expect(output.getByAltText('calibration.svg')).toHaveJSProperty('naturalWidth', 1280);
  await page.getByLabel('X', { exact: true }).fill('222');
  await expect.poll(async () => output.locator('[data-surface-id] > div').first().getAttribute('style')).toContain('222');
  for (const tab of [page, output]) expect(await tab.locator('script[src*="googlesyndication"], .adsbygoogle').count()).toBe(0);
});

test('key setup is local and never validates through a paid API', async ({ page }) => {
  const calls: string[] = [];
  await page.route(/googleapis|generativelanguage/, route => route.abort());
  page.on('request', r => { if (/googleapis|generativelanguage/.test(r.url())) calls.push(r.url()); });
  await page.goto('/');
  await page.getByRole('button', { name: 'AI', exact: true }).click();
  await page.getByPlaceholder('Paste your API Key here...').fill('test-only-key-no-network-20261003');
  await page.getByRole('button', { name: 'Save Key (no API request)' }).click();
  expect(calls).toEqual([]);
  expect(await page.evaluate(() => Object.values(localStorage).some(v => String(v).includes('test-only-key')))).toBe(false);
  expect(await page.evaluate(() => Object.values(sessionStorage).some(v => String(v).includes('test-only-key')))).toBe(true);
});

test('locally generated video survives project reload and plays in output', async ({ page, context }) => {
  test.setTimeout(240000);
  await page.goto('/');
  await page.getByRole('button', { name: 'Add Quad' }).click();
  await page.getByRole('button', { name: '16:9' }).click();
  await page.getByRole('button', { name: 'Media', exact: true }).click();
  await page.getByLabel('Upload media').setInputFiles('public/samples/solid.webm');
  await page.getByRole('button', { name: 'Assign solid.webm' }).click({ force: true });
  await expect.poll(() => page.locator('[data-surface-id] video').evaluate((v: HTMLVideoElement) => v.readyState)).toBeGreaterThanOrEqual(2);
  await expect(page.getByRole('status')).toContainText('Saved locally');
  await page.reload();
  const output = await context.newPage(); await output.goto('/#output');
  await expect(output.locator('video')).toBeAttached();

  await expect.poll(() => output.locator('video').evaluate((v: HTMLVideoElement) => ({ ready: v.readyState, error: v.error?.code, source: !!v.getAttribute('src') }))).toMatchObject({ ready: expect.any(Number), source: true });
  await expect.poll(() => output.locator('video').evaluate((v: HTMLVideoElement) => v.readyState), { timeout: 30000 }).toBeGreaterThanOrEqual(2);
  await expect(output.locator('video')).toHaveJSProperty('paused', false);
});

test('published guide has content and keeps ad requests disabled', async ({ page }) => {
  const adRequests: string[] = [];
  await page.route(/googlesyndication|doubleclick/, route => { adRequests.push(route.request().url()); return route.abort(); });
  await page.goto('/guide.html');
  await expect(page.getByRole('heading', { name: 'Make your first mapped surface.' })).toBeVisible();
  await expect(page.locator('#guide-ad')).toBeHidden();
  expect(adRequests).toEqual([]);
  expect(await page.locator('script[src*="googlesyndication"]').count()).toBe(0);
});
