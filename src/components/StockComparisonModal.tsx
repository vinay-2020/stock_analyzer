import { X, Layers, Building2, TrendingUp, Check, ArrowRight } from 'lucide-react';
import { StockEquity } from '../types/equity';
import { useCurrency } from '../context/CurrencyContext';

interface StockComparisonModalProps {
  stocks: StockEquity[];
  isOpen: boolean;
  onClose: () => void;
  onSelectStock: (stock: StockEquity) => void;
}

export const StockComparisonModal = ({
  stocks,
  isOpen,
  onClose,
  onSelectStock,
}: StockComparisonModalProps) => {
  const { formatCurrency, formatPercent } = useCurrency();

  if (!isOpen || stocks.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>Side-by-Side Equities Comparison</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparative analysis across sectors, valuation, and efficiency metrics
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Comparison Grid */}
        <div className="p-6 overflow-y-auto overflow-x-auto space-y-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 px-4 bg-slate-50 font-bold text-slate-500 uppercase tracking-wider w-40">
                  Metric / Attribute
                </th>
                {stocks.map((st) => (
                  <th
                    key={st.symbol}
                    className="py-3 px-4 text-center bg-indigo-50/30 border-l border-slate-100"
                  >
                    <div className="font-extrabold text-sm text-slate-900 font-mono">
                      {st.symbol}
                    </div>
                    <div className="text-[11px] font-normal text-slate-500 truncate max-w-[160px] mx-auto">
                      {st.companyName}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Sector */}
              <tr className="hover:bg-slate-50/50">
                <td className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/60">
                  Sector
                </td>
                {stocks.map((st) => (
                  <td key={st.symbol} className="py-3 px-4 text-center border-l border-slate-100">
                    <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                      {st.sector}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Industry */}
              <tr className="hover:bg-slate-50/50">
                <td className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/60">
                  Industry
                </td>
                {stocks.map((st) => (
                  <td key={st.symbol} className="py-3 px-4 text-center border-l border-slate-100 text-slate-700 font-medium">
                    {st.industry}
                  </td>
                ))}
              </tr>

              {/* Current Price */}
              <tr className="hover:bg-slate-50/50">
                <td className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/60">
                  Price (₹)
                </td>
                {stocks.map((st) => (
                  <td key={st.symbol} className="py-3 px-4 text-center border-l border-slate-100 font-mono font-bold text-slate-900">
                    {st.currentPrice ? formatCurrency(st.currentPrice) : '—'}
                  </td>
                ))}
              </tr>

              {/* P/E Ratio */}
              <tr className="hover:bg-slate-50/50">
                <td className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/60">
                  P/E Ratio
                </td>
                {stocks.map((st) => (
                  <td key={st.symbol} className="py-3 px-4 text-center border-l border-slate-100 font-mono font-bold text-slate-800">
                    {st.peRatio !== undefined ? `${st.peRatio}x` : '—'}
                  </td>
                ))}
              </tr>

              {/* ROE % */}
              <tr className="hover:bg-slate-50/50">
                <td className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/60">
                  Return on Equity (ROE)
                </td>
                {stocks.map((st) => (
                  <td key={st.symbol} className="py-3 px-4 text-center border-l border-slate-100 font-mono font-bold text-emerald-600">
                    {st.roePercent !== undefined ? `${st.roePercent}%` : '—'}
                  </td>
                ))}
              </tr>

              {/* EPS */}
              <tr className="hover:bg-slate-50/50">
                <td className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/60">
                  Earnings Per Share (EPS)
                </td>
                {stocks.map((st) => (
                  <td key={st.symbol} className="py-3 px-4 text-center border-l border-slate-100 font-mono text-slate-800">
                    {st.eps !== undefined ? `₹${st.eps}` : '—'}
                  </td>
                ))}
              </tr>

              {/* Dividend Yield */}
              <tr className="hover:bg-slate-50/50">
                <td className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/60">
                  Dividend Yield
                </td>
                {stocks.map((st) => (
                  <td key={st.symbol} className="py-3 px-4 text-center border-l border-slate-100 font-mono text-purple-700 font-medium">
                    {st.dividendYieldPercent !== undefined ? `${st.dividendYieldPercent}%` : '—'}
                  </td>
                ))}
              </tr>

              {/* Revenue Growth */}
              <tr className="hover:bg-slate-50/50">
                <td className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/60">
                  Revenue Growth (YoY)
                </td>
                {stocks.map((st) => (
                  <td key={st.symbol} className="py-3 px-4 text-center border-l border-slate-100 font-mono text-blue-700">
                    {st.revenueGrowthPercent !== undefined ? `+${st.revenueGrowthPercent}%` : '—'}
                  </td>
                ))}
              </tr>

              {/* 52-Week Range */}
              <tr className="hover:bg-slate-50/50">
                <td className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/60">
                  52-Week High / Low
                </td>
                {stocks.map((st) => (
                  <td key={st.symbol} className="py-3 px-4 text-center border-l border-slate-100 font-mono text-slate-700">
                    {st.week52Low && st.week52High ? (
                      <div>
                        <span>₹{st.week52Low}</span> &ndash; <span>₹{st.week52High}</span>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                ))}
              </tr>

              {/* Market Cap */}
              <tr className="hover:bg-slate-50/50">
                <td className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/60">
                  Market Capitalization
                </td>
                {stocks.map((st) => (
                  <td key={st.symbol} className="py-3 px-4 text-center border-l border-slate-100 font-mono text-slate-800">
                    {st.marketCap || '—'}
                  </td>
                ))}
              </tr>

              {/* Actions */}
              <tr>
                <td className="py-3 px-4 bg-slate-50/60 font-semibold text-slate-600">
                  Inspect
                </td>
                {stocks.map((st) => (
                  <td key={st.symbol} className="py-3 px-4 text-center border-l border-slate-100">
                    <button
                      onClick={() => {
                        onClose();
                        onSelectStock(st);
                      }}
                      className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded text-[11px] transition"
                    >
                      View Full Profile
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Objective comparisons from provided CSV records. No recommendations provided.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
