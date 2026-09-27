import React, { useRef, useState, useEffect } from 'react';
import {
  Database,
  Upload,
  FileCheck,
  AlertCircle,
  HardDrive,
  Info,
  CheckCircle2,
  Filter,
  Cloud,
  FolderUp,
  Loader2,
  FileSpreadsheet,
  TrendingUp,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { MarketCapTier, FileMetadataState } from '../types/equity';
import { parseParquetBuffer, ParquetParseResult } from '../services/parquetLoader';
import { GoogleDriveSyncModal } from './GoogleDriveSyncModal';
import {
  subscribeHistoricalDataStore,
  getTotalHistoricalBarsCount,
  getAllLoadedSymbols,
  getLoadedFilesCount,
} from '../services/historicalDataStore';
import {
  subscribeStockMasterStore,
  getMasterRecordCount,
  getMasterUniqueSymbolsCount,
  getMasterMetadata,
  loadMasterDataFromCsv,
} from '../services/stockMasterStore';
import {
  subscribeDriveAutoSync,
  getDriveAutoSyncState,
  runDriveAutoSync,
  triggerGoogleSignInAndSync,
  DriveAutoSyncState,
} from '../services/driveAutoSyncService';

export type HistoricalDataSourceOption = 'GOOGLE_DRIVE' | 'OFFLINE_UPLOAD';
export type IngestionStatus = 'Ready' | 'Loading' | 'Complete' | 'Error';

interface Props {
  totalStocks: number;
  highCapCount: number;
  midCapCount: number;
  lowCapCount: number;
  fileMetadata: FileMetadataState;
  onParquetParsed: (result: ParquetParseResult) => void;
  onMasterCsvLoaded: (file: File) => void;
  selectedCapTier: MarketCapTier | 'ALL';
  onSelectCapTier: (tier: MarketCapTier | 'ALL') => void;
}

export const HistoricalDataSourceBar: React.FC<Props> = ({
  totalStocks,
  highCapCount,
  midCapCount,
  lowCapCount,
  fileMetadata,
  onParquetParsed,
  onMasterCsvLoaded,
  selectedCapTier,
  onSelectCapTier,
}) => {
  // Input references for the two distinct data domains
  const masterFileInputRef = useRef<HTMLInputElement>(null);
  const historicalFileInputRef = useRef<HTMLInputElement>(null);

  // DOMAIN 1: Stock Master Data State
  const [masterRecordCount, setMasterRecordCount] = useState<number>(() => getMasterRecordCount());
  const [masterUniqueSymbols, setMasterUniqueSymbols] = useState<number>(() => getMasterUniqueSymbolsCount());
  const [masterStatus, setMasterStatus] = useState<'Loaded' | 'Empty' | 'Loading' | 'Error'>(() => getMasterMetadata().status);
  const [masterMessage, setMasterMessage] = useState<string | null>(null);

  // DOMAIN 2: Default to Google Drive as requested
  const [selectedHistoricalSource, setSelectedHistoricalSource] = useState<HistoricalDataSourceOption>('GOOGLE_DRIVE');
  const [historicalStatus, setHistoricalStatus] = useState<IngestionStatus>('Ready');
  const [historicalStatusMessage, setHistoricalStatusMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<{
    loaded: number;
    failed: number;
    failedFiles: string[];
    lastError?: string;
  } | null>(null);

  // Live Reactive Historical Store Stats
  const [storeBarsCount, setStoreBarsCount] = useState<number>(() => getTotalHistoricalBarsCount());
  const [storeUniqueStocks, setStoreUniqueStocks] = useState<number>(() => getAllLoadedSymbols().length);
  const [storeFilesLoaded, setStoreFilesLoaded] = useState<number>(() => getLoadedFilesCount());

  // Automatic Google Drive Sync State
  const [driveSyncState, setDriveSyncState] = useState<DriveAutoSyncState>(() => getDriveAutoSyncState());

  // Drive Sync Modal State
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);

  // Subscribe to real-time updates from ALL independent stores & background sync
  useEffect(() => {
    // 1. Historical Data Store Subscription
    const updateHistoricalStats = () => {
      setStoreBarsCount(getTotalHistoricalBarsCount());
      setStoreUniqueStocks(getAllLoadedSymbols().length);
      setStoreFilesLoaded(getLoadedFilesCount());
    };
    updateHistoricalStats();
    const unsubHist = subscribeHistoricalDataStore(updateHistoricalStats);

    // 2. Stock Master Store Subscription
    const updateMasterStats = () => {
      setMasterRecordCount(getMasterRecordCount());
      setMasterUniqueSymbols(getMasterUniqueSymbolsCount());
      setMasterStatus(getMasterMetadata().status);
    };
    updateMasterStats();
    const unsubMaster = subscribeStockMasterStore(updateMasterStats);

    // 3. Drive Auto-Sync State Subscription
    const unsubDrive = subscribeDriveAutoSync((state) => {
      setDriveSyncState(state);
      if (state.status === 'syncing' || state.status === 'checking_auth') {
        setHistoricalStatus('Loading');
        setHistoricalStatusMessage(state.statusMessage);
      } else if (state.status === 'connected') {
        setHistoricalStatus('Complete');
        setHistoricalStatusMessage(state.statusMessage);
      } else if (state.status === 'offline_cached') {
        setHistoricalStatus('Ready');
        setHistoricalStatusMessage(state.statusMessage);
      } else if (state.status === 'error') {
        setHistoricalStatus('Error');
        setHistoricalStatusMessage(state.statusMessage);
      }
    });

    return () => {
      unsubHist();
      unsubMaster();
      unsubDrive();
    };
  }, []);

  // =========================================================================
  // DOMAIN 1 HANDLER: STOCK MASTER / CLASSIFICATION DATA
  // Accepted File: All_equity_details.csv
  // =========================================================================
  const handleMasterFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMasterStatus('Loading');
    setMasterMessage(`Reading Stock Master file: ${file.name}...`);

    try {
      const text = await file.text();
      const res = loadMasterDataFromCsv(text, file.name);

      if (res.success) {
        setMasterStatus('Loaded');
        setMasterMessage(`Stock Master loaded: ${res.recordCount.toLocaleString('en-IN')} records (${res.uniqueSymbols} symbols).`);
        onMasterCsvLoaded(file);
      } else {
        setMasterStatus('Error');
        setMasterMessage(res.error || 'Failed to parse Stock Master file.');
      }
    } catch (err: any) {
      console.error('Master CSV upload error:', err);
      setMasterStatus('Error');
      setMasterMessage(`Failed to read ${file.name}: ${err?.message || 'Unknown error'}`);
    } finally {
      if (masterFileInputRef.current) {
        masterFileInputRef.current.value = '';
      }
    }
  };

  // =========================================================================
  // DOMAIN 2 HANDLER: HISTORICAL MARKET DATA (OFFLINE PARQUET FALLBACK)
  // Accepted Files: 01_HIGH, 02_MID, 03_LOW Parquet files
  // =========================================================================
  const handleOfflineHistoricalFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setHistoricalStatus('Loading');
    setErrorDetails(null);
    setHistoricalStatusMessage(`Preparing to process ${files.length} historical file(s)...`);

    let loaded = 0;
    let failed = 0;
    const failedFiles: string[] = [];
    let totalIngestedBarsInBatch = 0;
    const fileCount = files.length;

    try {
      for (let i = 0; i < fileCount; i++) {
        const file = files[i];
        const isParquet = file.name.toLowerCase().endsWith('.parquet');

        setHistoricalStatusMessage(`Processing file (${i + 1}/${fileCount}): ${file.name}...`);

        if (isParquet) {
          try {
            const buffer = await file.arrayBuffer();
            const result = await parseParquetBuffer(buffer, file.name);

            if (result.error) {
              failed++;
              failedFiles.push(file.name);
              console.error(`Error parsing historical Parquet ${file.name}:`, result.error);
            } else {
              onParquetParsed(result);
              loaded++;
              totalIngestedBarsInBatch += result.rowCount;
            }
          } catch (fileErr: any) {
            failed++;
            failedFiles.push(file.name);
            console.error(`Failed reading historical Parquet ${file.name}:`, fileErr);
          }
        } else {
          failed++;
          failedFiles.push(file.name);
          console.warn(`Skipping non-parquet file in historical market data section: ${file.name}`);
        }
      }

      if (failed > 0) {
        setHistoricalStatus('Error');
        setErrorDetails({
          loaded,
          failed,
          failedFiles,
        });
        setHistoricalStatusMessage(
          `Loaded: ${loaded} | Failed: ${failed} | Failed file${failed > 1 ? 's' : ''}: ${failedFiles.join(', ')}`
        );
      } else {
        setHistoricalStatus('Complete');
        setHistoricalStatusMessage(
          `Successfully loaded ${loaded} file(s) with ${totalIngestedBarsInBatch.toLocaleString('en-IN')} historical bars.`
        );
      }
    } catch (globalErr: any) {
      console.error('Global historical ingestion error:', globalErr);
      setHistoricalStatus('Error');
      setErrorDetails({
        loaded,
        failed: fileCount - loaded,
        failedFiles: failedFiles.length > 0 ? failedFiles : ['Unknown'],
        lastError: globalErr?.message || String(globalErr),
      });
      setHistoricalStatusMessage(`Ingestion failed: ${globalErr?.message || 'Unknown error'}`);
    } finally {
      if (historicalFileInputRef.current) {
        historicalFileInputRef.current.value = '';
      }
    }
  };

  // Google Drive Manual / Modal Status Callback
  const handleDriveStatusChange = (
    newStatus: IngestionStatus,
    msg?: string,
    errDetails?: { loaded: number; failed: number; failedFiles: string[] }
  ) => {
    setSelectedHistoricalSource('GOOGLE_DRIVE');
    setHistoricalStatus(newStatus);
    if (msg) setHistoricalStatusMessage(msg);
    if (errDetails && errDetails.failed > 0) {
      setErrorDetails({
        loaded: errDetails.loaded,
        failed: errDetails.failed,
        failedFiles: errDetails.failedFiles,
      });
    } else if (newStatus === 'Complete') {
      setErrorDetails(null);
    }
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-100">
      {/* Principle & Disclaimer Header Strip */}
      <div className="bg-indigo-950/60 border-b border-indigo-900/40 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-indigo-300 font-medium">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>CORE PRINCIPLE:</span>
          <span className="text-white font-semibold">CODE CALCULATES. AI INTERPRETS.</span>
          <span className="text-slate-400 hidden sm:inline">— Deterministic Historical Research Engine (NSE/BSE)</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span className="flex items-center gap-1 text-amber-300">
            <Info className="w-3.5 h-3.5" />
            Strictly Historical • Zero Speculative Guesswork • No Buy/Sell Advice
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300 font-mono">Currency: INR (₹)</span>
        </div>
      </div>

      {/* Universe Size & Cap Tier Segmentation Strip */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/60">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Research Universe
              </div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>{totalStocks.toLocaleString('en-IN')} Indian Stocks</span>
                <span className="text-[10px] font-normal text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                  NSE/BSE Listed
                </span>
              </div>
            </div>
          </div>

          {/* Tier Pills */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-xs">
            <button
              onClick={() => onSelectCapTier('ALL')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                selectedCapTier === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Tiers ({totalStocks})
            </button>
            <button
              onClick={() => onSelectCapTier('HIGH')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                selectedCapTier === 'HIGH'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Large Cap (Top ~100 by Market Cap)"
            >
              High-Cap ({highCapCount})
            </button>
            <button
              onClick={() => onSelectCapTier('MID')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                selectedCapTier === 'MID'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Mid Cap (~350 stocks)"
            >
              Mid-Cap ({midCapCount})
            </button>
            <button
              onClick={() => onSelectCapTier('LOW')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                selectedCapTier === 'LOW'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Small/Micro Cap (~670 stocks)"
            >
              Low-Cap ({lowCapCount})
            </button>
          </div>
        </div>

        {/* Small Google Drive Status Indicator */}
        <div className="flex items-center gap-3 text-xs bg-slate-950/60 px-3 py-1 rounded-lg border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400">Google Drive:</div>
          {driveSyncState.status === 'connected' && (
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>● Connected</span>
              {driveSyncState.lastSyncTime && (
                <span className="text-slate-400 text-[10px] font-mono">
                  (Last sync: {driveSyncState.lastSyncTime})
                </span>
              )}
            </div>
          )}
          {driveSyncState.status === 'offline_cached' && (
            <div className="flex items-center gap-1.5 text-cyan-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>● Offline / using cached data</span>
            </div>
          )}
          {driveSyncState.status === 'syncing' && (
            <div className="flex items-center gap-1.5 text-amber-300 font-medium">
              <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
              <span>● Syncing...</span>
            </div>
          )}
          {driveSyncState.status === 'auth_required' && (
            <div className="flex items-center gap-1.5 text-amber-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>● Sync required</span>
            </div>
          )}
          {driveSyncState.status === 'error' && (
            <div className="flex items-center gap-1.5 text-rose-400 font-medium">
              <AlertCircle className="w-3 h-3 text-rose-400" />
              <span>● Sync failed</span>
            </div>
          )}
          {driveSyncState.status === 'idle' && (
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span>● Ready</span>
            </div>
          )}
        </div>
      </div>

      {/* TWO CLEARLY SEPARATED DATA-SOURCE SECTIONS */}
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ================================================================= */}
        {/* SECTION 1: STOCK MASTER DATA                                      */}
        {/* ================================================================= */}
        <div className="lg:col-span-4 bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-xs font-bold text-white tracking-wide">
                  SECTION 1: STOCK MASTER DATA
                </div>
                <div className="text-[10px] text-slate-400">
                  Stock identity & classification (Symbol, Company, Sector, Industry, Indices)
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
            {/* Master File Input */}
            <input
              type="file"
              ref={masterFileInputRef}
              onChange={handleMasterFileChange}
              accept=".csv"
              className="hidden"
            />

            <button
              onClick={() => masterFileInputRef.current?.click()}
              disabled={masterStatus === 'Loading'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-xs font-semibold text-emerald-300 transition-colors cursor-pointer shadow-sm hover:border-emerald-400"
              title="Upload All_equity_details.csv for stock master classification"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Upload All_equity_details.csv</span>
            </button>

            {/* Display: Master Records, Unique Symbols, Status */}
            <div className="flex items-center gap-2.5 text-[11px]">
              <div>
                <span className="text-slate-400">Records: </span>
                <span className="font-mono font-bold text-white">{masterRecordCount.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-400">Symbols: </span>
                <span className="font-mono font-bold text-emerald-300">{masterUniqueSymbols}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-400">Status: </span>
                {masterStatus === 'Loaded' ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 border border-emerald-800 text-emerald-300">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                    Loaded
                  </span>
                ) : masterStatus === 'Loading' ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-950/80 border border-amber-800 text-amber-300">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    Loading
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 border border-slate-700 text-slate-300">
                    {masterStatus}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* SECTION 2: HISTORICAL MARKET DATA                                 */}
        {/* ================================================================= */}
        <div className="lg:col-span-8 bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <div>
                <div className="text-xs font-bold text-white tracking-wide">
                  SECTION 2: HISTORICAL MARKET DATA
                </div>
                <div className="text-[10px] text-slate-400">
                  15-Year historical OHLCV bars & quantitative parameters (HIGH, MID, LOW Parquet)
                </div>
              </div>
            </div>

            {/* TWO SOURCE OPTIONS FOR HISTORICAL DATA */}
            <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => {
                  setSelectedHistoricalSource('GOOGLE_DRIVE');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                  selectedHistoricalSource === 'GOOGLE_DRIVE'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Google Drive: Default automatic historical data source"
              >
                <Cloud className="w-3.5 h-3.5 text-blue-300" />
                <span>Google Drive (Default)</span>
              </button>

              <button
                onClick={() => {
                  setSelectedHistoricalSource('OFFLINE_UPLOAD');
                  historicalFileInputRef.current?.click();
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                  selectedHistoricalSource === 'OFFLINE_UPLOAD'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Offline File Upload: Fallback for manual local Parquet files"
              >
                <FolderUp className="w-3.5 h-3.5 text-indigo-300" />
                <span>Offline File Upload (Fallback)</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
            {/* Hidden multi-file input (Accepts .parquet with 'multiple') */}
            <input
              type="file"
              ref={historicalFileInputRef}
              onChange={handleOfflineHistoricalFileChange}
              accept=".parquet"
              multiple
              className="hidden"
            />

            {/* Action Trigger based on selected option */}
            {selectedHistoricalSource === 'GOOGLE_DRIVE' ? (
              <div className="flex items-center gap-2">
                {driveSyncState.status === 'auth_required' ? (
                  <button
                    onClick={() => triggerGoogleSignInAndSync(onParquetParsed)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                    title="Authorize Google Drive once. Subsequent syncs run silently and automatically."
                  >
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Authorize Google Drive</span>
                  </button>
                ) : (
                  <button
                    onClick={() => runDriveAutoSync(onParquetParsed, true)}
                    disabled={driveSyncState.status === 'syncing'}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-xs font-semibold text-blue-300 transition-colors cursor-pointer shadow-sm hover:border-blue-400"
                    title="Force refresh files from Google Drive"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${driveSyncState.status === 'syncing' ? 'animate-spin' : ''}`} />
                    <span>{driveSyncState.status === 'syncing' ? 'Syncing...' : 'Sync / Refresh'}</span>
                  </button>
                )}

                <button
                  onClick={() => setIsDriveModalOpen(true)}
                  className="text-slate-400 hover:text-slate-200 text-xs underline cursor-pointer px-1"
                  title="Open Drive files detail manager"
                >
                  Manage
                </button>
              </div>
            ) : (
              <button
                onClick={() => historicalFileInputRef.current?.click()}
                disabled={historicalStatus === 'Loading'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-xs font-semibold text-indigo-300 transition-colors cursor-pointer shadow-sm hover:border-indigo-400"
                title="Select 01_HIGH, 02_MID, 03_LOW Parquet files simultaneously"
              >
                {historicalStatus === 'Loading' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Select Parquet Files (Multiple)</span>
                  </>
                )}
              </button>
            )}

            {/* Display: Source, Files loaded, Historical bars, Unique stocks, Status */}
            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <div>
                <span className="text-slate-400">Source: </span>
                <span className="font-semibold text-slate-200">
                  {selectedHistoricalSource === 'GOOGLE_DRIVE' ? 'Google Drive' : 'Offline Upload'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Files loaded: </span>
                <span className="font-mono font-bold text-white">{storeFilesLoaded}</span>
              </div>
              <div>
                <span className="text-slate-400">Historical bars: </span>
                <span className="font-mono font-bold text-emerald-400">{storeBarsCount.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-400">Unique stocks: </span>
                <span className="font-mono font-bold text-cyan-400">{storeUniqueStocks}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-400">Status: </span>
                {historicalStatus === 'Ready' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 border border-slate-700 text-slate-300">
                    Ready
                  </span>
                )}
                {historicalStatus === 'Loading' && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-950/80 border border-amber-800 text-amber-300">
                    <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-400" />
                    Loading
                  </span>
                )}
                {historicalStatus === 'Complete' && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 border border-emerald-800 text-emerald-300">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                    Complete
                  </span>
                )}
                {historicalStatus === 'Error' && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-950/80 border border-rose-800 text-rose-300">
                    <AlertCircle className="w-2.5 h-2.5 text-rose-400" />
                    Error
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Failure / Message Banner with Retry and Offline Fallback */}
      {(driveSyncState.status === 'error' || masterMessage || historicalStatusMessage) && (
        <div className="bg-slate-950 border-t border-slate-800/80 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            {driveSyncState.status === 'error' && (
              <div className="flex items-center gap-2 text-rose-300 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  <strong>Google Drive sync failed.</strong> Reason: {driveSyncState.errorReason || 'Network or authorization error.'}
                </span>
                <button
                  onClick={() => runDriveAutoSync(onParquetParsed, true)}
                  className="ml-2 px-2 py-0.5 rounded bg-rose-900/60 hover:bg-rose-800 border border-rose-700 text-rose-200 text-[11px] font-semibold cursor-pointer"
                >
                  Retry Drive Sync
                </button>
                <button
                  onClick={() => {
                    setSelectedHistoricalSource('OFFLINE_UPLOAD');
                    historicalFileInputRef.current?.click();
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-semibold cursor-pointer"
                >
                  Offline File Upload
                </button>
              </div>
            )}
            {driveSyncState.status !== 'error' && masterMessage && (
              <div className="flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span><strong>Master:</strong> {masterMessage}</span>
              </div>
            )}
            {driveSyncState.status !== 'error' && historicalStatusMessage && (
              <div
                className={`flex items-center gap-1.5 ${
                  historicalStatus === 'Error' ? 'text-rose-300' : 'text-blue-300'
                }`}
              >
                {historicalStatus === 'Error' ? (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                )}
                <span><strong>Historical:</strong> {historicalStatusMessage}</span>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setMasterMessage(null);
              setHistoricalStatusMessage(null);
            }}
            className="text-slate-400 hover:text-slate-200 text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Google Drive Ingestion Modal (Strictly for Historical Market Data) */}
      <GoogleDriveSyncModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        onParquetParsed={onParquetParsed}
        onDriveStatusChange={handleDriveStatusChange}
      />
    </div>
  );
};
