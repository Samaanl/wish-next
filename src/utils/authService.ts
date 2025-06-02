import {
  account,
  databases,
  functions,
  ID,
  DATABASE_ID,
  USERS_COLLECTION_ID,
} from "./appwrite";
import { OAuthProvider } from "appwrite";
import { DEFAULT_FREE_CREDITS } from "./constants";

export interface UserData {
  id: string;
  email: string;
  name?: string;
  credits: number;
  isGuest?: boolean;
}

export interface AppwriteUser {
  $id: string;
  email: string;
  name?: string;
  providers?: string[];
}

// Local storage key for guest user
export const GUEST_USER_KEY = "wishmaker_guest_user";
// Local storage key to track if free credits have been used on this device
export const FREE_CREDITS_USED_KEY = "wishmaker_free_credits_used";

// Utility function to add delay (kept minimal for basic use)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Check if free credits have already been used on this device
const hasFreeCreditsBeenUsed = (): boolean => {
  return localStorage.getItem(FREE_CREDITS_USED_KEY) === "true";
};

// Mark free credits as used on this device
const markFreeCreditsAsUsed = (): void => {
  localStorage.setItem(FREE_CREDITS_USED_KEY, "true");
};

// Creates a guest user with appropriate credits based on device usage
export const createGuestUser = (): UserData => {
  const guestId = `guest-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)}`;

  // If free credits have been used on this device, give 0 credits
  const credits = hasFreeCreditsBeenUsed() ? 0 : DEFAULT_FREE_CREDITS;

  const guestUser = {
    id: guestId,
    email: `guest-${guestId}@example.com`,
    name: "Guest User",
    credits: credits,
    isGuest: true,
  };

  // Save to local storage
  localStorage.setItem(GUEST_USER_KEY, JSON.stringify(guestUser));
  return guestUser;
};

// Gets guest user from local storage or creates a new one
export const getGuestUser = (): UserData => {
  const storedUser = localStorage.getItem(GUEST_USER_KEY);
  if (storedUser) {
    const user = JSON.parse(storedUser);
    // Double-check: if this device has used free credits but user has credits, reset to 0
    if (hasFreeCreditsBeenUsed() && user.credits > 0) {
      user.credits = 0;
      localStorage.setItem(GUEST_USER_KEY, JSON.stringify(user));
    }
    return user;
  }
  return createGuestUser();
};

// Function to mark free credits as used (should be called when guest user uses credits)
export const markGuestCreditsAsUsed = (): void => {
  markFreeCreditsAsUsed();
};

// Add a new function to store authenticated user in local storage for better persistence
export const storeUserInLocalStorage = (user: UserData) => {
  if (!user) return;

  // Don't store guest users with this method
  if (user.isGuest) return;

  localStorage.setItem("currentUser", JSON.stringify(user));
  console.log("User data stored in localStorage for persistence");
};

// Authentication functions
export const getCurrentUser = async (): Promise<UserData | null> => {
  try {
    const user = await account.get();
    console.log("Raw Appwrite user:", user);

    // Try to get user data from database
    try {
      const userData = await databases.getDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        user.$id
      );

      // If user has no email but is authenticated with Google
      if (
        !user.email &&
        (user as unknown as AppwriteUser).providers?.includes("google")
      ) {
        // Get the user's email from Google session
        const session = await account.getSession("current");
        console.log("Google session:", session);

        // Update the user's email in Appwrite
        if (session?.providerUid) {
          await account.updateEmail(session.providerUid, "");
          // Update the user in the database
          await databases.updateDocument(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            user.$id,
            {
              email: session.providerUid,
              name: user.name || session.providerUid.split("@")[0],
            }
          );

          const updatedUser = {
            id: user.$id,
            email: session.providerUid,
            name: user.name || session.providerUid.split("@")[0],
            credits: userData.credits,
          };

          // Store in localStorage for persistence
          storeUserInLocalStorage(updatedUser);
          return updatedUser;
        }
      }

      const authUser = {
        id: user.$id,
        email: user.email,
        name: user.name,
        credits: userData.credits,
      };

      // Store in localStorage for persistence
      storeUserInLocalStorage(authUser);
      return authUser;
    } catch {
      // User exists in auth but not in database - create record
      const email =
        user.email ||
        (user as AppwriteUser).providers?.[0] ||
        "user@example.com";
      await createUserInDatabase(user.$id, email, user.name || "User");

      const newUser = {
        id: user.$id,
        email,
        name: user.name || "User",
        credits: DEFAULT_FREE_CREDITS,
      };

      // Store in localStorage for persistence
      storeUserInLocalStorage(newUser);
      return newUser;
    }
  } catch (error) {
    console.error("Error getting current user:", error);

    // Try to get user from localStorage if Appwrite auth fails
    try {
      const storedUser = localStorage.getItem("currentUser");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log(
          "Using stored user data from localStorage:",
          parsedUser.email
        );

        // Verify this user exists in the database
        try {
          const userData = await databases.getDocument(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            parsedUser.id
          );

          // If we can fetch the user data, the user is valid
          return {
            ...parsedUser,
            credits: userData.credits, // Use the latest credits from DB
          };
        } catch (dbError) {
          console.warn("Stored user not found in database:", dbError);
          // Clear invalid stored user
          localStorage.removeItem("currentUser");
        }
      }
    } catch (storageError) {
      console.error("Error accessing localStorage:", storageError);
    }

    // Check if this is a permissions error for guest users
    if (
      error instanceof Error &&
      (error.message.includes("missing scope") ||
        error.message.includes("role: guests"))
    ) {
      console.log("Using guest user mode");
      // Use local guest user with default credits
      return getGuestUser();
    }

    return null;
  }
};

