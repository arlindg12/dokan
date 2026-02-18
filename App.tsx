
import React, { useState, useEffect } from 'react';
import { View, Product, Customer, Supplier, Sale, Expense, Purchase, AppSettings, User } from './types';
import { Icons, INITIAL_PRODUCTS, INITIAL_CUSTOMERS, INITIAL_SUPPLIERS, DEFAULT_SETTINGS } from './constants';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import POS from './components/POS';
import People from './components/People';
import Accounting from './components/Accounting';
import Reports from './components/Reports';
import Purchases from './components/Purchases';
import SalesHistory from './components/SalesHistory';
import Settings from './components/Settings';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // App Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('appSettings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('appUsers');
    return saved ? JSON.parse(saved) : [{ id: 'u1', name: 'Admin', role: 'Admin', username: 'admin' }];
  });

  // States
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('suppliers');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });
  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('sales');
    return saved ? JSON.parse(saved) : [];
  });
  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    const saved = localStorage.getItem('purchases');
    return saved ? JSON.parse(saved) : [];
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('expenses');
    return saved ? JSON.parse(saved) : [];
  });
  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('categories');
    return saved ? JSON.parse(saved) : ['Beverages', 'Electronics', 'Grocery', 'Fashion', 'Other'];
  });

  // Persistence
  useEffect(() => localStorage.setItem('appSettings', JSON.stringify(settings)), [settings]);
  useEffect(() => localStorage.setItem('appUsers', JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem('products', JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem('customers', JSON.stringify(customers)), [customers]);
  useEffect(() => localStorage.setItem('suppliers', JSON.stringify(suppliers)), [suppliers]);
  useEffect(() => localStorage.setItem('sales', JSON.stringify(sales)), [sales]);
  useEffect(() => localStorage.setItem('purchases', JSON.stringify(purchases)), [purchases]);
  useEffect(() => localStorage.setItem('expenses', JSON.stringify(expenses)), [expenses]);
  useEffect(() => localStorage.setItem('categories', JSON.stringify(categories)), [categories]);

  const adjustTransaction = (type: 'sale' | 'purchase', action: 'delete' | 'edit', oldData: any, newData?: any) => {
    if (!oldData || !oldData.id) return;
    const tid = String(oldData.id).trim();

    if (type === 'sale') {
      if (action === 'delete') {
        // Revert Products Stock
        setProducts(prev => prev.map(p => {
          const item = oldData.items.find((si: any) => String(si.productId) === String(p.id));
          return item ? { ...p, stock: p.stock + item.quantity } : p;
        }));
        // Revert Customer Dues
        if (oldData.customerId && oldData.customerId !== 'walk-in') {
          setCustomers(prev => prev.map(c => 
            String(c.id) === String(oldData.customerId) 
              ? { ...c, due: Math.max(0, (c.due || 0) - (oldData.due || 0)) } 
              : c
          ));
        }
        setSales(prev => prev.filter(s => String(s.id).trim() !== tid));
      } else if (newData) {
        // Stock Correction on Edit
        setProducts(prev => prev.map(p => {
          let stock = p.stock;
          const oldItem = oldData.items.find((si: any) => String(si.productId) === String(p.id));
          const newItem = newData.items.find((si: any) => String(si.productId) === String(p.id));
          if (oldItem) stock += oldItem.quantity;
          if (newItem) stock -= newItem.quantity;
          return { ...p, stock: Math.max(0, stock) };
        }));
        // Due Correction
        if (oldData.customerId && oldData.customerId !== 'walk-in') {
          setCustomers(prev => prev.map(c => {
            if (String(c.id) === String(oldData.customerId)) {
              const revertedDue = (c.due || 0) - oldData.due;
              return { ...c, due: Math.max(0, revertedDue + newData.due) };
            }
            return c;
          }));
        }
        setSales(prev => prev.map(s => String(s.id).trim() === tid ? newData : s));
      }
    } else {
      // Purchase adjustment...
      if (action === 'delete') {
        setProducts(prev => prev.map(p => {
          const item = oldData.items.find((pi: any) => String(pi.productId) === String(p.id));
          return item ? { ...p, stock: Math.max(0, p.stock - item.quantity) } : p;
        }));
        if (oldData.supplierId) {
          setSuppliers(prev => prev.map(s => 
            String(s.id) === String(oldData.supplierId) 
              ? { ...s, balance: Math.max(0, (s.balance || 0) - (oldData.balance || 0)) } 
              : s
          ));
        }
        setPurchases(prev => prev.filter(p => String(p.id).trim() !== tid));
      }
    }
  };

  const navItems: { view: View; label: string; icon: React.FC }[] = [
    { view: 'dashboard', label: 'Dashboard', icon: Icons.Dashboard },
    { view: 'pos-scanner', label: 'Scanner POS', icon: Icons.POS },
    { view: 'pos', label: 'Standard POS', icon: Icons.POS },
    { view: 'inventory', label: 'Inventory', icon: Icons.Inventory },
    { view: 'sales', label: 'Sales History', icon: Icons.Sales },
    { view: 'purchases', label: 'Purchases', icon: Icons.Purchases },
    { view: 'customers', label: 'Customers', icon: Icons.People },
    { view: 'suppliers', label: 'Suppliers', icon: Icons.People },
    { view: 'accounting', label: 'Accounting', icon: Icons.Accounting },
    { view: 'reports', label: 'Reports', icon: Icons.Reports },
    { view: 'settings', label: 'Settings', icon: Icons.Settings },
  ];

  const handleSale = (newSale: Sale) => {
    setSales(prev => [newSale, ...prev]);
    setProducts(prev => prev.map(p => {
      const item = newSale.items.find(si => String(si.productId) === String(p.id));
      return item ? { ...p, stock: Math.max(0, p.stock - item.quantity) } : p;
    }));
    if (newSale.due > 0 && newSale.customerId !== 'walk-in') {
      setCustomers(prev => prev.map(c => 
        String(c.id) === String(newSale.customerId) ? { ...c, due: (c.due || 0) + newSale.due } : c
      ));
    }
    setActiveView('dashboard');
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard sales={sales} products={products} expenses={expenses} customers={customers} />;
      case 'inventory': return <Inventory products={products} setProducts={setProducts} categories={categories} setCategories={setCategories} />;
      case 'pos-scanner': return <POS products={products} customers={customers} setCustomers={setCustomers} onComplete={handleSale} forceScannerMode={true} />;
      case 'pos': return <POS products={products} customers={customers} setCustomers={setCustomers} onComplete={handleSale} forceScannerMode={false} />;
      case 'sales': return <SalesHistory sales={sales} onAdjust={(action, oldS, newS) => adjustTransaction('sale', action, oldS, newS)} settings={settings} />;
      case 'purchases': return <Purchases products={products} suppliers={suppliers} purchases={purchases} onComplete={(p) => setPurchases(prev => [p, ...prev])} onAdjust={(a, o, n) => adjustTransaction('purchase', a, o, n)} onPay={(id, amt) => {}} />;
      case 'customers': return <People type="Customer" data={customers} setData={setCustomers} sales={sales} onAdjustSale={(a, o, n) => adjustTransaction('sale', a, o, n)} settings={settings} />;
      case 'suppliers': return <People type="Supplier" data={suppliers} setData={setSuppliers} purchases={purchases} onAdjustPurchase={(a, o, n) => adjustTransaction('purchase', a, o, n)} settings={settings} />;
      case 'accounting': return <Accounting expenses={expenses} setExpenses={setExpenses} sales={sales} purchases={purchases} />;
      case 'reports': return <Reports sales={sales} products={products} expenses={expenses} purchases={purchases} />;
      case 'settings': return <Settings settings={settings} setSettings={setSettings} users={users} setUsers={setUsers} />;
      default: return <div className="p-6">Not Found</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-slate-900 text-slate-300 flex-shrink-0 sticky top-0 h-screen no-print transition-all duration-300 ease-in-out border-r border-slate-800 flex flex-col z-50`}>
        <div className={`p-6 flex items-center mb-6 ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">{settings.shopName.charAt(0)}</div>
          {!isSidebarCollapsed && (
            <div className="overflow-hidden">
               <span className="text-xl font-black text-white tracking-tighter block leading-none">{settings.shopName.split(' ')[0]}</span>
               <span className="text-[10px] text-blue-500 font-black uppercase tracking-[0.2em]">Manager</span>
            </div>
          )}
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => (
            <button key={item.view} onClick={() => setActiveView(item.view)} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-4'} px-4 py-3.5 rounded-2xl transition-all duration-200 group ${activeView === item.view ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' : 'hover:bg-slate-800/50 hover:text-white text-slate-400'}`}>
              <div className="flex-shrink-0"><item.icon /></div>
              {!isSidebarCollapsed && <span className="font-bold text-sm tracking-tight whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto no-print relative">
        <header className="bg-white/80 border-b border-slate-200 h-20 sticky top-0 z-40 flex items-center justify-between px-10 no-print backdrop-blur-md">
          <h2 className="text-xl font-black text-slate-900 capitalize tracking-tight">{activeView.replace('-', ' ')}</h2>
        </header>
        <div className="max-w-[1600px] mx-auto">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;
