import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'cliente_token';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function AuthProvider({ children }) {
  const [token, setToken]     = useState(() => localStorage.getItem(STORAGE_KEY));
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) { setLoading(false); return; }

    fetch(`${API_URL}/api/clientes/me`, {
      headers: { Authorization: `Bearer ${stored}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) { setToken(stored); setCliente(data); }
        else { localStorage.removeItem(STORAGE_KEY); setToken(null); }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function login(newToken, clienteData) {
    localStorage.setItem(STORAGE_KEY, newToken);
    setToken(newToken);
    setCliente(clienteData);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setCliente(null);
  }

  return (
    <AuthContext.Provider value={{ token, cliente, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
