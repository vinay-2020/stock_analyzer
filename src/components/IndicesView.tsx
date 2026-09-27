import React, { useState, useMemo } from 'react';
import {
  Compass,
  Search,
  Building2,
  PieChart,
  ArrowUpRight,
  TrendingUp,
  Layers,
  ChevronRight,
  Percent,
} from 'lucide-react';
import { StockEquity } from '../types/equity';
import { buildUniverseClassificationIndex } from '../services/classificationService';
import { calculateIndexConstituentsDataset } from '../engine/quantitativeMath';

interface IndicesViewProps {
  stocks: StockEquity[];
  onInspectStock: (symbol: string) => void;
}

export const IndicesView: React.FC<IndicesViewProps> = ({ stocks, onInspectStock }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndexType, setSelectedIndexType] = useState<string>('ALL');
  const [selectedIndexName, setSelectedIndexName] = useState<string>('NIFTY 50');

  const classification = useMemo(() => buildUniverseClassificationIndex(stocks), [stocks]);

  // Filtered indices list
  const filteredIndices = useMemo(() => {
    return classification.indicesList.filter((idx) => {
      const matchesSearch = idx.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType =
        selectedIndexType === 'ALL' || idx.type === selectedIndexType;
      return matchesSearch && matchesType;
    });
  }, [classification, searchQuery, selectedIndexType]);

  // Constituents of currently selected index
  const indexConstituents = useMemo(() => {
    return calculateIndexConstituentsDataset(stocks, selectedIndexName);
  }, [stocks, selectedIndexName]);

  const currentIndexMeta = useMemo(() => {
    return classification.indicesList.find((i) => i.name === selectedIndexName);
  }, [classification, selectedIndexName]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-amber-950/80 text-amber-400 border border-amber-800/60">
                29 BENCHMARK & SECTORAL INDICES
              </span>
              <span className="text-xs text-slate-400">Constituent Weights & Historical Contributions</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Compass className="w-6 h-6 text-amber-400" />
              Index Constituents & Contribution Engine
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-3xl">
              Deterministic index constituent mapping. Computes market-cap weighting percentages and constituent contribution to historical index movement across benchmark, sectoral, and thematic indices.
            </p>
          </div>

          <div className="px-4 py-2 bg-slate-950/80 rounded-lg border border-slate-800 text-right">
            <div className="text-xs text-slate-500 font-medium">Mapped Indices</div>
            <div className="text-xl font-bold font-mono text-white">{classification.indicesList.length} Indices</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Index Selector + Right Constituent Weight Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Index Selector */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search indices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {['ALL', 'BENCHMARK', 'SECTORAL', 'THEMATIC', 'UNINDEXED'].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedIndexType(t)}
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
                    selectedIndexType === t
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredIndices.map((idx) => (
                <button
                  key={idx.name}
                  onClick={() => setSelectedIndexName(idx.name)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                    selectedIndexName === idx.name
                      ? 'bg-amber-950/50 border border-amber-700/60 text-amber-300'
                      : 'bg-slate-950/60 border border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div>
                    <div className="font-bold">{idx.name}</div>
                    <div className="text-[10px] text-slate-500">{idx.stockCount} Constituents · {idx.sectorsCount} Sectors</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Constituents & Weights Table */}
        <div className="lg:col-span-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
                  {currentIndexMeta?.type || 'Index'} Constituents
                </div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Compass className="w-5 h-5 text-amber-400" />
                  {selectedIndexName} ({indexConstituents.length} Equities)
                </h2>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[580px]">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/90 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="py-3 px-4">Symbol / Company</th>
                    <th className="py-3 px-4">Sector</th>
                    <th className="py-3 px-3 text-center">Cap Tier</th>
                    <th className="py-3 px-4 text-right bg-amber-950/20 text-amber-300 font-bold">
                      Est. Index Weight (%)
                    </th>
                    <th className="py-3 px-4 text-right">5Y Return</th>
                    <th className="py-3 px-4 text-right">5Y Contribution</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {indexConstituents.map((row) => (
                    <tr key={row.symbol} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-4">
                        <div className="font-mono font-bold text-white">{row.symbol}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{row.companyName}</div>
                      </td>
                      <td className="py-2.5 px-4 text-xs text-slate-300">{row.sector}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-800 text-slate-300">
                          {row.capTier}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold bg-amber-950/20 text-amber-300">
                        {row.estimatedIndexWeightPct}%
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-emerald-400">
                        +{row.return5Y}%
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-200">
                        +{row.contribution5Y}%
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => onInspectStock(row.symbol)}
                          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded"
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
          </div>
        </div>
      </div>
    </div>
  );
};
