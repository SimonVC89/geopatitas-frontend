import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<void>;
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
    // TODO: Implementar lógica de login con el backend
    // const response = await api.post('/auth/login', { email, password });
    // setUser(response.data.user);
    // localStorage.setItem('token', response.data.token);
    // localStorage.setItem('user', JSON.stringify(response.data.user));
    console.log('Login:', email, password);
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
        logout,
        continueAsGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
