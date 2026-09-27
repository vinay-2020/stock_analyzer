import React, { useState, useMemo, useEffect } from 'react';
import {
  PieChart,
  Search,
  Building2,
  TrendingUp,
  ArrowUpRight,
  Layers,
  ChevronRight,
  Activity,
  BarChart3,
} from 'lucide-react';
import { StockEquity } from '../types/equity';
import { buildUniverseClassificationIndex } from '../services/classificationService';
import { buildStockCagrDataset, calculateSectorCagrDataset } from '../engine/quantitativeMath';
import { subscribeHistoricalDataStore } from '../services/historicalDataStore';

interface SectorsViewProps {
  stocks: StockEquity[];
  onInspectStock: (symbol: string) => void;
  onSelectSectorForNavigation?: (sectorName: string) => void;
}

export const SectorsView: React.FC<SectorsViewProps> = ({
  stocks,
  onInspectStock,
  onSelectSectorForNavigation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  // Trigger re-computation on store updates
  const [storeVersion, setStoreVersion] = useState(0);
  useEffect(() => {
    return subscribeHistoricalDataStore(() => {
      setStoreVersion((v) => v + 1);
    });
  }, []);

  // Compute classification summaries & CAGR
  const classification = useMemo(() => buildUniverseClassificationIndex(stocks), [stocks]);
  const stocksCagr = useMemo(() => buildStockCagrDataset(stocks), [stocks, storeVersion]);
  const sectorCagr = useMemo(() => calculateSectorCagrDataset(stocks, stocksCagr), [stocks, stocksCagr]);

  const sectorCagrMap = useMemo(() => {
    const map = new Map<string, any>();
    sectorCagr.forEach((sc) => map.set(sc.sector, sc));
    return map;
  }, [sectorCagr]);

  // Filtered sectors list
  const filteredSectors = useMemo(() => {
    return classification.sectorsList.filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [classification, searchQuery]);

  // Currently inspected sector data
  const currentSectorData = useMemo(() => {
    if (!selectedSector) return null;
    return classification.sectorsList.find((s) => s.name === selectedSector);
  }, [classification, selectedSector]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-blue-950/80 text-blue-400 border border-blue-800/60">
                18 MACROECONOMIC SECTORS
              </span>
              <span className="text-xs text-slate-400">Comprehensive Taxonomy & Top 50 Compounding</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <PieChart className="w-6 h-6 text-blue-400" />
              Sectors Architecture & Historical Compounding
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-3xl">
              Deterministic mapping of all 1,120 equities across 18 broad macroeconomic sectors. Evaluates constituent breadth, industry diversification, and Top 50 multi-year CAGR compounding.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-4 py-2 bg-slate-950/80 rounded-lg border border-slate-800 text-right">
              <div className="text-xs text-slate-500 font-medium">Active Sectors</div>
              <div className="text-xl font-bold font-mono text-white">18 Sectors</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Sector Cards + Drilldown Modal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSectors.map((sec) => {
          const cagrInfo = sectorCagrMap.get(sec.name);
          const isSelected = selectedSector === sec.name;

          return (
            <div
              key={sec.name}
              className={`bg-slate-900 border rounded-xl p-5 transition flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'border-blue-500 ring-1 ring-blue-500 bg-slate-850'
                  : 'border-slate-800 hover:border-slate-700 hover:bg-slate-850/60'
              }`}
              onClick={() => setSelectedSector(isSelected ? null : sec.name)}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-blue-950/70 border border-blue-800/60 text-blue-400">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base leading-tight">{sec.name}</h3>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {sec.stockCount} Equities · {sec.industriesCount} Sub-Industries
                      </div>
                    </div>
                  </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800/80 my-3 bg-slate-950/40 rounded-lg px-3">
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium uppercase">3Y CAGR</div>
                    <div className="text-sm font-mono font-bold text-emerald-400">
                      {cagrInfo?.cagr3Y ? `+${cagrInfo.cagr3Y}%` : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium uppercase">5Y CAGR (Top 50)</div>
                    <div className="text-sm font-mono font-bold text-emerald-400">
                      {cagrInfo?.cagr5Y ? `+${cagrInfo.cagr5Y}%` : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium uppercase">10Y CAGR</div>
                    <div className="text-sm font-mono font-bold text-slate-300">
                      {cagrInfo?.cagr10Y ? `+${cagrInfo.cagr10Y}%` : '—'}
                    </div>
                  </div>
                </div>

                {/* Sub-industries tags */}
                <div className="space-y-1 mt-2">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Core Industries ({sec.industries.length}):
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
                    {sec.industries.slice(0, 4).map((ind) => (
                      <span
                        key={ind}
                        className="px-2 py-0.5 text-[11px] rounded bg-slate-800 text-slate-300 border border-slate-700/60"
                      >
                        {ind}
                      </span>
                    ))}
                    {sec.industries.length > 4 && (
                      <span className="px-1.5 py-0.5 text-[10px] text-slate-500">
                        +{sec.industries.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-xs text-blue-400 font-medium flex items-center gap-1">
                  View Constituents ({sec.stockCount}) <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sector Constituents Drawer / Detail Table if Selected */}
      {currentSectorData && (
        <div className="bg-slate-900 border border-blue-800/60 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="text-xs text-blue-400 font-semibold uppercase tracking-wider">Selected Sector Detail</div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                {currentSectorData.name} ({currentSectorData.stockCount} Equities)
              </h2>
            </div>
            <button
              onClick={() => setSelectedSector(null)}
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
                  <th className="py-3 px-4">Industry</th>
                  <th className="py-3 px-3 text-center">Cap Tier</th>
                  <th className="py-3 px-3 text-right">Price</th>
                  <th className="py-3 px-3 text-right">P/E</th>
                  <th className="py-3 px-3 text-right">ROE</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {currentSectorData.stocks.map((stock) => (
                  <tr key={stock.symbol} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-4 font-mono font-bold text-white">{stock.symbol}</td>
                    <td className="py-2.5 px-4 text-xs text-slate-300">{stock.companyName}</td>
                    <td className="py-2.5 px-4 text-xs text-slate-400">{stock.industry}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-800 text-slate-300">
                        {stock.capTier}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-200">
                      ₹{stock.currentPrice?.toLocaleString('en-IN') || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400">{stock.peRatio || '—'}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-400">{stock.roePercent ? `${stock.roePercent}%` : '—'}</td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onInspectStock(stock.symbol)}
                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-blue-400 rounded"
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
