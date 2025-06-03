import { NextRequest, NextResponse } from "next/server";
import { addCredits, recordPurchase } from "@/utils/creditService";
import { databases, DATABASE_ID, USERS_COLLECTION_ID } from "@/utils/appwrite";
import { ID, Query } from "appwrite";

// Define the purchases collection ID
const PURCHASES_COLLECTION_ID = "purchases";

// EMERGENCY FIX: Function to get exact credits based on package ID
function getCreditsForPackage(packageId: string): number {
  // Define exact credit amounts for each package
  switch (packageId) {
    case "basic":
      return 10;  // $1 plan gets exactly 10 credits
    case "premium":
      return 100; // $5 plan gets exactly 100 credits
    case "pro":
      return 500; // $20 plan gets exactly 500 credits
    default:
      return 10;  // Default to 10 credits for unknown packages
  }
}

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
  credits: number,
  transactionId?: string
) {
  try {
    console.log("STRICT DUPLICATE CHECK: Recording purchase in database:", {
      userId,
      packageId,
      amount,
      credits,
      transactionId,
    });

    // Use provided transaction ID or generate a unique one
    const purchaseId =
      transactionId ||
      `purchase_${userId}_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 7)}`;

    // CRITICAL FIX: Check if ANY purchase with this transaction ID exists
    // This prevents duplicate credit additions from different sources
    if (transactionId) {
      try {
        // First try exact match by ID
        try {
          const exactMatch = await databases.getDocument(
            DATABASE_ID,
            PURCHASES_COLLECTION_ID,
            transactionId
          );
          
          if (exactMatch) {
            console.log("DUPLICATE PREVENTED: Purchase already exists with exact ID:", transactionId);
            return { $id: transactionId, status: "already_exists", duplicate: true };
          }
        } catch (exactError) {
          // If not found by exact ID, continue to query search
        }
        
        // Then try query search for the transaction ID in any field
        const existingTransactions = await databases.listDocuments(
          DATABASE_ID,
          PURCHASES_COLLECTION_ID,
          [Query.equal("$id", transactionId)]
        );

        if (existingTransactions.total > 0) {
          console.log("DUPLICATE PREVENTED: Purchase already exists with transaction ID:", transactionId);
          return { $id: transactionId, status: "already_exists", duplicate: true };
        }
      } catch (error) {
        // Continue if there's an error in the duplicate check
        console.log("Error checking for duplicate transaction, will proceed with caution:", error);
      }
    }

    // Check if this exact purchase ID already exists to avoid conflicts
    try {
      const existingPurchase = await databases.getDocument(
        DATABASE_ID,
        PURCHASES_COLLECTION_ID,
        purchaseId
      );

      if (existingPurchase) {
        console.log("DUPLICATE PREVENTED: Purchase already exists with ID:", purchaseId);
        return { $id: purchaseId, status: "already_exists", duplicate: true };
      }
    } catch (error) {
      // 404 error is expected if the document doesn't exist
      console.log("Purchase doesn't exist, will create:", purchaseId);
    }

    // Create a purchase record with the unique ID
    try {
      const purchase = await databases.createDocument(
        DATABASE_ID,
        PURCHASES_COLLECTION_ID,
        purchaseId,
        {
          user_id: userId,
          package_id: packageId,
          amount: Math.round(amount), // Convert to integer as the field is integer type
          credits: credits,
          timestamp: new Date().toISOString(), // Add explicit timestamp for tracking
        }
      );

      console.log("Purchase record created:", purchase.$id);
      return purchase;
    } catch (error) {
      // Handle document ID conflict specifically
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === 409
      ) {
        console.log("Purchase record already exists with ID:", purchaseId);
        // Not a critical error for the overall flow
        return { $id: purchaseId, status: "already_exists", duplicate: true };
      }

      throw error;
    }
  } catch (error) {
    console.error("Failed to record purchase:", error);
    // Non-critical error, don't throw
    return null;
  }
}

