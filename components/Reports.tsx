
import React, { useState, useEffect } from 'react';
import { Sale, Product, Expense, Purchase } from '../types';
import { getGeminiInsights } from '../services/geminiService';

interface Props {
  sales: Sale[];
  products: Product[];
  expenses: Expense[];
  // Added purchases to Props to fix the type mismatch error in App.tsx
  purchases: Purchase[];
}

const Reports: React.FC<Props> = ({ sales, products, expenses, purchases }) => {
  const [insights, setInsights] = useState<string>('Analyzing your shop data...');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      // Included purchases in the summary sent to Gemini for better business analysis
      const shopSummary = {
        totalSales: sales.reduce((acc, s) => acc + s.total, 0),
        totalPurchases: purchases.reduce((acc, p) => acc + p.total, 0),
        lowStockItems: products.filter(p => p.stock <= p.minStock).map(p => p.name),
        totalExpenses: expenses.reduce((acc, e) => acc + e.amount, 0),
        topProducts: products.sort((a, b) => b.stock - a.stock).slice(0, 3).map(p => p.name),
      };
      const result = await getGeminiInsights(shopSummary);
      setInsights(result || "No insights available.");
      setLoading(false);
    };

    fetchInsights();
  }, [sales, products, expenses, purchases]);

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Business Intelligence</h1>
          <p className="text-slate-500">AI-powered reports and data summaries</p>
        </div>
        <button onClick={() => window.print()} className="bg-white border border-slate-200 px-4 py-2 rounded-lg font-semibold hover:bg-slate-50 transition-colors flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
          <span>Export PDF</span>
        </button>
      </div>

      <div className="bg-gradient-to-br from-indigo-900 to-blue-800 text-white p-8 rounded-3xl shadow-xl shadow-indigo-500/20 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <h3 className="text-xl font-bold tracking-tight">OmniAI Business Insights</h3>
          </div>
          <div className="prose prose-invert max-w-none">
            {loading ? (
              <div className="flex items-center space-x-3 text-indigo-200">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span>Consulting Gemini for recommendations...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {insights.split('\n').map((line, i) => (
                  <p key={i} className="text-indigo-100 leading-relaxed font-medium">
                    {line.trim().startsWith('*') || line.trim().startsWith('-') ? line : `• ${line}`}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold mb-6 flex items-center space-x-2">
            <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
            <span>Sales Summary</span>
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500">Total Orders</span>
              <span className="font-bold">{sales.length}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500">Average Order Value</span>
              <span className="font-bold">${(sales.reduce((acc, s) => acc + s.total, 0) / (sales.length || 1)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500">Total Discounts Given</span>
              <span className="font-bold text-red-500">-${sales.reduce((acc, s) => acc + s.discount, 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold mb-6 flex items-center space-x-2">
            <span className="w-2 h-6 bg-green-600 rounded-full"></span>
            <span>Inventory Health</span>
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500">Total SKUs</span>
              <span className="font-bold">{products.length}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500">Total Stock Items</span>
              <span className="font-bold">{products.reduce((acc, p) => acc + p.stock, 0)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500">Out of Stock Items</span>
              <span className="font-bold text-red-600">{products.filter(p => p.stock <= 0).length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
