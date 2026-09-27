import { useState } from 'react';
import {
  X,
  Building2,
  Layers,
  Activity,
  Calendar,
  FileText,
  ShieldCheck,
  Percent,
} from 'lucide-react';
import { EquityTransaction, StockEquity } from '../types/equity';
import { useCurrency } from '../context/CurrencyContext';

interface StockDetailModalProps {
  stock: StockEquity | null;
  onClose: () => void;
  transactions: EquityTransaction[];
}

export const StockDetailModal = ({
  stock,
  onClose,
  transactions,
}: StockDetailModalProps) => {
  const { formatCurrency, formatPercent, formatCompactCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState<'fundamentals' | 'transactions' | 'raw_columns'>('fundamentals');

  if (!stock) return null;

  // Transactions recorded for this symbol
  const stockTxns = transactions.filter((t) => t.symbol === stock.symbol);

  // 52-Week Range
  let rangePct = 50;
  const has52w =
    stock.week52High &&
    stock.week52Low &&
    stock.currentPrice &&
    stock.week52High > stock.week52Low;

  if (has52w) {
    rangePct = Math.max(
      0,
      Math.min(
        100,
        ((stock.currentPrice! - stock.week52Low!) /
          (stock.week52High! - stock.week52Low!)) *
          100
      )
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-xs shadow-xs px-1 text-center truncate font-mono">
              {stock.symbol.slice(0, 6)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900 font-mono">
                  {stock.symbol}
                </h3>
                <span className="text-xs text-slate-500 font-medium truncate max-w-xs">
                  {stock.companyName}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {stock.sector}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span>Industry: <strong>{stock.industry}</strong></span>
                {stock.marketCap && (
                  <>
                    <span>&bull;</span>
                    <span>Market Cap: {stock.marketCap}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-100 flex gap-4 text-xs font-semibold bg-slate-50/50">
          <button
            onClick={() => setActiveTab('fundamentals')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'fundamentals'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Fundamentals &amp; Valuation
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'transactions'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Recorded Trades ({stockTxns.length})
          </button>
          <button
            onClick={() => setActiveTab('raw_columns')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'raw_columns'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Raw CSV Record Fields
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'fundamentals' && (
            <div className="space-y-6">
              {/* Top Key Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-500 uppercase">
                    Current Price (₹)
                  </span>
                  <div className="text-xl font-extrabold text-slate-900 font-mono mt-1">
                    {stock.currentPrice ? formatCurrency(stock.currentPrice) : '—'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    NSE / BSE Traded
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-500 uppercase">
                    P/E Ratio
                  </span>
                  <div className="text-xl font-extrabold text-slate-900 font-mono mt-1">
                    {stock.peRatio !== undefined ? `${stock.peRatio}x` : '—'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Price to Earnings
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-500 uppercase">
                    Return on Equity
                  </span>
                  <div className="text-xl font-extrabold text-emerald-600 font-mono mt-1">
                    {stock.roePercent !== undefined ? `${stock.roePercent}%` : '—'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    ROE Efficiency
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-500 uppercase">
                    Earnings Per Share
                  </span>
                  <div className="text-xl font-extrabold text-blue-600 font-mono mt-1">
                    {stock.eps !== undefined ? `₹${stock.eps}` : '—'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    EPS
                  </div>
                </div>
              </div>

              {/* 52-Week Range Bar */}
              {has52w && (
                <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/70 space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>52-Week Trading Range</span>
                    <span className="font-mono text-indigo-600 font-bold">
                      {rangePct.toFixed(0)}% of 52W Range
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full relative overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${rangePct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 font-mono">
                    <span>52W Low: {formatCurrency(stock.week52Low)}</span>
                    <span>Current: {formatCurrency(stock.currentPrice)}</span>
                    <span>52W High: {formatCurrency(stock.week52High)}</span>
                  </div>
                </div>
              )}

              {/* Comprehensive Financial Performance Metrics Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Historical Financial Performance &amp; Valuation
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                    <span className="text-[11px] text-slate-400 font-medium">Revenue Growth</span>
                    <div className="text-base font-bold text-blue-600 font-mono mt-0.5">
                      {stock.revenueGrowthPercent !== undefined ? `+${stock.revenueGrowthPercent}%` : '—'}
                    </div>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                    <span className="text-[11px] text-slate-400 font-medium">Net Profit Margin</span>
                    <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                      {stock.profitMarginPercent !== undefined ? `${stock.profitMarginPercent}%` : '—'}
                    </div>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                    <span className="text-[11px] text-slate-400 font-medium">Dividend Yield</span>
                    <div className="text-base font-bold text-purple-600 font-mono mt-0.5">
                      {stock.dividendYieldPercent !== undefined ? `${stock.dividendYieldPercent}%` : '—'}
                    </div>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                    <span className="text-[11px] text-slate-400 font-medium">Beta (Volatility)</span>
                    <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                      {stock.beta !== undefined ? stock.beta : '—'}
                    </div>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                    <span className="text-[11px] text-slate-400 font-medium">Total Traded Volume</span>
                    <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                      {stock.totalTradedQuantity ? `${stock.totalTradedQuantity} shares` : '—'}
                    </div>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                    <span className="text-[11px] text-slate-400 font-medium">Total Traded Value</span>
                    <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                      {stock.totalTradedValue ? formatCompactCurrency(stock.totalTradedValue) : '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500">
                Historical order and transaction records recorded for this stock in the CSV file
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                {stockTxns.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No transaction entries recorded for this scrip in the active CSV.
                  </div>
                ) : (
                  stockTxns.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 flex items-center justify-between hover:bg-slate-50/80 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.action.includes('BUY')
                              ? 'bg-blue-100 text-blue-800'
                              : t.action.includes('SELL')
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {t.action}
                        </span>
                        <span className="font-mono text-slate-600">{t.date}</span>
                      </div>

                      <div className="text-right font-mono">
                        <div className="font-semibold text-slate-900">
                          {t.quantity} shares @ {formatCurrency(t.price)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Total: {formatCurrency(t.amount)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'raw_columns' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500">
                All raw data fields and column values parsed from the CSV row for this stock
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                {stock.rawRow ? (
                  Object.entries(stock.rawRow).map(([key, val]) => (
                    <div key={key} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                      <span className="font-mono font-semibold text-slate-600">{key}</span>
                      <span className="font-mono text-slate-900 font-medium">{val || '—'}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-400">No raw row records available</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Pure data analysis. No BUY/SELL recommendations provided.</span>
          </div>
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
