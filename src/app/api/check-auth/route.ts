import { NextRequest, NextResponse } from "next/server";
import {
  account,
  databases,
  DATABASE_ID,
  USERS_COLLECTION_ID,
} from "@/utils/appwrite";
import { Client, Account } from "appwrite";

export async function GET(request: NextRequest) {
  try {
    // Extract auth cookies from the request directly
    const appwriteCookies: Record<string, string> = {};

    // Get all cookies from the request
    request.cookies.getAll().forEach((cookie) => {
      appwriteCookies[cookie.name] = cookie.value;
    });

    // Initialize Appwrite client with cookies to maintain session
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "")
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT || "");

    // Build Cookie header with all relevant cookies
    const cookieHeader = Object.entries(appwriteCookies)
      .filter(([name]) => name.startsWith("a_"))
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");

    if (cookieHeader) {
      client.headers["Cookie"] = cookieHeader;
      console.log("Set cookie header:", cookieHeader.substring(0, 50) + "...");
    }

    const serverAccount = new Account(client);

    // Check Appwrite session
    let appwriteUser = null;
    let userData = null;
    let sessionInfo = null;

    // Try multiple methods to get the user
    try {
      // Try with original account instance
      appwriteUser = await account.get();
      console.log("Appwrite user found (original instance):", appwriteUser.$id);
    } catch (authError1) {
      console.error("Auth failed with original instance:", authError1);

      try {
        // Try with server account instance
        appwriteUser = await serverAccount.get();
        console.log("Appwrite user found (server instance):", appwriteUser.$id);
      } catch (authError2) {
        console.error("Auth failed with server instance:", authError2);

        // As a final fallback, extract user ID from cookie if present
        const userIdFromCookie = extractUserIdFromCookies(appwriteCookies);
        if (userIdFromCookie) {
          console.log("Using user ID from cookie:", userIdFromCookie);

          // Try to get user directly from database using the ID
          try {
            userData = await databases.getDocument(
              DATABASE_ID,
              USERS_COLLECTION_ID,
              userIdFromCookie
            );

            // Construct minimal user object
            appwriteUser = {
              $id: userIdFromCookie,
              email: userData.email,
              name: userData.name || "",
            };

            console.log("User reconstructed from database:", appwriteUser.$id);
          } catch (dbError) {
            console.error("Failed to get user from database:", dbError);
          }
        }
      }
    }

    if (appwriteUser) {
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
    }

    // If all attempts to get the user failed, try a last resort - check for user ID in headers
    if (!appwriteUser) {
      const userId = request.headers.get("x-user-id");
      if (userId) {
        try {
          console.log("Trying to get user from header ID:", userId);
          userData = await databases.getDocument(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            userId
          );

          // Construct minimal user object
          appwriteUser = {
            $id: userId,
            email: userData.email,
            name: userData.name || "",
          };

          console.log("User reconstructed from header ID:", appwriteUser.$id);
        } catch (dbError) {
          console.error("Failed to get user from header ID:", dbError);
        }
      }
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
        Object.entries(appwriteCookies).map(([name, value]) => [
          name,
          value.substring(0, 20) + "...",
        ])
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

// Helper function to extract user ID from cookies
function extractUserIdFromCookies(
  cookies: Record<string, string>
): string | null {
  // Look for cookies that might contain user ID information
  for (const [name, value] of Object.entries(cookies)) {
    if (name.includes("a_user")) {
      // Try to extract user ID, these cookies often contain encoded data
      const parts = value.split(".");
      try {
        // If it's a JWT-like structure, try to decode the payload
        if (parts.length > 1) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload && payload.userId) {
            return payload.userId;
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_) {
        // Ignore parsing errors
      }
    }
  }
  return null;
}
