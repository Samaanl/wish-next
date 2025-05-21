import React, { createContext, useState, useEffect, useContext } from "react";
import {
  getCurrentUser,
  signInWithEmail,
  signUpWithEmail,
  signOut,
  signInAnonymously,
  UserData,
  getUserById,
  createGuestUser,
  getGuestUser,
  GUEST_USER_KEY,
} from "@/utils/authService";
import { shouldUseAppwrite } from "@/utils/appwrite";

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
        // Always create a guest user first if needed
        if (!localStorage.getItem(GUEST_USER_KEY)) {
          const newGuestUser = getGuestUser();
          setCurrentUser(newGuestUser);
          setIsLoading(false);
          return;
        }

        // Check if we should try Appwrite auth or just use guest user
        if (shouldUseAppwrite()) {
          try {
            const user = await getCurrentUser();
            if (user) {
              setCurrentUser(user);
            } else {
              // Fall back to guest user
              const guestUser = getGuestUser();
              setCurrentUser(guestUser);
            }
          } catch (error) {
            console.error("Error with Appwrite auth:", error);
            // Fall back to guest user
            const guestUser = getGuestUser();
            setCurrentUser(guestUser);
          }
        } else {
          // Use guest user from storage
          const guestUser = getGuestUser();
          setCurrentUser(guestUser);
        }
      } catch (error) {
        console.error("Error checking user session:", error);
        // Fall back to guest user
        const guestUser = getGuestUser();
        setCurrentUser(guestUser);
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
      // After logging out, create a new guest user
      const guestUser = createGuestUser();
      setCurrentUser(guestUser);
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

    // For guest users, just get the current state from localStorage
    if (currentUser.isGuest) {
      const updatedGuestUser = getGuestUser();
      if (updatedGuestUser) {
        setCurrentUser(updatedGuestUser);
      }
      return;
    }

    // For regular users, get from Appwrite
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
