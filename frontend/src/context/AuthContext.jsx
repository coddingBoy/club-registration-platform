import { createContext, useContext, useEffect, useState } from "react";
import api, { setAuthToken } from "../api/client";

const AuthContext = createContext(null);
const storageKey = "soccer-school-admin-token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(storageKey) || "");
  const [admin, setAdmin] = useState(() => {
    const raw = localStorage.getItem(`${storageKey}-user`);
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  const login = async (credentials) => {
    const { data } = await api.post("/auth/login", credentials);

    localStorage.setItem(storageKey, data.token);
    localStorage.setItem(`${storageKey}-user`, JSON.stringify(data.admin));
    setToken(data.token);
    setAdmin(data.admin);
  };

  const logout = () => {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(`${storageKey}-user`);
    setToken("");
    setAdmin(null);
    setAuthToken("");
  };

  return (
    <AuthContext.Provider value={{ token, admin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
