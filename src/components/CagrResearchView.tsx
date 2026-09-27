import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  Search,
  Filter,
  Layers,
  Building2,
  PieChart,
  Download,
  Info,
  ArrowUpRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Activity,
  Zap,
} from 'lucide-react';
import { StockEquity, StockCagrRecord, SectorCagrRecord, IndustryCagrRecord } from '../types/equity';
import {
  buildStockCagrDataset,
  calculateSectorCagrDataset,
  calculateIndustryCagrDataset,
} from '../engine/quantitativeMath';
import { CagrEngine } from '../engine/cagrEngine';
import {
  subscribeHistoricalDataStore,
  getHistoricalBars,
  getAllLoadedSymbols,
  getTotalHistoricalBarsCount,
} from '../services/historicalDataStore';

interface CagrResearchViewProps {
  stocks: StockEquity[];
  onInspectStock: (symbol: string) => void;
  onExportDriveJson?: () => void;
}

type StockSortKey =
  | 'symbol'
  | 'companyName'
  | 'sector'
  | 'industry'
  | 'marketCapRank'
  | 'currentPrice'
  | 'cagr15Y'
  | 'cagr10Y'
  | 'cagr5Y'
  | 'cagr3Y'
  | 'cagr1Y'
  | 'rsiLe30Touches'
  | 'rsi30To35Touches'
  | 'ema100Touches'
  | 'ema200Touches'
  | 'ema400Touches'
  | 'ema500Touches';

