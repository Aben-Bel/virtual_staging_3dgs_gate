import type { CapturedView } from '../../types';

/**
 * Per-splat persistence of captured views (with their staged results) across
 * runs. Keyed by a content hash of the splat file. Uses IndexedDB rather than
 * localStorage because captures/staged images are multi-MB data URLs that would
 * exceed localStorage's ~5MB cap.
 */

const DB_NAME = 'vvs';
const STORE = 'views';
const VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** SHA-256 of the file's bytes → hex string used as the storage key. */
export async function hashFile(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function loadViews(hash: string): Promise<CapturedView[] | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(hash);
      req.onsuccess = () => resolve((req.result as CapturedView[]) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function saveViews(hash: string, views: CapturedView[]): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(views, hash);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* best-effort: ignore quota/availability errors */
  }
}
