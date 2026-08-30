import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  Category,
  Product,
  Customer,
  Supplier,
  Sale,
  SaleItem,
  Purchase,
  PurchaseItem,
  DashboardMetrics,
  StockStatus,
} from '../types.js';

interface DatabaseSchema {
  users: User[];
  categories: Category[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: Sale[];
  sale_items: SaleItem[];
  purchases: Purchase[];
  purchase_items: PurchaseItem[];
  sequence: {
    user: number;
    category: number;
    product: number;
    customer: number;
    supplier: number;
    sale: number;
    sale_item: number;
    purchase: number;
    purchase_item: number;
  };
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

export const INITIAL_CATEGORIES = [
  'Writing Items',
  'Notebooks & Paper',
  'Files & Folders',
  'Office Supplies',
  'Mathematical & Drawing Items',
  'Art & Craft',
  'School & College Supplies',
  'Desk Accessories',
  'Printing Supplies',
  'Other Items',
];

interface RawProductSeed {
  name: string;
  category: string;
  brand: string;
  price: number;
  cost: number;
  quantity: number;
  unit?: string;
}

export const INITIAL_PRODUCTS_SEED: RawProductSeed[] = [
  // 1. Writing Items
  { name: 'Ball Pen', category: 'Writing Items', brand: 'Cello', price: 10, cost: 6, quantity: 60, unit: 'Pieces' },
  { name: 'Gel Pen', category: 'Writing Items', brand: 'Reynolds', price: 15, cost: 9, quantity: 45, unit: 'Pieces' },
  { name: 'Fountain Pen', category: 'Writing Items', brand: 'Camlin', price: 75, cost: 45, quantity: 15, unit: 'Pieces' },
  { name: 'Pencil', category: 'Writing Items', brand: 'Apsara', price: 5, cost: 3, quantity: 120, unit: 'Pieces' },
  { name: 'Mechanical Pencil', category: 'Writing Items', brand: 'Faber-Castell', price: 40, cost: 24, quantity: 25, unit: 'Pieces' },
  { name: 'Marker', category: 'Writing Items', brand: 'Camlin', price: 30, cost: 18, quantity: 20, unit: 'Pieces' },
  { name: 'Whiteboard Marker', category: 'Writing Items', brand: 'Camlin', price: 35, cost: 20, quantity: 18, unit: 'Pieces' },
  { name: 'Highlighter', category: 'Writing Items', brand: 'Faber-Castell', price: 25, cost: 15, quantity: 8, unit: 'Pieces' }, // Low Stock
  { name: 'Sketch Pen', category: 'Writing Items', brand: 'DOMS', price: 50, cost: 30, quantity: 30, unit: 'Packs' },
  { name: 'Pen Refill', category: 'Writing Items', brand: 'Cello', price: 5, cost: 2.5, quantity: 50, unit: 'Pieces' },

  // 2. Notebooks & Paper
  { name: 'Notebook', category: 'Notebooks & Paper', brand: 'Classmate', price: 55, cost: 35, quantity: 40, unit: 'Books' },
  { name: 'Exercise Book', category: 'Notebooks & Paper', brand: 'Classmate', price: 35, cost: 22, quantity: 30, unit: 'Books' },
  { name: 'Register', category: 'Notebooks & Paper', brand: 'Classmate', price: 85, cost: 55, quantity: 22, unit: 'Books' },
  { name: 'Spiral Notebook', category: 'Notebooks & Paper', brand: 'Classmate', price: 120, cost: 75, quantity: 18, unit: 'Books' },
  { name: 'Diary', category: 'Notebooks & Paper', brand: 'Classmate', price: 150, cost: 95, quantity: 12, unit: 'Books' },
  { name: 'A4 Paper', category: 'Notebooks & Paper', brand: 'JK Copier', price: 320, cost: 240, quantity: 15, unit: 'Reams' },
  { name: 'A3 Paper', category: 'Notebooks & Paper', brand: 'JK Copier', price: 550, cost: 420, quantity: 6, unit: 'Reams' }, // Low Stock
  { name: 'Graph Paper', category: 'Notebooks & Paper', brand: 'Classmate', price: 20, cost: 12, quantity: 35, unit: 'Pads' },
  { name: 'Chart Paper', category: 'Notebooks & Paper', brand: 'Camlin', price: 10, cost: 6, quantity: 50, unit: 'Sheets' },
  { name: 'Sticky Notes', category: 'Notebooks & Paper', brand: '3M', price: 45, cost: 28, quantity: 28, unit: 'Pads' },

  // 3. Files & Folders
  { name: 'Plastic File', category: 'Files & Folders', brand: 'Solo', price: 25, cost: 15, quantity: 40, unit: 'Pieces' },
  { name: 'Document File', category: 'Files & Folders', brand: 'Solo', price: 60, cost: 38, quantity: 25, unit: 'Pieces' },
  { name: 'Ring Binder', category: 'Files & Folders', brand: 'Solo', price: 110, cost: 70, quantity: 14, unit: 'Pieces' },
  { name: 'Clip File', category: 'Files & Folders', brand: 'Solo', price: 35, cost: 22, quantity: 30, unit: 'Pieces' },
  { name: 'Report File', category: 'Files & Folders', brand: 'Solo', price: 20, cost: 12, quantity: 45, unit: 'Pieces' },
  { name: 'File Folder', category: 'Files & Folders', brand: 'Solo', price: 40, cost: 25, quantity: 20, unit: 'Pieces' },
  { name: 'Envelope', category: 'Files & Folders', brand: 'Royal', price: 5, cost: 2.5, quantity: 100, unit: 'Pieces' },

  // 4. Office Supplies
  { name: 'Stapler', category: 'Office Supplies', brand: 'Kangaro', price: 95, cost: 60, quantity: 16, unit: 'Pieces' },
  { name: 'Staple Pins', category: 'Office Supplies', brand: 'Kangaro', price: 15, cost: 9, quantity: 50, unit: 'Boxes' },
  { name: 'Paper Clips', category: 'Office Supplies', brand: 'Kangaro', price: 20, cost: 12, quantity: 35, unit: 'Boxes' },
  { name: 'Binder Clips', category: 'Office Supplies', brand: 'Kangaro', price: 45, cost: 28, quantity: 25, unit: 'Boxes' },
  { name: 'Punching Machine', category: 'Office Supplies', brand: 'Kangaro', price: 140, cost: 90, quantity: 12, unit: 'Pieces' },
  { name: 'Rubber Bands', category: 'Office Supplies', brand: 'Camel', price: 30, cost: 18, quantity: 40, unit: 'Packs' },
  { name: 'Scissors', category: 'Office Supplies', brand: 'Kangaro', price: 65, cost: 40, quantity: 18, unit: 'Pieces' },
  { name: 'Glue Stick', category: 'Office Supplies', brand: 'Fevistik', price: 25, cost: 15, quantity: 30, unit: 'Pieces' },
  { name: 'Liquid Glue', category: 'Office Supplies', brand: 'Fevicol', price: 20, cost: 12, quantity: 40, unit: 'Bottles' },
  { name: 'Tape', category: 'Office Supplies', brand: 'Wonder', price: 30, cost: 18, quantity: 24, unit: 'Rolls' },

  // 5. Mathematical & Drawing Items
  { name: 'Ruler', category: 'Mathematical & Drawing Items', brand: 'Apsara', price: 15, cost: 9, quantity: 50, unit: 'Pieces' },
  { name: 'Geometry Box', category: 'Mathematical & Drawing Items', brand: 'Camlin', price: 130, cost: 85, quantity: 20, unit: 'Boxes' },
  { name: 'Compass', category: 'Mathematical & Drawing Items', brand: 'Camlin', price: 45, cost: 28, quantity: 15, unit: 'Pieces' },
  { name: 'Protractor', category: 'Mathematical & Drawing Items', brand: 'Camlin', price: 15, cost: 9, quantity: 30, unit: 'Pieces' },
  { name: 'Set Square', category: 'Mathematical & Drawing Items', brand: 'Camlin', price: 25, cost: 15, quantity: 25, unit: 'Sets' },
  { name: 'Divider', category: 'Mathematical & Drawing Items', brand: 'Camlin', price: 35, cost: 22, quantity: 15, unit: 'Pieces' },
  { name: 'Eraser', category: 'Mathematical & Drawing Items', brand: 'Apsara', price: 5, cost: 3, quantity: 80, unit: 'Pieces' },
  { name: 'Sharpener', category: 'Mathematical & Drawing Items', brand: 'Apsara', price: 5, cost: 3, quantity: 75, unit: 'Pieces' },
  { name: 'Drawing Sheet', category: 'Mathematical & Drawing Items', brand: 'Camlin', price: 10, cost: 6, quantity: 40, unit: 'Sheets' },

  // 6. Art & Craft
  { name: 'Crayons', category: 'Art & Craft', brand: 'DOMS', price: 60, cost: 38, quantity: 25, unit: 'Packs' },
  { name: 'Oil Pastels', category: 'Art & Craft', brand: 'Camlin', price: 90, cost: 58, quantity: 20, unit: 'Packs' },
  { name: 'Watercolors', category: 'Art & Craft', brand: 'Camlin', price: 110, cost: 70, quantity: 18, unit: 'Packs' },
  { name: 'Poster Colors', category: 'Art & Craft', brand: 'Camlin', price: 160, cost: 105, quantity: 15, unit: 'Sets' },
  { name: 'Paint Brushes', category: 'Art & Craft', brand: 'Camlin', price: 80, cost: 50, quantity: 22, unit: 'Sets' },
  { name: 'Craft Paper', category: 'Art & Craft', brand: 'DOMS', price: 40, cost: 25, quantity: 30, unit: 'Packs' },
  { name: 'Colored Pencils', category: 'Art & Craft', brand: 'Faber-Castell', price: 120, cost: 75, quantity: 16, unit: 'Packs' },
  { name: 'Sketchbook', category: 'Art & Craft', brand: 'Classmate', price: 75, cost: 48, quantity: 25, unit: 'Books' },

  // 7. School & College Supplies
  { name: 'Lab Notebook', category: 'School & College Supplies', brand: 'Classmate', price: 90, cost: 58, quantity: 30, unit: 'Books' },
  { name: 'Practical Copy', category: 'School & College Supplies', brand: 'Classmate', price: 80, cost: 52, quantity: 25, unit: 'Books' },
  { name: 'Project File', category: 'School & College Supplies', brand: 'Solo', price: 45, cost: 28, quantity: 35, unit: 'Pieces' },
  { name: 'Assignment Sheets', category: 'School & College Supplies', brand: 'Classmate', price: 50, cost: 32, quantity: 40, unit: 'Packs' },
  { name: 'Exam Pad', category: 'School & College Supplies', brand: 'Solo', price: 70, cost: 45, quantity: 20, unit: 'Pieces' },
  { name: 'Clipboard', category: 'School & College Supplies', brand: 'Solo', price: 85, cost: 55, quantity: 15, unit: 'Pieces' },
  { name: 'Book Cover', category: 'School & College Supplies', brand: 'Royal', price: 20, cost: 12, quantity: 60, unit: 'Rolls' },
  { name: 'Labels', category: 'School & College Supplies', brand: 'Royal', price: 10, cost: 5, quantity: 80, unit: 'Sheets' },
  { name: 'ID Card Holder', category: 'School & College Supplies', brand: 'Royal', price: 25, cost: 15, quantity: 40, unit: 'Pieces' },
  { name: 'Lanyard', category: 'School & College Supplies', brand: 'Royal', price: 20, cost: 12, quantity: 35, unit: 'Pieces' },

  // 8. Desk Accessories
  { name: 'Pen Stand', category: 'Desk Accessories', brand: 'Solo', price: 65, cost: 40, quantity: 15, unit: 'Pieces' },
  { name: 'Calculator', category: 'Desk Accessories', brand: 'Casio', price: 495, cost: 360, quantity: 10, unit: 'Pieces' }, // Low Stock
  { name: 'Calendar', category: 'Desk Accessories', brand: 'Royal', price: 120, cost: 75, quantity: 8, unit: 'Pieces' }, // Low Stock
  { name: 'Memo Pad', category: 'Desk Accessories', brand: 'Classmate', price: 35, cost: 22, quantity: 30, unit: 'Pads' },
  { name: 'Bookmark', category: 'Desk Accessories', brand: 'Royal', price: 15, cost: 8, quantity: 50, unit: 'Pieces' },

  // 9. Printing Supplies
  { name: 'Printer Paper', category: 'Printing Supplies', brand: 'JK Copier', price: 340, cost: 255, quantity: 20, unit: 'Reams' },
  { name: 'Photo Paper', category: 'Printing Supplies', brand: 'Kodak', price: 280, cost: 195, quantity: 12, unit: 'Packs' },
  { name: 'Ink Cartridge', category: 'Printing Supplies', brand: 'HP', price: 850, cost: 650, quantity: 5, unit: 'Pieces' }, // Low Stock
  { name: 'Toner Cartridge', category: 'Printing Supplies', brand: 'Canon', price: 1450, cost: 1100, quantity: 0, unit: 'Pieces' }, // Out of Stock
  { name: 'Sticker Paper', category: 'Printing Supplies', brand: 'Royal', price: 150, cost: 95, quantity: 15, unit: 'Packs' },

  // 10. Other Items
  { name: 'Brown Paper', category: 'Other Items', brand: 'Royal', price: 10, cost: 5, quantity: 60, unit: 'Rolls' },
  { name: 'Gift Wrapping Paper', category: 'Other Items', brand: 'Royal', price: 15, cost: 8, quantity: 45, unit: 'Sheets' },
  { name: 'Gift Bag', category: 'Other Items', brand: 'Royal', price: 35, cost: 20, quantity: 25, unit: 'Pieces' },
  { name: 'Greeting Card', category: 'Other Items', brand: 'Archies', price: 50, cost: 28, quantity: 20, unit: 'Pieces' },
  { name: 'Correction Pen', category: 'Other Items', brand: 'Camlin', price: 30, cost: 18, quantity: 30, unit: 'Pieces' },
  { name: 'Correction Tape', category: 'Other Items', brand: 'Flair', price: 45, cost: 28, quantity: 20, unit: 'Pieces' },
  { name: 'Whiteboard Duster', category: 'Other Items', brand: 'Camlin', price: 40, cost: 24, quantity: 18, unit: 'Pieces' },
  { name: 'Chalk', category: 'Other Items', brand: 'Apsara', price: 25, cost: 15, quantity: 30, unit: 'Boxes' },
];

function getInitialData(): DatabaseSchema {
  const users: User[] = [];

  // Seed Categories
  const categories: Category[] = INITIAL_CATEGORIES.map((name, index) => ({
    id: index + 1,
    name,
    description: `All items for ${name}`,
    created_at: new Date().toISOString(),
  }));

  // Seed Products with Product IDs: P001, P002, etc.
  const products: Product[] = INITIAL_PRODUCTS_SEED.map((p, index) => {
    const id = index + 1;
    const cat = categories.find((c) => c.name === p.category);
    const category_id = cat ? cat.id : 1;
    const pCode = `P${String(id).padStart(3, '0')}`;

    return {
      id,
      name: p.name,
      category_id,
      brand: p.brand,
      description: `${p.brand} ${p.name}`,
      sku: pCode,
      purchase_price: p.cost,
      selling_price: p.price,
      quantity: p.quantity,
      minimum_stock: 10,
      unit: p.unit || 'Pieces',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });

  const customers: Customer[] = [
    {
      id: 1,
      name: 'Walk-in Customer',
      phone: '9876543210',
      email: 'walkin@stationery.com',
      address: 'Counter Direct Sale',
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      name: 'College Department Store',
      phone: '9876500112',
      email: 'dept@college.edu',
      address: 'Main Campus Admin Block',
      created_at: new Date().toISOString(),
    },
  ];

  const suppliers: Supplier[] = [
    {
      id: 1,
      name: 'City Wholesale Stationers',
      contact_person: 'Rajesh Kumar',
      phone: '9822334455',
      email: 'sales@citystationery.com',
      address: 'Wholesale Market, Sector 4',
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      name: 'Paper & Print Distributors',
      contact_person: 'Amit Sharma',
      phone: '9811223344',
      email: 'orders@paperprint.com',
      address: 'Industrial Area Phase 2',
      created_at: new Date().toISOString(),
    },
  ];

  // Seed 2 initial sales
  const initialSaleDate = new Date().toISOString();
  const sales: Sale[] = [
    {
      id: 1,
      invoice_number: `INV-${new Date().getFullYear()}-0001`,
      customer_id: 1,
      user_id: 1,
      subtotal: 180,
      discount: 0,
      tax: 0,
      total_amount: 180,
      payment_method: 'Cash',
      created_at: initialSaleDate,
    },
    {
      id: 2,
      invoice_number: `INV-${new Date().getFullYear()}-0002`,
      customer_id: 1,
      user_id: 1,
      subtotal: 350,
      discount: 20,
      tax: 0,
      total_amount: 330,
      payment_method: 'UPI',
      created_at: initialSaleDate,
    },
  ];

  const sale_items: SaleItem[] = [
    { id: 1, sale_id: 1, product_id: 1, quantity: 3, price: 10, subtotal: 30 }, // 3 Ball Pens
    { id: 2, sale_id: 1, product_id: 11, quantity: 2, price: 55, subtotal: 110 }, // 2 Notebooks
    { id: 3, sale_id: 1, product_id: 4, quantity: 8, price: 5, subtotal: 40 }, // 8 Pencils
    { id: 4, sale_id: 2, product_id: 16, quantity: 1, price: 320, subtotal: 320 }, // 1 A4 Paper
    { id: 5, sale_id: 2, product_id: 2, quantity: 2, price: 15, subtotal: 30 }, // 2 Gel Pens
  ];

  return {
    users,
    categories,
    products,
    customers,
    suppliers,
    sales,
    sale_items,
    purchases: [],
    purchase_items: [],
    sequence: {
      user: users.length,
      category: categories.length,
      product: products.length,
      customer: customers.length,
      supplier: suppliers.length,
      sale: sales.length,
      sale_item: sale_items.length,
      purchase: 0,
      purchase_item: 0,
    },
  };
}

class StoreDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const content = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        // If data is empty or missing the 10 categories, seed with rich initial dataset
        if (!parsed.categories || parsed.categories.length === 0 || !parsed.products || parsed.products.length < 10) {
          const fresh = getInitialData();
          this.saveDataDirect(fresh);
          return fresh;
        }
        return parsed;
      }
    } catch (err) {
      console.warn('Error reading store.json, using fresh initial seed:', err);
    }
    const initial = getInitialData();
    this.saveDataDirect(initial);
    return initial;
  }

  private saveDataDirect(data: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving data to store.json:', err);
    }
  }

  private save() {
    this.saveDataDirect(this.data);
  }

  public resetToSample() {
    this.data = getInitialData();
    this.save();
    return this.data;
  }

  // Stock status calculation:
  // Quantity > 10 → In Stock
  // Quantity 1–10 → Low Stock
  // Quantity = 0 → Out of Stock
  public computeStockStatus(quantity: number): StockStatus {
    if (quantity <= 0) return 'Out of Stock';
    if (quantity <= 10) return 'Low Stock';
    return 'In Stock';
  }

  // === Users ===
  public getUsers() {
    return this.data.users.map(({ password, ...u }) => ({
      ...u,
      username: u.username || u.email.split('@')[0],
      status: u.status || 'active',
    }));
  }

  public findUserByEmail(email: string) {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  }

  public findUserById(id: number) {
    const user = this.data.users.find((u) => u.id === id);
    if (!user) return null;
    const { password, ...safeUser } = user;
    return {
      ...safeUser,
      username: safeUser.username || safeUser.email.split('@')[0],
      status: safeUser.status || 'active',
    };
  }

  public createUser(payload: {
    name: string;
    username?: string;
    email: string;
    password?: string;
    role: 'admin' | 'staff';
    status?: 'active' | 'inactive';
  }) {
    if (!payload.name || !payload.email) throw new Error('Name and email are required');
    const existing = this.data.users.find(
      (u) => u.email.toLowerCase() === payload.email.toLowerCase().trim()
    );
    if (existing) throw new Error(`User with email "${payload.email}" already exists`);

    this.data.sequence.user += 1;
    const hashed = bcrypt.hashSync(payload.password || 'password123', 10);
    const newUser: User = {
      id: this.data.sequence.user,
      name: payload.name.trim(),
      username: payload.username?.trim() || payload.email.split('@')[0],
      email: payload.email.trim(),
      password: hashed,
      role: payload.role || 'staff',
      status: payload.status || 'active',
      created_at: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.save();
    return this.findUserById(newUser.id);
  }

  public updateUser(id: number, payload: Partial<User>) {
    const user = this.data.users.find((u) => u.id === id);
    if (!user) throw new Error('User not found');
    if (payload.name !== undefined) user.name = payload.name.trim();
    if (payload.email !== undefined) user.email = payload.email.trim();
    if (payload.role !== undefined) user.role = payload.role;
    if (payload.status !== undefined) user.status = payload.status;
    if (payload.username !== undefined) user.username = payload.username.trim();
    if (payload.password) {
      user.password = bcrypt.hashSync(payload.password, 10);
    }
    this.save();
    return this.findUserById(id);
  }

  public deleteUser(id: number) {
    if (id === 1) throw new Error('Cannot delete main system administrator.');
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('User not found');
    this.data.users.splice(idx, 1);
    this.save();
    return true;
  }

  // === Categories ===
  public getCategories() {
    return this.data.categories.map((c) => {
      const product_count = this.data.products.filter((p) => p.category_id === c.id).length;
      return { ...c, product_count };
    });
  }

  public getCategoryById(id: number) {
    return this.data.categories.find((c) => c.id === id) || null;
  }

  public createCategory(name: string, description: string = '') {
    const existing = this.data.categories.find(
      (c) => c.name.toLowerCase() === name.toLowerCase().trim()
    );
    if (existing) {
      throw new Error(`Category "${name}" already exists`);
    }
    this.data.sequence.category += 1;
    const newCat: Category = {
      id: this.data.sequence.category,
      name: name.trim(),
      description: description.trim(),
      created_at: new Date().toISOString(),
    };
    this.data.categories.push(newCat);
    this.save();
    return newCat;
  }

  public updateCategory(id: number, name: string, description: string = '') {
    const cat = this.data.categories.find((c) => c.id === id);
    if (!cat) throw new Error('Category not found');
    const existing = this.data.categories.find(
      (c) => c.id !== id && c.name.toLowerCase() === name.toLowerCase().trim()
    );
    if (existing) throw new Error(`Category "${name}" already exists`);

    cat.name = name.trim();
    cat.description = description.trim();
    this.save();
    return cat;
  }

  public deleteCategory(id: number) {
    const hasProducts = this.data.products.some((p) => p.category_id === id);
    if (hasProducts) {
      throw new Error('Cannot delete category: It contains existing products.');
    }
    const idx = this.data.categories.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Category not found');
    this.data.categories.splice(idx, 1);
    this.save();
    return true;
  }

  // === Products ===
  public getProducts(filter?: { category_id?: number; search?: string; status?: string }) {
    let list = this.data.products.map((p) => {
      const category = this.data.categories.find((c) => c.id === p.category_id);
      return {
        ...p,
        category_name: category ? category.name : 'Writing Items',
        stock_status: this.computeStockStatus(p.quantity),
      };
    });

    if (filter?.category_id) {
      list = list.filter((p) => p.category_id === Number(filter.category_id));
    }

    if (filter?.status) {
      list = list.filter((p) => p.stock_status?.toLowerCase() === filter.status?.toLowerCase());
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          (p.category_name && p.category_name.toLowerCase().includes(q))
      );
    }

    return list;
  }

  public getProductById(id: number) {
    const p = this.data.products.find((prod) => prod.id === id);
    if (!p) return null;
    const category = this.data.categories.find((c) => c.id === p.category_id);
    return {
      ...p,
      category_name: category ? category.name : 'Writing Items',
      stock_status: this.computeStockStatus(p.quantity),
    };
  }

  public createProduct(payload: {
    name: string;
    category_id?: number;
    brand?: string;
    price?: number;
    selling_price?: number;
    purchase_price?: number;
    quantity?: number;
    unit?: string;
    description?: string;
    sku?: string;
  }) {
    if (!payload.name || !payload.name.trim()) throw new Error('Product name is required');
    const sellingPrice = payload.price !== undefined ? Number(payload.price) : Number(payload.selling_price) || 0;
    const purchasePrice = payload.purchase_price !== undefined ? Number(payload.purchase_price) : Math.round(sellingPrice * 0.65);
    const quantity = payload.quantity !== undefined ? Math.max(0, Number(payload.quantity)) : 10;

    this.data.sequence.product += 1;
    const newId = this.data.sequence.product;
    // Auto-generate Product ID: P001, P002, P003...
    const autoSku = payload.sku?.trim() || `P${String(newId).padStart(3, '0')}`;

    const newProduct: Product = {
      id: newId,
      name: payload.name.trim(),
      category_id: Number(payload.category_id) || (this.data.categories[0]?.id || 1),
      brand: payload.brand?.trim() || 'General',
      description: payload.description?.trim() || `${payload.brand || ''} ${payload.name}`.trim(),
      sku: autoSku,
      purchase_price: Math.max(0, purchasePrice),
      selling_price: Math.max(0, sellingPrice),
      quantity,
      minimum_stock: 10,
      unit: payload.unit?.trim() || 'Pieces',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.data.products.push(newProduct);
    this.save();
    return this.getProductById(newProduct.id);
  }

  public updateProduct(id: number, payload: Partial<Product> & { price?: number }) {
    const p = this.data.products.find((prod) => prod.id === id);
    if (!p) throw new Error('Product not found');

    if (payload.name !== undefined) p.name = payload.name.trim();
    if (payload.category_id !== undefined) p.category_id = Number(payload.category_id);
    if (payload.brand !== undefined) p.brand = payload.brand.trim();
    if (payload.description !== undefined) p.description = payload.description.trim();
    if (payload.price !== undefined) {
      p.selling_price = Math.max(0, Number(payload.price));
    } else if (payload.selling_price !== undefined) {
      p.selling_price = Math.max(0, Number(payload.selling_price));
    }
    if (payload.purchase_price !== undefined) p.purchase_price = Math.max(0, Number(payload.purchase_price));
    if (payload.quantity !== undefined) p.quantity = Math.max(0, Number(payload.quantity));
    if (payload.unit !== undefined) p.unit = payload.unit.trim();
    p.updated_at = new Date().toISOString();

    this.save();
    return this.getProductById(id);
  }

  public deleteProduct(id: number) {
    const idx = this.data.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Product not found');
    this.data.products.splice(idx, 1);
    this.save();
    return true;
  }

  public updateProductStock(id: number, addedQuantity: number, reason: string = '') {
    const p = this.data.products.find((prod) => prod.id === id);
    if (!p) throw new Error('Product not found');
    const newQty = p.quantity + Number(addedQuantity);
    if (newQty < 0) throw new Error('Cannot reduce stock below 0');
    p.quantity = newQty;
    p.updated_at = new Date().toISOString();
    this.save();
    return this.getProductById(id);
  }

  // === Customers ===
  public getCustomers(search?: string) {
    let list = this.data.customers.map((c) => {
      const customerSales = this.data.sales.filter((s) => s.customer_id === c.id);
      const total_orders = customerSales.length;
      const total_spent = customerSales.reduce((acc, curr) => acc + curr.total_amount, 0);
      return { ...c, total_orders, total_spent };
    });

    if (search) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      );
    }
    return list;
  }

  public getCustomerById(id: number) {
    const c = this.data.customers.find((cust) => cust.id === id);
    if (!c) return null;
    const customerSales = this.data.sales.filter((s) => s.customer_id === c.id);
    const total_orders = customerSales.length;
    const total_spent = customerSales.reduce((acc, curr) => acc + curr.total_amount, 0);
    return { ...c, total_orders, total_spent };
  }

  public createCustomer(payload: { name: string; phone?: string; email?: string; address?: string }) {
    if (!payload.name || !payload.name.trim()) throw new Error('Customer name is required');
    this.data.sequence.customer += 1;
    const newCustomer: Customer = {
      id: this.data.sequence.customer,
      name: payload.name.trim(),
      phone: payload.phone?.trim() || '',
      email: payload.email?.trim() || '',
      address: payload.address?.trim() || '',
      created_at: new Date().toISOString(),
    };
    this.data.customers.push(newCustomer);
    this.save();
    return newCustomer;
  }

  public updateCustomer(id: number, payload: Partial<Customer>) {
    const customer = this.data.customers.find((c) => c.id === id);
    if (!customer) throw new Error('Customer not found');
    if (payload.name !== undefined) customer.name = payload.name.trim();
    if (payload.phone !== undefined) customer.phone = payload.phone.trim();
    if (payload.email !== undefined) customer.email = payload.email.trim();
    if (payload.address !== undefined) customer.address = payload.address.trim();
    this.save();
    return this.getCustomerById(id);
  }

  public deleteCustomer(id: number) {
    const idx = this.data.customers.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Customer not found');
    this.data.customers.splice(idx, 1);
    this.save();
    return true;
  }

  // === Suppliers ===
  public getSuppliers(search?: string) {
    let list = this.data.suppliers.map((s) => {
      const purchases = this.data.purchases.filter((p) => p.supplier_id === s.id);
      return { ...s, total_purchases: purchases.length };
    });

    if (search) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.contact_person.toLowerCase().includes(q) ||
          s.phone.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }
    return list;
  }

  public getSupplierById(id: number) {
    return this.data.suppliers.find((s) => s.id === id) || null;
  }

  public createSupplier(payload: { name: string; contact_person?: string; phone?: string; email?: string; address?: string }) {
    if (!payload.name || !payload.name.trim()) throw new Error('Supplier name is required');
    this.data.sequence.supplier += 1;
    const newSupplier: Supplier = {
      id: this.data.sequence.supplier,
      name: payload.name.trim(),
      contact_person: payload.contact_person?.trim() || '',
      phone: payload.phone?.trim() || '',
      email: payload.email?.trim() || '',
      address: payload.address?.trim() || '',
      created_at: new Date().toISOString(),
    };
    this.data.suppliers.push(newSupplier);
    this.save();
    return newSupplier;
  }

  public updateSupplier(id: number, payload: Partial<Supplier>) {
    const supplier = this.data.suppliers.find((s) => s.id === id);
    if (!supplier) throw new Error('Supplier not found');
    if (payload.name !== undefined) supplier.name = payload.name.trim();
    if (payload.contact_person !== undefined) supplier.contact_person = payload.contact_person.trim();
    if (payload.phone !== undefined) supplier.phone = payload.phone.trim();
    if (payload.email !== undefined) supplier.email = payload.email.trim();
    if (payload.address !== undefined) supplier.address = payload.address.trim();
    this.save();
    return this.getSupplierById(id);
  }

  public deleteSupplier(id: number) {
    const idx = this.data.suppliers.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Supplier not found');
    this.data.suppliers.splice(idx, 1);
    this.save();
    return true;
  }

  // === Sales & Billing ===
  public getSales(filter?: { search?: string; startDate?: string; endDate?: string; customer_id?: number }) {
    let list = this.data.sales.map((s) => {
      const customer = this.data.customers.find((c) => c.id === s.customer_id);
      const user = this.data.users.find((u) => u.id === s.user_id);
      const rawItems = this.data.sale_items.filter((si) => si.sale_id === s.id);
      const items: SaleItem[] = rawItems.map((item) => {
        const product = this.data.products.find((p) => p.id === item.product_id);
        return {
          ...item,
          product_name: product ? product.name : 'Stationery Item',
          sku: product ? product.sku : '',
          unit: product ? product.unit : 'Pieces',
        };
      });

      return {
        ...s,
        customer_name: customer ? customer.name : 'Walk-in Customer',
        customer_phone: customer ? customer.phone : '',
        user_name: user ? user.name : 'Store Staff',
        items,
      };
    });

    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (filter?.customer_id) {
      list = list.filter((s) => s.customer_id === Number(filter.customer_id));
    }

    if (filter?.startDate) {
      const start = new Date(filter.startDate).getTime();
      list = list.filter((s) => new Date(s.created_at).getTime() >= start);
    }

    if (filter?.endDate) {
      const end = new Date(filter.endDate).getTime() + 86400000;
      list = list.filter((s) => new Date(s.created_at).getTime() <= end);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.invoice_number.toLowerCase().includes(q) ||
          (s.customer_name && s.customer_name.toLowerCase().includes(q)) ||
          s.payment_method.toLowerCase().includes(q)
      );
    }

    return list;
  }

  public getSaleById(id: number) {
    const sale = this.data.sales.find((s) => s.id === id);
    if (!sale) return null;
    const customer = this.data.customers.find((c) => c.id === sale.customer_id);
    const user = this.data.users.find((u) => u.id === sale.user_id);
    const rawItems = this.data.sale_items.filter((si) => si.sale_id === sale.id);

    const items: SaleItem[] = rawItems.map((item) => {
      const product = this.data.products.find((p) => p.id === item.product_id);
      return {
        ...item,
        product_name: product ? product.name : 'Stationery Item',
        sku: product ? product.sku : '',
        unit: product ? product.unit : 'Pieces',
      };
    });

    return {
      ...sale,
      customer_name: customer ? customer.name : 'Walk-in Customer',
      customer_phone: customer ? customer.phone : '',
      customer_email: customer ? customer.email : '',
      customer_address: customer ? customer.address : '',
      user_name: user ? user.name : 'Staff',
      items,
    };
  }

  public createSale(payload: {
    customer_id?: number;
    user_id?: number;
    items: { product_id: number; quantity: number; price?: number }[];
    discount?: number;
    tax?: number;
    payment_method?: 'Cash' | 'UPI' | 'Card' | 'Other';
  }) {
    if (!payload.items || payload.items.length === 0) {
      throw new Error('Cart cannot be empty. Please add products to complete the sale.');
    }

    // Validate stock for all items
    for (const item of payload.items) {
      const product = this.data.products.find((p) => p.id === item.product_id);
      if (!product) {
        throw new Error(`Product not found in inventory.`);
      }
      if (item.quantity <= 0) {
        throw new Error(`Quantity for "${product.name}" must be greater than 0.`);
      }
      if (product.quantity < item.quantity) {
        throw new Error(
          `Insufficient stock for "${product.name}". Available: ${product.quantity}, Requested: ${item.quantity}`
        );
      }
    }

    let subtotal = 0;
    const preparedItems: { product_id: number; quantity: number; price: number; subtotal: number }[] = [];

    for (const item of payload.items) {
      const product = this.data.products.find((p) => p.id === item.product_id)!;
      const price = item.price !== undefined && item.price >= 0 ? Number(item.price) : product.selling_price;
      const lineSubtotal = Number((price * item.quantity).toFixed(2));
      subtotal += lineSubtotal;
      preparedItems.push({
        product_id: product.id,
        quantity: item.quantity,
        price,
        subtotal: lineSubtotal,
      });
    }

    const discount = Math.max(0, Number(payload.discount) || 0);
    const tax = Math.max(0, Number(payload.tax) || 0);
    const total_amount = Math.max(0, Number((subtotal - discount + tax).toFixed(2)));

    this.data.sequence.sale += 1;
    const saleId = this.data.sequence.sale;
    const year = new Date().getFullYear();
    const invoice_number = `INV-${year}-${String(saleId).padStart(4, '0')}`;

    const newSale: Sale = {
      id: saleId,
      invoice_number,
      customer_id: Number(payload.customer_id) || (this.data.customers[0]?.id || 1),
      user_id: Number(payload.user_id) || 1,
      subtotal: Number(subtotal.toFixed(2)),
      discount,
      tax,
      total_amount,
      payment_method: payload.payment_method || 'Cash',
      created_at: new Date().toISOString(),
    };

    // Save sale
    this.data.sales.push(newSale);

    // Save items & reduce product quantity automatically
    for (const item of preparedItems) {
      this.data.sequence.sale_item += 1;
      const saleItem: SaleItem = {
        id: this.data.sequence.sale_item,
        sale_id: saleId,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
      };
      this.data.sale_items.push(saleItem);

      // Decrement product stock
      const product = this.data.products.find((p) => p.id === item.product_id);
      if (product) {
        product.quantity = Math.max(0, product.quantity - item.quantity);
        product.updated_at = new Date().toISOString();
      }
    }

    this.save();
    return this.getSaleById(saleId);
  }

  // === Dashboard Metrics ===
  // Total Products, Total Stock, Low Stock, Out of Stock, Today's Sales
  public getDashboardMetrics(): DashboardMetrics {
    const total_products = this.data.products.length;
    const total_stock = this.data.products.reduce((acc, p) => acc + p.quantity, 0);

    const lowStockProducts = this.data.products
      .filter((p) => p.quantity > 0 && p.quantity <= 10)
      .map((p) => ({
        ...p,
        category_name: this.data.categories.find((c) => c.id === p.category_id)?.name || 'Writing Items',
        stock_status: 'Low Stock' as StockStatus,
      }));

    const outOfStockProducts = this.data.products
      .filter((p) => p.quantity <= 0)
      .map((p) => ({
        ...p,
        category_name: this.data.categories.find((c) => c.id === p.category_id)?.name || 'Writing Items',
        stock_status: 'Out of Stock' as StockStatus,
      }));

    const low_stock_count = lowStockProducts.length;
    const out_of_stock_count = outOfStockProducts.length;

    const todayStr = new Date().toISOString().split('T')[0];
    const todaySalesList = this.data.sales.filter((s) => s.created_at.startsWith(todayStr));
    const today_sales = todaySalesList.reduce((acc, curr) => acc + curr.total_amount, 0);
    const today_sales_count = todaySalesList.length;

    const total_sales = this.data.sales.reduce((acc, curr) => acc + curr.total_amount, 0);
    const total_sales_count = this.data.sales.length;

    // Recent 5 sales
    const recent_sales = this.getSales().slice(0, 5);

    return {
      total_products,
      total_stock,
      low_stock_count,
      out_of_stock_count,
      today_sales,
      today_sales_count,
      total_sales,
      total_sales_count,
      recent_sales,
      low_stock_products: [...outOfStockProducts, ...lowStockProducts],
    };
  }

  // === Purchases & Restock ===
  public getPurchases(search?: string) {
    let list = this.data.purchases.map((p) => {
      const supplier = this.data.suppliers.find((s) => s.id === p.supplier_id);
      const rawItems = this.data.purchase_items.filter((pi) => pi.purchase_id === p.id);
      const items: PurchaseItem[] = rawItems.map((item) => {
        const product = this.data.products.find((prod) => prod.id === item.product_id);
        return {
          ...item,
          product_name: product ? product.name : 'Stationery Item',
          sku: product ? product.sku : '',
        };
      });
      return {
        ...p,
        supplier_name: supplier ? supplier.name : 'Unknown Supplier',
        supplier_phone: supplier ? supplier.phone : '',
        items,
      };
    });

    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (search) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          (p.supplier_name && p.supplier_name.toLowerCase().includes(q)) ||
          p.items.some((item) => item.product_name?.toLowerCase().includes(q))
      );
    }
    return list;
  }

  public getPurchaseById(id: number) {
    const purchase = this.data.purchases.find((p) => p.id === id);
    if (!purchase) return null;
    const supplier = this.data.suppliers.find((s) => s.id === purchase.supplier_id);
    const rawItems = this.data.purchase_items.filter((pi) => pi.purchase_id === purchase.id);
    const items: PurchaseItem[] = rawItems.map((item) => {
      const product = this.data.products.find((prod) => prod.id === item.product_id);
      return {
        ...item,
        product_name: product ? product.name : 'Stationery Item',
        sku: product ? product.sku : '',
      };
    });
    return {
      ...purchase,
      supplier_name: supplier ? supplier.name : 'Unknown Supplier',
      supplier_phone: supplier ? supplier.phone : '',
      supplier_email: supplier ? supplier.email : '',
      supplier_address: supplier ? supplier.address : '',
      items,
    };
  }

  public createPurchase(payload: {
    supplier_id: number;
    purchase_date?: string;
    items: { product_id: number; quantity: number; purchase_price: number }[];
  }) {
    if (!payload.items || payload.items.length === 0) {
      throw new Error('Purchase must include at least one product item.');
    }
    if (!payload.supplier_id) {
      throw new Error('Supplier must be selected for purchase recording.');
    }

    let total_amount = 0;
    for (const item of payload.items) {
      if (item.quantity <= 0) throw new Error('Quantity must be greater than 0');
      if (item.purchase_price < 0) throw new Error('Purchase price cannot be negative');
      total_amount += item.quantity * item.purchase_price;
    }

    this.data.sequence.purchase += 1;
    const purchaseId = this.data.sequence.purchase;

    const newPurchase: Purchase = {
      id: purchaseId,
      supplier_id: Number(payload.supplier_id),
      total_amount,
      purchase_date: payload.purchase_date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    };

    this.data.purchases.push(newPurchase);

    for (const item of payload.items) {
      this.data.sequence.purchase_item += 1;
      const pItem: PurchaseItem = {
        id: this.data.sequence.purchase_item,
        purchase_id: purchaseId,
        product_id: item.product_id,
        quantity: item.quantity,
        purchase_price: item.purchase_price,
        subtotal: item.quantity * item.purchase_price,
      };
      this.data.purchase_items.push(pItem);

      const product = this.data.products.find((prod) => prod.id === item.product_id);
      if (product) {
        product.quantity += item.quantity;
        product.purchase_price = item.purchase_price;
        product.updated_at = new Date().toISOString();
      }
    }

    this.save();
    return this.getPurchaseById(purchaseId);
  }

  // === Summary Reports for Analytics ===
  public getSummaryReport(startDate?: string, endDate?: string) {
    let sales = this.data.sales;
    let purchases = this.data.purchases;

    if (startDate) {
      const start = new Date(startDate).getTime();
      sales = sales.filter((s) => new Date(s.created_at).getTime() >= start);
      purchases = purchases.filter((p) => new Date(p.created_at).getTime() >= start);
    }
    if (endDate) {
      const end = new Date(endDate).getTime() + 86400000;
      sales = sales.filter((s) => new Date(s.created_at).getTime() <= end);
      purchases = purchases.filter((p) => new Date(p.created_at).getTime() <= end);
    }

    const total_sales = sales.reduce((acc, s) => acc + s.total_amount, 0);
    const total_purchases = purchases.reduce((acc, p) => acc + p.total_amount, 0);
    const gross_profit = Math.max(0, total_sales - total_purchases);

    const total_inventory_items = this.data.products.reduce((acc, p) => acc + p.quantity, 0);
    const total_inventory_cost_value = this.data.products.reduce(
      (acc, p) => acc + p.quantity * p.purchase_price,
      0
    );
    const total_inventory_retail_value = this.data.products.reduce(
      (acc, p) => acc + p.quantity * p.selling_price,
      0
    );

    const low_stock_list = this.data.products
      .filter((p) => p.quantity <= 10)
      .map((p) => ({
        ...p,
        stock_status: this.computeStockStatus(p.quantity),
      }));

    return {
      total_sales,
      total_purchases,
      gross_profit,
      total_inventory_items,
      total_inventory_cost_value,
      total_inventory_retail_value,
      top_selling_products: [],
      low_stock_list,
    };
  }

  public getSalesReport(period: string = 'today', startDate?: string, endDate?: string) {
    let sales = this.getSales();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    if (period === 'today') {
      sales = sales.filter((s) => new Date(s.created_at).getTime() >= todayStart);
    } else if (period === 'week') {
      const weekStart = todayStart - 7 * 86400000;
      sales = sales.filter((s) => new Date(s.created_at).getTime() >= weekStart);
    } else if (period === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      sales = sales.filter((s) => new Date(s.created_at).getTime() >= monthStart);
    } else if (period === 'custom' && startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime() + 86400000;
      sales = sales.filter((s) => {
        const time = new Date(s.created_at).getTime();
        return time >= start && time <= end;
      });
    }

    const total_revenue = sales.reduce((acc, curr) => acc + curr.total_amount, 0);
    const total_discount = sales.reduce((acc, curr) => acc + curr.discount, 0);
    const total_tax = sales.reduce((acc, curr) => acc + curr.tax, 0);
    const total_subtotal = sales.reduce((acc, curr) => acc + curr.subtotal, 0);
    const total_invoices = sales.length;

    return {
      period,
      summary: {
        total_revenue,
        total_discount,
        total_tax,
        total_subtotal,
        total_invoices,
        avg_order_value: total_invoices > 0 ? total_revenue / total_invoices : 0,
      },
      sales,
    };
  }

  public getInventoryReport() {
    const products = this.data.products.map((p) => {
      const category = this.data.categories.find((c) => c.id === p.category_id);
      const stock_value_cost = p.quantity * p.purchase_price;
      const stock_value_retail = p.quantity * p.selling_price;
      const potential_profit = stock_value_retail - stock_value_cost;
      return {
        ...p,
        category_name: category ? category.name : 'Unknown',
        stock_status: this.computeStockStatus(p.quantity),
        stock_value_cost,
        stock_value_retail,
        potential_profit,
      };
    });

    const total_items_count = products.reduce((acc, p) => acc + p.quantity, 0);
    const total_inventory_cost = products.reduce((acc, p) => acc + p.stock_value_cost, 0);
    const total_inventory_retail = products.reduce((acc, p) => acc + p.stock_value_retail, 0);
    const total_potential_profit = total_inventory_retail - total_inventory_cost;

    return {
      summary: {
        total_products: products.length,
        total_items_count,
        total_inventory_cost,
        total_inventory_retail,
        total_potential_profit,
      },
      products,
    };
  }

  public getLowStockReport() {
    const lowStock = this.data.products
      .filter((p) => p.quantity <= 10)
      .map((p) => ({
        ...p,
        category_name: this.data.categories.find((c) => c.id === p.category_id)?.name || 'Unknown',
        stock_status: this.computeStockStatus(p.quantity),
        suggested_reorder: Math.max(10, 30 - p.quantity),
      }));

    return {
      count: lowStock.length,
      products: lowStock,
    };
  }

  public getBestSellingReport() {
    const productStats: { [productId: number]: { quantity_sold: number; total_revenue: number } } = {};

    for (const item of this.data.sale_items) {
      if (!productStats[item.product_id]) {
        productStats[item.product_id] = { quantity_sold: 0, total_revenue: 0 };
      }
      productStats[item.product_id].quantity_sold += item.quantity;
      productStats[item.product_id].total_revenue += item.subtotal;
    }

    const report = Object.keys(productStats)
      .map((idStr) => {
        const id = Number(idStr);
        const product = this.data.products.find((p) => p.id === id);
        const category = product ? this.data.categories.find((c) => c.id === product.category_id) : null;
        return {
          product_id: id,
          product_name: product ? product.name : 'Stationery Item',
          sku: product ? product.sku : '',
          category_name: category ? category.name : '',
          selling_price: product ? product.selling_price : 0,
          current_stock: product ? product.quantity : 0,
          quantity_sold: productStats[id].quantity_sold,
          total_revenue: productStats[id].total_revenue,
        };
      })
      .sort((a, b) => b.quantity_sold - a.quantity_sold);

    return report;
  }
}

export const db = new StoreDatabase();
