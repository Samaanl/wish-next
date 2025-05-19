"use client";

import { useState } from "react";
import Image from "next/image";
import WishForm from "@/components/WishForm";
import WishDisplay from "@/components/WishDisplay";
import { generateWish, WishInputs } from "@/utils/wishService";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedWish, setGeneratedWish] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateWish = async (inputs: WishInputs) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await generateWish(inputs);
      setGeneratedWish(result.wish);
    } catch (error) {
      console.error("Error generating wish:", error);
      setError("Failed to generate wish. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    setGeneratedWish(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            <span className="text-indigo-600 dark:text-indigo-400">Wish</span>{" "}
            Generator
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Create beautifully written custom wishes for any occasion, perfectly
            tailored to your recipient.
          </p>
        </header>

        <main className="max-w-5xl mx-auto">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <p>{error}</p>
            </div>
          )}

          {generatedWish ? (
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
    </div>
  );
}
