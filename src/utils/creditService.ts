import {
  databases,
  DATABASE_ID,
  USERS_COLLECTION_ID,
  PURCHASES_COLLECTION_ID,
} from "./appwrite";

// Check if user has enough credits
export const hasEnoughCredits = async (
  userId: string,
  requiredCredits = 1
): Promise<boolean> => {
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
  try {
    const user = await databases.getDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      userId
    );

    const newCreditBalance = user.credits + credits;

    await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, userId, {
      credits: newCreditBalance,
    });

    return newCreditBalance;
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
