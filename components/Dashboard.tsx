
import React, { useMemo } from 'react';
import { Sale, Product, Expense, Customer } from '../types';
import { CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface Props {
  sales: Sale[];
  products: Product[];
  expenses: Expense[];
  customers: Customer[];
}

const Dashboard: React.FC<Props> = ({ sales, products, expenses, customers }) => {
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(s => s.date.startsWith(today));
    const totalSalesToday = todaySales.reduce((acc, s) => acc + s.total, 0);

    const stockValue = products.reduce((acc, p) => acc + (p.stock * p.purchasePrice), 0);
    const lowStockCount = products.filter(p => p.stock <= p.minStock).length;
    const totalDues = customers.reduce((acc, c) => acc + c.due, 0);

    return { totalSalesToday, stockValue, lowStockCount, totalDues };
  }, [sales, products, customers]);

  const dueReminders = useMemo(() => {
    return customers.filter(c => c.due > 0).sort((a, b) => b.due - a.due);
  }, [customers]);

  const chartData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const daySales = sales.filter(s => s.date.startsWith(dateStr));
      return {
        name: d.toLocaleDateString(undefined, { weekday: 'short' }),
        sales: daySales.reduce((acc, s) => acc + s.total, 0),
      };
    });
    return last7Days;
  }, [sales]);

  return (
    <div className="p-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Today's Revenue</p>
          <h3 className="text-3xl font-black text-slate-900">${stats.totalSalesToday.toFixed(2)}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Inventory Value</p>
          <h3 className="text-3xl font-black text-blue-600">${stats.stockValue.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Low Stock Alerts</p>
          <h3 className="text-3xl font-black text-red-600">{stats.lowStockCount}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Customer Receivables</p>
          <h3 className="text-3xl font-black text-orange-600">${stats.totalDues.toFixed(2)}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
           <h3 className="font-black text-slate-900 text-lg mb-8 uppercase tracking-tighter">Revenue Trends</h3>
           <div className="h-[350px]">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={chartData}>
                 <defs>
                   <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                     <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                 <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} />
                 <Area type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl flex flex-col">
           <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-500">Active Due Reminders</h3>
              <span className="bg-red-500 text-[8px] font-black px-2 py-0.5 rounded-full">{dueReminders.length} Pending</span>
           </div>
           <div className="flex-1 space-y-6 overflow-y-auto max-h-[400px] pr-2 scrollbar-hide">
              {dueReminders.map(debtor => (
                <div key={debtor.id} className="flex items-center justify-between group bg-white/5 p-4 rounded-2xl hover:bg-white/10 transition-all">
                   <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center font-black text-xs text-slate-400">{debtor.name.charAt(0)}</div>
                      <div>
                         <p className="text-sm font-bold text-white leading-tight">{debtor.name}</p>
                         <p className="text-[10px] text-slate-500 font-bold uppercase">{debtor.phone}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-sm font-black text-red-400">${debtor.due.toFixed(2)}</p>
                      <div className="flex gap-2 mt-1">
                         <button className="text-[8px] font-black uppercase text-blue-500 hover:text-white transition-colors">SMS</button>
                         <button className="text-[8px] font-black uppercase text-green-500 hover:text-white transition-colors">WhatsApp</button>
                      </div>
                   </div>
                </div>
              ))}
              {dueReminders.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full py-10">
                   <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                   </div>
                   <p className="text-slate-600 text-xs italic">All accounts are settled</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
