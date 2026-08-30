import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  TrendingUp,
  DollarSign,
  Package,
  Calendar,
  AlertTriangle,
  Award,
  PieChart,
  BarChart3,
} from 'lucide-react';
import { ReportSummary, User } from '../types.js';
import { api } from '../services/api.js';
import { useToast } from './Toast.js';

interface ReportsViewProps {
  currentUser: User | null;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ currentUser }) => {
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const toast = useToast();

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await api.getReports(startDate || undefined, endDate || undefined);
      setReport(data);
    } catch (err: any) {
      toast.error('Failed to load reports', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!report) return;

    const csvRows = [
      ['STATIONERY STORE MANAGEMENT SYSTEM - AUDIT REPORT'],
      ['Generated On', new Date().toLocaleString()],
      [''],
      ['EXECUTIVE SUMMARY METRICS'],
      ['Total Sales Revenue', `₹${report.total_sales}`],
      ['Total Procurement Expense', `₹${report.total_purchases}`],
      ['Gross Profit Margin', `₹${report.gross_profit}`],
      ['Total Inventory Stock Units', report.total_inventory_items],
      ['Inventory Asset Cost Valuation', `₹${report.total_inventory_cost_value}`],
      ['Inventory Retail Market Valuation', `₹${report.total_inventory_retail_value}`],
      [''],
      ['TOP SELLING STATIONERY PRODUCTS'],
      ['Rank', 'Product Name', 'Units Sold', 'Revenue Generated'],
      ...report.top_selling_products.map((p, idx) => [
        idx + 1,
        `"${p.name}"`,
        p.quantity_sold,
        `₹${p.total_revenue}`,
      ]),
      [''],
      ['LOW / OUT OF STOCK ITEMS'],
      ['Product Name', 'Current Stock', 'Minimum Required', 'Status'],
      ...report.low_stock_list.map((p) => [
        `"${p.name}"`,
        p.quantity,
        p.minimum_stock,
        p.stock_status,
      ]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `stationery_store_report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Report Downloaded', 'Audit summary exported to CSV.');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto print:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Store Analytics & Financial Reports</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Comprehensive business breakdown of revenues, profits, stock valuation, and best-sellers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-600/20 transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-800">Filter Analysis Range:</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs text-rose-600 hover:underline px-2"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print:block mb-6 pb-4 border-b border-slate-300">
        <h1 className="text-2xl font-black text-slate-900">STATIONERY STORE MANAGEMENT SYSTEM</h1>
        <p className="text-xs text-slate-600">
          Executive Performance & Inventory Valuation Report — Generated {new Date().toLocaleString()}
        </p>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Total Sales Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            ₹{Number(report?.total_sales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">From all completed retail customer orders</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Procurement Costs</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            ₹{Number(report?.total_purchases || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Total spend on vendor stock purchases</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-emerald-700">Gross Margin / Profit</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2 font-mono">
            ₹{Number(report?.gross_profit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Revenue minus Purchase costs</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Inventory Units</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {report?.total_inventory_items || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Total active stationery units in store</p>
        </div>
      </div>

      {/* Inventory Valuation Section */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-extrabold tracking-tight">Current Inventory Asset Valuation</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Financial calculation of warehouse stock on hand based on cost vs selling prices
            </p>
          </div>
          <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-blue-300">
            Valuation Audit
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="text-xs text-slate-400 font-medium">Cost Basis (Purchase Value)</div>
            <div className="text-xl sm:text-2xl font-mono font-black text-white mt-1">
              ₹{Number(report?.total_inventory_cost_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Amount invested to procure current stock</div>
          </div>

          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="text-xs text-slate-400 font-medium">Retail Selling Value</div>
            <div className="text-xl sm:text-2xl font-mono font-black text-emerald-400 mt-1">
              ₹{Number(report?.total_inventory_retail_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Estimated revenue upon full stock liquidation</div>
          </div>

          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="text-xs text-slate-400 font-medium">Projected Unrealized Profit</div>
            <div className="text-xl sm:text-2xl font-mono font-black text-blue-400 mt-1">
              ₹{Number(
                (report?.total_inventory_retail_value || 0) - (report?.total_inventory_cost_value || 0)
              ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Potential gross return across all catalog items</div>
          </div>
        </div>
      </div>

      {/* Top Selling Products & Low Stock Report */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Sellers */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">Top Selling Products</h3>
                <p className="text-xs text-slate-400">Ranked by total quantity units sold</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold">
                  <th className="pb-2.5">Rank</th>
                  <th className="pb-2.5">Product</th>
                  <th className="pb-2.5 text-center">Qty Sold</th>
                  <th className="pb-2.5 text-right">Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {report?.top_selling_products && report.top_selling_products.length > 0 ? (
                  report.top_selling_products.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-2.5">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="py-2.5 font-bold text-slate-900">{p.name}</td>
                      <td className="py-2.5 text-center font-bold text-blue-700">
                        {p.quantity_sold} units
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                        ₹{Number(p.total_revenue).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No sales recorded in this timeframe.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">Inventory Shortage Alerts</h3>
                <p className="text-xs text-slate-400">Products requiring immediate reordering</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold">
                  <th className="pb-2.5">Product</th>
                  <th className="pb-2.5 text-center">Current</th>
                  <th className="pb-2.5 text-center">Threshold</th>
                  <th className="pb-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {report?.low_stock_list && report.low_stock_list.length > 0 ? (
                  report.low_stock_list.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5">
                        <div className="font-semibold text-slate-800">{p.name}</div>
                        <div className="text-[10px] text-slate-400">SKU: {p.sku}</div>
                      </td>
                      <td className="py-2.5 text-center font-bold text-slate-900">
                        {p.quantity} {p.unit}
                      </td>
                      <td className="py-2.5 text-center text-slate-500">{p.minimum_stock}</td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.quantity <= 0
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.stock_status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-emerald-600 font-medium">
                      ✓ No shortage! All inventory is above minimum threshold.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
