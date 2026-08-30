import {
  ApiResponse,
  AuthResponse,
  Category,
  Customer,
  DashboardMetrics,
  Product,
  Purchase,
  ReportSummary,
  Sale,
  Supplier,
  User,
} from '../types.js';
import {
  getFirestoreProducts,
  addFirestoreProduct,
  updateFirestoreProduct,
  deleteFirestoreProduct,
  getFirestoreCategories,
  createFirestoreSale,
  getFirestoreSales,
  DEFAULT_PRODUCTS,
  DEFAULT_CATEGORIES,
} from './firebase.js';

const TOKEN_KEY = 'stationery_auth_token';
const USER_KEY = 'stationery_auth_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({
    success: false,
    message: 'Invalid response from server',
  }));

  if (!response.ok || data.success === false) {
    if (response.status === 401) {
      clearAuthSession();
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data.data !== undefined ? data.data : data;
}

export const api = {
  // Auth & Session
  getCurrentUser: getStoredUser,
  getToken: getStoredToken,
  logout: clearAuthSession,
  getMe: async (): Promise<User> => {
    const local = getStoredUser();
    if (local) return local;
    return request('/api/auth/profile');
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthSession(res.token, res.user);
    return res;
  },

  register: async (payload: { name: string; email: string; password?: string; role: 'admin' | 'staff' }): Promise<AuthResponse> => {
    const res = await request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setAuthSession(res.token, res.user);
    return res;
  },

  googleAuth: async (payload: { name?: string; email: string; role?: 'admin' | 'staff'; uid?: string; photoUrl?: string }): Promise<AuthResponse> => {
    const res = await request<AuthResponse>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setAuthSession(res.token, res.user);
    return res;
  },

  getProfile: (): Promise<User> => request('/api/auth/profile'),

  // Users Management
  getUsers: (): Promise<User[]> => request('/api/users'),
  createUser: (payload: any): Promise<User> =>
    request('/api/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateUser: (id: number, payload: any): Promise<User> =>
    request(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteUser: (id: number): Promise<{ success: boolean }> =>
    request(`/api/users/${id}`, { method: 'DELETE' }),

  // Dashboard
  getDashboard: async (): Promise<DashboardMetrics> => {
    try {
      // Aggregate live metrics directly from Firestore
      const [prods, salesList] = await Promise.all([
        getFirestoreProducts(),
        getFirestoreSales(),
      ]);

      if (prods.length === 0 && salesList.length === 0) {
        return request('/api/dashboard');
      }

      const totalStock = prods.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
      const lowStockProducts = prods.filter((p) => Number(p.quantity) > 0 && Number(p.quantity) <= (p.minimum_stock || 10));
      const outOfStockCount = prods.filter((p) => Number(p.quantity) <= 0).length;

      const todayStr = new Date().toISOString().split('T')[0];
      const todaySalesList = salesList.filter((s) => s.created_at?.startsWith(todayStr));
      const todaySalesTotal = todaySalesList.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);
      const allSalesTotal = salesList.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);

      return {
        total_products: prods.length,
        total_stock: totalStock,
        low_stock_count: lowStockProducts.length,
        out_of_stock_count: outOfStockCount,
        today_sales: Number(todaySalesTotal.toFixed(2)),
        today_sales_count: todaySalesList.length,
        total_sales: Number(allSalesTotal.toFixed(2)),
        total_sales_count: salesList.length,
        recent_sales: salesList.slice(0, 8),
        low_stock_products: lowStockProducts.slice(0, 6),
      };
    } catch (e) {
      return request('/api/dashboard');
    }
  },

  // Categories
  getCategories: async (): Promise<Category[]> => {
    try {
      const fbCats = await getFirestoreCategories();
      if (fbCats && fbCats.length > 0) return fbCats;
    } catch (e) {
      // fallback
    }
    try {
      const apiCats = await request<Category[]>('/api/categories');
      if (apiCats && apiCats.length > 0) return apiCats;
    } catch (e) {
      // fallback
    }
    return DEFAULT_CATEGORIES;
  },
  createCategory: (name: string, description?: string): Promise<Category> =>
    request('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),
  updateCategory: (id: number, name: string, description?: string): Promise<Category> =>
    request(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, description }),
    }),
  deleteCategory: (id: number): Promise<{ success: boolean }> =>
    request(`/api/categories/${id}`, { method: 'DELETE' }),

  // Products (Direct Firebase Firestore Storage with Backend sync)
  getProducts: async (params?: { category_id?: number; search?: string; status?: string }): Promise<Product[]> => {
    let prods: Product[] = [];
    try {
      prods = await getFirestoreProducts();
    } catch (e) {
      prods = [];
    }

    if (!prods || prods.length === 0) {
      try {
        const searchParams = new URLSearchParams();
        if (params?.category_id) searchParams.append('category_id', String(params.category_id));
        if (params?.search) searchParams.append('search', params.search);
        if (params?.status) searchParams.append('status', params.status);
        const qs = searchParams.toString();
        const apiProds = await request<Product[]>(`/api/products${qs ? `?${qs}` : ''}`);
        if (apiProds && apiProds.length > 0) return apiProds;
      } catch (err) {
        // use default fallback
      }
    }

    if (!prods || prods.length === 0) {
      prods = DEFAULT_PRODUCTS.map((p, idx) => ({ ...p, id: idx + 1 } as Product));
    }

    let filtered = prods;
    if (params?.category_id) {
      filtered = filtered.filter((p) => p.category_id === Number(params.category_id));
    }
    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q))
      );
    }
    if (params?.status && params.status !== 'All') {
      filtered = filtered.filter((p) => p.stock_status === params.status);
    }
    return filtered;
  },

  getProductById: async (id: number): Promise<Product> => {
    try {
      const prods = await getFirestoreProducts();
      const found = prods.find((p) => p.id === id);
      if (found) return found;
    } catch (e) {
      // fallback
    }
    return request(`/api/products/${id}`);
  },

  createProduct: async (payload: any): Promise<Product> => {
    try {
      const fbProd = await addFirestoreProduct(payload);
      // Synchronize with backend if available
      request('/api/products', {
        method: 'POST',
        body: JSON.stringify(fbProd),
      }).catch(() => {});
      return fbProd;
    } catch (err) {
      return request('/api/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
  },

  updateProduct: async (id: number, payload: any): Promise<Product> => {
    try {
      const updated = await updateFirestoreProduct(id, payload);
      request(`/api/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }).catch(() => {});
      return updated;
    } catch (err) {
      return request(`/api/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    }
  },

  deleteProduct: async (id: number): Promise<{ success: boolean }> => {
    try {
      await deleteFirestoreProduct(id);
      request(`/api/products/${id}`, { method: 'DELETE' }).catch(() => {});
      return { success: true };
    } catch (err) {
      return request(`/api/products/${id}`, { method: 'DELETE' });
    }
  },

  updateStock: async (id: number, quantity: number, reason?: string): Promise<Product> => {
    try {
      const updated = await updateFirestoreProduct(id, { quantity });
      return updated;
    } catch (e) {
      return request(`/api/products/${id}/stock`, {
        method: 'POST',
        body: JSON.stringify({ quantity, reason }),
      });
    }
  },

  // Customers
  getCustomers: (search?: string): Promise<Customer[]> => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return request(`/api/customers${qs}`);
  },
  getCustomerById: (id: number): Promise<Customer> => request(`/api/customers/${id}`),
  createCustomer: (payload: any): Promise<Customer> =>
    request('/api/customers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateCustomer: (id: number, payload: any): Promise<Customer> =>
    request(`/api/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteCustomer: (id: number): Promise<{ success: boolean }> =>
    request(`/api/customers/${id}`, { method: 'DELETE' }),

  // Suppliers
  getSuppliers: (search?: string): Promise<Supplier[]> => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return request(`/api/suppliers${qs}`);
  },
  getSupplierById: (id: number): Promise<Supplier> => request(`/api/suppliers/${id}`),
  createSupplier: (payload: any): Promise<Supplier> =>
    request('/api/suppliers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateSupplier: (id: number, payload: any): Promise<Supplier> =>
    request(`/api/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteSupplier: (id: number): Promise<{ success: boolean }> =>
    request(`/api/suppliers/${id}`, { method: 'DELETE' }),

  // Sales (Stored Directly in Firebase Firestore)
  getSales: async (params?: { search?: string; startDate?: string; endDate?: string; customer_id?: number; payment_method?: string }): Promise<Sale[]> => {
    try {
      const fbSales = await getFirestoreSales();
      if (!fbSales || fbSales.length === 0) {
        const searchParams = new URLSearchParams();
        if (params?.search) searchParams.append('search', params.search);
        if (params?.startDate) searchParams.append('startDate', params.startDate);
        if (params?.endDate) searchParams.append('endDate', params.endDate);
        if (params?.customer_id) searchParams.append('customer_id', String(params.customer_id));
        if (params?.payment_method) searchParams.append('payment_method', params.payment_method);
        const qs = searchParams.toString();
        return request(`/api/sales${qs ? `?${qs}` : ''}`);
      }

      let list = fbSales;
      if (params?.search) {
        const q = params.search.toLowerCase().trim();
        list = list.filter(
          (s) =>
            s.invoice_number?.toLowerCase().includes(q) ||
            s.customer_name?.toLowerCase().includes(q) ||
            s.user_name?.toLowerCase().includes(q)
        );
      }
      if (params?.payment_method) {
        list = list.filter((s) => s.payment_method === params.payment_method);
      }
      return list;
    } catch (err) {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.append('search', params.search);
      if (params?.startDate) searchParams.append('startDate', params.startDate);
      if (params?.endDate) searchParams.append('endDate', params.endDate);
      if (params?.customer_id) searchParams.append('customer_id', String(params.customer_id));
      if (params?.payment_method) searchParams.append('payment_method', params.payment_method);
      const qs = searchParams.toString();
      return request(`/api/sales${qs ? `?${qs}` : ''}`);
    }
  },

  getSaleById: async (id: number): Promise<Sale> => {
    try {
      const sales = await getFirestoreSales();
      const found = sales.find((s) => s.id === id);
      if (found) return found;
    } catch (e) {
      // fallback
    }
    return request(`/api/sales/${id}`);
  },

  createSale: async (payload: any): Promise<Sale> => {
    try {
      const fbSale = await createFirestoreSale(payload);
      // Sync with server if online
      request('/api/sales', {
        method: 'POST',
        body: JSON.stringify(payload),
      }).catch(() => {});
      return fbSale;
    } catch (err) {
      console.warn('Create sale fallback to server:', err);
      return request('/api/sales', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
  },

  // Purchases
  getPurchases: (search?: string): Promise<Purchase[]> => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return request(`/api/purchases${qs}`);
  },
  getPurchaseById: (id: number): Promise<Purchase> => request(`/api/purchases/${id}`),
  createPurchase: (payload: any): Promise<Purchase> =>
    request('/api/purchases', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Reports
  getReports: (startDate?: string, endDate?: string): Promise<ReportSummary> => {
    const sp = new URLSearchParams();
    if (startDate) sp.append('startDate', startDate);
    if (endDate) sp.append('endDate', endDate);
    const qs = sp.toString();
    return request(`/api/reports/summary${qs ? `?${qs}` : ''}`);
  },
  getSalesReport: (period: string = 'today', startDate?: string, endDate?: string): Promise<any> => {
    const sp = new URLSearchParams({ period });
    if (startDate) sp.append('startDate', startDate);
    if (endDate) sp.append('endDate', endDate);
    return request(`/api/reports/sales?${sp.toString()}`);
  },
  getInventoryReport: (): Promise<any> => request('/api/reports/inventory'),
  getLowStockReport: (): Promise<any> => request('/api/reports/low-stock'),
  getBestSellingReport: (): Promise<any[]> => request('/api/reports/best-selling'),

  // Database Utilities
  getSqlSchema: (): Promise<string> => request('/api/database/sql-schema'),
  getSqlSample: (): Promise<string> => request('/api/database/sql-sample'),
  resetDatabase: (): Promise<{ message: string }> =>
    request('/api/database/reset', { method: 'POST' }),
};
