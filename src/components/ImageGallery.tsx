import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Occasion,
  OccasionImage,
  listImagesByOccasion,
  getDummyImagesForOccasion,
  createOptimizedImage,
} from "@/utils/imageService";
import LoadingAnimation from "./LoadingAnimation";

interface ImageGalleryProps {
  occasion: Occasion;
  onSelectImage: (image: OccasionImage) => void;
}

interface OptimizedImage extends OccasionImage {
  thumbnailUrl: string;
  isHighQualityLoaded: boolean;
  loadStartTime?: number;
  loadDuration?: number;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  occasion,
  onSelectImage,
}) => {
  const [images, setImages] = useState<OptimizedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useDummyImages, setUseDummyImages] = useState(false);
  const [loadingImageId, setLoadingImageId] = useState<string | null>(null); // Convert OccasionImage to OptimizedImage using the service helper
  const convertToOptimizedImages = (
    occasionImages: OccasionImage[]
  ): OptimizedImage[] => {
    return occasionImages.map(createOptimizedImage);
  };
  // Handle high-quality image loading when clicked
  const handleImageClick = async (image: OptimizedImage) => {
    const startTime = Date.now();
    setLoadingImageId(image.id);

    // Update the image to mark loading start time
    setImages((prevImages) =>
      prevImages.map((prevImage) =>
        prevImage.id === image.id
          ? { ...prevImage, loadStartTime: startTime }
          : prevImage
      )
    );

    try {
      // Preload the high-quality image
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const loadDuration = Date.now() - startTime;

          // Update the image to mark high quality as loaded with timing
          setImages((prevImages) =>
            prevImages.map((prevImage) =>
              prevImage.id === image.id
                ? {
                    ...prevImage,
                    isHighQualityLoaded: true,
                    loadDuration: loadDuration,
                  }
                : prevImage
            )
          );
          resolve();
        };
        img.onerror = reject;
        img.src = image.previewUrl; // Load the full preview quality
      });

      // Small delay to show the high-quality image before selecting
      setTimeout(() => {
        onSelectImage(image);
        setLoadingImageId(null);
      }, 300);
    } catch (error) {
      console.error("Failed to load high-quality image:", error);
      // If high-quality loading fails, still proceed with selection
      onSelectImage(image);
      setLoadingImageId(null);
    }
  };

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        setError(null);
        setUseDummyImages(false);

        console.log(`Fetching images for occasion: ${occasion.id}`);
        // The listImagesByOccasion function now handles all errors internally
        // and will always return either real images or dummy images
        const occasionImages = await listImagesByOccasion(occasion.id);

        // Check if we got dummy images
        if (
          occasionImages.length > 0 &&
          occasionImages[0].previewUrl.includes("placehold.co")
        ) {
          setUseDummyImages(true);
          setError(
            "Using placeholder images - Appwrite storage images couldn't be loaded."
          );
        }

        setImages(convertToOptimizedImages(occasionImages));
      } catch (err) {
        console.error("Fatal error in image fetching:", err);
        setError("Failed to load images. Using placeholder images instead.");

        // As a last resort, show dummy images
        if (images.length === 0) {
          const dummyImages = getDummyImagesForOccasion(occasion.id);
          setImages(convertToOptimizedImages(dummyImages));
          setUseDummyImages(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [occasion.id]);

  // Optional: Preload a few high-quality images in the background for better UX
  useEffect(() => {
    if (images.length > 0 && !useDummyImages) {
      // Preload the first 2 images after a short delay to not interfere with initial page load
      const preloadTimer = setTimeout(() => {
        images.slice(0, 2).forEach((image, index) => {
          if (!image.isHighQualityLoaded) {
            setTimeout(() => {
              const img = new Image();
              img.onload = () => {
                setImages((prevImages) =>
                  prevImages.map((prevImage) =>
                    prevImage.id === image.id
                      ? { ...prevImage, isHighQualityLoaded: true }
                      : prevImage
                  )
                );
              };
              img.src = image.previewUrl;
            }, index * 1000); // Stagger preloading to avoid overwhelming the network
          }
        });
      }, 2000); // Wait 2 seconds before starting background preload

      return () => clearTimeout(preloadTimer);
    }
  }, [images, useDummyImages]);

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
        <p className="text-red-500 mb-4">{error}</p>{" "}
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
                  className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200 relative"
                  onClick={() => handleImageClick(image)}
                >
                  {/* Thumbnail image with blur effect */}
                  <img
                    src={image.thumbnailUrl}
                    alt={`${occasion.name} template thumbnail`}
                    className={`w-full h-full object-cover transition-all duration-500 ${
                      image.isHighQualityLoaded
                        ? "opacity-0"
                        : "opacity-100 filter blur-sm"
                    }`}
                  />

                  {/* High-quality image overlay */}
                  {image.isHighQualityLoaded && (
                    <img
                      src={image.previewUrl}
                      alt={`${occasion.name} template`}
                      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 opacity-100"
                    />
                  )}

                  {/* Loading overlay */}
                  {loadingImageId === image.id && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                        <span className="text-white text-xs font-medium">
                          Loading...
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Quality indicator */}
                  <div className="absolute top-2 right-2">
                    <div
                      className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                        image.isHighQualityLoaded
                          ? "bg-green-400"
                          : "bg-yellow-400"
                      }`}
                      title={
                        image.isHighQualityLoaded
                          ? "High quality"
                          : "Loading preview..."
                      }
                    ></div>
                  </div>
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
      {/* Helpful text about the optimization */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center space-x-2 text-sm text-blue-700 dark:text-blue-300">
          <span>⚡</span>
          <span>
            <strong>Fast Loading:</strong> Images load instantly as low-quality
            previews, then upgrade to HD when clicked
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((image) => (
          <motion.div
            key={image.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200 relative group"
            onClick={() => handleImageClick(image)}
          >
            {/* Thumbnail image with blur effect */}
            <img
              src={image.thumbnailUrl}
              alt={`${occasion.name} template thumbnail`}
              className={`w-full h-full object-cover transition-all duration-500 ${
                image.isHighQualityLoaded
                  ? "opacity-0"
                  : "opacity-100 filter blur-sm"
              }`}
            />

            {/* High-quality image overlay */}
            {image.isHighQualityLoaded && (
              <img
                src={image.previewUrl}
                alt={`${occasion.name} template`}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 opacity-100"
              />
            )}
            {/* Loading overlay */}
            {loadingImageId === image.id && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                  <span className="text-white text-xs font-medium">
                    Loading HD...
                  </span>
                  {image.loadStartTime && (
                    <span className="text-white text-xs opacity-75">
                      {Math.floor((Date.now() - image.loadStartTime) / 100) /
                        10}
                      s
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Quality indicator with performance info */}
            <div className="absolute top-2 right-2 flex flex-col items-end space-y-1">
              <div
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  image.isHighQualityLoaded
                    ? "bg-green-400 shadow-lg"
                    : "bg-yellow-400"
                }`}
                title={
                  image.isHighQualityLoaded
                    ? `High quality loaded${
                        image.loadDuration ? ` in ${image.loadDuration}ms` : ""
                      }`
                    : "Preview quality"
                }
              ></div>

              {/* Performance badge */}
              {image.isHighQualityLoaded &&
                image.loadDuration &&
                image.loadDuration < 1000 && (
                  <div className="bg-green-500 text-white text-xs px-1 rounded opacity-75">
                    Fast
                  </div>
                )}
            </div>
            {/* Hover overlay with click hint */}
            {!image.isHighQualityLoaded && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-2">
                <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">
                  Click for HD
                </span>
              </div>
            )}

            {/* Preloaded indicator */}
            {image.isHighQualityLoaded && loadingImageId !== image.id && (
              <div className="absolute inset-0 bg-gradient-to-t from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-2">
                <span className="text-green-300 text-xs font-medium bg-green-900/50 px-2 py-1 rounded">
                  ✓ HD Ready
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ImageGallery;
