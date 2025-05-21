import { NextRequest, NextResponse } from "next/server";
import { addCredits, recordPurchase } from "@/utils/creditService";
import { databases, DATABASE_ID, USERS_COLLECTION_ID } from "@/utils/appwrite";

// Define error type
interface AppError extends Error {
  response?: {
    data?: unknown;
    status?: number;
  };
}

// Create a simple direct credit addition function that interacts with Appwrite directly
async function addCreditsDirectly(userId: string, creditsToAdd: number) {
  console.log(
    `Attempting direct credit addition for user ${userId}: +${creditsToAdd} credits`
  );

  try {
    // First, get the current credits
    const user = await databases.getDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      userId
    );

    console.log("Current user state:", JSON.stringify(user));

    // Calculate new balance
    const currentCredits = user.credits || 0;
    const newCredits = currentCredits + creditsToAdd;

    console.log(`Updating credits from ${currentCredits} to ${newCredits}`);

    // Update the document
    await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, userId, {
      credits: newCredits,
    });

    console.log("Credits updated successfully");
    return newCredits;
  } catch (error) {
    console.error("Direct credit update error:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  console.log("Process purchase API called");

  try {
    const body = await request.json();
    console.log("Processing purchase manually:", body);

    const { userId, packageId, amount, credits } = body;
    console.log("Purchase details:", {
      userId,
      packageId,
      amount,
      credits,
      bodyType: typeof body,
      userIdType: typeof userId,
      creditsType: typeof credits,
    });

    if (!userId || !packageId) {
      console.error("Missing required fields:", { userId, packageId });
      return NextResponse.json(
        { error: "Missing required fields", details: { userId, packageId } },
        { status: 400 }
      );
    }

    // Validate inputs to avoid type errors
    // Check if this is a numeric string and convert it
    const creditsNumber =
      typeof credits === "string" ? parseInt(credits, 10) : credits || 0;
    const amountNumber =
      typeof amount === "string" ? parseFloat(amount) : amount || 0;

    console.log("Normalized values:", {
      creditsNumber,
      amountNumber,
      userId: typeof userId === "string" ? userId : String(userId),
    });

    // Try approach 1: Use the recordPurchase function
    try {
      console.log("Attempting to record purchase via recordPurchase function");
      const newBalance = await recordPurchase(
        userId,
        packageId,
        amountNumber,
        creditsNumber
      );

      return NextResponse.json({
        success: true,
        newBalance,
        message: "Credits added successfully",
      });
    } catch (error: unknown) {
      const err = error as AppError;
      console.error(
        "Error in recordPurchase:",
        err?.message || "Unknown error"
      );

      // Try approach 2: Use addCredits function
      try {
        console.log("Attempting addCredits fallback");
        const newBalance = await addCredits(userId, creditsNumber);
        return NextResponse.json({
          success: true,
          newBalance,
          message: "Credits added via addCredits fallback",
          wasFirstFailover: true,
        });
      } catch (error2: unknown) {
        const err2 = error2 as AppError;
        console.error(
          "Error in addCredits fallback:",
          err2?.message || "Unknown error"
        );

        // Final approach: Direct Appwrite interaction
        try {
          console.log("Attempting direct Appwrite interaction");
          const newBalance = await addCreditsDirectly(userId, creditsNumber);
          return NextResponse.json({
            success: true,
            newBalance,
            message: "Credits added via direct update",
            wasSecondFailover: true,
          });
        } catch (error3: unknown) {
          const err3 = error3 as AppError;
          console.error(
            "All credit addition methods failed:",
            err3?.message || "Unknown error"
          );

          // Return comprehensive error details
          return NextResponse.json(
            {
              error: "Failed to process purchase after multiple attempts",
              details: {
                initialError: err?.message || "Unknown error in recordPurchase",
                fallbackError: err2?.message || "Unknown error in addCredits",
                directError: err3?.message || "Unknown error in direct update",
              },
            },
            { status: 500 }
          );
        }
      }
    }
  } catch (error: unknown) {
    const err = error as AppError;
    console.error(
      "Fatal error in process-purchase API route:",
      err?.message || "Unknown error"
    );
    return NextResponse.json(
      {
        error: "Internal server error",
        details: err?.message || "Unknown processing error",
      },
      { status: 500 }
    );
  }
}
