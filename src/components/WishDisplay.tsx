import React, { useRef, useState, useEffect } from "react";
import {
  ClipboardDocumentIcon,
  PencilIcon,
  HeartIcon,
  PhotoIcon,
  CloudArrowUpIcon,
} from "@heroicons/react/24/outline";
import OccasionSelector from "./OccasionSelector";
import ImageGallery from "./ImageGallery";
import TextEditor from "./TextEditor";
import { Occasion, OccasionImage, uploadWishImage } from "@/utils/imageService";

interface WishDisplayProps {
  wish: string;
  onEdit: () => void;
  userId?: string; // Optional userId for authenticated users
}

export default function WishDisplay({
  wish,
  onEdit,
  userId,
}: WishDisplayProps) {
  const wishRef = useRef<HTMLDivElement>(null);
  const [wishText, setWishText] = useState(wish);
  const [copied, setCopied] = useState(false);
  const [isAnimated, setIsAnimated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // New state for image flow
  const [isImageMode, setIsImageMode] = useState(false);
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion | null>(
    null
  );
  const [selectedImage, setSelectedImage] = useState<OccasionImage | null>(
    null
  );
  const [finalImage, setFinalImage] = useState<string | null>(null);

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
  }, []);

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

  const handleSelectOccasion = (occasion: Occasion) => {
    setSelectedOccasion(occasion);
    setSelectedImage(null);
  };

  const handleSelectImage = (image: OccasionImage) => {
    setSelectedImage(image);
  };

  const handleSaveImage = (dataUrl: string) => {
    setFinalImage(dataUrl);
    setSelectedImage(null);
    setSelectedOccasion(null);
  };

  const handleBackToOccasion = () => {
    setSelectedImage(null);
  };

  const handleBackToWish = () => {
    setIsImageMode(false);
    setSelectedOccasion(null);
    setSelectedImage(null);
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
              )}

              <button
                onClick={onEdit}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Start Over
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
    if (selectedImage && selectedOccasion) {
      return (
        <div className="w-full max-w-4xl mx-auto">
          <TextEditor
            wish={wishText}
            selectedImage={selectedImage}
            onBack={handleBackToOccasion}
            onSave={handleSaveImage}
          />
        </div>
      );
    }

    if (selectedOccasion) {
      return (
        <div className="w-full max-w-4xl mx-auto">
          <ImageGallery
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
      );
    }

    return (
      <div className="w-full max-w-4xl mx-auto">
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
          <div className="mb-6 flex justify-between items-center">
            <div className="flex items-center">
              <HeartIcon className="h-6 w-6 text-pink-500 mr-2" />
              <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">
                Your Special Wish
              </h3>
            </div>
            <div className="flex space-x-2">
              <button
                className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                onClick={handleCopy}
                title="Copy to clipboard"
              >
                <ClipboardDocumentIcon className="h-5 w-5" />
              </button>
              <button
                className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                onClick={onEdit}
                title="Start over"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

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
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <button
              onClick={() => setIsImageMode(true)}
              className="px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
            >
              <PhotoIcon className="h-5 w-5 mr-2" />
              Create Image with this Wish
            </button>

            <button
              onClick={onEdit}
              className="px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Create Another Wish
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
