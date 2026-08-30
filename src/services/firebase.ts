import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { Product, Category, Sale, User as AppUser, UserRole } from '../types.js';

// User's provided Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyBTSQ-568wGhBUE5nzOLBN-2791ZHzaAPY",
  authDomain: "stationarystoremanagement.firebaseapp.com",
  projectId: "stationarystoremanagement",
  storageBucket: "stationarystoremanagement.firebasestorage.app",
  messagingSenderId: "232050741267",
  appId: "1:232050741267:web:9beaaa33d76b2b2bdb2fe6"
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initial Categories Seed
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, name: 'Writing Items', description: 'Pens, Pencils, Markers, Highlighters, Gel Pens', created_at: new Date().toISOString() },
  { id: 2, name: 'Notebooks & Paper', description: 'Registers, Spiral notebooks, Graph pads, A4 Copier Paper', created_at: new Date().toISOString() },
  { id: 3, name: 'Files & Folders', description: 'Box files, Clip files, Ring binders, Expanding folders', created_at: new Date().toISOString() },
  { id: 4, name: 'Office Supplies', description: 'Staplers, Pins, Paper clips, Tape dispensers, Punches', created_at: new Date().toISOString() },
  { id: 5, name: 'Mathematical & Drawing Items', description: 'Geometry boxes, Scales, Compasses, Protractors, Drawing sheets', created_at: new Date().toISOString() },
  { id: 6, name: 'Art & Craft', description: 'Crayons, Water colors, Oil pastels, Sketch pens, Craft sheets', created_at: new Date().toISOString() },
  { id: 7, name: 'School & College Supplies', description: 'Erasers, Sharpeners, Geometry items, Calculators, Pouches', created_at: new Date().toISOString() },
  { id: 8, name: 'Desk Accessories', description: 'Pen stands, Scissors, Glue sticks, Sticky notes, Calculators', created_at: new Date().toISOString() },
  { id: 9, name: 'Printing Supplies', description: 'Printer cartridges, Toner, Thermal rolls, Photo paper', created_at: new Date().toISOString() },
  { id: 10, name: 'Other Items', description: 'Envelopes, Badges, Whiteboards, Dusters, Miscellaneous', created_at: new Date().toISOString() },
];

