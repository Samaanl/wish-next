"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentUser, storeUserInLocalStorage } from "@/utils/authService";

export default function AuthCallback() {
  const [status, setStatus] = useState("Loading...");
  const router = useRouter();
  const { refreshUserSession, updateCurrentUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus("Processing authentication...");

        // First try directly getting the current user
        const user = await getCurrentUser();

        if (user && !user.isGuest) {
          // Double check we're storing user data in localStorage
          storeUserInLocalStorage(user);

          // Update auth context with the user
          updateCurrentUser(user);

          setStatus("Authentication successful! Redirecting...");
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

        setTimeout(() => {
          router.push("/");
        }, 1000);
      } catch (error) {
        console.error("Auth callback error:", error);
        setStatus("Authentication failed. Redirecting to homepage...");
        setTimeout(() => {
          router.push("/");
        }, 2000);
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
