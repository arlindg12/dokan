
export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  barcode?: string;
  batchNumber?: string;
  expiryDate?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  due: number;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  balance: number;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  batchNumber?: string;
}

export interface Sale {
  id: string;
  date: string;
  customerId: string;
  customerName: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  due: number;
  paymentMethod: 'Cash' | 'Bank' | 'Mobile';
}

export interface PurchaseItem {
  productId: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  total: number;
  batchNumber?: string;
  expiryDate?: string;
}

export interface Purchase {
  id: string;
  date: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  balance: number;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
}

export interface AppSettings {
  language: 'en' | 'bn';
  shopName: string;
  shopAddress: string;
  shopContact: string;
  shopBio: string;
  shopServices: string;
  scannerWidth: number;
  scannerHeight: number;
}

export interface User {
  id: string;
  name: string;
  role: 'Admin' | 'Manager' | 'Salesman';
  username: string;
}

export type View = 'dashboard' | 'inventory' | 'pos' | 'pos-scanner' | 'sales' | 'purchases' | 'customers' | 'suppliers' | 'reports' | 'accounting' | 'settings';
