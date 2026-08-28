import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { webcrypto } from 'node:crypto';

function sampleZip(paths: Array<{ name: string; size?: number }>): Buffer {
  const encoder = new TextEncoder();
  const records = paths.map(({ name, size = 100 }) => {
    const bytes = encoder.encode(name);
    const record = Buffer.alloc(46 + bytes.length);
    record.writeUInt32LE(0x02014b50, 0);
    record.writeUInt16LE(20, 4);
    record.writeUInt16LE(20, 6);
    record.writeUInt32LE(0x12345678, 16);
    record.writeUInt32LE(size, 20);
    record.writeUInt32LE(size, 24);
    record.writeUInt16LE(bytes.length, 28);
    Buffer.from(bytes).copy(record, 46);
    return record;
  });
  const directory = Buffer.concat(records);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(paths.length, 8);
  end.writeUInt16LE(paths.length, 10);
  end.writeUInt32LE(directory.length, 12);
  return Buffer.concat([directory, end]);
}

async function openDemo(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/demo/');
  await expect(page.locator('#results')).toBeVisible();
}

test('@claim:demo-sandbox opens sample data in an isolated resettable store', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeVisible();
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('personal-data-exit-map', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('assessments', { keyPath: 'id' });
      request.onsuccess = () => { request.result.close(); resolve(); };
      request.onerror = () => reject(request.error);
    });
  });
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page).toHaveURL(/\/demo\/$/);
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('#file-summary')).toContainText('6 files mapped');
  await expect.poll(() => page.evaluate(async () => (await indexedDB.databases()).map((database) => database.name))).toEqual(expect.arrayContaining(['personal-data-exit-map', 'demo:personal-data-exit-map']));

  await page.locator('.checklist input').first().check();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('#completion-label')).toContainText('0 of 5');
  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => page.evaluate(async () => (await indexedDB.databases()).map((database) => database.name))).not.toContain('demo:personal-data-exit-map');
});

test('@claim:offline-reload reloads and analyzes the sample while offline', async ({ page, context }) => {
  await openDemo(page);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#results')).toBeVisible();
  await expect(page.locator('#service-name')).toHaveText('Google Takeout');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('#file-summary')).toContainText('6 files mapped');
});

test('@claim:local-only keeps selected data off the network and out of stored assessments', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await openDemo(page);
  const secret = 'PRIVATE-CONTENT-9d4efb72';
  await page.locator('#archive-input').setInputFiles({ name: 'account.json', mimeType: 'application/json', buffer: Buffer.from(`{"secret":"${secret}"}`) });
  await expect(page.locator('#file-summary')).toContainText('account.json');
  expect(requests.every((url) => new URL(url).origin === 'http://127.0.0.1:4173')).toBe(true);
  const browserState = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('demo:personal-data-exit-map');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const assessments = await new Promise<unknown[]>((resolve, reject) => {
      const request = database.transaction('assessments').objectStore('assessments').getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    database.close();
    return { assessments, cookies: document.cookie, local: { ...localStorage }, session: { ...sessionStorage }, passwords: document.querySelectorAll('input[type="password"]').length };
  });
  expect(JSON.stringify(browserState)).not.toContain(secret);
  expect(browserState.cookies).toBe('');
  expect(browserState.local).toEqual({});
  expect(browserState.session).toEqual({});
  expect(browserState.passwords).toBe(0);
});

