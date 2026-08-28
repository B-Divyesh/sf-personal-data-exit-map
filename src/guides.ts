export interface ExitGuide {
  id: string;
  name: string;
  summary: string;
  steps: string[];
  formats: string;
  link: string;
  linkLabel: string;
}

export const guides: ExitGuide[] = [
  {
    id: 'google', name: 'Google', summary: 'Request selected products through Google Takeout.',
    steps: ['Select only the products you need.', 'Choose ZIP and a manageable archive size.', 'Download every part, then inspect each ZIP here.'],
    formats: 'Takeout ZIP; per-product JSON, CSV, MBOX, media, and documents. Layouts vary by product.',
    link: 'https://takeout.google.com/', linkLabel: 'Open Google Takeout'
  },
  {
    id: 'apple', name: 'Apple', summary: 'Request a copy from Apple’s Data & Privacy portal.',
    steps: ['Choose “Obtain a copy of your data”.', 'Select categories and archive size.', 'Download all parts before their links expire.'],
    formats: 'ZIP parts containing CSV, JSON, documents, and original media; availability varies by region.',
    link: 'https://privacy.apple.com/', linkLabel: 'Open Apple Data & Privacy'
  },
  {
    id: 'meta', name: 'Facebook / Instagram', summary: 'Use Accounts Center to download your information.',
    steps: ['Choose the correct profile and date range.', 'Prefer JSON for reuse; HTML is easier to read.', 'Select high media quality before creating the export.'],
    formats: 'ZIP in HTML or JSON. This map inventories both; JSON is usually more reusable.',
    link: 'https://accountscenter.facebook.com/info_and_permissions/dyi/', linkLabel: 'Open Accounts Center'
  },
  {
    id: 'x', name: 'X / Twitter', summary: 'Request the account archive from account settings.',
    steps: ['Open Settings and privacy → Your account.', 'Request “Download an archive of your data”.', 'Keep the original ZIP; JavaScript data files may need careful conversion.'],
    formats: 'ZIP with HTML viewer, media, and JavaScript-wrapped JSON. Viewer layout changes over time.',
    link: 'https://help.x.com/en/managing-your-account/how-to-download-your-x-archive', linkLabel: 'Read official X instructions'
  },
  {
    id: 'mastodon', name: 'Mastodon', summary: 'Export from your instance’s Import and export settings.',
    steps: ['Export follows, blocks, bookmarks, and lists separately.', 'Request the archive for posts and uploaded media.', 'Keep CSV relationship lists even if you migrate your follows.'],
    formats: 'ActivityPub JSON archive plus CSV lists. Import support depends on the destination instance.',
    link: 'https://docs.joinmastodon.org/user/moving/', linkLabel: 'Read Mastodon moving guide'
  },
  {
    id: 'reddit', name: 'Reddit', summary: 'Submit a data request for your Reddit account.',
    steps: ['Choose GDPR or CCPA only when it applies; otherwise choose Other.', 'Wait for the download link.', 'Inspect the CSV files and verify posts/comments independently.'],
    formats: 'ZIP containing CSV tables. Deleted or unavailable content may not be recoverable.',
    link: 'https://www.reddit.com/settings/data-request', linkLabel: 'Open Reddit data request'
  },
  {
    id: 'discord', name: 'Discord', summary: 'Request your data package from Data & Privacy settings.',
    steps: ['Open User Settings → Data & Privacy.', 'Choose “Request Data” and confirm the request.', 'Download the emailed package and keep its ZIP unchanged.'],
    formats: 'ZIP containing account, server, activity, and message JSON plus attachments. Server membership does not transfer.',
    link: 'https://support.discord.com/hc/en-us/articles/360004027692-Requesting-a-Copy-of-your-Data', linkLabel: 'Read Discord instructions'
  },
  {
    id: 'linkedin', name: 'LinkedIn', summary: 'Request an archive from Data privacy settings.',
    steps: ['Choose specific files or the complete archive.', 'Download before the link expires.', 'Check connections, messages, and uploaded media separately.'],
    formats: 'ZIP containing CSV plus media files. Connections do not transfer automatically.',
    link: 'https://www.linkedin.com/mypreferences/d/download-my-data', linkLabel: 'Open LinkedIn data export'
  },
  {
    id: 'tiktok', name: 'TikTok', summary: 'Request data from the in-app Download your data setting.',
    steps: ['Choose JSON for structured reuse.', 'Wait for the file to be prepared.', 'Download promptly and inspect viewing/activity records.'],
    formats: 'ZIP containing TXT or JSON depending on request choice.',
    link: 'https://support.tiktok.com/en/account-and-privacy/personalized-ads-and-data/requesting-your-data', linkLabel: 'Read TikTok instructions'
  }
];
