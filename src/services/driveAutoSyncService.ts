import {
  getAccessToken,
  googleSignIn,
  clearStoredToken,
  auth,
} from './auth';
import {
  findTargetEquityFile,
  findHistoricalParquetFiles,
  downloadFileContent,
  downloadFileBinary,
  DriveFileItem,
} from './googleDrive';
import {
  getCachedDriveFile,
  setCachedDriveFile,
  getCacheSummary,
} from './driveCacheService';
import { loadMasterDataFromCsv } from './stockMasterStore';
import { parseParquetBuffer, ParquetParseResult } from './parquetLoader';

export type DriveAutoSyncStatus =
  | 'idle'
  | 'checking_auth'
  | 'syncing'
  | 'connected'
  | 'offline_cached'
  | 'auth_required'
  | 'error';

export interface DriveAutoSyncState {
  status: DriveAutoSyncStatus;
  isDriveConnected: boolean;
  usingCachedData: boolean;
  lastSyncTime: string | null;
  statusMessage: string;
  errorReason: string | null;
  filesProcessed: {
    masterLoaded: boolean;
    highLoaded: boolean;
    midLoaded: boolean;
    lowLoaded: boolean;
    cacheHitCount: number;
    downloadCount: number;
  };
}

let syncState: DriveAutoSyncState = {
  status: 'idle',
  isDriveConnected: false,
  usingCachedData: false,
  lastSyncTime: null,
  statusMessage: 'Ready',
  errorReason: null,
  filesProcessed: {
    masterLoaded: false,
    highLoaded: false,
    midLoaded: false,
    lowLoaded: false,
    cacheHitCount: 0,
    downloadCount: 0,
  },
};

type SyncListener = (state: DriveAutoSyncState) => void;
const listeners = new Set<SyncListener>();

function notifyListeners() {
  const current = { ...syncState };
  listeners.forEach((listener) => {
    try {
      listener(current);
    } catch (e) {
      console.error('Error in drive auto-sync listener:', e);
    }
  });
}

export function subscribeDriveAutoSync(listener: SyncListener): () => void {
  listeners.add(listener);
  listener({ ...syncState });
  return () => {
    listeners.delete(listener);
  };
}

export function getDriveAutoSyncState(): DriveAutoSyncState {
  return { ...syncState };
}

/**
 * Loads all available files directly from local IndexedDB cache into respective stores.
 * Used for offline startup, network failure, or instant display.
 */
export async function loadFromLocalCacheFallback(
  onParquetParsed?: (result: ParquetParseResult) => void
): Promise<boolean> {
  try {
    const [cachedMaster, cachedHigh, cachedMid, cachedLow] = await Promise.all([
      getCachedDriveFile('master_equity_csv'),
      getCachedDriveFile('hist_parquet_high'),
      getCachedDriveFile('hist_parquet_mid'),
      getCachedDriveFile('hist_parquet_low'),
    ]);

    let loadedAny = false;

    // 1. Master CSV -> stockMasterStore
    if (cachedMaster && cachedMaster.textContent) {
      loadMasterDataFromCsv(cachedMaster.textContent, cachedMaster.fileName);
      loadedAny = true;
      syncState.filesProcessed.masterLoaded = true;
    }

    // 2. Historical Parquets -> historicalDataStore
    const parquetsToIngest = [
      { rec: cachedHigh, key: 'highLoaded' as const },
      { rec: cachedMid, key: 'midLoaded' as const },
      { rec: cachedLow, key: 'lowLoaded' as const },
    ];

    for (const item of parquetsToIngest) {
      if (item.rec && item.rec.binaryBuffer) {
        const result = await parseParquetBuffer(item.rec.binaryBuffer, item.rec.fileName);
        if (onParquetParsed) onParquetParsed(result);
        loadedAny = true;
        syncState.filesProcessed[item.key] = true;
      }
    }

    if (loadedAny) {
      syncState.usingCachedData = true;
      syncState.status = 'offline_cached';
      syncState.statusMessage = 'Loaded from local persistent cache (Drive offline)';
      notifyListeners();
    }

    return loadedAny;
  } catch (err) {
    console.error('Error loading from local cache fallback:', err);
    return false;
  }
}

