import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  CheckCircle2,
  Terminal,
  Table,
  Cpu,
  AlertCircle,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import {
  StockCorrectionResponse,
  MarketCorrectionEvent,
  RsiAggregateStats,
} from '../types/equity';
import { requestAiInterpretation } from '../services/aiInterpretationService';

interface Props {
  responses: StockCorrectionResponse[];
  events: MarketCorrectionEvent[];
  rsiStats: RsiAggregateStats[];
  onInspectStock: (symbol: string) => void;
}

interface CuratedQuery {
  id: string;
  title: string;
  question: string;
  filterFn: (
    responses: StockCorrectionResponse[],
    rsiStats: RsiAggregateStats[]
  ) => {
    table: any[];
    summary: Record<string, any>;
    engineType: string;
  };
}

export const AiResearchPanel: React.FC<Props> = ({
  responses,
  events,
  rsiStats,
  onInspectStock,
}) => {
  const curatedQueries: CuratedQuery[] = [
    {
      id: 'rebound-20-60d',
      title: 'Stocks Rebounding >20% within 60 Trading Days',
      question:
        'Which stocks historically recovered more than 20% within 60 trading days after major NIFTY corrections, and what was their average drawdown?',
      filterFn: (res) => {
        const qualifying = res
          .filter((r) => (r.return60D || 0) >= 20)
          .sort((a, b) => (b.return60D || 0) - (a.return60D || 0));

        const avgDD = (
          qualifying.reduce((s, q) => s + q.maxDrawdownPct, 0) / (qualifying.length || 1)
        ).toFixed(2);
        const avg60 = (
          qualifying.reduce((s, q) => s + (q.return60D || 0), 0) / (qualifying.length || 1)
        ).toFixed(2);

        return {
          engineType: 'Market Correction Response Engine',
          summary: {
            totalQualifyingEvents: qualifying.length,
            averageDrawdownDuringFall: `${avgDD}%`,
            average60DayRebound: `+${avg60}%`,
            thresholdCriteria: 'Forward 60D Return ≥ 20.0%',
          },
          table: qualifying.slice(0, 10).map((q) => ({
            Symbol: q.symbol,
            Company: q.companyName,
            Sector: q.sector,
            Event: q.eventName,
            DrawdownPct: `${q.maxDrawdownPct}%`,
            Return60D: `+${q.return60D}%`,
            DaysTo20Pct: q.daysTo20PctGain ? `${q.daysTo20PctGain} days` : 'Within 60D',
          })),
        };
      },
    },
    {
      id: 'rsi-oversold-winrate',
      title: 'Stocks with Repeated RSI ≤ 30 Rebound Consistency',
      question:
        'Which stocks repeatedly showed RSI oversold (≤30) rebound behavior with high positive outcome rates (≥75%) at 60 days?',
      filterFn: (_res, stats) => {
        const qualifying = stats
          .filter((s) => s.positive60DPct >= 75 && s.totalOccurrences >= 5)
          .sort((a, b) => b.positive60DPct - a.positive60DPct || b.avgReturn60D - a.avgReturn60D);

        return {
          engineType: 'RSI Rebound Statistical Engine',
          summary: {
            qualifyingStocksCount: qualifying.length,
            minimumSampleSizeEnforced: 'n ≥ 5 occurrences',
            minimumWinRateRequired: '≥ 75% positive at 60D',
          },
          table: qualifying.slice(0, 10).map((s) => ({
            Symbol: s.symbol,
            SampleSize: s.totalOccurrences,
            WinRate60D: `${s.positive60DPct}%`,
            WinRate90D: `${s.positive90DPct}%`,
            AvgReturn60D: `+${s.avgReturn60D}%`,
            MedianReturn60D: `+${s.medianReturn60D}%`,
            StdDev: `±${s.stdDevReturn60D}%`,
            Reliability: s.sampleSizeReliability,
          })),
        };
      },
    },
    {
      id: 'controlled-drawdown',
      title: 'Stocks with Controlled Drawdowns vs NIFTY',
      question:
        'Which stocks exhibited resilient, controlled drawdowns (fell less than NIFTY 50) while maintaining strong positive 90-day recoveries?',
      filterFn: (res) => {
        const qualifying = res
          .filter((r) => r.relativeDrawdownCategory === 'fell_less' && (r.return90D || 0) >= 15)
          .sort((a, b) => b.relativeDrawdownPct - a.relativeDrawdownPct);

        return {
          engineType: 'Relative Strength & Resilience Engine',
          summary: {
            totalQualifyingStocks: qualifying.length,
            criteria: 'Stock Drawdown < NIFTY Drawdown AND 90D Return ≥ +15%',
          },
          table: qualifying.slice(0, 10).map((q) => ({
            Symbol: q.symbol,
            Sector: q.sector,
            StockDrawdown: `${q.maxDrawdownPct}%`,
            NiftyDecline: `${q.niftyDeclinePct}%`,
            AlphaDrawdown: `+${q.relativeDrawdownPct}% (resilient)`,
            Return90D: `+${q.return90D}%`,
          })),
        };
      },
    },
  ];

  const [activeQueryId, setActiveQueryId] = useState<string>(curatedQueries[0].id);
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [codeExecuting, setCodeExecuting] = useState<boolean>(false);
  const [calculatedSummary, setCalculatedSummary] = useState<any>(null);
  const [calculatedTable, setCalculatedTable] = useState<any[]>([]);
  const [aiInterpretation, setAiInterpretation] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const runQuery = async (queryItem: CuratedQuery) => {
    setActiveQueryId(queryItem.id);
    setAiInterpretation(null);
    setErrorMsg(null);
    setCodeExecuting(true);

    // Step 1 & 2: Application code calculates deterministically
    const result = queryItem.filterFn(responses, rsiStats);
    setCalculatedSummary(result.summary);
    setCalculatedTable(result.table);
    setCodeExecuting(false);

    // Step 3: Send compact verified table to server-side Gemini
    setAiLoading(true);
    const res = await requestAiInterpretation({
      question: queryItem.question,
      calculationType: result.engineType,
      summaryStats: result.summary,
      compactTable: result.table,
      universeNotes: 'Strict code calculation. No invented numbers or future return forecasts.',
    });
    setAiLoading(false);

    if (res.success && res.interpretation) {
      setAiInterpretation(res.interpretation);
    } else {
      setErrorMsg(res.error || 'AI interpretation service temporarily unavailable.');
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;

    setActiveQueryId('custom');
    setAiInterpretation(null);
    setErrorMsg(null);
    setCodeExecuting(true);

    // Run general 60D rebound sort as baseline deterministic dataset
    const sorted = [...responses].sort((a, b) => (b.return60D || 0) - (a.return60D || 0));
    const compact = sorted.slice(0, 10).map((r) => ({
      Symbol: r.symbol,
      CapTier: r.capTier,
      Sector: r.sector,
      Event: r.eventName,
      DrawdownPct: `${r.maxDrawdownPct}%`,
      LowestRsi: r.lowestRsi,
      Return60D: `+${r.return60D}%`,
      Return90D: `+${r.return90D}%`,
    }));

    const summary = {
      userQuestion: customQuestion,
      universeEvaluated: responses.length,
    };

    setCalculatedSummary(summary);
    setCalculatedTable(compact);
    setCodeExecuting(false);

    setAiLoading(true);
    const res = await requestAiInterpretation({
      question: customQuestion,
      calculationType: 'General Historical Query Engine',
      summaryStats: summary,
      compactTable: compact,
      universeNotes: 'Deterministic dataset. Code Calculates. AI Interprets.',
    });
    setAiLoading(false);

    if (res.success && res.interpretation) {
      setAiInterpretation(res.interpretation);
    } else {
      setErrorMsg(res.error || 'AI interpretation service encountered an error.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase bg-purple-950/80 text-purple-300 border border-purple-800/60">
            Core AI Workflow
          </span>
          <h2 className="text-xl font-bold text-white">
            "Code Calculates. AI Interprets." Research Console
          </h2>
        </div>
        <p className="text-slate-400 text-sm mt-1">
          Strict quantitative pipeline: Application code parses, calculates, and filters the deterministic data first. Gemini only interprets the resulting verified numbers without guessing.
        </p>

        {/* Workflow Diagram */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-800 text-xs">
          <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Step 1</span>
            <span className="font-bold text-slate-200">Historical Parquet/OHLC</span>
          </div>
          <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
            <span className="text-[10px] text-indigo-400 uppercase font-semibold block">Step 2: Code</span>
            <span className="font-bold text-indigo-300">Deterministic Indicator Math</span>
          </div>
          <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
            <span className="text-[10px] text-emerald-400 uppercase font-semibold block">Step 3: Verification</span>
            <span className="font-bold text-emerald-300">Compact Result Table</span>
          </div>
          <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
            <span className="text-[10px] text-purple-400 uppercase font-semibold block">Step 4: AI</span>
            <span className="font-bold text-purple-300">Gemini Interpretation</span>
          </div>
        </div>
      </div>

      {/* Curated Institutional Research Questions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {curatedQueries.map((q) => {
          const isActive = activeQueryId === q.id;
          return (
            <div
              key={q.id}
              onClick={() => runQuery(q)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isActive
                  ? 'bg-slate-800/90 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                  : 'bg-slate-900 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-bold text-indigo-400 mb-1">{q.title}</div>
              <div className="text-xs text-slate-300 line-clamp-3">{q.question}</div>
              <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-indigo-300 flex items-center gap-1 font-semibold">
                <span>Execute Deterministic Pipeline</span> →
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Research Question Form */}
      <form
        onSubmit={handleCustomSubmit}
        className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex gap-2 items-center"
      >
        <Search className="w-4 h-4 text-slate-400 ml-1" />
        <input
          type="text"
          placeholder="Ask a custom research question (e.g. Which High-Cap stocks recovered fastest after the 2020 crash?)..."
          value={customQuestion}
          onChange={(e) => setCustomQuestion(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={aiLoading || codeExecuting || !customQuestion.trim()}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer shrink-0 transition-colors"
        >
          Calculate & Interpret
        </button>
      </form>

      {/* Result Display: Deterministic Table First, Gemini Interpretation Below */}
      {(calculatedTable.length > 0 || aiInterpretation || aiLoading) && (
        <div className="space-y-4">
          {/* Step A: Deterministic Verified Calculation Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  Step 1 & 2: Verified Deterministic Calculation Output
                </h3>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/60">
                Code Computed • Zero AI Inventions
              </span>
            </div>

            {calculatedSummary && (
              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60 mb-4 text-xs font-mono text-slate-300">
                <span className="text-slate-400 block mb-1">Calculated Statistical Metadata:</span>
                {JSON.stringify(calculatedSummary, null, 2)}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800 text-slate-400 uppercase font-semibold">
                  <tr>
                    {calculatedTable[0] &&
                      Object.keys(calculatedTable[0]).map((key) => (
                        <th key={key} className="py-2.5 px-3">
                          {key}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {calculatedTable.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      {Object.values(row).map((val: any, vIdx) => (
                        <td key={vIdx} className="py-2 px-3">
                          {String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Step B: Gemini Factual Interpretation */}
          <div className="bg-indigo-950/40 border border-indigo-800/80 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm pb-3 mb-3 border-b border-indigo-800/40">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Step 3 & 4: Gemini 3.8 Flash Interpretation of Verified Numbers</span>
            </div>

            {aiLoading ? (
              <div className="py-8 text-center text-indigo-300 text-xs flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Interpreting deterministic numbers with Gemini 3.8 Flash...</span>
              </div>
            ) : aiInterpretation ? (
              <div className="text-sm leading-relaxed text-slate-200 whitespace-pre-line font-sans">
                {aiInterpretation}
              </div>
            ) : errorMsg ? (
              <div className="text-xs text-rose-400">{errorMsg}</div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
