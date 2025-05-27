import React, { useState, useEffect, useCallback } from "react";
import { CREDIT_PACKAGES } from "@/utils/paymentService";
import { initializeCheckout } from "@/utils/paymentService";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/AuthModal";

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase?: (packageId: string) => Promise<void>;
}

const PurchaseModal: React.FC<PurchaseModalProps> = ({
  isOpen,
  onClose,
  onPurchase,
}) => {
  const { currentUser, refreshUserCredits } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingPackageId, setPendingPackageId] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);

  // Check if user is a guest
  const isGuestUser = currentUser?.id?.startsWith("guest-");

  // Log for debugging
  useEffect(() => {
    console.log("Auth modal visibility:", showAuthModal);
  }, [showAuthModal]);

  const processPurchase = useCallback(
    async (packageId: string) => {
      setIsLoading(true);
      setError("");

      try {
        if (!currentUser || !currentUser.email || isGuestUser) {
          throw new Error(
            "You must be logged in with a valid email to purchase credits"
          );
        }

        const checkoutUrl = await initializeCheckout(
          packageId,
          currentUser.id,
          currentUser.email
        );

        if (!checkoutUrl) {
          throw new Error("Failed to create checkout session");
        }
        // Redirect to Lemon Squeezy checkout
        window.location.href = checkoutUrl;
      } catch (error: unknown) {
        console.error("Purchase error:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to process payment. Please try again."
        );
        setIsLoading(false);
      }
    },
    [currentUser, isGuestUser, setIsLoading, setError]
  );

  // Handle auth success and process purchase
  useEffect(() => {
    const handlePendingPurchase = async () => {
      // Only proceed if we had an auth success and have a pending package
      if (
        authSuccess &&
        pendingPackageId &&
        currentUser &&
        !currentUser.id.startsWith("guest-")
      ) {
        setAuthSuccess(false); // Reset the auth success flag

        if (onPurchase) {
          onPurchase(pendingPackageId);
        } else {
          await processPurchase(pendingPackageId);
        }
        setPendingPackageId(null);
      }
    };

    handlePendingPurchase();
  }, [authSuccess, currentUser, pendingPackageId, onPurchase, processPurchase]);

  const handlePurchase = async (packageId: string) => {
    // Clear previous errors
    setError("");

    // If user is not authenticated or is a guest user, show auth modal
    if (!currentUser || isGuestUser) {
      console.log("Guest user detected, showing auth modal...");
      setPendingPackageId(packageId);
      // Ensure we update the state
      setShowAuthModal(true);
      console.log("Auth modal state set to:", true);
      return;
    }

    // If parent component provided an onPurchase handler, use it
    if (onPurchase) {
      onPurchase(packageId);
      return;
    }

    // Otherwise use the default processing
    await processPurchase(packageId);
  };

  const handleAuthClose = () => {
    console.log("Auth modal close triggered");
    setShowAuthModal(false);
  };

  const handleAuthSuccess = async () => {
    console.log("Auth success triggered");
    // After successful auth, refresh user info and set success flag
    await refreshUserCredits();
    setAuthSuccess(true);
    setShowAuthModal(false);
  };

  if (!isOpen) return null;

  // Direct signin button for testing
  const openSignInModal = () => {
    console.log("Opening auth modal directly");
    setShowAuthModal(true);
  };

  return (
    <>
      {/* Debugging button */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={openSignInModal}
          className="bg-red-500 text-white px-4 py-1 rounded text-sm"
        >
          Debug: Open Auth
        </button>
      </div>

      {/* Force the AuthModal to always be in the DOM, just control visibility with isOpen prop */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={handleAuthClose}
        onSuccess={handleAuthSuccess}
      />

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
            Buy Credits
          </h2>

          {isGuestUser && (
            <div className="mb-4 p-3 bg-blue-50 text-blue-700 border border-blue-100 rounded">
              <p className="font-medium">Sign in required</p>
              <p className="text-sm">
                Please sign in or create an account to purchase credits.
              </p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="mt-2 w-full bg-blue-600 text-white py-1 px-2 rounded text-sm"
              >
                Sign in now
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {CREDIT_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className="border rounded-lg p-4 hover:border-indigo-500 transition-colors"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-lg">{pkg.name}</h3>
                  <span className="text-2xl font-bold">${pkg.price}</span>
                </div>

                <div className="mb-3">
                  <span className="text-lg font-medium text-indigo-600 dark:text-indigo-400">
                    {pkg.credits} Credits
                  </span>
                </div>

                <div className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                  {pkg.description}
                </div>

                <button
                  onClick={() => !isLoading && handlePurchase(pkg.id)}
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded font-medium transition disabled:opacity-50 cursor-pointer"
                >
                  {isLoading
                    ? "Processing..."
                    : isGuestUser
                    ? "Sign in to Buy"
                    : "Buy Now"}
                </button>
              </div>
            ))}{" "}
          </div>

          {/* Payment completion instructions */}
          <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-4 w-4 text-blue-500 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
                  💡 After payment completion
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  When you see the success overlay, click{" "}
                  <strong>"Continue"</strong> instead of the back button to
                  ensure your credits are added.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
            Secure payment powered by Lemon Squeezy. All purchases are final.
          </div>

          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            disabled={isLoading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
};

export default PurchaseModal;
