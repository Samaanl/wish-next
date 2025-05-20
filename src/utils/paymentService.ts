import axios from "axios";

// Credit packages available for purchase
export const CREDIT_PACKAGES = [
  {
    id: "basic",
    name: "Basic Package",
    price: 1,
    credits: 10,
    lemonSqueezyId: process.env.NEXT_PUBLIC_LS_BASIC_PACKAGE_ID || "",
  },
  {
    id: "premium",
    name: "Premium Package",
    price: 5,
    credits: 20,
    lemonSqueezyId: process.env.NEXT_PUBLIC_LS_PREMIUM_PACKAGE_ID || "",
  },
];

// Log environment variables for debugging
console.log(
  "NEXT_PUBLIC_LS_BASIC_PACKAGE_ID:",
  process.env.NEXT_PUBLIC_LS_BASIC_PACKAGE_ID
);
console.log(
  "NEXT_PUBLIC_LS_PREMIUM_PACKAGE_ID:",
  process.env.NEXT_PUBLIC_LS_PREMIUM_PACKAGE_ID
);

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

    // Find the package
    const selectedPackage = CREDIT_PACKAGES.find((pkg) => pkg.id === packageId);
    console.log("Selected package:", selectedPackage);

    if (!selectedPackage) {
      throw new Error("Invalid package selected");
    }

    if (!selectedPackage.lemonSqueezyId) {
      throw new Error("Lemon Squeezy variant ID not configured");
    }

    console.log("Making API request with:", {
      packageId: selectedPackage.lemonSqueezyId,
      userId,
      userEmail,
      custom: {
        user_id: userId,
        package_id: packageId,
        credits: selectedPackage.credits,
      },
    });

    // Create checkout URL with Lemon Squeezy via our API route
    const response = await axios.post("/api/create-checkout", {
      packageId: selectedPackage.lemonSqueezyId,
      userId,
      userEmail,
      custom: {
        user_id: userId,
        package_id: packageId,
        credits: selectedPackage.credits,
      },
    });

    if (!response.data.url) {
      throw new Error("Failed to get checkout URL from payment provider");
    }
    return response.data.url;
  } catch (error: unknown) {
    console.error("Error initializing checkout:", error);
    if (error && typeof error === "object" && "response" in error) {
      console.error(
        "Response error data:",
        (error as { response?: { data?: { error?: string } } }).response?.data
      );
      throw new Error(
        (error as { response?: { data?: { error?: string } } }).response?.data
          ?.error || "Payment service error"
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
  credits: number
) => {
  try {
    // This would make a call to your API which would then use creditService.recordPurchase
    const response = await axios.post("/api/process-purchase", {
      userId,
      packageId,
      amount,
      credits,
    });

    return response.data;
  } catch (error) {
    console.error("Error processing purchase:", error);
    throw error;
  }
};
