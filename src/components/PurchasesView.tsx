import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  Package,
  Calendar,
  Building,
  DollarSign,
  Boxes,
  Eye,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { Purchase, Supplier, Product, User } from '../types.js';
import { api } from '../services/api.js';
import { useToast } from './Toast.js';

interface PurchasesViewProps {
  currentUser: User | null;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({ currentUser }) => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // New Purchase Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number>(1);
  const [orderItems, setOrderItems] = useState<
    Array<{ product_id: number; quantity: number; cost_price: number }>
  >([{ product_id: 1, quantity: 20, cost_price: 15 }]);
  const [submitting, setSubmitting] = useState(false);

  // Detail View Modal
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);

  const toast = useToast();
  const isAdmin = currentUser?.role === 'admin';

  const loadData = async () => {
    try {
      setLoading(true);
      const [purData, supData, prodData] = await Promise.all([
        api.getPurchases(),
        api.getSuppliers(),
        api.getProducts(),
      ]);
      setPurchases(purData);
      setSuppliers(supData);
      setProducts(prodData);
      if (supData.length > 0) setSelectedSupplierId(supData[0].id);
    } catch (err: any) {
      toast.error('Failed to load purchases', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewPurchaseModal = () => {
    if (suppliers.length === 0 || products.length === 0) {
      toast.warning('Setup Required', 'Please create at least one supplier and product first.');
      return;
    }
    setSelectedSupplierId(suppliers[0].id);
    setOrderItems([
      {
        product_id: products[0].id,
        quantity: 50,
        cost_price: Number(products[0].purchase_price),
      },
    ]);
    setIsFormOpen(true);
  };

  const handleAddItemRow = () => {
    if (products.length === 0) return;
    setOrderItems((prev) => [
      ...prev,
      {
        product_id: products[0].id,
        quantity: 20,
        cost_price: Number(products[0].purchase_price),
      },
    ]);
  };

  const handleRemoveItemRow = (idx: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: string, val: any) => {
    setOrderItems((prev) =>
      prev.map((item, i) => {
        if (i === idx) {
          if (field === 'product_id') {
            const p = products.find((prod) => prod.id === Number(val));
            return {
              ...item,
              product_id: Number(val),
              cost_price: p ? Number(p.purchase_price) : item.cost_price,
            };
          }
          return { ...item, [field]: val };
        }
        return item;
      })
    );
  };

  const totalCost = orderItems.reduce(
    (acc, item) => acc + item.quantity * item.cost_price,
    0
  );

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orderItems.length === 0) {
      toast.error('Validation Error', 'Please add at least one line item to purchase order.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.createPurchase({
        supplier_id: selectedSupplierId,
        items: orderItems,
      });
      toast.success(
        'Stock Inward Recorded',
        `Purchase #${res.id} recorded. Inventory balances automatically updated.`
      );
      setIsFormOpen(false);
      loadData();
    } catch (err: any) {
      toast.error('Failed to create purchase order', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalSpentPurchases = purchases.reduce(
    (acc, p) => acc + Number(p.total_amount),
    0
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Purchases & Stock Inward</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log supplier shipments, purchase invoices, and automatically restock warehouse inventory
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openNewPurchaseModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-600/20 transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Receive New Stock Order</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase text-slate-400">Total Purchase Orders</div>
            <div className="text-xl font-extrabold text-slate-900">{purchases.length} batches</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase text-slate-400">Total Procurement Cost</div>
            <div className="text-xl font-extrabold text-slate-900 font-mono">
              ₹{totalSpentPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase text-slate-400">Stock Status</div>
            <div className="text-sm font-bold text-emerald-700">Auto-Integrated with Catalog</div>
          </div>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                <th className="py-3 px-4">PO Batch #</th>
                <th className="py-3 px-4">Date Inward</th>
                <th className="py-3 px-4">Supplier Distributor</th>
                <th className="py-3 px-4">Received By</th>
                <th className="py-3 px-4 text-center">Items Received</th>
                <th className="py-3 px-4 text-right">Total Invoice</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading purchase orders...</span>
                  </td>
                </tr>
              ) : purchases.length > 0 ? (
                purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                      PO-#{p.id.toString().padStart(4, '0')}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(p.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{p.supplier_name}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {p.user_name || 'Admin'}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded bg-slate-100 font-semibold text-[10px] text-slate-700">
                        {p.items?.length || 0} unique items
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{Number(p.total_amount).toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setViewingPurchase(p)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition inline-flex items-center gap-1 font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Items</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No purchase orders recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 my-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">Receive Stock Purchase Inward</h3>
            <p className="text-xs text-slate-500 mb-4">
              Select supplier and specify line items to auto-update catalog quantities
            </p>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supplier / Wholesale Vendor *
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.contact_person ? `(Rep: ${s.contact_person})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Items Rows */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800">Purchased Line Items</label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item Row</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {orderItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200/60">
                      {/* Product select */}
                      <div className="flex-1">
                        <select
                          value={item.product_id}
                          onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Stock: {p.quantity})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="w-20">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', Math.max(1, Number(e.target.value)))}
                          placeholder="Qty"
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-center font-bold"
                        />
                      </div>

                      {/* Cost price */}
                      <div className="w-24">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.cost_price}
                          onChange={(e) => handleItemChange(idx, 'cost_price', Number(e.target.value))}
                          placeholder="Unit Cost"
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-right"
                        />
                      </div>

                      {/* Subtotal */}
                      <div className="w-20 text-right font-mono font-bold text-xs text-slate-800">
                        ₹{(item.quantity * item.cost_price).toFixed(2)}
                      </div>

                      {/* Remove */}
                      {orderItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900">Total Purchase Payable:</span>
                <span className="text-base font-extrabold text-blue-700 font-mono">
                  ₹{totalCost.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Processing...' : 'Confirm & Inward Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Purchase Details Modal */}
      {viewingPurchase && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Purchase Order #{viewingPurchase.id}
                </h3>
                <p className="text-xs text-slate-500">Supplier: {viewingPurchase.supplier_name}</p>
              </div>
              <button
                onClick={() => setViewingPurchase(null)}
                className="text-slate-400 hover:text-slate-700 px-3 py-1 rounded-lg hover:bg-slate-100 text-xs font-semibold"
              >
                Close
              </button>
            </div>

            <div className="overflow-y-auto flex-1 my-3">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold">
                    <th className="py-2 px-2">Item</th>
                    <th className="py-2 px-2 text-center">Qty</th>
                    <th className="py-2 px-2 text-right">Cost Price</th>
                    <th className="py-2 px-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewingPurchase.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-2 font-semibold text-slate-800">{item.product_name}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold">{item.quantity}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-500">
                        ₹{Number(item.cost_price).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">
                        ₹{Number(item.subtotal).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600">Total Inward Value:</span>
              <span className="text-base font-mono font-extrabold text-blue-700">
                ₹{Number(viewingPurchase.total_amount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
