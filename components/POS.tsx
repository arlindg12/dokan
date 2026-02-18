
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Product, Customer, Sale, SaleItem } from '../types';
import { Icons } from '../constants';
import { Html5Qrcode } from 'html5-qrcode';

interface Props {
  products: Product[];
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  onComplete: (sale: Sale) => void;
  forceScannerMode?: boolean;
}

const POS: React.FC<Props> = ({ products, customers, setCustomers, onComplete, forceScannerMode = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [amountPaid, setAmountPaid] = useState(0);
  
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [discountValue, setDiscountValue] = useState(0);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  
  // Scanner state
  const [isScannerOpen, setIsScannerOpen] = useState(forceScannerMode);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.total, 0), [cart]);
  
  const calculatedDiscount = useMemo(() => {
    if (discountType === 'percent') {
      return (subtotal * discountValue) / 100;
    }
    return discountValue;
  }, [subtotal, discountValue, discountType]);

  const grandTotal = Math.max(0, subtotal - calculatedDiscount);

  const filteredCustomers = useMemo(() => customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
    c.phone.includes(customerSearch)
  ), [customers, customerSearch]);

  const filteredProducts = useMemo(() => products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  ), [products, searchTerm]);

  // Handle Scanner Lifecycle
  useEffect(() => {
    if (forceScannerMode || isScannerOpen) {
      const timer = setTimeout(() => startScanner(), 600);
      return () => { clearTimeout(timer); stopScanner(); };
    } else {
      stopScanner();
    }
  }, [forceScannerMode, isScannerOpen]);

  const startScanner = async () => {
    if (isCameraStarting) return;
    setIsCameraStarting(true);
    setScannerError(null);

    try {
      await stopScanner();
      const elementId = forceScannerMode ? "live-feed-reader" : "modal-reader";
      let element = document.getElementById(elementId);
      
      if (!element) {
        await new Promise(r => setTimeout(r, 400));
        element = document.getElementById(elementId);
      }

      if (!element) {
        setScannerError("System hardware target not ready.");
        setIsCameraStarting(false);
        return;
      }

      const html5QrCode = new Html5Qrcode(elementId);
      html5QrCodeRef.current = html5QrCode;
      
      const config = { 
        fps: 25, 
        qrbox: { width: 280, height: 280 },
        aspectRatio: forceScannerMode ? 1.777778 : 1.0
      };
      
      try {
        await html5QrCode.start(
          { facingMode: "environment" }, 
          config, 
          onScanSuccess, 
          () => {} 
        );
      } catch (err) {
        await html5QrCode.start({ facingMode: "user" }, config, onScanSuccess, () => {});
      }
      setScannerError(null);
    } catch (err: any) {
      console.error("Scanner Access Failed:", err);
      setScannerError("Camera access denied or hardware in use.");
    } finally {
      setIsCameraStarting(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try { 
        if (html5QrCodeRef.current.isScanning) await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) { console.warn(e); }
      html5QrCodeRef.current = null;
    }
  };

  function onScanSuccess(decodedText: string) {
    if (isProcessing) return;
    setIsProcessing(true);
    
    const product = products.find(p => p.sku === decodedText || p.barcode === decodedText || p.id === decodedText);
    if (product) {
      addToCart(product);
      setLastScanned(product.name);
      if (navigator.vibrate) navigator.vibrate(60);
      setTimeout(() => setLastScanned(null), 2500);
      setTimeout(() => setIsProcessing(false), 800);
    } else {
      setTimeout(() => setIsProcessing(false), 1500);
    }
  }

  const addToCart = (product: Product, qty: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        const newQty = existing.quantity + qty;
        if (newQty <= 0) return prev.filter(i => i.productId !== product.id);
        return prev.map(item => 
          item.productId === product.id ? { ...item, quantity: newQty, total: newQty * item.price } : item
        );
      }
      if (qty <= 0) return prev;
      return [...prev, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        price: product.salePrice,
        total: product.salePrice
      }];
    });
  };

  const renderCartContent = () => (
    <div className="flex flex-col h-full bg-white relative">
      <div className="p-4 border-b border-slate-100 bg-white z-20 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Billing Account</h3>
          <button onClick={() => setIsCustomerModalOpen(true)} className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase">+ New Party</button>
        </div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search customer..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none focus:border-blue-500 shadow-inner"
            value={customerSearch}
            onFocus={() => setIsCustomerDropdownOpen(true)}
            onChange={(e) => { setCustomerSearch(e.target.value); if (selectedCustomerId) setSelectedCustomerId(''); setIsCustomerDropdownOpen(true); }}
          />
          {isCustomerDropdownOpen && filteredCustomers.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] max-h-48 overflow-y-auto">
              {filteredCustomers.map(c => (
                <button key={c.id} onClick={() => { setSelectedCustomerId(c.id); setCustomerSearch(c.name); setIsCustomerDropdownOpen(false); }} className="w-full p-3 text-left hover:bg-blue-50 border-b border-slate-50 flex items-center justify-between">
                  <div>
                    <p className="font-black text-slate-800 text-xs uppercase">{c.name}</p>
                    <p className="text-[10px] font-bold text-slate-400">{c.phone}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-slate-50/50">
        {cart.map(item => (
          <div key={item.productId} className="flex flex-col bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <div className="flex-1 pr-3">
                <h5 className="font-black text-slate-900 text-[11px] uppercase leading-tight truncate">{item.name}</h5>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">Qty: {item.quantity}</span>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">@ ${item.price.toFixed(2)}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-black text-slate-900 text-sm block">${item.total.toFixed(2)}</span>
                <button onClick={() => setCart(cart.filter(i => i.productId !== item.productId))} className="mt-2 text-slate-300 hover:text-red-500 transition-all p-1">
                  <Icons.Trash />
                </button>
              </div>
            </div>
          </div>
        ))}
        {cart.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-30 py-16 grayscale">
            <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mb-4"><Icons.POS /></div>
            <p className="font-black text-[9px] uppercase tracking-[0.2em]">Cart is empty</p>
          </div>
        )}
      </div>

      <div className="p-5 bg-white border-t border-slate-200 shrink-0 space-y-4">
        <div className="flex justify-between items-center px-1">
          <p className="text-slate-400 font-black text-[11px] uppercase tracking-[0.2em]">Net Total</p>
          <p className="text-3xl font-black text-slate-900 tracking-tighter">${grandTotal.toFixed(2)}</p>
        </div>
        <div className="space-y-3">
          {/* Enhanced Discount Control */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
             <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Adjustment Discount</p>
                <div className="flex bg-slate-200 p-0.5 rounded-lg">
                   <button onClick={() => setDiscountType('fixed')} className={`px-3 py-0.5 rounded-md text-[8px] font-black uppercase transition-all ${discountType === 'fixed' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>$</button>
                   <button onClick={() => setDiscountType('percent')} className={`px-3 py-0.5 rounded-md text-[8px] font-black uppercase transition-all ${discountType === 'percent' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>%</button>
                </div>
             </div>
             <input 
               type="number" 
               placeholder={discountType === 'fixed' ? "0.00" : "0%"} 
               className="w-full bg-transparent border-none text-center text-sm font-black outline-none" 
               value={discountValue || ''} 
               onChange={(e) => setDiscountValue(Number(e.target.value))} 
             />
          </div>

          <div>
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1">Cash Received</label>
             <input 
               type="number" 
               placeholder="Received Amount" 
               className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-lg font-black focus:border-blue-600 outline-none transition-all" 
               value={amountPaid || ''} 
               onChange={(e) => setAmountPaid(Number(e.target.value))} 
             />
          </div>
        </div>
        <button 
          onClick={() => onComplete({ 
            id: Math.random().toString(36).substr(2, 9), 
            date: new Date().toISOString(), 
            customerId: selectedCustomerId || 'walk-in', 
            customerName: customers.find(c => c.id === selectedCustomerId)?.name || 'Walk-in', 
            items: cart, 
            subtotal, 
            discount: calculatedDiscount, 
            total: grandTotal, 
            paid: amountPaid, 
            due: Math.max(0, grandTotal - amountPaid), 
            paymentMethod: 'Cash' 
          })} 
          disabled={cart.length === 0} 
          className="w-full py-5 bg-slate-900 hover:bg-black text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl active:scale-95 disabled:bg-slate-100 transition-all"
        >
          Confirm Sale
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] overflow-hidden bg-slate-50">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {forceScannerMode ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 p-6 sm:p-10 relative overflow-hidden">
             <div className="w-full max-w-5xl space-y-8">
               <div className="relative group rounded-[50px] overflow-hidden border-[12px] border-slate-800 bg-black shadow-[0_40px_100px_rgba(0,0,0,0.5)] aspect-[21/9] sm:aspect-[16/8]">
                 <div id="live-feed-reader" className="w-full h-full"></div>
                 <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.8)] animate-scan-line-v2"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-4 border-white/10 rounded-3xl">
                       <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl"></div>
                       <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl"></div>
                       <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl"></div>
                       <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl"></div>
                    </div>
                    <div className="absolute top-6 left-6 flex items-center space-x-3 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10">
                       <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                       <span className="text-[10px] text-white font-black uppercase tracking-[0.2em]">Scanner: Ready</span>
                    </div>
                    {lastScanned && (
                      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-blue-600/90 backdrop-blur-md text-white px-8 py-3 rounded-full font-black text-sm uppercase tracking-widest shadow-2xl animate-pop-in-bounce">
                        {lastScanned} Added
                      </div>
                    )}
                 </div>
                 {isCameraStarting && (
                    <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center z-40">
                       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                       <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Waking Up Optical Sensor...</span>
                    </div>
                 )}
                 {scannerError && (
                    <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-8 text-center z-50">
                       <p className="text-red-400 font-bold mb-8 text-base tracking-tight">{scannerError}</p>
                       <button onClick={() => startScanner()} className="px-10 py-4 bg-white text-slate-900 font-black rounded-3xl text-[11px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Re-initialize Camera</button>
                    </div>
                 )}
               </div>
               <div className="flex justify-center space-x-8">
                  <div className="text-center">
                     <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-2">Items Count</p>
                     <p className="text-white font-black text-4xl leading-none">{cart.reduce((a, b) => a + b.quantity, 0)}</p>
                  </div>
                  <div className="w-px bg-slate-800"></div>
                  <div className="text-center">
                     <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-2">Cart Total</p>
                     <p className="text-blue-500 font-black text-4xl leading-none">${grandTotal.toFixed(2)}</p>
                  </div>
               </div>
             </div>
          </div>
        ) : (
          <>
            <div className="p-4 sm:p-6 bg-white border-b border-slate-200 sticky top-0 z-20 flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Icons.Search /></span>
                <input type="text" placeholder="Search products for manual selection..." className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 transition-all font-bold text-sm shadow-inner" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <button onClick={() => setIsScannerOpen(true)} className="w-full sm:w-auto flex items-center justify-center space-x-3 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">
                <Icons.POS /> <span>Open Modal Scanner</span>
              </button>
            </div>
            <div className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredProducts.map(product => {
                    const inCart = cart.find(i => i.productId === product.id);
                    return (
                      <div key={product.id} className={`relative bg-white p-4 rounded-[28px] border-2 transition-all flex flex-col justify-between h-44 group text-left ${inCart ? 'border-blue-600 shadow-md' : 'border-transparent hover:border-blue-200 hover:shadow-xl'}`}>
                        <div>
                          <h4 className="font-black text-slate-800 text-[11px] uppercase line-clamp-2 leading-tight">{product.name}</h4>
                          <p className="text-[10px] font-bold text-slate-400 mt-1">${product.salePrice.toFixed(2)}</p>
                        </div>
                        <div className="mt-auto">
                          {inCart ? (
                            <div className="flex items-center justify-between bg-blue-50 rounded-xl p-1 animate-pop-in">
                              <button onClick={() => addToCart(product, -1)} className="w-8 h-8 flex items-center justify-center bg-white text-blue-600 rounded-lg font-black shadow-sm active:scale-90">-</button>
                              <span className="text-xs font-black text-blue-900">{inCart.quantity}</span>
                              <button onClick={() => addToCart(product, 1)} className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg font-black shadow-sm active:scale-90">+</button>
                            </div>
                          ) : (
                            <button onClick={() => addToCart(product)} className="w-full py-3 bg-slate-50 group-hover:bg-blue-600 text-slate-400 group-hover:text-white rounded-xl flex items-center justify-center transition-all active:scale-95">
                              <Icons.Plus /> <span className="ml-2 text-[9px] font-black uppercase tracking-widest">Select</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          </>
        )}
      </div>

      <div className="hidden lg:flex w-[380px] border-l border-slate-200 flex-col bg-white shadow-2xl relative z-40">
        {renderCartContent()}
      </div>

      <div className="lg:hidden">
        {cart.length > 0 && (
          <button onClick={() => setIsMobileCartOpen(true)} className="fixed bottom-6 right-6 left-6 h-18 bg-slate-900 text-white rounded-3xl flex items-center justify-between px-8 shadow-2xl z-[100] active:scale-95 transition-all">
            <div className="flex items-center space-x-4">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-black text-sm">{cart.reduce((a,b)=>a+b.quantity, 0)}</div>
              <span className="font-black uppercase text-[10px] tracking-widest">Review Bill</span>
            </div>
            <span className="text-2xl font-black tracking-tighter">${grandTotal.toFixed(2)}</span>
          </button>
        )}
        {isMobileCartOpen && (
          <div className="fixed inset-0 z-[110] flex flex-col bg-white animate-slide-up">
             <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Order Summary</h3>
                <button onClick={() => setIsMobileCartOpen(false)} className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center font-black">✕</button>
             </div>
             <div className="flex-grow overflow-hidden">{renderCartContent()}</div>
          </div>
        )}
      </div>

      {!forceScannerMode && isScannerOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-white rounded-[40px] w-full max-lg overflow-hidden shadow-2xl animate-pop-in">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">AI Product Scanner</h3>
              <button onClick={() => setIsScannerOpen(false)} className="w-10 h-10 bg-slate-100 rounded-xl text-slate-400 flex items-center justify-center font-black">✕</button>
            </div>
            <div className="p-10 text-center">
              <div className="relative bg-black rounded-[40px] overflow-hidden aspect-square border-8 border-slate-50 min-h-[300px]">
                <div id="modal-reader" className="w-full h-full"></div>
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-red-500 shadow-[0_0_15px_red] animate-scan-line-v2"></div>
              </div>
              <p className="mt-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Align barcode within the frame</p>
              {scannerError && (
                 <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-100">
                    <p className="text-red-500 font-bold text-xs">{scannerError}</p>
                    <button onClick={() => startScanner()} className="mt-2 text-[10px] font-black text-red-600 underline uppercase">Retry</button>
                 </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
           <div className="bg-white rounded-[40px] w-full max-w-md p-10 space-y-8 animate-pop-in border-8 border-white/20">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black uppercase tracking-tight">New Party</h2>
                <button onClick={() => setIsCustomerModalOpen(false)} className="text-slate-300 font-black">✕</button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const name = fd.get('name') as string; const phone = fd.get('phone') as string; if(!name || !phone) return; const nc = { id: Math.random().toString(36).substr(2, 9), name, phone, due: 0 }; setCustomers(p => [nc, ...p]); setSelectedCustomerId(nc.id); setCustomerSearch(nc.name); setIsCustomerModalOpen(false); }} className="space-y-4">
                 <input name="name" required placeholder="Full Name" className="w-full p-4.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500" />
                 <input name="phone" required placeholder="Phone Number" className="w-full p-4.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500" />
                 <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl uppercase tracking-[0.2em] text-[10px] shadow-xl">Register Party</button>
              </form>
           </div>
        </div>
      )}

      <style>{`
        .animate-pop-in { animation: pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) both; }
        .animate-pop-in-bounce { animation: pop-in-bounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.3) both; }
        .animate-slide-up { animation: slide-up 0.4s ease-out both; }
        .animate-scan-line-v2 { animation: scan-line-v2 3s ease-in-out infinite; }
        @keyframes pop-in { 0% { transform: scale(0.7); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes pop-in-bounce { 0% { transform: translate(-50%, 40px); opacity: 0; } 100% { transform: translate(-50%, 0); opacity: 1; } }
        @keyframes slide-up { 0% { transform: translateY(100%); } 100% { transform: translateY(0); } }
        @keyframes scan-line-v2 { 0% { top: 15%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 85%; opacity: 0; } }
      `}</style>
    </div>
  );
};

export default POS;
