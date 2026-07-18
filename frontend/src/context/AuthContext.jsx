import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as authApi from '../services/auth';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  const persistSession = useCallback((data) => {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    connectSocket();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .getMe()
      .then((fresh) => {
        setUser(fresh);
        localStorage.setItem('user', JSON.stringify(fresh));
        connectSocket();
      })
      .catch(() => {
        localStorage.clear();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (payload) => {
    const data = await authApi.login(payload);
    persistSession(data);
    return data.user;
  };

  const registerStudent = async (payload) => {
    const data = await authApi.registerStudent(payload);
    persistSession(data);
    return data.user;
  };

  const registerVendor = async (payload) => {
    const data = await authApi.registerVendor(payload);
    persistSession(data);
    return data.user;
  };

  const logout = () => {
    localStorage.clear();
    disconnectSocket();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, registerStudent, registerVendor, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
