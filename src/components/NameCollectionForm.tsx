"use client";

import React, { useState } from "react";

interface NameCollectionFormProps {
  email: string;
  onNameSubmit: (name: string) => Promise<void>;
  onSkip: () => void;
  isLoading?: boolean;
}

const NameCollectionForm: React.FC<NameCollectionFormProps> = ({
  email,
  onNameSubmit,
  onSkip,
  isLoading = false,
}) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please enter your name");
      return;
    }

    if (trimmedName.length < 2) {
      setError("Name must be at least 2 characters long");
      return;
    }

    try {
      setError("");
      await onNameSubmit(trimmedName);
    } catch (err) {
      console.error("Error submitting name:", err);
      setError(err instanceof Error ? err.message : "Failed to save name");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Welcome to Wish Generator!
          </h2>
          <p className="text-gray-600 text-sm">
            You've successfully signed in with <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              What should we call you?
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
              autoFocus
            />
            {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </div>
              ) : (
                "Continue"
              )}
            </button>

            <button
              type="button"
              onClick={onSkip}
              disabled={isLoading}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 focus:outline-none disabled:opacity-50 transition-colors"
            >
              Skip
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            This helps us personalize your experience
          </p>
        </div>
      </div>
    </div>
  );
};

export default NameCollectionForm;
