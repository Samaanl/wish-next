"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

// Component that uses useSearchParams - needs to be wrapped in Suspense
function MagicLinkContent() {
  const [status, setStatus] = useState("Processing...");
  const [isLoading, setIsLoading] = useState(true);
  const [hasVerified, setHasVerified] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyMagicLinkSession, updateCurrentUser, currentUser } = useAuth();

  useEffect(() => {
    // Prevent multiple verification attempts with multiple checks
    if (hasVerified || isProcessing) return;

    // Check if we've already processed this verification recently
    const lastVerification = localStorage.getItem("last_magic_link_process");
    const now = Date.now();

    if (lastVerification && now - parseInt(lastVerification) < 10000) {
      console.log("Skipping magic link verification - processed recently");
      setStatus("Already processed. Redirecting...");
      setTimeout(() => router.push("/"), 2000);
      setIsLoading(false);
      return;
    }

    const handleMagicLink = async () => {
      if (isProcessing) return; // Double-check to prevent race conditions
      setIsProcessing(true);

      // Mark this verification attempt immediately
      localStorage.setItem("last_magic_link_process", now.toString());
      try {
        const userId = searchParams.get("userId");
        const secret = searchParams.get("secret");

        // Check if user is already authenticated
        if (currentUser && !currentUser.isGuest) {
          setStatus("You are already signed in! Redirecting...");
          setTimeout(() => {
            router.push("/");
          }, 1500);
          setIsLoading(false);
          return;
        }

        if (userId && secret) {
          setHasVerified(true);
          setStatus("Verifying magic link...");

          // Verify the magic link
          const user = await verifyMagicLinkSession(userId, secret);
          if (user) {
            updateCurrentUser(user);
            setStatus("Authentication successful! Redirecting...");

            // Clear all magic link flags
            localStorage.removeItem("magic_link_verifying");
            localStorage.removeItem("last_magic_link_process");

            // Try to go back to the original page or default to home
            const savedRedirect = localStorage.getItem("auth_redirect");
            const redirectPath = savedRedirect || "/";

            // Clear the saved redirect
            localStorage.removeItem("auth_redirect");

            setTimeout(() => {
              router.push(redirectPath);
            }, 1500);
          } else {
            setStatus("Authentication failed. Please try again.");
            // Clear flags on failure too
            localStorage.removeItem("magic_link_verifying");
            setTimeout(() => {
              router.push("/");
            }, 3000);
          }
        } else {
          setStatus("Invalid magic link. Redirecting to homepage...");
          setTimeout(() => {
            router.push("/");
          }, 3000);
        }
      } catch (error) {
        console.error("Magic link verification error:", error);

        // Handle specific error types
        if (error instanceof Error) {
          if (
            error.message.includes("Rate limit") ||
            error.message.includes("Too many attempts")
          ) {
            setStatus("Too many attempts. Please wait a moment and try again.");
          } else if (error.message.includes("wait before trying")) {
            setStatus("Please wait before trying again.");
          } else {
            setStatus("Authentication failed. Please try again.");
          }
        } else {
          setStatus("Authentication failed. Please try again.");
        }
        setTimeout(() => {
          router.push("/");
        }, 5000); // Give more time for rate limit errors
      } finally {
        setIsLoading(false);
        setIsProcessing(false);
        // Always clear flags when done
        localStorage.removeItem("magic_link_verifying");
      }
    };

    handleMagicLink();
  }, []); // Remove all dependencies to run only once

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">
            Magic Link Authentication
          </h2>
          {isLoading && (
            <div className="animate-pulse mb-4">
              <div className="w-16 h-16 bg-blue-200 rounded-full mx-auto mb-4"></div>
            </div>
          )}
          <p className="text-gray-600">{status}</p>
          {!isLoading && status.includes("failed") && (
            <div className="mt-4">
              <button
                onClick={() => router.push("/")}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Go to Homepage
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Loading fallback component
function MagicLinkLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">
            Magic Link Authentication
          </h2>
          <div className="animate-pulse mb-4">
            <div className="w-16 h-16 bg-blue-200 rounded-full mx-auto mb-4"></div>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense wrapper
export default function MagicLinkPage() {
  return (
    <Suspense fallback={<MagicLinkLoading />}>
      <MagicLinkContent />
    </Suspense>
  );
}
