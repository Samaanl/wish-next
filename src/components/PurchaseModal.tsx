"use client";

import { useState } from "react";
import { getCurrentUser, signInWithGoogle } from "../utils/authService";
import Image from "next/image";

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (packageId: string) => Promise<void>;
}

const PurchaseModal: React.FC<PurchaseModalProps> = ({
  isOpen,
  onClose,
  onPurchase,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handlePurchase = async (packageId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user
      const currentUser = await getCurrentUser();
      console.log("Current user:", currentUser);

      // Check if user is authenticated
      if (!currentUser || !currentUser.id) {
        console.log("User not authenticated, showing auth modal");
        setShowAuthModal(true);
        return;
      }

      // Check if user has email
      if (!currentUser.email) {
        console.log("User has no email, showing auth modal");
        setShowAuthModal(true);
        return;
      }

      // Call the onPurchase prop
      await onPurchase(packageId);
    } catch (error) {
      console.error("Purchase error:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Google sign in error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to sign in with Google"
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6">Purchase Credits</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {showAuthModal ? (
          <div className="space-y-4">
            <p className="text-gray-600">
              Please sign in or create an account to continue with your
              purchase.
            </p>
            <button
              onClick={handleGoogleSignIn}
              className="w-full bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center justify-center"
            >
              <Image
                src="/google-icon.png"
                alt="Google"
                width={20}
                height={20}
                className="mr-2"
              />
              Continue with Google
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold">Basic Package</h3>
              <p className="text-gray-600">10 Credits</p>
              <p className="text-lg font-bold">$1.00</p>
              <button
                onClick={() => handlePurchase("basic")}
                disabled={isLoading}
                className="mt-2 w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? "Processing..." : "Buy Now"}
              </button>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold">Premium Package</h3>
              <p className="text-gray-600">100 Credits</p>
              <p className="text-lg font-bold">$5.00</p>
              <button
                onClick={() => handlePurchase("premium")}
                disabled={isLoading}
                className="mt-2 w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? "Processing..." : "Buy Now"}
              </button>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default PurchaseModal;
