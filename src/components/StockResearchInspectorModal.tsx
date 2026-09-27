import React from 'react';
import {
  X,
  TrendingDown,
  TrendingUp,
  Activity,
  Calendar,
  Layers,
  Shield,
  Info,
  ExternalLink,
} from 'lucide-react';
import {
  StockEquity,
  StockCorrectionResponse,
  RsiAggregateStats,
} from '../types/equity';

interface Props {
  symbol: string | null;
  stock: StockEquity | null;
  responses: StockCorrectionResponse[];
  rsiStat?: RsiAggregateStats;
  onClose: () => void;
}

export const StockResearchInspectorModal: React.FC<Props> = ({
  symbol,
  stock,
  responses,
  rsiStat,
  onClose,
}) => {
  if (!symbol || !stock) return null;

  const stockResponses = responses.filter((r) => r.symbol === symbol);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl text-slate-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-mono text-white">{stock.symbol}</h2>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded ${
                  stock.capTier === 'HIGH'
                    ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
                    : stock.capTier === 'MID'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {stock.capTier}-CAP
              </span>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                Rank #{stock.marketCapRank}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {stock.companyName} • <strong className="text-slate-300">{stock.sector}</strong> ({stock.industry})
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Key Fundamentals Snapshot */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60">
              <span className="text-slate-400 block">Market Cap</span>
              <span className="text-sm font-bold text-white mt-0.5 block">
                {stock.marketCap || '—'}
              </span>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60">
              <span className="text-slate-400 block">Current Reference Price</span>
              <span className="text-sm font-bold text-white mt-0.5 block">
                ₹{stock.currentPrice?.toLocaleString('en-IN') || '—'}
              </span>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60">
              <span className="text-slate-400 block">P/E Ratio</span>
              <span className="text-sm font-bold text-white mt-0.5 block">
                {stock.peRatio ? `${stock.peRatio}x` : '—'}
              </span>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60">
              <span className="text-slate-400 block">52-Week Range</span>
              <span className="text-sm font-bold text-slate-300 mt-0.5 block">
                ₹{stock.week52Low} – ₹{stock.week52High}
              </span>
            </div>
          </div>

          {/* Index Memberships */}
          {stock.indices && stock.indices.length > 0 && (
            <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/60 flex items-center gap-2.5 flex-wrap text-xs">
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider shrink-0">
                Index Memberships:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {stock.indices.map((idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 font-mono text-[10px] font-semibold"
                  >
                    {idx}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Historical NIFTY Corrections Scorecard */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-400" />
                <span>Historical Behavior Across Major NIFTY 50 Corrections</span>
              </h3>
              <span className="text-xs text-slate-400">
                {stockResponses.length} Correction Events Recorded
              </span>
            </div>

            {stockResponses.some((r) => r.isCorporateActionAdjusted) && (
              <div className="mb-3 p-2.5 rounded-lg bg-sky-950/60 border border-sky-800 text-xs text-sky-200 flex items-center gap-2 font-sans">
                <span>ℹ️</span>
                <span>
                  <strong>Split-Adjusted Data:</strong> {stockResponses.find((r) => r.corporateActionDetails)?.corporateActionDetails || 'Historical prices adjusted for 10:1 stock split.'}
                </span>
              </div>
            )}

            {stockResponses.length === 0 ? (
              <div className="p-6 bg-slate-800/30 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
                Insufficient historical data available for this calculation.
              </div>
            ) : (
              <div className="bg-slate-800/40 rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Correction Event</th>
                      <th className="py-2.5 px-3">Stock Drawdown</th>
                      <th className="py-2.5 px-3">Lowest RSI</th>
                      <th className="py-2.5 px-3">Relative to NIFTY</th>
                      <th className="py-2.5 px-3">20D Rebound</th>
                      <th className="py-2.5 px-3">60D Rebound</th>
                      <th className="py-2.5 px-3">90D Rebound</th>
                      <th className="py-2.5 px-3 text-emerald-300">120D</th>
                      <th className="py-2.5 px-3 text-emerald-300">180D</th>
                      <th className="py-2.5 px-3 text-emerald-200">220D</th>
                      <th className="py-2.5 px-3">Days to +20%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {stockResponses.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/50">
                        <td className="py-2.5 px-3 font-medium text-slate-200">
                          <div className="flex items-center gap-1.5">
                            <span>{r.eventName}</span>
                            {r.overlapsNextCorrection && (
                              <span className="text-[9px] px-1 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 shrink-0 font-sans" title={r.overlapDetails}>
                                ⚠️ Overlap
                              </span>
                            )}
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
                                : 'text-slate-300'
                            }`}
                          >
                            {r.lowestRsi}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              r.relativeDrawdownCategory === 'fell_less'
                                ? 'bg-emerald-950 text-emerald-300'
                                : r.relativeDrawdownCategory === 'fell_more'
                                ? 'bg-rose-950 text-rose-300'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {r.relativeDrawdownCategory === 'fell_less'
                              ? 'Fell Less'
                              : r.relativeDrawdownCategory === 'fell_more'
                              ? 'Fell More'
                              : 'In-Line'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-400">+{r.return20D}%</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                          +{r.return60D}%
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-400">+{r.return90D}%</td>
                        <td className="py-2.5 px-3 font-mono text-emerald-300">
                          {r.return120D !== null && r.return120D !== undefined ? (
                            `+${r.return120D}%`
                          ) : (
                            <span className="text-[10px] text-amber-400 font-sans italic" title="Insufficient historical data available for this calculation.">
                              Insufficient historical data available for this calculation.
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-300">
                          {r.return180D !== null && r.return180D !== undefined ? (
                            <span>
                              +{r.return180D}%
                              {r.overlapsNextCorrection && <span className="ml-1 text-[9px] text-amber-400" title="Overlaps next correction cycle">⚠️</span>}
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-400 font-sans italic" title="Insufficient historical data available for this calculation.">
                              Insufficient historical data available for this calculation.
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-200 font-bold">
                          {r.return220D !== null && r.return220D !== undefined ? (
                            <span>
                              +{r.return220D}%
                              {r.overlapsNextCorrection && <span className="ml-1 text-[9px] text-amber-400" title="Overlaps next correction cycle">⚠️</span>}
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-400 font-sans italic" title="Insufficient historical data available for this calculation.">
                              Insufficient historical data available for this calculation.
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-200">
                          {r.daysTo20PctGain ? `${r.daysTo20PctGain} days` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* RSI Rebound Profile */}
          {rsiStat && (
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                RSI Oversold Historical Rebound Distribution
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Total Oversold Events:</span>
                  <span className="font-semibold text-white">{rsiStat.totalOccurrences} times</span>
                </div>
                <div>
                  <span className="text-slate-400 block">60D Positive Win Rate:</span>
                  <span className="font-semibold text-emerald-400">{rsiStat.positive60DPct}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Average 60D Gain:</span>
                  <span className="font-semibold text-indigo-400">+{rsiStat.avgReturn60D}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Standard Deviation:</span>
                  <span className="font-semibold text-amber-400">±{rsiStat.stdDevReturn60D}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Strict Data Transparency Notice */}
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong>Historical Data Notice:</strong> All drawdown figures, rebound percentages, and EMA interaction measurements are computed deterministically from historical daily trading records (2020–2024). Past performance does not guarantee future results. No buy or sell advice is implied.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