export const createUserInDatabase = async (
  userId: string,
  email: string,
  name: string
) => {
  return await databases.createDocument(
    DATABASE_ID,
    USERS_COLLECTION_ID,
    userId,
    {
      email,
      name,
      credits: DEFAULT_FREE_CREDITS,
      created_at: new Date(),
    }
  );
};

// Update user name in both Appwrite Auth and database
export const updateUserName = async (
  userId: string,
  name: string
): Promise<UserData | null> => {
  try {
    console.log("Updating user name in both Appwrite Auth and database:", {
      userId,
      name,
    });

    // First, update the user's name in Appwrite Auth
    try {
      await account.updateName(name);
      console.log("Successfully updated name in Appwrite Auth");
    } catch (authError) {
      console.warn("Failed to update name in Appwrite Auth:", authError);
      // Continue with database update even if auth update fails
    }

    // Update the user document in database
    await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, userId, {
      name,
    });
    console.log("Successfully updated name in database");

    // Get the updated user data
    const updatedUserDoc = await databases.getDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      userId
    );

    const updatedUser: UserData = {
      id: userId,
      email: updatedUserDoc.email,
      name: updatedUserDoc.name,
      credits: updatedUserDoc.credits,
    };

    // Update localStorage
    storeUserInLocalStorage(updatedUser);

    return updatedUser;
  } catch (error) {
    console.error("Error updating user name:", error);
    throw new Error("Failed to update name. Please try again.");
  }
};

export const signInWithGoogle = async () => {
  try {
    console.log("Starting Google OAuth flow");

    // Clear any existing session before starting OAuth
    try {
      await account.deleteSession("current");
      console.log("Cleared existing session before Google OAuth");
    } catch (sessionError) {
      // No existing session or failed to clear - that's fine, continue
      console.log(
        "No existing session to clear or failed to clear:",
        sessionError
      );
    }

    // Remove any previous guest user when starting OAuth flow
    localStorage.removeItem(GUEST_USER_KEY);

    // Save the current page URL to redirect back after auth
    const currentPath = window.location.pathname;
    if (currentPath !== "/auth/callback") {
      localStorage.setItem("auth_redirect", currentPath);
    }

    const callbackUrl = `${window.location.origin}/auth/callback`;
    console.log("OAuth callback URL:", callbackUrl);

    // Start the OAuth flow - this will redirect the browser
    await account.createOAuth2Session(
      OAuthProvider.Google,
      callbackUrl,
      `${window.location.origin}/auth/callback?error=failed`
    );

    // This will never be reached in normal flow since the browser redirects
    return true;
  } catch (error: Error | unknown) {
    console.error("Google sign in error:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to sign in with Google");
  }
};

export const signOut = async () => {
  try {
    await account.deleteSession("current");

    // Clear user data from localStorage
    localStorage.removeItem("currentUser");
    localStorage.removeItem("checkoutUserInfo");

    return true;
  } catch (error) {
    console.error("Error during sign out:", error);

    // Still clear localStorage even if Appwrite signout fails
    localStorage.removeItem("currentUser");
    localStorage.removeItem("checkoutUserInfo");

    return false;
  }
};

