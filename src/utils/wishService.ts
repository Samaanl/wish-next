import {
  functions,
  databases,
  DATABASE_ID,
  WISHES_COLLECTION_ID,
  ID,
  Query,
} from "./appwrite";
import { ExecutionMethod } from "appwrite";
import { hasEnoughCredits, deductCredits } from "./creditService";

export interface WishInputs {
  occasion: string;
  tone: string;
  recipientName: string;
  relationship: string;
  memorableEvent?: string;
  hobby?: string;
  age?: string;
  messageLength?: string;
  messageFormat?: string;
}

export interface WishResult {
  wish: string;
  creditsRemaining: number;
}

// Function to save a wish to the database
export const saveWishToDatabase = async (
  userId: string,
  wishText: string,
  occasion: string
): Promise<void> => {
  try {
    await databases.createDocument(
      DATABASE_ID,
      WISHES_COLLECTION_ID,
      ID.unique(),
      {
        user_id: userId,
        wish_text: wishText,
        occasion: occasion,
        created_at: new Date().toISOString(),
      }
    );
    console.log("Wish saved to database successfully");
  } catch (error) {
    console.error("Error saving wish to database:", error);
    // Don't throw the error to avoid breaking the main flow
    // The wish generation was successful, saving is just a bonus feature
  }
};

// Function to retrieve saved wishes for a user
export const getSavedWishes = async (userId: string) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      WISHES_COLLECTION_ID,
      [
        Query.equal("user_id", userId),
        Query.orderDesc("created_at"),
        Query.limit(50), // Limit to last 50 wishes
      ]
    );
    return response.documents;
  } catch (error) {
    console.error("Error fetching saved wishes:", error);
    return [];
  }
};

export const generateWish = async (
  inputs: WishInputs,
  userId: string
): Promise<WishResult> => {
  try {
    // First check if user has enough credits
    const hasCredits = await hasEnoughCredits(userId);

    if (!hasCredits) {
      throw new Error("INSUFFICIENT_CREDITS");
    }

    // Call the Appwrite function that will handle the Gemini API
    const execution = await functions.createExecution(
      process.env.NEXT_PUBLIC_APPWRITE_FUNCTION_ID || "682abef000096a085636",
      JSON.stringify(inputs), // body
      false, // async
      "/wish-generator", // path
      ExecutionMethod.POST, // method
      { "Content-Type": "application/json" } // headers
    );

    if (execution.status === "completed") {
      // Deduct a credit for successful generation
      const creditsRemaining = await deductCredits(userId);

      const result = JSON.parse(execution.responseBody);

      // Save the wish to database if user is authenticated (not a guest user)
      if (userId && !userId.startsWith("guest_")) {
        try {
          await saveWishToDatabase(userId, result.wish, inputs.occasion);
        } catch (saveError) {
          console.warn("Failed to save wish to database:", saveError);
          // Continue with the normal flow even if saving fails
        }
      }

      return {
        wish: result.wish,
        creditsRemaining,
      };
    } else {
      throw new Error("Wish generation failed: " + execution.status);
    }
  } catch (error) {
    console.error("Error generating wish:", error);
    throw error;
  }
};

// Function to delete a single wish from the database
export const deleteWishFromDatabase = async (wishId: string): Promise<void> => {
  try {
    await databases.deleteDocument(DATABASE_ID, WISHES_COLLECTION_ID, wishId);
    console.log("Wish deleted successfully");
  } catch (error) {
    console.error("Error deleting wish:", error);
    throw error;
  }
};

// Function to delete multiple wishes from the database
export const deleteBulkWishesFromDatabase = async (
  wishIds: string[]
): Promise<void> => {
  try {
    // Delete wishes in parallel for better performance
    const deletePromises = wishIds.map((id) =>
      databases.deleteDocument(DATABASE_ID, WISHES_COLLECTION_ID, id)
    );

    await Promise.all(deletePromises);
    console.log(`${wishIds.length} wishes deleted successfully`);
  } catch (error) {
    console.error("Error deleting wishes:", error);
    throw error;
  }
};
