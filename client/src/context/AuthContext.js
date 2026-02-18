import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // {id, name, email}
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('bellcorp_user');
    const storedToken = localStorage.getItem('bellcorp_token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
  }, []);

  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('bellcorp_user', JSON.stringify(userData));
    localStorage.setItem('bellcorp_token', jwtToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('bellcorp_user');
    localStorage.removeItem('bellcorp_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
