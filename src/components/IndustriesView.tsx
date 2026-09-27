import React, { useState, useMemo, useEffect } from 'react';
import {
  Layers,
  Search,
  Building2,
  Filter,
  ArrowUpRight,
  TrendingUp,
  Info,
  ChevronRight,
} from 'lucide-react';
import { StockEquity } from '../types/equity';
import { buildUniverseClassificationIndex } from '../services/classificationService';
import { buildStockCagrDataset, calculateIndustryCagrDataset } from '../engine/quantitativeMath';
import { subscribeHistoricalDataStore } from '../services/historicalDataStore';

interface IndustriesViewProps {
  stocks: StockEquity[];
  onInspectStock: (symbol: string) => void;
}

export const IndustriesView: React.FC<IndustriesViewProps> = ({ stocks, onInspectStock }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState('ALL');
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);

  // Trigger re-computation on store updates
  const [storeVersion, setStoreVersion] = useState(0);
  useEffect(() => {
    return subscribeHistoricalDataStore(() => {
      setStoreVersion((v) => v + 1);
    });
  }, []);

  const classification = useMemo(() => buildUniverseClassificationIndex(stocks), [stocks]);
  const stocksCagr = useMemo(() => buildStockCagrDataset(stocks), [stocks, storeVersion]);
  const industryCagr = useMemo(
    () => calculateIndustryCagrDataset(stocks, stocksCagr),
    [stocks, stocksCagr]
  );

  const industryCagrMap = useMemo(() => {
    const map = new Map<string, any>();
    industryCagr.forEach((ic) => map.set(ic.industry, ic));
    return map;
  }, [industryCagr]);

  const sectorNames = useMemo(() => {
    return Array.from(new Set(stocks.map((s) => s.sector))).sort();
  }, [stocks]);

  const filteredIndustries = useMemo(() => {
    return classification.industriesList.filter((ind) => {
      const matchesSearch =
        ind.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ind.sector.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSector =
        selectedSectorFilter === 'ALL' || ind.sector === selectedSectorFilter;
      return matchesSearch && matchesSector;
    });
  }, [classification, searchQuery, selectedSectorFilter]);

  const currentIndustryData = useMemo(() => {
    if (!selectedIndustry) return null;
    return classification.industriesList.find((i) => i.name === selectedIndustry);
  }, [classification, selectedIndustry]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-purple-950/80 text-purple-400 border border-purple-800/60">
                93 GRANULAR SUB-INDUSTRIES
              </span>
              <span className="text-xs text-slate-400">Top 25 Constituents & Sample Size Disclosures</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-6 h-6 text-purple-400" />
              Industries Taxonomy & Compounding Analysis
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-3xl">
              Granular sub-industry mapping across the 1,120 equity universe. Industry CAGR evaluates the <strong>Top 25 constituents</strong> by market cap. Where fewer than 25 exist, all available members are used with explicit sample size disclosures ($n$).
            </p>
          </div>

          <div className="px-4 py-2 bg-slate-950/80 rounded-lg border border-slate-800 text-right">
            <div className="text-xs text-slate-500 font-medium">Mapped Sub-Industries</div>
            <div className="text-xl font-bold font-mono text-white">{classification.industriesList.length} Industries</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search industry or parent sector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <select
            value={selectedSectorFilter}
            onChange={(e) => setSelectedSectorFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Sectors (18)</option>
            {sectorNames.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Industries Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Industry Name</th>
                <th className="py-3.5 px-4">Parent Sector</th>
                <th className="py-3.5 px-3 text-center">Total Stocks</th>
                <th className="py-3.5 px-3 text-center">Top 25 Used</th>
                <th className="py-3.5 px-4">Sample Size Disclosure</th>
                <th className="py-3.5 px-4 text-right">3Y CAGR</th>
                <th className="py-3.5 px-4 text-right bg-purple-950/20 text-purple-300 font-bold">5Y CAGR</th>
                <th className="py-3.5 px-4 text-right">10Y CAGR</th>
                <th className="py-3.5 px-3 text-center">Constituents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredIndustries.map((ind) => {
                const cagrData = industryCagrMap.get(ind.name);
                const isSelected = selectedIndustry === ind.name;

                return (
                  <tr
                    key={ind.name}
                    className={`hover:bg-slate-800/40 transition cursor-pointer ${
                      isSelected ? 'bg-purple-950/20' : ''
                    }`}
                    onClick={() => setSelectedIndustry(isSelected ? null : ind.name)}
                  >
                    <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-400" />
                      {ind.name}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">{ind.sector}</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-300">{ind.stockCount}</td>
                    <td className="py-3 px-3 text-center font-mono text-purple-400 font-bold">
                      {Math.min(25, ind.stockCount)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          ind.stockCount >= 25
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                            : 'bg-amber-950/60 text-amber-400 border border-amber-800/50'
                        }`}
                      >
                        {ind.stockCount >= 25
                          ? 'Full Top 25 Used'
                          : `Sample: ${ind.stockCount} of ${ind.stockCount} (All constituents)`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium">
                      {cagrData?.cagr3Y ? `+${cagrData.cagr3Y}%` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold bg-purple-950/20 text-purple-300">
                      {cagrData?.cagr5Y ? `+${cagrData.cagr5Y}%` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-400">
                      {cagrData?.cagr10Y ? `+${cagrData.cagr10Y}%` : '—'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIndustry(isSelected ? null : ind.name);
                        }}
                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-purple-400 rounded transition"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Industry Constituents Drawer */}
      {currentIndustryData && (
        <div className="bg-slate-900 border border-purple-800/60 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="text-xs text-purple-400 font-semibold uppercase tracking-wider">
                Industry Constituents Drilldown
              </div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                {currentIndustryData.name} ({currentIndustryData.stockCount} Equities)
              </h2>
              <div className="text-xs text-slate-400 mt-1">Parent Sector: {currentIndustryData.sector}</div>
            </div>
            <button
              onClick={() => setSelectedIndustry(null)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            >
              Close Drawer
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Symbol</th>
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-3 text-center">Cap Tier</th>
                  <th className="py-3 px-3 text-right">Price</th>
                  <th className="py-3 px-3 text-right">P/E</th>
                  <th className="py-3 px-3 text-right">ROE</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {currentIndustryData.stocks.map((stock) => (
                  <tr key={stock.symbol} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-4 font-mono font-bold text-white">{stock.symbol}</td>
                    <td className="py-2.5 px-4 text-xs text-slate-300">{stock.companyName}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-800 text-slate-300">
                        {stock.capTier}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-200">
                      ₹{stock.currentPrice?.toLocaleString('en-IN') || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400">{stock.peRatio || '—'}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                      {stock.roePercent ? `${stock.roePercent}%` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onInspectStock(stock.symbol)}
                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-purple-400 rounded"
                        title="Deep Dive"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
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
