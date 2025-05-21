import {
  account,
  databases,
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

// Creates a guest user with default credits
export const createGuestUser = (): UserData => {
  const guestId = `guest-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)}`;
  const guestUser = {
    id: guestId,
    email: `guest-${guestId}@example.com`,
    name: "Guest User",
    credits: DEFAULT_FREE_CREDITS,
    isGuest: true,
  };

  // Save to local storage
  localStorage.setItem(GUEST_USER_KEY, JSON.stringify(guestUser));
  return guestUser;
};

// Gets guest user from local storage or creates a new one
export const getGuestUser = (): UserData | null => {
  const storedUser = localStorage.getItem(GUEST_USER_KEY);
  if (storedUser) {
    return JSON.parse(storedUser);
  }
  return createGuestUser();
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
          return {
            id: user.$id,
            email: session.providerUid,
            name: user.name || session.providerUid.split("@")[0],
            credits: userData.credits,
          };
        }
      }

      return {
        id: user.$id,
        email: user.email,
        name: user.name,
        credits: userData.credits,
      };
    } catch {
      // User exists in auth but not in database - create record
      const email =
        user.email ||
        (user as AppwriteUser).providers?.[0] ||
        "user@example.com";
      await createUserInDatabase(user.$id, email, user.name || "User");

      return {
        id: user.$id,
        email,
        name: user.name || "User",
        credits: DEFAULT_FREE_CREDITS,
      };
    }
  } catch (error) {
    console.error("Error getting current user:", error);

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

export const signInWithGoogle = async () => {
  try {
    const session = await account.createOAuth2Session(
      OAuthProvider.Google,
      `${window.location.origin}/auth/callback`,
      `${window.location.origin}/auth/callback`
    );
    return session;
  } catch (error: Error | unknown) {
    console.error("Google sign in error:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to sign in with Google");
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    await account.createSession(email, password);
    return await getCurrentUser();
  } catch (error) {
    console.error("Error during sign in:", error);
    throw error;
  }
};

export const signUpWithEmail = async (
  email: string,
  password: string,
  name: string
) => {
  try {
    const user = await account.create(ID.unique(), email, password, name);
    await account.createSession(email, password);

    // Create user in database
    await createUserInDatabase(user.$id, email, name);

    return await getCurrentUser();
  } catch (error) {
    console.error("Error during sign up:", error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await account.deleteSession("current");
    return true;
  } catch (error) {
    console.error("Error during sign out:", error);
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

// Convert anonymous account to permanent
export const convertAnonymousAccount = async (
  email: string,
  password: string,
  name: string
) => {
  try {
    // First check if we're logged in as anonymous
    const currentUser = await account.get();

    if (!currentUser) {
      throw new Error("No user is currently logged in");
    }

    // Update the anonymous account with email, password and name
    await account.updateEmail(email, password);
    await account.updateName(name);

    // Update the user in the database
    await databases.updateDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      currentUser.$id,
      {
        email,
        name,
      }
    );

    return await getCurrentUser();
  } catch (error) {
    console.error("Error converting anonymous account:", error);
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
