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
import SavedTextWishes from "@/components/SavedTextWishes";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FirstTimeOverlay from "@/components/FirstTimeOverlay";
import SignInPromptOverlay from "@/components/SignInPromptOverlay";
import { getCurrentUser } from "@/utils/authService";
import { initializeCheckout } from "@/utils/paymentService";
import { WishBackground, WishEffect, Sparkle } from "@/components/Decorations";

export default function Home() {
  const { currentUser, refreshUserCredits } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedWishes, setGeneratedWishes] = useState<string[]>([]);
  const [currentWishIndex, setCurrentWishIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [insufficientCredits, setInsufficientCredits] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showSavedWishes, setShowSavedWishes] = useState(false);
  const [showFirstTimeOverlay, setShowFirstTimeOverlay] = useState(false);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [lastFormInputs, setLastFormInputs] = useState<WishInputs | null>(null);
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false);

  // Load saved form data from localStorage on mount
  useEffect(() => {
    const savedFormData = localStorage.getItem("wishFormData");
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        setLastFormInputs(parsedData);
      } catch (error) {
        console.error("Error parsing saved form data:", error);
        localStorage.removeItem("wishFormData");
      }
    }
  }, []);

  // Check for first time visit
  useEffect(() => {
    const hasSeenOverlay = localStorage.getItem("hasSeenWishOverlay");
    if (!hasSeenOverlay) {
      setShowFirstTimeOverlay(true);
    }
  }, []);
  const handleCloseFirstTimeOverlay = () => {
    setShowFirstTimeOverlay(false);
    localStorage.setItem("hasSeenWishOverlay", "true");
  };

  // Note: Sign-in prompt will only show when user tries to generate a wish
  // No automatic timer needed - it's handled in handleGenerateWish function

  const handleCloseSignInPrompt = () => {
    setShowSignInPrompt(false);
    localStorage.setItem("hasSeenSignInPrompt", "true");
  };

  const handleSignInFromPrompt = () => {
    setShowSignInPrompt(false);
    setAuthModalOpen(true);
  };
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

    // Store form inputs for potential editing
    setLastFormInputs(inputs);
    localStorage.setItem("wishFormData", JSON.stringify(inputs));

    // Check if user is authenticated (not a guest user)
    if (!currentUser || currentUser.isGuest) {
      const hasSeenSignInPrompt = localStorage.getItem("hasSeenSignInPrompt");
      if (!hasSeenSignInPrompt) {
        // Show the attractive sign-in prompt first
        setShowSignInPrompt(true);
      } else {
        // User has seen the prompt before, go straight to auth modal
        setAuthModalOpen(true);
      }
      setIsLoading(false);
      return;
    }
    try {
      // Generate 3 variants of the wish
      const promises = Array(3)
        .fill(null)
        .map(() => generateWish(inputs, currentUser.id));
      const results = await Promise.all(promises);
      const wishes = results.map((result) => result.wish);

      setGeneratedWishes(wishes);
      setCurrentWishIndex(0);
      // Refresh user credits after successful generation
      await refreshUserCredits();
      // Keep form data in case user wants to edit, don't clear it
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
    setGeneratedWishes([]);
    setCurrentWishIndex(0);
    setError(null);
    setInsufficientCredits(false);
    // Keep lastFormInputs so user can edit their previous selections
  };

  const handleGenerateMoreVariants = async () => {
    if (!lastFormInputs || !currentUser || isGeneratingVariants) return;

    setIsGeneratingVariants(true);
    setError(null);

    try {
      // Generate 3 more variants
      const promises = Array(3)
        .fill(null)
        .map(() => generateWish(lastFormInputs, currentUser.id));
      const results = await Promise.all(promises);
      const newWishes = results.map((result) => result.wish);

      // Add new wishes to existing ones
      setGeneratedWishes((prev) => [...prev, ...newWishes]);

      // Refresh user credits after successful generation
      await refreshUserCredits();
    } catch (error: unknown) {
      console.error("Error generating more variants:", error);
      if (error instanceof Error && error.message === "INSUFFICIENT_CREDITS") {
        setInsufficientCredits(true);
      } else {
        setError("Failed to generate more variants. Please try again.");
      }
    } finally {
      setIsGeneratingVariants(false);
    }
  }; // Complete reset function to return to starting state
  const handleResetToStart = () => {
    // Reset all main states
    setGeneratedWishes([]);
    setCurrentWishIndex(0);
    setError(null);
    setInsufficientCredits(false);
    setAuthModalOpen(false);
    setShowPurchaseModal(false);
    setShowSavedWishes(false);
    setShowSignInPrompt(false);
    setIsLoading(false);
    setLastFormInputs(null); // Clear saved form data on complete reset
    localStorage.removeItem("wishFormData"); // Clear from localStorage too

    // Clear any URL parameters
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", window.location.pathname);
    }
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
      </div>{" "}
      <Header
        onLogin={() => setAuthModalOpen(true)}
        onBuyCredits={handleBuyCredits}
        onCloseCreditSection={() => setShowPurchaseModal(false)}
        onViewSavedWishes={() => setShowSavedWishes(true)}
        onResetToStart={handleResetToStart}
      />{" "}
      <div className="container mx-auto px-4 py-4 relative z-10">
        <main className="max-w-5xl mx-auto relative">
          {/* Decorative sparkles */}{" "}
          <div className="absolute inset-0 overflow-hidden pointer-events-none -z-0 opacity-70">
            <Sparkle top="-10%" right="10%" size={14} />
            <Sparkle bottom="-5%" left="5%" size={10} delay={1.3} />
            <Sparkle top="50%" left="-5%" size={12} delay={0.7} />
            <Sparkle bottom="30%" right="-3%" size={8} delay={2} />
          </div>{" "}
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
          ) : generatedWishes.length > 0 ? (
            <WishDisplay
              wishes={generatedWishes}
              currentWishIndex={currentWishIndex}
              onWishIndexChange={setCurrentWishIndex}
              onEdit={handleStartOver}
              onGenerateMoreVariants={handleGenerateMoreVariants}
              isGeneratingVariants={isGeneratingVariants}
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
                {" "}
                <div className="mb-8 text-center">
                  <div className="flex justify-center mb-4">
                    <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg">
                      <svg
                        className="w-8 h-8 text-white"
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
                  <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 mb-3">
                    Create Your Perfect Wish
                  </h1>{" "}
                  <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Generate personalized, heartfelt messages for any occasion
                    in seconds
                  </p>
                </div>
                <WishForm
                  onSubmit={handleGenerateWish}
                  isLoading={isLoading}
                  initialValues={lastFormInputs || undefined}
                />
              </div>
            </motion.div>
          )}{" "}
        </main>

        <Footer />
      </div>
      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />{" "}
      {/* Purchase Modal */}
      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onPurchase={handlePurchase}
      />{" "}
      {/* Saved Text Wishes Modal */}
      <SavedTextWishes
        userId={currentUser?.id || ""}
        isVisible={showSavedWishes}
        onClose={() => setShowSavedWishes(false)}
      />{" "}
      {/* First Time Overlay */}
      <FirstTimeOverlay
        isVisible={showFirstTimeOverlay}
        onClose={handleCloseFirstTimeOverlay}
      />
      {/* Sign In Prompt Overlay */}
      <SignInPromptOverlay
        isVisible={showSignInPrompt}
        onClose={handleCloseSignInPrompt}
        onSignIn={handleSignInFromPrompt}
      />
    </div>
  );
}
