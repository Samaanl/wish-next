import axios from "axios";
import { getCurrentUser } from "./authService";

export interface CreditPackage {
  id: string;
  name: string;
  price: number;
  credits: number;
  lemonSqueezyId: string;
  description: string;
}

// Debug log to check environment variables
console.log("Environment variables:", {
  basicId: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_BASIC_ID,
  premiumId: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PREMIUM_ID,
});

// Credit packages available for purchase
export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "basic",
    name: "Basic Pack",
    price: 1,
    credits: 10, // Exactly 10 credits for $1 plan
    lemonSqueezyId: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_BASIC_ID || "",
    description: "Perfect for trying out the service",
  },
  {
    id: "premium",
    name: "Premium Pack",
    price: 5,
    credits: 100, // Exactly 100 credits for $5 plan
    lemonSqueezyId: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PREMIUM_ID || "",
    description: "Best value for frequent users",
  },
];

// Initialize Lemon Squeezy checkout
export const initializeCheckout = async (
  packageId: string,
  userId: string,
  userEmail: string
): Promise<string> => {
  try {
    console.log("Initialize checkout with params:", {
      packageId,
      userId,
      userEmail,
    });

    // Add extra verification to ensure we have a valid user ID
    let finalUserId = userId;
    let finalUserEmail = userEmail;

    // If user ID looks like a guest ID, double-check with getCurrentUser
    if (userId.startsWith("guest-")) {
      console.log("Guest user ID detected, double-checking authentication...");
      try {
        const currentUser = await getCurrentUser();
        console.log("getCurrentUser result:", currentUser);

        if (currentUser && !currentUser.isGuest) {
          console.log("Found authenticated user, using instead of guest!");
          finalUserId = currentUser.id;
          finalUserEmail = currentUser.email;
        } else {
          throw new Error("Please sign up or log in to purchase credits");
        }
      } catch (authError) {
        console.error("Auth verification error:", authError);
        throw new Error("Authentication error. Please try signing in again.");
      }
    }

    // Find the package
    const selectedPackage = CREDIT_PACKAGES.find((pkg) => pkg.id === packageId);
    console.log("Selected package:", selectedPackage);

    if (!selectedPackage) {
      throw new Error("Invalid package selected");
    }

    // Debug log to check the LemonSqueezy ID
    console.log(
      "LemonSqueezy ID for selected package:",
      selectedPackage.lemonSqueezyId
    );

    if (!selectedPackage.lemonSqueezyId) {
      throw new Error(
        "Lemon Squeezy variant ID not configured. Please check your environment variables."
      );
    }

    // Final check for guest users
    if (finalUserId.startsWith("guest-")) {
      throw new Error("Please sign up or log in to purchase credits");
    } // Generate unique session tracking ID
    const sessionTrackingId = `checkout_${finalUserId}_${Date.now()}`; // Save user info to localStorage for after-checkout recovery
    try {
      localStorage.setItem(
        "checkoutUserInfo",
        JSON.stringify({
          id: finalUserId,
          email: finalUserEmail,
          package: packageId,
          credits: selectedPackage.credits,
          timestamp: new Date().toISOString(),
          sessionId: sessionTrackingId,
        })
      );
      console.log("Saved checkout info to localStorage for recovery");
    } catch (storageError) {
      console.error("Failed to save to localStorage:", storageError);
      // Non-critical error, continue with checkout
    }
    console.log("Making API request with:", {
      packageId: selectedPackage.lemonSqueezyId,
      userId: finalUserId,
      userEmail: finalUserEmail,
      custom: {
        user_id: finalUserId,
        package_id: packageId,
        credits: String(selectedPackage.credits),
        session_tracking_id: sessionTrackingId,
      },
    });

    // Create checkout URL with Lemon Squeezy via our API route
    const response = await axios.post("/api/create-checkout", {
      packageId: selectedPackage.lemonSqueezyId,
      userId: finalUserId,
      userEmail: finalUserEmail,
      custom: {
        user_id: finalUserId,
        package_id: packageId,
        credits: String(selectedPackage.credits),
        session_tracking_id: sessionTrackingId,
      },
    });

    if (!response.data.url) {
      throw new Error("Failed to get checkout URL from payment provider");
    }
    return response.data.url;
  } catch (error: unknown) {
    console.error("Error initializing checkout:", error);
    if (error && typeof error === "object" && "response" in error) {
      const responseError = error as {
        response?: {
          data?: {
            error?: string;
            isGuestUser?: boolean;
          };
        };
      };

      console.error("Response error data:", responseError.response?.data);

      // Handle guest user error - throw specific error
      if (responseError.response?.data?.isGuestUser) {
        throw new Error("Please sign up or log in to purchase credits");
      }

      throw new Error(
        responseError.response?.data?.error || "Payment service error"
      );
    }
    throw error;
  }
};

// Process a successful purchase (this would be called from your webhook handler)
export const processSuccessfulPurchase = async (
  userId: string,
  packageId: string,
  amount: number,
  // credits parameter removed - credits are now enforced on the server based on packageId
) => {
  try {
    // This would make a call to your API which would then use creditService.recordPurchase
    // Credits are enforced on the server based on the packageId for security
    const response = await axios.post("/api/process-purchase", {
      userId,
      packageId,
      amount,
      // No credits parameter - server will determine the correct amount based on packageId
    });

    return response.data;
  } catch (error) {
    console.error("Error processing purchase:", error);
    throw error;
  }
};

// Get user info from localStorage if available (for recovery after payment)
export const getStoredCheckoutInfo = () => {
  try {
    const storedInfo = localStorage.getItem("checkoutUserInfo");
    if (storedInfo) {
      return JSON.parse(storedInfo);
    }
  } catch (e) {
    console.error("Failed to retrieve checkout info:", e);
  }
  return null;
};

// Enhanced checkout info storage with session tracking
export const storeCheckoutSession = (
  sessionId: string,
  userId: string,
  userEmail: string,
  packageId: string,
  credits: number
) => {
  try {
    const checkoutInfo = {
      sessionId,
      id: userId,
      email: userEmail,
      package: packageId,
      credits,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem("checkoutUserInfo", JSON.stringify(checkoutInfo));

    // Also store with session-specific key for easier lookup
    localStorage.setItem(
      `checkout_session_${sessionId}`,
      JSON.stringify(checkoutInfo)
    );

    console.log("Stored checkout session info:", checkoutInfo);
  } catch (error) {
    console.error("Failed to store checkout session:", error);
  }
};

// Get checkout info by session ID
export const getCheckoutSessionInfo = (sessionId: string) => {
  try {
    const sessionInfo = localStorage.getItem(`checkout_session_${sessionId}`);
    return sessionInfo ? JSON.parse(sessionInfo) : null;
  } catch (error) {
    console.error("Failed to get checkout session info:", error);
    return null;
  }
};

// Clean up old checkout sessions
export const cleanupOldCheckoutSessions = () => {
  try {
    const keys = Object.keys(localStorage);
    const checkoutKeys = keys.filter((key) =>
      key.startsWith("checkout_session_")
    );
    const now = new Date().getTime();

    checkoutKeys.forEach((key) => {
      try {
        const info = JSON.parse(localStorage.getItem(key) || "{}");
        const timestamp = new Date(info.timestamp).getTime();

        // Remove sessions older than 7 days
        if (now - timestamp > 7 * 24 * 60 * 60 * 1000) {
          localStorage.removeItem(key);
        }
      } catch (e) {
        // Remove invalid entries
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error("Failed to cleanup old checkout sessions:", error);
  }
};
