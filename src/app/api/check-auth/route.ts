import { NextRequest, NextResponse } from "next/server";
import {
  account,
  databases,
  DATABASE_ID,
  USERS_COLLECTION_ID,
} from "@/utils/appwrite";

export async function GET(request: NextRequest) {
  try {
    // Check Appwrite session
    let appwriteUser = null;
    let userData = null;
    let sessionInfo = null;

    try {
      appwriteUser = await account.get();
      console.log("Appwrite user found:", appwriteUser.$id);

      try {
        // Get user data from database
        userData = await databases.getDocument(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          appwriteUser.$id
        );
        console.log("User document found:", userData.email);
      } catch (dbError) {
        console.error("Database user not found:", dbError);
      }

      try {
        // Get current session
        sessionInfo = await account.getSession("current");
        console.log("Current session:", sessionInfo);
      } catch (sessionError) {
        console.error("No active session:", sessionError);
      }
    } catch (authError) {
      console.error("No authenticated user:", authError);
    }

    return NextResponse.json({
      authenticated: !!appwriteUser,
      user: appwriteUser
        ? {
            id: appwriteUser.$id,
            email: appwriteUser.email,
            name: appwriteUser.name,
            // Include additional user properties as needed
          }
        : null,
      userData: userData,
      session: sessionInfo,
      cookiesPresent: Object.fromEntries(
        request.cookies
          .getAll()
          .map((c) => [c.name, c.value.substring(0, 20) + "..."])
      ),
      headers: Object.fromEntries(request.headers),
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      {
        error: "Failed to check authentication",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
