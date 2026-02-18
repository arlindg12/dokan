
import React, { useState, useMemo } from 'react';
import { Customer, Supplier, Sale, Purchase } from '../types';
import { Icons } from '../constants';

interface Props {
  type: 'Customer' | 'Supplier';
  data: any[];
  setData: React.Dispatch<React.SetStateAction<any[]>>;
  sales?: Sale[];
  purchases?: Purchase[];
  onAdjustSale?: (action: 'delete' | 'edit', oldS: Sale, newS?: Sale) => void;
  onAdjustPurchase?: (action: 'delete' | 'edit', oldP: Purchase, newP?: Purchase) => void;
  settings: any;
}

const People: React.FC<Props> = ({ type, data, setData, sales = [], purchases = [], onAdjustSale, onAdjustPurchase, settings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string, balance: number } | null>(null);

  const filteredData = data.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (item.phone && item.phone.includes(searchTerm)) ||
    (item.contact && item.contact.includes(searchTerm))
  );

  const personHistory = useMemo(() => {
    if (!selectedPerson) return [];
    if (type === 'Customer') {
      return sales.filter(s => s.customerId === selectedPerson.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else {
      return purchases.filter(p => p.supplierId === selectedPerson.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  }, [selectedPerson, sales, purchases, type]);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const contact = formData.get('contact') as string;
    const amount = Number(formData.get('amount') || 0);
    if (!name || !contact) return;
    const newItem = { id: Math.random().toString(36).substr(2, 9), name, phone: contact, contact, due: type === 'Customer' ? amount : 0, balance: type === 'Supplier' ? amount : 0 };
    setData(prev => [newItem, ...prev]);
    setIsModalOpen(false);
  };

  const handlePayment = () => {
    if (!paymentTarget || paymentAmount <= 0) return;
    setData(prev => prev.map(item => item.id === paymentTarget.id ? (type === 'Customer' ? { ...item, due: Math.max(0, (item.due || 0) - paymentAmount) } : { ...item, balance: Math.max(0, (item.balance || 0) - paymentAmount) }) : item));
    setPaymentTarget(null);
    setPaymentAmount(0);
  };

  const confirmDelete = () => { if (itemToDelete) { setData(prev => prev.filter(item => item.id !== itemToDelete.id)); setItemToDelete(null); } };
  
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold">{type} Management</h1><p className="text-slate-500">Track your {type.toLowerCase()} records, ledger, and balances</p></div>
        <div className="flex items-center space-x-4">
          <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icons.Search /></span><input type="text" placeholder={`Search ${type.toLowerCase()}s...`} className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none w-64 focus:ring-2 focus:ring-blue-500 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-2 shadow-lg shadow-blue-500/20"><Icons.Plus /><span>Add {type}</span></button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden no-print">
        <table className="w-full text-left"><thead className="bg-slate-50 border-b border-slate-100"><tr><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Profile Information</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Details</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{type === 'Customer' ? 'Current Due' : 'Payable Balance'}</th><th className="px-6 py-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredData.map(item => (<tr key={item.id} className="hover:bg-slate-50 transition-colors group"><td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedPerson(item)}><div className="flex items-center space-x-3"><div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all">{item.name.charAt(0)}</div><div><span className="font-bold text-slate-900 block">{item.name}</span><span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">View History ➜</span></div></div></td><td className="px-6 py-4 text-sm text-slate-600 font-medium">{item.phone || item.contact}</td><td className="px-6 py-4"><span className={`text-sm font-black ${(item.due > 0 || item.balance > 0) ? 'text-red-600' : 'text-slate-400'}`}>${(item.due || item.balance || 0).toFixed(2)}</span></td><td className="px-6 py-4 text-right flex justify-end space-x-3">{type === 'Customer' && item.due > 0 && <button onClick={() => setPaymentTarget(item)} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">Collect</button>}<button onClick={() => setSelectedPerson(item)} className="p-2 text-slate-400 hover:text-blue-600 transition-all"><Icons.Eye /></button><button onClick={(e) => { e.stopPropagation(); setItemToDelete({ id: item.id, name: item.name, balance: (item.due || item.balance || 0) }); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><Icons.Trash /></button></td></tr>))}</tbody></table>
      </div>

      {selectedPerson && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md no-print">
          <div className="bg-white rounded-[40px] w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-pop-in">
             <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center space-x-4"><div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-xl font-black">{selectedPerson.name.charAt(0)}</div><div><h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase leading-none">{selectedPerson.name}</h2><p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Account ID: #{selectedPerson.id.slice(0,6)}</p></div></div>
                <div className="text-right flex items-center gap-8"><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance</p><p className="text-2xl font-black text-red-600 tracking-tighter">${(selectedPerson.due || selectedPerson.balance || 0).toFixed(2)}</p></div><button onClick={() => setSelectedPerson(null)} className="w-12 h-12 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 font-black">✕</button></div>
             </div>
             <div className="flex-1 overflow-y-auto p-10 space-y-4">
                {personHistory.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-6 bg-white border-2 border-slate-50 rounded-[32px] hover:border-blue-100 transition-all shadow-sm">
                     <div className="flex gap-6"><div className="text-center bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(item.date).toLocaleDateString('en-US', { month: 'short' })}</p><p className="text-lg font-black text-slate-900">{new Date(item.date).getDate()}</p></div><div><p className="font-black text-slate-900 text-xs uppercase">Invoice #{item.id.slice(0,8).toUpperCase()}</p><p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">${item.total.toFixed(2)}</p></div></div>
                     <div className="flex gap-3"><button onClick={() => setViewingSale(item)} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"><Icons.Print /></button></div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {viewingSale && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md no-print overflow-y-auto">
          <div className="bg-white w-full max-w-4xl shadow-2xl relative flex flex-col rounded-[20px] overflow-hidden my-10 animate-pop-in">
            <button onClick={() => setViewingSale(null)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 z-50 p-2 bg-slate-50 rounded-full font-black no-print">✕</button>
            <div className="flex-1 p-12 bg-white text-slate-900" id="printable-area">
               {/* Eye-catching Shop Header */}
               <div className="border-b-8 border-slate-900 pb-10 mb-10">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                     <div className="flex-1 space-y-4">
                        <div className="inline-block px-4 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.4em] mb-2 rounded">Official Memo</div>
                        <h1 className="text-6xl font-black tracking-tighter uppercase leading-none text-slate-900">{settings.shopName}</h1>
                        <p className="text-sm font-black uppercase text-blue-600 tracking-widest">{settings.shopBio}</p>
                        <div className="bg-slate-50 p-4 border-l-4 border-slate-900 rounded-r-xl">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Services Provided:</p>
                           <p className="text-xs font-bold text-slate-700 italic">{settings.shopServices}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Invoice Reference</p>
                           <p className="text-2xl font-black font-mono">#{viewingSale.id.toUpperCase()}</p>
                        </div>
                        <p className="text-sm font-black mt-4">{new Date(viewingSale.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                     </div>
                  </div>
                  <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col md:flex-row gap-8 text-[11px] font-bold text-slate-500 uppercase">
                     <span>{settings.shopAddress}</span>
                     <span>{settings.shopContact}</span>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-8 mb-12 bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl">
                  <div><p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Customer Account:</p><p className="text-2xl font-black uppercase">{viewingSale.customerName}</p></div>
                  <div className="text-right"><p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Settlement Method:</p><p className="text-base font-black uppercase bg-white/10 inline-block px-4 py-1 rounded-full">{viewingSale.paymentMethod || 'Cash'}</p></div>
               </div>
               <table className="w-full mb-12 border-collapse">
                  <thead><tr className="bg-slate-100 text-slate-900 border-b-4 border-slate-900"><th className="py-5 px-4 text-left text-[10px] font-black uppercase tracking-widest">Description</th><th className="py-5 px-4 text-center text-[10px] font-black uppercase tracking-widest">Qty</th><th className="py-5 px-4 text-right text-[10px] font-black uppercase tracking-widest">Rate</th><th className="py-5 px-4 text-right text-[10px] font-black uppercase tracking-widest">Total</th></tr></thead>
                  <tbody className="divide-y divide-slate-200 border-b-4 border-slate-900">{viewingSale.items.map((item, idx) => (<tr key={idx}><td className="py-6 px-4 font-black text-sm uppercase text-slate-800">{item.name}</td><td className="py-6 px-4 text-sm font-black text-center">{item.quantity}</td><td className="py-6 px-4 text-sm font-bold text-right">${item.price.toFixed(2)}</td><td className="py-6 px-4 text-sm font-black text-right text-slate-900">${item.total.toFixed(2)}</td></tr>))}</tbody>
               </table>
               <div className="flex flex-col md:flex-row justify-between items-start gap-12">
                  <div className="flex-1"><div className="p-6 bg-slate-50 rounded-[32px] border-2 border-slate-100"><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Terms of Business:</p><p className="text-[10px] font-bold text-slate-600 italic uppercase">Verify Goods Before Acceptance • No Refunds • Standard Warranty Applies</p></div></div>
                  <div className="w-full md:w-80 space-y-4">
                     <div className="flex justify-between items-center py-2 px-4 border-b"><span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Subtotal</span><span className="text-sm font-bold text-slate-700">${viewingSale.total.toFixed(2)}</span></div>
                     <div className="flex justify-between items-center bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl mt-6 scale-105 origin-right"><span className="text-xs font-black uppercase tracking-[0.3em]">Net Amount</span><span className="text-4xl font-black">${viewingSale.total.toFixed(2)}</span></div>
                  </div>
               </div>
               <div className="mt-24 flex justify-between items-end pt-12 border-t-2 border-slate-100"><div className="text-center w-56 border-t-2 border-slate-300 pt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Recipient Signature</div><div className="text-center w-56 border-t-4 border-slate-900 pt-2 text-[10px] font-black uppercase tracking-widest text-slate-900">Authorized Personnel</div></div>
            </div>
            <div className="p-10 bg-slate-50 border-t flex gap-4 no-print"><button onClick={() => window.print()} className="flex-1 py-6 bg-slate-900 text-white font-black rounded-3xl flex items-center justify-center space-x-4 shadow-2xl active:scale-95 transition-all"><Icons.Print /><span>Generate Document</span></button></div>
          </div>
        </div>
      )}

      {itemToDelete && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
           <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-pop-in border border-slate-100"><div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6"><Icons.Trash /></div><h3 className="text-xl font-black text-center text-slate-900 uppercase tracking-tight">Confirm Deletion?</h3><p className="text-slate-500 text-center mt-4 font-medium">Are you sure you want to delete <span className="font-black text-slate-900">"{itemToDelete.name}"</span>? This will permanently remove all ledger history.</p><div className="grid grid-cols-2 gap-4 mt-8"><button onClick={() => setItemToDelete(null)} className="py-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-[10px] tracking-widest">Keep It</button><button onClick={confirmDelete} className="py-4 bg-red-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-red-600/20 active:scale-95 transition-all">Confirm Delete</button></div></div>
        </div>
      )}

      <style>{`.animate-pop-in { animation: pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) both; } @keyframes pop-in { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } } @media print { body * { visibility: hidden !important; } #printable-area, #printable-area * { visibility: visible !important; } #printable-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0 !important; } .no-print { display: none !important; } }`}</style>
    </div>
  );
};

export default People;
