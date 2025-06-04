import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { CREDIT_PACKAGES } from "@/utils/paymentService";
import { initializeCheckout } from "@/utils/paymentService";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/AuthModal";
import {
  XMarkIcon,
  SparklesIcon,
  CreditCardIcon,
  GiftIcon,
} from "@heroicons/react/24/outline";

// Loading spinner component
const LoadingSpinner = ({ size = "w-5 h-5" }: { size?: string }) => (
  <svg
    className={`animate-spin ${size} text-current`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

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
  const [loadingPackageId, setLoadingPackageId] = useState<string | null>(null);
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
      setLoadingPackageId(packageId);
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
        setLoadingPackageId(null);
      }
    },
    [currentUser, isGuestUser]
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
      setLoadingPackageId(packageId);
      await onPurchase(packageId);
      setLoadingPackageId(null);
      return;
    }

    // Otherwise use the default processing
    await processPurchase(packageId);
  };
  const handleAuthClose = () => {
    console.log("Auth modal close triggered");
    setShowAuthModal(false);
    setLoadingPackageId(null);
    setPendingPackageId(null);
  };

  const handleAuthSuccess = async () => {
    console.log("Auth success triggered");
    // After successful auth, refresh user info and set success flag
    await refreshUserCredits();
    setAuthSuccess(true);
    setShowAuthModal(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* AuthModal with higher z-index */}
          <AuthModal
            isOpen={showAuthModal}
            onClose={handleAuthClose}
            onSuccess={handleAuthSuccess}
          />

          {/* Natural Page-like Purchase Interface */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white dark:bg-gray-900 z-50 overflow-y-auto"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="fixed top-6 right-6 z-60 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              disabled={isLoading}
              aria-label="Close"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>

            {/* Main Content */}
            <div className="min-h-screen py-12 px-6">
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="max-w-6xl mx-auto"
              >
                {/* Header Section */}
                <div className="text-center mb-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mb-8">
                    <SparklesIcon className="h-10 w-10 text-white" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                    Get More Credits
                  </h1>
                  <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
                    Choose a plan that works for you and unlock unlimited
                    creativity for all your special occasions.
                  </p>
                </div>
                {/* Important Checkout Warning */}
                <div className="max-w-4xl mx-auto mb-12 p-6 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 dark:border-amber-500">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center">
                        <span className="text-amber-600 dark:text-amber-400 text-lg font-bold">
                          !
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">
                        Important: Complete Your Purchase
                      </h3>
                      <p className="text-amber-700 dark:text-amber-300">
                        After completing payment on Lemon Squeezy,{" "}
                        <strong>
                          make sure to click "Continue" or "Return to Merchant"
                        </strong>{" "}
                        to return to our website. This ensures your credits are
                        properly added to your account.
                      </p>
                    </div>
                  </div>
                </div>
                {/* Auth Required Notice */}
                {isGuestUser && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto mb-12 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                        <GiftIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                          Sign in to continue
                        </h3>
                        <p className="text-blue-700 dark:text-blue-300 mb-4">
                          Create an account to purchase and save your wishes
                        </p>
                        <button
                          onClick={() => setShowAuthModal(true)}
                          className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 font-medium transition-colors"
                        >
                          Sign in or Create Account
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
                {/* Error Display */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-4xl mx-auto mb-12 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center">
                        <span className="text-red-600 dark:text-red-400 text-sm font-bold">
                          !
                        </span>
                      </div>
                      <p className="text-red-800 dark:text-red-200 font-medium">
                        {error}
                      </p>
                    </div>
                  </motion.div>
                )}{" "}
                {/* Credit Packages - Natural Layout */}
                <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 mb-16">
                  {CREDIT_PACKAGES.map((pkg, index) => (
                    <motion.div
                      key={pkg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.2 }}
                      className={`relative p-8 transition-all duration-300 border-2 flex flex-col h-full ${
                        pkg.id === "premium"
                          ? "border-purple-300 dark:border-purple-600 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10"
                          : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                      } hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-lg`}
                    >
                      {" "}
                      {/* Popular Badge */}
                      {pkg.id === "premium" && (
                        <div className="absolute -top-4 left-8">
                          <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 text-sm font-bold">
                            Most Popular
                          </span>
                        </div>
                      )}
                      {/* Card Content - Flex grow to push button to bottom */}
                      <div className="flex-grow">
                        <div className="mb-8">
                          <div className="flex items-start justify-between mb-6">
                            <div>
                              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                {pkg.name}
                              </h3>
                              <p className="text-gray-600 dark:text-gray-400">
                                {pkg.description}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-4xl font-bold text-gray-900 dark:text-white">
                                ${pkg.price}
                              </div>
                              {pkg.id === "premium" && (
                                <div className="text-green-600 dark:text-green-400 font-medium">
                                  Save 17%
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 mb-6">
                            <div className="flex items-center space-x-2">
                              <SparklesIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                              <span className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">
                                {pkg.credits} Credits
                              </span>
                            </div>
                            <div className="text-gray-500 dark:text-gray-400">
                              ${(pkg.price / pkg.credits).toFixed(2)} per wish
                            </div>
                          </div>
                        </div>

                        {/* Features */}
                        <div className="mb-8 space-y-3">
                          {pkg.id === "basic" ? (
                            <>
                              <div className="flex items-center text-gray-600 dark:text-gray-400">
                                <span className="text-green-500 mr-3 text-lg">
                                  ✓
                                </span>
                                Perfect for trying out the service
                              </div>
                              <div className="flex items-center text-gray-600 dark:text-gray-400">
                                <span className="text-green-500 mr-3 text-lg">
                                  ✓
                                </span>
                                Generate heartfelt wishes quickly
                              </div>
                              <div className="flex items-center text-gray-600 dark:text-gray-400">
                                <span className="text-green-500 mr-3 text-lg">
                                  ✓
                                </span>
                                Save and edit your favorites
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center text-gray-600 dark:text-gray-400">
                                <span className="text-green-500 mr-3 text-lg">
                                  ✓
                                </span>
                                Best value for regular users
                              </div>
                              <div className="flex items-center text-gray-600 dark:text-gray-400">
                                <span className="text-green-500 mr-3 text-lg">
                                  ✓
                                </span>
                                Create wishes for all occasions
                              </div>
                              <div className="flex items-center text-gray-600 dark:text-gray-400">
                                <span className="text-green-500 mr-3 text-lg">
                                  ✓
                                </span>
                                Build your personal wish library
                              </div>
                              <div className="flex items-center text-gray-600 dark:text-gray-400">
                                <span className="text-green-500 mr-3 text-lg">
                                  ✓
                                </span>
                                Never run out of inspiration
                              </div>
                            </>
                          )}
                        </div>
                      </div>{" "}
                      {/* Button at bottom */}
                      <motion.button
                        onClick={() => !isLoading && handlePurchase(pkg.id)}
                        disabled={isLoading}
                        whileTap={{ scale: 0.98 }}
                        whileHover={{ scale: 1.02 }}
                        className={`w-full py-4 px-6 text-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-3 rounded-lg shadow-lg active:shadow-md transform active:scale-95 ${
                          pkg.id === "premium"
                            ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-purple-500/25"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25"
                        } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg`}
                      >
                        {loadingPackageId === pkg.id ? (
                          <>
                            <LoadingSpinner size="w-5 h-5" />
                            <span>Redirecting to checkout...</span>
                          </>
                        ) : (
                          <>
                            <CreditCardIcon className="h-5 w-5" />
                            <span>
                              {isGuestUser
                                ? "Sign in to Purchase"
                                : `Get ${pkg.name} Plan`}
                            </span>
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
                {/* Trust & Security Footer */}
                <div className="max-w-4xl mx-auto text-center">
                  <div className="flex items-center justify-center space-x-8 text-gray-500 dark:text-gray-400 mb-8">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">🔒</span>
                      <span className="font-medium">SSL Secured</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">⚡</span>
                      <span className="font-medium">Instant Delivery</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">💳</span>
                      <span className="font-medium">
                        Powered by Lemon Squeezy
                      </span>
                    </div>
                  </div>{" "}
                  <p className="text-gray-500 dark:text-gray-400">
                    Your payment is processed securely through Lemon Squeezy.
                    Credits are automatically added to your account upon
                    successful payment.
                  </p>
                  <div className="mt-4 flex justify-center space-x-6 text-sm">
                    <Link
                      href="/privacy"
                      className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      Privacy Policy
                    </Link>
                    <Link
                      href="/terms"
                      className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      Terms & Conditions
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PurchaseModal;