// Initial Products Seed
export const DEFAULT_PRODUCTS: Omit<Product, 'id'>[] = [
  {
    name: 'Classmate Octane Gel Pen (Blue)',
    category_id: 1,
    category_name: 'Writing Items',
    brand: 'Classmate',
    description: 'Smooth waterproof gel ink pen 0.5mm tip',
    sku: 'P001',
    purchase_price: 6.5,
    selling_price: 10,
    quantity: 120,
    minimum_stock: 20,
    unit: 'Pieces',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    stock_status: 'In Stock',
  },
  {
    name: 'Reynolds 045 Fine Carbure Ball Pen',
    category_id: 1,
    category_name: 'Writing Items',
    brand: 'Reynolds',
    description: 'Classic reliable ballpoint pen (Blue/Black)',
    sku: 'P002',
    purchase_price: 6,
    selling_price: 10,
    quantity: 150,
    minimum_stock: 30,
    unit: 'Pieces',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    stock_status: 'In Stock',
  },
  {
    name: 'Classmate Long Notebook (Ruled, 172 Pgs)',
    category_id: 2,
    category_name: 'Notebooks & Paper',
    brand: 'Classmate',
    description: 'Single line ruled long exercise notebook',
    sku: 'P003',
    purchase_price: 42,
    selling_price: 60,
    quantity: 85,
    minimum_stock: 15,
    unit: 'Pieces',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    stock_status: 'In Stock',
  },
  {
    name: 'JK Copier A4 Paper 75 GSM (500 Sheets Ream)',
    category_id: 2,
    category_name: 'Notebooks & Paper',
    brand: 'JK Copier',
    description: 'High brightness premium photocopy paper ream',
    sku: 'P004',
    purchase_price: 280,
    selling_price: 360,
    quantity: 45,
    minimum_stock: 10,
    unit: 'Pack',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    stock_status: 'In Stock',
  },
  {
    name: 'Camlin Exam Geometry Box',
    category_id: 5,
    category_name: 'Mathematical & Drawing Items',
    brand: 'Camlin',
    description: 'Complete mathematical instruments box set',
    sku: 'P005',
    purchase_price: 95,
    selling_price: 140,
    quantity: 28,
    minimum_stock: 8,
    unit: 'Box',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    stock_status: 'In Stock',
  },
  {
    name: 'DOMS Plastic Crayons (24 Shades Set)',
    category_id: 6,
    category_name: 'Art & Craft',
    brand: 'DOMS',
    description: 'Non-toxic, smooth vibrant coloring crayons',
    sku: 'P006',
    purchase_price: 65,
    selling_price: 100,
    quantity: 35,
    minimum_stock: 10,
    unit: 'Pack',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    stock_status: 'In Stock',
  },
  {
    name: 'Kangaro Stapler HD-10D with Staples',
    category_id: 4,
    category_name: 'Office Supplies',
    brand: 'Kangaro',
    description: 'Durable metal desk stapler with quick loading',
    sku: 'P007',
    purchase_price: 55,
    selling_price: 85,
    quantity: 20,
    minimum_stock: 5,
    unit: 'Pieces',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    stock_status: 'In Stock',
  },
  {
    name: 'Fevicol MR Squeezy Glue (50g)',
    category_id: 8,
    category_name: 'Desk Accessories',
    brand: 'Pidilite',
    description: 'Synthetic craft adhesive glue bottle',
    sku: 'P008',
    purchase_price: 15,
    selling_price: 25,
    quantity: 4,
    minimum_stock: 10,
    unit: 'Pieces',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    stock_status: 'Low Stock',
  },
  {
    name: 'Casio Scientific Calculator FX-991CW',
    category_id: 7,
    category_name: 'School & College Supplies',
    brand: 'Casio',
    description: 'Non-programmable scientific calculator 540+ functions',
    sku: 'P009',
    purchase_price: 1100,
    selling_price: 1450,
    quantity: 0,
    minimum_stock: 5,
    unit: 'Pieces',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    stock_status: 'Out of Stock',
  },
  {
    name: 'Solo Expanding File Folder (12 Pockets)',
    category_id: 3,
    category_name: 'Files & Folders',
    brand: 'Solo',
    description: 'Document organiser folder with indexing tabs',
    sku: 'P010',
    purchase_price: 160,
    selling_price: 240,
    quantity: 18,
    minimum_stock: 5,
    unit: 'Pieces',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    stock_status: 'In Stock',
  }
];

// Helper: Seed Firestore on first load if empty
let isSeeding = false;
export async function seedFirestoreIfEmpty() {
  if (isSeeding) return;
  try {
    isSeeding = true;
    const prodsSnap = await getDocs(collection(db, 'products'));
    if (prodsSnap.empty) {
      const batch = writeBatch(db);

      // Seed categories
      for (const cat of DEFAULT_CATEGORIES) {
        const catRef = doc(db, 'categories', String(cat.id));
        batch.set(catRef, cat);
      }

      // Seed products
      let pIdx = 1;
      for (const p of DEFAULT_PRODUCTS) {
        const pRef = doc(db, 'products', String(pIdx));
        batch.set(pRef, {
          ...p,
          id: pIdx,
        });
        pIdx++;
      }

      await batch.commit();
    }
  } catch (err) {
    // Firestore seeding is non-blocking
  } finally {
    isSeeding = false;
  }
}

// === AUTHENTICATION SERVICES (ADMIN & STAFF SEPARATELY) ===

