import { createContext, useContext, useState, ReactNode } from "react";
import { login as apiLogin, register as apiRegister } from "../apis/auth";

interface AuthContextType {
  token: string | null;
  userEmail: string | null;
  login: (email: string, senha: string) => Promise<void>;
  register: (data: { nome: string; email: string; senha: string; telefone?: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [userEmail, setUserEmail] = useState<string | null>(() => localStorage.getItem("userEmail"));

  const login = async (email: string, senha: string) => {
    const resp = await apiLogin(email, senha);
    const { token } = resp.data;
    setToken(token);
    setUserEmail(email);
    localStorage.setItem("token", token);
    localStorage.setItem("userEmail", email);
  };

  const register = async (data: { nome: string; email: string; senha: string; telefone?: string }) => {
    await apiRegister(data);
  };

  const logout = () => {
    setToken(null);
    setUserEmail(null);
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
  };

  return (
    <AuthContext.Provider value={{ token, userEmail, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
