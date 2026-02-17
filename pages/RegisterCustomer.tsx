
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../services/db';
import { useAuth } from '../App';

const RegisterCustomer: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    caCode: '',
    gstin: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate CA Code exists
    const ca = db.findCAByCode(formData.caCode);
    if (!ca) {
      setError('Invalid CA Code. Please contact your CA for the correct code.');
      return;
    }

    // Check if username taken
    if (db.findUserByUsername(formData.username)) {
      setError('Username already taken.');
      return;
    }

    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      username: formData.username,
      fullName: formData.fullName,
      caCode: formData.caCode,
      gstin: formData.gstin || '27AAACP1234A1Z1', // Simulated
      role: 'customer' as const
    };

    db.saveUser(newUser);
    login(newUser);
    navigate('/customer/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-slate-200">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Customer Registration</h1>
          <p className="text-slate-500">Connect with your CA for data automation</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
            <input
              type="text" required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.fullName}
              onChange={e => setFormData({...formData, fullName: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">GSTIN (Optional)</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.gstin}
              onChange={e => setFormData({...formData, gstin: e.target.value.toUpperCase()})}
              placeholder="e.g., 27AAACP1234A1Z1"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Username</label>
            <input
              type="text" required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">CA Code</label>
            <input
              type="text" required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-300"
              placeholder="Enter code provided by your CA"
              value={formData.caCode}
              onChange={e => setFormData({...formData, caCode: e.target.value.toUpperCase()})}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Password</label>
            <input
              type="password" required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition"
          >
            Create Customer Account
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-slate-600">
          Already have an account? <Link to="/login" className="text-blue-600 font-medium">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterCustomer;
