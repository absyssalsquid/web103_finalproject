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

  useEffect(() => {
    const checkAuth = async () => {
      const res = await decodeToken();
      let authd_user = {}

      // fetch initial
      if (res.ok) {
        const data = await res.json();
        authd_user = data.user
      } 
      
      // fetch image
      const res2 = await fetchUserData(authd_user.user_id)
      if (res2.ok) {
        const data2 = await res2.json();
        authd_user['image_url'] = data2.image_url
      }

      if (Object.keys(authd_user).length > 0)
        setUser(authd_user);
      else {
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

  // Merge fresh fields (e.g. the response from PATCH /me/edit) into the
  // authenticated user without a full re-fetch or page reload.
  const updateUser = (updatedFields) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : prev));
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout, updateUser }}>
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
