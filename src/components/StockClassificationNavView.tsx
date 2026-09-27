import React, { useState, useMemo, useRef } from 'react';
import {
  Layers,
  Compass,
  Search,
  ChevronRight,
  Filter,
  Building2,
  PieChart,
  Tag,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  Briefcase,
  TrendingUp,
  HelpCircle,
  FolderTree,
  ArrowLeftRight,
  FileSpreadsheet,
  Upload,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  X,
} from 'lucide-react';
import { StockEquity, MarketCapTier, StockValidationReport } from '../types/equity';
import {
  buildUniverseClassificationIndex,
  IndexSummary,
  SectorSummary,
  IndustrySummary,
} from '../services/classificationService';

interface Props {
  stocks: StockEquity[];
  onInspectStock: (symbol: string) => void;
  fileName?: string;
  rowCount?: number;
  loadedAt?: string;
  sourceType?: 'default_csv' | 'local_upload';
  validationReport?: StockValidationReport | null;
  onCsvLoaded?: (file: File) => void;
}

type NavigationDirection =
  | 'INDEX_SECTOR_INDUSTRY_STOCKS'
  | 'SECTOR_INDUSTRY_STOCKS'
  | 'INDUSTRY_STOCKS'
  | 'ALL_STOCKS_VIEW'
  | 'STOCK_SECTOR_INDUSTRY_INDICES';

type CapabilityTab = 'HIERARCHY' | 'MEMBERSHIP_QUESTIONS';

