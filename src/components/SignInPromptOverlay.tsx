import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, SparklesIcon, GiftIcon } from "@heroicons/react/24/outline";

interface SignInPromptOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  onSignIn: () => void;
}

const SignInPromptOverlay: React.FC<SignInPromptOverlayProps> = ({
  isVisible,
  onClose,
  onSignIn,
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
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient */}
                        <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 sm:p-6 text-white relative">
                            <button
                onClick={onClose}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white hover:text-gray-200 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>

              <div className="text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white bg-opacity-20 rounded-full mb-3 sm:mb-4">
                                    <GiftIcon className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>{" "}
                                <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
                  🎉 Sign In & Get 3 Free Credits!
                </h2>
                                <p className="text-sm text-white text-opacity-90">
                  Join thousands creating amazing personalized wishes
                </p>
              </div>
            </div>

            {/* Content */}
                        <div className="p-4 sm:p-6">
                            <div className="text-center mb-4 sm:mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-full mb-3 sm:mb-4">
                                    <SparklesIcon className="h-8 w-8 sm:h-10 sm:h-10 text-indigo-600 dark:text-indigo-400" />
                </div>
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Unlock Your Free Wishes
                </h3>
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  Sign in with Google to get instant access to 3 free
                  AI-generated wishes. No credit card required!
                </p>
              </div>

              {/* Benefits list */}
                            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-green-600 dark:text-green-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                    3 free wishes instantly
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-green-600 dark:text-green-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                    Personalized AI messages
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-green-600 dark:text-green-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                    Save your favorite wishes
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-green-600 dark:text-green-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                    No credit card required
                  </span>
                </div>
              </div>

              {/* Action buttons */}
                            <div className="space-y-3">
                <button
                  onClick={onSignIn}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Sign In with Google & Get 3 Free Credits
                </button>
                <button
                  onClick={onClose}
                  className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Continue Browsing
                </button>
              </div>

              {/* Small print */}
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                You can browse and fill forms without signing in, but need an
                account to generate wishes.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SignInPromptOverlay;
