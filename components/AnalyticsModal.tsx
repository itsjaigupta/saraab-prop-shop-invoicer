import React, { useState, useMemo } from 'react';
import { Invoice, Expense } from '../types';
import { X, FolderOpen, BarChart2, TrendingUp, Plus, Trash2, Search, Receipt } from 'lucide-react';

const CATEGORIES = [
  'Purchases', 'Transport', 'Rent / Storage', 'Utilities',
  'Repairs', 'Salary / Labour', 'Marketing', 'Miscellaneous',
];

const calcRevenue = (inv: Invoice) => {
  const sub = inv.enableManualTotal
    ? inv.manualTotal
    : inv.items.reduce((s, it) => s + it.quantity * it.rate * (it.days || 1), 0);
  const disc = inv.discountType === 'percentage' ? (sub * inv.discount) / 100 : inv.discount;
  const tax = inv.taxEnabled ? (sub * inv.taxRate) / 100 : 0;
  return sub + tax - disc;
};

const calcTotal = (inv: Invoice) => calcRevenue(inv) + (inv.securityDeposit || 0);

const fmt = (n: number) => '₹' + Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

// ─── SVG P&L Chart ────────────────────────────────────────────────────────────

const PnLChart: React.FC<{ months: { key: string; revenue: number; expenses: number }[] }> = ({ months }) => {
  const W = 560, H = 270;
  const ml = 62, mr = 16, mt = 24, mb = 52;
  const chartW = W - ml - mr;
  const chartH = H - mt - mb;

  const maxVal = Math.max(...months.flatMap(m => [m.revenue, m.expenses, m.revenue - m.expenses]), 1000);
  const topVal = Math.ceil(maxVal / 10000) * 10000 || 10000;

  const n = months.length;
  const groupW = chartW / n;
  const barW = Math.min(22, groupW * 0.28);

  const yPx = (v: number) => mt + chartH - (Math.max(v, 0) / topVal) * chartH;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => Math.round(t * topVal));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {/* Grid + Y-axis labels */}
      {ticks.map(v => (
        <g key={v}>
          <line x1={ml} y1={yPx(v)} x2={W - mr} y2={yPx(v)}
            stroke={v === 0 ? '#d1d5db' : '#f3f4f6'} strokeWidth={v === 0 ? 1.5 : 1} />
          <text x={ml - 6} y={yPx(v) + 4} textAnchor="end" fontSize="9" fill="#9ca3af">
            {v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
          </text>
        </g>
      ))}

      {/* Bars + net label */}
      {months.map((m, i) => {
        const cx = ml + (i + 0.5) * groupW;
        const revH = (Math.max(m.revenue, 0) / topVal) * chartH;
        const expH = (Math.max(m.expenses, 0) / topVal) * chartH;
        const net = m.revenue - m.expenses;
        const monthLabel = new Date(m.key + '-01').toLocaleString('default', { month: 'short' });
        const yr = "'" + m.key.slice(2, 4);
        const highY = Math.min(yPx(m.revenue), yPx(m.expenses));

        return (
          <g key={m.key}>
            {/* Revenue bar */}
            <rect x={cx - barW - 1} y={yPx(m.revenue)} width={barW} height={revH} fill="#111827" rx="2" />
            {/* Expense bar */}
            <rect x={cx + 1} y={yPx(m.expenses)} width={barW} height={expH} fill="#ef4444" rx="2" opacity="0.9" />
            {/* Net profit label above highest bar */}
            <text x={cx} y={highY - 6} textAnchor="middle" fontSize="8.5" fontWeight="bold"
              fill={net >= 0 ? '#15803d' : '#dc2626'}>
              {net >= 0 ? '+' : '-'}{net >= 1000 || net <= -1000 ? `₹${(Math.abs(net) / 1000).toFixed(1)}k` : fmt(net)}
            </text>
            {/* Month label */}
            <text x={cx} y={H - mb + 14} textAnchor="middle" fontSize="9" fill="#6b7280">{monthLabel}</text>
            <text x={cx} y={H - mb + 24} textAnchor="middle" fontSize="7.5" fill="#9ca3af">{yr}</text>
          </g>
        );
      })}

      {/* Net profit dashed line */}
      {months.length > 1 && (
        <polyline fill="none" stroke="#16a34a" strokeWidth="2" strokeDasharray="5 3"
          strokeLinecap="round" strokeLinejoin="round"
          points={months.map((m, i) => {
            const cx = ml + (i + 0.5) * groupW;
            return `${cx},${yPx(m.revenue - m.expenses)}`;
          }).join(' ')} />
      )}
      {months.map((m, i) => {
        const cx = ml + (i + 0.5) * groupW;
        return (
          <circle key={m.key} cx={cx} cy={yPx(m.revenue - m.expenses)} r="3.5"
            fill="#16a34a" stroke="white" strokeWidth="1.5" />
        );
      })}

      {/* Legend */}
      <rect x={ml} y={H - 13} width="9" height="9" fill="#111827" rx="1.5" />
      <text x={ml + 13} y={H - 5} fontSize="8.5" fill="#4b5563">Revenue</text>
      <rect x={ml + 65} y={H - 13} width="9" height="9" fill="#ef4444" rx="1.5" />
      <text x={ml + 78} y={H - 5} fontSize="8.5" fill="#4b5563">Expenses</text>
      <line x1={ml + 138} y1={H - 8} x2={ml + 154} y2={H - 8} stroke="#16a34a" strokeWidth="2" strokeDasharray="4 2" />
      <circle cx={ml + 146} cy={H - 8} r="3" fill="#16a34a" stroke="white" strokeWidth="1" />
      <text x={ml + 158} y={H - 5} fontSize="8.5" fill="#4b5563">Net Profit</text>
    </svg>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export type AnalyticsTab = 'invoices' | 'expenses' | 'pnl';

interface Props {
  savedInvoices: Invoice[];
  expenses: Expense[];
  onAddExpense: (e: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onLoadInvoice: (inv: Invoice) => void;
  onDeleteInvoice: (id: string, e: React.MouseEvent) => void;
  onClose: () => void;
  initialTab?: AnalyticsTab;
}

const AnalyticsModal: React.FC<Props> = ({
  savedInvoices, expenses, onAddExpense, onDeleteExpense,
  onLoadInvoice, onDeleteInvoice, onClose, initialTab = 'invoices',
}) => {
  const [tab, setTab] = useState<AnalyticsTab>(initialTab);
  const [search, setSearch] = useState('');

  // Expense form
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expCat, setExpCat] = useState(CATEGORIES[0]);
  const [expDesc, setExpDesc] = useState('');
  const [expAmt, setExpAmt] = useState('');

  // P&L year filter
  const years = useMemo(() => {
    const s = new Set([
      ...savedInvoices.map(inv => inv.date.slice(0, 4)),
      ...expenses.map(e => e.date.slice(0, 4)),
    ]);
    return Array.from(s).sort().reverse();
  }, [savedInvoices, expenses]);

  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear().toString());

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = savedInvoices.slice().reverse();
    if (!q) return list;
    return list.filter(inv =>
      inv.id.includes(q) ||
      inv.client.name.value.toLowerCase().includes(q) ||
      inv.date.includes(q)
    );
  }, [savedInvoices, search]);

  const sortedExpenses = useMemo(
    () => expenses.slice().sort((a, b) => b.date.localeCompare(a.date)),
    [expenses]
  );

  // P&L data
  const pnlMonths = useMemo(() => {
    const map: Record<string, { revenue: number; expenses: number }> = {};
    savedInvoices
      .filter(inv => inv.date.startsWith(selectedYear))
      .forEach(inv => {
        const key = inv.date.slice(0, 7);
        if (!map[key]) map[key] = { revenue: 0, expenses: 0 };
        map[key].revenue += calcRevenue(inv);
      });
    expenses
      .filter(e => e.date.startsWith(selectedYear))
      .forEach(e => {
        const key = e.date.slice(0, 7);
        if (!map[key]) map[key] = { revenue: 0, expenses: 0 };
        map[key].expenses += e.amount;
      });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => ({ key, ...v }));
  }, [savedInvoices, expenses, selectedYear]);

  const pnlSummary = useMemo(() => {
    const r = pnlMonths.reduce((s, m) => s + m.revenue, 0);
    const ex = pnlMonths.reduce((s, m) => s + m.expenses, 0);
    return { revenue: r, expenses: ex, net: r - ex };
  }, [pnlMonths]);

  const handleAddExpense = () => {
    const amt = Number(expAmt);
    if (!expAmt || isNaN(amt) || amt <= 0) return;
    onAddExpense({ id: Date.now().toString(), date: expDate, category: expCat, description: expDesc, amount: amt });
    setExpDesc('');
    setExpAmt('');
  };

  const TabBtn = ({ id, label, icon }: { id: AnalyticsTab; label: string; icon: React.ReactNode }) => (
    <button
      onClick={() => setTab(id)}
      className={`flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest border-b-2 transition whitespace-nowrap ${
        tab === id ? 'border-black text-black bg-white' : 'border-transparent text-gray-400 hover:text-gray-700'
      }`}
    >
      {icon}{label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center md:p-4">
      <div className="bg-white w-full md:rounded-2xl md:max-w-2xl md:max-h-[88vh] max-h-[92vh] rounded-t-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Drag handle — mobile only */}
        <div className="md:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 pt-4 md:pt-5 pb-0 flex justify-between items-start shrink-0">
          <div>
            <h2 className="text-xl font-bold font-serif italic">Analytics</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">Saraab Prop Shop</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition mt-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-4 mt-4 shrink-0 overflow-x-auto">
          <TabBtn id="invoices" label="Invoices" icon={<FolderOpen className="w-3.5 h-3.5" />} />
          <TabBtn id="expenses" label="Expenses" icon={<Receipt className="w-3.5 h-3.5" />} />
          <TabBtn id="pnl" label="P&L Graph" icon={<BarChart2 className="w-3.5 h-3.5" />} />
        </div>

        {/* ── INVOICES ── */}
        {tab === 'invoices' && (
          <>
            <div className="px-4 py-3 border-b border-gray-100 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by invoice #, client, or date…"
                  className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-black transition"
                />
              </div>
            </div>
            <div className="flex-grow overflow-y-auto p-3">
              {savedInvoices.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm font-medium">No saved invoices.</p>
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No results for "{search}"</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredInvoices.map(inv => (
                    <div key={inv.id} onClick={() => onLoadInvoice(inv)}
                      className="group p-4 rounded-xl border border-gray-100 hover:border-black hover:shadow-lg transition cursor-pointer bg-white flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-mono font-bold bg-black text-white text-[10px] px-2 py-0.5 rounded">#{inv.id}</span>
                          <span className="text-xs font-bold text-gray-900">{inv.client.name.value || 'Unknown Client'}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 flex gap-3 flex-wrap">
                          <span>{inv.date}</span>
                          <span>•</span>
                          <span className="font-semibold text-gray-700">{fmt(calcTotal(inv))}</span>
                          {inv.project.brandName.value && <><span>•</span><span>{inv.project.brandName.value}</span></>}
                        </div>
                      </div>
                      <button onClick={e => onDeleteInvoice(inv.id, e)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── EXPENSES ── */}
        {tab === 'expenses' && (
          <>
            <div className="px-4 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Add Expense</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input type="date" value={expDate} onChange={e => setExpDate(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-black bg-white" />
                <select value={expCat} onChange={e => setExpCat(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-black bg-white">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <input type="text" value={expDesc} onChange={e => setExpDesc(e.target.value)}
                  placeholder="Description (optional)"
                  className="flex-grow text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-black" />
                <input type="number" value={expAmt} onChange={e => setExpAmt(e.target.value)}
                  placeholder="₹ Amount" min="0"
                  onKeyDown={e => e.key === 'Enter' && handleAddExpense()}
                  className="w-28 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-black" />
                <button onClick={handleAddExpense}
                  className="px-4 py-2 bg-black text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition flex items-center gap-1 whitespace-nowrap">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>
            <div className="flex-grow overflow-y-auto p-3">
              {expenses.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm font-medium">No expenses recorded yet.</p>
                  <p className="text-xs mt-1 text-gray-300">Use the form above to add your first expense.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    {sortedExpenses.map(e => (
                      <div key={e.id}
                        className="group flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 hover:border-gray-300 bg-white transition">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded whitespace-nowrap shrink-0">{e.category}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">{e.description || '—'}</p>
                            <p className="text-[10px] text-gray-400">{e.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          <span className="text-sm font-bold text-red-600">{fmt(e.amount)}</span>
                          <button onClick={() => onDeleteExpense(e.id)}
                            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Expenses</span>
                    <span className="text-base font-bold text-red-600">{fmt(expenses.reduce((s, e) => s + e.amount, 0))}</span>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* ── P&L GRAPH ── */}
        {tab === 'pnl' && (
          <div className="flex-grow overflow-y-auto">
            {/* Year selector + summary cards */}
            <div className="px-4 pt-4 pb-3 border-b border-gray-100 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Profit & Loss</p>
                <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-black bg-white font-bold">
                  {years.length
                    ? years.map(y => <option key={y}>{y}</option>)
                    : <option>{new Date().getFullYear()}</option>}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-black text-white rounded-xl p-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-1">Revenue</p>
                  <p className="text-sm font-bold">{fmt(pnlSummary.revenue)}</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-red-400 mb-1">Expenses</p>
                  <p className="text-sm font-bold text-red-600">{fmt(pnlSummary.expenses)}</p>
                </div>
                <div className={`rounded-xl p-3 border ${pnlSummary.net >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Net Profit</p>
                  <p className={`text-sm font-bold ${pnlSummary.net >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {pnlSummary.net >= 0 ? '+' : '-'}{fmt(pnlSummary.net)}
                  </p>
                </div>
              </div>
            </div>

            {pnlMonths.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <BarChart2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm font-medium">No data for {selectedYear}.</p>
                <p className="text-xs mt-1 text-gray-300">Save invoices or add expenses for this year.</p>
              </div>
            ) : (
              <>
                <div className="px-4 pt-5 pb-2">
                  <PnLChart months={pnlMonths} />
                </div>

                {/* Monthly table */}
                <div className="px-4 pb-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Monthly Breakdown</p>
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-4 py-2.5 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Month</th>
                          <th className="text-right px-4 py-2.5 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Revenue</th>
                          <th className="text-right px-4 py-2.5 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Expenses</th>
                          <th className="text-right px-4 py-2.5 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Net</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pnlMonths.map((m, i) => {
                          const net = m.revenue - m.expenses;
                          const [y, mo] = m.key.split('-');
                          const label = new Date(parseInt(y), parseInt(mo) - 1, 1)
                            .toLocaleString('default', { month: 'long', year: 'numeric' });
                          return (
                            <tr key={m.key} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                              <td className="px-4 py-2.5 font-medium text-gray-800">{label}</td>
                              <td className="px-4 py-2.5 text-right text-gray-700">{fmt(m.revenue)}</td>
                              <td className="px-4 py-2.5 text-right text-red-500">{fmt(m.expenses)}</td>
                              <td className={`px-4 py-2.5 text-right font-bold ${net >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                {net >= 0 ? '+' : '-'}{fmt(net)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-200 bg-gray-50">
                          <td className="px-4 py-3 font-bold text-gray-900 text-xs">Total {selectedYear}</td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">{fmt(pnlSummary.revenue)}</td>
                          <td className="px-4 py-3 text-right font-bold text-red-600">{fmt(pnlSummary.expenses)}</td>
                          <td className={`px-4 py-3 text-right font-bold text-sm ${pnlSummary.net >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                            {pnlSummary.net >= 0 ? '+' : '-'}{fmt(pnlSummary.net)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <p className="text-[9px] text-gray-300 mt-3 text-center">Revenue excludes refundable security deposits</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsModal;
