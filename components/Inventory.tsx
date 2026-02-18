
import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { Icons } from '../constants';
import QRCode from 'qrcode';

interface Props {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
}

const Inventory: React.FC<Props> = ({ products, setProducts, categories, setCategories }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  
  // Custom Delete State
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  
  // Category management state
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    const generateQRs = async () => {
      const urls: Record<string, string> = {};
      for (const product of products) {
        try {
          const url = await QRCode.toDataURL(product.sku || product.id, {
            margin: 2,
            width: 200,
            color: { dark: '#1e293b', light: '#ffffff' }
          });
          urls[product.id] = url;
        } catch (err) {
          console.error(err);
        }
      }
      setQrDataUrls(urls);
    };
    generateQRs();
  }, [products]);

  const downloadQR = (productId: string, productName: string) => {
    const url = qrDataUrls[productId];
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = `QR_${productName.replace(/\s+/g, '_')}.png`;
      link.click();
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.batchNumber && p.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newProduct: Product = {
      id: editingProduct?.id || Math.random().toString(36).substr(2, 9),
      name: formData.get('name') as string,
      sku: formData.get('sku') as string,
      category: formData.get('category') as string,
      unit: formData.get('unit') as string,
      purchasePrice: Number(formData.get('purchasePrice')),
      salePrice: Number(formData.get('salePrice')),
      stock: Number(formData.get('stock')),
      minStock: Number(formData.get('minStock')), // Now correctly captured from UI
      batchNumber: formData.get('batchNumber') as string,
      expiryDate: formData.get('expiryDate') as string,
    };

    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? newProduct : p));
    } else {
      setProducts(prev => [newProduct, ...prev]);
    }
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const confirmDeleteProduct = () => {
    if (productToDelete) {
      setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      setProductToDelete(null);
    }
  };

  const addCategory = () => {
    if (!newCategoryName.trim()) return;
    if (categories.includes(newCategoryName.trim())) return;
    setCategories([...categories, newCategoryName.trim()]);
    setNewCategoryName('');
  };

  const removeCategory = (cat: string) => {
    if (window.confirm(`Are you sure you want to remove '${cat}'?`)) {
      setCategories(categories.filter(c => c !== cat));
    }
  };

  const getExpiryStatus = (date?: string) => {
    if (!date) return { label: 'No Expiry', color: 'text-slate-400' };
    const expiry = new Date(date);
    const today = new Date();
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: 'Expired', color: 'bg-red-100 text-red-700' };
    if (diffDays <= 30) return { label: 'Expiring Soon', color: 'bg-orange-100 text-orange-700' };
    return { label: `Expires: ${expiry.toLocaleDateString()}`, color: 'bg-green-50 text-green-600' };
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Inventory & Batch Tracking</h1>
          <p className="text-slate-500">Monitor stock levels, batches, and expiry dates</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Icons.Search />
            </span>
            <input 
              type="text" 
              placeholder="Search product or batch..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none w-64 focus:ring-2 focus:ring-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-2 shadow-lg shadow-blue-500/20"
          >
            <Icons.Plus />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product Info</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Batch Tracking</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Pricing</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Expiry Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProducts.map(product => {
              const exp = getExpiryStatus(product.expiryDate);
              const isLowStock = product.stock <= product.minStock;
              
              return (
                <tr 
                  key={product.id} 
                  className={`transition-all group relative ${
                    isLowStock 
                      ? 'bg-red-50/80 border-y-2 border-red-200 shadow-[inset_4px_0_0_0_#ef4444]' 
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className={`font-black ${isLowStock ? 'text-red-900' : 'text-slate-900'}`}>{product.name}</p>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${isLowStock ? 'text-red-400' : 'text-slate-400'}`}>{product.category}</p>
                      <p className="text-[9px] font-mono text-slate-400 mt-1 uppercase">SKU: {product.sku}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className={`text-xs font-black ${isLowStock ? 'text-red-700' : 'text-slate-700'}`}>BN: {product.batchNumber || 'N/A'}</p>
                      {qrDataUrls[product.id] && (
                        <img src={qrDataUrls[product.id]} className={`w-8 h-8 ${isLowStock ? 'opacity-90' : 'opacity-40 group-hover:opacity-100'}`} alt="QR" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className={`font-black text-xl ${isLowStock ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>{product.stock}</span>
                      <span className={`text-[10px] font-black uppercase ${isLowStock ? 'text-red-400' : 'text-slate-400'}`}>{product.unit}</span>
                    </div>
                    {isLowStock && <p className="text-[8px] font-black text-red-500 uppercase mt-1">Alert below: {product.minStock}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className={`text-sm font-bold ${isLowStock ? 'text-red-900' : 'text-slate-900'}`}>${product.salePrice.toFixed(2)}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Cost: ${product.purchasePrice.toFixed(2)}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-[9px] font-black rounded-full uppercase tracking-widest ${isLowStock ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : exp.color}`}>
                      {isLowStock ? 'CRITICAL STOCK' : exp.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}
                        className={`p-2 rounded-lg transition-all ${isLowStock ? 'text-red-600 hover:bg-red-100' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                        title="Edit Product"
                      >
                        <Icons.Edit />
                      </button>
                      <button 
                        onClick={() => downloadQR(product.id, product.name)}
                        className={`p-2 transition-all ${isLowStock ? 'text-red-400 hover:text-red-700' : 'text-slate-400 hover:text-indigo-600'}`}
                        title="Download QR"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setProductToDelete(product); }}
                        className={`p-2 rounded-lg transition-all ${isLowStock ? 'text-red-800 hover:bg-red-200' : 'text-red-400 hover:text-red-600 hover:bg-red-50'}`}
                        title="Delete Product"
                      >
                        <Icons.Trash />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* CUSTOM PRODUCT DELETE MODAL */}
      {productToDelete && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
           <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-pop-in border border-slate-100">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Icons.Trash />
              </div>
              <h3 className="text-xl font-black text-center text-slate-900 uppercase tracking-tight">Remove Product?</h3>
              <p className="text-slate-500 text-center mt-4 font-medium">
                 Are you sure you want to delete <span className="font-black text-slate-900">"{productToDelete.name}"</span>? 
              </p>
              <div className="grid grid-cols-2 gap-4 mt-8">
                 <button 
                    onClick={() => setProductToDelete(null)} 
                    className="py-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
                 >
                    Keep
                 </button>
                 <button 
                    onClick={confirmDeleteProduct} 
                    className="py-4 bg-red-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-red-600/20 active:scale-95 transition-all"
                 >
                    Delete
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] w-full max-w-3xl shadow-2xl overflow-hidden animate-pop-in">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-2xl font-black tracking-tight">{editingProduct ? 'Update Product Batch' : 'Add New Product Batch'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 font-black">
                 ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Name</label>
                  <input name="name" defaultValue={editingProduct?.name} required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold" />
                </div>
                
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Category</label>
                  <select name="category" defaultValue={editingProduct?.category} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold">
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU Code</label>
                  <input name="sku" defaultValue={editingProduct?.sku} required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Batch Number</label>
                  <input name="batchNumber" defaultValue={editingProduct?.batchNumber} placeholder="e.g. B-2024" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiry Date</label>
                  <input type="date" name="expiryDate" defaultValue={editingProduct?.expiryDate} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Purchase Price</label>
                  <input type="number" step="0.01" name="purchasePrice" defaultValue={editingProduct?.purchasePrice} required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-black" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-blue-600">Sale Price</label>
                  <input type="number" step="0.01" name="salePrice" defaultValue={editingProduct?.salePrice} required className="w-full p-4 bg-slate-50 border-2 border-blue-100 rounded-2xl focus:border-blue-500 outline-none font-black" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Stock</label>
                  <input type="number" name="stock" defaultValue={editingProduct?.stock} required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-black" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-red-500 uppercase tracking-widest">Low Stock Alert Level</label>
                  <input type="number" name="minStock" defaultValue={editingProduct?.minStock || 5} required className="w-full p-4 bg-red-50 border-2 border-red-100 rounded-2xl focus:border-red-500 outline-none font-black text-red-600" placeholder="e.g. 10" />
                </div>
              </div>
              <div className="flex space-x-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-xs tracking-widest">Cancel</button>
                <button type="submit" className="flex-1 py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 uppercase text-xs tracking-widest hover:bg-blue-700 transition-all">Save Product Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .animate-pop-in { animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both; }
        @keyframes pop-in { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default Inventory;
