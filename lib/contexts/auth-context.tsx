'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, UserRole } from '../types';
import { authService } from '../api/services';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<any>;
  updateUser: (userData: Partial<User>) => void;
  setUser: (user: User) => void;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  checkAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  const loadUser = useCallback(async () => {
    try {
      console.log('AuthContext: Loading user...');
      setIsLoading(true);
      
      // Check if we're in a browser environment and localStorage is available
      if (typeof window === 'undefined') {
        console.log('AuthContext: Not in browser environment, skipping localStorage check');
        setIsLoading(false);
        return;
      }
      
      // Check localStorage for token
      const token = localStorage.getItem('access_token');
      console.log('AuthContext: Has access_token in localStorage:', !!token);
      
      if (!token) {
        console.log('AuthContext: No access_token in localStorage - user needs to login');
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      console.log('AuthContext: Found access_token in localStorage');
      
      const userData = await authService.getProfile();
      console.log('AuthContext: User loaded successfully:', userData);
      setUser(userData);
    } catch (error) {
      console.log('AuthContext: Failed to load user:', error);
      
      // Check if it's an auth error
      if (error instanceof Error && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
        console.log('AuthContext: Authentication failed - clearing user state and invalid cookies');
        
        // Clear invalid access_token cookie (only in browser)
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
          document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost';
          document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        }
        
        setUser(null);
      } else {
        console.log('AuthContext: Non-auth error:', error);
        setUser(null);
      }
    } finally {
      setIsLoading(false);
      console.log('AuthContext: Loading finished');
    }
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    console.log('AuthContext: Initializing and checking for existing session');
    console.log('AuthContext: Window available:', typeof window !== 'undefined');
    console.log('AuthContext: localStorage available:', typeof window !== 'undefined' && !!window.localStorage);
    if (typeof window !== 'undefined') {
      console.log('AuthContext: Token in localStorage:', !!localStorage.getItem('access_token'));
    }
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    try {
      console.log('Auth context: Starting login...');
      const response = await authService.login({ email, password });
      console.log('Auth context: Login response:', response);
      setUser(response.user);
      console.log('Auth context: User set successfully');
      
      // Check localStorage immediately after login (only in browser)
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        console.log('Auth context: Has access_token in localStorage after login:', !!token);
      }
      
      // Force reload user profile to confirm authentication
      await loadUser();
    } catch (error) {
      console.error('Auth context: Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      setUser(null);
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await authService.register(userData);
      
      // Check if OTP verification is required
      if (response.requiresVerification) {
        // Don't set user yet - they need to verify first
        return response;
      }
      
      // Admin registration - immediate login
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const hasRole = (role: UserRole): boolean => {
    return !!user && user.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return !!user && roles.includes(user.role);
  };

  const checkAuth = async (): Promise<void> => {
    console.log('CheckAuth: Starting authentication check...');
    await loadUser();
    console.log('CheckAuth: Authentication check completed');
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    register,
    updateUser,
    setUser,
    hasRole,
    hasAnyRole,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};