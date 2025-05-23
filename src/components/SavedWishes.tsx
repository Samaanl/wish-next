import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { storage, STORAGE_ID, Query } from "@/utils/appwrite";
import LoadingAnimation from "./LoadingAnimation";
import SavedWishImage from "./SavedWishImage";
import { OccasionImage } from "@/utils/imageService";

interface SavedWishesProps {
  userId: string;
  onSelect?: (image: OccasionImage) => void;
}

const SavedWishes: React.FC<SavedWishesProps> = ({ userId, onSelect }) => {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<OccasionImage | null>(
    null
  );

  useEffect(() => {
    const fetchSavedImages = async () => {
      if (!userId || !STORAGE_ID) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Query files that contain the user ID in their name
        const response = await storage.listFiles(STORAGE_ID, [
          Query.search("name", userId),
          Query.limit(50),
        ]);

        // Extract file IDs
        const imageIds = response.files.map((file) => file.$id);
        setImages(imageIds);
      } catch (err) {
        console.error("Error fetching saved images:", err);
        setError("Failed to load your saved wishes. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchSavedImages();
  }, [userId]);

  const handleImageSelect = (image: OccasionImage) => {
    setSelectedImage(image);
    if (onSelect) {
      onSelect(image);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingAnimation />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <div className="text-6xl mb-4">🖼️</div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
          No Saved Wishes Yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Your saved wish images will appear here. Create a wish and save it to
          get started!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        Your Saved Wishes
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((imageId) => (
          <SavedWishImage
            key={imageId}
            imageId={imageId}
            onSelect={handleImageSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default SavedWishes;
