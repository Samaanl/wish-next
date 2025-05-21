"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import CelebrationEffects from "@/components/CelebrationEffects";
import axios, { AxiosError } from "axios";
import { CREDIT_PACKAGES } from "@/utils/paymentService";

// Define types
interface ErrorDetails {
  message: string;
  response?: unknown;
  stack?: string;
}

interface DebugInfo {
  userId?: string;
  userEmail?: string;
  packageId: string;
  packageName?: string;
  packageCredits: number;
  sessionId: string | null;
}

function ThankYouContent() {
  const { currentUser, refreshUserCredits } = useAuth();
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

  useEffect(() => {
    // If there's no session ID or user, redirect to homepage
    if (!sessionId || !currentUser) {
      router.push("/");
      return;
    }

    // Store initial credits
    if (initialCredits === null && currentUser?.credits !== undefined) {
      setInitialCredits(currentUser.credits);
    }

    // Find the corresponding package
    const selectedPackage = CREDIT_PACKAGES.find((pkg) => pkg.id === packageId);
    const packageCredits = selectedPackage?.credits || 10; // Default to 10 if package not found

    setDebugInfo({
      userId: currentUser?.id,
      userEmail: currentUser?.email,
      packageId,
      packageName: selectedPackage?.name,
      packageCredits,
      sessionId,
    });

    // Refresh the user's credits to show the new balance
    const updateCredits = async () => {
      try {
        // Only try to refresh once to prevent infinite loops
        if (!creditsRefreshed) {
          setCreditsRefreshed(true);
          setProcessingStatus("Checking for updated credits...");

          // First try to refresh credits from Appwrite directly
          await refreshUserCredits();

          // If no change in credits, try manual processing
          if (currentUser?.credits === initialCredits) {
            setProcessingStatus("Manually processing your purchase...");

            try {
              // Call manual processing endpoint
              const response = await axios.post("/api/process-purchase", {
                userId: currentUser.id,
                packageId: packageId,
                amount: selectedPackage?.price || 1,
                credits: packageCredits,
              });

              if (response.data.success) {
                setProcessingStatus("Credits added successfully!");
                // Refresh again to get updated balance
                await refreshUserCredits();
                setFinalCredits(currentUser?.credits || 0);
              } else {
                throw new Error(response.data.error || "Unknown error");
              }
            } catch (error: unknown) {
              const err = error as AxiosError;
              console.error("Error processing purchase:", err);
              setProcessingStatus("Error processing credits.");
              setErrorDetails({
                message: err.message,
                response: (err as AxiosError).response?.data,
              });
            }
          } else {
            // Credits updated via webhook
            setProcessingStatus("Credits have been added to your account!");
            setFinalCredits(currentUser?.credits || 0);
          }
        }
        setIsLoading(false);
      } catch (error: unknown) {
        const err = error as Error;
        console.error("Error refreshing credits:", err);
        setProcessingStatus("Error updating your account.");
        setErrorDetails({
          message: err.message,
          stack: err.stack,
        });
        setIsLoading(false);
      }
    };

    // Add a small delay to allow processing time
    const timer = setTimeout(() => {
      updateCredits();
    }, 1500);

    return () => clearTimeout(timer);
  }, [
    sessionId,
    currentUser,
    packageId,
    router,
    refreshUserCredits,
    creditsRefreshed,
    initialCredits,
  ]);

  const handleRetry = async () => {
    try {
      setProcessingStatus("Retrying credit update...");

      // Call manual processing with more details
      const selectedPackage = CREDIT_PACKAGES.find(
        (pkg) => pkg.id === packageId
      );
      const packageCredits = selectedPackage?.credits || 10;

      const response = await axios.post("/api/process-purchase", {
        userId: currentUser?.id,
        packageId: packageId,
        amount: selectedPackage?.price || 1,
        credits: packageCredits,
        isRetry: true,
      });

      if (response.data.success) {
        setProcessingStatus("Credits added successfully on retry!");
        // Refresh again to get updated balance
        await refreshUserCredits();
        setFinalCredits(currentUser?.credits || 0);
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
        </div>

        <Link
          href="/"
          className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
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
