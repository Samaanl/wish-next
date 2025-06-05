import React, { useRef, useState, useEffect, useMemo, Suspense } from "react";
import {
  ClipboardDocumentIcon,
  PencilIcon,
  HeartIcon,
  PhotoIcon,
  CloudArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import OccasionSelector from "./OccasionSelector";
import OptimizedImageGallery from "./OptimizedImageGallery";
import ImageErrorBoundary from "./ImageErrorBoundary";
import TextEditor from "./TextEditor";
import StableTransition from "./StableTransition";
import { Occasion, OccasionImage, uploadWishImage } from "@/utils/imageService";

interface WishDisplayProps {
  wishes: string[];
  currentWishIndex: number;
  onWishIndexChange: (index: number) => void;
  onEdit: () => void;
  onGenerateMoreVariants?: () => void;
  isGeneratingVariants?: boolean;
  userId?: string; // Optional userId for authenticated users
}

export default function WishDisplay({
  wishes,
  currentWishIndex,
  onWishIndexChange,
  onEdit,
  onGenerateMoreVariants,
  isGeneratingVariants = false,
  userId,
}: WishDisplayProps) {
  const wishRef = useRef<HTMLDivElement>(null);
  const currentWish = wishes[currentWishIndex] || "";
  const [wishText, setWishText] = useState(currentWish);
  const [copied, setCopied] = useState(false);
  const [isAnimated, setIsAnimated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isImageMode, setIsImageMode] = useState(false);
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion | null>(
    null
  );
  const [selectedImage, setSelectedImage] = useState<OccasionImage | null>(
    null
  );
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [viewMode, setViewMode] = useState<
    "wish" | "occasions" | "gallery" | "editor"
  >("wish");

  // Use a stable component key to prevent unnecessary remounting
  const componentKey = useMemo(() => {
    if (selectedImage) return `editor-${selectedImage.id}`;
    if (selectedOccasion) return `gallery-${selectedOccasion.id}`;
    return "wish-view";
  }, [selectedImage, selectedOccasion]);
  // Update wishText when currentWishIndex changes
  useEffect(() => {
    setWishText(wishes[currentWishIndex] || "");
  }, [currentWishIndex, wishes]);

  useEffect(() => {
    // Start animation when component mounts
    setIsAnimated(true);

    // Auto-resize the textarea to fit content
    if (wishRef.current) {
      const textarea = wishRef.current.querySelector("textarea");
      if (textarea) {
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }
  }, [currentWishIndex]); // Re-run when wish changes

  const handleCopy = () => {
    navigator.clipboard.writeText(wishText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const handleWishChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setWishText(e.target.value);

    // Auto-resize as typing
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handlePrevious = () => {
    if (currentWishIndex > 0) {
      onWishIndexChange(currentWishIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentWishIndex < wishes.length - 1) {
      onWishIndexChange(currentWishIndex + 1);
    }
  };

  const handleGenerateMore = () => {
    if (onGenerateMoreVariants && !isGeneratingVariants) {
      onGenerateMoreVariants();
    }
  };
  const handleSelectOccasion = (occasion: Occasion) => {
    setSelectedOccasion(occasion);
    setSelectedImage(null);
    setViewMode("gallery");
  };

  const handleSelectImage = (image: OccasionImage) => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    console.log("Starting image selection transition", image.id);

    // Use requestAnimationFrame to ensure DOM is stable
    requestAnimationFrame(() => {
      setSelectedImage(image);
      setViewMode("editor");
      setIsTransitioning(false);
    });
  };

  const handleSaveImage = (dataUrl: string) => {
    setFinalImage(dataUrl);
    setSelectedImage(null);
    setSelectedOccasion(null);
    setViewMode("wish");
  };

  const handleBackToOccasion = () => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    console.log("Starting back to occasion transition");

    requestAnimationFrame(() => {
      setSelectedImage(null);
      setViewMode("gallery");
      setIsTransitioning(false);
    });
  };

  const handleBackToWish = () => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    console.log("Starting back to wish transition");

    requestAnimationFrame(() => {
      setIsImageMode(false);
      setSelectedOccasion(null);
      setSelectedImage(null);
      setViewMode("wish");
      setIsTransitioning(false);
    });
  };

  // Handle saving the image to Appwrite storage
  const handleSaveToStorage = async () => {
    if (!finalImage || !selectedOccasion || !userId) {
      // If no userId, the save button shouldn't be visible anyway
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);

      const savedImage = await uploadWishImage(
        finalImage,
        selectedOccasion.id,
        userId
      );

      if (!savedImage) {
        throw new Error("Failed to save image to storage");
      }

      // Show success message or update UI as needed
      setTimeout(() => {
        setIsSaving(false);
        // Maybe navigate to a gallery or show a success message
      }, 1500);
    } catch (error) {
      console.error("Error saving image:", error);
      setSaveError("Failed to save your image. Please try again.");
      setIsSaving(false);
    }
  };

  if (finalImage) {
    return (
      <div
        className={`w-full max-w-2xl mx-auto transform transition-all duration-700 ${
          isAnimated ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

          <div className="p-8">
            <div className="mb-6 flex justify-between items-center">
              <div className="flex items-center">
                <HeartIcon className="h-6 w-6 text-pink-500 mr-2" />
                <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">
                  Your Wish Image
                </h3>
              </div>
            </div>

            <div className="flex justify-center mb-6">
              <img
                src={finalImage}
                alt="Personalized wish"
                className="max-w-full rounded-lg shadow-lg"
              />
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <button
                onClick={() => setFinalImage(null)}
                className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 font-medium rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
              >
                Create Another Image
              </button>
              <button
                onClick={() => {
                  const link = document.createElement("a");
                  link.download = "my-wish.jpg";
                  link.href = finalImage;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Download Image
              </button>
              {userId && (
                <button
                  onClick={handleSaveToStorage}
                  disabled={isSaving}
                  className={`px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center ${
                    isSaving ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                      Save to My Collection
                    </>
                  )}
                </button>
              )}{" "}
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Edit Wish Settings
              </button>
            </div>

            {saveError && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg">
                {saveError}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  if (isImageMode) {
    return (
      <div key={componentKey} className="w-full max-w-4xl mx-auto">
        <ImageErrorBoundary key={`error-boundary-${componentKey}`}>
          {" "}
          <Suspense
            fallback={<div className="text-center p-8">Loading...</div>}
          >
            <StableTransition
              transitionKey={componentKey}
              onTransitionStart={() =>
                console.log("Transition starting:", componentKey)
              }
              onTransitionEnd={() =>
                console.log("Transition complete:", componentKey)
              }
            >
              {viewMode === "editor" && selectedImage && selectedOccasion && (
                <div className="w-full">
                  <TextEditor
                    wish={wishText}
                    selectedImage={selectedImage}
                    onBack={handleBackToOccasion}
                  />
                </div>
              )}

              {viewMode === "gallery" && selectedOccasion && !selectedImage && (
                <div className="w-full">
                  <OptimizedImageGallery
                    occasion={selectedOccasion}
                    onSelectImage={handleSelectImage}
                  />
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={() => setSelectedOccasion(null)}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Back to Occasions
                    </button>
                  </div>
                </div>
              )}

              {(!selectedOccasion || viewMode === "occasions") && (
                <div className="w-full">
                  <OccasionSelector
                    onSelectOccasion={handleSelectOccasion}
                    selectedOccasion={selectedOccasion}
                  />
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={handleBackToWish}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Back to Wish
                    </button>
                  </div>
                </div>
              )}
            </StableTransition>
          </Suspense>
        </ImageErrorBoundary>
      </div>
    );
  }

  return (
    <div
      className={`w-full max-w-2xl mx-auto transform transition-all duration-700 ${
        isAnimated ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
      }`}
    >
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        <div className="absolute top-0 right-0">
          <div className="text-indigo-200 dark:text-indigo-900 w-12 h-12 opacity-20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z" />
            </svg>
          </div>
        </div>
        <div className="absolute bottom-0 left-0">
          <div className="text-pink-200 dark:text-pink-900 w-16 h-16 opacity-20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        <div className="p-8">
          {" "}
          <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center">
              <HeartIcon className="h-6 w-6 text-pink-500 mr-2" />
              <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">
                Your Special Wish
              </h3>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                className="flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors duration-200 font-medium text-sm sm:text-base min-w-0 flex-1 sm:flex-initial"
                onClick={handleCopy}
                title="Copy to clipboard"
              >
                <ClipboardDocumentIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="truncate">Copy</span>
              </button>
              <button
                className="flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 font-medium text-sm sm:text-base min-w-0 flex-1 sm:flex-initial"
                onClick={onEdit}
                title="Edit your wish settings"
              >
                <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="truncate">Edit</span>
              </button>
            </div>
          </div>{" "}
          {/* Wish Navigation - Only show if multiple wishes */}
          {wishes.length > 1 && (
            <div className="mb-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
              {/* Mobile/Tablet Layout */}
              <div className="block lg:hidden">
                {/* Top row: Variant counter and dots */}
                <div className="flex items-center justify-center mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {currentWishIndex + 1} of {wishes.length}
                    </span>

                    {/* Larger dot indicators for mobile */}
                    <div className="flex space-x-1.5">
                      {wishes.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => onWishIndexChange(index)}
                          className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full transition-colors touch-manipulation ${
                            index === currentWishIndex
                              ? "bg-indigo-600"
                              : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
                          }`}
                          aria-label={`Go to variant ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom row: Navigation buttons */}
                <div className="flex justify-between items-center">
                  <button
                    onClick={handlePrevious}
                    disabled={currentWishIndex === 0}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-colors touch-manipulation ${
                      currentWishIndex === 0
                        ? "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                        : "text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 active:bg-indigo-200 dark:active:bg-indigo-800"
                    }`}
                  >
                    <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-sm sm:text-base">Previous</span>
                  </button>

                  <button
                    onClick={handleNext}
                    disabled={currentWishIndex === wishes.length - 1}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-colors touch-manipulation ${
                      currentWishIndex === wishes.length - 1
                        ? "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                        : "text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 active:bg-indigo-200 dark:active:bg-indigo-800"
                    }`}
                  >
                    <span className="text-sm sm:text-base">Next</span>
                    <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden lg:flex items-center justify-between">
                <button
                  onClick={handlePrevious}
                  disabled={currentWishIndex === 0}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    currentWishIndex === 0
                      ? "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                      : "text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900"
                  }`}
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Variant {currentWishIndex + 1} of {wishes.length}
                  </span>

                  {/* Dot indicators */}
                  <div className="flex space-x-2">
                    {wishes.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => onWishIndexChange(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentWishIndex
                            ? "bg-indigo-600"
                            : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleNext}
                  disabled={currentWishIndex === wishes.length - 1}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    currentWishIndex === wishes.length - 1
                      ? "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                      : "text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900"
                  }`}
                >
                  <span>Next</span>
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
          {copied && (
            <div className="mb-4 px-4 py-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm rounded-lg flex items-center">
              <svg
                className="w-4 h-4 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Copied to clipboard!
            </div>
          )}
          <div className="relative overflow-hidden" ref={wishRef}>
            <div className="absolute inset-0 pointer-events-none opacity-5">
              <div className="absolute top-0 left-0 transform -translate-x-1/2 -translate-y-1/2">
                <svg
                  className="w-32 h-32 text-indigo-300"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              </div>
              <div className="absolute bottom-0 right-0 transform translate-x-1/3 translate-y-1/3">
                <svg
                  className="w-32 h-32 text-indigo-300"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
                </svg>
              </div>
            </div>

            <textarea
              value={wishText}
              onChange={handleWishChange}
              className="w-full p-6 text-lg leading-relaxed border-0 bg-transparent resize-none focus:ring-0 focus:outline-none text-gray-800 dark:text-gray-200"
              style={{
                minHeight: "200px",
                fontFamily: "'Segoe UI', system-ui, sans-serif",
                overflow: "hidden",
              }}
            />
          </div>{" "}
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <button
              onClick={() => setIsImageMode(true)}
              className="px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
            >
              <PhotoIcon className="h-5 w-5 mr-2" />
              Create Image with this Wish
            </button>

            {onGenerateMoreVariants && (
              <button
                onClick={handleGenerateMore}
                disabled={isGeneratingVariants}
                className={`px-4 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center ${
                  isGeneratingVariants ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isGeneratingVariants ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    Generate More Variants
                  </>
                )}
              </button>
            )}

            <button
              onClick={onEdit}
              className="px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Edit Wish Settings
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Feel free to edit the wish to make it even more personal!
        </p>
      </div>
    </div>
  );
}
