/**
 * IndexedDB storage for accident-case binary media (photos, video, audio,
 * scanned documents). Large blobs must NOT go into the localStorage JSON
 * blob used elsewhere in this app (see AccidentCase in types/index.ts,
 * which only holds lightweight AccidentMediaRef pointers) — localStorage
 * has a small synchronous-write quota that photos/video would blow through
 * almost immediately.
 *
 * This is a minimal hand-rolled wrapper — no dependency — kept separate
 * from `family_vehicles_v1` / `family_checklists_v1` / `family_accidents_v1`
 * so nothing here can ever corrupt or interact with existing localStorage data.
 */

const DB_NAME = 'family_accident_media_v1';
const DB_VERSION = 1;
const STORE = 'media';

export interface StoredMedia {
  id: string;
  caseId: string;
  kind: 'photo' | 'video' | 'audio' | 'document';
  mimeType: string;
  fileName: string;
  blob: Blob;
  createdAt: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexeddb-unsupported'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('caseId', 'caseId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export async function putMedia(record: StoredMedia): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getMedia(id: string): Promise<StoredMedia | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result as StoredMedia | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function getMediaBlob(id: string): Promise<Blob | undefined> {
  const rec = await getMedia(id);
  return rec?.blob;
}

export async function deleteMedia(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Cascade-delete every blob belonging to one accident case (used when the case itself is deleted). */
export async function deleteMediaForCase(caseId: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const index = tx.objectStore(STORE).index('caseId');
    const req = index.openCursor(IDBKeyRange.only(caseId));
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllMediaForCase(caseId: string): Promise<StoredMedia[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const index = tx.objectStore(STORE).index('caseId');
    const req = index.getAll(IDBKeyRange.only(caseId));
    req.onsuccess = () => resolve(req.result as StoredMedia[]);
    req.onerror = () => reject(req.error);
  });
}
