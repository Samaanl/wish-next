import React, { useRef, useState, useEffect } from "react";
import {
  ClipboardDocumentIcon,
  PencilIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";

interface WishDisplayProps {
  wish: string;
  onEdit: () => void;
}

export default function WishDisplay({ wish, onEdit }: WishDisplayProps) {
  const wishRef = useRef<HTMLDivElement>(null);
  const [wishText, setWishText] = useState(wish);
  const [copied, setCopied] = useState(false);
  const [isAnimated, setIsAnimated] = useState(false);

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

          <div className="flex justify-center mt-6">
            <button
              onClick={onEdit}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150 ease-in-out"
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
