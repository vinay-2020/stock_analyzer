/**
 * Persistent Local Caching for Google Drive Files using browser IndexedDB.
 * Allows zero-network instant startup when Google Drive files are unchanged.
 */

export interface CachedFileRecord {
  fileKey: string;           // e.g. 'master_equity_csv', 'hist_high', 'hist_mid', 'hist_low'
  driveFileId: string;       // Google Drive file ID
  fileName: string;          // Filename on Drive
  modifiedTime: string;      // ISO string from Drive metadata
  size: string;              // File size from Drive
  dataType: 'text' | 'binary';
  textContent?: string;
  binaryBuffer?: ArrayBuffer;
  cachedAt: number;          // Timestamp
}

const DB_NAME = 'stocks_analyzer_drive_cache';
const DB_VERSION = 1;
const STORE_NAME = 'drive_files';

let dbInstance: IDBDatabase | null = null;

async function getDb(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'fileKey' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open cache database'));
    };
  });
}

/**
 * Retrieves a cached file record by key
 */
export async function getCachedDriveFile(fileKey: string): Promise<CachedFileRecord | null> {
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(fileKey);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    console.warn(`[DriveCache] Error reading cache for ${fileKey}:`, err);
    return null;
  }
}

/**
 * Saves or updates a cached file record in IndexedDB
 */
export async function setCachedDriveFile(record: CachedFileRecord): Promise<void> {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn(`[DriveCache] Error saving cache for ${record.fileKey}:`, err);
  }
}

/**
 * Checks if all 3 historical parquet files and master CSV exist in local cache
 */
export async function getCacheSummary(): Promise<{
  hasMasterCsv: boolean;
  hasHighParquet: boolean;
  hasMidParquet: boolean;
  hasLowParquet: boolean;
  totalCachedFiles: number;
}> {
  try {
    const [master, high, mid, low] = await Promise.all([
      getCachedDriveFile('master_equity_csv'),
      getCachedDriveFile('hist_parquet_high'),
      getCachedDriveFile('hist_parquet_mid'),
      getCachedDriveFile('hist_parquet_low'),
    ]);

    let count = 0;
    if (master) count++;
    if (high) count++;
    if (mid) count++;
    if (low) count++;

    return {
      hasMasterCsv: !!master,
      hasHighParquet: !!high,
      hasMidParquet: !!mid,
      hasLowParquet: !!low,
      totalCachedFiles: count,
    };
  } catch (err) {
    return {
      hasMasterCsv: false,
      hasHighParquet: false,
      hasMidParquet: false,
      hasLowParquet: false,
      totalCachedFiles: 0,
    };
  }
}

/**
 * Clears cached files
 */
export async function clearDriveCache(): Promise<void> {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[DriveCache] Error clearing cache:', err);
  }
}
