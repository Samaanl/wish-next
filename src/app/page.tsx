"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import WishForm from "@/components/WishForm";
import WishDisplay from "@/components/WishDisplay";
import { generateWish, WishInputs } from "@/utils/wishService";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/AuthModal";
import PurchaseModal from "@/components/PurchaseModal";
import NotEnoughCredits from "@/components/NotEnoughCredits";
import CreditDisplay from "@/components/CreditDisplay";
import Header from "@/components/Header";
import Banner from "@/components/Banner";
import { getCurrentUser } from "@/utils/authService";
import { initializeCheckout } from "@/utils/paymentService";
import { WishBackground, WishEffect, Sparkle } from "@/components/Decorations";

export default function Home() {
  const { currentUser, refreshUserCredits } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedWish, setGeneratedWish] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [insufficientCredits, setInsufficientCredits] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  // Check if user has returned from checkout
  useEffect(() => {
    const checkPurchaseReturn = async () => {
      // Check if we just completed a purchase (either from URL or localStorage flag)
      const urlParams = new URLSearchParams(window.location.search);
      const needsRefresh =
        localStorage.getItem("credits_need_refresh") === "true";

      if (
        (urlParams.get("checkout") === "completed" || needsRefresh) &&
        currentUser
      ) {
        console.log("Refreshing credits after purchase");
        await refreshUserCredits();

        // Clean up
        localStorage.removeItem("credits_need_refresh");

        // Clean the URL if needed
        if (urlParams.get("checkout") === "completed") {
          window.history.replaceState({}, "", window.location.pathname);
        }
      }
    };

    checkPurchaseReturn();
  }, [currentUser, refreshUserCredits]);

  const handleGenerateWish = async (inputs: WishInputs) => {
    setIsLoading(true);
    setError(null);
    setInsufficientCredits(false);

    if (!currentUser) {
      setAuthModalOpen(true);
      setIsLoading(false);
      return;
    }
    try {
      const result = await generateWish(inputs, currentUser.id);
      setGeneratedWish(result.wish);
      // Refresh user credits after successful generation
      await refreshUserCredits();
    } catch (error: unknown) {
      console.error("Error generating wish:", error);
      if (error instanceof Error && error.message === "INSUFFICIENT_CREDITS") {
        setInsufficientCredits(true);
      } else {
        setError("Failed to generate wish. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    setGeneratedWish(null);
    setError(null);
    setInsufficientCredits(false);
  };

  const handleBuyCredits = () => {
    if (!currentUser) {
      setAuthModalOpen(true);
    } else {
      setShowPurchaseModal(true);
    }
  };

  const handlePurchase = async (packageId: string) => {
    try {
      setIsLoading(true);
      setError("");

      const currentUser = await getCurrentUser();
      // Check if this is a guest user
      if (
        !currentUser ||
        !currentUser.id ||
        currentUser.id.startsWith("guest-")
      ) {
        console.log("Guest user attempting to purchase, showing auth modal");
        setAuthModalOpen(true);
        setIsLoading(false);
        return;
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
    } catch (err: Error | unknown) {
      console.error("Purchase error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to process purchase. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = async () => {
    setAuthModalOpen(false);
    await refreshUserCredits();
    setShowPurchaseModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <WishBackground />
      </div>

      <Header
        onLogin={() => setAuthModalOpen(true)}
        onBuyCredits={handleBuyCredits}
      />

      <div className="container mx-auto px-4 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Banner />
        </motion.div>

        <main className="max-w-5xl mx-auto mt-12 relative">
          {/* Decorative sparkles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none -z-0 opacity-70">
            <Sparkle top="-10%" right="10%" size={14} />
            <Sparkle bottom="-5%" left="5%" size={10} delay={1.3} />
            <Sparkle top="50%" left="-5%" size={12} delay={0.7} />
            <Sparkle bottom="30%" right="-3%" size={8} delay={2} />
          </div>
          {/* Credit display for logged in users */}
          {currentUser && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8 flex justify-center"
            >
              <CreditDisplay onBuyCredits={handleBuyCredits} />
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 shadow-sm"
            >
              <p>{error}</p>
            </motion.div>
          )}{" "}
          {insufficientCredits ? (
            <NotEnoughCredits onBuyCredits={handleBuyCredits} />
          ) : generatedWish ? (
            <WishDisplay
              wish={generatedWish}
              onEdit={handleStartOver}
              userId={currentUser?.id}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden"
            >
              {/* Card effect border */}
              <WishEffect />

              <div className="relative p-8 md:p-10">
                <div className="mb-8 text-center">
                  <div className="flex justify-center mb-3">
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900">
                      <svg
                        className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                    Create Your Personalized Wish
                  </h2>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Fill in the details below to generate a unique and heartfelt
                    message
                  </p>
                </div>

                <WishForm onSubmit={handleGenerateWish} isLoading={isLoading} />
              </div>
            </motion.div>
          )}
        </main>

        <footer className="mt-16 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Powered by Gemini AI • {new Date().getFullYear()}</p>
        </footer>
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Purchase Modal */}
      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onPurchase={handlePurchase}
      />
    </div>
  );
}
