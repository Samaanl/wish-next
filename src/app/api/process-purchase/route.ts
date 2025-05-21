import { NextRequest, NextResponse } from "next/server";
import { addCredits, recordPurchase } from "@/utils/creditService";
import { databases, DATABASE_ID, USERS_COLLECTION_ID } from "@/utils/appwrite";
import { ID } from "appwrite";

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

// Create a function to record the purchase details in a purchases collection
async function recordPurchaseInDatabase(
  userId: string,
  packageId: string,
  amount: number,
  credits: number
) {
  const PURCHASES_COLLECTION_ID = "purchases";

  try {
    console.log("Recording purchase in database:", {
      userId,
      packageId,
      amount,
      credits,
    });

    // Create a purchase record
    const purchase = await databases.createDocument(
      DATABASE_ID,
      PURCHASES_COLLECTION_ID,
      ID.unique(),
      {
        user_id: userId,
        package_id: packageId,
        amount: amount,
        credits: credits,
        timestamp: new Date().toISOString(),
        status: "completed",
      }
    );

    console.log("Purchase record created:", purchase.$id);
    return purchase;
  } catch (error) {
    console.error("Failed to record purchase:", error);
    // Non-critical error, don't throw
    return null;
  }
}

export async function POST(request: NextRequest) {
  console.log("Process purchase API called");

  try {
    const body = await request.json();
    console.log("Processing purchase manually:", body);

    const {
      userId,
      userEmail,
      packageId,
      amount,
      credits,
      forceUpdate,
      directUpdate,
      isRetry,
    } = body;
    console.log("Purchase details:", {
      userId,
      userEmail,
      packageId,
      amount,
      credits,
      forceUpdate: !!forceUpdate,
      directUpdate: !!directUpdate,
      isRetry: !!isRetry,
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

    // Create debug object to track each step
    const debug = {
      steps: [] as Array<{ step: string; result: string; error?: string }>,
      finalResult: null as null | {
        success: boolean;
        newBalance?: number;
        method?: string;
        message: string;
      },
    };

    // Try approach 1: Use the recordPurchase function
    try {
      console.log("Attempting to record purchase via recordPurchase function");
      debug.steps.push({ step: "recordPurchase", result: "attempting" });

      const newBalance = await recordPurchase(
        userId,
        packageId,
        amountNumber,
        creditsNumber
      );

      debug.steps[debug.steps.length - 1].result = "success";
      debug.finalResult = {
        success: true,
        newBalance,
        method: "recordPurchase",
        message: "Credits added successfully",
      };

      // Still try to record purchase in database
      await recordPurchaseInDatabase(
        userId,
        packageId,
        amountNumber,
        creditsNumber
      );

      return NextResponse.json({
        success: true,
        newBalance,
        message: "Credits added successfully",
        debug,
      });
    } catch (error: unknown) {
      const err = error as AppError;
      console.error(
        "Error in recordPurchase:",
        err?.message || "Unknown error"
      );

      debug.steps[debug.steps.length - 1].result = "failed";
      debug.steps[debug.steps.length - 1].error =
        err?.message || "Unknown error";

      // Try approach 2: Use addCredits function
      try {
        console.log("Attempting addCredits fallback");
        debug.steps.push({ step: "addCredits", result: "attempting" });

        const newBalance = await addCredits(userId, creditsNumber);

        debug.steps[debug.steps.length - 1].result = "success";
        debug.finalResult = {
          success: true,
          newBalance,
          method: "addCredits",
          message: "Credits added via addCredits fallback",
        };

        // Still try to record purchase in database
        await recordPurchaseInDatabase(
          userId,
          packageId,
          amountNumber,
          creditsNumber
        );

        return NextResponse.json({
          success: true,
          newBalance,
          message: "Credits added via addCredits fallback",
          wasFirstFailover: true,
          debug,
        });
      } catch (error2: unknown) {
        const err2 = error2 as AppError;
        console.error(
          "Error in addCredits fallback:",
          err2?.message || "Unknown error"
        );

        debug.steps[debug.steps.length - 1].result = "failed";
        debug.steps[debug.steps.length - 1].error =
          err2?.message || "Unknown error";

        // Final approach: Direct Appwrite interaction
        try {
          console.log("Attempting direct Appwrite interaction");
          debug.steps.push({ step: "directAppwrite", result: "attempting" });

          const newBalance = await addCreditsDirectly(userId, creditsNumber);

          debug.steps[debug.steps.length - 1].result = "success";
          debug.finalResult = {
            success: true,
            newBalance,
            method: "directAppwrite",
            message: "Credits added via direct update",
          };

          // Still try to record purchase in database
          await recordPurchaseInDatabase(
            userId,
            packageId,
            amountNumber,
            creditsNumber
          );

          return NextResponse.json({
            success: true,
            newBalance,
            message: "Credits added via direct update",
            wasSecondFailover: true,
            debug,
          });
        } catch (error3: unknown) {
          const err3 = error3 as AppError;
          console.error(
            "All credit addition methods failed:",
            err3?.message || "Unknown error"
          );

          debug.steps[debug.steps.length - 1].result = "failed";
          debug.steps[debug.steps.length - 1].error =
            err3?.message || "Unknown error";
          debug.finalResult = {
            success: false,
            message: "All methods failed",
          };

          // Return comprehensive error details
          return NextResponse.json(
            {
              error: "Failed to process purchase after multiple attempts",
              details: {
                initialError: err?.message || "Unknown error in recordPurchase",
                fallbackError: err2?.message || "Unknown error in addCredits",
                directError: err3?.message || "Unknown error in direct update",
              },
              debug,
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
