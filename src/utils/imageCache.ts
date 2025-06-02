interface CacheEntry {
  data: HTMLImageElement;
  timestamp: number;
  size: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalRequests: number;
}

class ImageCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  private currentSize: number = 0;
  private maxAge: number;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalRequests: 0,
  };

  constructor(
    maxSize: number = 50 * 1024 * 1024,
    maxAge: number = 30 * 60 * 1000
  ) {
    // 50MB, 30 minutes
    this.maxSize = maxSize;
    this.maxAge = maxAge;
  }

  get(key: string): HTMLImageElement | null {
    this.stats.totalRequests++;

    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data;
  }

  set(key: string, image: HTMLImageElement): boolean {
    // Estimate image size (width * height * 4 bytes for RGBA)
    const estimatedSize = image.width * image.height * 4;

    // If single image is too large, don't cache it
    if (estimatedSize > this.maxSize * 0.5) {
      console.warn(
        `Image ${key} too large to cache (${Math.round(
          estimatedSize / 1024 / 1024
        )}MB)`
      );
      return false;
    }

    // Make room if necessary
    while (
      this.currentSize + estimatedSize > this.maxSize &&
      this.cache.size > 0
    ) {
      this.evictOldest();
    }

    // Store in cache
    this.cache.set(key, {
      data: image,
      timestamp: Date.now(),
      size: estimatedSize,
    });

    this.currentSize += estimatedSize;
    return true;
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    this.cache.delete(key);
    this.currentSize -= entry.size;
    return true;
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
    this.stats = { hits: 0, misses: 0, evictions: 0, totalRequests: 0 };
  }

  getStats(): CacheStats & { size: number; maxSize: number; hitRate: number } {
    const hitRate =
      this.stats.totalRequests > 0
        ? (this.stats.hits / this.stats.totalRequests) * 100
        : 0;

    return {
      ...this.stats,
      size: this.currentSize,
      maxSize: this.maxSize,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.delete(key));
  }
}

// Create a global cache instance
export const imageCache = new ImageCache();

// Periodic cleanup every 5 minutes
setInterval(() => {
  imageCache.cleanup();
}, 5 * 60 * 1000);

// Cache helper functions
export const getCachedImage = (url: string): HTMLImageElement | null => {
  return imageCache.get(url);
};

export const setCachedImage = (
  url: string,
  image: HTMLImageElement
): boolean => {
  return imageCache.set(url, image);
};

export const getCacheStats = () => {
  return imageCache.getStats();
};

export const clearImageCache = () => {
  imageCache.clear();
};

export default imageCache;
