
import React, { useState, useMemo } from 'react';
import { Product, Supplier, Purchase, PurchaseItem } from '../types';
import { Icons } from '../constants';

interface Props {
  products: Product[];
  suppliers: Supplier[];
  purchases: Purchase[];
  onComplete: (purchase: Purchase) => void;
  onAdjust: (action: 'delete' | 'edit', oldP: Purchase, newP?: Purchase) => void;
  onPay: (purchaseId: string, amount: number) => void;
}

const Purchases: React.FC<Props> = ({ products, suppliers, purchases, onComplete, onAdjust, onPay }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [cart, setCart] = useState<PurchaseItem[]>([]);
  const [paidAmount, setPaidAmount] = useState(0);
  const [productSearch, setProductSearch] = useState('');
  
  // States for Modals
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [payingPurchase, setPayingPurchase] = useState<Purchase | null>(null);
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);
  const [payAmount, setPayAmount] = useState(0);

  // Discount States
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [discountValue, setDiscountValue] = useState(0);

  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.total, 0), [cart]);
  
  const discountAmount = useMemo(() => {
    if (discountType === 'percent') {
      return (subtotal * discountValue) / 100;
    }
    return discountValue;
  }, [subtotal, discountValue, discountType]);

  const grandTotal = Math.max(0, subtotal - discountAmount);

  const filteredProducts = useMemo(() => products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  ), [products, productSearch]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        const newQty = existing.quantity + 1;
        return prev.map(item => item.productId === product.id ? { ...item, quantity: newQty, total: newQty * item.purchasePrice } : item);
      }
      return [...prev, { 
        productId: product.id, 
        name: product.name, 
        quantity: 1, 
        purchasePrice: product.purchasePrice, 
        total: product.purchasePrice,
        batchNumber: product.batchNumber,
        expiryDate: product.expiryDate
      }];
    });
  };

  const updateQuantity = (productId: string, qty: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, qty);
        return { ...item, quantity: newQty, total: newQty * item.purchasePrice };
      }
      return item;
    }));
  };

  const handleSave = () => {
    const newPurchase: Purchase = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      supplierId: selectedSupplierId,
      supplierName: suppliers.find(s => s.id === selectedSupplierId)?.name || 'Unknown',
      items: cart,
      subtotal: subtotal,
      discount: discountAmount,
      total: grandTotal,
      paid: paidAmount,
      balance: Math.max(0, grandTotal - paidAmount)
    };
    onComplete(newPurchase);
    setIsModalOpen(false);
    setCart([]);
    setPaidAmount(0);
    setDiscountValue(0);
    setProductSearch('');
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPurchase) {
      onAdjust('edit', purchases.find(p => p.id === editingPurchase.id)!, editingPurchase);
      setEditingPurchase(null);
    }
  };

  const confirmDelete = () => {
    if (purchaseToDelete) {
      onAdjust('delete', purchaseToDelete);
      setPurchaseToDelete(null);
    }
  };

  const executePayment = () => {
    if (payingPurchase && payAmount > 0) {
      onPay(payingPurchase.id, payAmount);
      setPayingPurchase(null);
      setPayAmount(0);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Stock Purchases</h1>
          <p className="text-slate-500">Record and manage inventory from suppliers</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center space-x-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
          <Icons.Plus />
          <span>New Acquisition</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden no-print">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-widest">
            <tr>
              <th className="px-6 py-4">Bill Date</th>
              <th className="px-6 py-4">Supplier</th>
              <th className="px-6 py-4">Bill Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {purchases.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4 text-xs font-bold text-slate-500">{new Date(p.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 font-bold text-slate-900">{p.supplierName}</td>
                <td className="px-6 py-4 font-black text-slate-900">${p.total.toFixed(2)}</td>
                <td className="px-6 py-4">
                   <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${p.balance > 0 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                        {p.balance > 0 ? `$${p.balance.toFixed(0)} Due` : 'Paid'}
                      </span>
                      {p.balance > 0 && (
                        <button onClick={() => setPayingPurchase(p)} className="text-[10px] text-blue-600 font-black uppercase hover:underline">Pay Now</button>
                      )}
                   </div>
                </td>
                <td className="px-6 py-4 text-right">
                   <div className="flex items-center justify-end space-x-2">
                     <button onClick={() => setViewingPurchase(p)} className="p-2 text-slate-300 hover:text-blue-600"><Icons.Eye /></button>
                     <button onClick={() => setEditingPurchase({...p})} className="p-2 text-slate-300 hover:text-indigo-600"><Icons.Edit /></button>
                     <button onClick={() => setPurchaseToDelete(p)} className="p-2 text-slate-300 hover:text-red-500"><Icons.Trash /></button>
                   </div>
                </td>
              </tr>
            ))}
            {purchases.length === 0 && (
              <tr>
                <td colSpan={5} className="py-20 text-center opacity-30">
                  <div className="flex flex-col items-center">
                    <Icons.Purchases />
                    <p className="mt-4 font-black uppercase text-[10px] tracking-widest">No purchase records found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* NEW ACQUISITION MODAL (POS STYLE) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl no-print">
          <div className="bg-white rounded-[40px] w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-pop-in border-8 border-white/20">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase leading-none">Stock Acquisition</h2>
                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-1">Manual Inventory Update Mode</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center font-black hover:bg-slate-100 transition-all">✕</button>
            </div>
            
            <div className="flex-1 flex overflow-hidden">
              {/* Product Selection Area */}
              <div className="flex-1 flex flex-col bg-slate-50/50 min-w-0">
                 <div className="p-6 space-y-4 border-b border-slate-100 bg-white">
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-2 px-1">Source Supplier</label>
                          <select 
                            value={selectedSupplierId} 
                            onChange={(e) => setSelectedSupplierId(e.target.value)}
                            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold transition-all"
                          >
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                       </div>
                       <div>
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-2 px-1">Product Search</label>
                          <div className="relative">
                             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Icons.Search /></span>
                             <input 
                               type="text" 
                               placeholder="Search items by Name or SKU..." 
                               className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold transition-all"
                               value={productSearch}
                               onChange={(e) => setProductSearch(e.target.value)}
                             />
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                       {filteredProducts.map(product => (
                         <button 
                            key={product.id} 
                            onClick={() => addToCart(product)} 
                            className="p-5 bg-white border-2 border-slate-100 rounded-[28px] hover:border-blue-600 hover:shadow-xl transition-all text-left group flex flex-col justify-between h-40"
                         >
                           <div>
                              <h5 className="font-black text-slate-900 uppercase text-[11px] leading-tight line-clamp-2">{product.name}</h5>
                              <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">SKU: {product.sku}</p>
                           </div>
                           <div className="flex items-center justify-between mt-4">
                              <span className="text-xs font-black text-blue-600">${product.purchasePrice.toFixed(2)}</span>
                              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all"><Icons.Plus /></div>
                           </div>
                         </button>
                       ))}
                    </div>
                 </div>
              </div>
              
              {/* Cart / Draft Voucher Sidebar */}
              <div className="w-[420px] bg-white border-l border-slate-200 flex flex-col shadow-2xl relative z-20">
                 <div className="p-6 border-b border-slate-100 shrink-0 bg-white">
                    <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-widest">Draft Voucher Items</h3>
                 </div>

                 <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                    {cart.map((item, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm animate-pop-in">
                         <div className="flex justify-between items-start mb-3">
                            <h5 className="font-black text-slate-900 text-[10px] uppercase truncate flex-1 pr-2">{item.name}</h5>
                            <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-slate-200 hover:text-red-500 transition-all">✕</button>
                         </div>
                         <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center bg-slate-100 rounded-xl p-1">
                               <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center bg-white text-slate-900 rounded-lg font-black shadow-sm active:scale-90">-</button>
                               <span className="w-12 text-center text-xs font-black">{item.quantity}</span>
                               <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center bg-slate-900 text-white rounded-lg font-black shadow-sm active:scale-90">+</button>
                            </div>
                            <div className="text-right">
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">@ ${item.purchasePrice.toFixed(2)}</p>
                               <span className="font-black text-slate-900 text-sm">${item.total.toFixed(2)}</span>
                            </div>
                         </div>
                      </div>
                    ))}
                    {cart.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center opacity-20 py-20 grayscale">
                         <Icons.Purchases />
                         <p className="font-black text-[9px] uppercase tracking-[0.2em] mt-4">Voucher is empty</p>
                      </div>
                    )}
                 </div>

                 <div className="p-6 bg-white border-t border-slate-200 shrink-0 space-y-4">
                    <div className="flex justify-between items-center px-1">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total</span>
                       <span className="text-3xl font-black text-slate-900 tracking-tighter">${grandTotal.toFixed(2)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-2">Discount Adjustment</p>
                          <div className="flex items-center justify-between">
                             <input 
                               type="number" 
                               placeholder="0.00"
                               className="bg-transparent border-none text-sm font-black outline-none w-20"
                               value={discountValue || ''}
                               onChange={(e) => setDiscountValue(Number(e.target.value))}
                             />
                             <button onClick={() => setDiscountType(discountType === 'fixed' ? 'percent' : 'fixed')} className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded-lg">
                                {discountType === 'fixed' ? '$' : '%'}
                             </button>
                          </div>
                       </div>
                       <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-2">Amount Paid</p>
                          <input 
                            type="number" 
                            placeholder="0.00"
                            className="bg-transparent border-none text-sm font-black outline-none w-full"
                            value={paidAmount || ''}
                            onChange={(e) => setPaidAmount(Number(e.target.value))}
                          />
                       </div>
                    </div>

                    <button 
                      onClick={handleSave}
                      disabled={cart.length === 0}
                      className="w-full py-5 bg-slate-900 hover:bg-black text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-xl active:scale-95 disabled:bg-slate-100 transition-all"
                    >
                      Authorize Purchase
                    </button>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {purchaseToDelete && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
           <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-pop-in border border-slate-100">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Icons.Trash />
              </div>
              <h3 className="text-xl font-black text-center text-slate-900 uppercase tracking-tight">Confirm Deletion?</h3>
              <p className="text-slate-500 text-center mt-4 font-medium">
                 Are you sure you want to delete <span className="font-black text-slate-900">#PCH-{purchaseToDelete.id.slice(0,8).toUpperCase()}</span>? 
                 <br/><br/>
                 <span className="text-red-600 font-bold uppercase text-xs">⚠️ Warning:</span> This will permanently reduce current stock levels.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-8">
                 <button onClick={() => setPurchaseToDelete(null)} className="py-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all">Keep</button>
                 <button onClick={confirmDelete} className="py-4 bg-red-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-red-600/20 active:scale-95 transition-all">Delete Record</button>
              </div>
           </div>
        </div>
      )}

      {/* VIEW VOUCHER MODAL */}
      {viewingPurchase && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[40px] overflow-hidden p-10 animate-pop-in relative">
             <button onClick={() => setViewingPurchase(null)} className="absolute top-6 right-6 text-slate-400">✕</button>
             <div className="text-center border-b pb-6 mb-6">
                <h2 className="text-2xl font-black uppercase tracking-tighter">Purchase Memo</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Ref: #{viewingPurchase.id.toUpperCase()}</p>
             </div>
             <div className="flex justify-between mb-8">
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Supplier Source</p>
                   <p className="font-black text-slate-900">{viewingPurchase.supplierName}</p>
                </div>
                <div className="text-right">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Acquisition Date</p>
                   <p className="font-bold text-slate-900">{new Date(viewingPurchase.date).toLocaleDateString()}</p>
                </div>
             </div>
             <table className="w-full mb-8">
                <thead><tr className="border-b text-[10px] uppercase text-slate-400"><th className="text-left py-2">Product Name</th><th className="text-center">Qty</th><th className="text-right">Amount</th></tr></thead>
                <tbody>{viewingPurchase.items.map((it, i) => (<tr key={i} className="border-b border-slate-50 text-xs"><td className="py-3 font-bold uppercase">{it.name}</td><td className="text-center font-black">{it.quantity}</td><td className="text-right font-black">${it.total.toFixed(2)}</td></tr>))}</tbody>
             </table>
             <div className="flex justify-between items-end pt-4">
                <div>
                   <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${viewingPurchase.balance > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                      {viewingPurchase.balance > 0 ? `Unpaid Balance: $${viewingPurchase.balance.toFixed(2)}` : 'Voucher Settled'}
                   </span>
                </div>
                <div className="text-right">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Bill Cost</p>
                   <p className="text-3xl font-black tracking-tighter">${viewingPurchase.total.toFixed(2)}</p>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* SETTLEMENT MODAL */}
      {payingPurchase && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md no-print">
           <div className="bg-white rounded-[40px] w-full max-w-md p-10 space-y-8 animate-pop-in shadow-2xl">
              <div className="text-center">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Settlement for</p>
                 <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{payingPurchase.supplierName}</h2>
                 <p className="text-orange-600 text-sm font-bold mt-2">Outstanding: ${payingPurchase.balance.toFixed(2)}</p>
              </div>
              <input 
                type="number" 
                className="w-full p-6 bg-slate-50 border-4 border-slate-100 rounded-[32px] text-center text-4xl font-black outline-none focus:border-blue-600 transition-all"
                value={payAmount || ''}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                autoFocus
              />
              <div className="flex gap-4">
                 <button onClick={() => setPayingPurchase(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-[10px] tracking-widest">Dismiss</button>
                 <button onClick={executePayment} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl shadow-blue-600/20 active:scale-95">Authorize</button>
              </div>
           </div>
        </div>
      )}

      <style>{`.animate-pop-in { animation: pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) both; } @keyframes pop-in { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  );
};

export default Purchases;
