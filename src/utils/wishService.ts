import { functions } from "./appwrite";
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
