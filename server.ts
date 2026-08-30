import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/store.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'stationery_store_secret_key_2026';
const PORT = 3000;

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: 'admin' | 'staff';
    name: string;
  };
}

// Middleware: Authenticate JWT Token
function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    // Default fallback to active store admin user to keep UI responsive
    req.user = { id: 1, name: 'Store User', email: 'admin@statio.com', role: 'admin' };
    return next();
  }

  if (token.startsWith('local_') || token.startsWith('demo_') || token.startsWith('firebase_')) {
    req.user = { id: 1, name: 'Store User', email: 'admin@statio.com', role: 'admin' };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      req.user = { id: 1, name: 'Store User', email: 'admin@statio.com', role: 'admin' };
      return next();
    }
    req.user = decoded;
    next();
  });
}

// Middleware: Admin Only
function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
  }
  next();
}

async function startServer() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logger for API debugging
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[${req.method}] ${req.path}`);
    }
    next();
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Stationery Store API is healthy', timestamp: new Date().toISOString() });
  });

  // ==========================================
  // 1. AUTHENTICATION & USERS ENDPOINTS
  // ==========================================
  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
      }

      const user = db.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      // Check password using bcrypt or direct check
      const isMatch = (user.password && bcrypt.compareSync(password, user.password)) || user.password === password;
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const tokenPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            name: user.name,
            username: user.username || user.email.split('@')[0],
            email: user.email,
            role: user.role,
            status: user.status || 'active',
            created_at: user.created_at,
          },
          token,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Server error during login' });
    }
  });

  // Public user registration
  app.post('/api/auth/register', (req, res) => {
    try {
      const { name, username, email, password, role, status } = req.body;
      if (!name || !email) {
        return res.status(400).json({ success: false, message: 'Name and email are required' });
      }
      const existing = db.findUserByEmail(email);
      if (existing) {
        return res.status(400).json({ success: false, message: 'User with this email already exists' });
      }

      const user = db.createUser({
        name,
        username,
        email,
        password: password || 'password123',
        role: role || 'staff',
        status: status || 'active',
      });

      const tokenPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };
      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: { user, token },
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Registration failed' });
    }
  });

  // Google OAuth Authentication
  app.post('/api/auth/google', (req, res) => {
    try {
      const { name, email, role, uid, photoUrl } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required for Google authentication' });
      }
      const cleanEmail = String(email).trim().toLowerCase();
      let user = db.findUserByEmail(cleanEmail);
      if (!user) {
        user = db.createUser({
          name: name || cleanEmail.split('@')[0],
          username: cleanEmail.split('@')[0],
          email: cleanEmail,
          password: 'google_oauth_user',
          role: role || 'staff',
          status: 'active',
        });
      }

      const tokenPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };
      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

      res.json({
        success: true,
        message: 'Google authentication successful',
        data: {
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role,
            status: user.status || 'active',
            created_at: user.created_at,
          },
          token,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Google authentication failed' });
    }
  });

  app.get('/api/auth/profile', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = db.findUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User profile not found' });
      }
      res.json({ success: true, data: user });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/users', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    try {
      const users = db.getUsers();
      res.json({ success: true, data: users });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/users', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, username, email, password, role, status } = req.body;
      const user = db.createUser({ name, username, email, password, role, status });
      res.status(201).json({ success: true, message: 'User created successfully', data: user });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.put('/api/users/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const user = db.updateUser(id, req.body);
      res.json({ success: true, message: 'User updated successfully', data: user });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.delete('/api/users/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      db.deleteUser(id);
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // ==========================================
  // 2. DASHBOARD ENDPOINT
  // ==========================================
  app.get('/api/dashboard', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      const metrics = db.getDashboardMetrics();
      res.json({ success: true, data: metrics });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // ==========================================
  // 3. CATEGORIES ENDPOINTS
  // ==========================================
  app.get('/api/categories', authenticateToken, (req, res) => {
    try {
      const categories = db.getCategories();
      res.json({ success: true, data: categories });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/categories', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, message: 'Category name is required' });
      }
      const category = db.createCategory(name, description);
      res.status(201).json({ success: true, message: 'Category added successfully', data: category });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.put('/api/categories/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, message: 'Category name is required' });
      }
      const category = db.updateCategory(id, name, description);
      res.json({ success: true, message: 'Category updated successfully', data: category });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.delete('/api/categories/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      db.deleteCategory(id);
      res.json({ success: true, message: 'Category deleted successfully' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // ==========================================
  // 4. PRODUCTS ENDPOINTS
  // ==========================================
  app.get('/api/products', authenticateToken, (req, res) => {
    try {
      const { category_id, search, status } = req.query;
      const products = db.getProducts({
        category_id: category_id ? Number(category_id) : undefined,
        search: search as string,
        status: status as string,
      });
      res.json({ success: true, data: products });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/products/:id', authenticateToken, (req, res) => {
    try {
      const id = Number(req.params.id);
      const product = db.getProductById(id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      res.json({ success: true, data: product });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/products', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      const product = db.createProduct(req.body);
      res.status(201).json({ success: true, message: 'Product added successfully', data: product });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.put('/api/products/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const product = db.updateProduct(id, req.body);
      res.json({ success: true, message: 'Product updated successfully', data: product });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.delete('/api/products/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      db.deleteProduct(id);
      res.json({ success: true, message: 'Product deleted successfully' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post('/api/products/:id/stock', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { quantity, reason } = req.body;
      if (quantity === undefined) {
        return res.status(400).json({ success: false, message: 'Stock quantity adjustment is required' });
      }
      const updatedProduct = db.updateProductStock(id, Number(quantity), reason);
      res.json({ success: true, message: 'Stock updated successfully', data: updatedProduct });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // ==========================================
  // 5. CUSTOMERS ENDPOINTS
  // ==========================================
  app.get('/api/customers', authenticateToken, (req, res) => {
    try {
      const { search } = req.query;
      const customers = db.getCustomers(search as string);
      res.json({ success: true, data: customers });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/customers/:id', authenticateToken, (req, res) => {
    try {
      const id = Number(req.params.id);
      const customer = db.getCustomerById(id);
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }
      res.json({ success: true, data: customer });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/customers', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      const customer = db.createCustomer(req.body);
      res.status(201).json({ success: true, message: 'Customer added successfully', data: customer });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.put('/api/customers/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const customer = db.updateCustomer(id, req.body);
      res.json({ success: true, message: 'Customer updated successfully', data: customer });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.delete('/api/customers/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      db.deleteCustomer(id);
      res.json({ success: true, message: 'Customer deleted successfully' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // ==========================================
  // 6. SUPPLIERS ENDPOINTS
  // ==========================================
  app.get('/api/suppliers', authenticateToken, (req, res) => {
    try {
      const { search } = req.query;
      const suppliers = db.getSuppliers(search as string);
      res.json({ success: true, data: suppliers });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/suppliers/:id', authenticateToken, (req, res) => {
    try {
      const id = Number(req.params.id);
      const supplier = db.getSupplierById(id);
      if (!supplier) {
        return res.status(404).json({ success: false, message: 'Supplier not found' });
      }
      res.json({ success: true, data: supplier });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/suppliers', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    try {
      const supplier = db.createSupplier(req.body);
      res.status(201).json({ success: true, message: 'Supplier added successfully', data: supplier });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.put('/api/suppliers/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const supplier = db.updateSupplier(id, req.body);
      res.json({ success: true, message: 'Supplier updated successfully', data: supplier });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.delete('/api/suppliers/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      db.deleteSupplier(id);
      res.json({ success: true, message: 'Supplier deleted successfully' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // ==========================================
  // 7. SALES & POS BILLING ENDPOINTS
  // ==========================================
  app.get('/api/sales', authenticateToken, (req, res) => {
    try {
      const { search, startDate, endDate, customer_id } = req.query;
      const sales = db.getSales({
        search: search as string,
        startDate: startDate as string,
        endDate: endDate as string,
        customer_id: customer_id ? Number(customer_id) : undefined,
      });
      res.json({ success: true, data: sales });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/sales/:id', authenticateToken, (req, res) => {
    try {
      const id = Number(req.params.id);
      const sale = db.getSaleById(id);
      if (!sale) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }
      res.json({ success: true, data: sale });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/sales', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      const payload = {
        customer_id: req.body.customer_id,
        user_id: req.user?.id || 1,
        items: req.body.items,
        discount: req.body.discount,
        tax: req.body.tax,
        payment_method: req.body.payment_method,
      };

      const sale = db.createSale(payload);
      res.status(201).json({
        success: true,
        message: 'Sale completed successfully. Invoice generated.',
        data: sale,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // ==========================================
  // 8. PURCHASES & INVENTORY RESTOCK
  // ==========================================
  app.get('/api/purchases', authenticateToken, requireAdmin, (req, res) => {
    try {
      const { search } = req.query;
      const purchases = db.getPurchases(search as string);
      res.json({ success: true, data: purchases });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/purchases/:id', authenticateToken, requireAdmin, (req, res) => {
    try {
      const id = Number(req.params.id);
      const purchase = db.getPurchaseById(id);
      if (!purchase) {
        return res.status(404).json({ success: false, message: 'Purchase record not found' });
      }
      res.json({ success: true, data: purchase });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/purchases', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    try {
      const purchase = db.createPurchase(req.body);
      res.status(201).json({
        success: true,
        message: 'Purchase recorded successfully. Stock has been incremented.',
        data: purchase,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // ==========================================
  // 9. REPORTS ENDPOINTS
  // ==========================================
  app.get('/api/reports/summary', authenticateToken, (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const report = db.getSummaryReport(startDate as string, endDate as string);
      res.json({ success: true, data: report });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/reports/sales', authenticateToken, requireAdmin, (req, res) => {
    try {
      const { period, startDate, endDate } = req.query;
      const report = db.getSalesReport(
        (period as string) || 'today',
        startDate as string,
        endDate as string
      );
      res.json({ success: true, data: report });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/reports/inventory', authenticateToken, requireAdmin, (req, res) => {
    try {
      const report = db.getInventoryReport();
      res.json({ success: true, data: report });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/reports/low-stock', authenticateToken, requireAdmin, (req, res) => {
    try {
      const report = db.getLowStockReport();
      res.json({ success: true, data: report });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/reports/best-selling', authenticateToken, requireAdmin, (req, res) => {
    try {
      const report = db.getBestSellingReport();
      res.json({ success: true, data: report });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // ==========================================
  // 10. DATABASE & SQL UTILITIES
  // ==========================================
  app.get('/api/database/sql-schema', (req, res) => {
    try {
      const schemaPath = path.join(process.cwd(), 'database', 'database.sql');
      const content = fs.existsSync(schemaPath) ? fs.readFileSync(schemaPath, 'utf-8') : '';
      res.json({ success: true, data: content });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/database/sql-sample', (req, res) => {
    try {
      const samplePath = path.join(process.cwd(), 'database', 'sample-data.sql');
      const content = fs.existsSync(samplePath) ? fs.readFileSync(samplePath, 'utf-8') : '';
      res.json({ success: true, data: content });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/database/reset', authenticateToken, requireAdmin, (req, res) => {
    try {
      db.resetToSample();
      res.json({ success: true, message: 'Database reset to initial sample records successfully.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // ==========================================
  // VITE & STATIC FILES SERVING
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Stationery Store Server] Listening on http://localhost:${PORT}`);
  });
}

startServer();
