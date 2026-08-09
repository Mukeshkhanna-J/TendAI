import { createContext, useEffect, useMemo, useState } from "react";
import { authAPI } from "../services/api.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on app load if token exists
  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await authAPI.getMe();
          setUser(res.user);
        } catch (err) {
          console.error("Failed to restore auth session:", err);
          authAPI.logout();
          setUser(null);
        }
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  const login = async ({ email, password, role }) => {
    const res = await authAPI.login({ email, password, role });
    setUser(res.user);
    return res;
  };

  const register = async ({ name, email, password, organisation, role }) => {
    const res = await authAPI.register({ name, email, password, organisation, role });
    setUser(res.user);
    return res;
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      setUser,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