export async function firebaseSignUp(
  name: string,
  email: string,
  pass: string,
  role: UserRole
): Promise<AppUser> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const fbUser = userCredential.user;

  await updateProfile(fbUser, {
    displayName: `${name} (${role.toUpperCase()})`,
  });

  const appUser: AppUser = {
    id: Date.now(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role: role,
    status: 'active',
    created_at: new Date().toISOString(),
  };

  // Store user role profile in Firestore `users` collection
  try {
    await setDoc(doc(db, 'users', fbUser.uid), {
      ...appUser,
      firebase_uid: fbUser.uid,
    });
  } catch (e) {
    console.warn('Note saving user document to Firestore:', e);
  }

  // Save session in local storage for fast resume
  localStorage.setItem('statio_firebase_user', JSON.stringify(appUser));
  return appUser;
}

export async function firebaseSignIn(
  email: string,
  pass: string,
  expectedRole?: UserRole
): Promise<AppUser> {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  const fbUser = userCredential.user;

  // Retrieve user role from Firestore profile
  let appUser: AppUser | null = null;
  try {
    const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      appUser = {
        id: data.id || Date.now(),
        name: data.name || fbUser.displayName || 'Store User',
        email: data.email || fbUser.email || email,
        role: data.role || 'staff',
        status: data.status || 'active',
        created_at: data.created_at || new Date().toISOString(),
      };
    }
  } catch (e) {
    console.warn('Could not read user profile from Firestore:', e);
  }

  if (!appUser) {
    // Determine from display name or fallback
    const roleFromProfile: UserRole =
      fbUser.displayName?.toLowerCase().includes('admin') || email.includes('admin')
        ? 'admin'
        : 'staff';
    appUser = {
      id: Date.now(),
      name: fbUser.displayName || (roleFromProfile === 'admin' ? 'Store Administrator' : 'Sales Staff'),
      email: fbUser.email || email,
      role: roleFromProfile,
      status: 'active',
      created_at: new Date().toISOString(),
    };
  }

  // If user explicitly signed in through a specific portal (e.g. Admin Tab vs Staff Tab)
  if (expectedRole && appUser.role !== expectedRole) {
    throw new Error(
      `Access restricted. This account has '${appUser.role}' permissions and cannot sign in via the ${expectedRole.toUpperCase()} portal.`
    );
  }

  localStorage.setItem('statio_firebase_user', JSON.stringify(appUser));
  return appUser;
}

export async function saveFirestoreUser(user: AppUser, uid?: string): Promise<AppUser> {
  const docId = uid || (user.id ? String(user.id) : user.email.replace(/[^a-zA-Z0-9]/g, '_'));
  try {
    await setDoc(doc(db, 'users', docId), {
      ...user,
      id: user.id || Date.now(),
      firebase_uid: uid || docId,
      updated_at: new Date().toISOString(),
    }, { merge: true });
  } catch (e) {
    console.warn('Note saving user profile in Firestore:', e);
  }
  localStorage.setItem('statio_firebase_user', JSON.stringify(user));
  return user;
}

export async function firebaseSignInWithGoogle(expectedRole?: UserRole): Promise<{ user: AppUser; isNewUser: boolean }> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  const fbUser = result.user;

  let isNewUser = false;
  let appUser: AppUser | null = null;

  // Retrieve user role from Firestore profile
  try {
    const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      appUser = {
        id: data.id || Date.now(),
        name: data.name || fbUser.displayName || 'Google User',
        email: data.email || fbUser.email || '',
        role: data.role || expectedRole || 'staff',
        status: data.status || 'active',
        created_at: data.created_at || new Date().toISOString(),
      };
    } else {
      isNewUser = true;
    }
  } catch (e) {
    console.warn('Could not read user profile from Firestore:', e);
    isNewUser = true;
  }

  if (!appUser) {
    const targetRole: UserRole = expectedRole || 'staff';
    appUser = {
      id: Date.now(),
      name: fbUser.displayName || 'Google User',
      email: fbUser.email || '',
      role: targetRole,
      status: 'active',
      created_at: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'users', fbUser.uid), {
        ...appUser,
        firebase_uid: fbUser.uid,
        photo_url: fbUser.photoURL || '',
        auth_provider: 'google.com',
      });
    } catch (e) {
      console.warn('Note saving new google user to Firestore:', e);
    }
  }

  localStorage.setItem('statio_firebase_user', JSON.stringify(appUser));
  return { user: appUser, isNewUser };
}

