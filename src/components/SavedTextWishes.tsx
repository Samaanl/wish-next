import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getSavedWishes,
  deleteWishFromDatabase,
  deleteBulkWishesFromDatabase,
} from "@/utils/wishService";
import LoadingAnimation from "./LoadingAnimation";
import {
  ClockIcon,
  HeartIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FunnelIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface SavedWish {
  $id: string;
  user_id: string;
  wish_text: string;
  occasion: string;
  created_at: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  $collectionId: string;
  $databaseId: string;
}

interface SavedTextWishesProps {
  userId: string;
  isVisible: boolean;
  onClose: () => void;
}

const SavedTextWishes: React.FC<SavedTextWishesProps> = ({
  userId,
  isVisible,
  onClose,
}) => {
  const [wishes, setWishes] = useState<SavedWish[]>([]);
  const [filteredWishes, setFilteredWishes] = useState<SavedWish[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedWishId, setCopiedWishId] = useState<string | null>(null);
  const [expandedWishes, setExpandedWishes] = useState<Set<string>>(new Set());
  const [selectedWishes, setSelectedWishes] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filterOccasion, setFilterOccasion] = useState<string>("");
  const [filterDateRange, setFilterDateRange] = useState<string>("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [wishToDelete, setWishToDelete] = useState<string | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const CHARACTER_LIMIT = 200;
  useEffect(() => {
    if (isVisible && userId && !userId.startsWith("guest_")) {
      fetchSavedWishes();
    }
  }, [isVisible, userId]);

  useEffect(() => {
    let filtered = [...wishes];

    // Filter by occasion
    if (filterOccasion) {
      filtered = filtered.filter((wish) =>
        wish.occasion.toLowerCase().includes(filterOccasion.toLowerCase())
      );
    }

    // Filter by date range
    if (filterDateRange) {
      const now = new Date();
      let cutoffDate: Date;

      switch (filterDateRange) {
        case "today":
          cutoffDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case "week":
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = new Date(0);
      }

      filtered = filtered.filter(
        (wish) => new Date(wish.created_at) >= cutoffDate
      );
    }

    // Sort wishes
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

    setFilteredWishes(filtered);
  }, [wishes, filterOccasion, filterDateRange, sortBy]);
  const fetchSavedWishes = async () => {
    try {
      setLoading(true);
      setError(null);
      const savedWishes = await getSavedWishes(userId);
      setWishes(savedWishes as unknown as SavedWish[]);
    } catch (err) {
      console.error("Error fetching saved wishes:", err);
      setError("Failed to load your saved wishes. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, wishId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedWishId(wishId);
      setTimeout(() => setCopiedWishId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const toggleExpanded = (wishId: string) => {
    setExpandedWishes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(wishId)) {
        newSet.delete(wishId);
      } else {
        newSet.add(wishId);
      }
      return newSet;
    });
  };

  const toggleWishSelection = (wishId: string) => {
    setSelectedWishes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(wishId)) {
        newSet.delete(wishId);
      } else {
        newSet.add(wishId);
      }
      return newSet;
    });
  };

  const selectAllWishes = () => {
    if (selectedWishes.size === filteredWishes.length) {
      setSelectedWishes(new Set());
    } else {
      setSelectedWishes(new Set(filteredWishes.map((wish) => wish.$id)));
    }
  };

  const handleDeleteWish = async (wishId: string) => {
    try {
      setDeleting(true);
      await deleteWishFromDatabase(wishId);
      setWishes((prev) => prev.filter((wish) => wish.$id !== wishId));
      setSelectedWishes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(wishId);
        return newSet;
      });
    } catch (err) {
      console.error("Error deleting wish:", err);
      setError("Failed to delete wish. Please try again.");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setWishToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    try {
      setDeleting(true);
      await deleteBulkWishesFromDatabase(Array.from(selectedWishes));
      setWishes((prev) => prev.filter((wish) => !selectedWishes.has(wish.$id)));
      setSelectedWishes(new Set());
    } catch (err) {
      console.error("Error deleting wishes:", err);
      setError("Failed to delete wishes. Please try again.");
    } finally {
      setDeleting(false);
      setShowBulkDeleteConfirm(false);
    }
  };

  const clearFilters = () => {
    setFilterOccasion("");
    setFilterDateRange("");
    setSortBy("newest");
  };

  const getUniqueOccasions = () => {
    return Array.from(new Set(wishes.map((wish) => wish.occasion))).sort();
  };

  const truncateText = (text: string, limit: number) => {
    return text.length > limit ? text.substring(0, limit) + "..." : text;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {" "}
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <HeartIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  Your Saved Wishes
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {filteredWishes.length} of {wishes.length} wishes
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="self-start sm:self-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Action Bar */}
          {wishes.length > 0 && (
            <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    showFilters
                      ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <FunnelIcon className="h-4 w-4" />
                  <span>Filters</span>
                  {showFilters ? (
                    <ChevronUpIcon className="h-4 w-4" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4" />
                  )}
                </button>

                {filteredWishes.length > 0 && (
                  <button
                    onClick={selectAllWishes}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <CheckIcon className="h-4 w-4" />
                    <span>
                      {selectedWishes.size === filteredWishes.length
                        ? "Deselect All"
                        : "Select All"}
                    </span>
                  </button>
                )}
              </div>

              {selectedWishes.size > 0 && (
                <button
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  className="flex items-center space-x-2 px-3 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                  <span>Delete Selected ({selectedWishes.size})</span>
                </button>
              )}
            </div>
          )}

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Occasion
                      </label>
                      <select
                        value={filterOccasion}
                        onChange={(e) => setFilterOccasion(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">All Occasions</option>
                        {getUniqueOccasions().map((occasion) => (
                          <option key={occasion} value={occasion}>
                            {occasion}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Date Range
                      </label>
                      <select
                        value={filterDateRange}
                        onChange={(e) => setFilterDateRange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Sort By
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) =>
                          setSortBy(e.target.value as "newest" | "oldest")
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>{" "}
        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingAnimation />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 dark:text-red-400 mb-4">
                <ExclamationTriangleIcon className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  fetchSavedWishes();
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : wishes.length === 0 ? (
            <div className="text-center py-12">
              <HeartIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No saved wishes yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Generate your first wish and it will automatically be saved
                here!
              </p>
            </div>
          ) : filteredWishes.length === 0 ? (
            <div className="text-center py-12">
              <FunnelIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No wishes match your filters
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Try adjusting your filter criteria to see more results.
              </p>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredWishes.map((wish) => {
                const isExpanded = expandedWishes.has(wish.$id);
                const isSelected = selectedWishes.has(wish.$id);
                const shouldTruncate = wish.wish_text.length > CHARACTER_LIMIT;

                return (
                  <motion.div
                    key={wish.$id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-gray-50 dark:bg-gray-700 rounded-xl p-4 sm:p-6 border-2 transition-colors ${
                      isSelected
                        ? "border-indigo-500 dark:border-indigo-400"
                        : "border-gray-200 dark:border-gray-600"
                    }`}
                  >
                    {/* Wish Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleWishSelection(wish.$id)}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-sm font-medium rounded-full">
                          {wish.occasion}
                        </span>
                        <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">
                            {formatDate(wish.created_at)}
                          </span>
                          <span className="sm:hidden">
                            {new Date(wish.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            copyToClipboard(wish.wish_text, wish.$id)
                          }
                          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            copiedWishId === wish.$id
                              ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                              : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500"
                          }`}
                        >
                          <DocumentDuplicateIcon className="h-4 w-4" />
                          <span className="hidden sm:inline">
                            {copiedWishId === wish.$id ? "Copied!" : "Copy"}
                          </span>
                        </button>

                        <button
                          onClick={() => {
                            setWishToDelete(wish.$id);
                            setShowDeleteConfirm(true);
                          }}
                          className="flex items-center space-x-2 px-3 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Wish Text */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <p className="text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
                        {shouldTruncate && !isExpanded
                          ? truncateText(wish.wish_text, CHARACTER_LIMIT)
                          : wish.wish_text}
                      </p>

                      {shouldTruncate && (
                        <button
                          onClick={() => toggleExpanded(wish.$id)}
                          className="mt-2 flex items-center space-x-1 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                        >
                          <span>{isExpanded ? "Show Less" : "Show More"}</span>
                          {isExpanded ? (
                            <ChevronUpIcon className="h-4 w-4" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => !deleting && setShowDeleteConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Delete Wish
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Are you sure you want to delete this wish? This action cannot
                  be undone.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      wishToDelete && handleDeleteWish(wishToDelete)
                    }
                    disabled={deleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {deleting && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    <span>{deleting ? "Deleting..." : "Delete"}</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Bulk Delete Confirmation Modal */}
        <AnimatePresence>
          {showBulkDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => !deleting && setShowBulkDeleteConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Delete Multiple Wishes
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Are you sure you want to delete {selectedWishes.size} selected
                  wish{selectedWishes.size !== 1 ? "es" : ""}? This action
                  cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowBulkDeleteConfirm(false)}
                    disabled={deleting}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={deleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {deleting && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    <span>{deleting ? "Deleting..." : "Delete All"}</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default SavedTextWishes;
