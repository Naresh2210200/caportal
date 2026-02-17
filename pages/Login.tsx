
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../services/db';
import { useAuth } from '../App';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = db.findUserByUsername(username);
    
    // In a real app, we'd hash the input password and compare it with the stored hash
    // For this demo, we check if user exists.
    if (user) {
      login(user);
      if (user.role === 'ca') {
        navigate('/ca/dashboard');
      } else {
        navigate('/customer/dashboard');
      }
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-slate-200">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Portal Login</h1>
          <p className="text-slate-500 mt-2">Enter your credentials to access your dashboard</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-semibold hover:bg-slate-800 transition shadow-sm"
          >
            Login to Dashboard
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4 text-sm">
          <Link to="/register/ca" className="text-center text-blue-600 hover:text-blue-700 font-medium">
            Register as CA
          </Link>
          <Link to="/register/customer" className="text-center text-blue-600 hover:text-blue-700 font-medium border-l border-slate-200">
            Register as Customer
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
