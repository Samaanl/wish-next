import { storage, STORAGE_ID, Query, ID } from "./appwrite";
import { getCachedImage, setCachedImage } from "./imageCache";

export interface OccasionImage {
  id: string;
  name: string;
  thumbnailUrl: string; // Small preview for gallery grid (150x150)
  previewUrl: string; // Medium preview for quick view (400x400)
  mediumUrl: string; // Medium-high quality (800x800)
  fullUrl: string; // Full resolution original
  occasion: string;
}

export type Occasion = {
  id: string;
  name: string;
  icon: string;
  description?: string;
};

// List of available occasions
export const occasions: Occasion[] = [
  {
    id: "birthday",
    name: "Birthday",
    icon: "🎂",
    description: "Celebrate another trip around the sun",
  },
  {
    id: "anniversary",
    name: "Anniversary",
    icon: "💍",
    description: "Commemorate your special day",
  },
  {
    id: "wedding",
    name: "Wedding",
    icon: "👰",
    description: "Celebrate the union of two souls",
  },
  {
    id: "graduation",
    name: "Graduation",
    icon: "🎓",
    description: "Honor academic achievements",
  },
  {
    id: "newbaby",
    name: "New Baby",
    icon: "👶",
    description: "Welcome the newest addition",
  },
  {
    id: "getwell",
    name: "Get Well",
    icon: "🏥",
    description: "Send healing thoughts",
  },
  {
    id: "thanksgiving",
    name: "Thanksgiving",
    icon: "🦃",
    description: "Express gratitude and appreciation",
  },
  {
    id: "christmas",
    name: "Christmas",
    icon: "🎄",
    description: "Spread holiday cheer",
  },
  {
    id: "newyear",
    name: "New Year",
    icon: "🎉",
    description: "Ring in the new year",
  },
  {
    id: "friendship",
    name: "Friendship",
    icon: "🤝",
    description: "Celebrate special bonds",
  },
  {
    id: "professional",
    name: "Professional",
    icon: "💼",
    description: "For business relationships",
  },
];

// Helper function to get dummy images when real images are not available yet
export const getDummyImagesForOccasion = (
  occasionId: string,
  count = 4
): OccasionImage[] => {
  const dummyImages: OccasionImage[] = [];
  // Use placeholder images for testing with smaller sizes for fast loading
  for (let i = 1; i <= count; i++) {
    const thumbnailSize = 100;
    const previewSize = 300;
    const mediumSize = 600;
    dummyImages.push({
      id: `${occasionId}_${i}`,
      name: `${occasionId}_${i}`,
      thumbnailUrl: `https://placehold.co/${thumbnailSize}x${thumbnailSize}?text=${occasionId}+${i}`,
      previewUrl: `https://placehold.co/${previewSize}x${previewSize}?text=${occasionId}+${i}`,
      mediumUrl: `https://placehold.co/${mediumSize}x${mediumSize}?text=${occasionId}+${i}`,
      fullUrl: `https://placehold.co/${mediumSize}x${mediumSize}?text=${occasionId}+${i}`,
      occasion: occasionId,
    });
  }

  return dummyImages;
};

