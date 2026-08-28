import './style.css';
import { categorize, detectService, formatBytes, makeChecklist, PARSER_VERSION } from './analyzer';
import { guides } from './guides';
import { listAssessments, removeAssessment, saveAssessment } from './db';
import { signManifest, verifyManifest } from './signing';
import type { Assessment, Category, SignedManifest, WorkerResult } from './types';

const $ = <T extends HTMLElement>(selector: string): T => {
  const node = document.querySelector<T>(selector);
  if (!node) throw new Error(`Missing interface element: ${selector}`);
  return node;
};

let current: Assessment | null = null;
let deleteId: string | null = null;
let worker: Worker | null = null;

const archiveInput = $<HTMLInputElement>('#archive-input');
const assessmentImport = $<HTMLInputElement>('#assessment-import');
const dropZone = $('#drop-zone');
const progress = $('#analysis-progress');
const errorNotice = $('#analysis-error');
const results = $('#results');
const deleteDialog = $<HTMLDialogElement>('#delete-dialog');

function text(selector: string, value: string): void { $(selector).textContent = value; }

function setProgress(value: number, label = 'Reading the archive locally…'): void {
  progress.hidden = false;
  text('#progress-label', label);
  text('#progress-value', `${value}%`);
  $('#progress-bar').style.width = `${value}%`;
  $('.progress-track').setAttribute('aria-valuenow', String(value));
}

function showError(message: string): void {
  progress.hidden = true;
  errorNotice.textContent = `${message} Your file has not been changed or stored.`;
  errorNotice.hidden = false;
  errorNotice.focus({ preventScroll: true });
}

function showToast(message: string): void {
  const toast = $('#toast');
  text('#toast-message', message);
  toast.hidden = false;
  window.setTimeout(() => { if ($('#toast-action').hidden) toast.hidden = true; }, 4500);
}

function safeFilePart(name: string): string {
  return name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '').slice(0, 80) || 'export';
}

function download(name: string, data: string, type: string): void {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function analyzeFile(file: File): Promise<void> {
  errorNotice.hidden = true;
  results.hidden = true;
  if (file.size === 0) return showError('This file is empty. Download the export again and choose the completed file.');
  if (file.size > 1_610_612_736) return showError('This file is larger than the 1.5 GB safety limit. Ask the service for smaller ZIP parts and inspect each part separately.');
  if (!/\.(zip|json|csv)$/i.test(file.name)) return showError('Parser 1.0 supports ZIP, JSON, and CSV exports only.');
  setProgress(8, `Reading ${file.name}…`);
  try {
    const buffer = await file.arrayBuffer();
    setProgress(20, 'Computing archive evidence…');
    worker?.terminate();
    worker = new Worker(new URL('./archive-worker.ts', import.meta.url), { type: 'module' });
    const parsed = await new Promise<WorkerResult>((resolve, reject) => {
      const active = worker as Worker;
      active.onmessage = (event: MessageEvent<{ kind: string; value?: number; result?: WorkerResult; message?: string }>) => {
        if (event.data.kind === 'progress') setProgress(event.data.value ?? 20, event.data.value === 90 ? 'Drawing the category map…' : 'Computing archive evidence…');
        if (event.data.kind === 'result' && event.data.result) resolve(event.data.result);
        if (event.data.kind === 'error') reject(new Error(event.data.message));
      };
      active.onerror = () => reject(new Error('The isolated archive inspector stopped unexpectedly. Reload and try again.'));
      active.postMessage({ buffer, name: file.name }, [buffer]);
    });
    worker.terminate();
    worker = null;
    setProgress(94, 'Signing the preservation manifest…');
    const categories = categorize(parsed.entries);
    const service = detectService(parsed.entries);
    const createdAt = new Date().toISOString();
    const folders = parsed.entries.filter((entry) => entry.directory).length;
    const manifestBase: SignedManifest = {
      schema: 'personal-data-exit-map/manifest-v1',
      createdAt,
      archive: { name: file.name, bytes: file.size, sha256: parsed.archiveHash, type: parsed.archiveType, lastModified: file.lastModified },
      parser: {
        name: 'Personal Data Exit Map central-directory inspector', version: PARSER_VERSION,
        limits: ['ZIP64 and split archives are not supported.', 'ZIP contents are not decompressed or schema-validated.', 'Entry CRC-32 values come from the ZIP directory; archive SHA-256 is computed locally.', 'Classification uses file paths and extensions and may require human review.']
      },
      summary: { files: parsed.entries.length - folders, folders, uncompressedBytes: parsed.entries.reduce((sum, entry) => sum + (entry.directory ? 0 : entry.size), 0) },
      categories: categories.map(({ paths: _paths, ...category }) => category),
      entries: parsed.entries
    };
    const manifest = await signManifest(manifestBase);
    const assessment: Assessment = {
      id: parsed.archiveHash.slice(0, 24), createdAt, updatedAt: createdAt, fileName: file.name, fileBytes: file.size,
      service, categories, checklist: makeChecklist(categories, service), manifest, warnings: parsed.warnings,
      signatureValid: await verifyManifest(manifest)
    };
    await saveAssessment(assessment);
    current = assessment;
    setProgress(100, 'Exit map complete');
    renderAssessment(assessment);
    await renderSaved();
    window.setTimeout(() => { progress.hidden = true; results.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); }, 280);
  } catch (error) {
    worker?.terminate();
    worker = null;
    showError(error instanceof Error ? error.message : 'The export could not be inspected.');
  } finally {
    archiveInput.value = '';
  }
}

