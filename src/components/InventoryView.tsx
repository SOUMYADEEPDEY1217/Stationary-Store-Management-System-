import React, { useState, useEffect } from 'react';
import {
  Boxes,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Search,
  Plus,
  ArrowUpDown,
  RefreshCw,
  Barcode,
} from 'lucide-react';
import { Product, Category, User } from '../types.js';
import { api } from '../services/api.js';
import { useToast } from './Toast.js';

interface InventoryViewProps {
  currentUser: User | null;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ currentUser }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // Adjust stock modal
  const [stockModalProduct, setStockModalProduct] = useState<Product | null>(null);
  const [stockAddQty, setStockAddQty] = useState<number>(10);
  const [stockReason, setStockReason] = useState<string>('Inventory Restock');
  const [updating, setUpdating] = useState(false);

  const toast = useToast();
  const isAdmin = currentUser?.role === 'admin';

  const loadInventory = async () => {
    try {
      setLoading(true);
      const [pData, cData] = await Promise.all([
        api.getProducts({
          search: search || undefined,
          status: statusFilter || undefined,
          category_id: categoryFilter ? Number(categoryFilter) : undefined,
        }),
        api.getCategories(),
      ]);
      setProducts(pData);
      setCategories(cData);
    } catch (err: any) {
      toast.error('Failed to load inventory', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [statusFilter, categoryFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadInventory();
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockModalProduct) return;
    try {
      setUpdating(true);
      await api.updateStock(stockModalProduct.id, stockAddQty, stockReason);
      toast.success(
        'Stock Updated Successfully',
        `Added ${stockAddQty} units to "${stockModalProduct.name}".`
      );
      setStockModalProduct(null);
      loadInventory();
    } catch (err: any) {
      toast.error('Failed to update stock', err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Metrics
  const inStockCount = products.filter((p) => p.stock_status === 'In Stock').length;
  const lowStockCount = products.filter((p) => p.stock_status === 'Low Stock').length;
  const outOfStockCount = products.filter((p) => p.stock_status === 'Out of Stock').length;
  const totalUnits = products.reduce((acc, p) => acc + p.quantity, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Inventory & Stock Control</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time tracking of item quantities, minimum threshold alerts, and stock additions
          </p>
        </div>

        <button
          onClick={loadInventory}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-medium text-slate-700 transition self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* Stock Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase text-slate-400">Total Units</div>
            <div className="text-xl font-extrabold text-slate-900">{totalUnits}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase text-emerald-600">In Stock</div>
            <div className="text-xl font-extrabold text-emerald-700">{inStockCount} items</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase text-amber-700">Low Stock</div>
            <div className="text-xl font-extrabold text-amber-800">{lowStockCount} items</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase text-rose-700">Out of Stock</div>
            <div className="text-xl font-extrabold text-rose-800">{outOfStockCount} items</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inventory by product name or barcode SKU..."
            className="w-full pl-9 pr-20 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[11px] font-semibold transition"
          >
            Filter
          </button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          >
            <option value="">All Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                <th className="py-3 px-4">Product Name & SKU</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Available Qty</th>
                <th className="py-3 px-4 text-center">Min Threshold</th>
                <th className="py-3 px-4">Stock Health Indicator</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Add Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading stock data...</span>
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((p) => {
                  const percent = Math.min(100, Math.round((p.quantity / (p.minimum_stock * 3 || 15)) * 100));
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                          <Barcode className="w-3 h-3 text-slate-400" />
                          <span>{p.sku}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {p.category_name}
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-slate-900 text-sm font-mono">
                        {p.quantity} <span className="text-xs font-normal text-slate-400">{p.unit}</span>
                      </td>

                      <td className="py-3 px-4 text-center text-slate-500 font-mono">
                        {p.minimum_stock} {p.unit}
                      </td>

                      <td className="py-3 px-4 min-w-[140px]">
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            style={{ width: `${p.quantity === 0 ? 0 : Math.max(5, percent)}%` }}
                            className={`h-full rounded-full ${
                              p.quantity <= 0
                                ? 'bg-rose-500'
                                : p.quantity <= p.minimum_stock
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {p.quantity === 0
                            ? 'Critical: 0 stock'
                            : p.quantity <= p.minimum_stock
                            ? 'Warning: Below threshold'
                            : 'Optimal stock level'}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            p.quantity <= 0
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : p.quantity <= p.minimum_stock
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {p.stock_status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {isAdmin ? (
                          <button
                            onClick={() => {
                              setStockModalProduct(p);
                              setStockAddQty(Math.max(10, p.minimum_stock * 2));
                              setStockReason('Manual Stock In');
                            }}
                            className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-xs transition"
                          >
                            + Stock In
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">View Only</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No inventory records match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock In Modal */}
      {stockModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">Add Inventory Units</h3>
            <p className="text-xs text-slate-500 mb-4">
              Restock <strong className="text-slate-900">{stockModalProduct.name}</strong>
            </p>

            <form onSubmit={handleUpdateStock} className="space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-xl text-xs space-y-1.5 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Stock:</span>
                  <span className="font-bold text-slate-800">
                    {stockModalProduct.quantity} {stockModalProduct.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Minimum Level:</span>
                  <span className="text-slate-700">{stockModalProduct.minimum_stock}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 text-blue-700 font-bold">
                  <span>New Expected Total:</span>
                  <span>
                    {stockModalProduct.quantity + Number(stockAddQty)} {stockModalProduct.unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity to Add ({stockModalProduct.unit}) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={stockAddQty}
                  onChange={(e) => setStockAddQty(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason / Source Note
                </label>
                <input
                  type="text"
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  placeholder="e.g. Received new shipment box, returned item"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStockModalProduct(null)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Add Stock Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
