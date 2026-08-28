import { describe, expect, it } from 'vitest';
import { categorize, detectService, formatBytes, makeChecklist } from '../../src/analyzer';
import type { ArchiveEntry } from '../../src/types';

function entry(path: string, size = 100): ArchiveEntry {
  const extension = path.includes('.') ? path.split('.').pop()?.toLowerCase() ?? '' : '';
  return { path, size, compressedSize: size, extension, directory: path.endsWith('/') };
}

describe('archive classification', () => {
  it('detects a Google Takeout layout and maps reusable categories', () => {
    const entries = [
      entry('Takeout/Google Photos/Album/photo.jpg', 4_000),
      entry('Takeout/Contacts/All Contacts.vcf', 500),
      entry('Takeout/Calendar/Events.ics', 300),
      entry('Takeout/Mail/All mail.mbox', 2_000),
      entry('Takeout/Profile/Profile.json', 200)
    ];
    const service = detectService(entries);
    const categories = categorize(entries);
    expect(service.name).toBe('Google Takeout');
    expect(categories.find((category) => category.id === 'photos-video')?.portability).toBe('reusable');
    expect(categories.find((category) => category.id === 'profile')?.portability).toBe('account-dependent');
    expect(makeChecklist(categories, service)).toHaveLength(5);
  });

  it('labels unknown layouts honestly', () => {
    const result = detectService([entry('mystery/blob.bin')]);
    expect(result.confidence).toBe('generic');
    expect(result.support).toContain('Generic ZIP 2.0');
  });

  it('formats preservation sizes', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(12 * 1024 * 1024)).toBe('12 MB');
  });
});
