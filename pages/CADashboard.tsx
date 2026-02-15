
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

  const stats = [
    { label: 'Pending Files', count: recentUploads.filter(f => f.status === 'Pending').length, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Completed', count: recentUploads.filter(f => f.status === 'Completed').length, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Processing', count: recentUploads.filter(f => f.status === 'Processing').length, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{user?.firmName}</h1>
          <p className="text-sm text-slate-500">CA Code: {user?.caCode}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-600">Welcome, {user?.fullName}</span>
          <button onClick={logout} className="text-sm text-red-600 hover:text-red-700 font-semibold px-4 py-2 border border-red-200 rounded-lg hover:bg-red-50 transition">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Party (Customer)</label>
              <select 
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedPartyId}
                onChange={(e) => setSelectedPartyId(e.target.value)}
              >
                <option value="">-- Select a Customer --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.fullName} ({c.gstin})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Financial Year</label>
              <select 
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {stats.map((stat, i) => (
                <div key={i} className={`${stat.bg} p-6 rounded-xl border border-slate-200 shadow-sm`}>
                  <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.count}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h2 className="font-bold text-slate-900">Recent Uploads for {selectedParty.fullName}</h2>
                <button 
                  onClick={() => navigate(`/ca/workspace/${selectedPartyId}`)}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                >
                  Open Party Workspace
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-3">File Name</th>
                      <th className="px-6 py-3">Period</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentUploads.length > 0 ? (
                      recentUploads.map(file => (
                        <tr key={file.id} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-4 font-medium text-slate-700">{file.fileName}</td>
                          <td className="px-6 py-4 text-slate-500">{file.month} {file.financialYear}</td>
                          <td className="px-6 py-4 text-slate-500 text-sm">{file.uploadedAt}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                              ${file.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                                file.status === 'Processing' ? 'bg-blue-100 text-blue-700' : 
                                'bg-orange-100 text-orange-700'}
                            `}>
                              {file.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                          No recent uploads found for this party.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
            <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-lg">Please select a party from the dropdown above to view summary</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default CADashboard;
