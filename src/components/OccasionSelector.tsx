import React from "react";
import { motion } from "framer-motion";
import { Occasion, occasions } from "@/utils/imageService";

interface OccasionSelectorProps {
  onSelectOccasion: (occasion: Occasion) => void;
  selectedOccasion: Occasion | null;
}

const OccasionSelector: React.FC<OccasionSelectorProps> = ({
  onSelectOccasion,
  selectedOccasion,
}) => {
  return (
    <div className="w-full">
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
        Select an Occasion
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {occasions.map((occasion) => (
          <motion.div
            key={occasion.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              p-4 rounded-lg cursor-pointer transition-colors duration-200
              ${
                selectedOccasion?.id === occasion.id
                  ? "bg-indigo-100 dark:bg-indigo-900 border-2 border-indigo-500"
                  : "bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent"
              }
            `}
            onClick={() => onSelectOccasion(occasion)}
          >
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-4xl mb-2">{occasion.icon}</span>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {occasion.name}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default OccasionSelector;
