import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, LoginPayload, RegisterPayload } from '../types/auth';
import { Role } from '../types/enums';
import { authService } from '../services/authService';
import { apiClient } from '../services/apiClient';
import { DEMO_USERS } from '../services/demoFixtures';

interface AuthContextValue {
  user: User | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isStudent: boolean;
  isFaculty: boolean;
  isAdmin: boolean;
  isDemoMode: boolean;
  login: (payload: LoginPayload) => Promise<any>;
  register: (payload: RegisterPayload) => Promise<any>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  toggleDemoMode: (enabled?: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(apiClient.isDemoMode());

  // Subscribe to auth failure from apiClient (e.g., refresh token revoked or expired)
  useEffect(() => {
    apiClient.setOnAuthFailure(() => {
      setUser(null);
      apiClient.setAccessToken(null);
      try {
        localStorage.removeItem('cirs_demo_role');
        localStorage.removeItem('cirs_demo_mode');
      } catch {
        // Storage access may be restricted
      }
      // Cleanly redirect to /login if currently on an authenticated route
      if (
        typeof window !== 'undefined' &&
        window.location.pathname !== '/login' &&
        window.location.pathname !== '/register'
      ) {
        window.location.replace('/login');
      }
    });
  }, []);

  const initSession = useCallback(async () => {
    setIsLoading(true);
    // Purge any stale mock role flags from past previews
    try {
      localStorage.removeItem('cirs_demo_role');
      localStorage.removeItem('cirs_demo_mode');
    } catch {
      // Storage access may be restricted
    }

    try {
      if (apiClient.isDemoMode()) {
        setUser(DEMO_USERS.student);
        setIsLoading(false);
        return;
      }

      // In real backend mode, attempt to refresh session via HttpOnly cookie
      try {
        const refreshRes = await authService.refresh();
        if (refreshRes?.accessToken && refreshRes?.user) {
          apiClient.setAccessToken(refreshRes.accessToken);
          setUser(refreshRes.user);
        } else {
          setUser(null);
          apiClient.setAccessToken(null);
        }
      } catch {
        // Unauthenticated or expired session, cleanly clear without throwing or looping
        setUser(null);
        apiClient.setAccessToken(null);
      }
    } catch (err) {
      console.warn('Session initialization:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initSession();
  }, [initSession]);

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const res = await authService.login(payload);
      setUser(res.user);
      setIsDemoMode(apiClient.isDemoMode());
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      await authService.register(payload);
      // Auto login through the actual backend after successful registration
      return await login({ email: payload.email, password: payload.password });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      apiClient.setAccessToken(null);
      try {
        localStorage.removeItem('cirs_demo_role');
      } catch {
        // Storage access fallback
      }
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const updated = await authService.getProfile();
      setUser(updated);
    } catch (err) {
      console.error('Error refreshing profile:', err);
    }
  };

  const toggleDemoMode = (enabled?: boolean) => {
    const nextVal = enabled !== undefined ? enabled : !isDemoMode;
    apiClient.setDemoMode(nextVal);
    setIsDemoMode(nextVal);
    if (nextVal) {
      setUser(DEMO_USERS.student);
    } else {
      setUser(null);
    }
  };

  const role = user?.role || null;
  const isStudent = role === Role.STUDENT;
  const isFaculty = role === Role.FACULTY;
  const isAdmin = role === Role.ADMIN;
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isLoading,
        isStudent,
        isFaculty,
        isAdmin,
        isDemoMode,
        login,
        register,
        logout,
        refreshProfile,
        toggleDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
