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

  if (!currentUser) return null;

  // Use displayCredits as fallback if available, otherwise use current user credits
  const creditsToShow =
    displayCredits !== null ? displayCredits : currentUser.credits || 0;
  return (
    <button
      onClick={onBuyCredits}
      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-sm hover:shadow-md transform hover:scale-105"
    >
      <div className="flex items-center space-x-1">
        <span className="text-yellow-300 text-lg">⭐</span>
        <span className="font-semibold">
          {creditsToShow} {creditsToShow === 1 ? "Credit" : "Credits"}
        </span>
      </div>
      <div className="w-px h-4 bg-white/30"></div>
      <span className="text-sm font-medium">Buy More</span>
    </button>
  );
};

export default CreditDisplay;