export const CagrResearchView: React.FC<CagrResearchViewProps> = ({
  stocks,
  onInspectStock,
  onExportDriveJson,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'stocks' | 'sectors' | 'industries'>('stocks');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHorizon, setSelectedHorizon] = useState<'1Y' | '3Y' | '5Y' | '10Y' | '15Y'>('5Y');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('ALL');
  const [onlyNifty50, setOnlyNifty50] = useState<boolean>(false);

  // Sorting state for Stock-Level table
  const [sortField, setSortField] = useState<StockSortKey>('marketCapRank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Trigger re-computation on store updates
  const [storeVersion, setStoreVersion] = useState(0);
  useEffect(() => {
    return subscribeHistoricalDataStore(() => {
      setStoreVersion((v) => v + 1);
    });
  }, []);

  // Compute structured datasets deterministically from verified OHLCV
  const stocksCagr = useMemo(() => {
    const dataset = buildStockCagrDataset(stocks);
    const lupin = dataset.find((r) => r.symbol?.toUpperCase() === 'LUPIN');
    console.log('[RUNTIME TRACE] buildStockCagrDataset LUPIN:', lupin);
    return dataset;
  }, [stocks, storeVersion]);

  const sectorCagr = useMemo(() => {
    return calculateSectorCagrDataset(stocks, stocksCagr);
  }, [stocks, stocksCagr]);

  const industryCagr = useMemo(() => {
    return calculateIndustryCagrDataset(stocks, stocksCagr);
  }, [stocks, stocksCagr]);

  // Unique sector names for filter dropdown
  const sectorNames = useMemo(() => {
    return Array.from(new Set(stocks.map((s) => s.sector))).sort();
  }, [stocks]);

  // Filtered & Sorted Stocks CAGR
  const filteredSortedStocks = useMemo(() => {
    const filtered = stocksCagr.filter((item) => {
      const matchesSearch =
        item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sector.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.industry.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSector =
        selectedSectorFilter === 'ALL' || item.sector === selectedSectorFilter;

      const matchesNifty50 = !onlyNifty50 || (item.marketCapRank && item.marketCapRank <= 50);

      return matchesSearch && matchesSector && matchesNifty50;
    });

    return [...filtered].sort((a, b) => {
      const valA = (a as any)[sortField];
      const valB = (b as any)[sortField];

      // Handle nulls: always place nulls at the end
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'string' && typeof valB === 'string') {
        const comp = valA.localeCompare(valB);
        return sortDirection === 'asc' ? comp : -comp;
      }

      const numA = Number(valA);
      const numB = Number(valB);
      if (isNaN(numA)) return 1;
      if (isNaN(numB)) return -1;

      return sortDirection === 'asc' ? numA - numB : numB - numA;
    });
  }, [stocksCagr, searchQuery, selectedSectorFilter, onlyNifty50, sortField, sortDirection]);

  // Filtered Sectors
  const filteredSectors = useMemo(() => {
    return sectorCagr.filter((s) =>
      s.sector.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sectorCagr, searchQuery]);

  // Filtered Industries
  const filteredIndustries = useMemo(() => {
    return industryCagr.filter(
      (ind) =>
        (ind.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ind.sector.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (selectedSectorFilter === 'ALL' || ind.sector === selectedSectorFilter)
    );
  }, [industryCagr, searchQuery, selectedSectorFilter]);

  const handleSort = (field: StockSortKey) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      // Default to descending for CAGR and touches, ascending for rank / names
      if (field.startsWith('cagr') || field.includes('Touches')) {
        setSortDirection('desc');
      } else {
        setSortDirection('asc');
      }
    }
  };

  const renderSortHeader = (label: string, field: StockSortKey, align: 'left' | 'center' | 'right' = 'right', className = '') => {
    const isActive = sortField === field;
    return (
      <th
        onClick={() => handleSort(field)}
        className={`py-3.5 px-3 cursor-pointer select-none transition-colors hover:bg-slate-800/80 ${
          align === 'left' ? 'text-left' : align === 'center' ? 'text-center' : 'text-right'
        } ${isActive ? 'text-emerald-400 font-bold bg-slate-800/50' : 'text-slate-400'} ${className}`}
      >
        <div className={`inline-flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
          <span>{label}</span>
          {isActive ? (
            sortDirection === 'asc' ? (
              <ArrowUp className="w-3.5 h-3.5 text-emerald-400 inline" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-emerald-400 inline" />
            )
          ) : (
            <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-60 inline" />
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Mission Statement */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                DETERMINISTIC QUANTITATIVE RESEARCH
              </span>
              <span className="text-xs text-slate-400">15Y / 10Y / 5Y / 3Y / 1Y Historical Matrices</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
              Historical Compound Annual Growth Rate (CAGR) & Event Engine
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-3xl">
              Deterministic historical CAGR compounding engine with clustered independent event touch counters. Sector CAGR evaluates the <strong>Top 50 companies</strong> by market cap. Industry CAGR evaluates the <strong>Top 25 constituents</strong> with sample size disclosures.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onExportDriveJson && (
              <button
                onClick={onExportDriveJson}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                Export Structured DB
              </button>
            )}
          </div>
        </div>

        {/* Sub-tab switcher */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveSubTab('stocks')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'stocks'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Stock-Level CAGR & Touches ({filteredSortedStocks.length})
          </button>
          <button
            onClick={() => setActiveSubTab('sectors')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'sectors'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <PieChart className="w-4 h-4" />
            Sector Top 50 CAGR ({filteredSectors.length})
          </button>
          <button
            onClick={() => setActiveSubTab('industries')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'industries'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Industry Top 25 CAGR ({filteredIndustries.length})
          </button>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                activeSubTab === 'stocks'
                  ? 'Search symbol, company, sector, industry...'
                  : activeSubTab === 'sectors'
                  ? 'Search sector name...'
                  : 'Search industry or sector...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {(activeSubTab === 'stocks' || activeSubTab === 'industries') && (
            <select
              value={selectedSectorFilter}
              onChange={(e) => setSelectedSectorFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">All Sectors (18)</option>
              {sectorNames.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          )}

          {activeSubTab === 'stocks' && (
            <button
              onClick={() => setOnlyNifty50(!onlyNifty50)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                onlyNifty50
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-700'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              NIFTY 50 Only
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Primary Focus:</span>
          {(['1Y', '3Y', '5Y', '10Y', '15Y'] as const).map((hz) => (
            <button
              key={hz}
              onClick={() => {
                setSelectedHorizon(hz);
                handleSort(`cagr${hz}` as StockSortKey);
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded transition cursor-pointer ${
                selectedHorizon === hz
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {hz}
            </button>
          ))}
        </div>
      </div>

      {/* PHASE 6 RUNTIME DIAGNOSTIC MONITOR */}
      {(() => {
        const lupinBars = getHistoricalBars('LUPIN');
        const lupinRecord = stocksCagr.find((s) => s.symbol.toUpperCase() === 'LUPIN');
        const loadedSymbols = getAllLoadedSymbols();
        const totalBarsCount = getTotalHistoricalBarsCount();

        return (
          <div className="bg-slate-950/90 border border-emerald-500/40 rounded-xl p-4 text-xs font-mono shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>RUNTIME DATA-FLOW DIAGNOSTIC MONITOR (LUPIN & STORE)</span>
              </div>
              <div className="text-slate-400 text-[11px] flex items-center gap-3">
                <span>Loaded Symbols: <strong className="text-white">{loadedSymbols.length}</strong></span>
                <span>•</span>
                <span>Total Store Bars: <strong className="text-white">{totalBarsCount.toLocaleString('en-IN')}</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-[11px]">
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">LUPIN Raw Bars</div>
                <div className="text-white font-bold text-xs">{lupinBars.length > 0 ? `${lupinBars.length} bars` : '0 bars (Upload Parquet)'}</div>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">15Y CAGR</div>
                <div className="text-emerald-400 font-bold">{lupinRecord?.cagr15Y !== null && lupinRecord?.cagr15Y !== undefined ? `${lupinRecord.cagr15Y}%` : 'N/A'}</div>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">10Y CAGR</div>
                <div className="text-emerald-400 font-bold">{lupinRecord?.cagr10Y !== null && lupinRecord?.cagr10Y !== undefined ? `${lupinRecord.cagr10Y}%` : 'N/A'}</div>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">5Y CAGR</div>
                <div className="text-emerald-400 font-bold">{lupinRecord?.cagr5Y !== null && lupinRecord?.cagr5Y !== undefined ? `${lupinRecord.cagr5Y}%` : 'N/A'}</div>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">3Y CAGR</div>
                <div className="text-emerald-400 font-bold">{lupinRecord?.cagr3Y !== null && lupinRecord?.cagr3Y !== undefined ? `${lupinRecord.cagr3Y}%` : 'N/A'}</div>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">1Y CAGR</div>
                <div className="text-emerald-400 font-bold">{lupinRecord?.cagr1Y !== null && lupinRecord?.cagr1Y !== undefined ? `${lupinRecord.cagr1Y}%` : 'N/A'}</div>
              </div>

              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <div className="text-amber-400 text-[10px]">RSI ≤30 Touches</div>
                <div className="text-amber-300 font-bold">{lupinRecord?.rsiLe30Touches !== undefined ? lupinRecord.rsiLe30Touches : 0}</div>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <div className="text-amber-400 text-[10px]">RSI 30-35 Touches</div>
                <div className="text-amber-300 font-bold">{lupinRecord?.rsi30To35Touches !== undefined ? lupinRecord.rsi30To35Touches : 0}</div>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <div className="text-sky-400 text-[10px]">EMA 100 Touches</div>
                <div className="text-sky-300 font-bold">{lupinRecord?.ema100Touches !== undefined ? lupinRecord.ema100Touches : 0}</div>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <div className="text-sky-400 text-[10px]">EMA 200 Touches</div>
                <div className="text-sky-300 font-bold">{lupinRecord?.ema200Touches !== undefined ? lupinRecord.ema200Touches : 0}</div>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <div className="text-indigo-400 text-[10px]">EMA 400 Touches</div>
                <div className="text-indigo-300 font-bold">{lupinRecord?.ema400Touches !== undefined ? lupinRecord.ema400Touches : 0}</div>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <div className="text-indigo-400 text-[10px]">EMA 500 Touches</div>
                <div className="text-indigo-300 font-bold">{lupinRecord?.ema500Touches !== undefined ? lupinRecord.ema500Touches : 0}</div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB 1: STOCK-LEVEL CAGR & TOUCHES TABLE */}
      {activeSubTab === 'stocks' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  {renderSortHeader('Stock / Symbol', 'symbol', 'left', 'pl-4 min-w-[170px]')}
                  {renderSortHeader('Sector & Industry', 'sector', 'left', 'min-w-[160px]')}
                  {renderSortHeader('Rank', 'marketCapRank', 'center')}
                  {renderSortHeader('Ref Price', 'currentPrice', 'right')}
                  {renderSortHeader('15Y CAGR', 'cagr15Y', 'right')}
                  {renderSortHeader('10Y CAGR', 'cagr10Y', 'right')}
                  {renderSortHeader('5Y CAGR', 'cagr5Y', 'right', 'bg-emerald-950/20 text-emerald-400 font-bold')}
                  {renderSortHeader('3Y CAGR', 'cagr3Y', 'right')}
                  {renderSortHeader('1Y CAGR', 'cagr1Y', 'right')}
                  {renderSortHeader('RSI ≤30', 'rsiLe30Touches', 'center', 'text-amber-300 bg-amber-950/20')}
                  {renderSortHeader('RSI 30-35', 'rsi30To35Touches', 'center', 'text-amber-400 bg-amber-950/10')}
                  {renderSortHeader('EMA 100', 'ema100Touches', 'center', 'text-sky-300')}
                  {renderSortHeader('EMA 200', 'ema200Touches', 'center', 'text-sky-400 font-bold')}
                  {renderSortHeader('EMA 400', 'ema400Touches', 'center', 'text-indigo-300')}
                  {renderSortHeader('EMA 500', 'ema500Touches', 'center', 'text-indigo-400')}
                  <th className="py-3.5 px-3 text-center text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSortedStocks.slice(0, 100).map((row) => (
                  <tr key={row.symbol} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-4">
                      <div className="font-mono font-bold text-white flex items-center gap-1.5">
                        {row.symbol}
                        {row.marketCapRank && row.marketCapRank <= 50 && (
                          <span className="px-1 py-0.2 text-[9px] bg-blue-900/60 text-blue-300 rounded border border-blue-700/50">
                            N50
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[160px]">{row.companyName}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="text-xs font-medium text-slate-300 truncate max-w-[150px]">{row.sector}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{row.industry}</div>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                          row.capTier === 'HIGH'
                            ? 'bg-blue-950 text-blue-400 border border-blue-800/50'
                            : row.capTier === 'MID'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800/50'
                            : 'bg-purple-950 text-purple-400 border border-purple-800/50'
                        }`}
                      >
                        #{row.marketCapRank || '—'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-200">
                      ₹{row.currentPrice?.toLocaleString('en-IN') || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium">
                      {row.cagr15Y !== null && row.cagr15Y !== undefined ? (
                        <span className={row.cagr15Y >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {row.cagr15Y > 0 ? `+${row.cagr15Y}%` : `${row.cagr15Y}%`}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono text-xs">N/A</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium">
                      {row.cagr10Y !== null && row.cagr10Y !== undefined ? (
                        <span className={row.cagr10Y >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {row.cagr10Y > 0 ? `+${row.cagr10Y}%` : `${row.cagr10Y}%`}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono text-xs">N/A</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold bg-emerald-950/20">
                      {row.cagr5Y !== null && row.cagr5Y !== undefined ? (
                        <span className={row.cagr5Y >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {row.cagr5Y > 0 ? `+${row.cagr5Y}%` : `${row.cagr5Y}%`}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono text-xs">N/A</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium">
                      {row.cagr3Y !== null && row.cagr3Y !== undefined ? (
                        <span className={row.cagr3Y >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {row.cagr3Y > 0 ? `+${row.cagr3Y}%` : `${row.cagr3Y}%`}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono text-xs">N/A</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium">
                      {row.cagr1Y !== null && row.cagr1Y !== undefined ? (
                        <span className={row.cagr1Y >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {row.cagr1Y > 0 ? `+${row.cagr1Y}%` : `${row.cagr1Y}%`}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono text-xs">N/A</span>
                      )}
                    </td>
                    {/* RSI Event Touches */}
                    <td className="py-2.5 px-2 text-center font-mono font-bold text-amber-300 bg-amber-950/20">
                      {row.rsiLe30Touches !== undefined && row.rsiLe30Touches !== null ? row.rsiLe30Touches : 0}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-semibold text-amber-400 bg-amber-950/10">
                      {row.rsi30To35Touches !== undefined && row.rsi30To35Touches !== null ? row.rsi30To35Touches : 0}
                    </td>
                    {/* EMA Event Touches */}
                    <td className="py-2.5 px-2 text-center font-mono text-sky-300">
                      {row.ema100Touches !== undefined && row.ema100Touches !== null ? row.ema100Touches : 0}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-bold text-sky-400 bg-sky-950/20">
                      {row.ema200Touches !== undefined && row.ema200Touches !== null ? row.ema200Touches : 0}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-indigo-300">
                      {row.ema400Touches !== undefined && row.ema400Touches !== null ? row.ema400Touches : 0}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-indigo-400">
                      {row.ema500Touches !== undefined && row.ema500Touches !== null ? row.ema500Touches : 0}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onInspectStock(row.symbol)}
                        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 rounded transition cursor-pointer"
                        title="Deep Dive Inspector"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredSortedStocks.length > 100 && (
            <div className="p-3 text-center text-xs text-slate-500 bg-slate-950/50 border-t border-slate-800">
              Showing top 100 matching stocks of {filteredSortedStocks.length} records. Use column sorting or search to navigate the full universe.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SECTOR TOP 50 CAGR TABLE */}
      {activeSubTab === 'sectors' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-300">
              Sector CAGR is computed using the <strong>Top 50 companies by market capitalization</strong> within each sector to ensure blue-chip compounding fidelity.
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Sector Name</th>
                  <th className="py-3.5 px-3 text-center">Constituents</th>
                  <th className="py-3.5 px-3 text-center">Top 50 Used</th>
                  <th className="py-3.5 px-4 text-right">15Y Median</th>
                  <th className="py-3.5 px-4 text-right">10Y Median</th>
                  <th className="py-3.5 px-4 text-right bg-emerald-950/20 text-emerald-400 font-bold">5Y Median</th>
                  <th className="py-3.5 px-4 text-right">3Y Median</th>
                  <th className="py-3.5 px-4 text-right">1Y Median</th>
                  <th className="py-3.5 px-4 text-right">Top 50 Market Cap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSectors.map((sec) => (
                  <tr key={sec.sector} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-400" />
                      {sec.sector}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-400">
                      {sec.totalConstituents}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-emerald-400 font-bold">
                      {sec.top50ConstituentsUsed}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-400">
                      {sec.cagr15Y !== null ? (sec.cagr15Y > 0 ? `+${sec.cagr15Y}%` : `${sec.cagr15Y}%`) : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-300">
                      {sec.cagr10Y !== null ? (sec.cagr10Y > 0 ? `+${sec.cagr10Y}%` : `${sec.cagr10Y}%`) : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold bg-emerald-950/20 text-emerald-400">
                      {sec.cagr5Y !== null ? (sec.cagr5Y > 0 ? `+${sec.cagr5Y}%` : `${sec.cagr5Y}%`) : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium">
                      {sec.cagr3Y !== null ? (sec.cagr3Y > 0 ? `+${sec.cagr3Y}%` : `${sec.cagr3Y}%`) : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium">
                      {sec.cagr1Y !== null ? (sec.cagr1Y > 0 ? `+${sec.cagr1Y}%` : `${sec.cagr1Y}%`) : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                      ₹{sec.totalMarketCapCr.toLocaleString('en-IN')} Cr
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: INDUSTRY TOP 25 CAGR TABLE */}
      {activeSubTab === 'industries' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-300">
              Industry CAGR evaluates the <strong>Top 25 constituents</strong> by market cap. Where fewer than 25 constituents exist, all available members are used with explicit sample size disclosures.
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Industry Name</th>
                  <th className="py-3.5 px-4">Parent Sector</th>
                  <th className="py-3.5 px-3 text-center">Total</th>
                  <th className="py-3.5 px-3 text-center">Used</th>
                  <th className="py-3.5 px-4">Sample Size Disclosure</th>
                  <th className="py-3.5 px-4 text-right">15Y CAGR</th>
                  <th className="py-3.5 px-4 text-right">10Y CAGR</th>
                  <th className="py-3.5 px-4 text-right bg-emerald-950/20 text-emerald-400 font-bold">5Y CAGR</th>
                  <th className="py-3.5 px-4 text-right">3Y CAGR</th>
                  <th className="py-3.5 px-4 text-right">1Y CAGR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredIndustries.map((ind) => (
                  <tr key={ind.industry} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {ind.industry}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {ind.sector}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-400">
                      {ind.totalConstituents}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-emerald-400 font-bold">
                      {ind.top25ConstituentsUsed}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          ind.top25ConstituentsUsed >= 25
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                            : 'bg-amber-950/60 text-amber-400 border border-amber-800/50'
                        }`}
                      >
                        {ind.sampleSizeDisclosure}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-400">
                      {ind.cagr15Y !== null ? (ind.cagr15Y > 0 ? `+${ind.cagr15Y}%` : `${ind.cagr15Y}%`) : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-300">
                      {ind.cagr10Y !== null ? (ind.cagr10Y > 0 ? `+${ind.cagr10Y}%` : `${ind.cagr10Y}%`) : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold bg-emerald-950/20 text-emerald-400">
                      {ind.cagr5Y !== null ? (ind.cagr5Y > 0 ? `+${ind.cagr5Y}%` : `${ind.cagr5Y}%`) : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium">
                      {ind.cagr3Y !== null ? (ind.cagr3Y > 0 ? `+${ind.cagr3Y}%` : `${ind.cagr3Y}%`) : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium">
                      {ind.cagr1Y !== null ? (ind.cagr1Y > 0 ? `+${ind.cagr1Y}%` : `${ind.cagr1Y}%`) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
