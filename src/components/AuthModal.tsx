"use client";

import React, { useEffect, useState } from "react";
import { signInWithGoogle } from "@/utils/authService";
import { useAuth } from "@/contexts/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [authMethod, setAuthMethod] = useState<"google" | "magic">("google");
  const { signInMagicLink } = useAuth(); // Debug log when modal opens/closes
  useEffect(() => {
    console.log("AuthModal isOpen state changed to:", isOpen);
    // Reset form when modal closes
    if (!isOpen) {
      setError("");
      setEmail("");
      setMagicLinkSent(false);
      setAuthMethod("google");
    }
  }, [isOpen]);

  // Don't render anything if not open test
  if (!isOpen) return null;
  console.log("Rendering AuthModal component");
  const handleGoogleSignIn = async () => {
    setError("");
    setIsLoading(true);

    try {
      console.log("Starting Google sign-in flow");
      await signInWithGoogle();
      // Note: The browser will be redirected by signInWithGoogle,
      // so the following code will not execute unless there's an error
    } catch (err: Error | unknown) {
      console.error("Google authentication failed locally:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Google authentication failed. Please try again."
      );
      setIsLoading(false);
    }
  };

  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      console.log("Sending magic link to:", email);
      await signInMagicLink(email);
      setMagicLinkSent(true);
      setIsLoading(false);
    } catch (err: Error | unknown) {
      console.error("Magic link authentication failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send magic link. Please try again."
      );
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]"
      style={{ zIndex: 9999 }}
    >
      {" "}
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {magicLinkSent ? "Check your email" : "Sign In"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            type="button"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-100 rounded">
            {error}
          </div>
        )}

        {magicLinkSent ? (
          <div className="text-center">
            <div className="mb-4 p-4 bg-green-50 text-green-700 border border-green-100 rounded">
              <svg
                className="h-8 w-8 mx-auto mb-2 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 4.26a2 2 0 001.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <p className="font-medium">Magic link sent!</p>
              <p className="text-sm mt-1">
                Check your email for a sign-in link sent to {email}
              </p>
            </div>
            <button
              onClick={() => {
                setMagicLinkSent(false);
                setEmail("");
                setAuthMethod("google");
              }}
              className="text-blue-600 hover:text-blue-800 text-sm"
              type="button"
            >
              Try a different method
            </button>
          </div>
        ) : (
          <>
            {/* Auth Method Selector */}
            <div className="mb-6">
              <div className="flex border border-gray-200 rounded-lg p-1">
                <button
                  onClick={() => setAuthMethod("google")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    authMethod === "google"
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  type="button"
                >
                  Google
                </button>
                <button
                  onClick={() => setAuthMethod("magic")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    authMethod === "magic"
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  type="button"
                >
                  Magic Link
                </button>
              </div>
            </div>

            {authMethod === "google" ? (
              <>
                {/* Google Sign-In Button */}
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex justify-center items-center bg-white border border-gray-300 rounded-md py-3 px-4 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 mb-4"
                  type="button"
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  {isLoading ? "Signing in..." : "Continue with Google"}
                </button>

                <div className="text-center text-sm text-gray-600">
                  <p>
                    Sign in securely with your Google account to access all
                    features
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Magic Link Form */}
                <form onSubmit={handleMagicLinkSignIn} className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your email"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !email.trim()}
                    className="w-full flex justify-center items-center bg-blue-600 text-white rounded-md py-3 px-4 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg
                      className="h-5 w-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 4.26a2 2 0 001.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    {isLoading ? "Sending..." : "Send Magic Link"}
                  </button>
                </form>

                <div className="text-center text-sm text-gray-600 mt-4">
                  <p>
                    We'll send you a secure link to sign in without a password
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
