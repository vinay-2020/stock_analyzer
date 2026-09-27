import {
  TrendingUp,
  Layers,
  Building2,
  PieChart,
  BarChart3,
  IndianRupee,
  Coins,
  Activity,
} from 'lucide-react';
import { MarketDatasetSummary } from '../types/equity';
import { useCurrency } from '../context/CurrencyContext';

interface SummaryCardsProps {
  summary: MarketDatasetSummary;
}

export const SummaryCards = ({ summary }: SummaryCardsProps) => {
  const { formatCompactCurrency, formatNumber } = useCurrency();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Stocks Analyzed */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-slate-300 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Equities Analyzed
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
            <Building2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
            {summary.totalStocks}
          </span>
          <span className="text-xs text-slate-500 font-medium">Scrips</span>
        </div>
        <div className="mt-2 text-xs text-slate-600">
          <span>{summary.totalTransactions} Transaction records parsed</span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Lead Industry:</span>
          <span className="font-semibold text-slate-700 truncate max-w-[140px]">
            {summary.topIndustryByStocks}
          </span>
        </div>
      </div>

      {/* Sector & Industry Breadth */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-slate-300 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Sectors &amp; Industries
          </span>
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-purple-700 tracking-tight font-mono">
            {summary.totalSectors}
          </span>
          <span className="text-xs text-slate-500 font-medium">Sectors</span>
          <span className="text-slate-300">&bull;</span>
          <span className="text-lg font-bold text-slate-800 font-mono">
            {summary.totalIndustries}
          </span>
          <span className="text-xs text-slate-500 font-medium">Industries</span>
        </div>
        <div className="mt-2 text-xs text-slate-600 truncate">
          <span>Top Sector: <strong className="text-slate-800">{summary.topSectorByStocks}</strong></span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Categorization:</span>
          <span className="font-semibold text-slate-700 font-mono">
            100% Classified
          </span>
        </div>
      </div>

      {/* Recorded Traded Turnover */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-slate-300 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Recorded Traded Value
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
            ₹
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
            {formatCompactCurrency(summary.totalTradedValue)}
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-600">
          <span>{formatNumber(summary.totalTradedQuantity, 0)} Total units / shares</span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Turnover Leader:</span>
          <span className="font-semibold text-slate-700 truncate max-w-[140px]">
            {summary.topSectorByTurnover}
          </span>
        </div>
      </div>

      {/* Valuation & Quality Averages */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-slate-300 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Market Valuations
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
            {summary.avgMarketPe ? `${summary.avgMarketPe}x` : '—'}
          </span>
          <span className="text-xs text-slate-500">Avg P/E</span>
        </div>
        <div className="mt-2 text-xs text-slate-600 flex items-center gap-2">
          <span>Avg ROE: <strong className="text-emerald-700 font-mono">{summary.avgMarketRoe ? `${summary.avgMarketRoe}%` : '—'}</strong></span>
          <span>&bull;</span>
          <span>Yield: <strong className="text-slate-800 font-mono">{summary.avgMarketYield ? `${summary.avgMarketYield}%` : '—'}</strong></span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Data Grounding:</span>
          <span className="font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
            Exact CSV Metrics
          </span>
        </div>
      </div>
    </div>
  );
};
