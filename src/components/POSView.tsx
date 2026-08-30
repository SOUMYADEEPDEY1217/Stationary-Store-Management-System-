import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  RotateCcw,
  IndianRupee,
  Package,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  AlertCircle,
} from 'lucide-react';
import { Product, Category, CartItem, Sale, User as AppUser, Customer } from '../types.js';
import { api } from '../services/api.js';
import { useToast } from './Toast.js';

interface POSViewProps {
  currentUser: AppUser | null;
  onSaleCompleted: (sale: Sale) => void;
}

export const POSView: React.FC<POSViewProps> = ({ currentUser, onSaleCompleted }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Cart / Bill State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Customer & Payment
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card'>('Cash');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [processingSale, setProcessingSale] = useState(false);

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
      toast.error('Failed to load products for billing', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Products for the quick picker
  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'All') {
      const cat = categories.find((c) => c.name === selectedCategory);
      if (cat && p.category_id !== cat.id) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const pCode = (p.sku || `P${String(p.id).padStart(3, '0')}`).toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchCode = pCode.includes(q);
      const matchBrand = (p.brand || '').toLowerCase().includes(q);
      const matchCat = (p.category_name || '').toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchBrand && !matchCat) return false;
    }
    return true;
  });

  // Add Product to Bill
  const addToCart = (product: Product, quantityToAdd: number = 1) => {
    if (product.quantity <= 0) {
      toast.error('Out of Stock', `"${product.name}" has 0 available inventory.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        const newQty = existing.quantity + quantityToAdd;
        if (newQty > product.quantity) {
          toast.warning('Stock Limit Reached', `Only ${product.quantity} units available.`);
          return prev;
        }
        return prev.map((item) =>
          item.product_id === product.id
            ? {
                ...item,
                quantity: newQty,
                subtotal: Number((newQty * item.price).toFixed(2)),
              }
            : item
        );
      } else {
        if (quantityToAdd > product.quantity) {
          toast.warning('Stock Limit Reached', `Only ${product.quantity} units available.`);
          return prev;
        }
        const unitPrice = Number(product.selling_price) || 0;
        return [
          ...prev,
          {
            product_id: product.id,
            product_name: product.name,
            sku: product.sku || `P${String(product.id).padStart(3, '0')}`,
            unit: product.unit || 'Pieces',
            price: unitPrice,
            quantity: quantityToAdd,
            available_stock: product.quantity,
            subtotal: Number((quantityToAdd * unitPrice).toFixed(2)),
          },
        ];
      }
    });
  };

  // Update Quantity
  const updateQuantity = (productId: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.product_id === productId) {
          if (newQty > item.available_stock) {
            toast.warning(
              'Stock Limit',
              `Maximum available stock for this item is ${item.available_stock}.`
            );
            return item;
          }
          return {
            ...item,
            quantity: newQty,
            subtotal: Number((newQty * item.price).toFixed(2)),
          };
        }
        return item;
      })
    );
  };

  // Update Unit Price
  const updatePrice = (productId: number, newPrice: number) => {
    const safePrice = Math.max(0, newPrice);
    setCart((prev) =>
      prev.map((item) => {
        if (item.product_id === productId) {
          return {
            ...item,
            price: safePrice,
            subtotal: Number((item.quantity * safePrice).toFixed(2)),
          };
        }
        return item;
      })
    );
  };

  // Update Subtotal Directly
  const updateSubtotal = (productId: number, newSubtotal: number) => {
    const safeSubtotal = Math.max(0, newSubtotal);
    setCart((prev) =>
      prev.map((item) => {
        if (item.product_id === productId) {
          const calculatedPrice = item.quantity > 0 ? Number((safeSubtotal / item.quantity).toFixed(2)) : 0;
          return {
            ...item,
            price: calculatedPrice,
            subtotal: safeSubtotal,
          };
        }
        return item;
      })
    );
  };

  // Remove from Cart
  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  // Clear Bill
  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
  };

  // Calculations
  const billSubtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const grandTotal = Math.max(0, billSubtotal - (Number(discountAmount) || 0));
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Complete Sale
  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      toast.error('Empty Bill', 'Please add at least one product to the bill.');
      return;
    }

    // Verify stock constraints before sending
    for (const item of cart) {
      if (item.quantity > item.available_stock) {
        toast.error(
          'Insufficient Stock',
          `"${item.product_name}" has only ${item.available_stock} in stock (requested ${item.quantity}).`
        );
        return;
      }
    }

    try {
      setProcessingSale(true);
      const salePayload = {
        customer_id: 1, // Walk-in or active customer
        customer_name: customerName || 'Walk-in Customer',
        user_id: currentUser?.id || 1,
        user_name: currentUser?.name || (currentUser?.role === 'admin' ? 'Store Admin' : 'Sales Staff'),
        items: cart.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
        })),
        discount: Number(discountAmount) || 0,
        tax: 0,
        payment_method: paymentMethod,
      };

      const result = await api.createSale(salePayload);
      toast.success('Sale Completed Successfully', `Invoice ${result.invoice_number} generated for ₹${result.total_amount}`);

      // Clear bill
      clearCart();

      // Trigger Invoice Receipt Modal
      onSaleCompleted(result);

      // Refresh product stock list
      loadData();
    } catch (err: any) {
      toast.error('Sale Failed', err.message);
    } finally {
      setProcessingSale(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* View Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Billing Counter & POS</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Select stationery items, enter quantities, and generate customer receipts
          </p>
        </div>
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Bill</span>
          </button>
        )}
      </div>

      {/* Main Two-Column Layout: Left (Product Selector) & Right (Current Bill) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Product Search & Selector (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Category Filter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stationery by name, ID (e.g. P001), brand..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Quick Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === 'All'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Items
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    selectedCategory === cat.name
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Products List Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Available Products ({filteredProducts.length})
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center">
                <div className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">No matching stationery products found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
                {filteredProducts.map((p) => {
                  const pIdCode = p.sku || `P${String(p.id).padStart(3, '0')}`;
                  const isOut = p.quantity <= 0;
                  const isLow = p.quantity > 0 && p.quantity <= 10;
                  const inCartItem = cart.find((i) => i.product_id === p.id);

                  return (
                    <div
                      key={p.id}
                      className={`p-3 rounded-xl border transition flex flex-col justify-between ${
                        isOut
                          ? 'bg-slate-50/60 border-slate-200 opacity-60'
                          : inCartItem
                          ? 'bg-blue-50/30 border-blue-200 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-bold text-blue-600">
                            {pIdCode}
                          </span>
                          {isOut ? (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                              {p.quantity} left
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                              {p.quantity} in stock
                            </span>
                          )}
                        </div>

                        <h4 className="font-semibold text-xs text-slate-900 mt-1 leading-snug">
                          {p.name}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          {p.brand} • {p.category_name}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          ₹{Number(p.selling_price).toFixed(2)}
                        </span>

                        <button
                          disabled={isOut}
                          onClick={() => addToCart(p, 1)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            isOut
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : inCartItem
                              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                              : 'bg-slate-900 text-white hover:bg-slate-800 shadow-xs'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{inCartItem ? `Add (${inCartItem.quantity})` : 'Add'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Current Bill / Order Summary (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sticky top-20">
          {/* Bill Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-base text-slate-900">Current Bill</h2>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              {totalItemsCount} item{totalItemsCount !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Cart Table / Items */}
          <div className="p-4 flex-1 max-h-[380px] overflow-y-auto custom-scrollbar divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">Bill is empty</p>
                <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">
                  Click on products from the left side to add them to this bill.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product_id} className="py-3 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          {item.sku}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900">{item.product_name}</h4>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Max Stock: {item.available_stock}
                      </span>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition"
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Editable Rate, Quantity, Subtotal controls */}
                  <div className="grid grid-cols-12 gap-2 items-center text-xs">
                    {/* Rate/Price */}
                    <div className="col-span-4">
                      <label className="text-[10px] text-slate-400 block">Rate (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={item.price}
                        onChange={(e) => updatePrice(item.product_id, Number(e.target.value))}
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded font-mono font-semibold text-xs"
                      />
                    </div>

                    {/* Quantity with +/- */}
                    <div className="col-span-4">
                      <label className="text-[10px] text-slate-400 block text-center">Qty</label>
                      <div className="flex items-center border border-slate-200 rounded bg-slate-50 overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-200 font-bold"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={item.available_stock}
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(item.product_id, Math.max(1, Number(e.target.value)))
                          }
                          className="w-full text-center bg-transparent text-xs font-bold font-mono focus:outline-hidden"
                        />
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-200 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Subtotal (editable or calculated) */}
                    <div className="col-span-4 text-right">
                      <label className="text-[10px] text-slate-400 block">Total (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={item.subtotal}
                        onChange={(e) => updateSubtotal(item.product_id, Number(e.target.value))}
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded font-mono font-bold text-xs text-right text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Payment & Bill Summary */}
          <div className="p-4 bg-slate-50/70 border-t border-slate-200 rounded-b-2xl space-y-3.5">
            {/* Payment Method Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Payment Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Cash', 'UPI', 'Card'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                      paymentMethod === method
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {method === 'Cash' && <Banknote className="w-3.5 h-3.5" />}
                    {method === 'UPI' && <Smartphone className="w-3.5 h-3.5" />}
                    {method === 'Card' && <CreditCard className="w-3.5 h-3.5" />}
                    <span>{method}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Discount Option */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-slate-600">Discount (₹)</span>
              <input
                type="number"
                min="0"
                value={discountAmount || ''}
                placeholder="0"
                onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-lg text-right font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Subtotal & Grand Total */}
            <div className="pt-2 border-t border-slate-200/80 space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="font-mono">₹{billSubtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount:</span>
                  <span className="font-mono">-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
                <span className="text-sm font-bold text-slate-900">Grand Total:</span>
                <span className="text-2xl font-bold font-mono text-emerald-600">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* COMPLETE SALE BUTTON */}
            <button
              onClick={handleCompleteSale}
              disabled={cart.length === 0 || processingSale}
              className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-md ${
                cart.length === 0 || processingSale
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {processingSale ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing Bill...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Complete Sale (₹{grandTotal.toFixed(2)})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