// Anonymous login for frictionless onboarding
export const signInAnonymously = async () => {
  try {
    const anonUser = await account.createAnonymousSession();

    // Create user in database with anonymous flag
    await createUserInDatabase(
      anonUser.userId,
      "anonymous@user.com",
      "Anonymous User"
    );

    return await getCurrentUser();
  } catch (error) {
    console.error("Error during anonymous sign in:", error);

    // If permission error, fall back to guest user
    if (
      error instanceof Error &&
      (error.message.includes("missing scope") ||
        error.message.includes("role: guests"))
    ) {
      console.log("Using guest user mode instead of anonymous auth");
      return getGuestUser();
    }

    throw error;
  }
};

// Get user by ID from database
export const getUserById = async (userId: string): Promise<UserData | null> => {
  try {
    const userData = await databases.getDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      userId
    );

    // Get user from account service to get email and name
    const user = await account.get();

    return {
      id: userId,
      email: user.email,
      name: user.name,
      credits: userData.credits,
    };
  } catch (error) {
    console.error("Error getting user by ID:", error);
    return null;
  }
};

// Health check function to verify Appwrite connection
export const checkAppwriteConnection = async (): Promise<boolean> => {
  try {
    // Try to get current session info (this will work even without being logged in)
    await account.get();
    return true;
  } catch (error) {
    // If error is about being unauthorized, that means connection is working
    if (error instanceof Error && error.message.includes("unauthorized")) {
      return true;
    }

    console.error("Appwrite connection test failed:", error);
    return false;
  }
};

// Magic Link Authentication Functions
export const signInWithMagicLink = async (email: string) => {
  try {
    console.log("Creating magic link session for:", email);

    // Clear any existing session before starting magic link flow
    try {
      await account.deleteSession("current");
      console.log("Cleared existing session before magic link");
    } catch (sessionError) {
      // No existing session or failed to clear - that's fine, continue
      console.log(
        "No existing session to clear or failed to clear:",
        sessionError
      );
    }

    // Remove any previous guest user when starting magic link flow
    localStorage.removeItem(GUEST_USER_KEY);

    // Save the current page URL to redirect back after auth
    const currentPath = window.location.pathname;
    if (currentPath !== "/auth/magic-link") {
      localStorage.setItem("auth_redirect", currentPath);
    }

    const callbackUrl = `${window.location.origin}/auth/magic-link`;
    console.log("Magic link callback URL:", callbackUrl); // Create magic link session using Appwrite's built-in method
    await account.createMagicURLToken(ID.unique(), email, callbackUrl);

    console.log("Magic link created successfully");
    return true;
  } catch (error: Error | unknown) {
    console.error("Magic link creation error:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to create magic link");
  }
};

// Global flag to prevent simultaneous magic link verifications
let isVerifyingMagicLink = false;

export const verifyMagicLink = async (userId: string, secret: string) => {
  try {
    // Check if we're already verifying a magic link
    if (isVerifyingMagicLink) {
      console.log("Magic link verification already in progress");
      throw new Error("Verification already in progress. Please wait.");
    } // Add rate limiting check FIRST - increased to 15 seconds to prevent rapid retries
    const lastVerifyAttempt = localStorage.getItem("last_magic_link_verify");
    const now = Date.now();

    if (lastVerifyAttempt && now - parseInt(lastVerifyAttempt) < 15000) {
      console.log("Rate limiting magic link verification attempt");
      throw new Error("Please wait before trying again");
    }

    // Set the global flag to prevent other attempts
    isVerifyingMagicLink = true;
    console.log("Verifying magic link session");
    localStorage.setItem("last_magic_link_verify", now.toString());

    // Add a small delay to reduce rate limiting issues
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Update the magic link session
    await account.updateMagicURLSession(userId, secret);

    // Get the current user after verification
    const user = await getCurrentUser();
    if (user && !user.isGuest) {
      // Store in localStorage for persistence
      storeUserInLocalStorage(user);
      // Clear the global flag on success
      isVerifyingMagicLink = false;
      return user;
    }

    // Clear the global flag on failure
    isVerifyingMagicLink = false;
    throw new Error("Failed to get user after magic link verification");
  } catch (error: Error | unknown) {
    console.error("Magic link verification error:", error);

    // Always clear the global flag on error
    isVerifyingMagicLink = false;

    // If it's a rate limit error, provide a specific message
    if (error instanceof Error && error.message.includes("Rate limit")) {
      throw new Error("Too many attempts. Please wait a moment and try again.");
    }

    throw error instanceof Error
      ? error
      : new Error("Failed to verify magic link");
  }
};