export async function POST(request: NextRequest) {
  // Create debug object to track each step
  const debug = {
    steps: [] as Array<{ step: string; result: string; error?: string }>,
    finalResult: null as null | {
      success: boolean;
      newBalance?: number;
      method?: string;
      message: string;
    },
    requestData: {} as any, // Add requestData property to fix TypeScript error
    processingId: "", // Add processingId property to fix TypeScript error
  };
  
  try {
    // Parse the request body
    const requestData = await request.json();
    debug.requestData = requestData;
    
    // Extract the user ID from the request headers or body
    const userId = request.headers.get("x-user-id") || requestData.userId;
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: "User ID is required",
      });
    }
    
    // Extract other required fields
    const { packageId, amount, credits, transactionId, processingId } = requestData;
    if (!packageId || !amount) {
      return NextResponse.json({
        success: false,
        error: "Package ID and amount are required",
      });
    }

    // Convert amount to number
    const amountNumber = parseFloat(amount);
    
    // SECURITY FIX: Determine exact credits based on package, ignoring client input
    // This prevents tampering with credit amounts
    const packageCredits = getCreditsForPackage(packageId);
    const creditsNumber = packageCredits;
    
    // EMERGENCY FIX: Add a global lock in memory to prevent concurrent processing
    console.log("EMERGENCY DUPLICATE PREVENTION: Using global lock for transaction:", processingId || transactionId);

        // EMERGENCY FIX: Use a distributed lock approach to prevent concurrent processing
    // This is the most aggressive approach to prevent duplicate credit additions
    const finalProcessingId = processingId || transactionId || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    debug.processingId = finalProcessingId;
    
    // Create a unique lock ID for this transaction
    const lockId = `lock_${finalProcessingId}`;
    let lockAcquired = false;
    
    try {
      console.log("EMERGENCY DUPLICATE PREVENTION: Attempting to acquire lock for transaction:", finalProcessingId);
      debug.steps.push({ step: "acquireLock", result: "attempting" });
      
      // Try to create a lock document with a very short TTL
      try {
        await databases.createDocument(
          DATABASE_ID,
          PURCHASES_COLLECTION_ID,
          lockId,
          {
            user_id: userId,
            package_id: packageId,
            amount: amountNumber,
            credits: packageCredits,
            created_at: new Date().toISOString(),
            is_lock: true,
            lock_expiry: new Date(Date.now() + 60000).toISOString() // 1 minute lock
          }
        );
        lockAcquired = true;
        console.log("Lock acquired for transaction:", finalProcessingId);
        debug.steps[debug.steps.length - 1].result = "lock_acquired";
      } catch (lockError) {
        // If we can't create the lock, another process might have created it
        console.log("DUPLICATE PREVENTION: Failed to acquire lock, transaction may be in progress:", lockError);
        debug.steps[debug.steps.length - 1].result = "lock_failed";
        debug.finalResult = {
          success: true,
          method: "lock_prevention",
          message: "This transaction is already being processed"
        };
        
        return NextResponse.json({
          success: true,
          duplicate: true,
          message: "This transaction is already being processed",
          debug,
        });
      }
      
      // Now check for existing completed transactions to prevent duplicates
      console.log("DUPLICATE CHECK: Checking for completed transaction with ID:", finalProcessingId);
      debug.steps.push({ step: "checkDuplicate", result: "attempting" });
      
      // First check for exact ID match
      try {
        // Check for a non-lock document with this ID
        const existingDocs = await databases.listDocuments(
          DATABASE_ID,
          PURCHASES_COLLECTION_ID,
          [Query.equal("$id", finalProcessingId), Query.notEqual("is_lock", true)]
        );
        
        if (existingDocs.total > 0) {
          console.log("DUPLICATE TRANSACTION DETECTED - Direct ID match:", finalProcessingId);
          debug.steps[debug.steps.length - 1].result = "duplicate_found_direct";
          debug.finalResult = {
            success: true,
            method: "duplicate_prevention",
            message: "Credits were already added for this transaction"
          };
          
          return NextResponse.json({
            success: true,
            duplicate: true,
            message: "Credits were already added for this transaction",
            debug,
          });
        }
      } catch (directError) {
        // Continue to other checks
        console.log("Error in direct ID check:", directError);
      }
      
      // Then check for transactions with the same user and package in the last 5 minutes
      try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const recentTransactions = await databases.listDocuments(
          DATABASE_ID,
          PURCHASES_COLLECTION_ID,
          [
            Query.equal("user_id", userId),
            Query.equal("package_id", packageId),
            Query.greaterThan("timestamp", fiveMinutesAgo),
            Query.notEqual("is_lock", true)
          ]
        );
        
        if (recentTransactions.total > 0) {
          console.log(`DUPLICATE PREVENTION: Found ${recentTransactions.total} recent transactions for this user/package`);
          debug.steps[debug.steps.length - 1].result = "duplicate_found_recent";
          debug.finalResult = {
            success: true,
            method: "duplicate_prevention",
            message: "Credits were recently added for this package"
          };
          
          return NextResponse.json({
            success: true,
            duplicate: true,
            message: "Credits were recently added for this package",
            debug,
          });
        }
      } catch (recentError) {
        console.log("Error checking recent transactions:", recentError);
      }
      
      debug.steps[debug.steps.length - 1].result = "no_duplicate_found";
      console.log("NO DUPLICATE FOUND - Proceeding with credit addition");
    } catch (lockError) {
      console.error("Error with locking mechanism:", lockError);
      debug.steps.push({ step: "lockError", result: "failed", error: lockError instanceof Error ? lockError.message : "Unknown error" });
    }

    // Try approach 1: Use the recordPurchase function
    try {
      console.log("Attempting to record purchase via recordPurchase function");
      debug.steps.push({ step: "recordPurchase", result: "attempting" });
      
      // EMERGENCY FIX: Always use the packageCredits value from our getCreditsForPackage function
      // This ensures consistent credit amounts and prevents any client-side manipulation
      const creditsToAdd = packageCredits;
      
      console.log(`EMERGENCY FIX: Enforcing exact credit amount: ${creditsToAdd} for package ${packageId}`);
      
      console.log(`Enforcing exact credit amount: ${creditsToAdd} for package ${packageId}`);

      const newBalance = await recordPurchase(
        userId,
        packageId,
        amountNumber,
        creditsToAdd
      );

      debug.steps[debug.steps.length - 1].result = "success";
      debug.finalResult = {
        success: true,
        newBalance,
        method: "addCredits",
        message: "Credits added successfully"
      };

      // Still try to record purchase in database
      try {
        await recordPurchaseInDatabase(
          userId,
          packageId,
          amountNumber,
          creditsToAdd,
          finalProcessingId // Use our consistent finalProcessingId
        );
        debug.steps.push({ step: "recordPurchaseInDatabase", result: "success" });

        // EMERGENCY FIX: Release the lock after successful processing
        if (lockAcquired) {
          try {
            await databases.deleteDocument(
              DATABASE_ID,
              PURCHASES_COLLECTION_ID,
              lockId
            );
            console.log("Lock released for transaction:", finalProcessingId);
          } catch (unlockError) {
            console.log("Failed to release lock, will expire automatically:", unlockError);
          }
        }
      } catch (recordError) {
        console.error("Error recording purchase in database:", recordError);
        debug.steps.push({
          step: "recordPurchaseInDatabase",
          result: "failed",
          error: recordError instanceof Error ? recordError.message : "Unknown error",
        });
        // Non-critical error, continue
      }

      return NextResponse.json({
        success: true,
        newBalance,
        message: "Credits added successfully",
        debug,
      });
    } catch (error2) {
      const err2 = error2 as AppError;
      console.error(
        "Primary credit addition method failed:",
        err2?.message || "Unknown error"
      );

      debug.steps[debug.steps.length - 1].result = "failed";
      debug.steps[debug.steps.length - 1].error = err2?.message || "Unknown error";

      // Try approach 2: Use addCredits function as fallback
      try {
        console.log("Attempting addCredits fallback");
        debug.steps.push({ step: "addCredits", result: "attempting" });
        
        // EMERGENCY FIX: Always use the packageCredits value from our getCreditsForPackage function
        const creditsToAdd = packageCredits;
        console.log(`EMERGENCY FIX: Enforcing exact credit amount: ${creditsToAdd} for package ${packageId}`);
        
        console.log(`Enforcing exact credit amount: ${creditsToAdd} for package ${packageId}`);

        const newBalance = await addCredits(userId, creditsToAdd);

        debug.steps[debug.steps.length - 1].result = "success";
        debug.finalResult = {
          success: true,
          newBalance,
          method: "addCredits",
          message: "Credits added successfully"
        };

        // Still try to record purchase in database
        try {
          await recordPurchaseInDatabase(
            userId,
            packageId,
            amountNumber,
            creditsToAdd,
            processingId
          );
        } catch (dbErr) {
          // Non-critical error, don't fail the whole operation
          console.warn("Failed to record purchase in database:", dbErr);
        }

        return NextResponse.json({
          success: true,
          newBalance,
          message: "Credits added successfully",
          debug,
        });
      } catch (error2) {
        const err2 = error2 as AppError;
        console.error(
          "Error in addCredits:",
          err2?.message || "Unknown error"
        );

        debug.steps[debug.steps.length - 1].result = "failed";
        debug.steps[debug.steps.length - 1].error =
          err2?.message || "Unknown error";

        // Try approach 3: Direct database update as a last resort
        try {
          console.log("Attempting direct credit addition as last resort");
          debug.steps.push({ step: "directAddition", result: "attempting" });

          // Determine the correct credit amount based on the package ID
          let creditsToAdd = 0;
          if (packageId === "basic") {
            creditsToAdd = 10; // $1 plan gets exactly 10 credits
          } else if (packageId === "premium") {
            creditsToAdd = 100; // $5 plan gets exactly 100 credits
          } else {
            // Fallback to the requested credits only if it's a valid number and within reasonable limits
            creditsToAdd = Math.min(Math.max(0, creditsNumber), 1000); // Cap at 1000 credits for safety
          }
          
          console.log(`Enforcing exact credit amount: ${creditsToAdd} for package ${packageId}`);

          const newBalance = await addCreditsDirectly(userId, creditsToAdd);

          debug.steps[debug.steps.length - 1].result = "success";
          debug.finalResult = {
            success: true,
            newBalance,
            method: "directAddition",
            message: "Credits added successfully"
          };

          // Still try to record purchase in database
          try {
            await recordPurchaseInDatabase(
              userId,
              packageId,
              amountNumber,
              creditsToAdd,
              processingId
            );
          } catch (dbErr) {
            // Non-critical error, don't fail the whole operation
            console.warn("Failed to record purchase in database:", dbErr);
          }

          return NextResponse.json({
            success: true,
            newBalance,
            message: "Credits added successfully",
            debug,
          });
        } catch (error3) {
          const err3 = error3 as AppError;
          console.error(
            "All credit addition methods failed:",
            err3?.message || "Unknown error"
          );

          debug.steps[debug.steps.length - 1].result = "failed";
          debug.steps[debug.steps.length - 1].error =
            err3?.message || "Unknown error";

          return NextResponse.json(
            {
              error: "Failed to add credits after multiple attempts",
              details: err3?.message || "Unknown error",
              debug,
            },
            { status: 500 }
          );
        }
      }
    }
  } catch (error) {
    console.error("Unexpected error in process-purchase:", error);
    return NextResponse.json(
      {
        error: "Unexpected error processing purchase",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
