
import React, { useState, useMemo } from 'react';
import { Sale, SaleItem } from '../types';
import { Icons } from '../constants';

interface Props {
  sales: Sale[];
  onAdjust: (action: 'delete' | 'edit', oldS: Sale, newS?: Sale) => void;
  settings: any;
}

const SalesHistory: React.FC<Props> = ({ sales, onAdjust, settings }) => {
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);

  const groupedSales = useMemo(() => {
    const groups: Record<string, { sales: Sale[], dailyTotal: number }> = {};
    if (!sales || !Array.isArray(sales)) return groups;
    const sortedSales = [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    sortedSales.forEach(sale => {
      const dateKey = new Date(sale.date).toISOString().split('T')[0];
      if (!groups[dateKey]) groups[dateKey] = { sales: [], dailyTotal: 0 };
      groups[dateKey].sales.push(sale);
      groups[dateKey].dailyTotal += (sale.total || 0);
    });
    return groups;
  }, [sales]);

  const confirmDelete = () => { if (saleToDelete) { onAdjust('delete', saleToDelete); setSaleToDelete(null); } };
  
  const handleUpdateSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSale) {
      const original = sales.find(s => s.id === editingSale.id);
      if (original) {
        onAdjust('edit', original, editingSale);
        setEditingSale(null);
      }
    }
  };

  const formatDate = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) return "Today's Sales";
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="p-8">
      <div className="mb-8"><h1 className="text-2xl font-bold">Sales History</h1><p className="text-slate-500">View and manage all your past sales transactions</p></div>
      <div className="space-y-12">
        {Object.keys(groupedSales).length === 0 ? (
          <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-slate-100"><Icons.Sales /><p className="text-slate-400 font-black uppercase tracking-widest text-xs mt-4">No records found</p></div>
        ) : (
          // Fix: Explicitly type the entry to resolve 'unknown' type issues in certain TS environments.
          Object.entries(groupedSales).map(([date, data]: [string, { sales: Sale[]; dailyTotal: number }]) => (
            <div key={date} className="space-y-4">
              <div className="flex items-end justify-between px-2"><h3 className="text-lg font-black text-slate-900">{formatDate(date)}</h3><div className="text-right"><p className="text-[10px] font-black text-blue-600 uppercase mb-1">Total Daily Revenue</p><span className="text-xl font-black">${data.dailyTotal.toFixed(2)}</span></div></div>
              <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left"><thead className="bg-slate-50/50 border-b border-slate-100 text-slate-500 uppercase text-[10px] font-black tracking-widest"><tr><th className="px-8 py-5">Invoice</th><th className="px-8 py-5">Time</th><th className="px-8 py-5">Customer</th><th className="px-8 py-5">Amount</th><th className="px-8 py-5 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-50">{data.sales.map(s => (<tr key={s.id} className="hover:bg-slate-50/80 group"><td className="px-8 py-5 font-mono text-[11px] font-bold text-slate-400">#{s.id.slice(0, 8).toUpperCase()}</td><td className="px-8 py-5 text-xs font-bold text-slate-500">{new Date(s.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td><td className="px-8 py-5 font-bold text-slate-900">{s.customerName}</td><td className="px-8 py-5 font-black text-slate-900">${s.total.toFixed(2)}</td><td className="px-8 py-5 text-right"><div className="flex items-center justify-end space-x-2"><button onClick={() => setViewingSale(s)} className="p-2 text-slate-300 hover:text-blue-600"><Icons.Eye /></button><button onClick={() => setEditingSale({...s})} className="p-2 text-slate-300 hover:text-indigo-600"><Icons.Edit /></button><button onClick={() => setSaleToDelete(s)} className="p-2 text-slate-400 hover:text-red-500"><Icons.Trash /></button></div></td></tr>))}</tbody></table>
              </div>
            </div>
          ))
        )}
      </div>

      {editingSale && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md no-print">
           <div className="bg-white rounded-[40px] w-full max-w-2xl p-10 overflow-hidden flex flex-col max-h-[90vh] animate-pop-in">
              <div className="flex items-center justify-between mb-8"><h2 className="text-2xl font-black tracking-tight uppercase">Modify Invoice #{editingSale.id.toUpperCase()}</h2><button onClick={() => setEditingSale(null)} className="text-slate-400 hover:text-slate-900 font-black">✕</button></div>
              <div className="flex-1 overflow-y-auto space-y-6 pr-4">
                 {editingSale.items.map((item, idx) => (
                   <div key={idx} className="grid grid-cols-12 gap-4 items-center p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                      <div className="col-span-6"><p className="font-black text-slate-800 uppercase text-xs">{item.name}</p></div>
                      <div className="col-span-3"><label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Qty</label>
                         <input type="number" className="w-full p-2 border-2 border-slate-200 rounded-xl text-center font-bold text-sm" value={item.quantity} onChange={(e) => {
                             const q = Math.max(0, Number(e.target.value));
                             const newItems = [...editingSale.items];
                             newItems[idx] = { ...item, quantity: q, total: q * item.price };
                             const newSub = newItems.reduce((acc, i) => acc + i.total, 0);
                             const newTotal = Math.max(0, newSub - editingSale.discount);
                             setEditingSale({...editingSale, items: newItems, subtotal: newSub, total: newTotal, due: Math.max(0, newTotal - editingSale.paid)});
                           }}
                         />
                      </div>
                      <div className="col-span-3 text-right font-black text-slate-900">${item.total.toFixed(2)}</div>
                   </div>
                 ))}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border"><label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Discount Given</label><input type="number" className="bg-transparent border-none text-sm font-black outline-none w-full" value={editingSale.discount} onChange={e => {
                        const d = Number(e.target.value);
                        const newTotal = Math.max(0, editingSale.subtotal - d);
                        setEditingSale({...editingSale, discount: d, total: newTotal, due: Math.max(0, newTotal - editingSale.paid)});
                    }} /></div>
                    <div className="p-4 bg-slate-50 rounded-2xl border"><label className="text-[8px] font-black uppercase text-slate-400 block mb-1">Amount Paid</label><input type="number" className="bg-transparent border-none text-sm font-black outline-none w-full" value={editingSale.paid} onChange={e => {
                        const p = Number(e.target.value);
                        setEditingSale({...editingSale, paid: p, due: Math.max(0, editingSale.total - p)});
                    }} /></div>
                 </div>
              </div>
              <div className="mt-8 pt-8 border-t border-slate-200 flex justify-between items-center"><div className="text-3xl font-black text-slate-900">${editingSale.total.toFixed(2)}</div><button onClick={handleUpdateSale} className="px-10 py-5 bg-blue-600 text-white font-black rounded-[24px] uppercase tracking-[0.2em] text-xs active:scale-95 transition-all">Update Transaction</button></div>
           </div>
        </div>
      )}

      {viewingSale && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md no-print overflow-y-auto">
          <div className="bg-white w-full max-w-4xl shadow-2xl relative flex flex-col rounded-[20px] overflow-hidden my-10 animate-pop-in">
            <button onClick={() => setViewingSale(null)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 z-50 p-2 bg-slate-50 rounded-full font-black no-print">✕</button>
            <div className="flex-1 p-12 bg-white text-slate-900" id="printable-area">
               {/* Eye-catching Shop Header */}
               <div className="border-b-8 border-slate-900 pb-10 mb-10 relative">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                     <div className="flex-1 space-y-4">
                        <div className="inline-block px-4 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.4em] mb-2 rounded">Premium Store Memo</div>
                        <h1 className="text-6xl font-black tracking-tighter uppercase leading-none text-slate-900">{settings.shopName}</h1>
                        <p className="text-sm font-black uppercase text-blue-600 tracking-widest flex items-center gap-2">
                           <span className="h-0.5 w-8 bg-blue-600"></span>{settings.shopBio}<span className="h-0.5 w-8 bg-blue-600"></span>
                        </p>
                        <div className="bg-slate-50 p-4 border-l-4 border-slate-900 rounded-r-xl">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Items & Services:</p>
                           <p className="text-xs font-bold text-slate-700 italic">{settings.shopServices}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Invoice ID</p>
                           <p className="text-2xl font-black font-mono">#{viewingSale.id.toUpperCase()}</p>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Transaction Date</p>
                        <p className="text-sm font-black">{new Date(viewingSale.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                     </div>
                  </div>
                  <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col md:flex-row gap-8 text-[11px] font-bold text-slate-500">
                     <div className="flex items-center gap-3"><div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-900"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg></div><span className="uppercase">{settings.shopAddress}</span></div>
                     <div className="flex items-center gap-3"><div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-900"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg></div><span className="uppercase">{settings.shopContact}</span></div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-8 mb-12 bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl">
                  <div><p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Client / Customer:</p><p className="text-2xl font-black uppercase">{viewingSale.customerName}</p></div>
                  <div className="text-right"><p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Billing Method:</p><p className="text-base font-black uppercase bg-white/10 inline-block px-4 py-1 rounded-full">{viewingSale.paymentMethod || 'Cash'}</p></div>
               </div>

               <table className="w-full mb-12 border-collapse">
                  <thead><tr className="bg-slate-100 text-slate-900 border-b-4 border-slate-900"><th className="py-5 px-4 text-left text-[10px] font-black uppercase tracking-widest">Sl.</th><th className="py-5 px-4 text-left text-[10px] font-black uppercase tracking-widest">Description</th><th className="py-5 px-4 text-center text-[10px] font-black uppercase tracking-widest">Qty</th><th className="py-5 px-4 text-right text-[10px] font-black uppercase tracking-widest">Rate</th><th className="py-5 px-4 text-right text-[10px] font-black uppercase tracking-widest">Total</th></tr></thead>
                  <tbody className="divide-y divide-slate-200 border-b-4 border-slate-900">{viewingSale.items.map((item, idx) => (<tr key={idx}><td className="py-6 px-4 text-xs font-bold text-slate-400">{idx + 1}</td><td className="py-6 px-4 font-black text-sm uppercase text-slate-800">{item.name}</td><td className="py-6 px-4 text-sm font-black text-center">{item.quantity}</td><td className="py-6 px-4 text-sm font-bold text-right">${item.price.toFixed(2)}</td><td className="py-6 px-4 text-sm font-black text-right text-slate-900">${item.total.toFixed(2)}</td></tr>))}</tbody>
               </table>
               
               <div className="flex flex-col md:flex-row justify-between items-start gap-12">
                  <div className="flex-1 space-y-6"><div className="p-6 bg-slate-50 rounded-[32px] border-2 border-slate-100"><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Notice & Terms:</p><p className="text-[10px] font-bold text-slate-600 italic uppercase leading-relaxed">1. Goods once sold are not returnable.<br/>2. Please verify all items before exit.<br/>3. Official warranty applies as per brand policy.</p></div></div>
                  <div className="w-full md:w-80 space-y-4">
                     <div className="flex justify-between items-center py-2 px-4 border-b"><span className="text-[10px] font-black uppercase text-slate-400">Subtotal</span><span className="text-sm font-bold">${viewingSale.subtotal.toFixed(2)}</span></div>
                     {viewingSale.discount > 0 && <div className="flex justify-between items-center py-2 px-4 border-b"><span className="text-[10px] font-black uppercase text-slate-400">Discount</span><span className="text-sm font-bold text-red-500">-${viewingSale.discount.toFixed(2)}</span></div>}
                     <div className="flex justify-between items-center bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl mt-6 scale-105 origin-right"><span className="text-xs font-black uppercase tracking-[0.3em]">Net Total</span><span className="text-4xl font-black">${viewingSale.total.toFixed(2)}</span></div>
                  </div>
               </div>
               <div className="mt-24 flex justify-between items-end pt-12 border-t-2 border-slate-100"><div className="text-center w-56 border-t-2 border-slate-300 pt-2"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recipient's Sign</p></div><div className="text-center w-56 border-t-4 border-slate-900 pt-2"><p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Authorized Personnel</p></div></div>
               <p className="mt-16 text-center text-[10px] font-black text-slate-300 uppercase tracking-[1em]">{settings.shopBio}</p>
            </div>
            <div className="p-10 bg-slate-50 border-t flex gap-4 no-print"><button onClick={() => window.print()} className="flex-1 py-6 bg-slate-900 text-white font-black rounded-3xl flex items-center justify-center space-x-4 shadow-2xl active:scale-95 transition-all"><Icons.Print /><span>Print Official Memo</span></button></div>
          </div>
        </div>
      )}

      {saleToDelete && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
           <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-pop-in border border-slate-100"><div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6"><Icons.Trash /></div><h3 className="text-xl font-black text-center text-slate-900 uppercase tracking-tight">Confirm Deletion?</h3><p className="text-slate-500 text-center mt-4 font-medium">Are you sure you want to delete Invoice <span className="font-black text-slate-900">#INV-{saleToDelete.id.slice(0,8).toUpperCase()}</span>? This will permanently remove the record and return {saleToDelete.items.length} items to stock.</p><div className="grid grid-cols-2 gap-4 mt-8"><button onClick={() => setSaleToDelete(null)} className="py-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-[10px] tracking-widest">Keep It</button><button onClick={confirmDelete} className="py-4 bg-red-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-red-600/20 active:scale-95 transition-all">Confirm Delete</button></div></div>
        </div>
      )}

      <style>{`.animate-pop-in { animation: pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) both; } @keyframes pop-in { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } } @media print { body * { visibility: hidden !important; } #printable-area, #printable-area * { visibility: visible !important; } #printable-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0 !important; } .no-print { display: none !important; } }`}</style>
    </div>
  );
};

export default SalesHistory;
