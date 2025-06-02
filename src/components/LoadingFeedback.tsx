import React from "react";

interface LoadingFeedbackProps {
  isLoading: boolean;
  progress?: number;
  error?: string | null;
  message?: string;
  showRetry?: boolean;
  onRetry?: () => void;
}

const LoadingFeedback: React.FC<LoadingFeedbackProps> = ({
  isLoading,
  progress = 0,
  error,
  message = "Loading images...",
  showRetry = false,
  onRetry,
}) => {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="text-red-600 dark:text-red-400 text-center mb-4">
          <svg
            className="w-12 h-12 mx-auto mb-2"
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
          <p className="font-medium">Failed to load images</p>
          <p className="text-sm opacity-75 mt-1">{error}</p>
        </div>
        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (!isLoading) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="relative mb-4">
        {/* Main loading spinner */}
        <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 rounded-full animate-spin border-t-indigo-600"></div>

        {/* Progress ring if progress is available */}
        {progress > 0 && (
          <div className="absolute inset-0 w-16 h-16">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                className="text-indigo-600"
                style={{
                  strokeDasharray: `${2 * Math.PI * 28}`,
                  strokeDashoffset: `${
                    2 * Math.PI * 28 * (1 - progress / 100)
                  }`,
                  transition: "stroke-dashoffset 0.3s ease",
                }}
              />
            </svg>
          </div>
        )}
      </div>

      <div className="text-center">
        <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">
          {message}
        </p>
        {progress > 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {Math.round(progress)}% complete
          </p>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          Loading optimized for fast display...
        </p>
      </div>

      {/* Animated dots for visual appeal */}
      <div className="flex space-x-1 mt-4">
        <div
          className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        ></div>
        <div
          className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        ></div>
        <div
          className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        ></div>
      </div>
    </div>
  );
};

export default LoadingFeedback;
