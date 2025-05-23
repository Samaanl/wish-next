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
    <div className="flex items-center space-x-2">
      <div className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center">
        <span className="mr-1.5 text-yellow-500">⭐</span>
        <span className="text-indigo-800 dark:text-indigo-200 font-medium">
          {creditsToShow} {creditsToShow === 1 ? "Credit" : "Credits"}
        </span>
      </div>

      <button
        onClick={onBuyCredits}
        className="text-xs px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
      >
        Buy More
      </button>
    </div>
  );
};

export default CreditDisplay;
