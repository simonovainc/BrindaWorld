import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'brinda_token';
const USER_KEY  = 'brinda_user';

export function AuthProvider({ children: jsx }) {
  const [user,     setUser]     = useState(null);
  const [session,  setSession]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [children, setChildren] = useState([]);   // child profiles

  // ── Restore session from localStorage on mount ──────────
  useEffect(() => {
    const token       = localStorage.getItem(TOKEN_KEY);
    const storedUser  = localStorage.getItem(USER_KEY);
    if (token && storedUser) {
      setSession({ access_token: token });
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // ── Persist session helpers ──────────────────────────────
  const persist = (userData, sessionData) => {
    localStorage.setItem(TOKEN_KEY, sessionData.access_token);
    localStorage.setItem(USER_KEY,  JSON.stringify(userData));
    setUser(userData);
    setSession(sessionData);
  };

  const clear = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setSession(null);
    setChildren([]);
  };

  // ── Auth functions ───────────────────────────────────────
  const register = async (email, password, firstName, lastName, role) => {
    try {
      const { data } = await api.post('/auth/register',
        { email, password, firstName, lastName, role });
      persist(data.user, data.session);
      return data;
    } catch (err) {
      // Extract and re-throw a clean Error with the server message
      const message = err.response?.data?.error
        || 'Something went wrong. Please try again in a moment.';
      throw new Error(message);
    }
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    persist(data.user, data.session);
    return data;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch (_) { /* ignore */ }
    clear();
  };

  // ── Children functions ───────────────────────────────────
  const fetchChildren = async () => {
    const { data } = await api.get('/auth/children');
    setChildren(data.children || []);
    return data.children;
  };

  const addChild = async (name, age, avatar) => {
    const { data } = await api.post('/auth/child', { name, age, avatar });
    setChildren(prev => [...prev, data.child]);
    return data.child;
  };

  const removeChild = async (id) => {
    await api.delete(`/auth/child/${id}`);
    setChildren(prev => prev.filter(c => c.id !== id));
  };

  return (
    <AuthContext.Provider value={{
      user, session, loading, children,
      register, login, logout,
      fetchChildren, addChild, removeChild,
    }}>
      {jsx}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