function statusLabel(category: Category): string {
  if (category.portability === 'reusable') return 'Reusable';
  if (category.portability === 'review') return 'Review needed';
  return 'Account-dependent';
}

function renderInventory(categories: Category[]): void {
  const inventory = $('#inventory');
  inventory.replaceChildren();
  if (categories.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'notice';
    empty.textContent = 'No files were found in this export. Keep the archive until you can download a complete copy.';
    inventory.append(empty);
    return;
  }
  categories.forEach((category) => {
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    const name = document.createElement('span');
    name.className = 'inventory-name'; name.textContent = category.name;
    const status = document.createElement('span');
    status.className = `status-pill ${category.portability}`; status.textContent = statusLabel(category);
    const files = document.createElement('span');
    files.className = 'inventory-number'; files.textContent = `${category.files.toLocaleString()} ${category.files === 1 ? 'file' : 'files'}`;
    const size = document.createElement('span');
    size.className = 'inventory-number'; size.textContent = formatBytes(category.bytes);
    summary.append(name, status, files, size);

    const detail = document.createElement('div'); detail.className = 'inventory-detail';
    const explanation = document.createElement('p'); explanation.textContent = category.explanation;
    const formats = document.createElement('ul'); formats.className = 'format-list'; formats.setAttribute('aria-label', 'Detected formats');
    category.formats.forEach((format) => { const item = document.createElement('li'); item.textContent = format; formats.append(item); });
    const paths = document.createElement('ol'); paths.className = 'path-list'; paths.setAttribute('aria-label', `Example paths for ${category.name}`);
    category.paths.forEach((path) => { const item = document.createElement('li'); item.textContent = path; paths.append(item); });
    detail.append(explanation, formats, paths);
    details.append(summary, detail);
    inventory.append(details);
  });
}

function updateCompletion(): void {
  if (!current) return;
  const done = current.checklist.filter((item) => item.done).length;
  text('#completion-label', `${done} of ${current.checklist.length} checked`);
  $('#completion-bar').style.width = `${(done / current.checklist.length) * 100}%`;
}

function renderChecklist(assessment: Assessment): void {
  const list = $('#checklist');
  list.replaceChildren();
  assessment.checklist.forEach((item) => {
    const row = document.createElement('li');
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox'; input.checked = item.done;
    input.addEventListener('change', async () => {
      if (!current) return;
      const target = current.checklist.find((check) => check.id === item.id);
      if (target) target.done = input.checked;
      current.updatedAt = new Date().toISOString();
      updateCompletion();
      try { await saveAssessment(current); await renderSaved(); } catch { showToast('Checklist changed, but local storage could not be updated.'); }
    });
    const copy = document.createElement('span');
    const strong = document.createElement('strong'); strong.textContent = item.text;
    const detail = document.createElement('small'); detail.textContent = item.detail;
    copy.append(strong, detail); label.append(input, copy); row.append(label); list.append(row);
  });
  updateCompletion();
}

