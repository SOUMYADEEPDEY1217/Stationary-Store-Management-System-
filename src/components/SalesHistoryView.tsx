import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Eye,
  Download,
  Calendar,
  IndianRupee,
  X,
} from 'lucide-react';
import { Sale, User } from '../types.js';
import { api } from '../services/api.js';
import { useToast } from './Toast.js';

interface SalesHistoryViewProps {
  currentUser: User | null;
  onViewInvoice: (sale: Sale) => void;
}

export const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({
  currentUser,
  onViewInvoice,
}) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const toast = useToast();

  const loadSales = async () => {
    try {
      setLoading(true);
      const data = await api.getSales();
      setSales(data);
    } catch (err: any) {
      toast.error('Failed to load sales history', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  const filteredSales = sales.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      s.invoice_number.toLowerCase().includes(q) ||
      (s.customer_name && s.customer_name.toLowerCase().includes(q)) ||
      s.payment_method.toLowerCase().includes(q)
    );
  });

  const totalRevenue = sales.reduce((acc, s) => acc + Number(s.total_amount), 0);

  const handleExportCSV = () => {
    if (sales.length === 0) {
      toast.warning('No data', 'There are no sales records to export.');
      return;
    }

    const headers = ['Invoice Number', 'Date', 'Customer', 'Items Count', 'Payment Method', 'Discount', 'Total Amount (INR)'];
    const rows = sales.map((s) => [
      s.invoice_number,
      new Date(s.created_at).toLocaleString('en-IN'),
      `"${s.customer_name || 'Walk-in Customer'}"`,
      s.items?.length || 1,
      s.payment_method,
      s.discount,
      s.total_amount,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stationery_sales_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Report Exported', 'Sales history exported to CSV.');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Sales History & Invoices</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Browse and view past customer sales bills ({sales.length} total sales • ₹{totalRevenue.toLocaleString('en-IN')})
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice number (e.g. INV-2026-0001), customer, payment mode..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading sales history...</p>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No sales found</h3>
            <p className="text-xs text-slate-400">
              {search ? 'No sales matched your search query.' : 'Complete a sale at the Billing counter to see it here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Sale ID / Invoice</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Items Sold</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                      {s.invoice_number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {new Date(s.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {s.customer_name || 'Walk-in Customer'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {s.items && s.items.length > 0 ? (
                        <div>
                          <span className="font-semibold text-slate-800">
                            {s.items.length} item{s.items.length > 1 ? 's' : ''}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[200px]">
                            {s.items.map((i) => i.product_name).join(', ')}
                          </span>
                        </div>
                      ) : (
                        '1 item'
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {s.payment_method}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      ₹{Number(s.total_amount).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onViewInvoice(s)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Bill</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
