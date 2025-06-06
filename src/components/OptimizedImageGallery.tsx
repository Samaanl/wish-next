import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Occasion,
  OccasionImage,
  listImagesByOccasion,
  getDummyImagesForOccasion,
} from "@/utils/imageService";
import { useStableOperation, useThrottle } from "@/hooks/useStableHooks";
import LoadingAnimation from "./LoadingAnimation";
import LoadingFeedback from "./LoadingFeedback";

interface OptimizedImageGalleryProps {
  occasion: Occasion;
  onSelectImage: (image: OccasionImage) => void;
}

interface ImageLoadState {
  id: string;
  loaded: boolean;
  error: boolean;
  isLoading: boolean;
}

const OptimizedImageGallery: React.FC<OptimizedImageGalleryProps> = ({
  occasion,
  onSelectImage,
}) => {
  const [images, setImages] = useState<OccasionImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useDummyImages, setUseDummyImages] = useState(false);
  const [imageStates, setImageStates] = useState<
    Record<string, ImageLoadState>
  >({});
  const [isSelecting, setIsSelecting] = useState(false);
  const mountedRef = useRef(true);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { executeStable, isOperating } = useStableOperation();

  // Initialize image states when images change
  useEffect(() => {
    if (!mountedRef.current) return;

    const newImageStates: Record<string, ImageLoadState> = {};
    images.forEach((image) => {
      newImageStates[image.id] = {
        id: image.id,
        loaded: false,
        error: false,
        isLoading: true,
      };
    });
    setImageStates(newImageStates);
  }, [images]);

  useEffect(() => {
    const fetchImages = async () => {
      if (!mountedRef.current) return;

      try {
        setLoading(true);
        setError(null);
        setUseDummyImages(false);

        console.log(`Fetching images for occasion: ${occasion.id}`);

        // Fetch images with timeout to prevent hanging
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Fetch timeout")), 10000)
        );

        const fetchPromise = listImagesByOccasion(occasion.id);

        try {
          const occasionImages = await Promise.race([
            fetchPromise,
            timeoutPromise,
          ]);

          if (!mountedRef.current) return;

          // Check if we got dummy images
          if (
            occasionImages.length > 0 &&
            occasionImages[0].thumbnailUrl.includes("placehold.co")
          ) {
            setUseDummyImages(true);
            setError(
              "Using placeholder images - Appwrite storage images couldn't be loaded."
            );
          }

          setImages(occasionImages);
        } catch (fetchError) {
          if (!mountedRef.current) return;

          console.warn("Main fetch failed or timed out, using dummy images");
          const dummyImages = getDummyImagesForOccasion(occasion.id);
          setImages(dummyImages);
          setUseDummyImages(true);
          setError("Using placeholder images - main fetch failed.");
        }
      } catch (err) {
        if (!mountedRef.current) return;

        console.error("Fatal error in image fetching:", err);
        setError("Failed to load images. Using placeholder images instead.");

        // As a last resort, show dummy images
        const dummyImages = getDummyImagesForOccasion(occasion.id);
        setImages(dummyImages);
        setUseDummyImages(true);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchImages();
  }, [occasion.id]);
  // Optimized image loading with safe state updates
  const loadImageWithTimeout = useCallback(
    (image: OccasionImage, timeoutMs = 4000) => {
      return new Promise<void>((resolve, reject) => {
        if (!mountedRef.current) {
          reject(new Error("Component unmounted"));
          return;
        }

        const img = new Image();
        const timeout = setTimeout(() => {
          console.warn(`Image ${image.id} timed out after ${timeoutMs}ms`);
          if (mountedRef.current) {
            setImageStates((prev) => ({
              ...prev,
              [image.id]: {
                ...prev[image.id],
                error: true,
                isLoading: false,
              },
            }));
          }
          reject(new Error("timeout"));
        }, timeoutMs);

        img.onload = () => {
          clearTimeout(timeout);
          if (mountedRef.current) {
            setImageStates((prev) => ({
              ...prev,
              [image.id]: {
                ...prev[image.id],
                loaded: true,
                isLoading: false,
              },
            }));
            resolve();
          }
        };

        img.onerror = () => {
          clearTimeout(timeout);
          if (mountedRef.current) {
            setImageStates((prev) => ({
              ...prev,
              [image.id]: {
                ...prev[image.id],
                error: true,
                isLoading: false,
              },
            }));
          }
          reject(new Error("load error"));
        };

        // Don't set crossOrigin for placeholder images
        if (!image.thumbnailUrl.includes("placehold.co")) {
          img.crossOrigin = "anonymous";
        }

        img.src = image.thumbnailUrl;
      });
    },
    [] // No dependencies needed since we're using refs and functional state updates
  );

  // Load images progressively after the gallery is shown
  useEffect(() => {
    if (images.length === 0 || !mountedRef.current) return;

    const loadImagesSequentially = async () => {
      // Load images one by one to avoid overwhelming the server
      for (const image of images.slice(0, 8)) {
        // Limit to first 8 images
        if (!mountedRef.current) break;

        try {
          await loadImageWithTimeout(image, 3000); // 3 second timeout per image
          // Small delay between loads to be gentle on the server
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          console.warn(`Failed to load image ${image.id}:`, error);
          // Continue loading other images even if one fails
        }
      }
    };

    // Start loading after a brief delay to let the gallery render first
    loadingTimerRef.current = setTimeout(loadImagesSequentially, 100);

    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, [images, loadImageWithTimeout]);
  const handleImageClick = useThrottle(
    async (image: OccasionImage) => {
      // Prevent multiple rapid clicks and operations
      if (isSelecting || isOperating) return;

      try {
        await executeStable(() => {
          setIsSelecting(true);
          console.log(`Image ${image.id} selected`);
          onSelectImage(image);
          return true;
        });

        // Reset after operation completes
        setTimeout(() => {
          if (mountedRef.current) {
            setIsSelecting(false);
          }
        }, 300);
      } catch (error) {
        console.error("Error in image selection:", error);
        setIsSelecting(false);
      }
    },
    300 // Throttle for 300ms
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingFeedback
          isLoading={true}
          message={`Loading ${occasion.name} images...`}
        />
      </div>
    );
  }

  if (error && images.length === 0) {
    return (
      <div className="text-center py-12">
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

  return (
    <div className="w-full">
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
        Choose an Image for {occasion.name}
      </h3>
      {error && useDummyImages && (
        <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg text-sm border border-yellow-200 dark:border-yellow-800">
          <p className="text-yellow-800 dark:text-yellow-200">
            {error} Gallery remains functional with placeholder images.
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((image) => {
          const imageState = imageStates[image.id];
          const isLoaded = imageState?.loaded || false;
          const hasError = imageState?.error || false;
          const isLoading = imageState?.isLoading || false;

          return (
            <div
              key={image.id}
              className={`aspect-square rounded-lg overflow-hidden cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 relative ${
                isSelecting ? "pointer-events-none opacity-75" : ""
              }`}
              onClick={() => handleImageClick(image)}
            >
              {/* Base image - always clickable */}
              <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {hasError ? (
                  <div className="text-center text-gray-500 p-4">
                    <div className="text-2xl mb-2">📷</div>
                    <div className="text-xs">Image unavailable</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Click to use anyway
                    </div>
                  </div>
                ) : (
                  <img
                    src={image.thumbnailUrl}
                    alt={`${occasion.name} template`}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                      isLoaded ? "opacity-100" : "opacity-60"
                    }`}
                    loading="lazy"
                  />
                )}
              </div>

              {/* Loading indicator */}
              {isLoading && !hasError && (
                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                </div>
              )}

              {/* Loaded indicator */}
              {isLoaded && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                  ✓
                </div>
              )}
            </div>
          );
        })}
      </div>
      {images.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No images found for {occasion.name}. Please select another occasion.
          </p>
        </div>
      )}
    </div>
  );
};

export default OptimizedImageGallery;