// Function to list images from Appwrite storage based on occasion
export const listImagesByOccasion = async (
  occasionId: string
): Promise<OccasionImage[]> => {
  try {
    // First check if STORAGE_ID is available
    if (!STORAGE_ID) {
      console.warn("STORAGE_ID is not set, using dummy images");
      return getDummyImagesForOccasion(occasionId);
    }

    console.log(
      `Fetching images for occasion ${occasionId} from storage ID: ${STORAGE_ID}`
    );

    try {
      // More robust approach: fetch all files without complex queries
      console.log(`Fetching all files from bucket ${STORAGE_ID}`);

      // Use a simple limit query to avoid potential pagination issues
      const allFiles = await storage.listFiles(STORAGE_ID, [
        // No complex queries that might cause errors
      ]);
      console.log(`Found ${allFiles.files.length} total files in bucket`);

      // Filter files that match our occasion on the client side
      const matchingFiles = allFiles.files.filter((file) =>
        file.name.toLowerCase().includes(occasionId.toLowerCase())
      );

      console.log(
        `Found ${matchingFiles.length} files matching occasion: ${occasionId}`
      );

      // Debug: Log the URLs being generated
      if (matchingFiles.length > 0) {
        const firstFile = matchingFiles[0];
        console.log(`Sample URLs for ${occasionId}:`, {
          thumbnailUrl: storage.getFilePreview(
            STORAGE_ID,
            firstFile.$id,
            150,
            150
          ),
          previewUrl: storage.getFilePreview(
            STORAGE_ID,
            firstFile.$id,
            400,
            400
          ),
          mediumUrl: storage.getFilePreview(
            STORAGE_ID,
            firstFile.$id,
            800,
            800
          ),
          fullUrl: storage.getFileView(STORAGE_ID, firstFile.$id),
        });
      }

      if (matchingFiles.length === 0) {
        console.warn(
          `No images found in storage for occasion ${occasionId}, using dummy images`
        );
        return getDummyImagesForOccasion(occasionId);
      }
      return matchingFiles.map((file) => ({
        id: file.$id,
        name: file.name,
        // Use very small thumbnails for fast gallery loading
        thumbnailUrl: storage.getFilePreview(STORAGE_ID, file.$id, 100, 100), // Low quality, small size
        previewUrl: storage.getFilePreview(STORAGE_ID, file.$id, 300, 300), // Medium quality, small size
        mediumUrl: storage.getFilePreview(STORAGE_ID, file.$id, 600, 600), // Good quality
        fullUrl: storage.getFilePreview(STORAGE_ID, file.$id, 1024, 1024), // High quality but not full 2048
        occasion: occasionId,
      }));
    } catch (error: any) {
      console.error("Appwrite API error:", error);
      console.warn("Falling back to dummy images");
      // Always fall back to dummy images on error, don't rethrow
      return getDummyImagesForOccasion(occasionId);
    }
  } catch (error) {
    console.error("Error fetching images for occasion", occasionId, error);
    console.warn("Using dummy images due to error");
    return getDummyImagesForOccasion(occasionId);
  }
};

// Function to get an image by its ID
export const getImageById = async (
  imageId: string
): Promise<OccasionImage | null> => {
  try {
    // If it's a dummy image ID (format: occasionId_number)
    if (imageId.includes("_") && !STORAGE_ID) {
      const [occasion, num] = imageId.split("_");
      const thumbnailSize = 150;
      const previewSize = 400;
      const mediumSize = 600;
      return {
        id: imageId,
        name: imageId,
        thumbnailUrl: `https://placehold.co/${thumbnailSize}x${thumbnailSize}?text=${occasion}+${num}`,
        previewUrl: `https://placehold.co/${previewSize}x${previewSize}?text=${occasion}+${num}`,
        mediumUrl: `https://placehold.co/${mediumSize}x${mediumSize}?text=${occasion}+${num}`,
        fullUrl: `https://placehold.co/${mediumSize}x${mediumSize}?text=${occasion}+${num}`,
        occasion: occasion,
      };
    }

    const file = await storage.getFile(STORAGE_ID, imageId);
    return {
      id: file.$id,
      name: file.name,
      thumbnailUrl: storage.getFilePreview(STORAGE_ID, file.$id, 100, 100),
      previewUrl: storage.getFilePreview(STORAGE_ID, file.$id, 300, 300),
      mediumUrl: storage.getFilePreview(STORAGE_ID, file.$id, 600, 600),
      fullUrl: storage.getFilePreview(STORAGE_ID, file.$id, 1024, 1024),
      occasion: file.name.split("_")[0], // Extract occasion from filename (e.g., "birthday_1.jpg" -> "birthday")
    };
  } catch (error) {
    console.error("Error fetching image by ID", imageId, error); // If it's a dummy image format, try to return that
    if (imageId.includes("_")) {
      const [occasion, num] = imageId.split("_");
      const thumbnailSize = 150;
      const previewSize = 400;
      const mediumSize = 600;
      return {
        id: imageId,
        name: imageId,
        thumbnailUrl: `https://placehold.co/${thumbnailSize}x${thumbnailSize}?text=${occasion}+${num}`,
        previewUrl: `https://placehold.co/${previewSize}x${previewSize}?text=${occasion}+${num}`,
        mediumUrl: `https://placehold.co/${mediumSize}x${mediumSize}?text=${occasion}+${num}`,
        fullUrl: `https://placehold.co/${mediumSize}x${mediumSize}?text=${occasion}+${num}`,
        occasion: occasion,
      };
    }

    return null;
  }
};

