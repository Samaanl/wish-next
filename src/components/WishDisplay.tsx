import React, { useRef } from "react";
import { ClipboardDocumentIcon, PencilIcon } from "@heroicons/react/24/outline";

interface WishDisplayProps {
  wish: string;
  onEdit: () => void;
}

export default function WishDisplay({ wish, onEdit }: WishDisplayProps) {
  const wishRef = useRef<HTMLDivElement>(null);
  const [wishText, setWishText] = React.useState(wish);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(wishText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWishChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setWishText(e.target.value);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Your Generated Wish
        </h3>
        <div className="flex space-x-2">
          <button
            className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            <ClipboardDocumentIcon className="h-5 w-5" />
            {copied && <span className="sr-only">Copied!</span>}
          </button>
          <button
            className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={onEdit}
            title="Start over"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {copied && (
        <div className="mb-2 text-sm text-green-600 dark:text-green-400">
          Copied to clipboard!
        </div>
      )}

      <div
        className="prose prose-indigo dark:prose-invert max-w-none"
        ref={wishRef}
      >
        <textarea
          value={wishText}
          onChange={handleWishChange}
          className="w-full min-h-[200px] p-4 text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
    </div>
  );
}
