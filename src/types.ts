export type Portability = 'reusable' | 'review' | 'account-dependent';

export interface ArchiveEntry {
  path: string;
  size: number;
  compressedSize: number;
  crc32?: string;
  extension: string;
  directory: boolean;
}

export interface WorkerResult {
  archiveHash: string;
  archiveType: 'zip' | 'json' | 'csv';
  entries: ArchiveEntry[];
  warnings: string[];
}

export interface Category {
  id: string;
  name: string;
  explanation: string;
  portability: Portability;
  bytes: number;
  files: number;
  formats: string[];
  paths: string[];
}

export interface ServiceMatch {
  id: string;
  name: string;
  confidence: 'high' | 'medium' | 'generic';
  support: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  detail: string;
  done: boolean;
}

export interface SignedManifest {
  schema: 'personal-data-exit-map/manifest-v1';
  createdAt: string;
  archive: {
    name: string;
    bytes: number;
    sha256: string;
    type: WorkerResult['archiveType'];
    lastModified: number;
  };
  parser: { name: string; version: string; limits: string[] };
  summary: { files: number; folders: number; uncompressedBytes: number };
  categories: Array<Omit<Category, 'paths'>>;
  entries: ArchiveEntry[];
  signature?: {
    algorithm: 'ECDSA-P256-SHA256';
    value: string;
    publicKeyJwk: JsonWebKey;
  };
}

export interface Assessment {
  id: string;
  createdAt: string;
  updatedAt: string;
  fileName: string;
  fileBytes: number;
  service: ServiceMatch;
  categories: Category[];
  checklist: ChecklistItem[];
  manifest: SignedManifest;
  warnings: string[];
  signatureValid: boolean;
}
