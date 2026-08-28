import type { ArchiveEntry, Category, ChecklistItem, Portability, ServiceMatch } from './types';

export const PARSER_VERSION = '1.0.0';

const formatNames: Record<string, string> = {
  csv: 'CSV', json: 'JSON', jsonl: 'JSON Lines', xml: 'XML', html: 'HTML', htm: 'HTML',
  ics: 'iCalendar', vcf: 'vCard', mbox: 'MBOX', eml: 'Email', txt: 'Plain text', md: 'Markdown',
  pdf: 'PDF', jpg: 'JPEG', jpeg: 'JPEG', png: 'PNG', gif: 'GIF', webp: 'WebP', heic: 'HEIC',
  mp4: 'MP4', mov: 'MOV', avi: 'AVI', mp3: 'MP3', wav: 'WAV', flac: 'FLAC',
  doc: 'Word', docx: 'Word', xls: 'Excel', xlsx: 'Excel', ppt: 'PowerPoint', pptx: 'PowerPoint',
  sqlite: 'SQLite', db: 'Database', js: 'JavaScript data', geojson: 'GeoJSON', gpx: 'GPX', kml: 'KML'
};

const reusable = new Set(['csv', 'json', 'jsonl', 'xml', 'ics', 'vcf', 'mbox', 'eml', 'txt', 'md', 'pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'mp4', 'mov', 'mp3', 'wav', 'flac', 'docx', 'xlsx', 'pptx', 'geojson', 'gpx', 'kml']);
const review = new Set(['html', 'htm', 'js', 'sqlite', 'db', 'doc', 'xls', 'ppt', 'avi']);

const categoryRules: Array<{ id: string; name: string; explanation: string; match: RegExp }> = [
  { id: 'photos-video', name: 'Photos & video', explanation: 'Original and derived visual media. Check whether dates, captions, and albums survive separately.', match: /(^|[/_. -])(photo|photos|image|images|video|videos|media|camera|album|albums|uploads?)([/_. -]|$)|\.(jpe?g|png|gif|webp|heic|mp4|mov|avi)$/i },
  { id: 'messages', name: 'Messages & mail', explanation: 'Conversation content and attachments. Thread structure may depend on the source service.', match: /(^|[/_. -])(message|messages|messaging|mail|email|emails|inbox|chat|chats|dm|direct_messages)([/_. -]|$)|\.(mbox|eml)$/i },
  { id: 'contacts', name: 'Contacts', explanation: 'Address books and contact records. vCard and CSV are widely reusable.', match: /(^|[/_. -])(contact|contacts|address_book|connections?)([/_. -]|$)|\.vcf$/i },
  { id: 'posts', name: 'Posts & activity', explanation: 'Posts, comments, reactions, searches, and viewing history. Some actions only make sense on the original service.', match: /(^|[/_. -])(post|posts|tweet|tweets|toot|outbox|comment|comments|activity|history|search|reactions?|likes?|bookmarks?)([/_. -]|$)/i },
  { id: 'calendar', name: 'Calendar', explanation: 'Events, reminders, and schedules. iCalendar files can usually be imported elsewhere.', match: /(^|[/_. -])(calendar|calendars|event|events|reminder|reminders)([/_. -]|$)|\.ics$/i },
  { id: 'documents', name: 'Documents & files', explanation: 'Uploaded or created documents. Proprietary formats may need their original application.', match: /(^|[/_. -])(document|documents|drive|files?|notes?|notebook)([/_. -]|$)|\.(pdf|docx?|xlsx?|pptx?|md)$/i },
  { id: 'location', name: 'Location', explanation: 'Location history, saved places, routes, and device position records.', match: /(^|[/_. -])(location|locations|places?|maps?|routes?|timeline|gps)([/_. -]|$)|\.(gpx|kml|geojson)$/i },
  { id: 'social', name: 'Social graph', explanation: 'Followers, following, groups, and relationship lists. A file preserves evidence, not the live relationship.', match: /(^|[/_. -])(followers?|following|friends?|subscriptions?|groups?|circles?|social_graph)([/_. -]|$)/i },
  { id: 'purchases', name: 'Purchases & entitlements', explanation: 'Receipts, orders, subscriptions, and licenses. Records do not transfer ownership or access rights.', match: /(^|[/_. -])(purchase|purchases|order|orders|receipt|receipts|billing|payment|payments|entitlement|entitlements|subscription)([/_. -]|$)/i },
  { id: 'profile', name: 'Profile & settings', explanation: 'Account profile, preferences, security, and configuration. Secrets should not be imported blindly.', match: /(^|[/_. -])(profile|account|settings?|preferences?|security|devices?|login|advertising|ads)([/_. -]|$)/i }
];

const accountDependentCategories = new Set(['social', 'purchases', 'profile']);

function portabilityFor(categoryId: string, entries: ArchiveEntry[]): Portability {
  if (accountDependentCategories.has(categoryId)) return 'account-dependent';
  const extensions = entries.map((entry) => entry.extension).filter(Boolean);
  if (extensions.length > 0 && extensions.every((ext) => reusable.has(ext))) return 'reusable';
  if (extensions.some((ext) => reusable.has(ext)) && !extensions.some((ext) => review.has(ext))) return 'reusable';
  return 'review';
}

export function categorize(entries: ArchiveEntry[]): Category[] {
  const buckets = new Map<string, ArchiveEntry[]>();
  for (const entry of entries.filter((item) => !item.directory)) {
    const rule = categoryRules.find((candidate) => candidate.match.test(entry.path));
    const id = rule?.id ?? 'other';
    const existing = buckets.get(id) ?? [];
    existing.push(entry);
    buckets.set(id, existing);
  }

  return [...buckets.entries()].map(([id, matched]) => {
    const rule = categoryRules.find((candidate) => candidate.id === id);
    return {
      id,
      name: rule?.name ?? 'Other archive files',
      explanation: rule?.explanation ?? 'Files that do not match a known category. Review their paths and formats before discarding them.',
      portability: portabilityFor(id, matched),
      bytes: matched.reduce((sum, item) => sum + item.size, 0),
      files: matched.length,
      formats: [...new Set(matched.map((item) => formatNames[item.extension] ?? (item.extension ? item.extension.toUpperCase() : 'No extension')))].sort(),
      paths: matched.map((item) => item.path).sort().slice(0, 100)
    };
  }).sort((a, b) => b.bytes - a.bytes || b.files - a.files);
}

const serviceRules: Array<{ id: string; name: string; pattern: RegExp; support: string }> = [
  { id: 'google', name: 'Google Takeout', pattern: /(^|\/)takeout\/|archive_browser\.html|subscriptions\.json/i, support: 'Google Takeout ZIP folder convention; individual product schemas are inventoried, not interpreted. Tested against common Takeout layouts through 2026-08.' },
  { id: 'meta', name: 'Meta Accounts Center', pattern: /your_facebook_activity|instagram_information|personal_information\/|your_activity_across_facebook/i, support: 'Facebook/Instagram Accounts Center HTML and JSON ZIP layouts commonly emitted through 2026-08.' },
  { id: 'x', name: 'X / Twitter archive', pattern: /(^|\/)data\/(tweet|tweets|account|follower|following)(-headers)?\.js$|your archive\.html/i, support: 'X archive HTML viewer and JavaScript data layout commonly emitted through 2026-08; JavaScript wrappers are not converted.' },
  { id: 'mastodon', name: 'Mastodon archive', pattern: /(^|\/)(actor|outbox|likes|bookmarks)\.json$|bookmarks\.csv|following_accounts\.csv/i, support: 'Mastodon ActivityPub JSON archives and relationship CSV exports documented through Mastodon 4.4.' },
  { id: 'discord', name: 'Discord data package', pattern: /(^|\/)messages\/index\.json$|(^|\/)servers\/index\.json$|(^|\/)account\/user\.json$/i, support: 'Discord data package folder conventions observed through 2026-08; message bodies are inventoried only.' },
  { id: 'linkedin', name: 'LinkedIn archive', pattern: /(^|\/)(connections|messages|positions|recommendations_received)\.csv$/i, support: 'LinkedIn CSV archive names commonly emitted through 2026-08.' },
  { id: 'reddit', name: 'Reddit data export', pattern: /(^|\/)(comments|posts|saved_posts|subscribed_subreddits)\.csv$/i, support: 'Reddit CSV export names commonly emitted through 2026-08.' }
];

export function detectService(entries: ArchiveEntry[]): ServiceMatch {
  const paths = entries.map((entry) => entry.path).join('\n');
  const matches = serviceRules.map((rule) => ({ rule, hits: (paths.match(new RegExp(rule.pattern.source, 'gim')) ?? []).length })).filter((item) => item.hits > 0).sort((a, b) => b.hits - a.hits);
  if (matches.length === 0) return { id: 'generic', name: 'Generic export', confidence: 'generic', support: 'Generic ZIP 2.0 central directory, JSON, or CSV inventory. Contents are classified by path and extension; internal schemas are not interpreted.' };
  const top = matches[0];
  return { id: top.rule.id, name: top.rule.name, confidence: top.hits >= 2 ? 'high' : 'medium', support: top.rule.support };
}

export function makeChecklist(categories: Category[], service: ServiceMatch): ChecklistItem[] {
  const top = categories[0];
  return [
    { id: 'original', text: 'Keep the original export unchanged', detail: 'Store the downloaded archive as evidence. Work from a copy when converting files.', done: false },
    { id: 'second-copy', text: 'Make a second copy in another place', detail: 'Use a separate drive or encrypted backup. A single download is not a preservation plan.', done: false },
    { id: 'open-sample', text: `Open one item from ${top?.name ?? 'the largest category'}`, detail: 'A file name is not enough—verify that a representative file opens and contains what you expect.', done: false },
    { id: 'relationships', text: 'Record what stays account-dependent', detail: 'Followers, access rights, subscriptions, and service context are not preserved by a downloaded file.', done: false },
    { id: 'manifest', text: 'Download the signed manifest', detail: `Keep it next to the ${service.name} archive so you can verify the archive SHA-256 later.`, done: false }
  ];
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}
