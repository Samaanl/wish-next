"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function MagicLinkPage() {
  const [status, setStatus] = useState("Processing...");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyMagicLinkSession, updateCurrentUser } = useAuth();
  useEffect(() => {
    const handleMagicLink = async () => {
      try {
        const userId = searchParams.get("userId");
        const secret = searchParams.get("secret");

        if (userId && secret) {
          setStatus("Verifying magic link...");

          // Verify the magic link
          const user = await verifyMagicLinkSession(userId, secret);

          if (user) {
            updateCurrentUser(user);
            setStatus("Authentication successful! Redirecting...");

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
        setStatus("Authentication failed. Please try again.");
        setTimeout(() => {
          router.push("/");
        }, 3000);
      } finally {
        setIsLoading(false);
      }
    };

    handleMagicLink();
  }, [router, searchParams, verifyMagicLinkSession, updateCurrentUser]);

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
