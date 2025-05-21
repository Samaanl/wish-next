import React from "react";
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
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [pendingPackageId, setPendingPackageId] = React.useState<string | null>(
    null
  );

  if (!isOpen) return null;

  // Check if user is a guest
  const isGuestUser = currentUser?.id?.startsWith("guest-");

  const handlePurchase = async (packageId: string) => {
    // Clear previous errors
    setError("");

    // If user is not authenticated or is a guest user, show auth modal
    if (!currentUser || isGuestUser) {
      setPendingPackageId(packageId);
      setShowAuthModal(true);
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

  const processPurchase = async (packageId: string) => {
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
  };

  const handleAuthClose = () => {
    setShowAuthModal(false);

    // After auth modal closes, check if user is logged in and has pending package
    setTimeout(() => {
      const currentUserState = currentUser; // Use the current state value
      if (
        currentUserState &&
        currentUserState.email &&
        pendingPackageId &&
        !currentUserState.id.startsWith("guest-")
      ) {
        processPurchase(pendingPackageId);
        setPendingPackageId(null);
      }
    }, 100);
  };

  const handleAuthSuccess = async () => {
    // After successful auth, refresh user info
    await refreshUserCredits();

    // Process purchase if there's a pending package
    if (
      currentUser &&
      currentUser.email &&
      pendingPackageId &&
      !currentUser.id.startsWith("guest-")
    ) {
      processPurchase(pendingPackageId);
      setPendingPackageId(null);
    }
  };

  return (
    <>
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={handleAuthClose}
          onSuccess={handleAuthSuccess}
        />
      )}

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}{" "}
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
            ))}
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
