import React, { createContext, useState, useEffect, useContext } from "react";
import {
  getCurrentUser,
  signOut,
  signInAnonymously,
  UserData,
  getUserById,
  createGuestUser,
  getGuestUser,
  GUEST_USER_KEY,
  signInWithMagicLink,
  verifyMagicLink,
} from "@/utils/authService";
import { shouldUseAppwrite } from "@/utils/appwrite";

interface AuthContextType {
  currentUser: UserData | null;
  isLoading: boolean;
  logOut: () => Promise<boolean>;
  signInAnon: () => Promise<UserData | null>;
  signInMagicLink: (email: string) => Promise<boolean>;
  verifyMagicLinkSession: (userId: string, secret: string) => Promise<UserData>;
  updateCurrentUser: (user: UserData) => void;
  refreshUserCredits: () => Promise<void>;
  refreshUserSession: () => Promise<UserData | null>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isLoading: true,
  logOut: async () => false,
  signInAnon: async () => {
    throw new Error("Not implemented");
    return null;
  },
  signInMagicLink: async () => {
    throw new Error("Not implemented");
    return false;
  },
  verifyMagicLinkSession: async () => {
    throw new Error("Not implemented");
    return null as any;
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
  const [hasInitialized, setHasInitialized] = useState(false);
  useEffect(() => {
    // Only run once when component mounts
    if (hasInitialized) return;
    const checkUser = async () => {
      // Only run in browser
      if (typeof window === "undefined") {
        setIsLoading(false);
        return;
      }

      // If we're on the magic link page, don't run auth checks
      if (
        typeof window !== "undefined" &&
        window.location.pathname === "/auth/magic-link"
      ) {
        console.log("Skipping auth check - on magic link verification page");
        setIsLoading(false);
        setHasInitialized(true);
        return;
      }

      setIsLoading(true);
      try {
        // Check if we're in the middle of a magic link verification
        const magicLinkVerifying = localStorage.getItem("magic_link_verifying");

        if (magicLinkVerifying) {
          console.log(
            "Skipping auth check - magic link verification in progress"
          );
          setIsLoading(false);
          setHasInitialized(true);
          return;
        }
        
        // Record this auth check attempt but don't use it for rate limiting
        // This ensures we always check auth on page load/refresh
        const now = Date.now();
        localStorage.setItem("last_auth_check", now.toString());

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
              setHasInitialized(true);
              return;
            }
          } catch (error) {
            console.warn("Could not verify stored user with Appwrite:", error);
            // Will continue to fallback methods
          }
        } // Always create a guest user first if needed
        if (!localStorage.getItem(GUEST_USER_KEY)) {
          const newGuestUser = getGuestUser();
          setCurrentUser(newGuestUser);
          setIsLoading(false);
          setHasInitialized(true);
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
        setHasInitialized(true);
      }
    };

    checkUser();
  }, []); // Remove dependencies to prevent re-runs
  const logOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
      // After logging out, get guest user (respects credit abuse prevention)
      const guestUser = getGuestUser();
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

  const signInMagicLink = async (email: string) => {
    setIsLoading(true);
    try {
      const result = await signInWithMagicLink(email);
      return result;
    } catch (error) {
      console.error("Error sending magic link:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  const verifyMagicLinkSession = async (userId: string, secret: string) => {
    // Set a flag to prevent AuthContext from interfering
    localStorage.setItem("magic_link_verifying", "true");

    setIsLoading(true);
    try {
      const user = await verifyMagicLink(userId, secret);
      if (user) {
        setCurrentUser(user);
        // Clear the flag after successful verification
        localStorage.removeItem("magic_link_verifying");
        return user;
      }
      throw new Error("Failed to verify magic link");
    } catch (error) {
      console.error("Error verifying magic link:", error);
      // Clear the flag on error too
      localStorage.removeItem("magic_link_verifying");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCurrentUser = (user: UserData) => {
    setCurrentUser(user);
  };
  const refreshUserCredits = async () => {
    if (!currentUser || typeof window === "undefined") return;

    console.log("Refreshing user credits for:", currentUser.id);

    // For guest users, just get the current state from localStorage without resetting
    if (currentUser.isGuest) {
      const storedUser = localStorage.getItem(GUEST_USER_KEY);
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setCurrentUser(parsedUser);
          console.log(
            "Guest user credits refreshed from localStorage:",
            parsedUser.credits
          );
        } catch (e) {
          console.error("Error parsing guest user from localStorage:", e);
        }
      }
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
  }; // Force refresh the entire user session - useful after OAuth login
  const refreshUserSession = async () => {
    if (typeof window === "undefined") return null;

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
  const value: AuthContextType = {
    currentUser,
    isLoading,
    logOut,
    signInAnon,
    signInMagicLink,
    verifyMagicLinkSession,
    updateCurrentUser,
    refreshUserCredits,
    refreshUserSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
