/// <reference lib="webworker" />

import type { ArchiveEntry, WorkerResult } from './types';

const worker = self as unknown as DedicatedWorkerGlobalScope;

function hex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function extension(path: string): string {
  const name = path.split('/').pop() ?? '';
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
}

function findEnd(view: DataView): number {
  const min = Math.max(0, view.byteLength - 65_557);
  for (let offset = view.byteLength - 22; offset >= min; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) return offset;
  }
  throw new Error('This ZIP has no readable central directory. It may be incomplete, split into parts, or use an unsupported ZIP variant.');
}

function parseZip(buffer: ArrayBuffer): { entries: ArchiveEntry[]; warnings: string[] } {
  const view = new DataView(buffer);
  const end = findEnd(view);
  const disk = view.getUint16(end + 4, true);
  const centralDisk = view.getUint16(end + 6, true);
  const count = view.getUint16(end + 10, true);
  const centralSize = view.getUint32(end + 12, true);
  const centralOffset = view.getUint32(end + 16, true);
  if (disk !== 0 || centralDisk !== 0) throw new Error('Split or multi-disk ZIP archives are not supported. Open each complete ZIP part separately.');
  if (count === 0xffff || centralSize === 0xffffffff || centralOffset === 0xffffffff) throw new Error('ZIP64 archives are not supported in parser 1.0. Re-export using ZIP parts smaller than 4 GB.');
  if (centralOffset + centralSize > buffer.byteLength) throw new Error('The ZIP central directory points outside the file. Download the export again and retry.');

  const decoder = new TextDecoder('utf-8', { fatal: false });
  const entries: ArchiveEntry[] = [];
  const warnings: string[] = [];
  let offset = centralOffset;
  let encrypted = 0;
  for (let index = 0; index < count; index += 1) {
    if (offset + 46 > view.byteLength || view.getUint32(offset, true) !== 0x02014b50) throw new Error(`The ZIP directory is damaged near entry ${index + 1}. Download it again before relying on this inventory.`);
    const flags = view.getUint16(offset + 8, true);
    const crc = view.getUint32(offset + 16, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const size = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const endName = offset + 46 + nameLength;
    if (endName > view.byteLength) throw new Error('The ZIP contains a truncated file name. Download it again and retry.');
    const rawPath = decoder.decode(new Uint8Array(buffer, offset + 46, nameLength));
    const path = rawPath.replace(/\\/g, '/').replace(/^\/+/, '') || '(unnamed entry)';
    const directory = path.endsWith('/');
    if ((flags & 1) === 1) encrypted += 1;
    entries.push({ path, size, compressedSize, crc32: crc.toString(16).padStart(8, '0'), extension: directory ? '' : extension(path), directory });
    offset = endName + extraLength + commentLength;
  }
  if (encrypted) warnings.push(`${encrypted} encrypted ${encrypted === 1 ? 'entry was' : 'entries were'} inventoried by name only. The app never asks for archive passwords.`);
  if (entries.length === 0) warnings.push('This archive contains no directory entries.');
  return { entries, warnings };
}

worker.addEventListener('message', async (event: MessageEvent<{ buffer: ArrayBuffer; name: string }>) => {
  try {
    const { buffer, name } = event.data;
    worker.postMessage({ kind: 'progress', value: 30 });
    const archiveHash = hex(await crypto.subtle.digest('SHA-256', buffer));
    worker.postMessage({ kind: 'progress', value: 65 });
    const lower = name.toLowerCase();
    let archiveType: WorkerResult['archiveType'];
    let entries: ArchiveEntry[];
    let warnings: string[] = [];
    if (lower.endsWith('.zip')) {
      archiveType = 'zip';
      ({ entries, warnings } = parseZip(buffer));
    } else if (lower.endsWith('.json')) {
      archiveType = 'json';
      entries = [{ path: name, size: buffer.byteLength, compressedSize: buffer.byteLength, extension: 'json', directory: false }];
    } else if (lower.endsWith('.csv')) {
      archiveType = 'csv';
      entries = [{ path: name, size: buffer.byteLength, compressedSize: buffer.byteLength, extension: 'csv', directory: false }];
    } else {
      throw new Error('Choose a .zip, .json, or .csv export. Other archive types are not supported in parser 1.0.');
    }
    worker.postMessage({ kind: 'progress', value: 90 });
    worker.postMessage({ kind: 'result', result: { archiveHash, archiveType, entries, warnings } satisfies WorkerResult });
  } catch (error) {
    worker.postMessage({ kind: 'error', message: error instanceof Error ? error.message : 'The archive could not be inspected.' });
  }
});

export {};
