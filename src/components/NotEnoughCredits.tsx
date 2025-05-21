import React from "react";
import { useAuth } from "@/contexts/AuthContext";

interface NotEnoughCreditsProps {
  onBuyCredits: () => void;
}

const NotEnoughCredits: React.FC<NotEnoughCreditsProps> = ({
  onBuyCredits,
}) => {
  const { currentUser } = useAuth();

  // Check if the user is a guest user
  const isGuestUser = currentUser?.isGuest === true;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8 text-center">
      <div className="text-5xl mb-4">😢</div>
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
        You&apos;ve Run Out of Credits
      </h2>

      {isGuestUser ? (
        <>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Sign in to get more credits or purchase additional credits to
            continue generating wishes.
          </p>
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center">
            <button
              onClick={onBuyCredits}
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded"
            >
              Sign In
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Purchase more credits to continue generating personalized wishes.
          </p>
          <div className="flex justify-center">
            <button
              onClick={onBuyCredits}
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded"
            >
              Buy Credits
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default NotEnoughCredits;
