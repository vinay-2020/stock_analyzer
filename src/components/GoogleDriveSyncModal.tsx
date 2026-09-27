import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileCheck,
  FolderSync,
  X,
  ExternalLink,
  Search,
  Database,
  ArrowRight,
  LogOut,
} from 'lucide-react';
import {
  googleSignIn,
  getAccessToken,
  logout,
  auth,
} from '../services/auth';
import {
  findHistoricalParquetFiles,
  downloadFileBinary,
  DriveFileItem,
  searchDriveFiles,
} from '../services/googleDrive';
import { parseParquetBuffer, ParquetParseResult } from '../services/parquetLoader';

interface GoogleDriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onParquetParsed: (result: ParquetParseResult) => void;
  onDriveStatusChange?: (
    status: 'Ready' | 'Loading' | 'Complete' | 'Error',
    message?: string,
    errorDetails?: { loaded: number; failed: number; failedFiles: string[] }
  ) => void;
}

export const GoogleDriveSyncModal: React.FC<GoogleDriveSyncModalProps> = ({
  isOpen,
  onClose,
  onParquetParsed,
  onDriveStatusChange,
}) => {
  const [user, setUser] = useState(auth.currentUser);
  const [token, setToken] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Detected files in Drive (Strictly Historical Market Data)
  const [highFile, setHighFile] = useState<DriveFileItem | null>(null);
  const [midFile, setMidFile] = useState<DriveFileItem | null>(null);
  const [lowFile, setLowFile] = useState<DriveFileItem | null>(null);
  const [allParquetFiles, setAllParquetFiles] = useState<DriveFileItem[]>([]);

  // Ingestion status per file
  const [ingestingStatus, setIngestingStatus] = useState<{
    high?: 'idle' | 'downloading' | 'parsing' | 'done' | 'error';
    mid?: 'idle' | 'downloading' | 'parsing' | 'done' | 'error';
    low?: 'idle' | 'downloading' | 'parsing' | 'done' | 'error';
  }>({});

  // Sync token and user on open
  useEffect(() => {
    if (isOpen) {
      setUser(auth.currentUser);
      getAccessToken().then((t) => {
        setToken(t);
        if (t) {
          scanDrive(t);
        }
      });
    }
  }, [isOpen]);

  const handleSignIn = async () => {
    setErrorMsg(null);
    try {
      setSyncStatus('Connecting to Google Drive...');
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        setSyncStatus('Successfully authenticated. Scanning Drive for datasets...');
        await scanDrive(res.accessToken);
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setErrorMsg(err.message || 'Failed to authenticate with Google Drive.');
      setSyncStatus(null);
    }
  };

  const scanDrive = async (accessToken: string) => {
    setIsScanning(true);
    setErrorMsg(null);
    setSyncStatus('Scanning your Google Drive for historical files...');

    try {
      const parquetRes = await findHistoricalParquetFiles(accessToken);

      setHighFile(parquetRes.high || null);
      setMidFile(parquetRes.mid || null);
      setLowFile(parquetRes.low || null);
      setAllParquetFiles(parquetRes.allFound);

      const foundCount = [parquetRes.high, parquetRes.mid, parquetRes.low].filter(Boolean).length;
      if (foundCount > 0) {
        setSyncStatus(`Found ${foundCount} of 3 historical Parquet datasets in Drive.`);
      } else {
        setSyncStatus('Scan complete. No exact Parquet matches found automatically.');
      }
    } catch (err: any) {
      console.error('Drive scan error:', err);
      setErrorMsg('Failed to search Google Drive: ' + (err.message || String(err)));
      setSyncStatus(null);
    } finally {
      setIsScanning(false);
    }
  };

  const handleIngestSingleParquet = async (
    file: DriveFileItem,
    key: 'high' | 'mid' | 'low'
  ) => {
    if (!token) return;
    setIngestingStatus((prev) => ({ ...prev, [key]: 'downloading' }));
    setErrorMsg(null);
    onDriveStatusChange?.('Loading', `Downloading ${file.name} from Google Drive...`);

    try {
      setSyncStatus(`Downloading ${file.name} from Google Drive...`);
      const buffer = await downloadFileBinary(token, file.id);

      setIngestingStatus((prev) => ({ ...prev, [key]: 'parsing' }));
      setSyncStatus(`Parsing ${file.name} OHLCV bars...`);
      onDriveStatusChange?.('Loading', `Parsing ${file.name} OHLCV bars...`);

      const result = await parseParquetBuffer(buffer, file.name);
      onParquetParsed(result);

      setIngestingStatus((prev) => ({ ...prev, [key]: 'done' }));
      setSyncStatus(`Successfully ingested ${file.name} (${result.stocksIdentified.length} stocks, ${result.rowCount.toLocaleString()} bars).`);
      onDriveStatusChange?.('Complete', `Loaded ${file.name} from Google Drive.`);
    } catch (err: any) {
      console.error(`Error ingesting ${file.name}:`, err);
      setIngestingStatus((prev) => ({ ...prev, [key]: 'error' }));
      setErrorMsg(`Failed to ingest ${file.name}: ${err.message || String(err)}`);
      onDriveStatusChange?.('Error', undefined, { loaded: 0, failed: 1, failedFiles: [file.name] });
    }
  };

  const handleIngestAllHistorical = async () => {
    if (!token) return;
    setErrorMsg(null);

    const queue: { file: DriveFileItem; key: 'high' | 'mid' | 'low' }[] = [];
    if (highFile && ingestingStatus.high !== 'done') queue.push({ file: highFile, key: 'high' });
    if (midFile && ingestingStatus.mid !== 'done') queue.push({ file: midFile, key: 'mid' });
    if (lowFile && ingestingStatus.low !== 'done') queue.push({ file: lowFile, key: 'low' });

    if (queue.length === 0) {
      setSyncStatus('All detected files have already been ingested.');
      return;
    }

    onDriveStatusChange?.('Loading', `Ingesting ${queue.length} historical files from Google Drive...`);
    let loadedCount = 0;
    let failedCount = 0;
    const failedFiles: string[] = [];

    for (let i = 0; i < queue.length; i++) {
      const { file, key } = queue[i];
      try {
        await handleIngestSingleParquet(file, key);
        loadedCount++;
      } catch (err) {
        failedCount++;
        failedFiles.push(file.name);
      }
    }

    if (failedCount > 0) {
      onDriveStatusChange?.('Error', undefined, { loaded: loadedCount, failed: failedCount, failedFiles });
    } else {
      onDriveStatusChange?.('Complete', `Loaded ${loadedCount} file(s) from Google Drive.`);
    }

    setSyncStatus('Historical data ingestion complete! All CAGR and event touch tables are now active.');
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setHighFile(null);
    setMidFile(null);
    setLowFile(null);
    setSyncStatus(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Google Drive Historical Data Sync
              </h2>
              <p className="text-xs text-slate-400">
                Directly stream 15-year OHLCV Parquet files from your Drive storage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {/* Authentication State Card */}
          {!user ? (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Connect Your Google Drive</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Sign in with the Google account that contains your <code className="text-blue-300 font-mono">/csv_files/Stock_Hist_parquet/</code> folder to stream the 15-year historical files directly.
                </p>
              </div>
              <button
                onClick={handleSignIn}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg transition cursor-pointer"
              >
                <Cloud className="w-4 h-4" />
                Sign in with Google Drive
              </button>
            </div>
          ) : (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-9 h-9 rounded-full border border-slate-700"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-white text-xs">{user.displayName || user.email}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => token && scanDrive(token)}
                  disabled={isScanning}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FolderSync className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-blue-400' : ''}`} />
                  {isScanning ? 'Scanning...' : 'Rescan Drive'}
                </button>
                <button
                  onClick={handleSignOut}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition"
                  title="Sign out of Google Drive"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Feedback messages */}
          {syncStatus && (
            <div className="p-3 bg-blue-950/40 border border-blue-900/50 rounded-xl text-xs text-blue-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span>{syncStatus}</span>
            </div>
          )}
          {errorMsg && (
            <div className="p-3 bg-rose-950/40 border border-rose-900/50 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Detected Files Grid */}
          {user && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Target Historical Datasets
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">
                  Location: /csv_files/Stock_Hist_parquet/
                </span>
              </div>

              <div className="space-y-2.5">
                {/* 1. HIGH CAP FILE */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400 font-bold text-xs">
                      01
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white font-mono">
                        01_STOCKS_MARKETCAP_HIGH.parquet
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {highFile ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Found in Drive ({highFile.name})
                          </span>
                        ) : (
                          <span className="text-slate-500">Not detected yet</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {highFile && (
                    <button
                      onClick={() => handleIngestSingleParquet(highFile, 'high')}
                      disabled={ingestingStatus.high === 'downloading' || ingestingStatus.high === 'parsing'}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                        ingestingStatus.high === 'done'
                          ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}
                    >
                      {ingestingStatus.high === 'downloading' || ingestingStatus.high === 'parsing' ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {ingestingStatus.high === 'downloading' ? 'Downloading...' : 'Parsing...'}
                        </>
                      ) : ingestingStatus.high === 'done' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Ingested
                        </>
                      ) : (
                        'Ingest'
                      )}
                    </button>
                  )}
                </div>

                {/* 2. MID CAP FILE */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-800/60 flex items-center justify-center text-blue-400 font-bold text-xs">
                      02
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white font-mono">
                        02_STOCKS_MARKETCAP_MID.parquet
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {midFile ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Found in Drive ({midFile.name})
                          </span>
                        ) : (
                          <span className="text-slate-500">Not detected yet</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {midFile && (
                    <button
                      onClick={() => handleIngestSingleParquet(midFile, 'mid')}
                      disabled={ingestingStatus.mid === 'downloading' || ingestingStatus.mid === 'parsing'}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                        ingestingStatus.mid === 'done'
                          ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}
                    >
                      {ingestingStatus.mid === 'downloading' || ingestingStatus.mid === 'parsing' ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {ingestingStatus.mid === 'downloading' ? 'Downloading...' : 'Parsing...'}
                        </>
                      ) : ingestingStatus.mid === 'done' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Ingested
                        </>
                      ) : (
                        'Ingest'
                      )}
                    </button>
                  )}
                </div>

                {/* 3. LOW CAP FILE */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-950/60 border border-purple-800/60 flex items-center justify-center text-purple-400 font-bold text-xs">
                      03
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white font-mono">
                        03_STOCKS_MARKETCAP_LOW.parquet
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {lowFile ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Found in Drive ({lowFile.name})
                          </span>
                        ) : (
                          <span className="text-slate-500">Not detected yet</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {lowFile && (
                    <button
                      onClick={() => handleIngestSingleParquet(lowFile, 'low')}
                      disabled={ingestingStatus.low === 'downloading' || ingestingStatus.low === 'parsing'}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                        ingestingStatus.low === 'done'
                          ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}
                    >
                      {ingestingStatus.low === 'downloading' || ingestingStatus.low === 'parsing' ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {ingestingStatus.low === 'downloading' ? 'Downloading...' : 'Parsing...'}
                        </>
                      ) : ingestingStatus.low === 'done' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Ingested
                        </>
                      ) : (
                        'Ingest'
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Master Ingest All Button */}
              {(highFile || midFile || lowFile) && (
                <div className="pt-2">
                  <button
                    onClick={handleIngestAllHistorical}
                    disabled={
                      ingestingStatus.high === 'downloading' ||
                      ingestingStatus.mid === 'downloading' ||
                      ingestingStatus.low === 'downloading' ||
                      ingestingStatus.high === 'parsing' ||
                      ingestingStatus.mid === 'parsing' ||
                      ingestingStatus.low === 'parsing'
                    }
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                  >
                    <Database className="w-4 h-4" />
                    Ingest All Available Historical Files into Engine
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Files stay in browser memory. Zero external server uploads.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
