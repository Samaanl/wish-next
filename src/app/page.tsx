"use client";

import { useState } from "react";
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

export default function Home() {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedWish, setGeneratedWish] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [insufficientCredits, setInsufficientCredits] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

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
      if (!currentUser || !currentUser.id) {
        throw new Error("You must be logged in to purchase credits");
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
    setShowPurchaseModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Header
        onLogin={() => setAuthModalOpen(true)}
        onBuyCredits={handleBuyCredits}
      />

      <div className="container mx-auto px-4 py-8">
        <Banner />

        <main className="max-w-5xl mx-auto mt-12">
          {/* Credit display for logged in users */}
          {currentUser && (
            <div className="mb-8 flex justify-center">
              <CreditDisplay onBuyCredits={handleBuyCredits} />
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <p>{error}</p>
            </div>
          )}

          {insufficientCredits ? (
            <NotEnoughCredits onBuyCredits={handleBuyCredits} />
          ) : generatedWish ? (
            <WishDisplay wish={generatedWish} onEdit={handleStartOver} />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
                Create Your Personalized Wish
              </h2>
              <WishForm onSubmit={handleGenerateWish} isLoading={isLoading} />
            </div>
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
