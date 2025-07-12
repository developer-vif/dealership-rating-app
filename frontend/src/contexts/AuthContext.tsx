import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified?: boolean;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (googleToken: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Set up axios interceptor for authentication
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, [token]);

  // Load token and user from localStorage on mount
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedToken = localStorage.getItem('auth_token');
        if (storedToken) {
          setToken(storedToken);
          
          // Verify token and get user info
          const response = await axios.get(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          
          if (response.data.success) {
            const userData = response.data.data.user;
            console.log('🔐 Auth: User loaded from stored token:', {
              userId: userData.id,
              userEmail: userData.email,
              userName: userData.name,
              userIdType: typeof userData.id
            });
            setUser(userData);
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('auth_token');
            setToken(null);
          }
        }
      } catch (error) {
        console.error('Failed to load stored authentication:', error);
        localStorage.removeItem('auth_token');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  const login = async (googleToken: string): Promise<void> => {
    try {
      setLoading(true);
      
      const response = await axios.post(`${API_BASE_URL}/auth/google`, {
        token: googleToken
      });

      if (response.data.success) {
        const { token: jwtToken, user: userData } = response.data.data;
        
        setToken(jwtToken);
        setUser(userData);
        localStorage.setItem('auth_token', jwtToken);
        
        console.log('🔐 Auth: User logged in successfully:', {
          userId: userData.id,
          userEmail: userData.email,
          userName: userData.name,
          userIdType: typeof userData.id
        });
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = (): void => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    
    // Optionally call backend logout endpoint
    if (token) {
      axios.delete(`${API_BASE_URL}/auth/logout`).catch(console.error);
    }
    
    console.log('User logged out');
  };

  const refreshToken = async (): Promise<void> => {
    try {
      if (!token) {
        throw new Error('No token to refresh');
      }

      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        token
      });

      if (response.data.success) {
        const { token: newToken, user: userData } = response.data.data;
        
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('auth_token', newToken);
        
        console.log('Token refreshed successfully');
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout(); // If refresh fails, log out the user
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    logout,
    refreshToken,
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};