"use client";

import React, { useEffect, useState } from "react";
import { signInWithGoogle } from "@/utils/authService";

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
  const [isLoading, setIsLoading] = useState(false); // Debug log when modal opens/closes
  useEffect(() => {
    console.log("AuthModal isOpen state changed to:", isOpen);
    // Reset form when modal closes
    if (!isOpen) {
      setError("");
    }
  }, [isOpen]);

  // Don't render anything if not open
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

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]"
      style={{ zIndex: 9999 }}
    >
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Sign In with Google
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
            Sign in securely with your Google account to access all features
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