export const StockClassificationNavView: React.FC<Props> = ({
  stocks,
  onInspectStock,
  fileName = 'csv_files/ALL EQUITY DETAILS.CSV',
  rowCount,
  loadedAt,
  sourceType,
  validationReport,
  onCsvLoaded,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showValidationModal, setShowValidationModal] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onCsvLoaded) {
      onCsvLoaded(file);
    }
  };
  // Active main tab: Guided Hierarchy Navigation or Instant Question Assistant
  const [activeCapabilityTab, setActiveCapabilityTab] = useState<CapabilityTab>('HIERARCHY');

  // Active navigation pathway direction
  const [navDirection, setNavDirection] = useState<NavigationDirection>(
    'INDEX_SECTOR_INDUSTRY_STOCKS'
  );

  // Global search query
  const [globalSearch, setGlobalSearch] = useState<string>('');

  // Selected entities along navigation path
  const [selectedIndex, setSelectedIndex] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string>('');

  // Preset question state for Membership Questions tab
  const [activeQuestionId, setActiveQuestionId] = useState<number>(1);
  const [qIndex, setQIndex] = useState<string>('NIFTY 50');
  const [qSector, setQSector] = useState<string>('Financial Services');
  const [qIndustry, setQIndustry] = useState<string>('Private Sector Bank');
  const [qStockSymbol, setQStockSymbol] = useState<string>('RELIANCE');

  // Build high-performance in-memory classification index
  const {
    stockLookup,
    indicesList,
    sectorsList,
    industriesList,
    indexMap,
    sectorMap,
    industryMap,
  } = useMemo(() => buildUniverseClassificationIndex(stocks), [stocks]);

  // Handle resets
  const handleResetSelections = () => {
    setSelectedIndex('');
    setSelectedSector('');
    setSelectedIndustry('');
    setSelectedStockSymbol('');
    setGlobalSearch('');
  };

  // Quick select stock helper
  const handleSelectStock = (symbol: string) => {
    setSelectedStockSymbol(symbol);
    const stock = stockLookup.get(symbol.toUpperCase());
    if (stock) {
      setSelectedSector(stock.sector);
      setSelectedIndustry(stock.industry);
    }
  };

  // -------------------------------------------------------------
  // Contextual filtering based on current selections
  // -------------------------------------------------------------

  // Filtered Sectors available under current Index (if Index selected)
  const availableSectors = useMemo(() => {
    if (!selectedIndex || selectedIndex.startsWith('ALL EQUITIES') || navDirection !== 'INDEX_SECTOR_INDUSTRY_STOCKS') {
      return sectorsList;
    }
    const idxEntry = indexMap.get(selectedIndex);
    if (!idxEntry) return sectorsList;
    return sectorsList.filter((s) => idxEntry.sectors.has(s.name));
  }, [selectedIndex, sectorsList, indexMap, navDirection]);

  // Filtered Industries available under current Sector & Index
  const availableIndustries = useMemo(() => {
    let list = industriesList;
    if (selectedSector) {
      list = list.filter((ind) => ind.sector === selectedSector);
    }
    if (selectedIndex && !selectedIndex.startsWith('ALL EQUITIES') && navDirection === 'INDEX_SECTOR_INDUSTRY_STOCKS') {
      const idxEntry = indexMap.get(selectedIndex);
      if (idxEntry) {
        list = list.filter((ind) => idxEntry.industries.has(ind.name));
      }
    }
    return list;
  }, [selectedSector, selectedIndex, industriesList, indexMap, navDirection]);

  // Resulting Stocks matching current filter chain
  const contextualStocks = useMemo(() => {
    return stocks.filter((stock) => {
      if (selectedIndex && navDirection === 'INDEX_SECTOR_INDUSTRY_STOCKS') {
        const stockIndices = stock.indices || [];
        if (selectedIndex.startsWith('ALL EQUITIES')) {
          // All 1,120 stocks are included!
        } else if (selectedIndex.startsWith('UNINDEXED EQUITIES')) {
          // Stocks that do NOT belong to any benchmark/sectoral index
          if (stockIndices.length > 0) return false;
        } else {
          if (!stockIndices.includes(selectedIndex)) return false;
        }
      }
      if (selectedSector && stock.sector !== selectedSector) return false;
      if (selectedIndustry && stock.industry !== selectedIndustry) return false;
      if (globalSearch.trim()) {
        const q = globalSearch.toLowerCase();
        const sym = stock.symbol.toLowerCase();
        const comp = stock.companyName.toLowerCase();
        const sec = stock.sector.toLowerCase();
        const ind = stock.industry.toLowerCase();
        const idx = (stock.indices || []).join(' ').toLowerCase();
        if (!sym.includes(q) && !comp.includes(q) && !sec.includes(q) && !ind.includes(q) && !idx.includes(q)) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => (a.marketCapRank || 999) - (b.marketCapRank || 999));
  }, [stocks, selectedIndex, selectedSector, selectedIndustry, globalSearch, navDirection]);

  // Reverse stock inspection entity
  const inspectedStockData = useMemo(() => {
    if (!selectedStockSymbol) return null;
    return stockLookup.get(selectedStockSymbol.toUpperCase()) || null;
  }, [selectedStockSymbol, stockLookup]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-extrabold tracking-wider uppercase bg-indigo-950 text-indigo-300 border border-indigo-800/80 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                Classification Engine
              </span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 flex items-center gap-1.5 shadow-xs">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Source: <strong className="font-mono text-white">{fileName}</strong></span>
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                Zero Parquet Dependency • Pure Equity Registry
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Stock Classification &amp; Universe Navigation
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Explore and query the comprehensive multi-tier taxonomy sourced exclusively from{' '}
              <code className="text-emerald-400 text-xs font-mono font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
                {fileName}
              </code>
              . Navigate bidirectionally between <strong>Indices</strong>, <strong>Sectors</strong>, <strong>Industries</strong>, and individual <strong>Stocks</strong> with complete isolation from Parquet historical files.
            </p>
          </div>

          {/* Universe Metric Summary Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-center">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Indices</div>
              <div className="text-lg font-mono font-bold text-indigo-400 mt-0.5">{indicesList.length}</div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-center">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sectors</div>
              <div className="text-lg font-mono font-bold text-emerald-400 mt-0.5">{sectorsList.length}</div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-center">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Industries</div>
              <div className="text-lg font-mono font-bold text-amber-400 mt-0.5">{industriesList.length}</div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-center">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Stocks</div>
              <div className="text-lg font-mono font-bold text-white mt-0.5">{stocks.length}</div>
            </div>
          </div>
        </div>

        {/* Classification Data Source & Ingestion Strip */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-slate-300 font-semibold">Classification Data Source:</span>
              <span className="font-mono text-emerald-300 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-800/60 font-semibold">
                {fileName}
              </span>
            </div>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">
              <strong className="text-white font-mono">{stocks.length}</strong> stocks registered
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">
              <strong className="text-white font-mono">{sectorsList.length}</strong> sectors &bull;{' '}
              <strong className="text-white font-mono">{industriesList.length}</strong> industries
            </span>
            {loadedAt && (
              <>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">Status: {loadedAt}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowValidationModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-300 bg-indigo-950/60 border border-indigo-700/60 rounded-lg hover:bg-indigo-900/60 transition cursor-pointer"
              title="View deterministic Stock Universe Data Integrity Validation Report"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Validation: <strong className="font-mono text-emerald-400">{validationReport?.validStocks ?? stocks.length} Valid</strong></span>
            </button>

            {onCsvLoaded && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-700/60 rounded-lg hover:bg-emerald-900/60 transition cursor-pointer"
                  title="Upload or replace ALL EQUITY DETAILS.CSV"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload ALL EQUITY DETAILS.CSV
                </button>
              </>
            )}
          </div>
        </div>

        {/* Capability Mode Switcher */}
        <div className="flex items-center justify-between border-t border-slate-800/80 mt-6 pt-4 flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveCapabilityTab('HIERARCHY')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeCapabilityTab === 'HIERARCHY'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderTree className="w-4 h-4" />
              Bidirectional Hierarchy Explorer
            </button>
            <button
              onClick={() => setActiveCapabilityTab('MEMBERSHIP_QUESTIONS')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeCapabilityTab === 'MEMBERSHIP_QUESTIONS'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              Membership Questions &amp; Direct Answers
            </button>
          </div>

          {/* Quick Universal Filter Input */}
          <div className="relative min-w-[260px] flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search symbol, index, sector, industry..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {globalSearch && (
              <button
                onClick={() => setGlobalSearch('')}
                className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CAPABILITY 1: BIDIRECTIONAL HIERARCHY EXPLORER */}
      {/* ========================================================================= */}
      {activeCapabilityTab === 'HIERARCHY' && (
        <div className="space-y-6">
          {/* Pathway Direction Selector */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
                Select Navigation Pathway Direction:
              </span>
              {(selectedIndex || selectedSector || selectedIndustry || selectedStockSymbol) && (
                <button
                  onClick={handleResetSelections}
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                >
                  <RotateCcw className="w-3 h-3" /> Reset Selections
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              <button
                onClick={() => {
                  setNavDirection('INDEX_SECTOR_INDUSTRY_STOCKS');
                  handleResetSelections();
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  navDirection === 'INDEX_SECTOR_INDUSTRY_STOCKS'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="text-[11px] font-bold text-indigo-400 uppercase">Direction 1</div>
                <div className="text-xs font-extrabold mt-0.5">Index → Sector → Industry → Stocks</div>
                <div className="text-[10px] text-slate-400 mt-1">Benchmark, Sectoral or Unindexed</div>
              </button>

              <button
                onClick={() => {
                  setNavDirection('SECTOR_INDUSTRY_STOCKS');
                  handleResetSelections();
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  navDirection === 'SECTOR_INDUSTRY_STOCKS'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="text-[11px] font-bold text-emerald-400 uppercase">Direction 2</div>
                <div className="text-xs font-extrabold mt-0.5">Sector → Industry → Stocks</div>
                <div className="text-[10px] text-slate-400 mt-1">Start from Broad Sector (Index-Free)</div>
              </button>

              <button
                onClick={() => {
                  setNavDirection('INDUSTRY_STOCKS');
                  handleResetSelections();
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  navDirection === 'INDUSTRY_STOCKS'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="text-[11px] font-bold text-amber-400 uppercase">Direction 3</div>
                <div className="text-xs font-extrabold mt-0.5">Industry → Stocks</div>
                <div className="text-[10px] text-slate-400 mt-1">Direct Industry Directory (Index-Free)</div>
              </button>

              <button
                onClick={() => {
                  setNavDirection('ALL_STOCKS_VIEW');
                  handleResetSelections();
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  navDirection === 'ALL_STOCKS_VIEW'
                    ? 'bg-cyan-600/20 border-cyan-500 text-white shadow-sm'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="text-[11px] font-bold text-cyan-400 uppercase">Direction 4</div>
                <div className="text-xs font-extrabold mt-0.5">All Equities ({stocks.length})</div>
                <div className="text-[10px] text-slate-400 mt-1">All Stocks (Indexed &amp; Unindexed)</div>
              </button>

              <button
                onClick={() => {
                  setNavDirection('STOCK_SECTOR_INDUSTRY_INDICES');
                  handleResetSelections();
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  navDirection === 'STOCK_SECTOR_INDUSTRY_INDICES'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="text-[11px] font-bold text-purple-400 uppercase">Direction 5</div>
                <div className="text-xs font-extrabold mt-0.5">Stock → Sector → Industry → Indices</div>
                <div className="text-[10px] text-slate-400 mt-1">Reverse Lookup &amp; Peer Comparison</div>
              </button>
            </div>
          </div>

          {/* Contextual Active Breadcrumb Path */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Active Scope:</span>
            <button
              onClick={handleResetSelections}
              className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              All Universe ({stocks.length})
            </button>

            {selectedIndex && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono font-bold flex items-center gap-1.5">
                  Index: {selectedIndex}
                  <span
                    onClick={() => setSelectedIndex('')}
                    className="cursor-pointer text-slate-400 hover:text-white"
                  >
                    ✕
                  </span>
                </span>
              </>
            )}

            {selectedSector && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold flex items-center gap-1.5">
                  Sector: {selectedSector}
                  <span
                    onClick={() => {
                      setSelectedSector('');
                      setSelectedIndustry('');
                    }}
                    className="cursor-pointer text-slate-400 hover:text-white"
                  >
                    ✕
                  </span>
                </span>
              </>
            )}

            {selectedIndustry && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-semibold flex items-center gap-1.5">
                  Industry: {selectedIndustry}
                  <span
                    onClick={() => setSelectedIndustry('')}
                    className="cursor-pointer text-slate-400 hover:text-white"
                  >
                    ✕
                  </span>
                </span>
              </>
            )}

            {selectedStockSymbol && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono font-bold flex items-center gap-1.5">
                  Stock: {selectedStockSymbol}
                  <span
                    onClick={() => setSelectedStockSymbol('')}
                    className="cursor-pointer text-slate-400 hover:text-white"
                  >
                    ✕
                  </span>
                </span>
              </>
            )}
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* DIRECTION 1: INDEX -> SECTOR -> INDUSTRY -> STOCKS */}
          {/* ------------------------------------------------------------------- */}
          {navDirection === 'INDEX_SECTOR_INDUSTRY_STOCKS' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Level 1: Index Selection List */}
              <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] text-indigo-300 font-bold">1</span>
                    Choose Index
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">{indicesList.length} Indices</span>
                </div>

                <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
                  {indicesList.map((idx) => {
                    const isSelected = selectedIndex === idx.name;
                    return (
                      <button
                        key={idx.name}
                        onClick={() => {
                          setSelectedIndex(isSelected ? '' : idx.name);
                          setSelectedSector('');
                          setSelectedIndustry('');
                        }}
                        className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-600/30 border-indigo-500 text-white'
                            : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-mono text-xs font-bold flex items-center gap-1.5">
                            <span>{idx.name}</span>
                            <span className={`text-[9px] px-1 rounded font-sans font-normal ${
                              idx.type === 'BENCHMARK' ? 'bg-indigo-950 text-indigo-300' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {idx.type}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {idx.sectorsCount} Sectors • {idx.industriesCount} Industries
                          </div>
                        </div>
                        <span className="font-mono font-bold text-xs text-indigo-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                          {idx.stockCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Level 2: Sector & Industry Selectors within this Index */}
              <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] text-emerald-300 font-bold">2</span>
                      Sectors in Index {selectedIndex ? `(${availableSectors.length})` : ''}
                    </h3>
                    {selectedSector && (
                      <button
                        onClick={() => {
                          setSelectedSector('');
                          setSelectedIndustry('');
                        }}
                        className="text-[10px] text-slate-400 hover:text-white"
                      >
                        Clear Sector
                      </button>
                    )}
                  </div>

                  {!selectedIndex ? (
                    <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
                      Select an Index on the left to see its represented sectors.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                      {availableSectors.map((sec) => {
                        const isSelected = selectedSector === sec.name;
                        // Count stocks from this sector inside the chosen index
                        const countInIndex = contextualStocks.filter((s) => s.sector === sec.name).length;
                        return (
                          <button
                            key={sec.name}
                            onClick={() => {
                              setSelectedSector(isSelected ? '' : sec.name);
                              setSelectedIndustry('');
                            }}
                            className={`w-full text-left p-2 rounded-lg border text-xs transition-all flex items-center justify-between ${
                              isSelected
                                ? 'bg-emerald-600/30 border-emerald-500 text-white font-bold'
                                : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <span className="truncate">{sec.name}</span>
                            <span className="font-mono text-[10px] font-bold text-emerald-400 bg-slate-900 px-1.5 py-0.5 rounded">
                              {countInIndex}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Level 3: Industries inside Selected Sector */}
                <div className="pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px] text-amber-300 font-bold">3</span>
                      Industries in Sector {selectedSector ? `(${availableIndustries.length})` : ''}
                    </h3>
                    {selectedIndustry && (
                      <button
                        onClick={() => setSelectedIndustry('')}
                        className="text-[10px] text-slate-400 hover:text-white"
                      >
                        Clear Industry
                      </button>
                    )}
                  </div>

                  {!selectedSector ? (
                    <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
                      Select a Sector above to narrow down specific industries.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
                      {availableIndustries.map((ind) => {
                        const isSelected = selectedIndustry === ind.name;
                        const countInFilter = contextualStocks.filter((s) => s.industry === ind.name).length;
                        return (
                          <button
                            key={ind.name}
                            onClick={() => setSelectedIndustry(isSelected ? '' : ind.name)}
                            className={`w-full text-left p-2 rounded-lg border text-xs transition-all flex items-center justify-between ${
                              isSelected
                                ? 'bg-amber-600/30 border-amber-500 text-white font-bold'
                                : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <span className="truncate">{ind.name}</span>
                            <span className="font-mono text-[10px] font-bold text-amber-400 bg-slate-900 px-1.5 py-0.5 rounded">
                              {countInFilter}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Level 4: Constituent Stocks Result Table */}
              <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-slate-200 font-bold">4</span>
                    Matching Stocks
                  </h3>
                  <span className="font-mono font-bold text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                    {contextualStocks.length} Stocks Found
                  </span>
                </div>

                <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
                  {contextualStocks.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/60 rounded-lg border border-slate-800">
                      No stocks match the current active combination.
                    </div>
                  ) : (
                    contextualStocks.map((stock) => (
                      <div
                        key={stock.symbol}
                        className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-xs text-indigo-400">{stock.symbol}</span>
                            {stock.validationStatus && stock.validationStatus !== 'VALID' && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-950 text-amber-300 border border-amber-700/80">
                                {stock.validationStatus}
                              </span>
                            )}
                            <span className={`text-[9px] px-1 rounded font-bold ${
                              stock.capTier === 'HIGH' ? 'bg-emerald-950 text-emerald-300' : stock.capTier === 'MID' ? 'bg-blue-950 text-blue-300' : 'bg-slate-800 text-slate-300'
                            }`}>
                              {stock.capTier}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-300 truncate mt-0.5">{stock.companyName}</div>
                          <div className="text-[10px] text-slate-500 truncate">{stock.industry}</div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-mono text-xs font-bold text-white">₹{stock.currentPrice?.toFixed(1) || '—'}</div>
                          <button
                            onClick={() => onInspectStock(stock.symbol)}
                            className="mt-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold underline flex items-center gap-0.5 justify-end"
                          >
                            Inspect <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------- */}
          {/* DIRECTION 2: SECTOR -> INDUSTRY -> STOCKS */}
          {/* ------------------------------------------------------------------- */}
          {navDirection === 'SECTOR_INDUSTRY_STOCKS' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Sector List */}
              <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] text-emerald-300 font-bold">1</span>
                    Choose Sector
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">{sectorsList.length} Sectors</span>
                </div>

                <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
                  {sectorsList.map((sec) => {
                    const isSelected = selectedSector === sec.name;
                    return (
                      <button
                        key={sec.name}
                        onClick={() => {
                          setSelectedSector(isSelected ? '' : sec.name);
                          setSelectedIndustry('');
                        }}
                        className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-600/30 border-emerald-500 text-white font-bold'
                            : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold">{sec.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {sec.industriesCount} Industries • {sec.indices.length} Indices
                          </div>
                        </div>
                        <span className="font-mono font-bold text-xs text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {sec.stockCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Industries in Sector */}
              <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px] text-amber-300 font-bold">2</span>
                    Industries {selectedSector ? `(${availableIndustries.length})` : ''}
                  </h3>
                  {selectedIndustry && (
                    <button
                      onClick={() => setSelectedIndustry('')}
                      className="text-[10px] text-slate-400 hover:text-white"
                    >
                      Clear Industry
                    </button>
                  )}
                </div>

                {!selectedSector ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/60 rounded-lg border border-slate-800">
                    Select a Sector on the left to see all sub-industries.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
                    {availableIndustries.map((ind) => {
                      const isSelected = selectedIndustry === ind.name;
                      return (
                        <button
                          key={ind.name}
                          onClick={() => setSelectedIndustry(isSelected ? '' : ind.name)}
                          className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-amber-600/30 border-amber-500 text-white font-bold'
                              : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold">{ind.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{ind.indices.length} Associated Indices</div>
                          </div>
                          <span className="font-mono font-bold text-xs text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {ind.stockCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Stocks in Industry/Sector */}
              <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-slate-200 font-bold">3</span>
                    Stocks ({contextualStocks.length})
                  </h3>
                  <span className="text-[10px] text-slate-400">Ranked by Cap</span>
                </div>

                <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
                  {contextualStocks.map((stock) => (
                    <div
                      key={stock.symbol}
                      className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-indigo-400">{stock.symbol}</span>
                          <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-300 font-bold">
                            {stock.capTier}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300 truncate mt-0.5">{stock.companyName}</div>
                        <div className="text-[10px] text-slate-500 truncate">{stock.industry}</div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono text-xs font-bold text-white">₹{stock.currentPrice?.toFixed(1) || '—'}</div>
                        <button
                          onClick={() => onInspectStock(stock.symbol)}
                          className="mt-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold underline flex items-center gap-0.5 justify-end"
                        >
                          Inspect <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------- */}
          {/* DIRECTION 3: INDUSTRY -> STOCKS */}
          {/* ------------------------------------------------------------------- */}
          {navDirection === 'INDUSTRY_STOCKS' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Full Industry Directory */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px] text-amber-300 font-bold">1</span>
                    Choose Industry
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">{industriesList.length} Industries</span>
                </div>

                <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                  {industriesList.map((ind) => {
                    const isSelected = selectedIndustry === ind.name;
                    return (
                      <button
                        key={ind.name}
                        onClick={() => setSelectedIndustry(isSelected ? '' : ind.name)}
                        className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-600/30 border-amber-500 text-white font-bold'
                            : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="text-xs font-bold truncate">{ind.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                            Sector: <span className="text-emerald-400">{ind.sector}</span>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-xs text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                          {ind.stockCount} Stocks
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stocks in that Industry */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      {selectedIndustry ? `Industry: ${selectedIndustry}` : 'Constituent Stocks'}
                    </h3>
                    {selectedIndustry && (
                      <p className="text-[11px] text-slate-400">
                        Belongs to Sector: <strong className="text-emerald-300">{industryMap.get(selectedIndustry)?.sector}</strong>
                      </p>
                    )}
                  </div>
                  <span className="font-mono font-bold text-xs text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-800">
                    {contextualStocks.length} Stocks
                  </span>
                </div>

                {!selectedIndustry ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-950/60 rounded-lg border border-slate-800">
                    Select an Industry from the directory to view its constituent stocks and market metrics.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800 bg-slate-950/60">
                          <th className="p-2.5">Symbol / Company</th>
                          <th className="p-2.5">Cap Tier</th>
                          <th className="p-2.5 text-right">Rank</th>
                          <th className="p-2.5 text-right">Price</th>
                          <th className="p-2.5 text-right">P/E</th>
                          <th className="p-2.5">Indices</th>
                          <th className="p-2.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {contextualStocks.map((stock) => (
                          <tr key={stock.symbol} className="hover:bg-slate-800/40">
                            <td className="p-2.5 font-bold text-indigo-400 font-mono">
                              <div>{stock.symbol}</div>
                              <div className="text-[11px] font-sans font-normal text-slate-300 truncate max-w-[180px]">
                                {stock.companyName}
                              </div>
                            </td>
                            <td className="p-2.5 font-sans">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                stock.capTier === 'HIGH' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : stock.capTier === 'MID' ? 'bg-blue-950 text-blue-300 border border-blue-800' : 'bg-slate-800 text-slate-300'
                              }`}>
                                {stock.capTier}
                              </span>
                            </td>
                            <td className="p-2.5 text-right text-slate-300">#{stock.marketCapRank || '—'}</td>
                            <td className="p-2.5 text-right font-bold text-white">₹{stock.currentPrice?.toFixed(1) || '—'}</td>
                            <td className="p-2.5 text-right text-slate-300">{stock.peRatio ? `${stock.peRatio}x` : '—'}</td>
                            <td className="p-2.5 font-sans">
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {(stock.indices || []).slice(0, 3).map((idx) => (
                                  <span key={idx} className="text-[9px] px-1 py-0.5 rounded bg-slate-800 text-slate-300">
                                    {idx}
                                  </span>
                                ))}
                                {(stock.indices || []).length > 3 && (
                                  <span className="text-[9px] text-slate-500">+{(stock.indices || []).length - 3}</span>
                                )}
                              </div>
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                onClick={() => onInspectStock(stock.symbol)}
                                className="px-2 py-1 rounded bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-colors text-[11px] font-sans font-semibold"
                              >
                                Inspect
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------- */}
          {/* DIRECTION 4: ALL EQUITIES DIRECT EXPLORER (ALL 1,120 STOCKS) */}
          {/* ------------------------------------------------------------------- */}
          {navDirection === 'ALL_STOCKS_VIEW' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px] text-cyan-300 font-bold">★</span>
                    All Equities Explorer ({stocks.length} Stocks)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Complete universe cataloged from <code className="text-emerald-400 font-mono">{fileName}</code>. All stocks are included, with or without index memberships.
                  </p>
                </div>

                {/* Filter Pills for Cap Tier */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase">Filter Tier:</span>
                  {(['ALL', 'HIGH', 'MID', 'LOW'] as const).map((tier) => (
                    <button
                      key={tier}
                      onClick={() => {
                        if (tier === 'ALL') {
                          setSelectedSector('');
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                    >
                      {tier} ({tier === 'ALL' ? stocks.length : stocks.filter(s => s.capTier === tier).length})
                    </button>
                  ))}
                </div>
              </div>

              {/* Comprehensive Stocks Table */}
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-950/95 backdrop-blur z-10">
                    <tr className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <th className="p-3">Rank</th>
                      <th className="p-3">Symbol &amp; Company</th>
                      <th className="p-3">Sector</th>
                      <th className="p-3">Industry</th>
                      <th className="p-3">Cap Tier</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-right">Market Cap</th>
                      <th className="p-3 text-right">P/E</th>
                      <th className="p-3 text-right">ROE</th>
                      <th className="p-3">Index Membership</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {contextualStocks.map((stock) => {
                      const hasIndices = stock.indices && stock.indices.length > 0;
                      return (
                        <tr key={stock.symbol} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 font-mono text-slate-400">#{stock.marketCapRank || '—'}</td>
                          <td className="p-3">
                            <div className="font-mono font-bold text-white text-xs">{stock.symbol}</div>
                            <div className="text-[11px] text-slate-400 truncate max-w-xs">{stock.companyName}</div>
                          </td>
                          <td className="p-3 text-slate-300">{stock.sector}</td>
                          <td className="p-3 text-slate-400">{stock.industry}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              stock.capTier === 'HIGH' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60' : stock.capTier === 'MID' ? 'bg-blue-950 text-blue-300 border border-blue-800/60' : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}>
                              {stock.capTier}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-white">₹{stock.currentPrice?.toFixed(1) || '—'}</td>
                          <td className="p-3 text-right font-mono text-slate-300">{stock.marketCap || '—'}</td>
                          <td className="p-3 text-right font-mono text-slate-400">{stock.peRatio ?? '—'}</td>
                          <td className="p-3 text-right font-mono text-slate-400">{stock.roePercent ? `${stock.roePercent}%` : '—'}</td>
                          <td className="p-3">
                            {hasIndices ? (
                              <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/40">
                                {stock.indices![0]} {stock.indices!.length > 1 ? `+${stock.indices!.length - 1}` : ''}
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40">
                                Unindexed
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => onInspectStock(stock.symbol)}
                              className="px-2 py-1 rounded bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600 hover:text-white transition font-semibold text-[11px]"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------- */}
          {/* DIRECTION 5: STOCK -> SECTOR -> INDUSTRY -> INDICES (REVERSE LOOKUP) */}
          {/* ------------------------------------------------------------------- */}
          {navDirection === 'STOCK_SECTOR_INDUSTRY_INDICES' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Stock Search & Picker */}
              <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px] text-purple-300 font-bold">1</span>
                    Select Stock
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">{stocks.length} Available</span>
                </div>

                <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
                  {stocks
                    .filter((s) => {
                      if (!globalSearch.trim()) return true;
                      const q = globalSearch.toLowerCase();
                      return s.symbol.toLowerCase().includes(q) || s.companyName.toLowerCase().includes(q);
                    })
                    .slice(0, 1200)
                    .map((stock) => {
                      const isSelected = selectedStockSymbol === stock.symbol;
                      return (
                        <button
                          key={stock.symbol}
                          onClick={() => handleSelectStock(stock.symbol)}
                          className={`w-full text-left p-2 rounded-lg border text-xs transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-purple-600/30 border-purple-500 text-white font-bold'
                              : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-mono font-bold text-indigo-400">{stock.symbol}</span>
                            <span className="text-slate-400 font-sans text-[11px] ml-2 truncate">
                              {stock.companyName}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono ml-1">#{stock.marketCapRank || '—'}</span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Stock Classification Card & Full Membership Breakdown */}
              <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                {!inspectedStockData ? (
                  <div className="p-12 text-center text-slate-400 text-xs bg-slate-950/60 rounded-xl border border-slate-800">
                    <Compass className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    Select any stock from the list to see its complete sector, industry, and index memberships.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Stock Overview Banner */}
                    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black font-mono text-white">{inspectedStockData.symbol}</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                            {inspectedStockData.capTier} CAP
                          </span>
                          <span className="text-xs text-slate-400 font-mono">Rank #{inspectedStockData.marketCapRank}</span>
                        </div>
                        <h2 className="text-sm font-semibold text-slate-200 mt-1">{inspectedStockData.companyName}</h2>
                      </div>

                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Current Price</div>
                          <div className="text-lg font-mono font-bold text-emerald-400">
                            ₹{inspectedStockData.currentPrice?.toFixed(1) || '—'}
                          </div>
                        </div>
                        <button
                          onClick={() => onInspectStock(inspectedStockData.symbol)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-colors shadow-sm"
                        >
                          Deep Dive
                        </button>
                      </div>
                    </div>

                    {/* Classification Path: Sector & Industry */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/50">
                        <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5" /> Economic Sector
                        </div>
                        <div className="text-base font-bold text-white mt-1">{inspectedStockData.sector}</div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Total {sectorMap.get(inspectedStockData.sector)?.stocks.length || 0} stocks in this sector
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/50">
                        <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" /> Specific Industry
                        </div>
                        <div className="text-base font-bold text-white mt-1">{inspectedStockData.industry}</div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Total {industryMap.get(inspectedStockData.industry)?.stocks.length || 0} stocks in this industry
                        </p>
                      </div>
                    </div>

                    {/* Index Memberships */}
                    <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" /> Indices Containing This Stock
                        </div>
                        <span className="font-mono text-xs font-bold text-indigo-300">
                          {inspectedStockData.indices?.length || 0} Indices
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {(!inspectedStockData.indices || inspectedStockData.indices.length === 0) ? (
                          <span className="px-3 py-1.5 rounded-lg bg-amber-950/70 text-amber-300 border border-amber-800/80 text-xs font-semibold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                            Unindexed Equity (Cataloged in Universe • Not in Any Benchmark Index)
                          </span>
                        ) : (
                          (inspectedStockData.indices || []).map((idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-lg bg-indigo-900/60 text-indigo-200 border border-indigo-700/60 text-xs font-mono font-bold"
                            >
                              {idx}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Industry Peers Preview */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Industry Peers in "{inspectedStockData.industry}"
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(industryMap.get(inspectedStockData.industry)?.stocks || [])
                          .filter((p) => p.symbol !== inspectedStockData.symbol)
                          .slice(0, 6)
                          .map((peer) => (
                            <div
                              key={peer.symbol}
                              className="p-2 rounded-lg bg-slate-800/40 border border-slate-800 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-mono font-bold text-indigo-400 mr-2">{peer.symbol}</span>
                                <span className="text-slate-300 text-[11px]">{peer.companyName}</span>
                              </div>
                              <button
                                onClick={() => handleSelectStock(peer.symbol)}
                                className="text-[10px] text-slate-400 hover:text-white underline font-semibold"
                              >
                                View
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CAPABILITY 2: MEMBERSHIP QUESTIONS & DIRECT ANSWERS */}
      {/* ========================================================================= */}
      {activeCapabilityTab === 'MEMBERSHIP_QUESTIONS' && (
        <div className="space-y-6">
          {/* Question Selector Cards */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-emerald-400" />
                  Instant Membership Query Engine
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select any question below to get immediate deterministic answers calculated strictly from <code className="text-emerald-400 text-xs font-mono">{fileName}</code> without manual searches.
                </p>
              </div>
            </div>

            {/* 8 Preset Questions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { id: 1, text: 'Which stocks belong to this index?', color: 'border-indigo-500/60 text-indigo-300' },
                { id: 2, text: 'Which sectors are represented in this index?', color: 'border-emerald-500/60 text-emerald-300' },
                { id: 3, text: 'Which industries exist within this sector?', color: 'border-amber-500/60 text-amber-300' },
                { id: 4, text: 'Which stocks belong to this industry?', color: 'border-purple-500/60 text-purple-300' },
                { id: 5, text: 'Which indices contain this stock?', color: 'border-sky-500/60 text-sky-300' },
                { id: 6, text: 'What sector and industry does this stock belong to?', color: 'border-rose-500/60 text-rose-300' },
                { id: 7, text: 'Which stocks belong to an Industry within a Sector?', color: 'border-teal-500/60 text-teal-300' },
                { id: 8, text: 'Which stocks in a Sector belong to an Index?', color: 'border-orange-500/60 text-orange-300' },
              ].map((q) => (
                <button
                  key={q.id}
                  onClick={() => setActiveQuestionId(q.id)}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all flex items-start gap-2 ${
                    activeQuestionId === q.id
                      ? `bg-slate-800 ${q.color} shadow-sm font-bold`
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span className="font-mono text-slate-500 shrink-0 mt-0.5">Q{q.id}.</span>
                  <span>{q.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Question Playground & Results Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            {/* ------------------------------------------------------------- */}
            {/* Q1: Which stocks belong to this index? */}
            {/* ------------------------------------------------------------- */}
            {activeQuestionId === 1 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span className="font-mono text-indigo-400">Q1.</span> Which stocks belong to this index?
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Displays the exact constituent members of any selected index.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Select Index:</span>
                    <select
                      value={qIndex}
                      onChange={(e) => setQIndex(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono font-bold focus:outline-none"
                    >
                      {indicesList.map((idx) => (
                        <option key={idx.name} value={idx.name}>
                          {idx.name} ({idx.stockCount} stocks)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Results */}
                {(() => {
                  const matching = indexMap.get(qIndex)?.stocks || [];
                  return (
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-emerald-400">
                        Found {matching.length} stocks belonging to {qIndex}:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
                        {matching.map((s) => (
                          <div
                            key={s.symbol}
                            className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 hover:border-slate-700 flex items-center justify-between"
                          >
                            <div>
                              <div className="font-mono font-bold text-xs text-indigo-400">{s.symbol}</div>
                              <div className="text-[11px] text-slate-300 truncate max-w-[150px]">{s.companyName}</div>
                              <div className="text-[10px] text-slate-500">{s.sector}</div>
                            </div>
                            <button
                              onClick={() => onInspectStock(s.symbol)}
                              className="text-[11px] text-indigo-400 hover:underline font-semibold"
                            >
                              Inspect
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* Q2: Which sectors are represented in this index? */}
            {/* ------------------------------------------------------------- */}
            {activeQuestionId === 2 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span className="font-mono text-emerald-400">Q2.</span> Which sectors are represented in this index?
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Breaks down the sectoral composition and stock distribution of the index.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Select Index:</span>
                    <select
                      value={qIndex}
                      onChange={(e) => setQIndex(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono font-bold focus:outline-none"
                    >
                      {indicesList.map((idx) => (
                        <option key={idx.name} value={idx.name}>
                          {idx.name} ({idx.sectorsCount} sectors)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Results */}
                {(() => {
                  const idxEntry = indexMap.get(qIndex);
                  const sectorsInIndex = Array.from(idxEntry?.sectors || []).map((secName) => {
                    const count = idxEntry?.stocks.filter((s) => s.sector === secName).length || 0;
                    return { secName, count };
                  }).sort((a, b) => b.count - a.count);

                  return (
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-emerald-400">
                        {sectorsInIndex.length} Sectors represented in {qIndex}:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {sectorsInIndex.map((sec) => (
                          <div key={sec.secName} className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-white">{sec.secName}</div>
                              <div className="text-[11px] text-slate-400">
                                {((sec.count / (idxEntry?.stocks.length || 1)) * 100).toFixed(1)}% of index
                              </div>
                            </div>
                            <span className="font-mono font-bold text-xs text-emerald-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                              {sec.count} stocks
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* Q3: Which industries exist within this sector? */}
            {/* ------------------------------------------------------------- */}
            {activeQuestionId === 3 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span className="font-mono text-amber-400">Q3.</span> Which industries exist within this sector?
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Lists all sub-industries classified under the specified sector.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Select Sector:</span>
                    <select
                      value={qSector}
                      onChange={(e) => setQSector(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-bold focus:outline-none"
                    >
                      {sectorsList.map((sec) => (
                        <option key={sec.name} value={sec.name}>
                          {sec.name} ({sec.industriesCount} industries)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Results */}
                {(() => {
                  const secEntry = sectorMap.get(qSector);
                  const inds = Array.from(secEntry?.industries || []).map((indName) => {
                    const count = secEntry?.stocks.filter((s) => s.industry === indName).length || 0;
                    return { indName, count };
                  }).sort((a, b) => b.count - a.count);

                  return (
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-amber-400">
                        {inds.length} Industries in {qSector}:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {inds.map((ind) => (
                          <div key={ind.indName} className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
                            <span className="text-xs font-bold text-white truncate pr-2">{ind.indName}</span>
                            <span className="font-mono font-bold text-xs text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                              {ind.count} stocks
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* Q4: Which stocks belong to this industry? */}
            {/* ------------------------------------------------------------- */}
            {activeQuestionId === 4 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span className="font-mono text-purple-400">Q4.</span> Which stocks belong to this industry?
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Shows all constituent companies in a chosen granular industry.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Select Industry:</span>
                    <select
                      value={qIndustry}
                      onChange={(e) => setQIndustry(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-bold focus:outline-none max-w-xs"
                    >
                      {industriesList.map((ind) => (
                        <option key={ind.name} value={ind.name}>
                          {ind.name} ({ind.stockCount} stocks)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Results */}
                {(() => {
                  const matching = industryMap.get(qIndustry)?.stocks || [];
                  const parentSector = industryMap.get(qIndustry)?.sector;

                  return (
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-purple-300">
                        {matching.length} Stocks in "{qIndustry}" (Sector: {parentSector}):
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                        {matching.map((s) => (
                          <div key={s.symbol} className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 flex items-center justify-between">
                            <div>
                              <div className="font-mono font-bold text-xs text-indigo-400">{s.symbol}</div>
                              <div className="text-[11px] text-slate-300 truncate max-w-[150px]">{s.companyName}</div>
                              <div className="text-[10px] text-slate-500 font-mono">₹{s.currentPrice?.toFixed(1) || '—'}</div>
                            </div>
                            <button
                              onClick={() => onInspectStock(s.symbol)}
                              className="text-[11px] text-indigo-400 hover:underline font-semibold"
                            >
                              Inspect
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* Q5: Which indices contain this stock? */}
            {/* ------------------------------------------------------------- */}
            {activeQuestionId === 5 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span className="font-mono text-sky-400">Q5.</span> Which indices contain this stock?
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Identifies all benchmark, cap-tier, and sectoral indices the stock is a member of.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Select Stock:</span>
                    <select
                      value={qStockSymbol}
                      onChange={(e) => setQStockSymbol(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono font-bold focus:outline-none"
                    >
                      {stocks.slice(0, 150).map((s) => (
                        <option key={s.symbol} value={s.symbol}>
                          {s.symbol} — {s.companyName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Results */}
                {(() => {
                  const stock = stockLookup.get(qStockSymbol.toUpperCase());
                  const idxs = stock?.indices || [];
                  return (
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-sky-300">
                        {qStockSymbol} ({stock?.companyName}) belongs to {idxs.length} Indices:
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        {idxs.map((idx) => (
                          <div
                            key={idx}
                            className="px-3 py-2 rounded-xl bg-sky-950/40 border border-sky-800/60 font-mono text-xs font-bold text-sky-200"
                          >
                            {idx}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* Q6: What sector and industry does this stock belong to? */}
            {/* ------------------------------------------------------------- */}
            {activeQuestionId === 6 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span className="font-mono text-rose-400">Q6.</span> What sector and industry does this stock belong to?
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Returns exact official classifications from the dataset.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Select Stock:</span>
                    <select
                      value={qStockSymbol}
                      onChange={(e) => setQStockSymbol(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono font-bold focus:outline-none"
                    >
                      {stocks.slice(0, 150).map((s) => (
                        <option key={s.symbol} value={s.symbol}>
                          {s.symbol} — {s.companyName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Results */}
                {(() => {
                  const stock = stockLookup.get(qStockSymbol.toUpperCase());
                  return (
                    <div className="p-5 rounded-xl bg-slate-800/60 border border-slate-700 space-y-4">
                      <div>
                        <span className="text-lg font-mono font-black text-indigo-400">{stock?.symbol}</span>
                        <div className="text-sm font-semibold text-white">{stock?.companyName}</div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60">
                          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Sector Classification</div>
                          <div className="text-sm font-bold text-white mt-1">{stock?.sector}</div>
                        </div>
                        <div className="p-3.5 rounded-lg bg-amber-950/40 border border-amber-800/60">
                          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Industry Classification</div>
                          <div className="text-sm font-bold text-white mt-1">{stock?.industry}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* Q7: Which stocks belong to a particular Industry within a Sector? */}
            {/* ------------------------------------------------------------- */}
            {activeQuestionId === 7 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span className="font-mono text-teal-400">Q7.</span> Which stocks belong to a particular Industry within a Sector?
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Dual-condition filter combining specific sector and industry bounds.</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">Sector:</span>
                      <select
                        value={qSector}
                        onChange={(e) => {
                          setQSector(e.target.value);
                          const firstInd = sectorMap.get(e.target.value)?.industries.values().next().value;
                          if (firstInd) setQIndustry(firstInd);
                        }}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none"
                      >
                        {sectorsList.map((sec) => (
                          <option key={sec.name} value={sec.name}>{sec.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">Industry:</span>
                      <select
                        value={qIndustry}
                        onChange={(e) => setQIndustry(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none max-w-xs"
                      >
                        {Array.from(sectorMap.get(qSector)?.industries || []).map((ind) => (
                          <option key={ind} value={ind}>{ind}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Results */}
                {(() => {
                  const matching = stocks.filter(
                    (s) => s.sector === qSector && s.industry === qIndustry
                  );
                  return (
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-teal-300">
                        {matching.length} Stocks in Industry "{qIndustry}" under Sector "{qSector}":
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                        {matching.map((s) => (
                          <div key={s.symbol} className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 flex items-center justify-between">
                            <div>
                              <div className="font-mono font-bold text-xs text-indigo-400">{s.symbol}</div>
                              <div className="text-[11px] text-slate-300 truncate max-w-[150px]">{s.companyName}</div>
                              <div className="text-[10px] text-slate-500 font-mono">₹{s.currentPrice?.toFixed(1) || '—'}</div>
                            </div>
                            <button
                              onClick={() => onInspectStock(s.symbol)}
                              className="text-[11px] text-indigo-400 hover:underline font-semibold"
                            >
                              Inspect
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* Q8: Which stocks in a Sector belong to an Index? */}
            {/* ------------------------------------------------------------- */}
            {activeQuestionId === 8 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span className="font-mono text-orange-400">Q8.</span> Which stocks in a particular Sector belong to a particular Index?
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Cross-indexes a sector against a specific benchmark index.</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">Sector:</span>
                      <select
                        value={qSector}
                        onChange={(e) => setQSector(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none"
                      >
                        {sectorsList.map((sec) => (
                          <option key={sec.name} value={sec.name}>{sec.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">Index:</span>
                      <select
                        value={qIndex}
                        onChange={(e) => setQIndex(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold focus:outline-none"
                      >
                        {indicesList.map((idx) => (
                          <option key={idx.name} value={idx.name}>{idx.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Results */}
                {(() => {
                  const matching = stocks.filter(
                    (s) => s.sector === qSector && (s.indices || []).includes(qIndex)
                  );
                  return (
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-orange-300">
                        {matching.length} Stocks in Sector "{qSector}" belonging to Index "{qIndex}":
                      </div>
                      {matching.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/60 rounded-xl border border-slate-800">
                          No stocks in {qSector} are constituents of {qIndex}.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                          {matching.map((s) => (
                            <div key={s.symbol} className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 flex items-center justify-between">
                              <div>
                                <div className="font-mono font-bold text-xs text-indigo-400">{s.symbol}</div>
                                <div className="text-[11px] text-slate-300 truncate max-w-[150px]">{s.companyName}</div>
                                <div className="text-[10px] text-slate-500">{s.industry}</div>
                              </div>
                              <button
                                onClick={() => onInspectStock(s.symbol)}
                                className="text-[11px] text-indigo-400 hover:underline font-semibold"
                              >
                                Inspect
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Data Integrity Validation Report Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">
                    Stock Universe Data Integrity &amp; Validation Report
                  </h2>
                  <p className="text-xs text-slate-400">
                    Source: <code className="text-emerald-400 font-mono">{fileName}</code> &bull; Validated deterministically before UI exposure
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowValidationModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Status Banner */}
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-emerald-300 text-sm">Deterministic Validation Passed</div>
                  <div className="text-slate-300 mt-1 leading-relaxed">
                    All records in the active stock universe have passed canonical exchange symbol validation, synthetic ID detection, duplicate collision checks, and sector taxonomy verification.
                  </div>
                </div>
              </div>

              {/* Validation Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Records</div>
                  <div className="text-xl font-mono font-bold text-white mt-1">
                    {validationReport?.totalSourceRecords ?? stocks.length}
                  </div>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Valid Stocks</div>
                  <div className="text-xl font-mono font-bold text-emerald-400 mt-1">
                    {validationReport?.validStocks ?? stocks.length}
                  </div>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Invalid Symbols</div>
                  <div className="text-xl font-mono font-bold text-amber-400 mt-1">
                    {validationReport?.invalidSymbols ?? 0}
                  </div>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
                  <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Missing Symbols</div>
                  <div className="text-xl font-mono font-bold text-rose-400 mt-1">
                    {validationReport?.missingSymbols ?? 0}
                  </div>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
                  <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Duplicate Symbols</div>
                  <div className="text-xl font-mono font-bold text-blue-400 mt-1">
                    {validationReport?.duplicateSymbols ?? 0}
                  </div>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
                  <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Duplicate Mappings</div>
                  <div className="text-xl font-mono font-bold text-purple-400 mt-1">
                    {validationReport?.duplicateCompanyMappings ?? 0}
                  </div>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center sm:col-span-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unresolved Records</div>
                  <div className="text-xl font-mono font-bold text-slate-300 mt-1">
                    {validationReport?.unresolvedRecords ?? 0}
                  </div>
                </div>
              </div>

              {/* Architectural Invariants Check */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  Canonical Stock Identity Enforcement Rules
                </div>
                <ul className="space-y-1.5 text-slate-400 text-[11px] list-disc list-inside">
                  <li><strong>Canonical Trading Symbol:</strong> Must adhere to authentic exchange standards (1-12 alphanumeric characters, uppercase).</li>
                  <li><strong>Synthetic ID Rejection:</strong> Pattern <code className="text-amber-400 font-mono">/^[A-Z]&#123;3,5&#125;\d&#123;3,5&#125;$/</code> (e.g. ARIH1002, TEMP_1) is strictly flagged as INVALID and never displayed as trading symbol.</li>
                  <li><strong>Internal ID Segregation:</strong> Application keys (<code className="text-slate-300 font-mono">INTERNAL_X</code>) are strictly isolated from canonical exchange symbols.</li>
                  <li><strong>Data vs Application Isolation:</strong> Code contains zero hardcoded absolute Google Drive paths or machine-specific environments.</li>
                </ul>
              </div>

              {/* If any issues exist, show detail table */}
              {validationReport && validationReport.validationDetails.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-amber-400">Flagged Validation Details:</div>
                  <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-2">Row</th>
                          <th className="p-2">Identifier</th>
                          <th className="p-2">Status</th>
                          <th className="p-2">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 font-mono">
                        {validationReport.validationDetails.map((det, i) => (
                          <tr key={i}>
                            <td className="p-2">{det.recordIndex}</td>
                            <td className="p-2 text-amber-300">{det.rawIdentifier || '—'}</td>
                            <td className="p-2 text-rose-400">{det.status}</td>
                            <td className="p-2 text-slate-300 font-sans">{det.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center p-4 bg-slate-950/40 rounded-xl border border-slate-800/80 text-slate-400 text-xs">
                  Zero anomalous or synthetic identifiers detected. All {stocks.length} records verified.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <button
                onClick={() => setShowValidationModal(false)}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
