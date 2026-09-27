import { useState, useMemo } from 'react';
import {
  Layers,
  Building2,
  PieChart,
  BarChart3,
  ChevronRight,
  Filter,
  ArrowUpDown,
  TrendingUp,
  Activity,
  Check,
} from 'lucide-react';
import { MarketDatasetSummary, SectorAnalysis, StockEquity } from '../types/equity';
import { useCurrency } from '../context/CurrencyContext';

interface SectorIndustryAnalysisProps {
  summary: MarketDatasetSummary;
  stocks: StockEquity[];
  selectedSector: string;
  onSelectSector: (sector: string) => void;
  onSelectStock: (stock: StockEquity) => void;
}

export const SectorIndustryAnalysis = ({
  summary,
  stocks,
  selectedSector,
  onSelectSector,
  onSelectStock,
}: SectorIndustryAnalysisProps) => {
  const { formatCompactCurrency, formatCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState<'sectors' | 'industries' | 'comparison'>('sectors');
  const [industrySearch, setIndustrySearch] = useState('');

  // Selected Sector details
  const activeSectorData = useMemo(() => {
    if (selectedSector === 'ALL') return null;
    return summary.sectors.find((s) => s.sector === selectedSector) || null;
  }, [selectedSector, summary.sectors]);

  // Stocks in selected sector
  const sectorStocks = useMemo(() => {
    if (selectedSector === 'ALL') return stocks;
    return stocks.filter((s) => s.sector === selectedSector);
  }, [stocks, selectedSector]);

  // Max stocks in a single sector for scaling the bars
  const maxStockCount = useMemo(() => {
    return Math.max(...summary.sectors.map((s) => s.stockCount), 1);
  }, [summary.sectors]);

  // Max traded value in a sector
  const maxTradedValue = useMemo(() => {
    return Math.max(...summary.sectors.map((s) => s.totalTradedValue), 1);
  }, [summary.sectors]);

  // Filtered industries list
  const filteredIndustries = useMemo(() => {
    return summary.industries.filter((ind) => {
      const matchText =
        ind.industry.toLowerCase().includes(industrySearch.toLowerCase()) ||
        ind.sector.toLowerCase().includes(industrySearch.toLowerCase());
      const matchSector = selectedSector === 'ALL' || ind.sector === selectedSector;
      return matchText && matchSector;
    });
  }, [summary.industries, industrySearch, selectedSector]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-5">
      {/* Header with Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Sector &amp; Industry Deep-Dive Analysis
            </h2>
            <p className="text-xs text-slate-500">
              Explore distribution, constituent companies, and valuation across sectors
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('sectors')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'sectors'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Sectors Overview ({summary.sectors.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('industries')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'industries'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Industries Matrix ({summary.industries.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'comparison'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Valuation Comparison</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Sectors Breakdown Grid */}
      {activeTab === 'sectors' && (
        <div className="space-y-4">
          {/* Sector Quick Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => onSelectSector('ALL')}
              className={`px-3 py-1 rounded-lg font-semibold shrink-0 transition ${
                selectedSector === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Sectors ({summary.totalStocks})
            </button>
            {summary.sectors.map((sec) => (
              <button
                key={sec.sector}
                onClick={() => onSelectSector(sec.sector === selectedSector ? 'ALL' : sec.sector)}
                className={`px-3 py-1 rounded-lg font-medium shrink-0 transition flex items-center gap-1.5 ${
                  selectedSector === sec.sector
                    ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{sec.sector}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedSector === sec.sector ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {sec.stockCount}
                </span>
              </button>
            ))}
          </div>

          {/* Sectors Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.sectors.map((sec) => {
              const isSelected = selectedSector === sec.sector;
              const barWidthPct = (sec.stockCount / maxStockCount) * 100;

              return (
                <div
                  key={sec.sector}
                  onClick={() => onSelectSector(isSelected ? 'ALL' : sec.sector)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-3 group ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-500/20'
                      : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition">
                        {sec.sector}
                      </h3>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {sec.stockCount} {sec.stockCount === 1 ? 'Stock' : 'Stocks'}
                      </span>
                    </div>

                    {/* Stock count visual progress bar */}
                    <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${barWidthPct}%` }}
                      />
                    </div>

                    {/* Child industries */}
                    <div className="mt-2 text-xs text-slate-500">
                      <span className="font-medium text-slate-700">
                        {sec.industriesCount} {sec.industriesCount === 1 ? 'Industry' : 'Industries'}:
                      </span>{' '}
                      <span className="text-slate-600">
                        {sec.industries.slice(0, 2).join(', ')}
                        {sec.industries.length > 2 && ` +${sec.industries.length - 2} more`}
                      </span>
                    </div>
                  </div>

                  {/* Valuation & Turnover Details */}
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-50 rounded-lg p-1.5">
                      <span className="text-[10px] text-slate-400 uppercase block">Avg P/E</span>
                      <span className="font-mono font-bold text-slate-800">
                        {sec.avgPe ? `${sec.avgPe}x` : '—'}
                      </span>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-1.5">
                      <span className="text-[10px] text-slate-400 uppercase block">Avg ROE</span>
                      <span className="font-mono font-bold text-emerald-600">
                        {sec.avgRoe ? `${sec.avgRoe}%` : '—'}
                      </span>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-1.5">
                      <span className="text-[10px] text-slate-400 uppercase block">Turnover</span>
                      <span className="font-mono font-bold text-slate-800">
                        {sec.totalTradedValue > 0 ? formatCompactCurrency(sec.totalTradedValue) : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Constituent Scrips Chips */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {sec.stocks.map((sym) => (
                      <span
                        key={sym}
                        onClick={(e) => {
                          e.stopPropagation();
                          const target = stocks.find((s) => s.symbol === sym);
                          if (target) onSelectStock(target);
                        }}
                        className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 text-slate-700 transition"
                      >
                        {sym}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Detailed Industries Matrix */}
      {activeTab === 'industries' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Showing breakdown of <strong>{filteredIndustries.length}</strong> industries
              {selectedSector !== 'ALL' && ` in ${selectedSector}`}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={industrySearch}
                onChange={(e) => setIndustrySearch(e.target.value)}
                placeholder="Search industry or sector..."
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-64"
              />
            </div>
          </div>

          <div className="border border-slate-200/80 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="py-2.5 px-4 font-semibold">Industry Name</th>
                  <th className="py-2.5 px-4 font-semibold">Parent Sector</th>
                  <th className="py-2.5 px-4 text-center font-semibold">Stock Count</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Avg P/E</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Avg ROE (%)</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Avg Yield (%)</th>
                  <th className="py-2.5 px-4 font-semibold">Constituent Stocks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIndustries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400 text-xs">
                      No industries match your search filter.
                    </td>
                  </tr>
                ) : (
                  filteredIndustries.map((ind) => (
                    <tr key={`${ind.sector}-${ind.industry}`} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {ind.industry}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          onClick={() => onSelectSector(ind.sector)}
                          className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition cursor-pointer"
                        >
                          {ind.sector}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                        {ind.stockCount}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                        {ind.avgPe ? `${ind.avgPe}x` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-600">
                        {ind.avgRoe ? `${ind.avgRoe}%` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {ind.avgDividendYield ? `${ind.avgDividendYield}%` : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {ind.stocks.map((s) => (
                            <span
                              key={s}
                              onClick={() => {
                                const stock = stocks.find((x) => x.symbol === s);
                                if (stock) onSelectStock(stock);
                              }}
                              className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 text-slate-700 rounded transition cursor-pointer"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Sector Valuation Comparison */}
      {activeTab === 'comparison' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-500">
            Comparative sector averages for Price-to-Earnings (Valuation) vs Return on Equity (Profitability)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* P/E Bar Comparison */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                <span>Average Sector P/E Ratio (x)</span>
                <span className="text-slate-400 font-normal">Lower = Cheaper</span>
              </h4>

              <div className="space-y-2">
                {summary.sectors
                  .filter((s) => s.avgPe !== undefined)
                  .sort((a, b) => (b.avgPe ?? 0) - (a.avgPe ?? 0))
                  .map((s) => {
                    const maxPe = Math.max(...summary.sectors.map((x) => x.avgPe ?? 0), 1);
                    const pct = ((s.avgPe ?? 0) / maxPe) * 100;

                    return (
                      <div key={s.sector} className="space-y-1 text-xs">
                        <div className="flex justify-between font-medium text-slate-800">
                          <span className="truncate max-w-[200px]">{s.sector}</span>
                          <span className="font-mono font-bold">{s.avgPe}x</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* ROE Bar Comparison */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                <span>Average Sector Return on Equity (%)</span>
                <span className="text-slate-400 font-normal">Higher = Better Efficiency</span>
              </h4>

              <div className="space-y-2">
                {summary.sectors
                  .filter((s) => s.avgRoe !== undefined)
                  .sort((a, b) => (b.avgRoe ?? 0) - (a.avgRoe ?? 0))
                  .map((s) => {
                    const maxRoe = Math.max(...summary.sectors.map((x) => x.avgRoe ?? 0), 1);
                    const pct = ((s.avgRoe ?? 0) / maxRoe) * 100;

                    return (
                      <div key={s.sector} className="space-y-1 text-xs">
                        <div className="flex justify-between font-medium text-slate-800">
                          <span className="truncate max-w-[200px]">{s.sector}</span>
                          <span className="font-mono font-bold text-emerald-600">{s.avgRoe}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
