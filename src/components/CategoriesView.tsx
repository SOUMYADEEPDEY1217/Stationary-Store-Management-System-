import React, { useState, useEffect } from 'react';
import { FolderTree, Plus, Search, Edit2, Trash2, Package } from 'lucide-react';
import { Category, User } from '../types.js';
import { api } from '../services/api.js';
import { useToast } from './Toast.js';

interface CategoriesViewProps {
  currentUser: User | null;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({ currentUser }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();
  const isAdmin = currentUser?.role === 'admin';

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await api.getCategories();
      setCategories(data);
    } catch (err: any) {
      toast.error('Failed to load categories', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setIsFormOpen(true);
  };

  const openEditModal = (c: Category) => {
    setEditingCategory(c);
    setName(c.name);
    setDescription(c.description || '');
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Validation Error', 'Category name cannot be empty');
      return;
    }

    try {
      setSubmitting(true);
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, name, description);
        toast.success('Category updated', `"${name}" updated successfully.`);
      } else {
        await api.createCategory(name, description);
        toast.success('Category created', `"${name}" added to categories.`);
      }
      setIsFormOpen(false);
      loadCategories();
    } catch (err: any) {
      toast.error('Failed to save category', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    try {
      setSubmitting(true);
      await api.deleteCategory(deletingCategory.id);
      toast.success('Category deleted', `"${deletingCategory.name}" removed.`);
      setDeletingCategory(null);
      loadCategories();
    } catch (err: any) {
      toast.error('Cannot delete category', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Categories Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Group and structure your stationery products into organized departments
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-600/20 transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Category</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories by name or description..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
            <span>Loading categories...</span>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((cat) => (
            <div
              key={cat.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-200 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                    <FolderTree className="w-4 h-4" />
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                    <Package className="w-3 h-3 text-slate-400" />
                    <span>{cat.product_count || 0} items</span>
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm mt-3">{cat.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {cat.description || 'No description provided.'}
                </p>
              </div>

              {isAdmin && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-1">
                  <button
                    onClick={() => openEditModal(cat)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit Category"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingCategory(cat)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400">
            No categories found matching your query.
          </div>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Categorize products to improve navigation and pos search
            </p>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Art & Drawing Supplies"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional details about products grouped in this category..."
                  rows={3}
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
                  {submitting ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Modal */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-bold text-rose-600 mb-1">Delete Category</h3>
            <p className="text-xs text-slate-600 mb-4">
              Are you sure you want to delete category <strong className="text-slate-900">"{deletingCategory.name}"</strong>?
              Note: Categories containing products cannot be deleted.
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
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
