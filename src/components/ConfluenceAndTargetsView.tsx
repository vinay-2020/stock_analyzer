import React, { useState, useMemo } from 'react';
import {
  Zap,
  Target,
  Sparkles,
  Info,
  ChevronRight,
  Search,
  Filter,
  Layers,
  CheckCircle,
} from 'lucide-react';
import { ConfluenceRecord, ReturnTargetMatrixRow } from '../types/equity';
import { requestAiInterpretation } from '../services/aiInterpretationService';

interface Props {
  confluences: ConfluenceRecord[];
  targetRows: ReturnTargetMatrixRow[];
  onInspectStock: (symbol: string) => void;
}

export const ConfluenceAndTargetsView: React.FC<Props> = ({
  confluences,
  targetRows,
  onInspectStock,
}) => {
  const [activeTab, setActiveTab] = useState<'confluence' | 'targets'>('confluence');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // AI Interpretation State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const filteredConfluences = useMemo(() => {
    return confluences.filter((c) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!c.symbol.toLowerCase().includes(q) && !c.companyName.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [confluences, searchQuery]);

  const filteredTargetRows = useMemo(() => {
    return targetRows.filter((row) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!row.symbol.toLowerCase().includes(q) && !row.companyName.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [targetRows, searchQuery]);

  const confluenceWinRate = useMemo(() => {
    if (filteredConfluences.length === 0) return '0';
    const hit20 = filteredConfluences.filter((c) => c.achieved20PctRebound).length;
    return ((hit20 / filteredConfluences.length) * 100).toFixed(1);
  }, [filteredConfluences]);

  const handleInterpretWithAI = async () => {
    setIsAiLoading(true);
    setAiError(null);
    setAiInterpretation(null);

    if (activeTab === 'confluence') {
      const sampleTable = filteredConfluences.slice(0, 10).map((c) => ({
        Date: c.matchedEventDate,
        Symbol: c.symbol,
        Conditions: c.conditionsMatched.join(' + '),
        Return30D: `${c.forwardReturn30D}%`,
        Return60D: `${c.forwardReturn60D}%`,
        Achieved20PctRebound: c.achieved20PctRebound ? 'Yes' : 'No',
        MaxReboundPct: `${c.maxReboundPct}%`,
      }));

      const payload = {
        question:
          'Explain the historical outcomes of combined confluence triggers (e.g. RSI oversold + Long-term EMA support + Bullish divergence). Does multi-factor confluence historically improve rebound consistency?',
        calculationType: 'Combined Rebound Confluence Engine',
        summaryStats: {
          totalConfluenceEvents: filteredConfluences.length,
          achieved20PctReboundWinRate: `${confluenceWinRate}%`,
        },
        compactTable: sampleTable,
        universeNotes:
          'Historical measurements only. Confluence does not imply guaranteed future outcomes.',
      };

      const res = await requestAiInterpretation(payload);
      setIsAiLoading(false);
      if (res.success && res.interpretation) setAiInterpretation(res.interpretation);
      else setAiError(res.error || 'Failed to interpret confluence data.');
    } else {
      const sampleTable = filteredTargetRows.slice(0, 10).map((row) => ({
        Symbol: row.symbol,
        Sector: row.sector,
        CapTier: row.capTier,
        HitRate10Pct20D: `${row.hitRate10Pct20D}%`,
        HitRate20Pct30D: `${row.hitRate20Pct30D}%`,
        HitRate20Pct60D: `${row.hitRate20Pct60D}%`,
        HitRate30Pct60D: `${row.hitRate30Pct60D}%`,
        HitRate40Pct90D: `${row.hitRate40Pct90D}%`,
        AvgDaysTo20Pct: `${row.avgDaysTo20Pct} days`,
      }));

      const payload = {
        question:
          'Analyze the historical probability matrix of achieving return targets (+10%, +20%, +30%, +40%) across 20, 30, 60, and 90 trading days after market corrections.',
        calculationType: 'Historical Return Target Matrix',
        summaryStats: {
          totalStocksEvaluated: filteredTargetRows.length,
          targetHorizons: '20D, 30D, 60D, 90D',
        },
        compactTable: sampleTable,
        universeNotes: 'Empirical target achievement counts from historical correction troughs.',
      };

      const res = await requestAiInterpretation(payload);
      setIsAiLoading(false);
      if (res.success && res.interpretation) setAiInterpretation(res.interpretation);
      else setAiError(res.error || 'Failed to interpret return targets.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase bg-amber-950/80 text-amber-300 border border-amber-800/60">
                Engine 6 & 7
              </span>
              <h2 className="text-xl font-bold text-white">
                Rebound Confluence & Return Target Matrix
              </h2>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Evaluates multi-factor confluences (RSI Oversold + Long-term EMA + Bullish Divergence) and measures the empirical frequency of achieving +10%, +20%, +30%, and +40% rebounds within defined trading horizons.
            </p>
          </div>

          <button
            onClick={handleInterpretWithAI}
            disabled={isAiLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold shadow-md transition-all cursor-pointer shrink-0"
          >
            <Sparkles className={`w-4 h-4 ${isAiLoading ? 'animate-spin' : 'text-indigo-200'}`} />
            {isAiLoading ? 'AI Calculating Interpretation...' : 'Interpret Matrix with AI'}
          </button>
        </div>

        {/* Aggregate Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800">
          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60">
            <span className="text-xs text-slate-400 block font-medium">Confluence Signals</span>
            <span className="text-lg font-bold text-white mt-0.5 block">
              {filteredConfluences.length} events
            </span>
            <span className="text-[11px] text-slate-400">Multi-condition setups</span>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60">
            <span className="text-xs text-slate-400 block font-medium">≥20% Rebound Success</span>
            <span className="text-lg font-bold text-emerald-400 mt-0.5 block">
              {confluenceWinRate}%
            </span>
            <span className="text-[11px] text-slate-400">Achieved within 60–90 days</span>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60">
            <span className="text-xs text-slate-400 block font-medium">Target Benchmarks</span>
            <span className="text-lg font-bold text-indigo-400 mt-0.5 block">
              +10% to +40%
            </span>
            <span className="text-[11px] text-slate-400">Across 20D, 30D, 60D, 90D</span>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60">
            <span className="text-xs text-slate-400 block font-medium">Objective Principle</span>
            <span className="text-xs font-semibold text-amber-300 mt-1 block">
              Confluence does not imply certainty
            </span>
            <span className="text-[11px] text-slate-400">Deterministic verification</span>
          </div>
        </div>
      </div>

      {/* AI Interpretation Result Banner */}
      {aiInterpretation && (
        <div className="bg-indigo-950/40 border border-indigo-800/80 rounded-xl p-5 text-slate-200 relative shadow-lg animate-fade-in">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-indigo-800/40">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>AI Interpretation: Confluence & Target Matrix</span>
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

      {/* Tab Selector & Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => setActiveTab('confluence')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                activeTab === 'confluence'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Multi-Factor Confluence Log ({filteredConfluences.length})
            </button>
            <button
              onClick={() => setActiveTab('targets')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                activeTab === 'targets'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              Historical Return Target Matrix ({filteredTargetRows.length})
            </button>
          </div>

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
      </div>

      {/* Confluence View */}
      {activeTab === 'confluence' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-3">Symbol & Sector</th>
                  <th className="py-3 px-3">Confluence Setup Conditions</th>
                  <th className="py-3 px-3">30D Return</th>
                  <th className="py-3 px-3">60D Return</th>
                  <th className="py-3 px-3">90D Return</th>
                  <th className="py-3 px-3 text-emerald-300">120D</th>
                  <th className="py-3 px-3 text-emerald-300">180D</th>
                  <th className="py-3 px-3 text-emerald-200">220D</th>
                  <th className="py-3 px-3">Max Rebound</th>
                  <th className="py-3 px-3">≥20% Hit?</th>
                  <th className="py-3 px-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredConfluences.slice(0, 50).map((c, idx) => (
                  <tr key={`${c.id}-${idx}`} className="hover:bg-slate-800/50">
                    <td className="py-2.5 px-4 font-mono text-slate-300">{c.matchedEventDate}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-indigo-400">{c.symbol}</span>
                        <span className="text-[11px] text-slate-400 truncate max-w-[120px]">{c.sector}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {c.conditionsMatched.map((cond, cIdx) => (
                          <span
                            key={cIdx}
                            className="bg-slate-800 text-[10px] px-1.5 py-0.5 rounded border border-slate-700 text-slate-300 font-medium"
                          >
                            {cond}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <span className={(c.forwardReturn30D || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {(c.forwardReturn30D || 0) >= 0 ? '+' : ''}
                        {c.forwardReturn30D}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold">
                      <span className={(c.forwardReturn60D || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {(c.forwardReturn60D || 0) >= 0 ? '+' : ''}
                        {c.forwardReturn60D}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <span className={(c.forwardReturn90D || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {(c.forwardReturn90D || 0) >= 0 ? '+' : ''}
                        {c.forwardReturn90D}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-emerald-300">
                      <span className={(c.forwardReturn120D || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {(c.forwardReturn120D || 0) >= 0 ? '+' : ''}
                        {c.forwardReturn120D}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-emerald-300">
                      <span className={(c.forwardReturn180D || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {(c.forwardReturn180D || 0) >= 0 ? '+' : ''}
                        {c.forwardReturn180D}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-emerald-200 font-bold">
                      <span className={(c.forwardReturn220D || 0) >= 0 ? 'text-emerald-300' : 'text-rose-400'}>
                        {(c.forwardReturn220D || 0) >= 0 ? '+' : ''}
                        {c.forwardReturn220D}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                      +{c.maxReboundPct}%
                    </td>
                    <td className="py-2.5 px-3">
                      {c.achieved20PctRebound ? (
                        <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/60">
                          YES (≥20%)
                        </span>
                      ) : (
                        <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          No
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onInspectStock(c.symbol)}
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
      )}

      {/* Target Matrix View */}
      {activeTab === 'targets' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Symbol</th>
                  <th className="py-3 px-3">Tier / Sector</th>
                  <th className="py-3 px-3 text-center bg-indigo-950/20 border-x border-slate-700/50">
                    +10% in 20 Days
                  </th>
                  <th className="py-3 px-3 text-center bg-indigo-950/20 border-r border-slate-700/50">
                    +20% in 30 Days
                  </th>
                  <th className="py-3 px-3 text-center bg-indigo-950/20 border-r border-slate-700/50">
                    +20% in 60 Days
                  </th>
                  <th className="py-3 px-3 text-center bg-indigo-950/20 border-r border-slate-700/50">
                    +30% in 60 Days
                  </th>
                  <th className="py-3 px-3 text-center bg-indigo-950/20 border-r border-slate-700/50">
                    +40% in 90 Days
                  </th>
                  <th className="py-3 px-3">Avg Days to +20%</th>
                  <th className="py-3 px-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredTargetRows.slice(0, 50).map((row, idx) => (
                  <tr key={`${row.symbol}-${idx}`} className="hover:bg-slate-800/50">
                    <td className="py-2.5 px-4 font-mono font-bold text-indigo-400">{row.symbol}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 mr-1.5 border border-slate-700">
                        {row.capTier}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate max-w-[120px]">{row.sector}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-semibold border-x border-slate-800">
                      <span className={row.hitRate10Pct20D >= 75 ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                        {row.hitRate10Pct20D}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-semibold border-r border-slate-800">
                      <span className={row.hitRate20Pct30D >= 60 ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                        {row.hitRate20Pct30D}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-semibold border-r border-slate-800">
                      <span className={row.hitRate20Pct60D >= 70 ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                        {row.hitRate20Pct60D}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-semibold border-r border-slate-800">
                      <span className={row.hitRate30Pct60D >= 50 ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                        {row.hitRate30Pct60D}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-semibold border-r border-slate-800">
                      <span className={row.hitRate40Pct90D >= 40 ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                        {row.hitRate40Pct90D}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-200">
                      {row.avgDaysTo20Pct ? `${row.avgDaysTo20Pct} days` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onInspectStock(row.symbol)}
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
      )}
    </div>
  );
};