export async function firebaseSignOut(): Promise<void> {
  await signOut(auth);
  localStorage.removeItem('statio_firebase_user');
}

export function getSavedFirebaseUser(): AppUser | null {
  try {
    const raw = localStorage.getItem('statio_firebase_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// === FIRESTORE DATA SERVICES ===

// Get All Products from Firestore
export async function getFirestoreProducts(): Promise<Product[]> {
  try {
    const snap = await getDocs(collection(db, 'products'));
    if (snap.empty) {
      await seedFirestoreIfEmpty();
      const secondSnap = await getDocs(collection(db, 'products'));
      if (secondSnap.empty) return [];
      return secondSnap.docs.map((d) => ({ ...d.data(), id: Number(d.id) || d.data().id } as Product));
    }
    return snap.docs.map((d) => {
      const data = d.data();
      const pId = Number(d.id) || data.id || 1;
      const qty = Number(data.quantity) || 0;
      let stock_status: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
      if (qty <= 0) stock_status = 'Out of Stock';
      else if (qty <= 10) stock_status = 'Low Stock';

      return {
        ...data,
        id: pId,
        selling_price: Number(data.selling_price) || 0,
        purchase_price: Number(data.purchase_price) || 0,
        quantity: qty,
        stock_status,
      } as Product;
    });
  } catch (err) {
    // Return empty array so caller gracefully uses backend SQLite/API
    return [];
  }
}

// Add New Product to Firestore
export async function addFirestoreProduct(productData: Partial<Product>): Promise<Product> {
  try {
    const prods = await getFirestoreProducts();
    const nextId = prods.length > 0 ? Math.max(...prods.map((p) => Number(p.id) || 0)) + 1 : 1;
    const sku = productData.sku || `P${String(nextId).padStart(3, '0')}`;

    const newProd: Product = {
      id: nextId,
      name: productData.name?.trim() || 'New Item',
      category_id: Number(productData.category_id) || 1,
      category_name: productData.category_name || 'Stationery',
      brand: productData.brand?.trim() || 'General',
      description: productData.description?.trim() || '',
      sku,
      purchase_price: Number(productData.purchase_price) || Math.round(Number(productData.selling_price || 10) * 0.65),
      selling_price: Number(productData.selling_price) || 10,
      quantity: Number(productData.quantity) || 0,
      minimum_stock: Number(productData.minimum_stock) || 5,
      unit: productData.unit || 'Pieces',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      stock_status:
        Number(productData.quantity) <= 0
          ? 'Out of Stock'
          : Number(productData.quantity) <= 10
          ? 'Low Stock'
          : 'In Stock',
    };

    await setDoc(doc(db, 'products', String(nextId)), newProd);
    return newProd;
  } catch (err) {
    console.error('Error adding product to Firestore:', err);
    throw err;
  }
}

// Update Product in Firestore
export async function updateFirestoreProduct(id: number, updates: Partial<Product>): Promise<Product> {
  try {
    const docRef = doc(db, 'products', String(id));
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error(`Product ${id} not found in database.`);
    }

    const current = snap.data() as Product;
    const newQty = updates.quantity !== undefined ? Number(updates.quantity) : current.quantity;
    let stock_status: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
    if (newQty <= 0) stock_status = 'Out of Stock';
    else if (newQty <= 10) stock_status = 'Low Stock';

    const merged: Product = {
      ...current,
      ...updates,
      quantity: newQty,
      selling_price: updates.selling_price !== undefined ? Number(updates.selling_price) : current.selling_price,
      purchase_price: updates.purchase_price !== undefined ? Number(updates.purchase_price) : current.purchase_price,
      updated_at: new Date().toISOString(),
      stock_status,
    };

    await setDoc(docRef, merged);
    return merged;
  } catch (err) {
    console.error('Error updating product in Firestore:', err);
    throw err;
  }
}

// Delete Product from Firestore
export async function deleteFirestoreProduct(id: number): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'products', String(id)));
    return true;
  } catch (err) {
    console.error('Error deleting product from Firestore:', err);
    throw err;
  }
}

