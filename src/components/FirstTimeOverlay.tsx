import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, SparklesIcon } from "@heroicons/react/24/outline";

interface FirstTimeOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

const FirstTimeOverlay: React.FC<FirstTimeOverlayProps> = ({
  isVisible,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 text-white relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <SparklesIcon className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">AI Wish Generator</h2>
                  <p className="text-white text-opacity-90 text-sm">
                    Create perfect wishes instantly
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-indigo-600 dark:text-indigo-400 text-sm font-bold">
                      1
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Choose Your Occasion
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Pick from birthdays, anniversaries, congratulations, and
                      more
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-purple-600 dark:text-purple-400 text-sm font-bold">
                      2
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Add Personal Details
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Include recipient's name, your relationship, and special
                      memories
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-pink-600 dark:text-pink-400 text-sm font-bold">
                      3
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Get Perfect Wishes
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      AI creates personalized, heartfelt messages you can edit
                      and save
                    </p>
                  </div>
                </div>
              </div>{" "}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      🎁 3 free wishes after sign up
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                      Sign up required
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Browse and fill forms freely • Sign in to generate wishes
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Start Creating Wishes
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FirstTimeOverlay;
