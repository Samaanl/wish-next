import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getSavedWishes } from "@/utils/wishService";
import LoadingAnimation from "./LoadingAnimation";
import {
  ClockIcon,
  HeartIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";

interface SavedWish {
  $id: string;
  user_id: string;
  wish_text: string;
  occasion: string;
  created_at: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  $collectionId: string;
  $databaseId: string;
}

interface SavedTextWishesProps {
  userId: string;
  isVisible: boolean;
  onClose: () => void;
}

const SavedTextWishes: React.FC<SavedTextWishesProps> = ({
  userId,
  isVisible,
  onClose,
}) => {
  const [wishes, setWishes] = useState<SavedWish[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedWishId, setCopiedWishId] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible && userId && !userId.startsWith("guest_")) {
      fetchSavedWishes();
    }
  }, [isVisible, userId]);

  const fetchSavedWishes = async () => {
    try {
      setLoading(true);
      setError(null);
      const savedWishes = await getSavedWishes(userId);
      setWishes(savedWishes as unknown as SavedWish[]);
    } catch (err) {
      console.error("Error fetching saved wishes:", err);
      setError("Failed to load your saved wishes. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, wishId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedWishId(wishId);
      setTimeout(() => setCopiedWishId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <HeartIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Your Saved Wishes
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Browse and copy your previously generated wishes
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingAnimation />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 dark:text-red-400 mb-4">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={fetchSavedWishes}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : wishes.length === 0 ? (
            <div className="text-center py-12">
              <HeartIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No saved wishes yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Generate your first wish and it will automatically be saved
                here!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {wishes.map((wish) => (
                <motion.div
                  key={wish.$id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600"
                >
                  {/* Wish Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-sm font-medium rounded-full">
                        {wish.occasion}
                      </span>
                      <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {formatDate(wish.created_at)}
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(wish.wish_text, wish.$id)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                        copiedWishId === wish.$id
                          ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                          : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500"
                      }`}
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {copiedWishId === wish.$id ? "Copied!" : "Copy"}
                      </span>
                    </button>
                  </div>

                  {/* Wish Text */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <p className="text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
                      {wish.wish_text}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SavedTextWishes;
