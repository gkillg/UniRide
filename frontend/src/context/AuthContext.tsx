import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { api } from '../utils/localStorageDB';

interface ExtendedAuthContextType extends AuthContextType {
    updateProfile: (data: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<ExtendedAuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("uni_carpool_user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      // Always fetch fresh data to ensure we have latest updates
      const freshUser = api.getUser(parsed.id);
      setUser(freshUser || parsed);
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const { user, token } = api.login(username, password);
      localStorage.setItem("uni_carpool_token", token);
      localStorage.setItem("uni_carpool_user", JSON.stringify(user));
      setUser(user);
      return true;
    } catch (e) {
      alert((e as Error).message);
      return false;
    }
  };

  const register = async (formData: Partial<User>) => {
    try {
      const { user, token } = api.register(formData);
      localStorage.setItem("uni_carpool_token", token);
      localStorage.setItem("uni_carpool_user", JSON.stringify(user));
      setUser(user);
      return true;
    } catch (e) {
      alert((e as Error).message);
      return false;
    }
  };

  const updateProfile = async (data: Partial<User>) => {
      if (!user) return false;
      try {
          const updatedUser = api.updateUser(user.id, data);
          localStorage.setItem("uni_carpool_user", JSON.stringify(updatedUser));
          setUser(updatedUser);
          return true;
      } catch (e) {
          alert((e as Error).message);
          return false;
      }
  };

  const logout = () => {
    localStorage.removeItem("uni_carpool_token");
    localStorage.removeItem("uni_carpool_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, updateProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};