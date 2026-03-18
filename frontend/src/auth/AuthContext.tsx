import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { login as apiLogin, register as apiRegister } from "../apis/auth";
import { completeOnboarding as apiCompleteOnboarding, getCurrentUser } from "../apis/users";
import type { User } from "../types";
import { AUTH_EXPIRED_EVENT } from "../utils/apiClient";
import { clearClientSession } from "../utils/session";
import { STORAGE_KEYS } from "../utils/storage";

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
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.token));
  const [userId, setUserId] = useState<number | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.userId);
    return raw ? Number(raw) : null;
  });
  const [userEmail, setUserEmail] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.userEmail));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isProfileLoading, setProfileLoading] = useState<boolean>(() => Boolean(localStorage.getItem(STORAGE_KEYS.token)));

  const logout = useCallback(() => {
    setToken(null);
    setUserId(null);
    setUserEmail(null);
    setCurrentUser(null);
    setProfileLoading(false);
    clearClientSession();
  }, []);

  const refreshCurrentUser = async () => {
    if (!localStorage.getItem(STORAGE_KEYS.token)) {
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
      if (response.data.id) localStorage.setItem(STORAGE_KEYS.userId, String(response.data.id));
      if (response.data.email) localStorage.setItem(STORAGE_KEYS.userEmail, response.data.email);
      return response.data;
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    const handleAuthExpired = () => {
      logout();
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, [logout]);

  useEffect(() => {
    if (!token) {
      setCurrentUser(null);
      setProfileLoading(false);
      return;
    }

    refreshCurrentUser().catch(() => {
      logout();
    });
  }, [token, logout]);

  const login = async (email: string, senha: string) => {
    const resp = await apiLogin(email, senha);
    const { token, userId: responseUserId, email: responseEmail } = resp.data;
    setToken(token);
    setUserId(responseUserId);
    setUserEmail(responseEmail || email);
    localStorage.setItem(STORAGE_KEYS.token, token);
    localStorage.setItem(STORAGE_KEYS.userId, String(responseUserId));
    localStorage.setItem(STORAGE_KEYS.userEmail, responseEmail || email);
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
    if (response.data.id) localStorage.setItem(STORAGE_KEYS.userId, String(response.data.id));
    if (response.data.email) localStorage.setItem(STORAGE_KEYS.userEmail, response.data.email);
    return response.data;
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
