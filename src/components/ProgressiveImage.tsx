import React, { useState, useEffect, useRef } from "react";
import { imageLoadingManager } from "../utils/imageService";

interface ProgressiveImageProps {
  thumbnailUrl: string; // Small preview (150x150)
  previewUrl: string; // Medium preview (400x400)
  mediumUrl: string; // Medium-high quality (800x800)
  fullUrl: string; // Full resolution
  alt: string;
  className?: string;
  onClick?: () => void;
  loadFullRes?: boolean; // Whether to load full resolution (for individual image view)
  onLoadComplete?: () => void;
  priority?: boolean; // If true, this image gets priority loading
  imageId?: string; // Unique identifier for priority management
}

const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  thumbnailUrl,
  previewUrl,
  mediumUrl,
  fullUrl,
  alt,
  className = "",
  onClick,
  loadFullRes = false,
  onLoadComplete,
  priority = false,
  imageId,
}) => {
  const [currentSrc, setCurrentSrc] = useState(thumbnailUrl);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Handle click with priority setting
  const handleClick = () => {
    if (imageId && onClick) {
      console.log(`🎯 User clicked image ${imageId}, setting priority`);
      imageLoadingManager.setPriority(imageId);

      // Restart loading with priority for this image
      startProgressiveLoading(true);
    }
    onClick?.();
  };
  const loadImageWithCancel = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const controller = abortControllerRef.current;

      if (controller?.signal.aborted) {
        reject(new Error("Loading cancelled"));
        return;
      }

      const img = new Image();

      // Don't set crossOrigin for placeholder images
      if (!src.includes("placehold.co")) {
        img.crossOrigin = "anonymous";
      }

      // Reduced timeout for faster fallbacks
      const timeout = setTimeout(() => {
        console.warn(`Progressive image timeout after 6 seconds: ${src}`);
        reject(new Error("Image load timeout"));
      }, 6000); // Reduced from 12 to 6 seconds

      // Set up abort listener
      controller?.signal.addEventListener("abort", () => {
        clearTimeout(timeout);
        reject(new Error("Loading cancelled"));
      });

      img.onload = () => {
        clearTimeout(timeout);
        resolve(img);
      };

      img.onerror = (error) => {
        clearTimeout(timeout);
        console.error(`Progressive image load error for ${src}:`, error);
        reject(new Error("Image load failed"));
      };

      img.src = src;
    });
  };
  const startProgressiveLoading = async (isPriority = false) => {
    let isMounted = true;
    setLoadError(false);
    setIsLoading(true);
    setLoadProgress(0);
    setIsUpgrading(false);

    // Create abort controller for this loading session
    abortControllerRef.current = new AbortController();

    // Register with loading manager if we have an imageId
    if (imageId) {
      imageLoadingManager.registerLoad(imageId, abortControllerRef.current);

      if (isPriority) {
        imageLoadingManager.setPriority(imageId);
      }
    }

    try {
      // Stage 1: Show thumbnail immediately (no loading needed)
      setCurrentSrc(thumbnailUrl);
      setLoadProgress(25);
      setIsLoading(false); // Hide loading spinner immediately

      // For gallery view, we can stop at thumbnail for fast loading
      // Only upgrade if it's priority or loadFullRes is requested
      const shouldUpgrade =
        isPriority ||
        loadFullRes ||
        (imageId && imageLoadingManager.hasPriority(imageId));

      if (!shouldUpgrade) {
        setLoadProgress(100);
        setIsUpgrading(false);
        onLoadComplete?.();
        if (imageId) {
          imageLoadingManager.completeLoad(imageId);
        }
        return;
      }

      // Stage 2: Load preview quality in background and show when ready
      if (isMounted && !abortControllerRef.current?.signal.aborted) {
        setIsUpgrading(true);
        try {
          await loadImageWithCancel(previewUrl);
          if (isMounted && !abortControllerRef.current?.signal.aborted) {
            setCurrentSrc(previewUrl);
            setLoadProgress(60);
          }
        } catch (previewError) {
          if (
            previewError instanceof Error &&
            !previewError.message.includes("cancelled") &&
            !previewError.message.includes("timeout")
          ) {
            console.warn(
              "Preview quality failed, staying with thumbnail:",
              previewError
            );
          }
          // On timeout or error, just stay with thumbnail
          if (isMounted) {
            setIsUpgrading(false);
            setLoadProgress(100);
            onLoadComplete?.();
            if (imageId) {
              imageLoadingManager.completeLoad(imageId);
            }
          }
          return;
        }
      }

      // Stage 3: Load medium quality only if priority or full res requested
      const shouldLoadMedium =
        loadFullRes || (imageId && imageLoadingManager.hasPriority(imageId));

      if (
        shouldLoadMedium &&
        isMounted &&
        !abortControllerRef.current?.signal.aborted
      ) {
        try {
          await loadImageWithCancel(mediumUrl);
          if (isMounted && !abortControllerRef.current?.signal.aborted) {
            setCurrentSrc(mediumUrl);
            setLoadProgress(85);
          }
        } catch (mediumError) {
          if (
            mediumError instanceof Error &&
            !mediumError.message.includes("cancelled") &&
            !mediumError.message.includes("timeout")
          ) {
            console.warn(
              "Medium quality failed, staying with current quality:",
              mediumError
            );
          }
          // Stop here on timeout/error
          if (isMounted) {
            setIsUpgrading(false);
            setLoadProgress(100);
            onLoadComplete?.();
            if (imageId) {
              imageLoadingManager.completeLoad(imageId);
            }
          }
          return;
        }
      }

      // Stage 4: Full resolution (only if specifically requested and this image has priority)
      const shouldLoadFull =
        loadFullRes && imageId && imageLoadingManager.hasPriority(imageId);

      if (
        shouldLoadFull &&
        isMounted &&
        !abortControllerRef.current?.signal.aborted
      ) {
        try {
          await loadImageWithCancel(fullUrl);
          if (isMounted && !abortControllerRef.current?.signal.aborted) {
            setCurrentSrc(fullUrl);
            setLoadProgress(100);
          }
        } catch (fullError) {
          if (
            fullError instanceof Error &&
            !fullError.message.includes("cancelled") &&
            !fullError.message.includes("timeout")
          ) {
            console.warn(
              "Full resolution failed, staying with current quality:",
              fullError
            );
          }
          // Don't treat this as an error, just stay with medium quality
        }
      }

      if (isMounted && !abortControllerRef.current?.signal.aborted) {
        setLoadProgress(100);
        setIsUpgrading(false);
        onLoadComplete?.();

        // Clean up from loading manager
        if (imageId) {
          imageLoadingManager.completeLoad(imageId);
        }
      }
    } catch (error) {
      if (error instanceof Error && !error.message.includes("cancelled")) {
        console.error("Progressive image loading error:", error);
        if (isMounted) {
          setIsLoading(false);
          setIsUpgrading(false);
          setLoadError(true);
        }
      }
    }

    return () => {
      isMounted = false;
    };
  };

  useEffect(() => {
    startProgressiveLoading(priority);

    return () => {
      // Cancel any ongoing loading when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (imageId) {
        imageLoadingManager.cancelLoad(imageId);
      }
    };
  }, [
    thumbnailUrl,
    previewUrl,
    mediumUrl,
    fullUrl,
    loadFullRes,
    priority,
    imageId,
  ]);
  if (loadError) {
    return (
      <div
        className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}
        onClick={handleClick}
      >
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">📷</div>
          <div className="text-sm">Failed to load image</div>
        </div>
      </div>
    );
  }
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onClick={handleClick}
    >
      {/* Single img element with smooth transitions via CSS */}
      <img
        src={currentSrc}
        alt={alt}
        className="w-full h-full object-cover transition-opacity duration-300"
        style={{
          opacity: isLoading ? 0.7 : 1,
          background: isLoading ? "#f3f4f6" : "transparent",
        }}
      />

      {/* Loading spinner overlay - only show initially */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Priority indicator */}
      {imageId && imageLoadingManager.hasPriority(imageId) && (
        <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded flex items-center">
          <span className="mr-1">🎯</span>
          Priority
        </div>
      )}

      {/* Small loading indicator in corner while upgrading quality */}
      {isUpgrading && loadProgress < 100 && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
          Upgrading...
        </div>
      )}

      {/* Quality indicator */}
      {loadProgress === 100 && loadFullRes && (
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
          {currentSrc === fullUrl
            ? "HD"
            : currentSrc === mediumUrl
            ? "HQ"
            : currentSrc === previewUrl
            ? "MQ"
            : "LQ"}
        </div>
      )}
    </div>
  );
};

export default ProgressiveImage;
