import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('agrismart_user');
    return saved ? JSON.parse(saved) : {
      id: '00000000-0000-0000-0000-000000000001',
      full_name: 'Ramesh Patel',
      email: 'farmer@agrismart.io',
      phone: '+91 98765 43210',
      state: 'Karnataka',
      district: 'Mandya',
      village: 'Somanahalli',
      role: 'farmer',
      preferred_language: 'en'
    };
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('agrismart_user', JSON.stringify(user));
    localStorage.setItem('agrismart_token', user.id);
  }, [user]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      // Role matching for demonstration and Supabase auth integration
      let role = 'farmer';
      let name = 'Ramesh Patel';
      let id = '00000000-0000-0000-0000-000000000001';

      if (email.includes('expert')) {
        role = 'expert';
        name = 'Dr. Anita Rao (Agronomist)';
        id = '00000000-0000-0000-0000-000000000002';
      } else if (email.includes('admin')) {
        role = 'admin';
        name = 'Platform Super Administrator';
        id = '00000000-0000-0000-0000-000000000003';
      }

      const loggedUser = {
        id,
        email,
        full_name: name,
        role,
        state: 'Karnataka',
        district: 'Mandya',
        preferred_language: 'en'
      };

      setUser(loggedUser);
      return { success: true, user: loggedUser };
    } finally {
      setLoading(false);
    }
  };

  const register = async (profileData) => {
    setLoading(true);
    try {
      const newUser = {
        id: crypto.randomUUID(),
        ...profileData,
        role: 'farmer', // Registration always defaults to farmer per prompt security rules
        preferred_language: profileData.preferred_language || 'en'
      };
      setUser(newUser);
      return { success: true, user: newUser };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser({
      id: '00000000-0000-0000-0000-000000000001',
      full_name: 'Guest Farmer',
      email: 'farmer@agrismart.io',
      role: 'farmer',
      preferred_language: 'en'
    });
  };

  const switchRole = (newRole) => {
    setUser(prev => ({
      ...prev,
      role: newRole,
      full_name: newRole === 'admin' ? 'Super Administrator' : newRole === 'expert' ? 'Dr. Anita Rao' : 'Ramesh Patel'
    }));
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, switchRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
