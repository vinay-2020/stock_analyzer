import React, { useState, useMemo } from 'react';
import {
  TrendingDown,
  TrendingUp,
  ArrowUpDown,
  Filter,
  Sparkles,
  Calendar,
  AlertTriangle,
  Clock,
  Layers,
  ChevronRight,
  ShieldCheck,
  Search,
} from 'lucide-react';
import {
  MarketCorrectionEvent,
  StockCorrectionResponse,
  MarketCapTier,
} from '../types/equity';
import { requestAiInterpretation } from '../services/aiInterpretationService';

interface Props {
  events: MarketCorrectionEvent[];
  responses: StockCorrectionResponse[];
  selectedCapTier: MarketCapTier | 'ALL';
  onInspectStock: (symbol: string) => void;
}

export const CrisisCorrectionEngineView: React.FC<Props> = ({
  events,
  responses,
  selectedCapTier,
  onInspectStock,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || 'ALL');
  const [sectorFilter, setSectorFilter] = useState<string>('ALL');
  const [reboundFilter, setReboundFilter] = useState<string>('ALL');
  const [relativeDrawdownFilter, setRelativeDrawdownFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<keyof StockCorrectionResponse>('return60D');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // AI Interpretation State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Unique sectors in the current dataset
  const sectors = useMemo(() => {
    const set = new Set<string>();
    responses.forEach((r) => {
      if (r.sector) set.add(r.sector);
    });
    return Array.from(set).sort();
  }, [responses]);

  // Active event object
  const activeEvent = useMemo(() => {
    if (selectedEventId === 'ALL') return null;
    return events.find((e) => e.id === selectedEventId) || null;
  }, [events, selectedEventId]);

  // Filtered responses
  const filteredResponses = useMemo(() => {
    return responses.filter((r) => {
      if (selectedEventId !== 'ALL' && r.eventId !== selectedEventId) return false;
      if (selectedCapTier !== 'ALL' && r.capTier !== selectedCapTier) return false;
      if (sectorFilter !== 'ALL' && r.sector !== sectorFilter) return false;
      if (relativeDrawdownFilter !== 'ALL' && r.relativeDrawdownCategory !== relativeDrawdownFilter)
        return false;

      // Rebound filters
      if (reboundFilter === 'RET_60D_20PLUS' && (r.return60D || 0) < 20) return false;
      if (reboundFilter === 'RET_60D_30PLUS' && (r.return60D || 0) < 30) return false;
      if (reboundFilter === 'RET_90D_40PLUS' && (r.return90D || 0) < 40) return false;
      if (reboundFilter === 'RET_120D_30PLUS' && (r.return120D || 0) < 30) return false;
      if (reboundFilter === 'RET_180D_40PLUS' && (r.return180D || 0) < 40) return false;
      if (reboundFilter === 'RET_220D_50PLUS' && (r.return220D || 0) < 50) return false;
      if (reboundFilter === 'RSI_30_OVERSOLD' && !r.rsiOversold30Occurred) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSymbol = r.symbol.toLowerCase().includes(q);
        const matchesName = r.companyName.toLowerCase().includes(q);
        if (!matchesSymbol && !matchesName) return false;
      }

      return true;
    });
  }, [
    responses,
    selectedEventId,
    selectedCapTier,
    sectorFilter,
    reboundFilter,
    relativeDrawdownFilter,
    searchQuery,
  ]);

  // Sorted responses
  const sortedResponses = useMemo(() => {
    return [...filteredResponses].sort((a, b) => {
      const valA = (a[sortField] as any) ?? -Infinity;
      const valB = (b[sortField] as any) ?? -Infinity;
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredResponses, sortField, sortDirection]);

  const handleSort = (field: keyof StockCorrectionResponse) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Trigger server-side Gemini interpretation of the deterministic results
  const handleInterpretWithAI = async () => {
    setIsAiLoading(true);
    setAiError(null);
    setAiInterpretation(null);

    // Compact summary table of top 10 qualifying stocks
    const topSample = sortedResponses.slice(0, 10).map((r) => ({
      Symbol: r.symbol,
      CapTier: r.capTier,
      Sector: r.sector,
      Event: r.eventName,
      MaxDrawdownPct: `${r.maxDrawdownPct}%`,
      LowestRsi: r.lowestRsi,
      Return20D: `${r.return20D}%`,
      Return60D: `${r.return60D}%`,
      Return90D: `${r.return90D}%`,
      DaysTo20Pct: r.daysTo20PctGain ? `${r.daysTo20PctGain} days` : 'Not reached',
      RecoverySpeedVsNifty: r.recoverySpeedVsNifty,
    }));

    const avgReturn60 =
      sortedResponses.length > 0
        ? (sortedResponses.reduce((acc, r) => acc + (r.return60D || 0), 0) / sortedResponses.length).toFixed(2)
        : '0';

    const avgDrawdown =
      sortedResponses.length > 0
        ? (sortedResponses.reduce((acc, r) => acc + r.maxDrawdownPct, 0) / sortedResponses.length).toFixed(2)
        : '0';

    const payload = {
      question: `Analyze how these qualifying stocks behaved during ${
        activeEvent ? activeEvent.name : 'major NIFTY 50 corrections'
      }, focusing on drawdown containment, recovery duration to +20%, and sector dispersion.`,
      calculationType: 'Market Correction & Stock Rebound Response Engine',
      summaryStats: {
        totalQualifyingStocks: sortedResponses.length,
        averageStockDrawdownPct: `${avgDrawdown}%`,
        average60DayReboundPct: `${avgReturn60}%`,
        niftyDeclinePct: activeEvent ? `${activeEvent.niftyDeclinePct}%` : 'Variable across events',
        activeFilter: reboundFilter,
        sampleCapTier: selectedCapTier,
      },
      compactTable: topSample,
      universeNotes: `Deterministic calculation on historical daily OHLC data. Strict sample size: n=${sortedResponses.length}. Never guarantee future returns.`,
    };

    const res = await requestAiInterpretation(payload);
    setIsAiLoading(false);
    if (res.success && res.interpretation) {
      setAiInterpretation(res.interpretation);
    } else {
      setAiError(res.error || 'Unable to connect to AI interpretation service.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Engine Overview Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase bg-rose-950/80 text-rose-300 border border-rose-800/60">
                Engine 1 & 2
              </span>
              <h2 className="text-xl font-bold text-white">
                Market Correction & Stock Rebound Response Engine
              </h2>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Deterministic calculation of stock drawdowns, lowest RSI readings, and forward 5D–90D rebounds following verified NIFTY 50 correction events.
            </p>
          </div>

          <button
            onClick={handleInterpretWithAI}
            disabled={isAiLoading || sortedResponses.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold shadow-md transition-all cursor-pointer shrink-0"
          >
            <Sparkles className={`w-4 h-4 ${isAiLoading ? 'animate-spin' : 'text-indigo-200'}`} />
            {isAiLoading ? 'AI Calculating Interpretation...' : 'Interpret Calculation with AI'}
          </button>
        </div>

        {/* NIFTY 50 Correction Events Timeline Strip */}
        <div className="mt-5 pt-5 border-t border-slate-800">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
            <span>Historical NIFTY 50 Correction Events (Identified from Index Price Series)</span>
            <span className="text-[11px] text-slate-400 font-normal">
              Showing {events.length} Historical Windows
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {events.map((evt) => {
              const isSelected = selectedEventId === evt.id;
              return (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEventId(evt.id)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-indigo-500 shadow-md ring-1 ring-indigo-500/40'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-slate-200 line-clamp-1">{evt.name}</span>
                    <span className="text-xs font-bold text-rose-400 bg-rose-950/60 border border-rose-900/60 px-1.5 py-0.5 rounded">
                      {evt.niftyDeclinePct}%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Peak: {evt.peakDate} → Trough: {evt.troughDate}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-700/50 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Days to Trough:</span>
                      <span className="font-semibold text-slate-200">{evt.daysToTrough} trading days</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Peak Recovery:</span>
                      <span className="font-semibold text-slate-200">
                        {evt.daysToRecoveryPeak ? `${evt.daysToRecoveryPeak} days` : 'In progress'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Interpretation Result Banner */}
      {aiInterpretation && (
        <div className="bg-indigo-950/40 border border-indigo-800/80 rounded-xl p-5 text-slate-200 relative shadow-lg animate-fade-in">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-indigo-800/40">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>AI Objective Interpretation of Verified Calculations</span>
              <span className="text-xs text-indigo-400/80 font-normal">
                (Model: gemini-3.8-flash • Telemetry Verified)
              </span>
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
          <div className="mt-3 pt-3 border-t border-indigo-900/50 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Historical calculations strictly computed by code. No future returns guaranteed.</span>
            <span>n = {sortedResponses.length} qualifying stocks</span>
          </div>
        </div>
      )}

      {aiError && (
        <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-4 text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>AI Interpretation Error: {aiError} (Historical calculations remain 100% valid)</span>
          </div>
          <button onClick={() => setAiError(null)} className="underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter & Sorter Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search symbol or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 w-52"
            />
          </div>

          {/* Event Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Event:</span>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Events Aggregated</option>
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.name} ({evt.niftyDeclinePct}%)
                </option>
              ))}
            </select>
          </div>

          {/* Sector Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Sector:</span>
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Sectors ({sectors.length})</option>
              {sectors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Rebound Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Rebound Filter:</span>
            <select
              value={reboundFilter}
              onChange={(e) => setReboundFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Rebound Levels</option>
              <option value="RET_60D_20PLUS">≥ 20% Rebound within 60 Days</option>
              <option value="RET_60D_30PLUS">≥ 30% Rebound within 60 Days</option>
              <option value="RET_90D_40PLUS">≥ 40% Rebound within 90 Days</option>
              <option value="RET_120D_30PLUS">≥ 30% Rebound within 120 Days</option>
              <option value="RET_180D_40PLUS">≥ 40% Rebound within 180 Days</option>
              <option value="RET_220D_50PLUS">≥ 50% Rebound within 220 Days (~1 Yr)</option>
              <option value="RSI_30_OVERSOLD">RSI Oversold (≤ 30) Rebound</option>
            </select>
          </div>

          {/* Relative Drawdown vs NIFTY */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Relative to NIFTY:</span>
            <select
              value={relativeDrawdownFilter}
              onChange={(e) => setRelativeDrawdownFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Behavior</option>
              <option value="fell_less">Fell Less than NIFTY (Defensive)</option>
              <option value="fell_in_line">Fell In-Line with NIFTY</option>
              <option value="fell_more">Fell More than NIFTY (High Beta)</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Showing <strong className="text-white">{sortedResponses.length}</strong> calculated stock responses
        </div>
      </div>

      {/* Deterministic Results Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Symbol & Company</th>
                <th className="py-3 px-3">Tier / Sector</th>
                <th
                  className="py-3 px-3 cursor-pointer hover:text-white"
                  onClick={() => handleSort('maxDrawdownPct')}
                >
                  <div className="flex items-center gap-1">
                    <span>Drawdown %</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="py-3 px-3 cursor-pointer hover:text-white"
                  onClick={() => handleSort('lowestRsi')}
                >
                  <div className="flex items-center gap-1">
                    <span>Lowest RSI</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="py-3 px-3 cursor-pointer hover:text-white"
                  onClick={() => handleSort('return20D')}
                >
                  <div className="flex items-center gap-1">
                    <span>20D Return</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="py-3 px-3 cursor-pointer hover:text-white"
                  onClick={() => handleSort('return60D')}
                >
                  <div className="flex items-center gap-1">
                    <span>60D Return</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="py-3 px-3 cursor-pointer hover:text-white"
                  onClick={() => handleSort('return90D')}
                >
                  <div className="flex items-center gap-1">
                    <span>90D Return</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="py-3 px-3 cursor-pointer hover:text-white"
                  onClick={() => handleSort('return120D')}
                >
                  <div className="flex items-center gap-1">
                    <span>120D Return</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="py-3 px-3 cursor-pointer hover:text-white"
                  onClick={() => handleSort('return180D')}
                >
                  <div className="flex items-center gap-1">
                    <span>180D Return</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="py-3 px-3 cursor-pointer hover:text-white"
                  onClick={() => handleSort('return220D')}
                >
                  <div className="flex items-center gap-1">
                    <span>220D Return</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Days to +20%</th>
                <th className="py-3 px-3">Relative to NIFTY</th>
                <th className="py-3 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sortedResponses.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-8 text-center text-slate-400">
                    Insufficient historical data available for this calculation or filter combination.
                  </td>
                </tr>
              ) : (
                sortedResponses.slice(0, 50).map((r, idx) => {
                  return (
                    <tr
                      key={`${r.eventId}-${r.symbol}-${idx}`}
                      className="hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-2.5 px-4 font-medium text-white">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-indigo-400 font-bold">{r.symbol}</span>
                          {r.isCorporateActionAdjusted && (
                            <span className="text-[9px] px-1 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-normal shrink-0" title={r.corporateActionDetails}>
                              Split-Adj
                            </span>
                          )}
                          <span className="text-slate-400 text-[11px] truncate max-w-[140px]">
                            {r.companyName}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              r.capTier === 'HIGH'
                                ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
                                : r.capTier === 'MID'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {r.capTier}
                          </span>
                          <span className="text-slate-400 text-[11px] truncate max-w-[120px]">
                            {r.sector}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-rose-400">
                        {r.maxDrawdownPct}%
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[11px] ${
                            r.lowestRsi <= 30
                              ? 'bg-rose-950 text-rose-300 font-bold border border-rose-800'
                              : r.lowestRsi <= 35
                              ? 'bg-amber-950 text-amber-300 font-bold border border-amber-800'
                              : 'text-slate-300'
                          }`}
                        >
                          {r.lowestRsi}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        <span
                          className={
                            (r.return20D || 0) >= 0 ? 'text-emerald-400 font-medium' : 'text-rose-400'
                          }
                        >
                          {(r.return20D || 0) >= 0 ? '+' : ''}
                          {r.return20D}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        <span
                          className={`font-bold ${
                            (r.return60D || 0) >= 20
                              ? 'text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-900/60'
                              : (r.return60D || 0) >= 0
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {(r.return60D || 0) >= 0 ? '+' : ''}
                          {r.return60D}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        <span
                          className={
                            (r.return90D || 0) >= 0 ? 'text-emerald-400 font-medium' : 'text-rose-400'
                          }
                        >
                          {(r.return90D || 0) >= 0 ? '+' : ''}
                          {r.return90D}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {r.return120D !== null && r.return120D !== undefined ? (
                          <span
                            className={
                              (r.return120D || 0) >= 0 ? 'text-emerald-400 font-medium' : 'text-rose-400'
                            }
                          >
                            {(r.return120D || 0) >= 0 ? '+' : ''}
                            {r.return120D}%
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-400/90 font-sans italic" title="Insufficient historical data available for this calculation.">
                            Insufficient historical data available for this calculation.
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {r.return180D !== null && r.return180D !== undefined ? (
                          <span
                            className={
                              (r.return180D || 0) >= 0 ? 'text-emerald-400 font-medium' : 'text-rose-400'
                            }
                          >
                            {(r.return180D || 0) >= 0 ? '+' : ''}
                            {r.return180D}%
                            {r.overlapsNextCorrection && <span className="ml-1 text-[9px] text-amber-400" title="Overlaps next correction cycle">⚠️</span>}
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-400/90 font-sans italic" title="Insufficient historical data available for this calculation.">
                            Insufficient historical data available for this calculation.
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {r.return220D !== null && r.return220D !== undefined ? (
                          <span
                            className={
                              (r.return220D || 0) >= 0 ? 'text-emerald-400 font-medium' : 'text-rose-400'
                            }
                          >
                            {(r.return220D || 0) >= 0 ? '+' : ''}
                            {r.return220D}%
                            {r.overlapsNextCorrection && <span className="ml-1 text-[9px] text-amber-400" title="Overlaps next correction cycle">⚠️</span>}
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-400/90 font-sans italic" title="Insufficient historical data available for this calculation.">
                            Insufficient historical data available for this calculation.
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 font-mono">
                        {r.daysTo20PctGain ? (
                          <span className="text-slate-200 font-semibold">{r.daysTo20PctGain} days</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                            r.relativeDrawdownCategory === 'fell_less'
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                              : r.relativeDrawdownCategory === 'fell_more'
                              ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {r.relativeDrawdownCategory === 'fell_less'
                            ? 'Fell Less'
                            : r.relativeDrawdownCategory === 'fell_more'
                            ? 'Fell More'
                            : 'In-Line'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => onInspectStock(r.symbol)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                        >
                          Inspect <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer pagination info */}
        {sortedResponses.length > 50 && (
          <div className="p-3 bg-slate-800/60 border-t border-slate-800 text-center text-xs text-slate-400">
            Showing top 50 of {sortedResponses.length} calculated records. Refine filters above for specific sub-samples.
          </div>
        )}
      </div>
    </div>
  );
};
