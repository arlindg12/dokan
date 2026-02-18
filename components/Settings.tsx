
import React, { useState } from 'react';
import { AppSettings, User } from '../types';
import { Icons } from '../constants';

interface Props {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const Settings: React.FC<Props> = ({ settings, setSettings, users, setUsers }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'users'>('profile');

  const handleProfileUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSettings({
      ...settings,
      shopName: fd.get('shopName') as string,
      shopAddress: fd.get('shopAddress') as string,
      shopContact: fd.get('shopContact') as string,
      shopBio: fd.get('shopBio') as string,
      shopServices: fd.get('shopServices') as string,
    });
    alert('Shop Profile Updated Successfully');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4 mb-10">
         <button onClick={() => setActiveTab('profile')} className={`px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest ${activeTab === 'profile' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>Profile</button>
         <button onClick={() => setActiveTab('users')} className={`px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>Staff</button>
      </div>

      {activeTab === 'profile' && (
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-12">
          <h3 className="text-3xl font-black mb-8 tracking-tighter uppercase">Shop Identity</h3>
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Shop Name</label>
                <input name="shopName" defaultValue={settings.shopName} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-[20px] outline-none focus:border-blue-600 font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Official Contact</label>
                <input name="shopContact" defaultValue={settings.shopContact} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-[20px] outline-none focus:border-blue-600 font-bold" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Address</label>
              <input name="shopAddress" defaultValue={settings.shopAddress} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-[20px] outline-none focus:border-blue-600 font-bold" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Shop Tagline / Bio</label>
              <input name="shopBio" defaultValue={settings.shopBio} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-[20px] outline-none focus:border-blue-600 font-bold" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Featured Services (Separate with •)</label>
              <textarea name="shopServices" defaultValue={settings.shopServices} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-[20px] outline-none focus:border-blue-600 font-bold h-24" placeholder="e.g. Sales • Repair • Consultancy" />
            </div>
            <button type="submit" className="px-10 py-5 bg-blue-600 text-white font-black rounded-full uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-blue-500/20 active:scale-95 transition-all">Update Identity</button>
          </form>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-12">
          <h3 className="text-3xl font-black mb-8 tracking-tighter uppercase">User Management</h3>
          <div className="space-y-4">
            {users.map(u => (
              <div key={u.id} className="p-6 bg-slate-50 rounded-[30px] flex items-center justify-between border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-blue-600 shadow-sm">{u.name.charAt(0)}</div>
                  <div><p className="font-black text-slate-900 uppercase text-xs">{u.name}</p><p className="text-[10px] font-bold text-slate-400">@{u.username}</p></div>
                </div>
                <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full font-black uppercase text-[9px]">{u.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
