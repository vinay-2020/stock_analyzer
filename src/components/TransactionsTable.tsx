import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
} from 'lucide-react';
import { EquityTransaction } from '../types/equity';
import { useCurrency } from '../context/CurrencyContext';

interface TransactionsTableProps {
  transactions: EquityTransaction[];
}

type SortField = 'date' | 'symbol' | 'action' | 'quantity' | 'price' | 'amount';

export const TransactionsTable = ({ transactions }: TransactionsTableProps) => {
  const { formatCurrency } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Extract unique sectors
  const sectors = useMemo(() => {
    const s = new Set<string>();
    transactions.forEach((t) => {
      if (t.sector) s.add(t.sector);
    });
    return Array.from(s).sort();
  }, [transactions]);

  // Extract unique actions recorded in CSV
  const actions = useMemo(() => {
    const a = new Set<string>();
    transactions.forEach((t) => {
      if (t.action) a.add(t.action);
    });
    return Array.from(a).sort();
  }, [transactions]);

  // Filtered and sorted
  const filtered = useMemo(() => {
    return transactions
      .filter((t) => {
        const matchesSearch =
          t.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.companyName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesAction = selectedAction === 'ALL' || t.action === selectedAction;
        const matchesSector = selectedSector === 'ALL' || t.sector === selectedSector;
        return matchesSearch && matchesAction && matchesSector;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (typeof valA === 'string') {
          return sortAsc
            ? (valA as string).localeCompare(valB as string)
            : (valB as string).localeCompare(valA as string);
        }
        return sortAsc
          ? (valA as number) - (valB as number)
          : (valB as number) - (valA as number);
      });
  }, [transactions, searchTerm, selectedAction, selectedSector, sortField, sortAsc]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-300 ml-1 inline" />;
    return sortAsc ? (
      <ArrowUp className="w-3 h-3 text-indigo-600 ml-1 inline" />
    ) : (
      <ArrowDown className="w-3 h-3 text-indigo-600 ml-1 inline" />
    );
  };

  const handleExportCsv = () => {
    const headers = ['Date', 'Symbol', 'Company', 'Sector', 'Industry', 'Recorded Action', 'Quantity', 'Price', 'Amount', 'Fees'];
    const rows = filtered.map((t) => [
      t.date,
      t.symbol,
      `"${t.companyName.replace(/"/g, '""')}"`,
      `"${t.sector.replace(/"/g, '""')}"`,
      `"${t.industry.replace(/"/g, '""')}"`,
      t.action,
      t.quantity,
      t.price,
      t.amount,
      t.fees,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `equity_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4">
      {/* Table Header Controls */}
      <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Recorded Trade Ledger
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
              {filtered.length} of {transactions.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Chronological log of transactions from the dataset &bull; Records of past orders, not recommendations
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search symbol or company..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44 sm:w-52"
            />
          </div>

          {/* Action Filter */}
          {actions.length > 1 && (
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Actions</option>
              {actions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          )}

          {/* Sector Filter */}
          <select
            value={selectedSector}
            onChange={(e) => {
              setSelectedSector(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Sectors ({sectors.length})</option>
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition"
            title="Download filtered transactions as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200">
              <th
                onClick={() => handleSort('date')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 font-semibold"
              >
                Date {getSortIcon('date')}
              </th>
              <th
                onClick={() => handleSort('symbol')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 font-semibold"
              >
                Symbol &amp; Company {getSortIcon('symbol')}
              </th>
              <th className="py-3 px-4 font-semibold hidden md:table-cell">
                Sector &amp; Industry
              </th>
              <th
                onClick={() => handleSort('action')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 font-semibold"
              >
                Recorded Action {getSortIcon('action')}
              </th>
              <th
                onClick={() => handleSort('quantity')}
                className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 font-semibold"
              >
                Quantity {getSortIcon('quantity')}
              </th>
              <th
                onClick={() => handleSort('price')}
                className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 font-semibold"
              >
                Price (₹) {getSortIcon('price')}
              </th>
              <th
                onClick={() => handleSort('amount')}
                className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 font-semibold"
              >
                Amount (₹) {getSortIcon('amount')}
              </th>
              <th className="py-3 px-4 text-right hidden sm:table-cell font-semibold">
                Fees (₹)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                  No transaction records found matching the filter criteria.
                </td>
              </tr>
            ) : (
              paginated.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-4 font-mono text-slate-600 font-medium whitespace-nowrap">
                    {t.date || '—'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 font-mono text-xs">
                      {t.symbol}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate max-w-[170px]">
                      {t.companyName}
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <div className="text-slate-800 font-medium text-xs">{t.sector}</div>
                    <div className="text-[11px] text-slate-500 truncate max-w-[150px]">{t.industry}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.action.includes('BUY')
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : t.action.includes('SELL')
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}
                    >
                      {t.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-slate-800">
                    {t.quantity > 0 ? t.quantity : '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-slate-800">
                    {t.price > 0 ? formatCurrency(t.price) : '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {t.amount > 0 ? formatCurrency(t.amount) : '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-500 hidden sm:table-cell">
                    {t.fees > 0 ? formatCurrency(t.fees) : '₹0.00'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-medium disabled:opacity-40 hover:bg-slate-200 transition"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-medium disabled:opacity-40 hover:bg-slate-200 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
