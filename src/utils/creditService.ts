import {
  databases,
  DATABASE_ID,
  USERS_COLLECTION_ID,
  PURCHASES_COLLECTION_ID,
} from "./appwrite";

// Local storage key for guest user - must be the same as in authService.ts
const GUEST_USER_KEY = "wishmaker_guest_user";

// Helper functions for guest users
const getGuestUserFromLocalStorage = () => {
  const storedUser = localStorage.getItem(GUEST_USER_KEY);
  return storedUser ? JSON.parse(storedUser) : null;
};

const updateGuestUserInLocalStorage = (credits: number) => {
  const guestUser = getGuestUserFromLocalStorage();
  if (guestUser) {
    guestUser.credits = credits;
    localStorage.setItem(GUEST_USER_KEY, JSON.stringify(guestUser));
    return guestUser;
  }
  return null;
};

// Check if user has enough credits
export const hasEnoughCredits = async (
  userId: string,
  requiredCredits = 1
): Promise<boolean> => {
  // Check if this is a guest user
  if (userId.startsWith("guest-")) {
    const guestUser = getGuestUserFromLocalStorage();
    return guestUser ? guestUser.credits >= requiredCredits : false;
  }

  // Normal Appwrite user
  try {
    const user = await databases.getDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      userId
    );

    return user.credits >= requiredCredits;
  } catch (error) {
    console.error("Error checking user credits:", error);
    return false;
  }
};

// Deduct credits after generating a wish
export const deductCredits = async (
  userId: string,
  credits = 1
): Promise<number> => {
  // Check if this is a guest user
  if (userId.startsWith("guest-")) {
    const guestUser = getGuestUserFromLocalStorage();
    if (guestUser) {
      const newCreditBalance = Math.max(0, guestUser.credits - credits);
      updateGuestUserInLocalStorage(newCreditBalance);
      return newCreditBalance;
    }
    throw new Error("Guest user not found");
  }

  // Normal Appwrite user
  try {
    const user = await databases.getDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      userId
    );

    const newCreditBalance = Math.max(0, user.credits - credits);

    await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, userId, {
      credits: newCreditBalance,
    });

    return newCreditBalance;
  } catch (error) {
    console.error("Error deducting credits:", error);
    throw error;
  }
};

// Add credits after purchase
export const addCredits = async (
  userId: string,
  credits: number
): Promise<number> => {
  // Check if this is a guest user
  if (userId.startsWith("guest-")) {
    const guestUser = getGuestUserFromLocalStorage();
    if (guestUser) {
      const newCreditBalance = guestUser.credits + credits;
      updateGuestUserInLocalStorage(newCreditBalance);
      return newCreditBalance;
    }
    throw new Error("Guest user not found");
  }

  // Normal Appwrite user - use a transaction-like approach
  try {
    console.log(`Adding ${credits} credits to user ${userId}`);

    // First get current state
    const user = await databases.getDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      userId
    );

    const currentCredits = user.credits || 0;
    console.log(`Current credits: ${currentCredits}`);

    const newCreditBalance = currentCredits + credits;
    console.log(`New credit balance will be: ${newCreditBalance}`);

    // Update the document
    const updatedUser = await databases.updateDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      userId,
      {
        credits: newCreditBalance,
      }
    );

    console.log(
      `Credits updated successfully. New balance: ${updatedUser.credits}`
    );
    return updatedUser.credits;
  } catch (error) {
    console.error("Error adding credits:", error);
    throw error;
  }
};

// Add a purchase record
export const recordPurchase = async (
  userId: string,
  packageId: string,
  amount: number,
  credits: number
) => {
  // Guest users can't make purchases directly
  if (userId.startsWith("guest-")) {
    throw new Error("Guest users need to register before making purchases");
  }

  try {
    await databases.createDocument(
      DATABASE_ID,
      PURCHASES_COLLECTION_ID,
      "unique()",
      {
        user_id: userId,
        package_id: packageId,
        amount,
        credits,
        created_at: new Date(),
      }
    );

    // Add the credits to the user's account
    return await addCredits(userId, credits);
  } catch (error) {
    console.error("Error recording purchase:", error);
    throw error;
  }
};

// Handle refunds
export const refundPurchase = async (
  userId: string,
  packageId: string,
  amount: number,
  credits: number
) => {
  // Guest users can't receive refunds
  if (userId.startsWith("guest-")) {
    throw new Error("Guest users are not eligible for refunds");
  }

  try {
    // Record the refund
    await databases.createDocument(
      DATABASE_ID,
      PURCHASES_COLLECTION_ID,
      "unique()",
      {
        user_id: userId,
        package_id: packageId,
        amount: -amount, // Negative amount to indicate refund
        credits: -credits, // Negative credits to indicate refund
        created_at: new Date(),
        type: "refund",
      }
    );

    // Deduct the credits from the user's account
    return await deductCredits(userId, credits);
  } catch (error) {
    console.error("Error processing refund:", error);
    throw error;
  }
};
