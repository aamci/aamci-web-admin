'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Role = 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'HOSPITAL' | 'ADMIN' | 'FACILITY_MANAGER' | 'ADMIN_READ' | 'ADMIN_WRITE' | 'GUEST';

export type AuthUser = {
  id: string;
  email: string;
  role?: Role;
  fullName?: string | null;
  avatarUrl?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<AuthUser>) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || '';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const apiBase = getApiBase();
      const url = apiBase ? `${apiBase}/auth/me` : '/api/auth/me';
      const token = localStorage.getItem('token');

      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url, { credentials: 'include', headers });

      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        setUser(null);
        if (token) localStorage.removeItem('token');
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    await fetchUser();
  };

  const logout = async () => {
    try {
      const apiBase = getApiBase();
      const url = apiBase ? `${apiBase}/auth/logout` : '/api/auth/logout';
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(url, { method: 'POST', credentials: 'include', headers });
      localStorage.removeItem('token');
    } catch {
      // ignore
    } finally {
      setUser(null);
    }
  };

  const updateUser = (data: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : (data as AuthUser)));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: null,
      loading: false,
      login: async () => {},
      logout: async () => {},
      updateUser: () => {},
    };
  }
  return ctx;
}
