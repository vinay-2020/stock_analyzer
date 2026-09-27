import { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building2,
  Filter,
  Eye,
  Columns,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';
import { StockEquity } from '../types/equity';
import { useCurrency } from '../context/CurrencyContext';

interface StockAnalysisTableProps {
  stocks: StockEquity[];
  onSelectStock: (stock: StockEquity) => void;
  selectedSector: string;
  onSelectSector: (sector: string) => void;
  onCompareStocks: (stocks: StockEquity[]) => void;
}

type SortField =
  | 'symbol'
  | 'companyName'
  | 'sector'
  | 'industry'
  | 'currentPrice'
  | 'peRatio'
  | 'roePercent'
  | 'eps'
  | 'dividendYieldPercent'
  | 'totalTradedValue';

export const StockAnalysisTable = ({
  stocks,
  onSelectStock,
  selectedSector,
  onSelectSector,
  onCompareStocks,
}: StockAnalysisTableProps) => {
  const { formatCurrency, formatPercent, formatCompactCurrency } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('ALL');
  const [sortField, setSortField] = useState<SortField>('symbol');
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);

  // Unique sectors list
  const sectors = useMemo(() => {
    const s = new Set<string>();
    stocks.forEach((st) => {
      if (st.sector) s.add(st.sector);
    });
    return Array.from(s).sort();
  }, [stocks]);

  // Unique industries list (filtered by selected sector if applicable)
  const industries = useMemo(() => {
    const ind = new Set<string>();
    stocks.forEach((st) => {
      if (selectedSector === 'ALL' || st.sector === selectedSector) {
        if (st.industry) ind.add(st.industry);
      }
    });
    return Array.from(ind).sort();
  }, [stocks, selectedSector]);

  // Filter & Sort
  const filteredStocks = useMemo(() => {
    return stocks
      .filter((st) => {
        const matchesSearch =
          st.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
          st.companyName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSector =
          selectedSector === 'ALL' || st.sector === selectedSector;
        const matchesIndustry =
          selectedIndustry === 'ALL' || st.industry === selectedIndustry;
        return matchesSearch && matchesSector && matchesIndustry;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;

        if (typeof valA === 'string') {
          return sortAsc
            ? (valA as string).localeCompare(valB as string)
            : (valB as string).localeCompare(valA as string);
        }
        return sortAsc
          ? (valA as number) - (valB as number)
          : (valB as number) - (valA as number);
      });
  }, [stocks, searchTerm, selectedSector, selectedIndustry, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-300 ml-1 inline" />;
    }
    return sortAsc ? (
      <ArrowUp className="w-3 h-3 text-indigo-600 ml-1 inline" />
    ) : (
      <ArrowDown className="w-3 h-3 text-indigo-600 ml-1 inline" />
    );
  };

  const toggleCompare = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedForComparison((prev) => {
      if (prev.includes(symbol)) {
        return prev.filter((s) => s !== symbol);
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), symbol];
      }
      return [...prev, symbol];
    });
  };

  const handleTriggerCompare = () => {
    const selectedObj = stocks.filter((s) => selectedForComparison.includes(s.symbol));
    onCompareStocks(selectedObj);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4">
      {/* Table Header Controls */}
      <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Equities &amp; Fundamentals Directory</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {filteredStocks.length} of {stocks.length} Scrips
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Objective financial performance, valuations, and sector/industry classification
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Comparison CTA if stocks selected */}
          {selectedForComparison.length >= 2 && (
            <button
              onClick={handleTriggerCompare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-2xs transition"
            >
              <span>Compare Selected ({selectedForComparison.length})</span>
            </button>
          )}

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ticker or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48 sm:w-56"
            />
          </div>

          {/* Sector Filter Dropdown */}
          <select
            value={selectedSector}
            onChange={(e) => {
              onSelectSector(e.target.value);
              setSelectedIndustry('ALL');
            }}
            className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
          >
            <option value="ALL">All Sectors ({sectors.length})</option>
            {sectors.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>

          {/* Industry Filter Dropdown */}
          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
          >
            <option value="ALL">All Industries ({industries.length})</option>
            {industries.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Selection Bar Helper */}
      {selectedForComparison.length > 0 && (
        <div className="mx-5 p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between text-xs text-indigo-900">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Selected for Side-by-Side Comparison:</span>
            <div className="flex gap-1.5">
              {selectedForComparison.map((sym) => (
                <span
                  key={sym}
                  className="px-2 py-0.5 bg-white text-indigo-700 font-mono font-bold rounded border border-indigo-200"
                >
                  {sym}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedForComparison([])}
              className="text-indigo-600 hover:text-indigo-800 text-[11px] underline"
            >
              Clear
            </button>
            {selectedForComparison.length >= 2 && (
              <button
                onClick={handleTriggerCompare}
                className="px-2.5 py-1 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700 transition"
              >
                Launch Comparison
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200">
              <th className="py-3 px-3 text-center w-10">Compare</th>
              <th
                onClick={() => handleSort('symbol')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 font-semibold"
              >
                Symbol &amp; Company {getSortIcon('symbol')}
              </th>
              <th
                onClick={() => handleSort('sector')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 font-semibold"
              >
                Sector &amp; Industry {getSortIcon('sector')}
              </th>
              <th
                onClick={() => handleSort('currentPrice')}
                className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 font-semibold"
              >
                Price (₹) {getSortIcon('currentPrice')}
              </th>
              <th
                onClick={() => handleSort('peRatio')}
                className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 font-semibold"
              >
                P/E Ratio {getSortIcon('peRatio')}
              </th>
              <th
                onClick={() => handleSort('roePercent')}
                className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 font-semibold"
              >
                ROE (%) {getSortIcon('roePercent')}
              </th>
              <th
                onClick={() => handleSort('eps')}
                className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 font-semibold hidden md:table-cell"
              >
                EPS (₹) {getSortIcon('eps')}
              </th>
              <th className="py-3 px-4 text-center hidden lg:table-cell font-semibold">
                52-Week Range
              </th>
              <th className="py-3 px-4 text-right hidden sm:table-cell font-semibold">
                Market Cap
              </th>
              <th className="py-3 px-4 text-center font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStocks.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                  No equities found matching the selected filters.
                </td>
              </tr>
            ) : (
              filteredStocks.map((st) => {
                const isSelectedForComp = selectedForComparison.includes(st.symbol);

                // 52W range progress
                let rangePct = 50;
                const has52w =
                  st.week52High &&
                  st.week52Low &&
                  st.currentPrice &&
                  st.week52High > st.week52Low;

                if (has52w) {
                  rangePct = Math.max(
                    0,
                    Math.min(
                      100,
                      ((st.currentPrice! - st.week52Low!) /
                        (st.week52High! - st.week52Low!)) *
                        100
                    )
                  );
                }

                return (
                  <tr
                    key={st.symbol}
                    onClick={() => onSelectStock(st)}
                    className="hover:bg-slate-50/80 transition cursor-pointer group"
                  >
                    {/* Compare Checkbox */}
                    <td
                      className="py-3.5 px-3 text-center"
                      onClick={(e) => toggleCompare(st.symbol, e)}
                    >
                      <button className="text-slate-400 hover:text-indigo-600 transition">
                        {isSelectedForComp ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600 fill-indigo-50" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Symbol & Company */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-xs group-hover:text-indigo-600 transition font-mono">
                        {st.symbol}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                        {st.companyName}
                      </div>
                    </td>

                    {/* Sector & Industry */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 text-xs">
                        {st.sector}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                        {st.industry}
                      </div>
                    </td>

                    {/* Price / CMP */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {st.currentPrice ? formatCurrency(st.currentPrice) : '—'}
                    </td>

                    {/* P/E Ratio */}
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-800">
                      {st.peRatio !== undefined ? `${st.peRatio}x` : '—'}
                    </td>

                    {/* ROE % */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                      {st.roePercent !== undefined ? `${st.roePercent}%` : '—'}
                    </td>

                    {/* EPS */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700 hidden md:table-cell">
                      {st.eps !== undefined ? `₹${st.eps}` : '—'}
                    </td>

                    {/* 52-Week Range */}
                    <td className="py-3.5 px-4 text-center hidden lg:table-cell">
                      {has52w ? (
                        <div className="w-32 mx-auto space-y-1">
                          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                            <span>₹{st.week52Low}</span>
                            <span>₹{st.week52High}</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full relative overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full"
                              style={{ width: `${rangePct}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px] font-mono">—</span>
                      )}
                    </td>

                    {/* Market Cap */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700 hidden sm:table-cell">
                      {st.marketCap || '—'}
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStock(st);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
