
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { db } from '../services/db';
import { User, UploadedFile } from '../types';

const CADashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<User[]>([]);
  const [selectedPartyId, setSelectedPartyId] = useState<string>('');
  const [financialYear, setFinancialYear] = useState('2023-24');
  const [recentUploads, setRecentUploads] = useState<UploadedFile[]>([]);

  useEffect(() => {
    if (user) {
      const myCustomers = db.getUsers().filter(u => u.role === 'customer' && u.caCode === user.caCode);
      setCustomers(myCustomers);
    }
  }, [user]);

  useEffect(() => {
    if (selectedPartyId) {
      const files = db.getFiles().filter(f => f.customerId === selectedPartyId);
      setRecentUploads(files.slice(0, 5));
    } else {
      setRecentUploads([]);
    }
  }, [selectedPartyId]);

  const selectedParty = customers.find(c => c.id === selectedPartyId);

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-700 overflow-hidden font-sans">
      {/* SIDEBAR */}
      <aside className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-4 z-20 shadow-sm">
        <div className="mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">C</div>
        </div>
        <nav className="flex-1 w-full space-y-1">
          <button className="w-full flex flex-col items-center py-4 px-2 text-blue-600 bg-blue-50 border-r-4 border-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">Parties</span>
          </button>
        </nav>
        <button onClick={logout} className="p-3 text-slate-400 hover:text-red-600 transition mt-auto">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
          <h1 className="text-lg font-bold text-slate-800">{user?.firmName} <span className="text-slate-400 font-medium ml-2 text-sm">/ Control Panel</span></h1>
          <div className="flex items-center gap-4">
             <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest border border-slate-200">
               CA Code: {user?.caCode}
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* SEARCH & SELECT CARD */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
               <h2 className="text-2xl font-black text-slate-900 mb-6">Select a Party to Manage</h2>
               <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-2">Search Customer</label>
                    <select 
                      className="w-full h-14 px-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none text-slate-800 font-bold"
                      value={selectedPartyId}
                      onChange={(e) => setSelectedPartyId(e.target.value)}
                    >
                      <option value="">Choose from {customers.length} registered parties...</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.fullName} — {c.gstin}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-2">Financial Year</label>
                    <select 
                      className="w-full h-14 px-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold"
                      value={financialYear}
                      onChange={(e) => setFinancialYear(e.target.value)}
                    >
                      <option>2023-24</option>
                      <option>2024-25</option>
                    </select>
                  </div>
               </div>
            </div>

            {selectedParty ? (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="bg-blue-600 rounded-3xl p-10 text-white flex justify-between items-center shadow-2xl shadow-blue-200">
                  <div>
                    <p className="text-blue-100 font-bold text-sm uppercase tracking-widest mb-1">Actively Managing</p>
                    <h2 className="text-4xl font-black mb-2">{selectedParty.fullName}</h2>
                    <p className="text-blue-200 font-medium">GSTIN: {selectedParty.gstin} • CA Code: {user?.caCode}</p>
                  </div>
                  <button 
                    onClick={() => navigate(`/ca/workspace/${selectedPartyId}`)}
                    className="bg-white text-blue-600 px-10 py-5 rounded-2xl font-black text-lg hover:bg-slate-50 transition transform hover:-translate-y-1 active:scale-95"
                  >
                    Open Workspace
                  </button>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-6">
                   <div className="bg-white p-8 rounded-3xl border border-slate-200">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Pending Uploads</p>
                      <p className="text-4xl font-black text-orange-500">
                        {recentUploads.filter(f => f.status === 'Pending').length}
                      </p>
                   </div>
                   <div className="bg-white p-8 rounded-3xl border border-slate-200">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Last Sync</p>
                      <p className="text-xl font-bold text-slate-800">
                        {recentUploads[0]?.uploadedAt || 'No History'}
                      </p>
                   </div>
                   <div className="bg-white p-8 rounded-3xl border border-slate-200 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-xs font-bold text-green-500 bg-green-50 px-3 py-1 rounded-full border border-green-100">Status: Active</p>
                      </div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="py-32 text-center">
                <img src="https://cdn-icons-png.flaticon.com/512/7486/7486744.png" className="w-32 h-32 mx-auto mb-6 grayscale opacity-20" alt="empty" />
                <h3 className="text-xl font-bold text-slate-400">Select a party above to start managing their accounts</h3>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CADashboard;
