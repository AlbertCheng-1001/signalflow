import { createContext, useContext, useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const STORAGE_KEY = "signalflow_auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (auth) localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage unavailable — auth just won't persist across reloads
    }
  }, [auth]);

  async function request(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "request failed");
    return data;
  }

  async function signup(email, password) {
    const data = await request("/api/auth/signup", { email, password });
    setAuth(data);
  }

  async function login(email, password) {
    const data = await request("/api/auth/login", { email, password });
    setAuth(data);
  }

  function logout() {
    setAuth(null);
  }

  // Wraps fetch with the Authorization header for authenticated API calls.
  function authFetch(path, options = {}) {
    return fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${auth?.token}`,
      },
    });
  }

  return (
    <AuthContext.Provider
      value={{ user: auth ? { email: auth.email } : null, signup, login, logout, authFetch }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
