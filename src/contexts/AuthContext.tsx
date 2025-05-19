import React, { createContext, useState, useEffect, useContext } from "react";
import {
  getCurrentUser,
  signInWithEmail,
  signUpWithEmail,
  signOut,
  signInAnonymously,
  UserData,
  getUserById,
} from "@/utils/authService";

interface AuthContextType {
  currentUser: UserData | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<UserData | null>;
  signUp: (
    email: string,
    password: string,
    name: string
  ) => Promise<UserData | null>;
  logOut: () => Promise<boolean>;
  signInAnon: () => Promise<UserData | null>;
  updateCurrentUser: (user: UserData) => void;
  refreshUserCredits: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isLoading: true,
  signIn: async () => {
    throw new Error("Not implemented");
    return null;
  },
  signUp: async () => {
    throw new Error("Not implemented");
    return null;
  },
  logOut: async () => false,
  signInAnon: async () => {
    throw new Error("Not implemented");
    return null;
  },
  updateCurrentUser: () => {},
  refreshUserCredits: async () => {
    throw new Error("Not implemented");
  },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      setIsLoading(true);
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error checking user session:", error);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const user = await signInWithEmail(email, password);
      setCurrentUser(user);
      return user;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const user = await signUpWithEmail(email, password, name);
      setCurrentUser(user);
      return user;
    } finally {
      setIsLoading(false);
    }
  };

  const logOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
      setCurrentUser(null);
      return true;
    } catch (error) {
      console.error("Error signing out:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signInAnon = async () => {
    setIsLoading(true);
    try {
      const user = await signInAnonymously();
      setCurrentUser(user);
      return user;
    } finally {
      setIsLoading(false);
    }
  };
  const updateCurrentUser = (user: UserData) => {
    setCurrentUser(user);
  };

  const refreshUserCredits = async () => {
    if (!currentUser) return;

    try {
      const user = await getUserById(currentUser.id);
      if (user) {
        setCurrentUser(user);
      }
    } catch (error) {
      console.error("Error refreshing user credits:", error);
    }
  };

  const value = {
    currentUser,
    isLoading,
    signIn,
    signUp,
    logOut,
    signInAnon,
    updateCurrentUser,
    refreshUserCredits,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
