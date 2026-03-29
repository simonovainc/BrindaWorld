/**
 * AuthContext.jsx — BrindaWorld session lifecycle
 * CMMI L5: graceful 503 handling — keeps session alive, shows banner.
 */

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'brinda_token';
const USER_KEY  = 'brinda_user';

// ── Service-unavailable banner (rendered by AuthProvider) ─────────────────────
function ServiceBanner() {
  return (
    <div role="alert" style={{
      position:   'fixed',
      top:        0,
      left:       0,
      right:      0,
      zIndex:     9999,
      background: '#1e3a5f',
      color:      'white',
      textAlign:  'center',
      padding:    '0.65rem 1rem',
      fontSize:   '0.88rem',
      fontFamily: "'Segoe UI', sans-serif",
      letterSpacing: '0.01em',
      boxShadow:  '0 2px 8px rgba(0,0,0,0.3)',
    }}>
      🔧 We are experiencing technical difficulties. Please try again in a few minutes.
    </div>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children: jsx }) {
  const [user,        setUser]        = useState(null);
  const [session,     setSession]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [children,    setChildren]    = useState([]);   // child profiles
  const [serviceDown, setServiceDown] = useState(false);

  // Track interceptor id so we can eject on unmount
  const interceptorId = useRef(null);

  // ── Restore session from localStorage on mount ───────────────────────────
  useEffect(() => {
    const token      = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (token && storedUser) {
      setSession({ access_token: token });
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // ── Global 503 interceptor ────────────────────────────────────────────────
  // Catches ANY 503 from ANY api call.  Shows banner, keeps session alive.
  useEffect(() => {
    interceptorId.current = api.interceptors.response.use(
      (response) => {
        // A successful response clears the service-down banner
        if (serviceDown) setServiceDown(false);
        return response;
      },
      (error) => {
        if (error?.response?.status === 503) {
          setServiceDown(true);   // show banner — do NOT log out
        }
        return Promise.reject(error);
      }
    );

    return () => {
      if (interceptorId.current !== null) {
        api.interceptors.response.eject(interceptorId.current);
      }
    };
  }, [serviceDown]);

  // ── Persist session helpers ───────────────────────────────────────────────
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

  // ── Auth functions ────────────────────────────────────────────────────────
  const register = async (email, password, firstName, lastName, role) => {
    try {
      const { data } = await api.post('/auth/register',
        { email, password, firstName, lastName, role });
      persist(data.user, data.session);
      return data;
    } catch (err) {
      const message = err.response?.data?.error
        || 'Something went wrong. Please try again in a moment.';
      throw new Error(message);
    }
  };

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      persist(data.user, data.session);
      return data;
    } catch (err) {
      // 503 is handled by the interceptor (banner shown, session kept)
      // Re-throw with friendly message for the Login page error box
      const message = err.response?.data?.error || 'Sign in failed. Please try again.';
      throw new Error(message);
    }
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch (_) { /* ignore */ }
    clear();
  };

  // ── Children functions ────────────────────────────────────────────────────
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
      user, session, loading, children, serviceDown,
      register, login, logout,
      fetchChildren, addChild, removeChild,
    }}>
      {/* Service-down banner renders at the very top, above everything */}
      {serviceDown && <ServiceBanner />}
      {/* Push content down so banner doesn't overlap it */}
      <div style={{ paddingTop: serviceDown ? '2.5rem' : 0 }}>
        {jsx}
      </div>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
