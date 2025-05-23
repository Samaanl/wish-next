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
  refreshUserSession: () => Promise<UserData | null>;
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
  refreshUserSession: async () => {
    throw new Error("Not implemented");
    return null;
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
        // First try to get the stored user from localStorage
        const storedUserJson = localStorage.getItem("currentUser");
        let storedUser = null;

        if (storedUserJson) {
          try {
            storedUser = JSON.parse(storedUserJson);
            console.log("Found user in localStorage:", storedUser.email);
          } catch (e) {
            console.error("Error parsing stored user:", e);
          }
        }

        // If we have a stored non-guest user, verify it still exists in Appwrite
        if (storedUser && !storedUser.isGuest) {
          try {
            // Verify this user with Appwrite
            const appwriteUser = await getCurrentUser();

            if (appwriteUser && appwriteUser.id === storedUser.id) {
              console.log(
                "Verified stored user with Appwrite:",
                appwriteUser.email
              );
              setCurrentUser(appwriteUser);
              setIsLoading(false);
              return;
            }
          } catch (error) {
            console.warn("Could not verify stored user with Appwrite:", error);
            // Will continue to fallback methods
          }
        }

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

    console.log("Refreshing user credits for:", currentUser.id);

    // For guest users, just get the current state from localStorage
    if (currentUser.isGuest) {
      const updatedGuestUser = getGuestUser();
      if (updatedGuestUser) {
        setCurrentUser(updatedGuestUser);
      }
      console.log("Guest user credits refreshed");
      return;
    }

    // Add credit refresh throttling to prevent excessive refreshes
    const lastCreditRefreshTime = parseInt(
      localStorage.getItem("last_credit_refresh") || "0"
    );
    const currentTime = Date.now();

    // If we refreshed credits in the last 2 seconds, skip to avoid multiple refreshes
    if (currentTime - lastCreditRefreshTime < 2000) {
      console.log("Credit refresh throttled - recent refresh detected");
      return;
    }

    // Mark this refresh attempt
    localStorage.setItem("last_credit_refresh", currentTime.toString());

    // For regular users, get from Appwrite
    try {
      console.log("Getting fresh user data from Appwrite...");
      const user = await getUserById(currentUser.id);

      if (user) {
        console.log("User credits refreshed. New balance:", user.credits);
        setCurrentUser(user);
      }
    } catch (error) {
      console.error("Error refreshing user credits:", error);
    }
  };
  // Force refresh the entire user session - useful after OAuth login
  const refreshUserSession = async () => {
    // Add throttling to prevent excessive refreshes
    const lastRefreshTime = parseInt(
      localStorage.getItem("last_session_refresh") || "0"
    );
    const currentTime = Date.now();

    // If we refreshed in the last 5 seconds, skip
    if (currentTime - lastRefreshTime < 5000) {
      console.log("Skipping session refresh - too soon since last refresh");
      return currentUser;
    }

    localStorage.setItem("last_session_refresh", currentTime.toString());

    setIsLoading(true);
    try {
      console.log("Refreshing user session after OAuth...");

      // Force a fresh fetch of user data from Appwrite
      const user = await getCurrentUser();
      console.log("Refreshed user data:", user);

      if (user && !user.isGuest) {
        // Remove guest user from localStorage when we get a valid logged in user
        localStorage.removeItem(GUEST_USER_KEY);

        // Update state with the newly fetched user
        setCurrentUser(user);
        console.log("User session updated with:", user.name || user.email);
        return user;
      } else {
        // If we didn't get a valid user, keep existing user or fall back to guest
        console.warn("OAuth refresh did not return a valid user");
        if (!currentUser) {
          const guestUser = getGuestUser();
          setCurrentUser(guestUser);
        }
        return null;
      }
    } catch (error) {
      console.error("Error refreshing user session:", error);
      // Fall back to guest user on error
      const guestUser = getGuestUser();
      setCurrentUser(guestUser);
      return null;
    } finally {
      setIsLoading(false);
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
    refreshUserSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
