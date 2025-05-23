"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import CelebrationEffects from "@/components/CelebrationEffects";
import axios, { AxiosError } from "axios";
import { CREDIT_PACKAGES, getStoredCheckoutInfo } from "@/utils/paymentService";
import { getCurrentUser } from "@/utils/authService";

// Defines types
interface ErrorDetails {
  message: string;
  response?: unknown;
  stack?: string;
}

// Define auth info structure
interface AuthInfo {
  authenticated: boolean;
  user: {
    id: string;
    email: string;
    name?: string;
  } | null;
  userData?: unknown;
  session?: unknown;
  cookiesPresent?: Record<string, string>;
  headers?: Record<string, string>;
}

interface DebugInfo {
  userId?: string;
  userEmail?: string;
  packageId: string;
  packageName?: string;
  packageCredits: number;
  sessionId: string | null;
  authInfo?: AuthInfo;
  manualProcessAttempted?: boolean;
  manualProcessResult?: {
    success: boolean;
    newBalance?: number;
    message?: string;
    [key: string]: unknown;
  };
}

// Add a helper function to make authenticated API calls with user ID in header
const makeAuthenticatedRequest = async (
  url: string,
  data: Record<string, unknown> | null = null,
  method: string = "GET"
) => {
  // Get user ID from wherever available
  let userId = null;

  // Try from currentUser context
  const currentUserObj = window.localStorage.getItem("currentUser");
  if (currentUserObj) {
    try {
      const user = JSON.parse(currentUserObj);
      userId = user.id;
    } catch (_) {
      // Ignore parsing errors
    }
  }

  // Try from checkoutUserInfo if available
  const checkoutInfo = window.localStorage.getItem("checkoutUserInfo");
  if (checkoutInfo && !userId) {
    try {
      const info = JSON.parse(checkoutInfo);
      userId = info.id;
    } catch (_) {
      // Ignore parsing errors
    }
  }

  // Create request config
  const config = {
    headers: userId ? { "x-user-id": userId } : {},
    method,
    ...(data && method !== "GET" ? { data } : {}),
  };

  console.log(
    `Making ${method} request to ${url} with user ID: ${userId || "none"}`
  );

  // Make the request
  if (method === "GET") {
    return axios.get(url, config);
  } else {
    return axios.post(url, data, config);
  }
};