// Get All Categories from Firestore
export async function getFirestoreCategories(): Promise<Category[]> {
  try {
    const snap = await getDocs(collection(db, 'categories'));
    if (snap.empty) {
      await seedFirestoreIfEmpty();
      return DEFAULT_CATEGORIES;
    }
    return snap.docs.map((d) => ({ ...d.data(), id: Number(d.id) || d.data().id } as Category));
  } catch (err) {
    return DEFAULT_CATEGORIES;
  }
}

// Create Sale & Generate Invoice in Firestore (Decrements Product Stock)
export async function createFirestoreSale(payload: {
  customer_id?: number;
  customer_name?: string;
  user_id?: number | string;
  user_name?: string;
  items: Array<{
    product_id: number;
    quantity: number;
    price: number;
    product_name?: string;
    sku?: string;
  }>;
  discount?: number;
  tax?: number;
  payment_method: 'Cash' | 'UPI' | 'Card' | 'Other';
}): Promise<Sale> {
  try {
    const prodsSnap = await getDocs(collection(db, 'products'));
    const productsMap = new Map<number, Product>();
    prodsSnap.forEach((d) => {
      const p = d.data() as Product;
      productsMap.set(Number(d.id) || p.id, { ...p, id: Number(d.id) || p.id });
    });

    const salesSnap = await getDocs(collection(db, 'sales'));
    const salesCount = salesSnap.size;
    const year = new Date().getFullYear();
    const invoiceNumber = `INV-${year}-${String(salesCount + 1).padStart(4, '0')}`;

    let subtotal = 0;
    const saleItems = payload.items.map((item, idx) => {
      const prod = productsMap.get(item.product_id);
      const itemSubtotal = Number((item.quantity * item.price).toFixed(2));
      subtotal += itemSubtotal;
      return {
        id: idx + 1,
        product_id: item.product_id,
        product_name: prod?.name || item.product_name || `Item ${item.product_id}`,
        sku: prod?.sku || item.sku || `P${String(item.product_id).padStart(3, '0')}`,
        unit: prod?.unit || 'Pieces',
        quantity: item.quantity,
        price: item.price,
        subtotal: itemSubtotal,
      };
    });

    const discount = Number(payload.discount) || 0;
    const tax = Number(payload.tax) || 0;
    const totalAmount = Number(Math.max(0, subtotal - discount + tax).toFixed(2));
    const saleId = Date.now();

    const newSale: Sale = {
      id: saleId,
      invoice_number: invoiceNumber,
      customer_id: payload.customer_id || 1,
      customer_name: payload.customer_name || 'Walk-in Customer',
      user_id: typeof payload.user_id === 'number' ? payload.user_id : 1,
      user_name: payload.user_name || 'Store Staff',
      subtotal,
      discount,
      tax,
      total_amount: totalAmount,
      payment_method: payload.payment_method,
      created_at: new Date().toISOString(),
      items: saleItems,
    };

    // Save Sale to Firestore
    await setDoc(doc(db, 'sales', String(saleId)), newSale);

    // Decrement stock in Firestore for all items sold
    const batch = writeBatch(db);
    for (const item of payload.items) {
      const prod = productsMap.get(item.product_id);
      if (prod) {
        const remainingQty = Math.max(0, prod.quantity - item.quantity);
        let stock_status: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
        if (remainingQty <= 0) stock_status = 'Out of Stock';
        else if (remainingQty <= 10) stock_status = 'Low Stock';

        const pRef = doc(db, 'products', String(prod.id));
        batch.update(pRef, {
          quantity: remainingQty,
          stock_status,
          updated_at: new Date().toISOString(),
        });
      }
    }
    await batch.commit();

    return newSale;
  } catch (err) {
    throw err;
  }
}

// Get All Sales from Firestore
export async function getFirestoreSales(): Promise<Sale[]> {
  try {
    const snap = await getDocs(collection(db, 'sales'));
    const list = snap.docs.map((d) => d.data() as Sale);
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  } catch (err) {
    return [];
  }
}
