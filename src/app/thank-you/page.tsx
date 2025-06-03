"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import CelebrationEffects from "@/components/CelebrationEffects";
import axios, { AxiosError } from "axios";
import { CREDIT_PACKAGES, getStoredCheckoutInfo } from "@/utils/paymentService";
import { getCurrentUser } from "@/utils/authService";

interface ErrorDetails {
  message: string;
  response?: unknown;
}

interface DebugInfo {
  userId?: string;
  userEmail?: string;
  packageId: string;
  packageName?: string;
  packageCredits: number;
  sessionId: string | null;
  transactionId?: string;
  processResult?: {
    success: boolean;
    newBalance?: number;
    message?: string;
  };
}

function ThankYouContent() {
  const { currentUser, refreshUserCredits } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const packageId = searchParams.get("package_id") || "basic";

  const [isLoading, setIsLoading] = useState(true);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [initialCredits, setInitialCredits] = useState<number | null>(null);
  const [finalCredits, setFinalCredits] = useState<number | null>(null);
  useEffect(() => {
    // Redirect if no session ID
    if (!sessionId) {
      router.push("/");
      return;
    }

    // SECURITY FIX: Only clear processing flags, not processed flags
    // This prevents payment processing loops
    const clearBlockingStorage = () => {
      const keysToCheck = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        // Only clear processing_ flags, not processed_ flags
        // This prevents the payment from being processed multiple times
        if (key && key.startsWith('processing_') && 
            (key.includes(sessionId) || key.includes(packageId))) {
          keysToCheck.push(key);
        }
      }

      keysToCheck.forEach((key) => {
        const value = sessionStorage.getItem(key);
        console.log(`Removing stale processing flag: ${key} = ${value}`);
        sessionStorage.removeItem(key);
      });
    };

    // Clear blocking storage immediately
    clearBlockingStorage(); // Use simple session-based keys without time windows to avoid blocking legitimate payments
    const uniqueKey = `${sessionId}_${packageId}`;
    const processedKey = `processed_${uniqueKey}`;
    const processingKey = `processing_${uniqueKey}`;
    const attemptsKey = `attempts_${uniqueKey}`;

    console.log(
      "Processing payment for session:",
      sessionId,
      "package:",
      packageId
    );

    // Clean up old session storage entries (older than 2 hours to be more lenient)
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (
        key &&
        (key.startsWith("processed_") ||
          key.startsWith("processing_") ||
          key.startsWith("attempts_"))
      ) {
        const storedValue = sessionStorage.getItem(key);
        if (
          storedValue &&
          !isNaN(Number(storedValue)) &&
          Number(storedValue) < twoHoursAgo
        ) {
          sessionStorage.removeItem(key);
        }
      }
    }

    // SECURITY FIX: Improved check for already processed payments
    // Check if this specific purchase was already successfully processed
    const processedTimestamp = sessionStorage.getItem(processedKey);
    if (processedTimestamp) {
      const processedTime = parseInt(processedTimestamp);
      const timeSinceProcessed = Date.now() - processedTime;

      // Extend the window to 24 hours to prevent duplicate processing
      // This helps prevent credit duplication issues
      if (timeSinceProcessed < 24 * 60 * 60 * 1000) {
        console.log(
          "PAYMENT ALREADY PROCESSED - Preventing duplicate credits:",
          uniqueKey,
          "at",
          new Date(processedTime)
        );
        setProcessingStatus("Credits already added to your account!");
        setIsLoading(false);
        return;
      } else {
        // Only remove very old processed flags (older than 24 hours)
        sessionStorage.removeItem(processedKey);
        console.log("Removed old processed flag (>24h), allowing retry");
      }
    }

    // Check processing flag to prevent multiple simultaneous calls
    const processingTimestamp = sessionStorage.getItem(processingKey);
    if (processingTimestamp) {
      const processingTime = parseInt(processingTimestamp);
      const timeSinceProcessing = Date.now() - processingTime;

      // Only block if processing started less than 2 minutes ago
      if (timeSinceProcessing < 2 * 60 * 1000) {
        console.log("Purchase currently being processed");
        return;
      } else {
        // Remove old processing flag
        sessionStorage.removeItem(processingKey);
        console.log("Removed stale processing flag");
      }
    }

    // SECURITY FIX: Stricter attempt limits to prevent credit duplication
    const attempts = parseInt(sessionStorage.getItem(attemptsKey) || "0");
    // Reduce max attempts from 5 to 2 to prevent excessive processing attempts
    if (attempts >= 2) {
      console.log("SECURITY: Max attempts reached for:", uniqueKey, "- Blocking further attempts");
      setProcessingStatus(
        "Your payment is being processed. Credits will appear in your account shortly. If they don't appear within 5 minutes, please contact support."
      );
      setIsLoading(false);
      return;
    }

    // Mark as processing and increment attempts
    sessionStorage.setItem(processingKey, Date.now().toString());
    sessionStorage.setItem(attemptsKey, (attempts + 1).toString());
    const processPayment = async () => {
      try {
        setProcessingStatus("Processing your purchase...");

        // Get user information
        let userId = currentUser?.id;
        let userEmail = currentUser?.email;

        if (!userId) {
          const checkoutInfo = getStoredCheckoutInfo();
          if (checkoutInfo?.id) {
            userId = checkoutInfo.id;
            userEmail = checkoutInfo.email;
          }
        }

        if (!userId) {
          throw new Error("Cannot identify user for credit processing");
        }

        // Get package details
        const selectedPackage = CREDIT_PACKAGES.find(
          (pkg) => pkg.id === packageId
        );
        const packageCredits = selectedPackage?.credits || 10;

        // Store initial credits for comparison
        if (initialCredits === null && currentUser?.credits !== undefined) {
          setInitialCredits(currentUser.credits);
        }

        // Generate unique transaction ID
        const transactionId = `tx_${sessionId}_${packageId}_${Date.now()}`;

        // Call the API to process the purchase
        const response = await axios.post(
          "/api/process-purchase",
          {
            userId,
            packageId,
            amount: selectedPackage?.price || 1,
            credits: packageCredits,
            transactionId,
          },
          {
            headers: userId ? { "x-user-id": userId } : {},
          }
        );

        const result = response.data;

        if (result.success) {
          console.log("Purchase processed successfully:", result);
          
          // SECURITY FIX: Handle duplicate transaction detection
          if (result.duplicate) {
            console.log("DUPLICATE TRANSACTION DETECTED - Credits were already added");
            setProcessingStatus("Credits were already added to your account!");
          } else {
            setProcessingStatus("Credits added successfully!");
          }
          
          // Mark this purchase as processed with a timestamp
          sessionStorage.setItem(processedKey, Date.now().toString());
          localStorage.setItem("credits_need_refresh", "true");

          // Store debug info
          setDebugInfo({
            userId,
            userEmail,
            packageId,
            packageName: selectedPackage?.name,
            packageCredits,
            sessionId,
            transactionId,
            processResult: response.data,
          });
        } else {
          throw new Error(response.data.error || "Payment processing failed");
        }
      } catch (error) {
        console.error("Payment processing error:", error);
        setProcessingStatus(
          "Error processing payment. Please contact support."
        );
        setErrorDetails({
          message: error instanceof Error ? error.message : "Unknown error",
          response: error instanceof AxiosError ? error.response?.data : null,
        });
      } finally {
        // Always clear processing flag
        sessionStorage.removeItem(processingKey);
        setIsLoading(false);
      }
    };

    processPayment();

    // Cleanup on unmount
    return () => {
      sessionStorage.removeItem(processingKey);
    };
  }, [
    sessionId,
    packageId,
    currentUser,
    router,
    refreshUserCredits,
    initialCredits,
  ]);
  const handleRetry = async () => {
    // Clear ALL payment-related session storage entries
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (
        key &&
        (key.startsWith("processed_") ||
          key.startsWith("processing_") ||
          key.startsWith("attempts_"))
      ) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => sessionStorage.removeItem(key));

    console.log("Cleared all payment session data, reloading page...");

    // Trigger a page reload to restart the process
    window.location.reload();
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
              processingStatus.includes("Error") ||
              processingStatus.includes("Maximum")
                ? "bg-red-50 text-red-700"
                : processingStatus.includes("successfully")
                  ? "bg-green-50 text-green-700"
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
            )}{" "}
            {(processingStatus.includes("Error") ||
              processingStatus.includes("Maximum") ||
              processingStatus.includes("already")) && (
              <div className="mt-2">
                <button
                  onClick={handleRetry}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Retrying..." : "Retry Credit Update"}
                </button>
              </div>
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
        </div>

        <Link
          href="/"
          className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          onClick={() => {
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
