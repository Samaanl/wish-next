import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface CreditDisplayProps {
  onBuyCredits: () => void;
}

const CreditDisplay: React.FC<CreditDisplayProps> = ({ onBuyCredits }) => {
  const { currentUser, refreshUserCredits } = useAuth();
  const [displayCredits, setDisplayCredits] = useState<number | null>(null);

  // Initialize display credits from currentUser
  useEffect(() => {
    if (currentUser && currentUser.credits !== undefined) {
      setDisplayCredits(currentUser.credits);
    }
  }, [currentUser]);

  // Check for and handle credit refresh flag
  useEffect(() => {
    const refreshNeeded =
      localStorage.getItem("credits_need_refresh") === "true";

    if (refreshNeeded && currentUser) {
      console.log("Refreshing credits from CreditDisplay component");

      // Immediately clear the flag to prevent other components from refreshing too
      localStorage.removeItem("credits_need_refresh");

      // Refresh the credits
      refreshUserCredits()
        .then(() => {
          console.log("Credits refreshed successfully");
        })
        .catch((error) => {
          console.error("Error refreshing credits:", error);
        });
    }
  }, [currentUser, refreshUserCredits]);

  // The AuthContext already handles guest users properly with localStorage persistence
  // So we can trust currentUser to always have the correct credit information
  const creditsToShow = currentUser
    ? displayCredits !== null
      ? displayCredits
      : currentUser.credits || 0
    : 0; // Will be 0 only during loading, AuthContext will set guest user

  // Don't render if no user (still loading)
  if (!currentUser) return null;

  return (
    <button
      onClick={onBuyCredits}
      className="flex items-center space-x-1 sm:space-x-2 px-1.5 sm:px-4 py-1 sm:py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-md sm:rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-sm hover:shadow-md transform hover:scale-105 text-sm"
    >
      <div className="flex items-center space-x-0.5 sm:space-x-1">
        <span className="text-yellow-300 text-sm sm:text-lg">⭐</span>
        <span className="font-semibold text-xs sm:text-sm">
          <span className="hidden xs:inline">
            {creditsToShow} {creditsToShow === 1 ? "Credit" : "Credits"}
          </span>
          <span className="xs:hidden">{creditsToShow}</span>
        </span>
      </div>
      <div className="w-px h-3 sm:h-4 bg-white/30 hidden sm:block"></div>
      <span className="text-xs sm:text-sm font-medium hidden sm:inline">
        Buy More
      </span>
      <span className="text-xs font-medium sm:hidden">+</span>
    </button>
  );
};

export default CreditDisplay;