test('@claim:input-support opens ZIP, JSON, and CSV and enforces the 1.5 GB limit', async ({ page }) => {
  await openDemo(page);
  await page.locator('#archive-input').setInputFiles({ name: 'profile.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
  await expect(page.locator('#file-summary')).toContainText('profile.json');
  await page.locator('#archive-input').setInputFiles({ name: 'contacts.csv', mimeType: 'text/csv', buffer: Buffer.from('name,email\nA,a@example.test') });
  await expect(page.locator('#file-summary')).toContainText('contacts.csv');
  await page.locator('#archive-input').setInputFiles({ name: 'archive.zip', mimeType: 'application/zip', buffer: sampleZip([{ name: 'docs/note.txt' }]) });
  await expect(page.locator('#file-summary')).toContainText('archive.zip');
  await page.evaluate(() => {
    const input = document.querySelector<HTMLInputElement>('#archive-input');
    if (!input) throw new Error('Missing archive input');
    const oversized = new File(['x'], 'oversized.zip', { type: 'application/zip' });
    Object.defineProperty(oversized, 'size', { value: 1_610_612_737 });
    const transfer = new DataTransfer();
    transfer.items.add(oversized);
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('#analysis-error')).toContainText('larger than the 1.5 GB safety limit');
});

test('@claim:category-map maps the sample into categories and a five-step plan', async ({ page }) => {
  await openDemo(page);
  await expect(page.locator('#service-name')).toHaveText('Google Takeout');
  await expect(page.locator('.inventory details')).toHaveCount(6);
  await expect(page.locator('.checklist li')).toHaveCount(5);
  await expect(page.locator('#reusable-count')).toHaveText('5');
  await expect(page.locator('#dependent-count')).toHaveText('1');
});

test('@claim:supported-layouts recognizes each documented service layout', async ({ page }) => {
  await openDemo(page);
  const fixtures = [
    ['Google Takeout', 'Takeout/Contacts/contacts.vcf'],
    ['Meta Accounts Center', 'your_facebook_activity/posts.json'],
    ['X / Twitter archive', 'data/tweet.js'],
    ['Mastodon archive', 'outbox.json'],
    ['Discord data package', 'messages/index.json'],
    ['LinkedIn archive', 'Connections.csv'],
    ['Reddit data export', 'comments.csv']
  ] as const;
  for (const [service, path] of fixtures) {
    await page.locator('#archive-input').setInputFiles({ name: `${service}.zip`, mimeType: 'application/zip', buffer: sampleZip([{ name: path }]) });
    await expect(page.locator('#service-name')).toHaveText(service);
  }
});

test('@claim:signed-manifest downloads independently verifiable SHA-256 evidence', async ({ page }) => {
  await openDemo(page);
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download signed manifest' }).click();
  const downloaded = await pending;
  const path = await downloaded.path();
  if (!path) throw new Error('Manifest download has no local path');
  const manifest = JSON.parse(await readFile(path, 'utf8'));
  expect(manifest.archive.sha256).toMatch(/^[a-f0-9]{64}$/);
  expect(manifest.signature.algorithm).toBe('ECDSA-P256-SHA256');
  const signature = manifest.signature;
  delete manifest.signature;
  const key = await webcrypto.subtle.importKey('jwk', signature.publicKeyJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  const valid = await webcrypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, Buffer.from(signature.value, 'base64'), new TextEncoder().encode(JSON.stringify(manifest)));
  expect(valid).toBe(true);
});

test('@claim:tamper-detection labels a changed signed assessment invalid', async ({ page }) => {
  await openDemo(page);
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export assessment JSON' }).click();
  const downloaded = await pending;
  const path = await downloaded.path();
  if (!path) throw new Error('Assessment download has no local path');
  const assessment = JSON.parse(await readFile(path, 'utf8'));
  assessment.manifest.entries[0].path = 'changed/path.jpg';
  await page.locator('#assessment-import').setInputFiles({ name: 'changed-assessment.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(assessment)) });
  await expect(page.locator('#signature-stamp')).toContainText('Signature invalid');
});

test('@claim:data-export exports one CSV row per file and a complete JSON map', async ({ page }) => {
  await openDemo(page);
  let pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export inventory CSV' }).click();
  let downloaded = await pending;
  let path = await downloaded.path();
  if (!path) throw new Error('CSV download has no local path');
  const csv = await readFile(path, 'utf8');
  expect(csv.trim().split(/\r?\n/)).toHaveLength(7);
  expect(csv).toContain('"Category","Portability","File path"');

  pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export assessment JSON' }).click();
  downloaded = await pending;
  path = await downloaded.path();
  if (!path) throw new Error('JSON download has no local path');
  const assessment = JSON.parse(await readFile(path, 'utf8'));
  expect(assessment.manifest.entries).toHaveLength(6);
  expect(assessment.checklist).toHaveLength(5);
});

test('@claim:persistence keeps derived maps and checklist state after reload', async ({ page }) => {
  await openDemo(page);
  await page.locator('.checklist input').first().check();
  await expect(page.locator('#completion-label')).toContainText('1 of 5');
  await page.reload();
  await expect(page.locator('#completion-label')).toContainText('1 of 5');
  await expect(page.locator('.checklist input').first()).toBeChecked();
});

test('@claim:service-guides provides the documented manual export destinations', async ({ page }) => {
  await openDemo(page);
  await expect(page.locator('#guide-list details')).toHaveCount(9);
  const destinations = await page.locator('#guide-list a').evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).href));
  expect(destinations).toHaveLength(9);
  expect(destinations.every((url) => url.startsWith('https://'))).toBe(true);
});

test('@claim:free-no-account completes the sample without login or payment', async ({ page }) => {
  const outbound: string[] = [];
  page.on('request', (request) => outbound.push(request.url()));
  await openDemo(page);
  await expect(page.getByText('Free to use', { exact: true })).toBeVisible();
  await expect(page.locator('input[type="password"], input[type="email"], a[href*="checkout"], a[href*="billing"]')).toHaveCount(0);
  expect(outbound.some((url) => url.includes('/api/v1/') || /checkout|billing/i.test(url))).toBe(false);
});

test('@claim:accessible-controls supports mobile, keyboard, and serious axe checks', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await openDemo(page);
  const accessibility = await new AxeBuilder({ page: page as never }).analyze();
  expect(accessibility.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth === innerWidth)).toBe(true);
  const brand = await page.locator('.brand').boundingBox();
  expect(brand?.height).toBeGreaterThanOrEqual(44);
  await page.locator('#guide-list summary').first().click();
  const guideLink = await page.locator('#guide-list a').first().boundingBox();
  expect(guideLink?.height).toBeGreaterThanOrEqual(44);
});
