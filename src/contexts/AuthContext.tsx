import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (nombre: string, email: string, password: string, telefono?: string) => Promise<void>;
  logout: () => void;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Verificar si hay un usuario guardado en localStorage
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    const guestMode = localStorage.getItem('guestMode');

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
    } else if (guestMode === 'true') {
      setIsGuest(true);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    const loggedUser: User = {
      id: String(data.user_id),
      email,
      name: data.nombre,
      createdAt: new Date(),
    };
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(loggedUser));
    setUser(loggedUser);
  };

  const register = async (nombre: string, email: string, password: string, telefono?: string) => {
    const { data } = await api.post('/auth/register', { nombre, email, password, ...(telefono ? { telefono } : {}) });
    localStorage.setItem('token', data.token);
    const { data: profile } = await api.get('/users/me');
    const loggedUser: User = {
      id: String(profile.id),
      email: profile.email,
      name: profile.nombre,
      createdAt: new Date(),
    };
    localStorage.setItem('user', JSON.stringify(loggedUser));
    setUser(loggedUser);
  };

  const logout = () => {
    setUser(null);
    setIsGuest(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('guestMode');
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem('guestMode', 'true');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isGuest,
        login,
        register,
        logout,
        continueAsGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
