
import React, { useState, useMemo } from 'react';
import { Expense, Sale, Purchase } from '../types';
import { Icons } from '../constants';

interface Props {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  sales: Sale[];
  purchases: Purchase[];
}

const Accounting: React.FC<Props> = ({ expenses, setExpenses, sales, purchases }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totals = useMemo(() => {
    const totalSales = sales.reduce((acc, s) => acc + s.total, 0);
    const totalPurchaseCosts = purchases.reduce((acc, p) => acc + p.total, 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    
    // Profit = Revenue - PurchaseCosts - Expenses (simplified)
    const netProfit = totalSales - totalPurchaseCosts - totalExpenses;
    
    return { totalSales, totalPurchaseCosts, totalExpenses, netProfit };
  }, [sales, purchases, expenses]);

  const handleAddExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newExpense: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      category: formData.get('category') as string,
      amount: Number(formData.get('amount')),
      description: formData.get('description') as string,
    };
    setExpenses(prev => [newExpense, ...prev]);
    setIsModalOpen(false);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Accounting & Finance</h1>
          <p className="text-slate-500">Track all cash flow and net profitability</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2">
          <Icons.Plus />
          <span>Record Expense</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100">
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Revenue</p>
          <h3 className="text-2xl font-bold text-slate-900">${totals.totalSales.toFixed(2)}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100">
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Stock Costs</p>
          <h3 className="text-2xl font-bold text-orange-600">-${totals.totalPurchaseCosts.toFixed(2)}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100">
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Expenses</p>
          <h3 className="text-2xl font-bold text-red-600">-${totals.totalExpenses.toFixed(2)}</h3>
        </div>
        <div className={`p-6 rounded-2xl border shadow-xl ${totals.netProfit >= 0 ? 'bg-blue-600 border-blue-600 text-white' : 'bg-red-600 border-red-600 text-white'}`}>
          <p className="text-white/60 text-xs font-black uppercase tracking-widest mb-1">Net Profit</p>
          <h3 className="text-2xl font-bold">${totals.netProfit.toFixed(2)}</h3>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
           <h3 className="font-bold text-lg">Expense Journal</h3>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map(exp => (
              <tr key={exp.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm text-slate-500">{new Date(exp.date).toLocaleDateString()}</td>
                <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase">{exp.category}</span></td>
                <td className="px-6 py-4 text-sm font-medium">{exp.description}</td>
                <td className="px-6 py-4 text-right font-bold text-red-600">-${exp.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold">New Expense</h2>
              <button onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleAddExpense} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Category</label>
                <select name="category" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <option>Rent</option><option>Utilities</option><option>Salaries</option><option>Supplies</option><option>Marketing</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Description</label>
                <input name="description" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="e.g. Electricity Bill" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Amount</label>
                <input type="number" step="0.01" name="amount" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>
              <button type="submit" className="w-full py-4 bg-red-600 text-white font-bold rounded-xl">Record Payment</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounting;
