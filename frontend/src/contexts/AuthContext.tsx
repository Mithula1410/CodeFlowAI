import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, refreshToken: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('cf_token'));
  const [loading, setLoading] = useState<boolean>(true);

  // Set Authorization Header in Axios
  const setAxiosHeader = (jwt: string | null) => {
    if (jwt) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${jwt}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  useEffect(() => {
    const fetchMe = async () => {
      const storedToken = localStorage.getItem('cf_token');
      if (storedToken) {
        setToken(storedToken);
        setAxiosHeader(storedToken);
        try {
          const response = await axios.get('/api/v1/auth/me');
          setUser(response.data);
        } catch (error) {
          logger_error("Session expired or invalid token.", error);
          logout();
        }
      } else {
        setAxiosHeader(null);
      }
      setLoading(false);
    };

    fetchMe();
  }, []);

  const login = async (accessToken: string, refreshToken: string) => {
    localStorage.setItem('cf_token', accessToken);
    localStorage.setItem('cf_refresh_token', refreshToken);
    setToken(accessToken);
    setAxiosHeader(accessToken);
    try {
      const response = await axios.get('/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      setUser(response.data);
    } catch (e) {
      logout();
      throw e;
    }
  };

  const logout = () => {
    localStorage.removeItem('cf_token');
    localStorage.removeItem('cf_refresh_token');
    setToken(null);
    setUser(null);
    setAxiosHeader(null);
  };

  const logger_error = (msg: string, err: any) => {
    console.error(msg, err);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
};