function renderAssessment(assessment: Assessment): void {
  current = assessment;
  results.hidden = false;
  text('#assessment-date', new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(assessment.createdAt)));
  text('#file-summary', `${assessment.fileName} · ${formatBytes(assessment.fileBytes)} · ${assessment.manifest.summary.files.toLocaleString()} files mapped`);
  text('#service-name', assessment.service.name);
  text('#service-confidence', assessment.service.confidence === 'generic' ? 'No service match' : `${assessment.service.confidence[0].toUpperCase()}${assessment.service.confidence.slice(1)} confidence`);
  text('#support-detail', assessment.service.support);
  const stamp = $('#signature-stamp');
  stamp.classList.toggle('invalid', !assessment.signatureValid);
  stamp.innerHTML = assessment.signatureValid ? '<span>Signed</span>Manifest verified' : '<span>Review</span>Signature invalid';
  text('#reusable-count', String(assessment.categories.filter((item) => item.portability === 'reusable').length));
  text('#review-count', String(assessment.categories.filter((item) => item.portability === 'review').length));
  text('#dependent-count', String(assessment.categories.filter((item) => item.portability === 'account-dependent').length));
  text('#total-size', formatBytes(assessment.manifest.summary.uncompressedBytes));
  const warnings = $('#warning-stack'); warnings.replaceChildren();
  assessment.warnings.forEach((warning) => { const notice = document.createElement('p'); notice.className = 'notice'; notice.textContent = warning; warnings.append(notice); });
  renderInventory(assessment.categories);
  renderChecklist(assessment);
}

async function renderSaved(): Promise<void> {
  const container = $('#saved-list');
  try {
    const assessments = await listAssessments();
    container.replaceChildren();
    if (assessments.length === 0) {
      const empty = document.createElement('div'); empty.className = 'saved-empty';
      empty.innerHTML = '<strong>No maps saved yet</strong><span>Inspect an export above or import an assessment JSON file.</span>';
      container.append(empty); return;
    }
    assessments.forEach((assessment) => {
      const item = document.createElement('article'); item.className = 'saved-item';
      const title = document.createElement('strong'); title.textContent = assessment.fileName;
      const service = document.createElement('span'); service.textContent = assessment.service.name;
      const date = document.createElement('span'); date.textContent = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(assessment.updatedAt));
      const actions = document.createElement('div'); actions.className = 'saved-actions';
      const open = document.createElement('button'); open.className = 'icon-button'; open.type = 'button'; open.textContent = 'Open'; open.setAttribute('aria-label', `Open map for ${assessment.fileName}`);
      open.addEventListener('click', () => { renderAssessment(assessment); results.scrollIntoView({ behavior: 'smooth' }); });
      const remove = document.createElement('button'); remove.className = 'icon-button'; remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label', `Remove map for ${assessment.fileName}`);
      remove.addEventListener('click', () => { deleteId = assessment.id; text('#delete-detail', `Remove the saved map for ${assessment.fileName} from this browser? Your original archive is not affected.`); deleteDialog.showModal(); });
      actions.append(open, remove); item.append(title, service, date, actions); container.append(item);
    });
  } catch {
    container.innerHTML = '<p class="notice error-notice">Saved maps are unavailable because this browser blocked local storage. You can still inspect and download a manifest.</p>';
  }
}

function renderGuides(query = ''): void {
  const container = $('#guide-list'); container.replaceChildren();
  const normalized = query.trim().toLowerCase();
  const matching = guides.filter((guide) => `${guide.name} ${guide.summary}`.toLowerCase().includes(normalized));
  matching.forEach((guide) => {
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    const name = document.createElement('strong'); name.textContent = guide.name;
    const copy = document.createElement('span'); copy.textContent = guide.summary;
    summary.append(name, copy);
    const body = document.createElement('div'); body.className = 'guide-detail';
    const steps = document.createElement('ol'); guide.steps.forEach((step) => { const li = document.createElement('li'); li.textContent = step; steps.append(li); });
    const formats = document.createElement('div'); formats.className = 'guide-formats';
    const formatCopy = document.createElement('p'); formatCopy.textContent = guide.formats;
    const link = document.createElement('a'); link.href = guide.link; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = `${guide.linkLabel} ↗`;
    formats.append(formatCopy, link); body.append(steps, formats); details.append(summary, body); container.append(details);
  });
  $('#no-guides').hidden = matching.length !== 0;
}

async function importAssessment(file: File): Promise<void> {
  try {
    if (file.size > 25_000_000) throw new Error('That assessment is over 25 MB. Choose the JSON map file, not the original archive.');
    const candidate = JSON.parse(await file.text()) as Assessment;
    if (!candidate || candidate.manifest?.schema !== 'personal-data-exit-map/manifest-v1' || !Array.isArray(candidate.categories) || !Array.isArray(candidate.checklist) || typeof candidate.id !== 'string') throw new Error('This is not a Personal Data Exit Map assessment JSON file.');
    candidate.signatureValid = await verifyManifest(candidate.manifest);
    candidate.updatedAt = new Date().toISOString();
    await saveAssessment(candidate);
    renderAssessment(candidate);
    await renderSaved();
    showToast(candidate.signatureValid ? 'Assessment imported; signature verified.' : 'Assessment imported, but its manifest signature could not be verified.');
    results.scrollIntoView({ behavior: 'smooth' });
  } catch (error) { showToast(error instanceof Error ? error.message : 'The assessment could not be imported.'); }
  finally { assessmentImport.value = ''; }
}

