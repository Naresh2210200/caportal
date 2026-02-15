
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../services/db';
import { useAuth } from '../App';

const RegisterCA: React.FC = () => {
  const [formData, setFormData] = useState({
    firmName: '',
    fullName: '',
    username: '',
    password: '',
    caCode: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check if CA Code is unique
    const existingCA = db.findCAByCode(formData.caCode);
    if (existingCA) {
      setError('This CA Code is already in use. Please choose another.');
      return;
    }

    // Check if Username is unique
    const existingUser = db.findUserByUsername(formData.username);
    if (existingUser) {
      setError('Username already taken.');
      return;
    }

    // Simulated Hashing: In production, use bcrypt or similar
    // const hashedPassword = await hashPassword(formData.password);

    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      username: formData.username,
      fullName: formData.fullName,
      firmName: formData.firmName,
      caCode: formData.caCode,
      role: 'ca' as const
    };

    db.saveUser(newUser);
    login(newUser);
    navigate('/ca/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-slate-200">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">CA Registration</h1>
          <p className="text-slate-500">Create your firm's professional workspace</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Firm Name</label>
            <input
              type="text" required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.firmName}
              onChange={e => setFormData({...formData, firmName: e.target.value})}
            />
          </div>
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
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Username</label>
            <input
              type="text" required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">CA Code (Unique)</label>
            <input
              type="text" required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-300"
              placeholder="e.g., F12345"
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
            Create CA Account
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-slate-600">
          Already have an account? <Link to="/login" className="text-blue-600 font-medium">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterCA;
