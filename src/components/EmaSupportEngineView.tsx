import React, { useState, useMemo } from 'react';
import {
  Layers,
  Sparkles,
  Search,
  ChevronRight,
  Sliders,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { EmaInteractionRecord } from '../types/equity';
import { requestAiInterpretation } from '../services/aiInterpretationService';

interface Props {
  interactions: EmaInteractionRecord[];
  onInspectStock: (symbol: string) => void;
}

export const EmaSupportEngineView: React.FC<Props> = ({
  interactions,
  onInspectStock,
}) => {
  const [selectedEmaPeriod, setSelectedEmaPeriod] = useState<number>(200);
  const [proximityThreshold, setProximityThreshold] = useState<number>(3.0); // Default ±3%
  const [bouncedOnly, setBouncedOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // AI Interpretation State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Filtered interactions
  const filteredInteractions = useMemo(() => {
    return interactions.filter((item) => {
      if (selectedEmaPeriod !== 0 && item.emaPeriod !== selectedEmaPeriod) return false;
      if (Math.abs(item.proximityPct) > proximityThreshold) return false;
      if (bouncedOnly && !item.bouncedConfirmed) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!item.symbol.toLowerCase().includes(q) && !item.companyName.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [interactions, selectedEmaPeriod, proximityThreshold, bouncedOnly, searchQuery]);

  // Aggregate stats
  const aggregate = useMemo(() => {
    if (filteredInteractions.length === 0) return null;
    const total = filteredInteractions.length;
    const bounced = filteredInteractions.filter((i) => i.bouncedConfirmed).length;
    const bounceRate = ((bounced / total) * 100).toFixed(1);
    const avg30D = (
      filteredInteractions.reduce((acc, i) => acc + (i.return30D || 0), 0) / total
    ).toFixed(2);
    const avg60D = (
      filteredInteractions.reduce((acc, i) => acc + (i.return60D || 0), 0) / total
    ).toFixed(2);
    const avgMAE = (
      filteredInteractions.reduce((acc, i) => acc + i.maxAdverseExcursionPct, 0) / total
    ).toFixed(2);

    return {
      total,
      bounced,
      bounceRate,
      avg30D,
      avg60D,
      avgMAE,
    };
  }, [filteredInteractions]);

  const handleInterpretWithAI = async () => {
    setIsAiLoading(true);
    setAiError(null);
    setAiInterpretation(null);

    const sampleTable = filteredInteractions.slice(0, 10).map((i) => ({
      Date: i.date,
      Symbol: i.symbol,
      EmaLevel: `EMA ${i.emaPeriod}`,
      PriceAtTouch: `₹${i.priceAtInteraction}`,
      EmaValue: `₹${i.emaValue}`,
      ProximityPct: `${i.proximityPct}%`,
      BounceConfirmed: i.bouncedConfirmed ? 'Yes' : 'No',
      MaxAdverseExcursion: `${i.maxAdverseExcursionPct}%`,
      Return30D: `${i.return30D}%`,
      Return60D: `${i.return60D}%`,
    }));

    const payload = {
      question: `How did EMA ${
        selectedEmaPeriod ? selectedEmaPeriod : 'levels (20/50/100/200/400/500)'
      } behave historically when tested within a ±${proximityThreshold}% proximity band? What was the bounce frequency and average subsequent return?`,
      calculationType: 'EMA Rebound & Support Engine',
      summaryStats: {
        testedEmaPeriod: selectedEmaPeriod ? `EMA ${selectedEmaPeriod}` : 'All EMAs',
        proximityBandPct: `±${proximityThreshold}%`,
        totalInteractions: filteredInteractions.length,
        bounceSuccessRate: `${aggregate?.bounceRate}%`,
        average30DayReturn: `${aggregate?.avg30D}%`,
        average60DayReturn: `${aggregate?.avg60D}%`,
        avgMaxAdverseExcursion: `${aggregate?.avgMAE}%`,
      },
      compactTable: sampleTable,
      universeNotes:
        'Calculated deterministically with EMA periods 20, 50, 100, 200, 400, 500 across historical trading sessions.',
    };

    const res = await requestAiInterpretation(payload);
    setIsAiLoading(false);
    if (res.success && res.interpretation) {
      setAiInterpretation(res.interpretation);
    } else {
      setAiError(res.error || 'Failed to interpret EMA data.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase bg-blue-950/80 text-blue-300 border border-blue-800/60">
                Engine 5
              </span>
              <h2 className="text-xl font-bold text-white">
                Historical EMA Support & Rebound Engine
              </h2>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Evaluates how stocks interacted with key Exponential Moving Averages (EMA 20, 50, 100, 200, 400, 500) within configurable proximity thresholds, measuring adverse excursion and subsequent rebound.
            </p>
          </div>

          <button
            onClick={handleInterpretWithAI}
            disabled={isAiLoading || filteredInteractions.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold shadow-md transition-all cursor-pointer shrink-0"
          >
            <Sparkles className={`w-4 h-4 ${isAiLoading ? 'animate-spin' : 'text-indigo-200'}`} />
            {isAiLoading ? 'AI Calculating Interpretation...' : 'Interpret EMA Findings with AI'}
          </button>
        </div>

        {/* Aggregate Strip */}
        {aggregate && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800">
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60">
              <span className="text-xs text-slate-400 block font-medium">Historical Touches</span>
              <span className="text-lg font-bold text-white mt-0.5 block">
                {aggregate.total} interactions
              </span>
              <span className="text-[11px] text-slate-400">Within ±{proximityThreshold}% threshold</span>
            </div>

            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60">
              <span className="text-xs text-slate-400 block font-medium">Bounce Confirmation Rate</span>
              <span className="text-lg font-bold text-emerald-400 mt-0.5 block">
                {aggregate.bounceRate}%
              </span>
              <span className="text-[11px] text-slate-400">{aggregate.bounced} successful bounces</span>
            </div>

            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60">
              <span className="text-xs text-slate-400 block font-medium">Avg 30D / 60D Rebound</span>
              <span className="text-lg font-bold text-indigo-400 mt-0.5 block">
                +{aggregate.avg30D}% / +{aggregate.avg60D}%
              </span>
              <span className="text-[11px] text-slate-400">Mean forward gain</span>
            </div>

            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60">
              <span className="text-xs text-slate-400 block font-medium">Max Adverse Excursion</span>
              <span className="text-lg font-bold text-rose-400 mt-0.5 block">
                {aggregate.avgMAE}%
              </span>
              <span className="text-[11px] text-slate-400">Average dip below EMA</span>
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
              <span>AI Objective Interpretation: EMA Support Interactions</span>
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

      {/* Filter Toolbar & Proximity Slider */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* EMA Period Selector */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
            {[20, 50, 100, 200, 400, 500].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedEmaPeriod(period)}
                className={`px-2.5 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                  selectedEmaPeriod === period
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EMA {period}
              </button>
            ))}
            <button
              onClick={() => setSelectedEmaPeriod(0)}
              className={`px-2.5 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                selectedEmaPeriod === 0
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All EMAs
            </button>
          </div>

          {/* Proximity Threshold Slider */}
          <div className="flex items-center gap-2.5 text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/80">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>Proximity Threshold:</span>
            <input
              type="range"
              min="1"
              max="5"
              step="0.5"
              value={proximityThreshold}
              onChange={(e) => setProximityThreshold(parseFloat(e.target.value))}
              className="w-24 accent-indigo-500 cursor-pointer"
            />
            <span className="font-mono font-bold text-white">±{proximityThreshold.toFixed(1)}%</span>
          </div>

          {/* Bounced Only Toggle */}
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={bouncedOnly}
              onChange={(e) => setBouncedOnly(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Confirmed Bounces Only</span>
          </label>

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
          Showing <strong className="text-white">{filteredInteractions.length}</strong> qualifying historical interactions
        </div>
      </div>

      {/* Interactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-3">Symbol & Sector</th>
                <th className="py-3 px-3">EMA Level</th>
                <th className="py-3 px-3">Price at Interaction</th>
                <th className="py-3 px-3">EMA Value</th>
                <th className="py-3 px-3">Proximity %</th>
                <th className="py-3 px-3">Bounced?</th>
                <th className="py-3 px-3">Max Adverse DD</th>
                <th className="py-3 px-3">30D Return</th>
                <th className="py-3 px-3">60D Return</th>
                <th className="py-3 px-3">90D Return</th>
                <th className="py-3 px-3 text-emerald-300">120D</th>
                <th className="py-3 px-3 text-emerald-300">180D</th>
                <th className="py-3 px-3 text-emerald-200">220D</th>
                <th className="py-3 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredInteractions.slice(0, 50).map((i, idx) => (
                <tr key={`${i.date}-${i.symbol}-${i.emaPeriod}-${idx}`} className="hover:bg-slate-800/50">
                  <td className="py-2.5 px-4 font-mono text-slate-300">{i.date}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-indigo-400">{i.symbol}</span>
                      <span className="text-[11px] text-slate-400 truncate max-w-[120px]">{i.sector}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-white">EMA {i.emaPeriod}</td>
                  <td className="py-2.5 px-3 font-mono text-white">₹{i.priceAtInteraction}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">₹{i.emaValue}</td>
                  <td className="py-2.5 px-3 font-mono">
                    <span
                      className={
                        Math.abs(i.proximityPct) <= 1.0 ? 'text-emerald-400 font-bold' : 'text-slate-300'
                      }
                    >
                      {i.proximityPct > 0 ? `+${i.proximityPct}` : i.proximityPct}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {i.bouncedConfirmed ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                        <XCircle className="w-3.5 h-3.5" /> No
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-rose-400">
                    {i.maxAdverseExcursionPct}%
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    <span className={(i.return30D || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {(i.return30D || 0) >= 0 ? '+' : ''}
                      {i.return30D}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold">
                    <span className={(i.return60D || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {(i.return60D || 0) >= 0 ? '+' : ''}
                      {i.return60D}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    <span className={(i.return90D || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {(i.return90D || 0) >= 0 ? '+' : ''}
                      {i.return90D}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-emerald-300">
                    <span className={(i.return120D || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {(i.return120D || 0) >= 0 ? '+' : ''}
                      {i.return120D}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-emerald-300">
                    <span className={(i.return180D || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {(i.return180D || 0) >= 0 ? '+' : ''}
                      {i.return180D}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-emerald-200 font-bold">
                    <span className={(i.return220D || 0) >= 0 ? 'text-emerald-300' : 'text-rose-400'}>
                      {(i.return220D || 0) >= 0 ? '+' : ''}
                      {i.return220D}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => onInspectStock(i.symbol)}
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