function assessmentCsv(assessment: Assessment): string {
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const rows = [['Category', 'Portability', 'File path', 'Format', 'Uncompressed bytes', 'CRC-32']];
  const categoryByPath = new Map<string, Category>();
  assessment.categories.forEach((category) => category.paths.forEach((path) => categoryByPath.set(path, category)));
  assessment.manifest.entries.filter((entry) => !entry.directory).forEach((entry) => {
    const category = categoryByPath.get(entry.path) ?? categorize([entry])[0];
    rows.push([category?.name ?? 'Other archive files', category?.portability ?? 'review', entry.path, entry.extension.toUpperCase() || 'No extension', String(entry.size), entry.crc32 ?? '']);
  });
  return rows.map((row) => row.map(escape).join(',')).join('\r\n');
}

archiveInput.addEventListener('change', () => { const file = archiveInput.files?.[0]; if (file) void analyzeFile(file); });
assessmentImport.addEventListener('change', () => { const file = assessmentImport.files?.[0]; if (file) void importAssessment(file); });
['dragenter', 'dragover'].forEach((name) => dropZone.addEventListener(name, (event) => { event.preventDefault(); dropZone.classList.add('dragging'); }));
['dragleave', 'drop'].forEach((name) => dropZone.addEventListener(name, (event) => { event.preventDefault(); dropZone.classList.remove('dragging'); }));
dropZone.addEventListener('drop', (event) => { const file = (event as DragEvent).dataTransfer?.files[0]; if (file) void analyzeFile(file); });

$('#support-toggle').addEventListener('click', () => {
  const button = $<HTMLButtonElement>('#support-toggle');
  const expanded = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!expanded)); $('#support-detail').hidden = expanded;
});
$('#guide-search').addEventListener('input', (event) => renderGuides((event.target as HTMLInputElement).value));
$('#confirm-delete').addEventListener('click', async () => {
  if (!deleteId) return;
  await removeAssessment(deleteId);
  if (current?.id === deleteId) { current = null; results.hidden = true; }
  deleteId = null; await renderSaved(); showToast('Saved map removed from this browser.');
});
deleteDialog.addEventListener('close', () => { if (deleteDialog.returnValue !== 'confirm') deleteId = null; });

$('#download-manifest').addEventListener('click', async () => {
  if (!current) return;
  download(`${safeFilePart(current.fileName)}-signed-manifest.json`, JSON.stringify(current.manifest, null, 2), 'application/json');
  const check = current.checklist.find((item) => item.id === 'manifest'); if (check) check.done = true;
  current.updatedAt = new Date().toISOString(); await saveAssessment(current); renderChecklist(current); await renderSaved();
});
$('#export-json').addEventListener('click', () => { if (current) download(`${safeFilePart(current.fileName)}-exit-map.json`, JSON.stringify(current, null, 2), 'application/json'); });
$('#export-csv').addEventListener('click', () => { if (current) download(`${safeFilePart(current.fileName)}-inventory.csv`, assessmentCsv(current), 'text/csv;charset=utf-8'); });

function updateNetwork(): void {
  const node = $('#network-status'); const label = node.querySelector('span:last-child');
  node.classList.toggle('offline', !navigator.onLine);
  if (label) label.textContent = navigator.onLine ? 'Ready offline' : 'Offline — local tools ready';
}
window.addEventListener('online', updateNetwork); window.addEventListener('offline', updateNetwork); updateNetwork();

interface InstallEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
let installEvent: InstallEvent | null = null;
window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); installEvent = event as InstallEvent; $('#install-button').hidden = false; });
$('#install-button').addEventListener('click', async () => { if (!installEvent) return; await installEvent.prompt(); await installEvent.userChoice; installEvent = null; $('#install-button').hidden = true; });

if ('serviceWorker' in navigator) {
  let updateRequested = false;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        installing?.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            const toast = $('#toast'); text('#toast-message', 'A refreshed drawing is ready.');
            const action = $<HTMLButtonElement>('#toast-action'); action.hidden = false; toast.hidden = false;
            action.onclick = () => { updateRequested = true; registration.waiting?.postMessage({ type: 'SKIP_WAITING' }); };
          }
        });
      });
    }).catch(() => showToast('Offline installation is unavailable in this browser.'));
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (updateRequested) location.reload(); });
  });
}

renderGuides();
void renderSaved();
