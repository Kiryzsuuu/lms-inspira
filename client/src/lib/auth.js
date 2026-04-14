import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react';
import { createApiClient } from './api';

const AuthContext = createContext(null);

function decodeJwtPayload(token) {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);

  const api = useMemo(() => createApiClient(() => token), [token]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    const payload = decodeJwtPayload(token);
    if (!payload?.sub) {
      setToken('');
      localStorage.removeItem('token');
      setUser(null);
      return;
    }

    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => {
        setToken('');
        localStorage.removeItem('token');
        setUser(null);
      });
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      api,
      isAuthed: Boolean(token && user),
      role: user?.role || 'guest',
      setToken: (t) => {
        setToken(t);
        if (t) localStorage.setItem('token', t);
        else localStorage.removeItem('token');
      },
      logout: () => {
        setToken('');
        localStorage.removeItem('token');
        setUser(null);
      },
    }),
    [token, user, api]
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
