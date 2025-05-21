"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import CelebrationEffects from "@/components/CelebrationEffects";
import axios from "axios";
import { CREDIT_PACKAGES } from "@/utils/paymentService";

function ThankYouContent() {
  const { currentUser, refreshUserCredits } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const packageId = searchParams.get("package_id") || "basic"; // Default to basic if not specified
  const [isLoading, setIsLoading] = useState(true);
  const [creditsRefreshed, setCreditsRefreshed] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);

  useEffect(() => {
    // If there's no session ID or user, redirect to homepage
    if (!sessionId || !currentUser) {
      router.push("/");
      return;
    }

    // Find the corresponding package
    const selectedPackage = CREDIT_PACKAGES.find((pkg) => pkg.id === packageId);
    const packageCredits = selectedPackage?.credits || 10; // Default to 10 if package not found

    // Refresh the user's credits to show the new balance
    const updateCredits = async () => {
      try {
        // Only try to refresh once to prevent infinite loops
        if (!creditsRefreshed) {
          setCreditsRefreshed(true);

          // First try to refresh credits from Appwrite directly
          await refreshUserCredits();

          // If credits are still the default of 3, try to manually process
          if (currentUser?.credits === 3) {
            setProcessingStatus("Manually applying credits...");

            // Call manual processing endpoint
            const response = await axios.post("/api/process-purchase", {
              userId: currentUser.id,
              packageId: packageId,
              amount: selectedPackage?.price || 1,
              credits: packageCredits,
            });

            if (response.data.success) {
              setProcessingStatus("Credits applied successfully!");
              // Refresh again to get updated balance
              await refreshUserCredits();
            }
          }
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error refreshing credits:", error);
        setProcessingStatus(
          "Error processing credits. Please contact support."
        );
        setIsLoading(false);
      }
    };

    // Add a small delay to allow processing time
    const timer = setTimeout(() => {
      updateCredits();
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    sessionId,
    currentUser,
    packageId,
    router,
    refreshUserCredits,
    creditsRefreshed,
  ]);

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
          Your credits have been added to your account. You can now create more
          amazing wishes!
        </p>
        {processingStatus && (
          <div className="mb-4 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
            {processingStatus}
          </div>
        )}
        <div className="mb-8 py-4 px-6 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
          <p className="text-gray-700 dark:text-gray-200">
            Current Balance:
            <span className="ml-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {currentUser?.credits || 0} Credits
            </span>
          </p>
        </div>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Create a New Wish
        </Link>{" "}
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
