import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const clearAuthState = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      } catch (error) {
        clearAuthState();
      }
    } else {
      clearAuthState();
    }

    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post('http://localhost:5001/api/auth/login', { email, password });
      const { user: userData, token } = res.data;
      
      setUser(userData);
      setToken(token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return { success: true, user: userData, role: userData.role };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
        deletionReason: error.response?.data?.deletionReason || ''
      };
    }
  };

  const register = async (name, email, password, role) => {
    try {
      const res = await axios.post('http://localhost:5001/api/auth/register', { name, email, password, role });
      const { user: userData, token } = res.data;
      
      setUser(userData);
      setToken(token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return { success: true, user: userData, role: userData.role };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
        deletionReason: error.response?.data?.deletionReason || ''
      };
    }
  };

  const logout = () => {
    clearAuthState();
    window.location.replace('/');
  };

  // Merges fresh fields (e.g. an updated role after a subscription payment) into
  // the cached user object, without requiring a full re-login.
  const updateUser = (patch) => {
    setUser((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  };

  const refreshProfile = async () => {
    try {
      if (!token) return;
      const res = await axios.get('http://localhost:5001/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      updateUser(res.data);
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
  user,
  token,
  login,
  register,
  logout,
  clearAuthState,
  updateUser,
  refreshProfile,
  loading,
  isLoginModalOpen,
  setIsLoginModalOpen
}}>
      {children}
    </AuthContext.Provider>
  );
};
