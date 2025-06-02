import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface FastImageProps {
  thumbnailUrl: string;
  previewUrl: string;
  mediumUrl?: string;
  fullUrl?: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  loadHighQuality?: boolean; // Whether to attempt loading higher quality
  timeout?: number; // Timeout in milliseconds (default: 4000)
}

const FastImage: React.FC<FastImageProps> = ({
  thumbnailUrl,
  previewUrl,
  mediumUrl,
  fullUrl,
  alt,
  className = "",
  onClick,
  loadHighQuality = false,
  timeout = 4000,
}) => {
  const [currentSrc, setCurrentSrc] = useState(thumbnailUrl);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [loadedSrc, setLoadedSrc] = useState<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  // Preload an image with timeout
  const preloadImage = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!mountedRef.current) {
        reject(new Error("Component unmounted"));
        return;
      }

      const img = new Image();
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout loading ${src}`));
      }, timeout);

      img.onload = () => {
        clearTimeout(timeoutId);
        if (mountedRef.current) {
          resolve();
        }
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error(`Failed to load ${src}`));
      };

      // Handle cancellation
      if (abortControllerRef.current) {
        abortControllerRef.current.signal.addEventListener("abort", () => {
          clearTimeout(timeoutId);
          reject(new Error("Cancelled"));
        });
      }

      // Don't set crossOrigin for placeholder images
      if (!src.includes("placehold.co")) {
        img.crossOrigin = "anonymous";
      }

      img.src = src;
    });
  };

  // Progressive upgrade strategy
  useEffect(() => {
    if (!loadHighQuality) {
      // Just stay with thumbnail for fast gallery loading
      setLoadedSrc(thumbnailUrl);
      return;
    }

    let isMounted = true;
    abortControllerRef.current = new AbortController();

    const upgradeImage = async () => {
      try {
        // Start with thumbnail (immediate)
        setCurrentSrc(thumbnailUrl);
        setLoadedSrc(thumbnailUrl);

        // Try to upgrade to preview
        if (isMounted) {
          setIsUpgrading(true);
          try {
            await preloadImage(previewUrl);
            if (isMounted) {
              setCurrentSrc(previewUrl);
              setLoadedSrc(previewUrl);
            }
          } catch (error) {
            console.warn("Preview upgrade failed:", error);
            // Stay with thumbnail
          }
        }

        // Try to upgrade to medium quality if available
        if (mediumUrl && isMounted) {
          try {
            await preloadImage(mediumUrl);
            if (isMounted) {
              setCurrentSrc(mediumUrl);
              setLoadedSrc(mediumUrl);
            }
          } catch (error) {
            console.warn("Medium quality upgrade failed:", error);
            // Stay with current quality
          }
        }

        // Only load full quality if explicitly requested and no timeout
        if (fullUrl && isMounted && timeout > 8000) {
          try {
            await preloadImage(fullUrl);
            if (isMounted) {
              setCurrentSrc(fullUrl);
              setLoadedSrc(fullUrl);
            }
          } catch (error) {
            console.warn("Full quality upgrade failed:", error);
            // Stay with current quality
          }
        }
      } catch (error) {
        if (isMounted) {
          setHasError(true);
        }
      } finally {
        if (isMounted) {
          setIsUpgrading(false);
        }
      }
    };

    upgradeImage();

    return () => {
      isMounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [thumbnailUrl, previewUrl, mediumUrl, fullUrl, loadHighQuality, timeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleClick = () => {
    if (onClick) {
      // If not already upgraded and we have better sources, try to upgrade now
      if (!loadHighQuality && (previewUrl || mediumUrl)) {
        setIsUpgrading(true);
        preloadImage(previewUrl || mediumUrl || thumbnailUrl)
          .then(() => {
            if (mountedRef.current) {
              setCurrentSrc(previewUrl || mediumUrl || thumbnailUrl);
              setIsUpgrading(false);
            }
          })
          .catch(() => {
            if (mountedRef.current) {
              setIsUpgrading(false);
            }
          });
      }
      onClick();
    }
  };
  if (hasError) {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}
        onClick={handleClick}
      >
        <div className="text-center text-gray-500 p-4">
          <div className="text-2xl mb-2">📷</div>
          <div className="text-sm">Failed to load</div>
          <div className="text-xs text-gray-400 mt-1">Click to continue</div>
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`relative overflow-hidden ${className}`}
      onClick={handleClick}
    >
      <img
        src={currentSrc}
        alt={alt}
        className="w-full h-full object-cover transition-opacity duration-300"
        loading="lazy"
        style={{ opacity: loadedSrc === currentSrc ? 1 : 0.8 }}
      />
      {/* Upgrading indicator */}
      {isUpgrading && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded flex items-center">
          <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent mr-1"></div>
          Upgrading
        </div>
      )}
      {/* Quality indicator */}
      {loadedSrc && !isUpgrading && loadHighQuality && (
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
    </motion.div>
  );
};

export default FastImage;
