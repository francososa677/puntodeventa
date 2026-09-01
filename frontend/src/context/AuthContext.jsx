import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('pos_usuario');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pos_token');
    if (token) {
      api.get('/auth/me')
        .then(res => {
          if (res.data.success) {
            setUser(res.data.usuario);
            localStorage.setItem('pos_usuario', JSON.stringify(res.data.usuario));
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    if (res.data.success) {
      localStorage.setItem('pos_token', res.data.token);
      localStorage.setItem('pos_usuario', JSON.stringify(res.data.usuario));
      setUser(res.data.usuario);
      return res.data.usuario;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('pos_token');
      localStorage.removeItem('pos_usuario');
      setUser(null);
    }
  };

  const isAdmin = user && user.rol === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
