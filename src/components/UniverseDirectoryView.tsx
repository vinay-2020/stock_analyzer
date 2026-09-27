import React, { useState, useMemo, useEffect } from 'react';
import {
  Database,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  PieChart,
  Layers,
  Building2,
  TrendingUp,
} from 'lucide-react';
import { StockEquity, MarketCapTier, StockCagrRecord } from '../types/equity';
import { buildStockCagrDataset } from '../engine/quantitativeMath';
import { subscribeHistoricalDataStore } from '../services/historicalDataStore';

interface Props {
  stocks: StockEquity[];
  selectedCapTier: MarketCapTier | 'ALL';
  onSelectCapTier: (tier: MarketCapTier | 'ALL') => void;
  onInspectStock: (symbol: string) => void;
}

type SortField =
  | 'symbol'
  | 'companyName'
  | 'sector'
  | 'industry'
  | 'capTier'
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

export const UniverseDirectoryView: React.FC<Props> = ({
  stocks,
  selectedCapTier,
  onSelectCapTier,
  onInspectStock,
}) => {
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('marketCapRank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Trigger re-computation on store updates
  const [storeVersion, setStoreVersion] = useState(0);
  useEffect(() => {
    return subscribeHistoricalDataStore(() => {
      setStoreVersion((v) => v + 1);
    });
  }, []);

  // Compute calculated metrics directly from historicalDataStore
  const stocksDataset = useMemo(() => {
    return buildStockCagrDataset(stocks);
  }, [stocks, storeVersion]);

  // Sectors list
  const sectors = useMemo(() => {
    const set = new Set<string>();
    stocks.forEach((s) => set.add(s.sector));
    return Array.from(set).sort();
  }, [stocks]);

  const filteredStocks = useMemo(() => {
    return stocksDataset.filter((s) => {
      if (selectedCapTier !== 'ALL' && s.capTier !== selectedCapTier) return false;
      if (selectedSector !== 'ALL' && s.sector !== selectedSector) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !s.symbol.toLowerCase().includes(q) &&
          !s.companyName.toLowerCase().includes(q) &&
          !s.sector.toLowerCase().includes(q) &&
          !s.industry.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [stocksDataset, selectedCapTier, selectedSector, searchQuery]);

  const sortedStocks = useMemo(() => {
    return [...filteredStocks].sort((a, b) => {
      const valA = (a as any)[sortField];
      const valB = (b as any)[sortField];

      // Always sort nulls to bottom
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
  }, [filteredStocks, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      if (field.startsWith('cagr') || field.includes('Touches')) {
        setSortDirection('desc');
      } else {
        setSortDirection('asc');
      }
    }
  };

  const renderSortHeader = (label: string, field: SortField, align: 'left' | 'center' | 'right' = 'right', className = '') => {
    const isActive = sortField === field;
    return (
      <th
        onClick={() => handleSort(field)}
        className={`py-3 px-2 cursor-pointer select-none transition-colors hover:bg-slate-800 ${
          align === 'left' ? 'text-left' : align === 'center' ? 'text-center' : 'text-right'
        } ${isActive ? 'text-emerald-400 font-bold bg-slate-800/80' : 'text-slate-400'} ${className}`}
      >
        <div className={`inline-flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
          <span>{label}</span>
          {isActive ? (
            sortDirection === 'asc' ? (
              <ArrowUp className="w-3 h-3 text-emerald-400 inline" />
            ) : (
              <ArrowDown className="w-3 h-3 text-emerald-400 inline" />
            )
          ) : (
            <ArrowUpDown className="w-2.5 h-2.5 text-slate-500 opacity-60 inline" />
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase bg-slate-800 text-slate-300 border border-slate-700">
                Universe Master
              </span>
              <h2 className="text-xl font-bold text-white">
                Selected Research Universe ({stocks.length.toLocaleString('en-IN')} Indian Stocks)
              </h2>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Deterministic research engine with live calculated historical CAGR compounding and clustered independent RSI/EMA event touches.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Total Tracked:</span>
            <span className="text-sm font-bold text-white bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
              {stocks.length.toLocaleString('en-IN')} Equities
            </span>
          </div>
        </div>

        {/* Cap Tier Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800">
          <div
            onClick={() => onSelectCapTier('HIGH')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              selectedCapTier === 'HIGH'
                ? 'bg-indigo-950/80 border-indigo-500 shadow-sm'
                : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-indigo-300">01_HIGH_CAP (Top ~100)</span>
              <span className="text-[10px] bg-indigo-900/60 text-indigo-300 px-1.5 py-0.5 rounded">
                Tier 1
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Large-cap bellwethers (Reliance, TCS, HDFC Bank, Infosys, etc.)
            </p>
          </div>

          <div
            onClick={() => onSelectCapTier('MID')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              selectedCapTier === 'MID'
                ? 'bg-amber-950/80 border-amber-500 shadow-sm'
                : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-300">02_MID_CAP (~350 stocks)</span>
              <span className="text-[10px] bg-amber-900/60 text-amber-300 px-1.5 py-0.5 rounded">
                Tier 2
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              High-growth mid-cap market leaders
            </p>
          </div>

          <div
            onClick={() => onSelectCapTier('LOW')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              selectedCapTier === 'LOW'
                ? 'bg-purple-950/80 border-purple-500 shadow-sm'
                : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-purple-300">03_LOW_CAP (Small/Micro Cap)</span>
              <span className="text-[10px] bg-purple-900/60 text-purple-300 px-1.5 py-0.5 rounded">
                Tier 3
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Emerging and small-cap research universe
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search symbol, company, sector, industry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Sector:</span>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Sectors ({sectors.length})</option>
              {sectors.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Tier:</span>
            <select
              value={selectedCapTier}
              onChange={(e) => onSelectCapTier(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Tiers</option>
              <option value="HIGH">High-Cap Only</option>
              <option value="MID">Mid-Cap Only</option>
              <option value="LOW">Low-Cap Only</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Showing <strong className="text-white">{sortedStocks.length}</strong> of {stocks.length} stocks
        </div>
      </div>

      {/* Stocks Directory Table with CAGR & Touches */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                {renderSortHeader('Rank', 'marketCapRank', 'center', 'pl-3')}
                {renderSortHeader('Symbol & Company', 'symbol', 'left', 'min-w-[150px]')}
                {renderSortHeader('Tier', 'capTier', 'center')}
                {renderSortHeader('Sector & Industry', 'sector', 'left', 'min-w-[140px]')}
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
                <th className="py-3 px-3 text-right">Deep-Dive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {sortedStocks.slice(0, 100).map((s) => (
                <tr key={s.symbol} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-slate-400 text-center">#{s.marketCapRank || '—'}</td>
                  <td className="py-2.5 px-3">
                    <div className="font-mono font-bold text-white flex items-center gap-1">
                      {s.symbol}
                      {s.marketCapRank && s.marketCapRank <= 50 && (
                        <span className="px-1 py-0.2 text-[9px] bg-blue-900/60 text-blue-300 rounded border border-blue-700/50">
                          N50
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                      {s.companyName}
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        s.capTier === 'HIGH'
                          ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
                          : s.capTier === 'MID'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {s.capTier}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="text-slate-300 truncate max-w-[140px]">{s.sector}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{s.industry}</div>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-medium text-white text-right">
                    ₹{s.currentPrice?.toLocaleString('en-IN') || '—'}
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono font-medium">
                    {s.cagr15Y !== null && s.cagr15Y !== undefined ? (
                      <span className={s.cagr15Y >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {s.cagr15Y > 0 ? `+${s.cagr15Y}%` : `${s.cagr15Y}%`}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono text-xs">N/A</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono font-medium">
                    {s.cagr10Y !== null && s.cagr10Y !== undefined ? (
                      <span className={s.cagr10Y >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {s.cagr10Y > 0 ? `+${s.cagr10Y}%` : `${s.cagr10Y}%`}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono text-xs">N/A</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono font-bold bg-emerald-950/20">
                    {s.cagr5Y !== null && s.cagr5Y !== undefined ? (
                      <span className={s.cagr5Y >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {s.cagr5Y > 0 ? `+${s.cagr5Y}%` : `${s.cagr5Y}%`}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono text-xs">N/A</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono font-medium">
                    {s.cagr3Y !== null && s.cagr3Y !== undefined ? (
                      <span className={s.cagr3Y >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {s.cagr3Y > 0 ? `+${s.cagr3Y}%` : `${s.cagr3Y}%`}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono text-xs">N/A</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono font-medium">
                    {s.cagr1Y !== null && s.cagr1Y !== undefined ? (
                      <span className={s.cagr1Y >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {s.cagr1Y > 0 ? `+${s.cagr1Y}%` : `${s.cagr1Y}%`}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono text-xs">N/A</span>
                    )}
                  </td>
                  {/* RSI Clustered Event Touches */}
                  <td className="py-2.5 px-2 text-center font-mono font-bold text-amber-300 bg-amber-950/20">
                    {s.rsiLe30Touches !== undefined ? s.rsiLe30Touches : 0}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono font-semibold text-amber-400 bg-amber-950/10">
                    {s.rsi30To35Touches !== undefined ? s.rsi30To35Touches : 0}
                  </td>
                  {/* EMA Clustered Support Touches */}
                  <td className="py-2.5 px-2 text-center font-mono text-sky-300">
                    {s.ema100Touches !== undefined ? s.ema100Touches : 0}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono font-bold text-sky-400 bg-sky-950/20">
                    {s.ema200Touches !== undefined ? s.ema200Touches : 0}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono text-indigo-300">
                    {s.ema400Touches !== undefined ? s.ema400Touches : 0}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono text-indigo-400">
                    {s.ema500Touches !== undefined ? s.ema500Touches : 0}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => onInspectStock(s.symbol)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      Deep-Dive <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedStocks.length > 100 && (
          <div className="p-3 bg-slate-800/60 border-t border-slate-800 text-center text-xs text-slate-400">
            Showing top 100 of {sortedStocks.length} stocks. Use search or sector filters to view specific segments.
          </div>
        )}
      </div>
    </div>
  );
};