// Function to download an image for local manipulation with fabric.js
export const downloadImage = async (
  imageUrl: string
): Promise<HTMLImageElement> => {
  console.log(`DIRECT DEBUG - Attempting to download image from: ${imageUrl}`);

  // Check cache first
  const cachedImage = getCachedImage(imageUrl);
  if (cachedImage) {
    console.log(`DIRECT DEBUG - Image found in cache: ${imageUrl}`);
    return cachedImage;
  }

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      console.error(`Image load timeout after 8 seconds: ${imageUrl}`);
      reject(new Error(`Image load timed out after 8 seconds: ${imageUrl}`));
    }, 8000); // Reduced timeout to 8 seconds

    const img = new Image();
    console.log(`DIRECT DEBUG - Setting up image object for: ${imageUrl}`);

    img.onload = () => {
      clearTimeout(timeoutId);
      console.log(
        `DIRECT DEBUG - Image loaded successfully: ${imageUrl}, dimensions: ${img.width}x${img.height}`
      );

      // Cache the successfully loaded image
      setCachedImage(imageUrl, img);

      resolve(img);
    };

    img.onerror = (e) => {
      clearTimeout(timeoutId);
      console.error(`DIRECT DEBUG - Error loading image from: ${imageUrl}`, e);
      reject(
        new Error(
          `Failed to load image directly: ${imageUrl}. Error: ${e.toString()}`
        )
      );
    };

    // Only set crossOrigin for non-placeholder images
    if (!imageUrl.includes("placehold.co")) {
      img.crossOrigin = "anonymous";
    }

    console.log(`DIRECT DEBUG - Setting image src to: ${imageUrl}`);
    img.src = imageUrl;
  });
};