/**
 * Main Automatic Startup Sync Function:
 * 1. Silently restores existing authenticated Google session/token if available.
 * 2. If valid token exists → automatically syncs Drive (discovery, cache check, download, parse).
 * 3. If no token exists → loads local cache if present, sets status to auth_required, and waits.
 * 4. Checks local cache for exact matching (driveFileId + modifiedTime).
 * 5. Uses cache for unchanged files (0 network download), downloads only modified files.
 * 6. Strictly routes Master CSV -> stockMasterStore, Parquets -> historicalDataStore.
 */
export async function runDriveAutoSync(
  onParquetParsed?: (result: ParquetParseResult) => void,
  forceDownload = false
): Promise<boolean> {
  syncState.status = 'checking_auth';
  syncState.statusMessage = 'Checking Google Drive session...';
  syncState.errorReason = null;
  notifyListeners();

  // 1. Silently restore existing authenticated Google session/token if available
  let token = await getAccessToken();

  if (!token) {
    // If not authenticated, load any existing local cache first
    const hasCache = await loadFromLocalCacheFallback(onParquetParsed);
    if (!hasCache) {
      syncState.status = 'auth_required';
      syncState.statusMessage = 'Google Drive authorization required';
    }
    notifyListeners();
    return hasCache;
  }

  // 2. Authenticated: Scan Drive files
  syncState.status = 'syncing';
  syncState.statusMessage = 'Querying Google Drive files (AI_Studio/csv_files)...';
  syncState.isDriveConnected = true;
  notifyListeners();

  try {
    const [masterFile, parquetFiles] = await Promise.all([
      findTargetEquityFile(token),
      findHistoricalParquetFiles(token),
    ]);

    let cacheHits = 0;
    let downloads = 0;

    // -------------------------------------------------------------------------
    // DOMAIN 1: MASTER DATA (All equity details.csv -> stockMasterStore)
    // -------------------------------------------------------------------------
    if (masterFile) {
      syncState.statusMessage = `Checking Master CSV (${masterFile.name})...`;
      notifyListeners();

      const cachedMaster = await getCachedDriveFile('master_equity_csv');
      const isUnchanged =
        !forceDownload &&
        cachedMaster &&
        cachedMaster.driveFileId === masterFile.id &&
        cachedMaster.modifiedTime === (masterFile.modifiedTime || '') &&
        cachedMaster.textContent;

      let csvText = '';
      if (isUnchanged) {
        csvText = cachedMaster.textContent!;
        cacheHits++;
      } else {
        syncState.statusMessage = `Downloading updated Master CSV (${masterFile.name})...`;
        notifyListeners();
        csvText = await downloadFileContent(token, masterFile.id);
        downloads++;

        await setCachedDriveFile({
          fileKey: 'master_equity_csv',
          driveFileId: masterFile.id,
          fileName: masterFile.name,
          modifiedTime: masterFile.modifiedTime || new Date().toISOString(),
          size: masterFile.size || String(csvText.length),
          dataType: 'text',
          textContent: csvText,
          cachedAt: Date.now(),
        });
      }

      // Strictly route into stockMasterStore
      loadMasterDataFromCsv(csvText, masterFile.name);
      syncState.filesProcessed.masterLoaded = true;
    }

    // -------------------------------------------------------------------------
    // DOMAIN 2: HISTORICAL MARKET DATA (HIGH, MID, LOW -> historicalDataStore)
    // -------------------------------------------------------------------------
    const historicalTargets: {
      file?: DriveFileItem;
      key: 'hist_parquet_high' | 'hist_parquet_mid' | 'hist_parquet_low';
      flag: 'highLoaded' | 'midLoaded' | 'lowLoaded';
      label: string;
    }[] = [
      { file: parquetFiles.high, key: 'hist_parquet_high', flag: 'highLoaded', label: 'HIGH Cap' },
      { file: parquetFiles.mid, key: 'hist_parquet_mid', flag: 'midLoaded', label: 'MID Cap' },
      { file: parquetFiles.low, key: 'hist_parquet_low', flag: 'lowLoaded', label: 'LOW Cap' },
    ];

    for (const target of historicalTargets) {
      if (!target.file) continue;

      syncState.statusMessage = `Checking ${target.label} Parquet (${target.file.name})...`;
      notifyListeners();

      const cachedParquet = await getCachedDriveFile(target.key);
      const isUnchanged =
        !forceDownload &&
        cachedParquet &&
        cachedParquet.driveFileId === target.file.id &&
        cachedParquet.modifiedTime === (target.file.modifiedTime || '') &&
        cachedParquet.binaryBuffer;

      let buffer: ArrayBuffer;
      if (isUnchanged) {
        buffer = cachedParquet.binaryBuffer!;
        cacheHits++;
      } else {
        syncState.statusMessage = `Downloading ${target.label} Parquet from Drive (${target.file.name})...`;
        notifyListeners();
        buffer = await downloadFileBinary(token, target.file.id);
        downloads++;

        await setCachedDriveFile({
          fileKey: target.key,
          driveFileId: target.file.id,
          fileName: target.file.name,
          modifiedTime: target.file.modifiedTime || new Date().toISOString(),
          size: target.file.size || String(buffer.byteLength),
          dataType: 'binary',
          binaryBuffer: buffer,
          cachedAt: Date.now(),
        });
      }

      // Ingest into historicalDataStore
      const result = await parseParquetBuffer(buffer, target.file.name);
      if (onParquetParsed) onParquetParsed(result);
      syncState.filesProcessed[target.flag] = true;
    }

    // 3. Complete State
    syncState.status = 'connected';
    syncState.usingCachedData = cacheHits > 0 && downloads === 0;
    syncState.lastSyncTime = new Date().toLocaleTimeString();
    syncState.filesProcessed.cacheHitCount = cacheHits;
    syncState.filesProcessed.downloadCount = downloads;
    syncState.statusMessage = `Google Drive connected (${cacheHits} cached, ${downloads} downloaded)`;
    notifyListeners();

    return true;
  } catch (err: any) {
    console.error('Error during automatic Drive sync:', err);
    syncState.isDriveConnected = false;
    syncState.errorReason = err?.message || String(err);

    const isAuthErr =
      String(err?.message || err).includes('401') ||
      String(err?.message || err).toLowerCase().includes('unauthorized');
    if (isAuthErr) {
      clearStoredToken();
      syncState.status = 'auth_required';
      syncState.statusMessage = 'Google Drive session expired, re-authorization required';
    }

    // If online sync fails, fallback to local cache
    const fallbackSuccess = await loadFromLocalCacheFallback(onParquetParsed);
    if (!fallbackSuccess && !isAuthErr) {
      syncState.status = 'error';
      syncState.statusMessage = `Drive sync failed: ${err?.message || 'Unknown error'}`;
    }
    notifyListeners();
    return fallbackSuccess;
  }
}

/**
 * Interactive Sign-in & Immediate Auto-Sync (for First Run or Re-authentication)
 * Performs OAuth popup on user click and immediately triggers the sync flow with ZERO extra clicks!
 */
export async function triggerGoogleSignInAndSync(
  onParquetParsed?: (result: ParquetParseResult) => void
): Promise<boolean> {
  try {
    syncState.status = 'checking_auth';
    syncState.statusMessage = 'Connecting to Google Drive...';
    notifyListeners();

    const result = await googleSignIn();
    if (!result?.accessToken) {
      throw new Error('Google authentication was cancelled or failed.');
    }

    // Automatically run existing Drive sync pipeline immediately
    return await runDriveAutoSync(onParquetParsed);
  } catch (err: any) {
    console.error('Google sign-in and sync failed:', err);
    syncState.status = 'error';
    syncState.errorReason = err?.message || String(err);
    syncState.statusMessage = `Authentication failed: ${err?.message || 'Cancelled'}`;
    notifyListeners();
    return false;
  }
}
