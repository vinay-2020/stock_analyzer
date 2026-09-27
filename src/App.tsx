import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  StockEquity,
  MarketCorrectionEvent,
  StockCorrectionResponse,
  MarketCapTier,
  FileMetadataState,
  RsiAggregateStats,
  StockValidationReport,
} from './types/equity';
import { validateStockUniverse } from './services/dataValidationService';
import {
  RESEARCH_UNIVERSE_STOCKS,
  HISTORICAL_NIFTY_CORRECTION_EVENTS,
  PRECOMPUTED_CORRECTION_RESPONSES,
  PRECOMPUTED_RSI_DATA,
  PRECOMPUTED_DIVERGENCES,
  PRECOMPUTED_EMA_INTERACTIONS,
  PRECOMPUTED_CONFLUENCES,
  PRECOMPUTED_RETURN_TARGET_ROWS,
  generateCorrectionResponses,
} from './services/historicalData';
import { ParquetParseResult } from './services/parquetLoader';
import { parseEquityCsv } from './utils/csvParser';
import { getHistoricalBars } from './services/historicalDataStore';
import {
  loadMasterDataFromCsv,
  getAllStockMasterAsStockEquity,
} from './services/stockMasterStore';
import { runDriveAutoSync } from './services/driveAutoSyncService';
import { Navbar, ActiveResearchTab } from './components/Navbar';
import { HistoricalDataSourceBar } from './components/HistoricalDataSourceBar';
import { UniverseDirectoryView } from './components/UniverseDirectoryView';
import { SectorsView } from './components/SectorsView';
import { IndustriesView } from './components/IndustriesView';
import { IndicesView } from './components/IndicesView';
import { CagrResearchView } from './components/CagrResearchView';
import { RsiReboundEngineView } from './components/RsiReboundEngineView';
import { EmaSupportEngineView } from './components/EmaSupportEngineView';
import { CrisisCorrectionEngineView } from './components/CrisisCorrectionEngineView';
import { ConfluenceAndTargetsView } from './components/ConfluenceAndTargetsView';
import { RsiDivergenceEngineView } from './components/RsiDivergenceEngineView';
import { ValidationTestView } from './components/ValidationTestView';
import { DataAuditView } from './components/DataAuditView';
import { AiResearchPanel } from './components/AiResearchPanel';
import { StockResearchInspectorModal } from './components/StockResearchInspectorModal';
import { downloadStructuredResearchJson } from './services/driveStorageService';

