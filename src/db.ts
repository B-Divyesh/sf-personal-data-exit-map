import type { Assessment } from './types';

const DB_NAME = 'personal-data-exit-map';
const DB_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('assessments')) db.createObjectStore('assessments', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Local storage could not be opened.'));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Local storage operation failed.'));
  });
}

export async function saveAssessment(assessment: Assessment): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction('assessments', 'readwrite');
  transaction.objectStore('assessments').put(assessment);
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('The assessment could not be saved locally.'));
  });
  db.close();
}

export async function listAssessments(): Promise<Assessment[]> {
  const db = await openDatabase();
  const results = await requestResult(db.transaction('assessments').objectStore('assessments').getAll()) as Assessment[];
  db.close();
  return results.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function removeAssessment(id: string): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction('assessments', 'readwrite');
  transaction.objectStore('assessments').delete(id);
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('The assessment could not be removed.'));
  });
  db.close();
}

export async function getSetting<T>(key: string): Promise<T | undefined> {
  const db = await openDatabase();
  const result = await requestResult(db.transaction('settings').objectStore('settings').get(key)) as T | undefined;
  db.close();
  return result;
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction('settings', 'readwrite');
  transaction.objectStore('settings').put(value, key);
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('A local setting could not be saved.'));
  });
  db.close();
}
