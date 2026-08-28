import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

function sampleZip(paths: Array<{ name: string; size: number }>): Buffer {
  const encoder = new TextEncoder();
  const records = paths.map(({ name, size }) => {
    const bytes = encoder.encode(name);
    const record = Buffer.alloc(46 + bytes.length);
    record.writeUInt32LE(0x02014b50, 0);
    record.writeUInt16LE(20, 4); record.writeUInt16LE(20, 6);
    record.writeUInt32LE(0x12345678, 16);
    record.writeUInt32LE(size, 20); record.writeUInt32LE(size, 24);
    record.writeUInt16LE(bytes.length, 28);
    Buffer.from(bytes).copy(record, 46);
    return record;
  });
  const directory = Buffer.concat(records);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(paths.length, 8); end.writeUInt16LE(paths.length, 10);
  end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(0, 16);
  return Buffer.concat([directory, end]);
}

test('inspects an export and creates a signed preservation map', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText(/Know what leaves/);
  const accessibility = await new AxeBuilder({ page: page as never }).analyze();
  expect(accessibility.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);

  const zip = sampleZip([
    { name: 'Takeout/Google Photos/Album/photo.jpg', size: 4_000_000 },
    { name: 'Takeout/Contacts/All Contacts.vcf', size: 12_000 },
    { name: 'Takeout/Mail/All mail.mbox', size: 500_000 },
    { name: 'Takeout/Calendar/Events.ics', size: 1_500 },
    { name: 'Takeout/YouTube/history.json', size: 14_000 },
    { name: 'Takeout/Subscriptions/subscriptions.json', size: 8_000 }
  ]);
  await page.locator('#archive-input').setInputFiles({ name: 'takeout-demo.zip', mimeType: 'application/zip', buffer: zip });
  await expect(page.locator('#results')).toBeVisible();
  await expect(page.locator('#service-name')).toHaveText('Google Takeout');
  await expect(page.locator('#signature-stamp')).toContainText('Manifest verified');
  await expect(page.locator('.inventory details')).toHaveCount(6);
  await page.locator('.checklist input').first().check();
  await expect(page.locator('#completion-label')).toContainText('1 of 5');

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download signed manifest' }).click();
  expect((await download).suggestedFilename()).toContain('signed-manifest.json');
});

test('shell and saved map interface remain available offline', async ({ page, context }) => {
  await page.goto('/');
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('h1')).toHaveText(/Know what leaves/);
  await expect(page.locator('#saved-title')).toBeVisible();
});

test('legal pages and mobile layout expose one clear main heading', async ({ page }) => {
  await page.goto('/privacy/');
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveText('Privacy');
  await page.goto('/terms/');
  await expect(page.locator('h1')).toHaveText('Terms');
});
