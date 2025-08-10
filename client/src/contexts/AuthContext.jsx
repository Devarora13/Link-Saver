import { createContext, useContext, useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useLocalStorage('token', null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists and is valid on app start
    if (token) {
      // You could add token validation here if needed
      setUser({ token }); // Basic user object
    }
    setLoading(false);
  }, [token]);

  const login = (authToken, userData = null) => {
    setToken(authToken);
    setUser(userData || { token: authToken });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token;

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
