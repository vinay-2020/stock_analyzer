import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Info,
  Filter,
  Search,
  ChevronRight,
  GitBranch,
} from 'lucide-react';
import { RsiDivergenceRecord } from '../types/equity';
import { requestAiInterpretation } from '../services/aiInterpretationService';

interface Props {
  divergences: RsiDivergenceRecord[];
  onInspectStock: (symbol: string) => void;
}

export const RsiDivergenceEngineView: React.FC<Props> = ({
  divergences,
  onInspectStock,
}) => {
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'BULLISH' | 'BEARISH'>('BULLISH');
  const [subtypeFilter, setSubtypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // AI Interpretation State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const filteredDivergences = useMemo(() => {
    return divergences.filter((d) => {
      if (typeFilter !== 'ALL' && d.type !== typeFilter) return false;
      if (subtypeFilter !== 'ALL' && d.subtype !== subtypeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!d.symbol.toLowerCase().includes(q) && !d.companyName.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [divergences, typeFilter, subtypeFilter, searchQuery]);

  // Summary Metrics
  const summary = useMemo(() => {
    if (filteredDivergences.length === 0) return null;
    const count = filteredDivergences.length;
    const pos60 = filteredDivergences.filter((d) => (d.return60D || 0) > 0).length;
    const winRate60 = ((pos60 / count) * 100).toFixed(1);
    const avgReturn60 = (
      filteredDivergences.reduce((acc, d) => acc + (d.return60D || 0), 0) / count
    ).toFixed(2);
    const avgMaxRebound = (
      filteredDivergences.reduce((acc, d) => acc + (d.maxReturnSubsequentPct || 0), 0) / count
    ).toFixed(2);

    return {
      count,
      winRate60,
      avgReturn60,
      avgMaxRebound,
    };
  }, [filteredDivergences]);

  const handleInterpretWithAI = async () => {
    setIsAiLoading(true);
    setAiError(null);
    setAiInterpretation(null);

    const sampleTable = filteredDivergences.slice(0, 10).map((d) => ({
      Date: d.date,
      Symbol: d.symbol,
      Type: d.type,
      Subtype: d.subtype,
      PriceAtSignal: `₹${d.priceAtSignal}`,
      RsiAtSignal: d.rsiAtSignal,
      NearEma: d.nearEmaLevel || 'None',
      Return20D: `${d.return20D}%`,
      Return60D: `${d.return60D}%`,
      MaxReboundPct: `${d.maxReturnSubsequentPct}%`,
    }));

    const payload = {
      question:
        'Explain the historical behavior of RSI divergences (comparing Raw vs Near Oversold vs Near Long-Term EMA Support). How did forward returns vary across these divergence classifications?',
      calculationType: 'Historical RSI Divergence Engine',
      summaryStats: {
        activeFilter: `${typeFilter} Divergences (${subtypeFilter})`,
        sampleSize: filteredDivergences.length,
        winRate60DPct: `${summary?.winRate60}%`,
        average60DReturnPct: `${summary?.avgReturn60}%`,
      },
      compactTable: sampleTable,
      universeNotes:
        'Regular divergences detected from historical swing lows and RSI bottoms. No future guarantees.',
    };

    const res = await requestAiInterpretation(payload);
    setIsAiLoading(false);
    if (res.success && res.interpretation) {
      setAiInterpretation(res.interpretation);
    } else {
      setAiError(res.error || 'Failed to interpret divergence data.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                Engine 4
              </span>
              <h2 className="text-xl font-bold text-white">Historical RSI Divergence Engine</h2>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Detects regular Bullish (Price Lower Low + RSI Higher Low) and Bearish (Price Higher High + RSI Lower High) divergences, separated by proximity to oversold levels and long-term EMAs.
            </p>
          </div>

          <button
            onClick={handleInterpretWithAI}
            disabled={isAiLoading || filteredDivergences.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold shadow-md transition-all cursor-pointer shrink-0"
          >
            <Sparkles className={`w-4 h-4 ${isAiLoading ? 'animate-spin' : 'text-indigo-200'}`} />
            {isAiLoading ? 'AI Calculating Interpretation...' : 'Interpret Divergence with AI'}
          </button>
        </div>

        {/* Summary Metric Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800">
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60">
              <span className="text-xs text-slate-400 block font-medium">Signals Evaluated</span>
              <span className="text-lg font-bold text-white mt-0.5 block">{summary.count} signals</span>
              <span className="text-[11px] text-slate-400">Strictly historical</span>
            </div>

            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60">
              <span className="text-xs text-slate-400 block font-medium">60D Positive Outcome</span>
              <span className="text-lg font-bold text-emerald-400 mt-0.5 block">
                {summary.winRate60}%
              </span>
              <span className="text-[11px] text-slate-400">Positive subsequent 60D return</span>
            </div>

            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60">
              <span className="text-xs text-slate-400 block font-medium">Avg 60D Forward Return</span>
              <span className="text-lg font-bold text-indigo-400 mt-0.5 block">
                +{summary.avgReturn60}%
              </span>
              <span className="text-[11px] text-slate-400">Subsequent mean return</span>
            </div>

            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60">
              <span className="text-xs text-slate-400 block font-medium">Max Subsequent Gain</span>
              <span className="text-lg font-bold text-amber-400 mt-0.5 block">
                +{summary.avgMaxRebound}%
              </span>
              <span className="text-[11px] text-slate-400">Average peak excursion</span>
            </div>
          </div>
        )}
      </div>

      {/* AI Interpretation Result Banner */}
      {aiInterpretation && (
        <div className="bg-indigo-950/40 border border-indigo-800/80 rounded-xl p-5 text-slate-200 relative shadow-lg animate-fade-in">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-indigo-800/40">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>AI Interpretation: Historical RSI Divergences</span>
            </div>
            <button
              onClick={() => setAiInterpretation(null)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Close
            </button>
          </div>
          <div className="text-sm leading-relaxed text-slate-200 whitespace-pre-line font-sans">
            {aiInterpretation}
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Divergence Type Switcher */}
          <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => setTypeFilter('BULLISH')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                typeFilter === 'BULLISH'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Bullish (Lower Low Price + Higher Low RSI)
            </button>
            <button
              onClick={() => setTypeFilter('BEARISH')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                typeFilter === 'BEARISH'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              Bearish (Higher High Price + Lower High RSI)
            </button>
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                typeFilter === 'ALL'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Types
            </button>
          </div>

          {/* Subtype Separation Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Context:</span>
            <select
              value={subtypeFilter}
              onChange={(e) => setSubtypeFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Contexts</option>
              <option value="Near Oversold (RSI ≤ 35)">Near Oversold (RSI ≤ 35)</option>
              <option value="Near Long-Term EMA Support">Near Long-Term EMA Support (200/400/500)</option>
              <option value="Raw Divergence">Raw Divergence</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 w-44"
            />
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Showing <strong className="text-white">{filteredDivergences.length}</strong> divergence events
        </div>
      </div>

      {/* Divergence Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-3">Symbol & Sector</th>
                <th className="py-3 px-3">Divergence Type</th>
                <th className="py-3 px-3">Context / Subtype</th>
                <th className="py-3 px-3">Price & RSI</th>
                <th className="py-3 px-3">Drawdown Post-Signal</th>
                <th className="py-3 px-3">20D Return</th>
                <th className="py-3 px-3">60D Return</th>
                <th className="py-3 px-3">90D Return</th>
                <th className="py-3 px-3 text-emerald-300">120D</th>
                <th className="py-3 px-3 text-emerald-300">180D</th>
                <th className="py-3 px-3 text-emerald-200">220D</th>
                <th className="py-3 px-3">Max Recovery</th>
                <th className="py-3 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredDivergences.slice(0, 50).map((d, idx) => (
                <tr key={`${d.date}-${d.symbol}-${idx}`} className="hover:bg-slate-800/50">
                  <td className="py-2.5 px-4 font-mono text-slate-300">{d.date}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-indigo-400">{d.symbol}</span>
                      <span className="text-[11px] text-slate-400 truncate max-w-[120px]">{d.sector}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded inline-flex items-center gap-1 ${
                        d.type === 'BULLISH'
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                          : 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                      }`}
                    >
                      {d.type === 'BULLISH' ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {d.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[11px] text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {d.subtype} {d.nearEmaLevel && `(${d.nearEmaLevel})`}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    <span className="text-white">₹{d.priceAtSignal}</span>
                    <span className="text-slate-400 ml-1.5">(RSI: {d.rsiAtSignal})</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-rose-400">
                    {d.maxDrawdownAfterSignalPct}%
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    <span className={(d.return20D || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {(d.return20D || 0) >= 0 ? '+' : ''}
                      {d.return20D}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold">
                    <span className={(d.return60D || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {(d.return60D || 0) >= 0 ? '+' : ''}
                      {d.return60D}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    <span className={(d.return90D || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {(d.return90D || 0) >= 0 ? '+' : ''}
                      {d.return90D}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-emerald-300">
                    <span className={(d.return120D || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {(d.return120D || 0) >= 0 ? '+' : ''}
                      {d.return120D}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-emerald-300">
                    <span className={(d.return180D || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {(d.return180D || 0) >= 0 ? '+' : ''}
                      {d.return180D}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-emerald-200 font-bold">
                    <span className={(d.return220D || 0) >= 0 ? 'text-emerald-300' : 'text-rose-400'}>
                      {(d.return220D || 0) >= 0 ? '+' : ''}
                      {d.return220D}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                    +{d.maxReturnSubsequentPct}%
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => onInspectStock(d.symbol)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      Inspect <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
