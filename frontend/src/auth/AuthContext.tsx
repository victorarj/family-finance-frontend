import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { login as apiLogin, register as apiRegister } from "../apis/auth";
import { completeOnboarding as apiCompleteOnboarding, getCurrentUser } from "../apis/users";
import type { User } from "../types";

interface AuthContextType {
  token: string | null;
  userId: number | null;
  userEmail: string | null;
  currentUser: User | null;
  isProfileLoading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  register: (data: { nome: string; email: string; senha: string; telefone?: string }) => Promise<void>;
  refreshCurrentUser: () => Promise<User | null>;
  completeOnboarding: () => Promise<User>;
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isProfileLoading, setProfileLoading] = useState<boolean>(() => Boolean(localStorage.getItem("token")));

  const refreshCurrentUser = async () => {
    if (!localStorage.getItem("token")) {
      setCurrentUser(null);
      setProfileLoading(false);
      return null;
    }

    setProfileLoading(true);
    try {
      const response = await getCurrentUser();
      setCurrentUser(response.data);
      setUserId(response.data.id || null);
      setUserEmail(response.data.email || null);
      if (response.data.id) localStorage.setItem("userId", String(response.data.id));
      if (response.data.email) localStorage.setItem("userEmail", response.data.email);
      return response.data;
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setCurrentUser(null);
      setProfileLoading(false);
      return;
    }

    refreshCurrentUser().catch(() => {
      setCurrentUser(null);
      setProfileLoading(false);
    });
  }, [token]);

  const login = async (email: string, senha: string) => {
    const resp = await apiLogin(email, senha);
    const { token, userId: responseUserId, email: responseEmail } = resp.data;
    setToken(token);
    setUserId(responseUserId);
    setUserEmail(responseEmail || email);
    localStorage.setItem("token", token);
    localStorage.setItem("userId", String(responseUserId));
    localStorage.setItem("userEmail", responseEmail || email);
    await refreshCurrentUser();
  };

  const register = async (data: { nome: string; email: string; senha: string; telefone?: string }) => {
    await apiRegister(data);
  };

  const completeOnboarding = async () => {
    const response = await apiCompleteOnboarding();
    setCurrentUser(response.data);
    setUserId(response.data.id || null);
    setUserEmail(response.data.email || null);
    if (response.data.id) localStorage.setItem("userId", String(response.data.id));
    if (response.data.email) localStorage.setItem("userEmail", response.data.email);
    return response.data;
  };

  const logout = () => {
    setToken(null);
    setUserId(null);
    setUserEmail(null);
    setCurrentUser(null);
    setProfileLoading(false);
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        userId,
        userEmail,
        currentUser,
        isProfileLoading,
        login,
        register,
        refreshCurrentUser,
        completeOnboarding,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
