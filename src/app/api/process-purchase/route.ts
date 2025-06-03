import { NextRequest, NextResponse } from "next/server";
import { addCredits, recordPurchase } from "@/utils/creditService";
import { databases, DATABASE_ID, USERS_COLLECTION_ID } from "@/utils/appwrite";
import { ID, Query } from "appwrite";

// Define the purchases collection ID
const PURCHASES_COLLECTION_ID = "purchases";

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
  try {
    const body = await request.json();
    console.log("Process purchase request received:", body);

    // Extract and validate required fields
    const {
      userId,
      packageId,
      amount,
      credits,
      processingId, // Unique ID for this processing attempt
    } = body;

    // Basic validation
    if (!userId || !packageId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Convert amount to number if it's a string
    const amountNumber = typeof amount === "string" ? parseFloat(amount) : amount;
    const creditsNumber =
      typeof credits === "string" ? parseInt(credits) : credits;

    // Check if user exists
    try {
      const user = await databases.getDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        userId
      );

      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
    } catch (error) {
      console.log(
        "Error checking user credits, will continue with processing:",
        error
      );
    }

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

    // CRITICAL FIX: Check for duplicate transactions first
    // This prevents multiple credit additions for the same transaction
    if (processingId) {
      try {
        console.log("DUPLICATE CHECK: Checking for transaction with ID:", processingId);
        debug.steps.push({ step: "checkDuplicate", result: "attempting" });
        
        // First check in the purchases collection directly
        try {
          const existingDoc = await databases.getDocument(
            DATABASE_ID,
            PURCHASES_COLLECTION_ID,
            processingId
          );
          
          if (existingDoc) {
            console.log("DUPLICATE TRANSACTION DETECTED - Direct ID match:", processingId);
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
          // If not found by direct ID, continue to other checks
          console.log("No direct ID match found, continuing checks...");
        }
        
        // Then check with a query to find any similar transaction IDs
        try {
          const existingTransactions = await databases.listDocuments(
            DATABASE_ID,
            PURCHASES_COLLECTION_ID,
            [Query.equal("user_id", userId), Query.equal("package_id", packageId)]
          );
          
          // Check if any existing transaction has a similar ID pattern
          if (existingTransactions.total > 0) {
            console.log(`Found ${existingTransactions.total} previous transactions for this user/package`);
            
            // Check if any of these transactions match our processing ID pattern
            const baseIdPattern = processingId.split('_').slice(0, 3).join('_');
            const matchingTransaction = existingTransactions.documents.find(doc => 
              doc.$id.includes(baseIdPattern) || 
              (doc.transaction_id && doc.transaction_id.includes(baseIdPattern))
            );
            
            if (matchingTransaction) {
              console.log("DUPLICATE TRANSACTION DETECTED - Similar ID pattern:", matchingTransaction.$id);
              debug.steps[debug.steps.length - 1].result = "duplicate_found_similar";
              debug.finalResult = {
                success: true,
                method: "duplicate_prevention",
                message: "Credits were already added for a similar transaction"
              };
              
              return NextResponse.json({
                success: true,
                duplicate: true,
                message: "Credits were already added for this transaction",
                debug,
              });
            }
          }
        } catch (queryError) {
          console.log("Error in query-based duplicate check:", queryError);
          // Continue to next check
        }
        
        // Finally, try to create a purchase record as a definitive check
        const purchaseRecord = await recordPurchaseInDatabase(
          userId,
          packageId,
          amountNumber,
          0, // Credits will be determined later
          processingId
        );
        
        if (purchaseRecord && purchaseRecord.duplicate === true) {
          console.log("DUPLICATE TRANSACTION DETECTED - Purchase record already exists");
          debug.steps[debug.steps.length - 1].result = "duplicate_found_record";
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
        
        debug.steps[debug.steps.length - 1].result = "no_duplicate_found";
        console.log("NO DUPLICATE FOUND - Proceeding with credit addition");
      } catch (dupError) {
        console.error("Error checking for duplicates:", dupError);
        debug.steps[debug.steps.length - 1].result = "check_failed";
        debug.steps[debug.steps.length - 1].error = 
          dupError instanceof Error ? dupError.message : "Unknown error";
        // Continue with processing, but be cautious
      }
    }

    // Try approach 1: Use the recordPurchase function
    try {
      console.log("Attempting to record purchase via recordPurchase function");
      debug.steps.push({ step: "recordPurchase", result: "attempting" });
      
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
        method: "recordPurchase",
        message: "Credits added successfully"
      };

      // Still try to record purchase in database if not already done
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
    } catch (error1) {
      const err1 = error1 as AppError;
      console.error(
        "Error in recordPurchase:",
        err1?.message || "Unknown error"
      );

      debug.steps[debug.steps.length - 1].result = "failed";
      debug.steps[debug.steps.length - 1].error =
        err1?.message || "Unknown error";

      // Try approach 2: Use addCredits function
      try {
        console.log("Attempting addCredits fallback");
        debug.steps.push({ step: "addCredits", result: "attempting" });

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
