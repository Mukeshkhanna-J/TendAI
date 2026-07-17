import { createContext, useMemo, useState } from "react";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(user),
    login: ({ name, role }) => setUser({ name: name || (role === "admin" ? "Government Officer" : "Registered Bidder"), role }),
    register: ({ name, role }) => setUser({ name: name || "New User", role }),
    logout: () => setUser(null)
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
