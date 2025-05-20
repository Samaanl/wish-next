import React from "react";

interface NotEnoughCreditsProps {
  onBuyCredits: () => void;
}

const NotEnoughCredits: React.FC<NotEnoughCreditsProps> = ({
  onBuyCredits,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8 text-center">
      <div className="mb-6 text-yellow-500 flex justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>{" "}
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
        You&apos;re out of credits!
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        You&apos;ve used all your free credits. Purchase more credits to
        continue generating beautiful wishes.
      </p>
      <button
        onClick={onBuyCredits}
        className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Buy Credits
      </button>
    </div>
  );
};

export default NotEnoughCredits;
