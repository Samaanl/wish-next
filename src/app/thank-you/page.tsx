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
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  // First effect to check for session ID and set up initial state
  useEffect(() => {
    // Redirect if no session ID
    if (!sessionId) {
      router.push("/");
      return;
    }
    
    // Log authentication status
    if (!currentUser) {
      console.log("User not authenticated yet, waiting for authentication...");
      setProcessingStatus("Preparing your purchase...");
    } else {
      console.log("User authenticated:", currentUser.email);
    }
    // Setup global window property for tracking payment processing
    if (typeof window !== 'undefined') {
      // @ts-ignore - Add custom property to window
      if (!window.wishMaker) window.wishMaker = {};
    }

    const processedPaymentKey = `processed_payment_${sessionId}_${packageId}`;
    const wasProcessed = sessionStorage.getItem(processedPaymentKey);
    if (wasProcessed) {
      console.log(`Payment was already processed: ${sessionId}_${packageId}`);
      setPaymentProcessed(true);
      setProcessingStatus("Your payment has been processed!");
      setIsLoading(false);
    }

    console.log("Processing payment for session:", sessionId, "package:", packageId);

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
  }, [sessionId, packageId, currentUser, router]);

  // Store the generated session ID to ensure consistency across renders
  const [generatedSessionId, setGeneratedSessionId] = useState<string | null>(null);

  // Generate a consistent session ID once when component mounts
  useEffect(() => {
    if (!sessionId) return;
    
    // Only generate a new session ID if we don't have one yet
    if (!generatedSessionId) {
      // Check if we need to generate a new session ID
      if (sessionId.includes('{checkout_session_id}')) {
        // Generate a unique, stable session ID for this page load
        const newSessionId = `manual_${Date.now()}`;
        setGeneratedSessionId(newSessionId);
        console.log("Generated stable session ID:", newSessionId);
      } else {
        // Use the actual session ID from the URL
        setGeneratedSessionId(sessionId);
      }
    }
  }, [sessionId, generatedSessionId]);

  useEffect(() => {
    // Don't proceed if we're missing any required data
    if (paymentProcessed || !sessionId || !packageId || !generatedSessionId) {
      return;
    }

    if (!currentUser) {
      console.log("Waiting for user authentication...");
      return;
    }

    // Check if this exact payment has already been processed (using the generated session ID)
    const paymentKey = `processed_payment_${generatedSessionId}_${packageId}`;
    if (sessionStorage.getItem(paymentKey) === "true") {
      console.log(`Payment already processed for session: ${generatedSessionId}, package: ${packageId}`);
      setPaymentProcessed(true);
      setProcessingStatus("Payment already processed!");
      setIsLoading(false);
      return;
    }

    console.log("Starting payment processing for session:", generatedSessionId, "package:", packageId);
    setProcessingStatus("Processing your payment...");
    
    const transactionId = `tx_${generatedSessionId}_${packageId}`;
    console.log("Using consistent transaction ID:", transactionId);

    const processPayment = async () => {
      try {
        await callAppwriteFunction();

        setPaymentProcessed(true);
        setProcessingStatus("Payment processed successfully!");

        // Use the generated session ID for consistent storage key
        sessionStorage.setItem(`processed_payment_${generatedSessionId}_${packageId}`, "true");

        await refreshUserCredits();

        setIsLoading(false);
      } catch (error) {
        console.error("Error processing payment:", error);
        setErrorDetails({
          message: "Payment processing failed",
        });
        setIsLoading(false);
      }
    };

    processPayment();
  }, [currentUser, sessionId, packageId, generatedSessionId, paymentProcessed, refreshUserCredits, initialCredits]);

  const callAppwriteFunction = async () => {
    // Ensure currentUser exists
    if (!currentUser || !generatedSessionId) {
      throw new Error("User not authenticated or missing session ID");
    }
    
    const selectedPackage = CREDIT_PACKAGES.find((pkg) => pkg.id === packageId);
    const packageCredits = selectedPackage?.credits || 10;

    if (initialCredits === null && currentUser.credits !== undefined) {
      setInitialCredits(currentUser.credits);
    }
    
    // Use the consistent generated session ID
    const transactionId = `tx_${generatedSessionId}_${packageId}`;

    console.log("FORCING APPWRITE FUNCTION CALL regardless of duplicate detection");
    console.log("Using generated session ID:", generatedSessionId);

    const { client, functions } = await import('@/utils/appwrite');

    console.log("Calling Appwrite function with ID: 683eaf99003799365f40");
    console.log("Function payload:", {
      userId: currentUser.id,
      packageId,
      amount: packageId === "basic" ? 1 : packageId === "premium" ? 5 : 0,
      transactionId,
    });

    // @ts-ignore - Access custom window property
    if (window.wishMaker) window.wishMaker.processingPayment = true;

    // Prepare payload with explicit types to ensure proper formatting
    const payload = {
      userId: currentUser.id,
      packageId: packageId,
      amount: packageId === "basic" ? 1 : packageId === "premium" ? 5 : 50, // 50 for pro package
      transactionId: transactionId
    };
    
    console.log("Stringified payload:", JSON.stringify(payload));
    
    const execution = await functions.createExecution(
      '683eaf99003799365f40', // Function ID for process-credits
      JSON.stringify(payload),
      false // Async execution
    );

    console.log("Appwrite function execution response:", execution);

    const data = JSON.parse(execution.responseBody || '{}');
    console.log("Purchase processed via Cloud Function:", data);

    setDebugInfo({
      userId: currentUser.id,
      userEmail: currentUser.email,
      packageId,
      packageName: selectedPackage?.name,
      packageCredits,
      sessionId,
      transactionId,
      processResult: data,
    });

    setTimeout(() => {
      // @ts-ignore - Access custom window property
      if (window.wishMaker) window.wishMaker.processingPayment = false;
    }, 60 * 60 * 1000);

    return data;
  };

  useEffect(() => {
    if (currentUser?.credits !== undefined && initialCredits !== null) {
      setFinalCredits(currentUser.credits);
    }
  }, [currentUser, initialCredits]);

  const handleRetry = async () => {
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

    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md p-8 space-y-4 text-center bg-white rounded-lg shadow-xl">
          <h1 className="text-2xl font-bold text-gray-800">
            Processing Your Purchase
          </h1>
          <div className="flex justify-center">
            <div className="w-12 h-12 border-t-2 border-b-2 border-purple-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600">
            {processingStatus || "Please wait while we process your purchase..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 space-y-4 text-center bg-white rounded-lg shadow-xl">
        <CelebrationEffects />

        <h1 className="text-2xl font-bold text-gray-800">
          Thank You for Your Purchase!
        </h1>

        <p className="text-lg text-gray-600">
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
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 space-y-4 text-center bg-white rounded-lg shadow-xl">
        <h1 className="text-2xl font-bold text-gray-800">Loading...</h1>
        <div className="flex justify-center">
          <div className="w-12 h-12 border-t-2 border-b-2 border-purple-500 rounded-full animate-spin"></div>
        </div>
      </div>
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
