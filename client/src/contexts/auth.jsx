// AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';

import { login as loginApi, logout as logoutApi, register as registerApi, userFromToken} from '/src/api/auth';

// Initialize context
const AuthContext = createContext(undefined);

// Provide context to the application tree
export const AuthProvider = ({ children }) => {
  // user = { user_id, username, email } | null
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const res = await userFromToken();

      if (res.ok) {
        const user = await res.json();
        setUser(user);
      } else {
        setUser(null);
      }
    };

    checkAuth();
  }, []);


  const isAuthenticated = user !== null;

  // params = { username, password }
  const login = async (params) => {
    const response = await loginApi(params);
    const data = await response.json();
    if (response.ok)
      setUser(data.user);
    return data;
  };

  // params = { email, username, password, password2 }
  const register = async (params) => {
    const response = await registerApi(params);
    const data = await response.json();
    if (response.ok)
      setUser(data.user);
    return data;
  };

  const logout = async () => {
    const response = await logoutApi();
    setUser(null);
    return response;
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
