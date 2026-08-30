import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  IndianRupee,
  X,
  Filter,
} from 'lucide-react';
import { Product, Category, User } from '../types.js';
import { api } from '../services/api.js';
import { useToast } from './Toast.js';

interface ProductsViewProps {
  currentUser: User | null;
  autoOpenAddModal?: boolean;
  onResetAutoOpen?: () => void;
}

const COMMON_BRANDS = [
  'Classmate',
  'DOMS',
  'Camlin',
  'Nataraj',
  'Apsara',
  'Cello',
  'Reynolds',
  'Flair',
  'Faber-Castell',
  'Kangaro',
  'Solo',
  'JK Copier',
  '3M',
  'Casio',
  'Royal',
];

export const ProductsView: React.FC<ProductsViewProps> = ({
  currentUser,
  autoOpenAddModal,
  onResetAutoOpen,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form data for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    category_id: 1,
    brand: '',
    price: 10,
    quantity: 10,
  });

  const toast = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodData, catData] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
      ]);
      setProducts(prodData);
      setCategories(catData);
    } catch (err: any) {
      toast.error('Failed to load products', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (autoOpenAddModal) {
      openAddModal();
      if (onResetAutoOpen) onResetAutoOpen();
    }
  }, [autoOpenAddModal]);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category_id: categories[0]?.id || 1,
      brand: 'Classmate',
      price: 20,
      quantity: 25,
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      category_id: p.category_id,
      brand: p.brand || '',
      price: p.selling_price,
      quantity: p.quantity,
    });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Validation Error', 'Product name is required.');
      return;
    }
    if (formData.price < 0) {
      toast.error('Validation Error', 'Price cannot be negative.');
      return;
    }
    if (formData.quantity < 0) {
      toast.error('Validation Error', 'Quantity cannot be negative.');
      return;
    }

    try {
      setSubmitting(true);
      const nextId = products.length + 1;
      const sku = `P${String(nextId).padStart(3, '0')}`;

      await api.createProduct({
        name: formData.name.trim(),
        category_id: Number(formData.category_id),
        brand: formData.brand.trim() || 'General',
        selling_price: Number(formData.price),
        purchase_price: Math.round(Number(formData.price) * 0.65),
        quantity: Number(formData.quantity),
        sku,
      });

      toast.success('Product Added', `"${formData.name}" added successfully.`);
      setIsAddModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error('Failed to add product', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!formData.name.trim()) {
      toast.error('Validation Error', 'Product name is required.');
      return;
    }
    if (formData.price < 0) {
      toast.error('Validation Error', 'Price cannot be negative.');
      return;
    }
    if (formData.quantity < 0) {
      toast.error('Validation Error', 'Quantity cannot be negative.');
      return;
    }

    try {
      setSubmitting(true);
      await api.updateProduct(editingProduct.id, {
        name: formData.name.trim(),
        category_id: Number(formData.category_id),
        brand: formData.brand.trim(),
        selling_price: Number(formData.price),
        quantity: Number(formData.quantity),
      });

      toast.success('Product Updated', `"${formData.name}" changes saved.`);
      setEditingProduct(null);
      loadData();
    } catch (err: any) {
      toast.error('Failed to update product', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    try {
      setSubmitting(true);
      await api.deleteProduct(deletingProduct.id);
      toast.success('Product Deleted', `"${deletingProduct.name}" was removed.`);
      setDeletingProduct(null);
      loadData();
    } catch (err: any) {
      toast.error('Failed to delete product', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Instant Filter & Search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'All') {
        const cat = categories.find((c) => c.name === selectedCategory);
        if (cat && p.category_id !== cat.id) return false;
      }

      // Stock status filter
      if (selectedStatus !== 'All') {
        if (selectedStatus === 'In Stock' && p.quantity <= 10) return false;
        if (selectedStatus === 'Low Stock' && (p.quantity <= 0 || p.quantity > 10)) return false;
        if (selectedStatus === 'Out of Stock' && p.quantity > 0) return false;
      }

      // Search
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const pCode = (p.sku || `P${String(p.id).padStart(3, '0')}`).toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchCode = pCode.includes(q);
        const matchBrand = (p.brand || '').toLowerCase().includes(q);
        const matchCat = (p.category_name || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchBrand && !matchCat) {
          return false;
        }
      }

      return true;
    });
  }, [products, categories, search, selectedCategory, selectedStatus]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header with + Add Product Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Products Catalog</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your stationery inventory, prices, and stock levels ({products.length} total items)
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Product</span>
        </button>
      </div>

      {/* Search and Category Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* Instant Search Bar */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name, ID (P001), brand, or category..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
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

        {/* Category Dropdown Filter */}
        <div className="w-full md:w-56">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Stock Status Dropdown Filter */}
        <div className="w-full md:w-44">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="In Stock">🟢 In Stock (&gt;10)</option>
            <option value="Low Stock">🟡 Low Stock (1-10)</option>
            <option value="Out of Stock">🔴 Out of Stock (0)</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading stationery catalog...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No products found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No stationery products matched your search or category filters. Try clearing your filters or add a new product.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('All');
                setSelectedStatus('All');
              }}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">ID</th>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Brand</th>
                  <th className="py-3.5 px-4 text-right">Price</th>
                  <th className="py-3.5 px-4 text-right">Quantity</th>
                  <th className="py-3.5 px-4 text-center">Stock Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const pIdCode = p.sku || `P${String(p.id).padStart(3, '0')}`;
                  const isOut = p.quantity <= 0;
                  const isLow = p.quantity > 0 && p.quantity <= 10;
                  const isIn = p.quantity > 10;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition group">
                      {/* Product ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                        {pIdCode}
                      </td>

                      {/* Product Name */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {p.name}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                          {p.category_name || 'Stationery'}
                        </span>
                      </td>

                      {/* Brand */}
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {p.brand || 'General'}
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        ₹{Number(p.selling_price).toFixed(2)}
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        <span
                          className={
                            isOut
                              ? 'text-rose-600'
                              : isLow
                              ? 'text-amber-600'
                              : 'text-slate-900'
                          }
                        >
                          {p.quantity}
                        </span>
                      </td>

                      {/* Stock Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        {isIn && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            🟢 In Stock
                          </span>
                        )}
                        {isLow && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                            🟡 Low Stock
                          </span>
                        )}
                        {isOut && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                            🔴 Out of Stock
                          </span>
                        )}
                      </td>

                      {/* Action Buttons: Edit & Delete */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingProduct(p)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD PRODUCT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">Add New Product</h3>
                <p className="text-xs text-slate-400">
                  Auto ID: <span className="font-mono font-bold text-blue-600">P{String(products.length + 1).padStart(3, '0')}</span>
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-3.5">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ball Pen, Notebook, A4 Paper..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brand <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Classmate, DOMS, Camlin, Cello..."
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                {/* Brand quick picks */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {COMMON_BRANDS.slice(0, 8).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setFormData({ ...formData, brand: b })}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition ${
                        formData.brand === b
                          ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price & Quantity Grid */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Price (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Buttons: Add Product and Cancel */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-xs"
                >
                  {submitting ? 'Adding...' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">Edit Product</h3>
                <p className="text-xs text-slate-400">
                  ID: <span className="font-mono font-bold text-blue-600">{editingProduct.sku || `P${String(editingProduct.id).padStart(3, '0')}`}</span>
                </p>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-3.5">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brand <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Price & Quantity Grid */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Price (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Buttons: Save Changes and Cancel */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-xs"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingProduct && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-base text-slate-900">
              Delete Product
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to delete this product?
            </p>
            <div className="my-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <span className="font-mono text-blue-600 font-bold">
                {deletingProduct.sku || `P${String(deletingProduct.id).padStart(3, '0')}`}
              </span>
              <p className="font-bold text-slate-800 mt-0.5">{deletingProduct.name}</p>
              <p className="text-slate-400">{deletingProduct.brand} • ₹{deletingProduct.selling_price}</p>
            </div>

            <div className="flex items-center justify-center gap-2 mt-5">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="flex-1 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDelete}
                className="flex-1 px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition shadow-xs"
              >
                {submitting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
