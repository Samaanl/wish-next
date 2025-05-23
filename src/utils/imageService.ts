import { storage, STORAGE_ID, Query, ID } from "./appwrite";

export interface OccasionImage {
  id: string;
  name: string;
  previewUrl: string;
  fullUrl: string;
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

  // Use placeholder images for testing
  for (let i = 1; i <= count; i++) {
    const placeholderSize = 600;
    dummyImages.push({
      id: `${occasionId}_${i}`,
      name: `${occasionId}_${i}`,
      previewUrl: `https://placehold.co/${placeholderSize}x${placeholderSize}?text=${occasionId}+${i}`,
      fullUrl: `https://placehold.co/${placeholderSize}x${placeholderSize}?text=${occasionId}+${i}`,
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

      if (matchingFiles.length === 0) {
        console.warn(
          `No images found in storage for occasion ${occasionId}, using dummy images`
        );
        return getDummyImagesForOccasion(occasionId);
      }

      return matchingFiles.map((file) => ({
        id: file.$id,
        name: file.name,
        previewUrl: storage.getFilePreview(STORAGE_ID, file.$id, 400, 400),
        fullUrl: storage.getFileView(STORAGE_ID, file.$id),
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
      const placeholderSize = 600;
      return {
        id: imageId,
        name: imageId,
        previewUrl: `https://placehold.co/${placeholderSize}x${placeholderSize}?text=${occasion}+${num}`,
        fullUrl: `https://placehold.co/${placeholderSize}x${placeholderSize}?text=${occasion}+${num}`,
        occasion: occasion,
      };
    }

    const file = await storage.getFile(STORAGE_ID, imageId);

    return {
      id: file.$id,
      name: file.name,
      previewUrl: storage.getFilePreview(STORAGE_ID, file.$id, 400, 400),
      fullUrl: storage.getFileView(STORAGE_ID, file.$id),
      occasion: file.name.split("_")[0], // Extract occasion from filename (e.g., "birthday_1.jpg" -> "birthday")
    };
  } catch (error) {
    console.error("Error fetching image by ID", imageId, error);

    // If it's a dummy image format, try to return that
    if (imageId.includes("_")) {
      const [occasion, num] = imageId.split("_");
      const placeholderSize = 600;
      return {
        id: imageId,
        name: imageId,
        previewUrl: `https://placehold.co/${placeholderSize}x${placeholderSize}?text=${occasion}+${num}`,
        fullUrl: `https://placehold.co/${placeholderSize}x${placeholderSize}?text=${occasion}+${num}`,
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

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      console.error(`Image load timeout after 8 seconds: ${imageUrl}`);
      reject(new Error(`Image load timed out after 8 seconds: ${imageUrl}`));
    }, 8000);

    const img = new Image();
    console.log(`DIRECT DEBUG - Setting up image object for: ${imageUrl}`);

    img.onload = () => {
      clearTimeout(timeoutId);
      console.log(
        `DIRECT DEBUG - Image loaded successfully: ${imageUrl}, dimensions: ${img.width}x${img.height}`
      );
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

    // Create file from Blob
    const file = new File([blob], filename, { type: "image/jpeg" });

    // Upload file to Appwrite storage
    const response = await storage.createFile(STORAGE_ID, ID.unique(), file);

    return {
      id: response.$id,
      name: response.name,
      previewUrl: storage.getFilePreview(STORAGE_ID, response.$id, 400, 400),
      fullUrl: storage.getFileView(STORAGE_ID, response.$id),
      occasion: occasionId,
    };
  } catch (error) {
    console.error("Error uploading image:", error);
    return null;
  }
};
