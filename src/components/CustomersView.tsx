import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Receipt,
  Eye,
  ShoppingBag,
} from 'lucide-react';
import { Customer, Sale, User } from '../types.js';
import { api } from '../services/api.js';
import { useToast } from './Toast.js';

interface CustomersViewProps {
  currentUser: User | null;
  onViewInvoice: (sale: Sale) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ currentUser, onViewInvoice }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [customerSales, setCustomerSales] = useState<Sale[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();
  const isAdmin = currentUser?.role === 'admin';

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.getCustomers(search || undefined);
      setCustomers(data);
    } catch (err: any) {
      toast.error('Failed to load customers', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadCustomers();
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', email: '', address: '' });
    setIsFormOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Validation Error', 'Customer name is required');
      return;
    }

    try {
      setSubmitting(true);
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, formData);
        toast.success('Customer updated', `"${formData.name}" updated successfully.`);
      } else {
        await api.createCustomer(formData);
        toast.success('Customer added', `"${formData.name}" added to customers.`);
      }
      setIsFormOpen(false);
      loadCustomers();
    } catch (err: any) {
      toast.error('Failed to save customer', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCustomer) return;
    try {
      setSubmitting(true);
      await api.deleteCustomer(deletingCustomer.id);
      toast.success('Customer removed', `"${deletingCustomer.name}" deleted.`);
      setDeletingCustomer(null);
      loadCustomers();
    } catch (err: any) {
      toast.error('Cannot delete customer', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const viewPurchaseHistory = async (c: Customer) => {
    setHistoryCustomer(c);
    try {
      setLoadingSales(true);
      const sales = await api.getSales({ customer_id: c.id });
      setCustomerSales(sales);
    } catch (err: any) {
      toast.error('Failed to load purchase history', err.message);
    } finally {
      setLoadingSales(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Customer Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage regular customers, student discounts, and invoice history
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-600/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <form onSubmit={handleSearch} className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, phone number, or email..."
            className="w-full pl-9 pr-24 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[11px] font-semibold transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Customer Cards & Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4 text-center">Total Invoices</th>
                <th className="py-3 px-4 text-right">Total Spent</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading customers...</span>
                  </td>
                </tr>
              ) : customers.length > 0 ? (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{c.name}</span>
                        {c.id === 1 && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-blue-100 text-blue-700 font-bold rounded">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">Customer ID: #{c.id}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      {c.phone && (
                        <div className="flex items-center gap-1 text-slate-700 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                      {c.email && (
                        <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{c.email}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 max-w-[200px] truncate">
                      {c.address || '—'}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => viewPurchaseHistory(c)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold transition text-[11px]"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>{c.total_orders || 0} bills</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{Number(c.total_spent || 0).toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => viewPurchaseHistory(c)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View Invoices"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {isAdmin && c.id !== 1 && (
                          <button
                            onClick={() => setDeletingCustomer(c)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Customer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No customers found matching search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter customer details for record keeping and billing
            </p>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Amitabh Sengupta / Student Name"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. 9830112233"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. client@email.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address / Institution</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. 12 Lake View Road, Kolkata"
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Purchase History Modal */}
      {historyCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Purchase History: {historyCustomer.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Total Spent: <strong className="text-blue-700">₹{Number(historyCustomer.total_spent || 0).toFixed(2)}</strong>
                </p>
              </div>
              <button
                onClick={() => setHistoryCustomer(null)}
                className="text-slate-400 hover:text-slate-700 px-3 py-1 rounded-lg hover:bg-slate-100 text-xs font-semibold"
              >
                Close
              </button>
            </div>

            <div className="overflow-y-auto flex-1 my-3">
              {loadingSales ? (
                <div className="py-8 text-center text-slate-400 text-xs">Loading customer invoices...</div>
              ) : customerSales.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold">
                      <th className="py-2 px-2">Invoice #</th>
                      <th className="py-2 px-2">Date</th>
                      <th className="py-2 px-2">Payment</th>
                      <th className="py-2 px-2 text-right">Total Amount</th>
                      <th className="py-2 px-2 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customerSales.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-2 font-bold text-slate-900">{s.invoice_number}</td>
                        <td className="py-2.5 px-2 text-slate-500">
                          {new Date(s.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-2.5 px-2">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-700">
                            {s.payment_method}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">
                          ₹{Number(s.total_amount).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <button
                            onClick={() => {
                              onViewInvoice(s);
                            }}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No sales recorded for this customer yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Customer Confirmation */}
      {deletingCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-bold text-rose-600 mb-1">Delete Customer</h3>
            <p className="text-xs text-slate-600 mb-4">
              Are you sure you want to delete customer <strong className="text-slate-900">"{deletingCustomer.name}"</strong>?
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingCustomer(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
