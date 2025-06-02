import React, { useEffect, useState } from "react";
import { OccasionImage, getImageById } from "@/utils/imageService";
import { motion } from "framer-motion";
import ProgressiveImage from "./ProgressiveImage";

interface SavedWishImageProps {
  imageId: string;
  onSelect?: (image: OccasionImage) => void;
}

const SavedWishImage: React.FC<SavedWishImageProps> = ({
  imageId,
  onSelect,
}) => {
  const [image, setImage] = useState<OccasionImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        setLoading(true);
        const fetchedImage = await getImageById(imageId);
        setImage(fetchedImage);
      } catch (err) {
        console.error("Failed to fetch image:", err);
        setError("Unable to load image");
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [imageId]);

  if (loading) {
    return (
      <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !image) {
    return (
      <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          {error || "Image not found"}
        </p>
      </div>
    );
  }
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="aspect-square rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200"
      onClick={() => onSelect && onSelect(image)}
    >
      {" "}
      <ProgressiveImage
        thumbnailUrl={image.thumbnailUrl}
        previewUrl={image.previewUrl}
        mediumUrl={image.mediumUrl}
        fullUrl={image.fullUrl}
        alt={`Saved wish for ${image.occasion}`}
        className="w-full h-full"
        onClick={() => onSelect && onSelect(image)}
        imageId={image.id}
      />
    </motion.div>
  );
};

export default SavedWishImage;
