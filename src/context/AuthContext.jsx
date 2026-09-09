import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { api, getToken, setToken } from '../lib/api.js';

const AuthContext = createContext(null);
const USER_KEY = 'sorteo.user';

function loadUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

function saveUser(user) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {
    /* almacenamiento no disponible */
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser);

  const applySession = useCallback((session) => {
    setToken(session.token);
    saveUser(session.user);
    setUser(session.user);
    return session.user;
  }, []);

  const checkDni = useCallback(
    (dni) => api('/auth/check', { method: 'POST', body: { dni }, auth: false }),
    [],
  );

  const login = useCallback(
    async (dni) => applySession(await api('/auth/login', { method: 'POST', body: { dni }, auth: false })),
    [applySession],
  );

  const register = useCallback(
    async (form) => applySession(await api('/auth/register', { method: 'POST', body: form, auth: false })),
    [applySession],
  );

  const logout = useCallback(() => {
    setToken(null);
    saveUser(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user) && Boolean(getToken()),
      isAdmin: user?.role === 'admin',
      checkDni,
      login,
      register,
      logout,
    }),
    [user, checkDni, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
