export type UserRole = 'admin' | 'staff';

export interface User {
  id: number;
  name: string;
  username?: string;
  email: string;
  password?: string;
  role: UserRole;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  created_at: string;
  product_count?: number;
}

export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export interface Product {
  id: number;
  name: string;
  category_id: number;
  category_name?: string;
  brand: string;
  description: string;
  sku: string;
  purchase_price: number;
  selling_price: number;
  quantity: number;
  minimum_stock: number;
  unit: string;
  created_at: string;
  updated_at: string;
  stock_status?: StockStatus;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  created_at: string;
  total_orders?: number;
  total_spent?: number;
}

export interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  created_at: string;
  total_purchases?: number;
}

export interface CartItem {
  product_id: number;
  product_name: string;
  sku: string;
  unit: string;
  price: number;
  quantity: number;
  available_stock: number;
  subtotal: number;
}

export interface SaleItem {
  id?: number;
  sale_id?: number;
  product_id: number;
  product_name?: string;
  sku?: string;
  unit?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Other';

export interface Sale {
  id: number;
  invoice_number: string;
  customer_id: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  user_id: number;
  user_name?: string;
  subtotal: number;
  discount: number;
  tax: number;
  total_amount: number;
  payment_method: PaymentMethod;
  created_at: string;
  items?: SaleItem[];
}

export interface PurchaseItem {
  id?: number;
  purchase_id?: number;
  product_id: number;
  product_name?: string;
  sku?: string;
  quantity: number;
  cost_price?: number;
  purchase_price?: number;
  subtotal: number;
}

export interface Purchase {
  id: number;
  supplier_id: number;
  supplier_name?: string;
  supplier_phone?: string;
  user_name?: string;
  total_amount: number;
  purchase_date?: string;
  created_at: string;
  items?: PurchaseItem[];
}

export interface DashboardMetrics {
  total_products: number;
  total_stock: number;
  low_stock_count: number;
  out_of_stock_count: number;
  today_sales: number;
  today_sales_count: number;
  total_sales: number;
  total_sales_count: number;
  recent_sales: Sale[];
  low_stock_products: Product[];
  monthly_sales?: { month: string; sales: number; orders: number }[];
}

export interface ReportSummary {
  total_sales: number;
  total_purchases: number;
  gross_profit: number;
  total_inventory_items: number;
  total_inventory_cost_value: number;
  total_inventory_retail_value: number;
  top_selling_products: Array<{
    product_id: number;
    name: string;
    quantity_sold: number;
    total_revenue: number;
  }>;
  low_stock_list: Product[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