function ThankYouContent() {
  const { currentUser, refreshUserCredits, refreshUserSession } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const packageId = searchParams.get("package_id") || "basic"; // Default to basic if not specified
  const [isLoading, setIsLoading] = useState(true);
  const [creditsRefreshed, setCreditsRefreshed] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

  // Track credit updates
  const [initialCredits, setInitialCredits] = useState<number | null>(null);
  const [finalCredits, setFinalCredits] = useState<number | null>(null);

  // Direct update function - doesn't require authentication check first
  const directCreditUpdate = useCallback(async () => {
    try {
      setProcessingStatus("Directly processing purchase...");

      // Find the corresponding package first
      const selectedPackage = CREDIT_PACKAGES.find(
        (pkg) => pkg.id === packageId
      );
      const packageCredits = selectedPackage?.credits || 10;

      // Get user data - either from context, localStorage checkout info, or general localStorage as fallback
      let userId = currentUser?.id;
      let userEmail = currentUser?.email;

      if (!userId) {
        // First try to get from checkout-specific localStorage
        const checkoutInfo = getStoredCheckoutInfo();
        if (checkoutInfo && checkoutInfo.id) {
          console.log("Using stored checkout info:", checkoutInfo);
          userId = checkoutInfo.id;
          userEmail = checkoutInfo.email;
        } else {
          // Try to get from general localStorage as fallback
          const storedUser = localStorage.getItem("currentUser");
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              userId = parsedUser.id;
              userEmail = parsedUser.email;
            } catch (_) {
              // Ignore parsing errors
            }
          }
        }
      }

      if (!userId) {
        throw new Error("Cannot identify user for credit update");
      }

      console.log("Attempting direct credit update for user:", userId);

      // Generate a transaction ID using sessionId + packageId and timestamp to ensure uniqueness
      const transactionId = `tx_${
        sessionId || "unknown"
      }_${packageId}_${Date.now()}`;

      // Call manual processing endpoint with direct user ID
      const response = await makeAuthenticatedRequest(
        "/api/process-purchase",
        {
          userId,
          userEmail,
          packageId,
          amount: selectedPackage?.price || 1,
          credits: packageCredits,
          directUpdate: true,
          transactionId, // Add transaction ID for idempotency
        } as Record<string, unknown>,
        "POST"
      );

      // Update debug info
      setDebugInfo((prev) => ({
        ...(prev || {
          packageId,
          sessionId,
          packageCredits: packageCredits,
        }),
        userId,
        userEmail,
        manualProcessAttempted: true,
        manualProcessResult: response.data,
      }));

      if (response.data.success) {
        setProcessingStatus("Credits added successfully!");

        // Refresh user data
        await refreshUserCredits();

        // Get fresh user data
        const updatedUser = await getCurrentUser();
        if (updatedUser) {
          setFinalCredits(updatedUser.credits);
        }

        // Mark this purchase as processed in this session using just the sessionId
        // Store a timestamp to know when it was processed
        const sessionKey = `processed_${sessionId}`;
        sessionStorage.setItem(sessionKey, Date.now().toString());

        // Mark for home page refresh
        localStorage.setItem("credits_need_refresh", "true");

        setIsLoading(false);
      } else {
        throw new Error(response.data.error || "Unknown error");
      }
    } catch (error) {
      const err = error as Error;
      console.error("Direct credit update failed:", err);
      setProcessingStatus(
        "Error updating credits. Please try the Retry button."
      );
      setErrorDetails({
        message: err.message,
        stack: err.stack,
        response: error instanceof AxiosError ? error.response?.data : null,
      });
      setIsLoading(false);
    }
  }, [
    currentUser,
    packageId,
    sessionId,
    refreshUserCredits,
    setDebugInfo,
    setErrorDetails,
    setFinalCredits,
    setIsLoading,
    setProcessingStatus,
  ]);

  useEffect(() => {
    // If there's no session ID, redirect to homepage
    if (!sessionId) {
      router.push("/");
      return;
    }

    // Create a unique key for this specific purchase that includes the timestamp
    // This ensures we can differentiate between multiple purchases of the same package
    const purchaseKey = `${sessionId}`;
    const processingKey = `processing_${purchaseKey}`;

    // Check if this exact purchase is already being processed in another component instance
    const processingData = sessionStorage.getItem(processingKey);
    const alreadyProcessingInThisSession = processingData
      ? Date.now() - parseInt(processingData) < 30000
      : false; // Only consider it processing if less than 30 seconds

    // For processed purchases, we still want to allow the same package to be purchased multiple times
    // So we check if this specific sessionId has been processed, not the package type
    const sessionKey = `processed_${sessionId}`;
    const alreadyProcessed = sessionStorage.getItem(sessionKey);

    if (alreadyProcessed) {
      console.log(`Purchase with session ID ${sessionId} already processed`);

      // Check if this is a new purchase with the same package by comparing timestamps
      const processedTime = parseInt(alreadyProcessed);
      const currentTime = Date.now();
      const timeSinceProcessed = currentTime - processedTime;

      // If it's been less than 5 seconds since this exact session was processed,
      // likely it's a page refresh/reload, so we skip processing
      if (timeSinceProcessed < 5000) {
        console.log("Recent duplicate detection - likely a page refresh");
        setIsLoading(false);
        localStorage.setItem("credits_need_refresh", "true");
        return;
      } else {
        // It's been a while, so this could be a new purchase of the same package type
        console.log(
          "Same package purchased again after previous purchase completed"
        );
        // Continue with processing
      }
    }

    if (alreadyProcessingInThisSession) {
      console.log(
        "This purchase is already being processed in another tab/window"
      );
      setIsLoading(false);
      return;
    }

    // Mark that we're starting to process this purchase with the current timestamp
    sessionStorage.setItem(processingKey, Date.now().toString());

    // First verify authentication status
    const checkAuth = async () => {
      try {
        setProcessingStatus("Checking authentication status...");

        // Try to refresh the session only once per purchase
        const sessionRefreshKey = `session_refreshed_${purchaseKey}`;
        if (!sessionStorage.getItem(sessionRefreshKey)) {
          console.log("Refreshing user session for purchase");
          await refreshUserSession();
          sessionStorage.setItem(sessionRefreshKey, "true");
        } else {
          console.log("Session already refreshed for this purchase");
        }

        // Check current auth status via API
        const authResponse = await makeAuthenticatedRequest("/api/check-auth");
        console.log("Auth check result:", authResponse.data);

        // Update debug info with auth information
        if (debugInfo) {
          setDebugInfo({
            ...debugInfo,
            authInfo: authResponse.data,
          });
        } else {
          // Initialize with basic info
          setDebugInfo({
            packageId: packageId,
            sessionId: sessionId,
            packageCredits: 0, // Will be updated later
            authInfo: authResponse.data,
          });
        }

        // If not authenticated, try direct update without authentication
        if (!authResponse.data.authenticated) {
          console.warn("Not authenticated, trying direct credit update");
          await directCreditUpdate();
          return;
        }

        // Continue with credit processing
        await processCredits();
      } catch (error) {
        console.error("Auth check error:", error);

        // Try direct update as fallback
        try {
          console.log("Auth check failed, trying direct update as fallback");
          await directCreditUpdate();
        } catch (_) {
          // Authentication error fallback
          setProcessingStatus(
            "Authentication error. Please try signing in again."
          );
          setErrorDetails({
            message: error instanceof Error ? error.message : "Unknown error",
            response: error instanceof AxiosError ? error.response?.data : null,
          });
          setIsLoading(false);
        }
      }
    };

    // Process credits after authentication is confirmed
    const processCredits = async () => {
      try {
        // Get fresh user data
        const user = await getCurrentUser();
        console.log("Fresh user data:", user);

        if (!user) {
          throw new Error("Failed to get user data");
        }

        // Store initial credits if not already set
        if (initialCredits === null) {
          setInitialCredits(user.credits);
        }

        // Find the corresponding package
        const selectedPackage = CREDIT_PACKAGES.find(
          (pkg) => pkg.id === packageId
        );
        const packageCredits = selectedPackage?.credits || 10;

        // Update debug info with complete information
        setDebugInfo({
          userId: user.id,
          userEmail: user.email,
          packageId: packageId,
          packageName: selectedPackage?.name,
          packageCredits: packageCredits,
          sessionId: sessionId,
          authInfo: debugInfo?.authInfo,
        });

        // Only process once per component lifecycle
        if (!creditsRefreshed) {
          setCreditsRefreshed(true);
          setProcessingStatus("Processing your purchase...");

          // Force manual processing regardless of current credits
          console.log("Processing credits manually");

          // Generate a transaction ID using sessionId + packageId and timestamp to ensure uniqueness
          const transactionId = `tx_${
            sessionId || "unknown"
          }_${packageId}_${Date.now()}`;

          // Call manual processing endpoint
          const response = await makeAuthenticatedRequest(
            "/api/process-purchase",
            {
              userId: user.id,
              packageId: packageId,
              amount: selectedPackage?.price || 1,
              credits: packageCredits,
              forceUpdate: true,
              transactionId, // Add transaction ID for idempotency
            },
            "POST"
          );

          if (response.data.success) {
            setProcessingStatus("Credits added successfully!");

            // Refresh user data again
            await refreshUserCredits();

            // Get fresh credits
            const updatedUser = await getCurrentUser();
            setFinalCredits(updatedUser?.credits || 0);

            // Mark this purchase as processed in this session using just the sessionId
            const sessionKey = `processed_${sessionId}`;
            sessionStorage.setItem(sessionKey, Date.now().toString());

            // Mark for home page refresh
            localStorage.setItem("credits_need_refresh", "true");
          } else {
            throw new Error(response.data.error || "Unknown error");
          }
        }

        setIsLoading(false);
      } catch (error: unknown) {
        const err = error as Error;
        console.error("Error processing credits:", err);
        setProcessingStatus("Error updating your account.");
        setErrorDetails({
          message: err.message,
          stack: err.stack,
          response: error instanceof AxiosError ? error.response?.data : null,
        });
        setIsLoading(false);
      }
    };

    // Start the authentication check
    checkAuth();

    // Cleanup function to remove processing flags on unmount
    return () => {
      // If the component unmounts without completing, remove the processing flag
      if (!sessionStorage.getItem(`processed_${sessionId}`)) {
        sessionStorage.removeItem(`processing_${sessionId}`);
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Only re-run if these critical values change
    sessionId,
    packageId,
    router,
    // The following are not expected to change during this component's lifecycle
    // but are needed for the functions to work
    refreshUserCredits,
    refreshUserSession,
    directCreditUpdate,
  ]);

  const handleRetry = async () => {
    try {
      setProcessingStatus("Retrying credit update...");

      // First refresh auth
      await refreshUserSession();

      // Get fresh user for retry
      const freshUser = await getCurrentUser();

      // Find the package
      const selectedPackage = CREDIT_PACKAGES.find(
        (pkg) => pkg.id === packageId
      );
      const packageCredits = selectedPackage?.credits || 10;

      // Try direct update with localStorage fallback
      let userId = freshUser?.id;
      let userEmail = freshUser?.email;

      if (!userId) {
        // First try to get from checkout-specific localStorage
        const checkoutInfo = getStoredCheckoutInfo();
        if (checkoutInfo && checkoutInfo.id) {
          console.log("Using stored checkout info for retry:", checkoutInfo);
          userId = checkoutInfo.id;
          userEmail = checkoutInfo.email;
        } else {
          // Try to get from localStorage as general fallback
          const storedUser = localStorage.getItem("currentUser");
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              userId = parsedUser.id;
              userEmail = parsedUser.email;
            } catch (e) {
              console.error("Failed to parse stored user:", e);
            }
          }
        }
      }

      if (!userId) {
        throw new Error("You must be logged in to complete this purchase");
      }

      // Generate a transaction ID using sessionId + packageId and timestamp to ensure uniqueness
      const transactionId = `tx_retry_${
        sessionId || "unknown"
      }_${packageId}_${Date.now()}`;

      const response = await makeAuthenticatedRequest(
        "/api/process-purchase",
        {
          userId: userId,
          userEmail: userEmail,
          packageId: packageId,
          amount: selectedPackage?.price || 1,
          credits: packageCredits,
          isRetry: true,
          forceUpdate: true,
          transactionId, // Add transaction ID for idempotency
        },
        "POST"
      );

      if (response.data.success) {
        setProcessingStatus("Credits added successfully on retry!");
        // Refresh again to get updated balance
        await refreshUserCredits();
        const updatedUser = await getCurrentUser();
        setFinalCredits(updatedUser?.credits || 0);

        // Mark this purchase as processed with the current timestamp
        const sessionKey = `processed_${sessionId}`;
        sessionStorage.setItem(sessionKey, Date.now().toString());

        // Update credits_need_refresh flag for other components
        localStorage.setItem("credits_need_refresh", "true");
      } else {
        throw new Error(response.data.error || "Unknown error");
      }
    } catch (error: unknown) {
      const err = error as Error;
      setProcessingStatus("Retry failed. Please contact support.");
      setErrorDetails({
        message: err.message,
        response: (error as AxiosError).response?.data,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <span className="ml-3 text-indigo-600">
          {processingStatus || "Loading..."}
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <CelebrationEffects />

      <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Thank You for Your Purchase!
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
          Your payment has been processed successfully.
        </p>
        {processingStatus && (
          <div
            className={`mb-4 px-4 py-2 rounded-lg ${
              processingStatus.includes("Error")
                ? "bg-red-50 text-red-700"
                : "bg-blue-50 text-blue-700"
            }`}
          >
            {processingStatus}
            {errorDetails && (
              <button
                onClick={() => console.log("Error details:", errorDetails)}
                className="block mt-1 text-xs underline"
              >
                See console for error details
              </button>
            )}

            {processingStatus.includes("Error") && (
              <button
                onClick={handleRetry}
                className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Retry Credit Update
              </button>
            )}
          </div>
        )}
        <div className="mb-8 py-4 px-6 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
          <p className="text-gray-700 dark:text-gray-200">
            Current Balance:
            <span className="ml-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {currentUser?.credits || 0} Credits
            </span>
          </p>

          {initialCredits !== null && finalCredits !== null && (
            <p className="text-sm text-gray-500 mt-1">
              {finalCredits > initialCredits
                ? `+${finalCredits - initialCredits} credits have been added`
                : "No credits have been added yet"}
            </p>
          )}
        </div>{" "}
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          onClick={() => {
            // Ensure we refresh credits when returning to home
            localStorage.setItem("credits_need_refresh", "true");
          }}
        >
          Create a New Wish
        </Link>
        {debugInfo && (
          <details className="mt-8 text-left text-xs text-gray-400">
            <summary className="cursor-pointer">Debug Information</summary>
            <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 overflow-auto rounded">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

// Loading fallback UI
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ThankYouContent />
    </Suspense>
  );
}
