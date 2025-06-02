"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentUser, storeUserInLocalStorage } from "@/utils/authService";

export default function AuthCallback() {
  const [status, setStatus] = useState("Loading...");
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const { refreshUserSession, updateCurrentUser } = useAuth();

  useEffect(() => {
    // Prevent multiple processing attempts
    if (isProcessing) return;

    // Add basic rate limiting to prevent rapid callback processing
    const lastCallbackProcess = localStorage.getItem("last_oauth_callback");
    const now = Date.now();

    if (lastCallbackProcess && now - parseInt(lastCallbackProcess) < 10000) {
      console.log("Skipping OAuth callback - processed recently");
      setStatus("Already processed. Redirecting...");
      setTimeout(() => router.push("/"), 1000);
      return;
    }

    const handleCallback = async () => {
      if (isProcessing) return; // Double-check for race conditions
      setIsProcessing(true);

      // Mark this callback attempt
      localStorage.setItem("last_oauth_callback", now.toString());

      try {
        setStatus("Processing authentication..."); // Add a delay to prevent rapid-fire requests to Appwrite
        await new Promise((resolve) => setTimeout(resolve, 500));

        // First try directly getting the current user
        const user = await getCurrentUser();

        if (user && !user.isGuest) {
          // Double check we're storing user data in localStorage
          storeUserInLocalStorage(user); // Update auth context with the user
          updateCurrentUser(user);

          setStatus("Authentication successful! Redirecting...");

          // Clear OAuth processing flag
          localStorage.removeItem("last_oauth_callback");

          // Try to go back to the original page or default to home
          const savedRedirect = localStorage.getItem("auth_redirect");
          const urlParams = new URLSearchParams(window.location.search);
          const redirectPath =
            savedRedirect || urlParams.get("redirect") || "/";

          // Clear the saved redirect
          localStorage.removeItem("auth_redirect");

          setTimeout(() => {
            router.push(redirectPath);
          }, 1000);
          return;
        }

        // If direct fetch failed, try refreshing session
        const refreshedUser = await refreshUserSession();

        if (refreshedUser) {
          setStatus("Authentication successful! Redirecting...");
        } else {
          setStatus("Authentication completed. Redirecting...");
        }

        // Clear OAuth processing flag on success
        localStorage.removeItem("last_oauth_callback");

        setTimeout(() => {
          router.push("/");
        }, 1000);
      } catch (error) {
        console.error("Auth callback error:", error);

        // Handle specific error types
        if (error instanceof Error) {
          if (
            error.message.includes("Rate limit") ||
            error.message.includes("Too many attempts")
          ) {
            setStatus("Too many requests. Please wait a moment...");
            setTimeout(() => {
              router.push("/");
            }, 5000); // Give more time for rate limit errors
          } else {
            setStatus("Authentication failed. Redirecting to homepage...");
            setTimeout(() => {
              router.push("/");
            }, 2000);
          }
        } else {
          setStatus("Authentication failed. Redirecting to homepage...");
          setTimeout(() => {
            router.push("/");
          }, 2000);
        }
      } finally {
        setIsProcessing(false);
        // Always clean up the flag when done (in case of errors)
        if (localStorage.getItem("last_oauth_callback")) {
          const timeStamp = parseInt(
            localStorage.getItem("last_oauth_callback") || "0"
          );
          if (Date.now() - timeStamp > 30000) {
            // Only remove if older than 30 seconds
            localStorage.removeItem("last_oauth_callback");
          }
        }
      }
    };

    handleCallback();
  }, [router, refreshUserSession, updateCurrentUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Authentication</h2>
          <div className="animate-pulse mb-4">
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
          </div>
          <p>{status}</p>
        </div>
      </div>
    </div>
  );
}