// Function to convert data URL to Blob for upload
export const dataURLtoBlob = (dataurl: string): Blob => {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

// Function to upload an image to Appwrite storage
export const uploadWishImage = async (
  dataUrl: string,
  occasionId: string,
  userId: string
): Promise<OccasionImage | null> => {
  try {
    if (!STORAGE_ID) {
      console.error("STORAGE_ID is not set");
      return null;
    }

    // Convert dataUrl to Blob
    const blob = dataURLtoBlob(dataUrl);

    // Create unique filename using timestamp
    const timestamp = Date.now();
    const filename = `${occasionId}_${userId}_${timestamp}.jpg`;

    // Create file from Blo
    const file = new File([blob], filename, { type: "image/jpeg" });

    // Upload file to Appwrite storage this is a
    const response = await storage.createFile(STORAGE_ID, ID.unique(), file);
    return {
      id: response.$id,
      name: response.name,
      thumbnailUrl: storage.getFilePreview(STORAGE_ID, response.$id, 100, 100),
      previewUrl: storage.getFilePreview(STORAGE_ID, response.$id, 300, 300),
      mediumUrl: storage.getFilePreview(STORAGE_ID, response.$id, 600, 600),
      fullUrl: storage.getFilePreview(STORAGE_ID, response.$id, 1024, 1024),
      occasion: occasionId,
    };
  } catch (error) {
    console.error("Error uploading image:", error);
    return null;
  }
};

// Progressive image download function for TextEditor
export const downloadImageProgressively = async (
  image: OccasionImage,
  onProgress?: (progress: number) => void
): Promise<HTMLImageElement> => {
  console.log(`Progressive download starting for image: ${image.id}`);

  onProgress?.(10);

  try {
    // Strategy: Start with thumbnail for immediate display, then upgrade
    console.log(`Loading thumbnail first: ${image.thumbnailUrl}`);

    try {
      // Load thumbnail first for immediate display
      const thumbnailImg = await downloadImage(image.thumbnailUrl);
      onProgress?.(30);
      console.log("Thumbnail loaded, now upgrading to preview quality");

      // Try to upgrade to preview quality
      try {
        const previewImg = await downloadImage(image.previewUrl);
        onProgress?.(60);
        console.log("Preview quality loaded, now upgrading to medium quality");

        // Try to upgrade to medium quality
        try {
          const mediumImg = await downloadImage(image.mediumUrl);
          onProgress?.(85);
          console.log("Medium quality loaded, now trying full resolution");

          // Try to upgrade to full resolution
          try {
            const fullImg = await downloadImage(image.fullUrl);
            onProgress?.(100);
            console.log("Full resolution loaded successfully");
            return fullImg;
          } catch (fullError) {
            console.warn(
              "Full resolution failed, using medium quality:",
              fullError
            );
            onProgress?.(100);
            return mediumImg;
          }
        } catch (mediumError) {
          console.warn(
            "Medium quality failed, using preview quality:",
            mediumError
          );
          onProgress?.(100);
          return previewImg;
        }
      } catch (previewError) {
        console.warn("Preview quality failed, using thumbnail:", previewError);
        onProgress?.(100);
        return thumbnailImg;
      }
    } catch (thumbnailError) {
      console.error("Even thumbnail failed, this is unusual:", thumbnailError);
      throw new Error("Failed to load image in any quality");
    }
  } catch (error) {
    console.error("Progressive image download completely failed:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to load image progressively: ${errorMessage}`);
  }
};

// Image Loading Manager for priority-based loading and cancellation
class ImageLoadingManager {
  private activeLoads = new Map<string, AbortController>();
  private priorityQueue: string[] = [];
  private currentPriority: string | null = null;

  // Set a specific image as high priority (e.g., when user clicks it)
  setPriority(imageId: string) {
    console.log(`🎯 Setting priority for image: ${imageId}`);

    // Cancel all non-priority loads
    this.cancelAllExcept(imageId);

    // Set as current priority
    this.currentPriority = imageId;

    // Move to front of priority queue
    this.priorityQueue = this.priorityQueue.filter((id) => id !== imageId);
    this.priorityQueue.unshift(imageId);
  }

  // Check if an image has priority
  hasPriority(imageId: string): boolean {
    return this.currentPriority === imageId;
  }

  // Register a loading operation
  registerLoad(imageId: string, abortController: AbortController) {
    this.activeLoads.set(imageId, abortController);
  }

  // Cancel loading for a specific image
  cancelLoad(imageId: string) {
    const controller = this.activeLoads.get(imageId);
    if (controller) {
      console.log(`❌ Cancelling load for image: ${imageId}`);
      controller.abort();
      this.activeLoads.delete(imageId);
    }
  }

  // Cancel all loads except priority image
  cancelAllExcept(priorityImageId: string) {
    console.log(`🧹 Cancelling all loads except priority: ${priorityImageId}`);
    for (const [imageId, controller] of this.activeLoads) {
      if (imageId !== priorityImageId) {
        controller.abort();
        this.activeLoads.delete(imageId);
      }
    }
  }

  // Clean up completed load
  completeLoad(imageId: string) {
    this.activeLoads.delete(imageId);
  }

  // Clear priority when user stops focusing on image
  clearPriority() {
    this.currentPriority = null;
  }

  // Get loading stats
  getStats() {
    return {
      activeLoads: this.activeLoads.size,
      currentPriority: this.currentPriority,
      queueLength: this.priorityQueue.length,
    };
  }
}

// Global instance
export const imageLoadingManager = new ImageLoadingManager();
