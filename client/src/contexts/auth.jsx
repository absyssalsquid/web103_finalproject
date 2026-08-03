// AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';

import { login as loginApi, logout as logoutApi, register as registerApi, decodeToken} from '/src/api/auth';
import { fetchUserData } from "/src/api/users.js"

// Initialize context
const AuthContext = createContext(undefined);

// Provide context to the application tree
export const AuthProvider = ({ children }) => {
  // user = { user_id, username, email } | null
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  async function fetchImage(user_id) {
    const res = await fetchUserData(user_id)
    const data = await res.json();
    if (res.ok) {
      return data.image_url
    }
    return null
  }

  useEffect(() => {
    const checkAuth = async () => {
      const res = await decodeToken();
      const data = await res.json();
      let authd_user = {}

      // fetch initial
      if (res.ok) {
        authd_user = data.user
        authd_user.image_url = await fetchImage(authd_user.user_id)
      }

      if (Object.keys(authd_user).length > 0)
        setUser(authd_user);
      else {
        setUser(null);
      }

      setIsAuthLoading(false);
    };

    checkAuth();
  }, []);

  const isAuthenticated = user !== null;

  // params = { username, password }
  const login = async (params) => {
    const response = await loginApi(params);
    const data = await response.json();
    if (response.ok){
      const user = data.user
      user.image_url = await fetchImage(user.user_id)
      setUser(user);
    }
    return data;
  };

  // params = { email, username, password, password2 }
  const register = async (params) => {
    const response = await registerApi(params);
    const data = await response.json();
    if (response.ok)
      setUser(data);
    return data;
  };

  const logout = async () => {
    const response = await logoutApi();
    setUser(null);
    return response;
  };

  // Merge fresh fields (e.g. the response from PATCH /me/edit) into the
  // authenticated user without a full re-fetch or page reload.
  const updateUser = (updatedFields) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : prev));
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isAuthLoading, login, register, logout, updateUser }}>
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
