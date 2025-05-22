import { NextRequest, NextResponse } from "next/server";
import { databases, DATABASE_ID } from "@/utils/appwrite";
import { ID, Models, Query } from "appwrite";

export async function GET(request: NextRequest) {
  try {
    console.log("Setting up collections...");
    const results = {
      collections: {} as Record<string, any>,
      errors: [] as string[],
    };

    // Check for purchases collection
    try {
      // Check if the purchases collection exists by trying to list its documents
      try {
        await databases.listDocuments(DATABASE_ID, "purchases", [
          Query.limit(1),
        ]);

        // If we get here, the collection exists
        console.log("Purchases collection already exists");
        results.collections.purchases = {
          exists: true,
        };
      } catch (error: any) {
        // If the error is that the collection doesn't exist, create it
        if (error.code === 404) {
          console.log("Creating purchases collection...");

          try {
            // Since we can't create collections via the SDK, we'll just report this
            console.log(
              "Please create the purchases collection manually in the Appwrite console"
            );
            console.log(
              "Required attributes: user_id (string), package_id (string), amount (integer), credits (integer), created_at (datetime)"
            );

            results.collections.purchases = {
              exists: false,
              manualCreationRequired: true,
              structure: {
                user_id: "string",
                package_id: "string",
                amount: "integer",
                credits: "integer",
                created_at: "datetime",
              },
            };

            results.errors.push(
              "Purchases collection needs to be created manually in the Appwrite console"
            );
          } catch (createError: any) {
            console.error("Error creating collection:", createError);
            results.errors.push(
              `Error creating collection: ${createError.message}`
            );
          }
        } else {
          // Some other error
          throw error;
        }
      }
    } catch (error: any) {
      console.error("Error setting up purchases collection:", error);
      results.errors.push(
        `Purchases collection error: ${error.message || "Unknown error"}`
      );
    }

    return NextResponse.json({
      success: results.errors.length === 0,
      message:
        results.errors.length === 0
          ? "Collections set up successfully"
          : "Some errors occurred",
      results,
    });
  } catch (error: any) {
    console.error("Setup collections error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to set up collections",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
