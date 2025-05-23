import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Occasion,
  OccasionImage,
  listImagesByOccasion,
  getDummyImagesForOccasion,
} from "@/utils/imageService";
import LoadingAnimation from "./LoadingAnimation";

interface ImageGalleryProps {
  occasion: Occasion;
  onSelectImage: (image: OccasionImage) => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  occasion,
  onSelectImage,
}) => {
  const [images, setImages] = useState<OccasionImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useDummyImages, setUseDummyImages] = useState(false);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        setError(null);

        try {
          console.log(`Fetching images for occasion: ${occasion.id}`);
          const occasionImages = await listImagesByOccasion(occasion.id);
          setImages(occasionImages);
        } catch (apiError) {
          console.error("Failed to fetch images from API:", apiError);
          setError(
            "Failed to load images from storage. Using placeholder images instead."
          );

          // Use dummy images as a fallback
          console.log("Falling back to dummy images");
          setUseDummyImages(true);
          const dummyImages = getDummyImagesForOccasion(occasion.id);
          setImages(dummyImages);
        }
      } catch (err) {
        console.error("Fatal error in image fetching:", err);
        setError("Failed to load images. Please try again.");

        // As a last resort, show dummy images
        if (images.length === 0) {
          const dummyImages = getDummyImagesForOccasion(occasion.id);
          setImages(dummyImages);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [occasion.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingAnimation />
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        {useDummyImages && images.length > 0 ? (
          <>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Showing placeholder images:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((image) => (
                <motion.div
                  key={image.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200"
                  onClick={() => onSelectImage(image)}
                >
                  <img
                    src={image.previewUrl}
                    alt={`${occasion.name} template`}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          No images found for {occasion.name}. Please select another occasion.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
        Choose an Image for {occasion.name}
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((image) => (
          <motion.div
            key={image.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={() => onSelectImage(image)}
          >
            <img
              src={image.previewUrl}
              alt={`${occasion.name} template`}
              className="w-full h-full object-cover"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ImageGallery;
