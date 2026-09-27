import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  AlertTriangle,
  Info,
  ChevronRight,
  Search,
  Activity,
  BarChart3,
  Percent,
} from 'lucide-react';
import { RsiReboundOccurrence, RsiAggregateStats } from '../types/equity';
import { requestAiInterpretation } from '../services/aiInterpretationService';

interface Props {
  occurrences: RsiReboundOccurrence[];
  stats: RsiAggregateStats[];
  onInspectStock: (symbol: string) => void;
}

export const RsiReboundEngineView: React.FC<Props> = ({
  occurrences,
  stats,
  onInspectStock,
}) => {
  const [activeTab, setActiveTab] = useState<'aggregate' | 'events'>('aggregate');
  const [triggerFilter, setTriggerFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minSampleSize, setMinSampleSize] = useState<number>(0);

  // AI Interpretation State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Filtered stats
  const filteredStats = useMemo(() => {
    return stats.filter((s) => {
      if (s.totalOccurrences < minSampleSize) return false;
      if (searchQuery.trim() && !s.symbol.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [stats, minSampleSize, searchQuery]);

  // Filtered individual occurrences
  const filteredOccurrences = useMemo(() => {
    return occurrences.filter((occ) => {
      if (triggerFilter !== 'ALL' && occ.triggerType !== triggerFilter) return false;
      if (searchQuery.trim() && !occ.symbol.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [occurrences, triggerFilter, searchQuery]);

  // Overall aggregate metrics across all events
  const overallMetrics = useMemo(() => {
    if (filteredStats.length === 0) return null;
    const totalEvents = filteredStats.reduce((acc, s) => acc + s.totalOccurrences, 0);
    const avgWinRate60D = (
      filteredStats.reduce((acc, s) => acc + s.positive60DPct, 0) / filteredStats.length
    ).toFixed(1);
    const avgReturn60D = (
      filteredStats.reduce((acc, s) => acc + s.avgReturn60D, 0) / filteredStats.length
    ).toFixed(2);
    const avgStdDev = (
      filteredStats.reduce((acc, s) => acc + s.stdDevReturn60D, 0) / filteredStats.length
    ).toFixed(2);

    return {
      totalStocks: filteredStats.length,
      totalEvents,
      avgWinRate60D,
      avgReturn60D,
      avgStdDev,
    };
  }, [filteredStats]);

  const handleInterpretWithAI = async () => {
    setIsAiLoading(true);
    setAiError(null);
    setAiInterpretation(null);

    const sampleTable = filteredStats.slice(0, 10).map((s) => ({
      Symbol: s.symbol,
      SampleCount: s.totalOccurrences,
      Reliability: s.sampleSizeReliability,
      WinRate20DPct: `${s.positive20DPct}%`,
      WinRate60DPct: `${s.positive60DPct}%`,
      WinRate90DPct: `${s.positive90DPct}%`,
      AvgReturn60DPct: `${s.avgReturn60D}%`,
      MedianReturn60DPct: `${s.medianReturn60D}%`,
      StdDevReturn60DPct: `${s.stdDevReturn60D}%`,
    }));

    const payload = {
      question:
        'Explain the historical reliability and statistical distribution of RSI oversold (≤ 30 and ≤ 35) rebounds across these Indian equities. Emphasize standard deviation and sample size warnings.',
      calculationType: 'Historical RSI Rebound Engine',
      summaryStats: {
        totalStocksEvaluated: filteredStats.length,
        overall60DayWinRate: `${overallMetrics?.avgWinRate60D}%`,
        overall60DayAverageReturn: `${overallMetrics?.avgReturn60D}%`,
        averageStandardDeviation: `${overallMetrics?.avgStdDev}%`,
      },
      compactTable: sampleTable,
      universeNotes:
        'Strict Wilder RSI (14 period) calculations. Low sample size warning enforced for n < 5.',
    };

    const res = await requestAiInterpretation(payload);
    setIsAiLoading(false);
    if (res.success && res.interpretation) {
      setAiInterpretation(res.interpretation);
    } else {
      setAiError(res.error || 'Failed to interpret RSI data.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Engine Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                Engine 3
              </span>
              <h2 className="text-xl font-bold text-white">Historical RSI Rebound Engine</h2>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Evaluates historical forward returns following RSI ≤ 30 and ≤ 35 oversold triggers, measuring positive outcome percentages, median returns, and dispersion.
            </p>
          </div>

          <button
            onClick={handleInterpretWithAI}
            disabled={isAiLoading || filteredStats.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold shadow-md transition-all cursor-pointer shrink-0"
          >
            <Sparkles className={`w-4 h-4 ${isAiLoading ? 'animate-spin' : 'text-indigo-200'}`} />
            {isAiLoading ? 'AI Calculating Interpretation...' : 'Interpret RSI Findings with AI'}
          </button>
        </div>

        {/* Aggregate Benchmark Strip */}
        {overallMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800">
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60">
              <span className="text-xs text-slate-400 block font-medium">Stocks Analyzed</span>
              <span className="text-lg font-bold text-white mt-0.5 block">
                {overallMetrics.totalStocks} stocks
              </span>
              <span className="text-[11px] text-slate-400">
                {overallMetrics.totalEvents} total oversold triggers
              </span>
            </div>

            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60">
              <span className="text-xs text-slate-400 block font-medium">60D Positive Hit Rate</span>
              <span className="text-lg font-bold text-emerald-400 mt-0.5 block">
                {overallMetrics.avgWinRate60D}%
              </span>
              <span className="text-[11px] text-slate-400">Historically positive forward return</span>
            </div>

            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60">
              <span className="text-xs text-slate-400 block font-medium">Average 60D Rebound</span>
              <span className="text-lg font-bold text-indigo-400 mt-0.5 block">
                +{overallMetrics.avgReturn60D}%
              </span>
              <span className="text-[11px] text-slate-400">Mean subsequent gain from trigger</span>
            </div>

            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60">
              <span className="text-xs text-slate-400 block font-medium">Standard Deviation</span>
              <span className="text-lg font-bold text-amber-400 mt-0.5 block">
                ±{overallMetrics.avgStdDev}%
              </span>
              <span className="text-[11px] text-slate-400">Historical outcome variance</span>
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
              <span>AI Interpretation: Statistical RSI Rebound Analysis</span>
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

      {/* Sample Size Caution Banner */}
      <div className="bg-amber-950/30 border border-amber-800/60 rounded-xl p-3.5 text-xs text-amber-300 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold">Sample-Size Cautionary Principle:</strong> Do not label a stock "reliable" based on a tiny number of observations ($n &lt; 5$). Deep market corrections occur infrequently; historical statistical aggregations must be interpreted with sample limits in mind.
        </div>
      </div>

      {/* Toolbar & View Mode Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* View Mode */}
          <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => setActiveTab('aggregate')}
              className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                activeTab === 'aggregate'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Aggregated Statistics ({filteredStats.length})
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                activeTab === 'events'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Individual Event Log ({filteredOccurrences.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 w-44"
            />
          </div>

          {activeTab === 'aggregate' && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Min Sample Size:</span>
              <select
                value={minSampleSize}
                onChange={(e) => setMinSampleSize(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value={0}>All (n ≥ 1)</option>
                <option value={5}>Moderate (n ≥ 5)</option>
                <option value={8}>High (n ≥ 8)</option>
              </select>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Trigger:</span>
              <select
                value={triggerFilter}
                onChange={(e) => setTriggerFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Triggers</option>
                <option value="RSI_LE_30">RSI ≤ 30 Oversold</option>
                <option value="RSI_LE_35">RSI ≤ 35 Oversold</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Aggregate Statistics View */}
      {activeTab === 'aggregate' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Symbol</th>
                  <th className="py-3 px-3">Event Count (n)</th>
                  <th className="py-3 px-3">Sample Reliability</th>
                  <th className="py-3 px-3">20D Win Rate</th>
                  <th className="py-3 px-3">60D Win Rate</th>
                  <th className="py-3 px-3">90D Win Rate</th>
                  <th className="py-3 px-3">Avg 60D Return</th>
                  <th className="py-3 px-3">Median 60D</th>
                  <th className="py-3 px-3">Std Dev</th>
                  <th className="py-3 px-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredStats.slice(0, 50).map((s, idx) => (
                  <tr key={`${s.symbol}-${idx}`} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-indigo-400">{s.symbol}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">{s.totalOccurrences} events</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          s.sampleSizeReliability.startsWith('High')
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                            : s.sampleSizeReliability.startsWith('Moderate')
                            ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                            : 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                        }`}
                      >
                        {s.sampleSizeReliability}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <span className={s.positive20DPct >= 60 ? 'text-emerald-400' : 'text-slate-300'}>
                        {s.positive20DPct}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <span
                        className={`font-bold ${
                          s.positive60DPct >= 75 ? 'text-emerald-400' : 'text-slate-200'
                        }`}
                      >
                        {s.positive60DPct}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <span className={s.positive90DPct >= 75 ? 'text-emerald-400' : 'text-slate-200'}>
                        {s.positive90DPct}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                      +{s.avgReturn60D}%
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">+{s.medianReturn60D}%</td>
                    <td className="py-2.5 px-3 font-mono text-amber-400">±{s.stdDevReturn60D}%</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onInspectStock(s.symbol)}
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

      {/* Individual Event Log View */}
      {activeTab === 'events' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-3">Symbol</th>
                  <th className="py-3 px-3">Trigger Type</th>
                  <th className="py-3 px-3">RSI at Signal</th>
                  <th className="py-3 px-3">Price at Signal</th>
                  <th className="py-3 px-3">Max Adverse DD</th>
                  <th className="py-3 px-3">20D Return</th>
                  <th className="py-3 px-3">60D Return</th>
                  <th className="py-3 px-3">90D Return</th>
                  <th className="py-3 px-3 text-emerald-300">120D</th>
                  <th className="py-3 px-3 text-emerald-300">180D</th>
                  <th className="py-3 px-3 text-emerald-200">220D</th>
                  <th className="py-3 px-3">Max Recovery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredOccurrences.slice(0, 50).map((occ, idx) => (
                  <tr key={`${occ.date}-${occ.symbol}-${idx}`} className="hover:bg-slate-800/50">
                    <td className="py-2.5 px-4 font-mono text-slate-300">{occ.date}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-400">{occ.symbol}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {occ.triggerType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-rose-400">{occ.rsiAtTrigger}</td>
                    <td className="py-2.5 px-3 font-mono text-white">₹{occ.priceAtTrigger}</td>
                    <td className="py-2.5 px-3 font-mono text-rose-400">
                      {occ.maxAdverseDrawdownPct}%
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <span className={(occ.return20D || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {(occ.return20D || 0) >= 0 ? '+' : ''}
                        {occ.return20D}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold">
                      <span className={(occ.return60D || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {(occ.return60D || 0) >= 0 ? '+' : ''}
                        {occ.return60D}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <span className={(occ.return90D || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {(occ.return90D || 0) >= 0 ? '+' : ''}
                        {occ.return90D}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-emerald-300">
                      {occ.return120D !== null && occ.return120D !== undefined ? (
                        <span className={(occ.return120D || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {(occ.return120D || 0) >= 0 ? '+' : ''}
                          {occ.return120D}%
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400 font-sans italic" title="Insufficient historical data available for this calculation.">Insufficient data</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-emerald-300">
                      {occ.return180D !== null && occ.return180D !== undefined ? (
                        <span className={(occ.return180D || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {(occ.return180D || 0) >= 0 ? '+' : ''}
                          {occ.return180D}%
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400 font-sans italic" title="Insufficient historical data available for this calculation.">Insufficient data</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-emerald-200 font-bold">
                      {occ.return220D !== null && occ.return220D !== undefined ? (
                        <span className={(occ.return220D || 0) >= 0 ? 'text-emerald-300' : 'text-rose-400'}>
                          {(occ.return220D || 0) >= 0 ? '+' : ''}
                          {occ.return220D}%
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400 font-sans italic" title="Insufficient historical data available for this calculation.">Insufficient data</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                      +{occ.maxSubsequentRecoveryPct}%
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
