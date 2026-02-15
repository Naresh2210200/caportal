
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { User } from './types';
import Login from './pages/Login';
import RegisterCA from './pages/RegisterCA';
import RegisterCustomer from './pages/RegisterCustomer';
import CADashboard from './pages/CADashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import PartyWorkspace from './pages/PartyWorkspace';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// Fixed ProtectedRoute: making children optional fixes the TS error where children passed via JSX 
// are not correctly identified as meeting the required 'children' prop requirement.
const ProtectedRoute = ({ children, role }: { children?: React.ReactNode, role?: 'ca' | 'customer' }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'ca' ? '/ca/dashboard' : '/customer/dashboard'} replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('current_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('current_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register/ca" element={<RegisterCA />} />
          <Route path="/register/customer" element={<RegisterCustomer />} />
          
          <Route path="/ca/dashboard" element={
            <ProtectedRoute role="ca">
              <CADashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/ca/workspace/:partyId" element={
            <ProtectedRoute role="ca">
              <PartyWorkspace />
            </ProtectedRoute>
          } />

          <Route path="/customer/dashboard" element={
            <ProtectedRoute role="customer">
              <CustomerDashboard />
            </ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </HashRouter>
    </AuthContext.Provider>
  );
};

export default App;
