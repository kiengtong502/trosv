import { createContext, useContext, useEffect, useState } from "react";
import * as authApi from "@/features/auth/api/authApi";
import { clearSession, getToken } from "@/shared/api/axiosClient";
import { TOKEN_KEY, USER_KEY } from "@/shared/constants/storage";
import type { RegisterPayload, User } from "@/shared/types/api";
import { ignoreError } from "@/shared/lib/async";

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): User | null {
  // User ma khong token la du lieu stale (sau reseed server/401 truoc do) -
  // bo qua de tranh vong lap 401 -> redirect -> reload (bug da xay ra).
  if (!getToken()) {
    localStorage.removeItem(USER_KEY);
    return null;
  }
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStoredUser());
  const [loading, setLoading] = useState<boolean>(!!getToken());

  function saveUser(u: User): User {
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
    return u;
  }

  /** login and register both end here: store the token, then the user. */
  function startSession({ token, user: u }: { token: string; user: User }): User {
    localStorage.setItem(TOKEN_KEY, token);
    return saveUser(u);
  }

  // Refresh the profile on first load if a token exists.
  useEffect(() => {
    if (!getToken()) return;
    authApi
      .me()
      .then(saveUser)
      .catch(ignoreError("refresh current user"))
      .finally(() => {
        setLoading(false);
      });
  }, []);

  async function login(email: string, password: string): Promise<User> {
    return startSession(await authApi.login(email, password));
  }

  async function register(payload: RegisterPayload): Promise<User> {
    return startSession(await authApi.register(payload));
  }

  async function logout(): Promise<void> {
    try {
      await authApi.logout();
    } catch {
      // token may already be invalid - clearing locally is enough
    }
    clearSession();
    setUser(null);
  }

  async function refreshUser(): Promise<User> {
    return saveUser(await authApi.me());
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
