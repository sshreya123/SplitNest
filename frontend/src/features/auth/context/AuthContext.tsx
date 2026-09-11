import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react";

import type { LoginPayload } from "../../../types/auth";
import type { User } from "../../../types/user";
import { getCurrentUser } from "../api/getCurrentUser";
import { loginUser } from "../api/loginUser";
import { logoutUser } from "../api/logoutUser";
import { refreshSession } from "../api/refreshSession";
import {
  clearAccessToken
} from "../store/tokenStore";


interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (
    credentials: LoginPayload
  ) => Promise<void>;
  logout: () => Promise<void>;
}


interface AuthProviderProps {
  children: ReactNode;
}


const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined
  );


let sessionInitializationPromise:
Promise<User | null> | null = null;


function initializeSession():
Promise<User | null> {
  if (!sessionInitializationPromise) {
    sessionInitializationPromise = (
      async () => {
        try {
          await refreshSession();

          return await getCurrentUser();
        } catch {
          clearAccessToken();

          return null;
        }
      }
    )();
  }

  return sessionInitializationPromise;
}


export function AuthProvider({
  children
}: AuthProviderProps) {
  const [user, setUser] =
    useState<User | null>(null);

  const [isInitializing, setIsInitializing] =
    useState(true);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const restoredUser =
        await initializeSession();

      if (isMounted) {
        setUser(restoredUser);
        setIsInitializing(false);
      }
    }

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);
useEffect(() => {
  function handleSessionExpired() {
    clearAccessToken();
    setUser(null);
  }

  window.addEventListener(
    "auth:session-expired",
    handleSessionExpired
  );

  return () => {
    window.removeEventListener(
      "auth:session-expired",
      handleSessionExpired
    );
  };
}, []);
  async function login(
    credentials: LoginPayload
  ): Promise<void> {
    await loginUser(credentials);

    const authenticatedUser =
      await getCurrentUser();

    setUser(authenticatedUser);
  }

  async function logout(): Promise<void> {
    try {
      await logoutUser();
    } finally {
      setUser(null);
    }
  }

  const contextValue: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isInitializing,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}