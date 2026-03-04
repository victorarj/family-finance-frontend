import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { login as apiLogin, register as apiRegister } from "../apis/auth";

interface AuthContextType {
  token: string | null;
  userId: number | null;
  userEmail: string | null;
  login: (email: string, senha: string) => Promise<void>;
  register: (data: { nome: string; email: string; senha: string; telefone?: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [userId, setUserId] = useState<number | null>(() => {
    const raw = localStorage.getItem("userId");
    return raw ? Number(raw) : null;
  });
  const [userEmail, setUserEmail] = useState<string | null>(() => localStorage.getItem("userEmail"));

  const login = async (email: string, senha: string) => {
    const resp = await apiLogin(email, senha);
    const { token, userId: responseUserId, email: responseEmail } = resp.data;
    setToken(token);
    setUserId(responseUserId);
    setUserEmail(responseEmail || email);
    localStorage.setItem("token", token);
    localStorage.setItem("userId", String(responseUserId));
    localStorage.setItem("userEmail", responseEmail || email);
  };

  const register = async (data: { nome: string; email: string; senha: string; telefone?: string }) => {
    await apiRegister(data);
  };

  const logout = () => {
    setToken(null);
    setUserId(null);
    setUserEmail(null);
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
  };

  return (
    <AuthContext.Provider value={{ token, userId, userEmail, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