export default function App() {
  // Navigation Tab State (Default to Primary 'stocks' tab)
  const [activeTab, setActiveTab] = useState<ActiveResearchTab>('stocks');

  // Universe State (Initializes with curated 1,120 Indian stock universe)
  const [universeStocks, setUniverseStocks] = useState<StockEquity[]>(RESEARCH_UNIVERSE_STOCKS);
  const [correctionEvents] = useState<MarketCorrectionEvent[]>(HISTORICAL_NIFTY_CORRECTION_EVENTS);
  const [correctionResponses, setCorrectionResponses] = useState<StockCorrectionResponse[]>(
    PRECOMPUTED_CORRECTION_RESPONSES
  );
  const [rsiOccurrences] = useState(PRECOMPUTED_RSI_DATA.occurrences);
  const [rsiStats] = useState<RsiAggregateStats[]>(PRECOMPUTED_RSI_DATA.stats);
  const [divergences] = useState(PRECOMPUTED_DIVERGENCES);
  const [emaInteractions] = useState(PRECOMPUTED_EMA_INTERACTIONS);
  const [confluences] = useState(PRECOMPUTED_CONFLUENCES);
  const [targetRows] = useState(PRECOMPUTED_RETURN_TARGET_ROWS);

  // Filter & Inspector Modal State
  const [selectedCapTier, setSelectedCapTier] = useState<MarketCapTier | 'ALL'>('ALL');
  const [inspectedSymbol, setInspectedSymbol] = useState<string | null>(null);

  // Dedicated Stock Classification & Taxonomy State (strictly sourced from ALL EQUITY DETAILS.CSV)
  const [classificationStocks, setClassificationStocks] = useState<StockEquity[]>(RESEARCH_UNIVERSE_STOCKS);
  const [validationReport, setValidationReport] = useState<StockValidationReport | null>(() => {
    return validateStockUniverse(RESEARCH_UNIVERSE_STOCKS, 'csv_files/ALL EQUITY DETAILS.CSV').report;
  });
  const [classificationMeta, setClassificationMeta] = useState<{
    fileName: string;
    rowCount: number;
    loadedAt: string;
    sourceType: 'default_csv' | 'local_upload';
  }>({
    fileName: 'csv_files/ALL EQUITY DETAILS.CSV',
    rowCount: RESEARCH_UNIVERSE_STOCKS.length,
    loadedAt: 'Active Registry',
    sourceType: 'default_csv',
  });

  // Automatically load /csv_files/ALL EQUITY DETAILS.CSV into stockMasterStore on mount
  useEffect(() => {
    let isMounted = true;
    const fetchEquityDetailsCsv = async () => {
      try {
        const res = await fetch('/csv_files/ALL%20EQUITY%20DETAILS.CSV');
        if (res.ok) {
          const text = await res.text();
          if (text && text.trim().length > 0) {
            loadMasterDataFromCsv(text, 'All_equity_details.csv');
            const parsed = parseEquityCsv(text, 'csv_files/ALL EQUITY DETAILS.CSV');
            if (isMounted && parsed.stocks.length > 0) {
              setClassificationStocks(parsed.stocks);
              setValidationReport(parsed.validationReport);
              setClassificationMeta({
                fileName: 'All_equity_details.csv',
                rowCount: parsed.stocks.length,
                loadedAt: new Date().toLocaleTimeString(),
                sourceType: 'default_csv',
              });
            }
          }
        }
      } catch (err) {
        console.warn('Could not auto-fetch /csv_files/ALL EQUITY DETAILS.CSV, fallback to embedded registry', err);
      }
    };
    fetchEquityDetailsCsv();
    return () => {
      isMounted = false;
    };
  }, []);

  // File Metadata State
  const [fileMetadata, setFileMetadata] = useState<FileMetadataState>({
    sourceType: 'research_universe',
    fileName: 'ALL EQUITY DETAILS.CSV (Authoritative)',
    rowCount: RESEARCH_UNIVERSE_STOCKS.length,
    loadedAt: new Date().toLocaleTimeString(),
  });

  // Cap tier counts
  const highCapCount = useMemo(
    () => universeStocks.filter((s) => s.capTier === 'HIGH').length,
    [universeStocks]
  );
  const midCapCount = useMemo(
    () => universeStocks.filter((s) => s.capTier === 'MID').length,
    [universeStocks]
  );
  const lowCapCount = useMemo(
    () => universeStocks.filter((s) => s.capTier === 'LOW').length,
    [universeStocks]
  );

  // Selected Stock for Inspector Modal
  const inspectedStock = useMemo(() => {
    if (!inspectedSymbol) return null;
    return universeStocks.find((s) => s.symbol === inspectedSymbol) || null;
  }, [universeStocks, inspectedSymbol]);

  const inspectedRsiStat = useMemo(() => {
    if (!inspectedSymbol) return undefined;
    return rsiStats.find((s) => s.symbol === inspectedSymbol);
  }, [rsiStats, inspectedSymbol]);

  // Handle Parquet File Ingestion
  const handleParquetParsed = useCallback(
    (result: ParquetParseResult) => {
      if (!result.error && result.rowCount > 0) {
        setFileMetadata((prev) => ({
          sourceType: 'local_parquet',
          fileName: result.fileName,
          rowCount: prev.sourceType === 'local_parquet' ? prev.rowCount + result.rowCount : result.rowCount,
          loadedAt: new Date().toLocaleTimeString(),
        }));

        if (result.stocksIdentified.length > 0) {
          const updateStockWithMetadata = (stockList: StockEquity[]) =>
            stockList.map((stock) => {
              if (result.stocksIdentified.includes(stock.symbol)) {
                const stockBars = getHistoricalBars(stock.symbol);
                const barsCount = stockBars.length > 0 ? stockBars.length : stock.historicalBarsCount;
                const latestClose = stockBars.length > 0 ? stockBars[stockBars.length - 1].close : stock.currentPrice;
                return {
                  ...stock,
                  historicalBarsCount: barsCount,
                  currentPrice: latestClose,
                  dateRangeStart: stockBars.length > 0 ? stockBars[0].date : (result.dateRange?.start || stock.dateRangeStart),
                  dateRangeEnd: stockBars.length > 0 ? stockBars[stockBars.length - 1].date : (result.dateRange?.end || stock.dateRangeEnd),
                };
              }
              return stock;
            });

          setUniverseStocks((prev) => {
            const updated = updateStockWithMetadata(prev);
            const researchStocks = updated.filter(
              (s) => (s.historicalBarsCount && s.historicalBarsCount > 0) || s.currentPrice
            );
            setCorrectionResponses(generateCorrectionResponses(researchStocks, correctionEvents));
            return updated;
          });
          setClassificationStocks((prev) => updateStockWithMetadata(prev));
        }
      }
    },
    [correctionEvents]
  );

  // Automatic Google Drive Startup Sync (Silent check + cached instant load / delta sync)
  useEffect(() => {
    runDriveAutoSync(handleParquetParsed);
  }, [handleParquetParsed]);

  // DOMAIN 1: Handle Stock Master Data Ingestion (All_equity_details.csv)
  const handleMasterCsvLoaded = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          try {
            const res = loadMasterDataFromCsv(text, file.name);
            if (res.success) {
              const masterStocks = getAllStockMasterAsStockEquity();

              // Preserve any already loaded historical bars by querying getHistoricalBars by canonical symbol
              const enrichedStocks = masterStocks.map((stock) => {
                const bars = getHistoricalBars(stock.symbol);
                if (bars && bars.length > 0) {
                  return {
                    ...stock,
                    historicalBarsCount: bars.length,
                    currentPrice: bars[bars.length - 1].close,
                    dateRangeStart: bars[0].date,
                    dateRangeEnd: bars[bars.length - 1].date,
                  };
                }
                return stock;
              });

              setClassificationStocks(enrichedStocks);
              setUniverseStocks(enrichedStocks);
              setClassificationMeta({
                fileName: file.name,
                rowCount: res.recordCount,
                loadedAt: new Date().toLocaleTimeString(),
                sourceType: 'local_upload',
              });

              const eligibleStocks = enrichedStocks.filter(
                (s) => (s.historicalBarsCount && s.historicalBarsCount > 0) || s.currentPrice
              );
              setCorrectionResponses(
                generateCorrectionResponses(eligibleStocks, correctionEvents)
              );
              setFileMetadata({
                sourceType: 'local_csv',
                fileName: file.name,
                rowCount: res.recordCount,
                loadedAt: new Date().toLocaleTimeString(),
              });
            }
          } catch (err) {
            console.error('Failed to parse uploaded Stock Master CSV:', err);
          }
        }
      };
      reader.readAsText(file);
    },
    [correctionEvents]
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation Bar with Primary & Secondary Engine Tabs */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        universeCount={classificationStocks.length}
      />

      {/* Dataset / Ingestion Bar */}
      <HistoricalDataSourceBar
        totalStocks={universeStocks.length}
        highCapCount={highCapCount}
        midCapCount={midCapCount}
        lowCapCount={lowCapCount}
        fileMetadata={fileMetadata}
        onParquetParsed={handleParquetParsed}
        onMasterCsvLoaded={handleMasterCsvLoaded}
        selectedCapTier={selectedCapTier}
        onSelectCapTier={setSelectedCapTier}
      />

      {/* Main Research Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* PRIMARY DISPLAY TAB 1: STOCKS */}
        {activeTab === 'stocks' && (
          <UniverseDirectoryView
            stocks={classificationStocks}
            selectedCapTier={selectedCapTier}
            onSelectCapTier={setSelectedCapTier}
            onInspectStock={setInspectedSymbol}
          />
        )}

        {/* PRIMARY DISPLAY TAB 2: SECTORS */}
        {activeTab === 'sectors' && (
          <SectorsView
            stocks={classificationStocks}
            onInspectStock={setInspectedSymbol}
          />
        )}

        {/* PRIMARY DISPLAY TAB 3: INDUSTRIES */}
        {activeTab === 'industries' && (
          <IndustriesView
            stocks={classificationStocks}
            onInspectStock={setInspectedSymbol}
          />
        )}

        {/* PRIMARY DISPLAY TAB 4: INDICES */}
        {activeTab === 'indices' && (
          <IndicesView
            stocks={classificationStocks}
            onInspectStock={setInspectedSymbol}
          />
        )}

        {/* PRIMARY DISPLAY TAB 5: RSI REBOUND */}
        {activeTab === 'rsi' && (
          <RsiReboundEngineView
            occurrences={rsiOccurrences}
            stats={rsiStats}
            onInspectStock={setInspectedSymbol}
          />
        )}

        {/* PRIMARY DISPLAY TAB 6: EMA SUPPORT */}
        {activeTab === 'ema' && (
          <EmaSupportEngineView
            interactions={emaInteractions}
            onInspectStock={setInspectedSymbol}
          />
        )}

        {/* PRIMARY DISPLAY TAB 7: CAGR ENGINE */}
        {activeTab === 'cagr' && (
          <CagrResearchView
            stocks={classificationStocks}
            onInspectStock={setInspectedSymbol}
            onExportDriveJson={() => downloadStructuredResearchJson(classificationStocks)}
          />
        )}

        {/* SECONDARY ON-DEMAND TAB: 4-CYCLE CRISIS CORRECTION ENGINE */}
        {activeTab === 'crisis' && (
          <CrisisCorrectionEngineView
            events={correctionEvents}
            responses={correctionResponses}
            selectedCapTier={selectedCapTier}
            onInspectStock={setInspectedSymbol}
          />
        )}

        {/* SECONDARY ON-DEMAND TAB: CONFLUENCE & TARGETS */}
        {activeTab === 'confluence' && (
          <ConfluenceAndTargetsView
            confluences={confluences}
            targetRows={targetRows}
            onInspectStock={setInspectedSymbol}
          />
        )}

        {/* SECONDARY ON-DEMAND TAB: RSI DIVERGENCE */}
        {activeTab === 'divergence' && (
          <RsiDivergenceEngineView
            divergences={divergences}
            onInspectStock={setInspectedSymbol}
          />
        )}

        {/* SECONDARY ON-DEMAND TAB: VALIDATION TEST (3 STOCKS) */}
        {activeTab === 'validation' && (
          <ValidationTestView
            events={correctionEvents}
            responses={correctionResponses}
            stocks={universeStocks}
            onInspectStock={setInspectedSymbol}
          />
        )}

        {/* SECONDARY ON-DEMAND TAB: DATA AUDIT & PROVENANCE */}
        {activeTab === 'audit' && (
          <DataAuditView
            stocks={classificationStocks}
            validationReport={validationReport}
            fileMeta={fileMetadata}
          />
        )}

        {/* SECONDARY ON-DEMAND TAB: AI RESEARCH INTERPRETER */}
        {activeTab === 'ai_research' && (
          <AiResearchPanel
            responses={correctionResponses}
            events={correctionEvents}
            rsiStats={rsiStats}
            onInspectStock={setInspectedSymbol}
          />
        )}
      </main>

      {/* Stock Deep-Dive Research Inspector Modal */}
      <StockResearchInspectorModal
        symbol={inspectedSymbol}
        stock={inspectedStock}
        responses={correctionResponses}
        rsiStat={inspectedRsiStat}
        onClose={() => setInspectedSymbol(null)}
      />

      {/* Institutional Research & Regulatory Compliance Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/90 py-5 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          <div>
            <span className="font-bold text-slate-200">
              Historical Stock Behaviour, Opportunity &amp; Rebound Research Engine
            </span>{' '}
            • Indian Stock Market Research (NSE / BSE • ₹ INR)
            <div className="text-[11px] text-slate-400 mt-0.5">
              Core Axiom: <strong className="text-emerald-400">HISTORICAL DATA → HISTORICAL BEHAVIOUR → STATISTICS → PROBABILITY → HUMAN DECISION</strong>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 max-w-md">
            <strong>Disclaimer:</strong> Historical win rates and probabilities describe past samples only. They are not guarantees of future performance. Human investor independently evaluates chart structure, valuation, and fundamentals before making any decision.
          </div>
        </div>
      </footer>
    </div>
  );
}
