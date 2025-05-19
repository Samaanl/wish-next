import React from "react";
import { useAuth } from "@/contexts/AuthContext";

interface CreditDisplayProps {
  onBuyCredits: () => void;
}

const CreditDisplay: React.FC<CreditDisplayProps> = ({ onBuyCredits }) => {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  return (
    <div className="flex items-center space-x-2">
      <div className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center">
        <span className="mr-1.5 text-yellow-500">⭐</span>
        <span className="text-indigo-800 dark:text-indigo-200 font-medium">
          {currentUser.credits}{" "}
          {currentUser.credits === 1 ? "Credit" : "Credits"}
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
