"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthCallback() {
  const [status, setStatus] = useState("Loading...");
  const router = useRouter();
  const { refreshUserSession } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus("Processing authentication...");

        // Force refresh the user session to get the latest data after OAuth login
        await refreshUserSession();

        setStatus("Authentication successful! Redirecting...");
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
  }, [router, refreshUserSession]);

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
