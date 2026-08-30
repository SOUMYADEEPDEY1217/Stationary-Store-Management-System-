import React, { useEffect, useState } from 'react';
import {
  Package,
  Boxes,
  AlertTriangle,
  XCircle,
  IndianRupee,
  ShoppingCart,
  Plus,
  Eye,
  RefreshCw,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { DashboardMetrics, Sale, Product, User } from '../types.js';
import { api } from '../services/api.js';
import { useToast } from './Toast.js';
import { NavigationTab } from './Sidebar.js';

interface DashboardViewProps {
  onSelectTab: (tab: NavigationTab) => void;
  onViewInvoice: (sale: Sale) => void;
  onOpenAddProduct?: () => void;
  currentUser: User | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectTab,
  onViewInvoice,
  onOpenAddProduct,
  currentUser,
}) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState<number>(20);
  const [restocking, setRestocking] = useState(false);
  const toast = useToast();

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboard();
      setMetrics(data);
    } catch (err: any) {
      toast.error('Failed to load dashboard metrics', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleQuickRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct) return;
    try {
      setRestocking(true);
      await api.updateStock(restockProduct.id, restockQty, 'Quick Restock');
      toast.success('Stock Updated', `Added ${restockQty} units to ${restockProduct.name}`);
      setRestockProduct(null);
      fetchDashboard();
    } catch (err: any) {
      toast.error('Failed to update stock', err.message);
    } finally {
      setRestocking(false);
    }
  };

  if (loading && !metrics) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading store dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Welcome, {currentUser?.name || 'Administrator'} 👋
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Stationery Store Management & Quick Overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab('pos')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-xs"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Create New Bill</span>
          </button>
          {onOpenAddProduct ? (
            <button
              onClick={onOpenAddProduct}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          ) : (
            <button
              onClick={() => onSelectTab('products')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {/* 5 Simple KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Products */}
        <div
          onClick={() => onSelectTab('products')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Products
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900 font-mono">
              {metrics?.total_products || 0}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Catalog items</p>
          </div>
        </div>

        {/* Total Stock */}
        <div
          onClick={() => onSelectTab('products')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Stock
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-indigo-900 font-mono">
              {metrics?.total_stock || 0}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Units in inventory</p>
          </div>
        </div>

        {/* Low Stock */}
        <div
          onClick={() => onSelectTab('products')}
          className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs hover:border-amber-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Low Stock
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-amber-600 font-mono">
              {metrics?.low_stock_count || 0}
            </h3>
            <p className="text-[11px] text-amber-700/70 mt-0.5">1 to 10 units left</p>
          </div>
        </div>

        {/* Out of Stock */}
        <div
          onClick={() => onSelectTab('products')}
          className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs hover:border-rose-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">
              Out of Stock
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-rose-600 font-mono">
              {metrics?.out_of_stock_count || 0}
            </h3>
            <p className="text-[11px] text-rose-700/70 mt-0.5">0 units available</p>
          </div>
        </div>

        {/* Today's Sales */}
        <div
          onClick={() => onSelectTab('sales-history')}
          className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs hover:border-emerald-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Today's Sales
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-emerald-700 font-mono">
              ₹{Number(metrics?.today_sales || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-emerald-700/70 mt-0.5">
              {metrics?.today_sales_count || 0} bills today
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Low Stock Items & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Items Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="font-bold text-base text-slate-900">Low Stock Items</h2>
            </div>
            <button
              onClick={() => onSelectTab('products')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 flex-1 overflow-x-auto">
            {metrics?.low_stock_products && metrics.low_stock_products.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 font-semibold">
                    <th className="pb-2">ID</th>
                    <th className="pb-2">Product</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2 text-right">Stock</th>
                    <th className="pb-2 text-center">Status</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {metrics.low_stock_products.slice(0, 7).map((p) => {
                    const isOut = p.quantity <= 0;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 font-mono text-slate-500">{p.sku || `P${String(p.id).padStart(3, '0')}`}</td>
                        <td className="py-2.5 font-medium text-slate-900">
                          {p.name}
                          <span className="text-[10px] text-slate-400 block">{p.brand}</span>
                        </td>
                        <td className="py-2.5 text-slate-500">{p.category_name || 'Stationery'}</td>
                        <td className="py-2.5 text-right font-mono font-bold">
                          <span className={isOut ? 'text-rose-600' : 'text-amber-600'}>
                            {p.quantity} {p.unit || 'pcs'}
                          </span>
                        </td>
                        <td className="py-2.5 text-center">
                          {isOut ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                              🔴 Out of Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                              🟡 Low Stock
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => {
                              setRestockProduct(p);
                              setRestockQty(20);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 font-semibold rounded text-[11px] transition"
                          >
                            + Restock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <p className="text-xs">🎉 All items are currently well-stocked!</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Sales Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <h2 className="font-bold text-base text-slate-900">Recent Sales</h2>
            </div>
            <button
              onClick={() => onSelectTab('sales-history')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 flex-1 overflow-x-auto">
            {metrics?.recent_sales && metrics.recent_sales.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 font-semibold">
                    <th className="pb-2">Invoice</th>
                    <th className="pb-2">Customer</th>
                    <th className="pb-2">Items</th>
                    <th className="pb-2 text-right">Total Amount</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {metrics.recent_sales.slice(0, 7).map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 font-mono text-slate-700 font-medium">
                        {s.invoice_number}
                        <span className="text-[10px] text-slate-400 block">
                          {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-700 font-medium">
                        {s.customer_name || 'Walk-in Customer'}
                        <span className="text-[10px] text-slate-400 block font-normal">{s.payment_method}</span>
                      </td>
                      <td className="py-2.5 text-slate-500">
                        {s.items && s.items.length > 0
                          ? `${s.items.length} item${s.items.length > 1 ? 's' : ''}`
                          : 'Items'}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                        ₹{Number(s.total_amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => onViewInvoice(s)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                          title="View Receipt"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <p className="text-xs">No sales recorded yet today.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Restock Modal */}
      {restockProduct && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100">
            <h3 className="font-bold text-base text-slate-900">
              Restock {restockProduct.name}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Current Stock: <span className="font-bold text-slate-700">{restockProduct.quantity} units</span>
            </p>

            <form onSubmit={handleQuickRestock} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Add Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockProduct(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={restocking}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-xs"
                >
                  {restocking ? 'Updating...' : 'Update Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
