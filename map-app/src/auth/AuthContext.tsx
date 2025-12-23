import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "../types/User";
import { loadUser, saveUser, clearUser } from "./authStorage";

interface AuthContextValue {
  user: User | null;
  login: (username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = loadUser();
    if (stored) setUser(stored);
  }, []);

  const login = (username: string) => {
    const newUser: User = {
      id: crypto.randomUUID(),
      username,
      role: username === "admin" ? "admin" : "user",
      reputation: 0,
    };

    saveUser(newUser);
    setUser(newUser);
  };

  const logout = () => {
    clearUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
