import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import CreditDisplay from "./CreditDisplay";

interface HeaderProps {
  onLogin: () => void;
  onBuyCredits: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogin, onBuyCredits }) => {
  const { currentUser, logOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If clicking outside the dropdown area, close it
      if (isDropdownOpen) {
        const target = event.target as Element;
        if (!target.closest(".dropdown-container")) {
          setIsDropdownOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  const displayName =
    currentUser?.name || currentUser?.email?.split("@")[0] || "User";

  return (
    <header className="py-4 px-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
          Wish Generator
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        {currentUser ? (
          <>
            <CreditDisplay onBuyCredits={onBuyCredits} />{" "}
            {/* User Menu - Completely New Implementation */}
            <div className="relative dropdown-container">
              {/* User Avatar Button */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium">{displayName}</span>
                <svg
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </button>
            </div>
            {/* Dropdown Menu - Rendered as Portal-like fixed positioned element */}
            {isDropdownOpen && (
              <>
                {/* Backdrop to close dropdown */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsDropdownOpen(false)}
                />

                {/* Actual Dropdown Menu */}
                <div className="fixed top-16 right-6 z-50 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {displayName}
                        </p>
                        {currentUser?.email && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {currentUser.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    {/* Buy Credits Button */}
                    <button
                      onClick={() => {
                        console.log("Buy Credits clicked!");
                        setIsDropdownOpen(false);
                        onBuyCredits();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center transition-colors"
                    >
                      <svg
                        className="w-4 h-4 mr-3 text-yellow-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Buy Credits
                    </button>

                    {/* Sign Out Button */}
                    <button
                      onClick={async () => {
                        console.log("Sign Out clicked!");
                        if (isSigningOut) return;
                        setIsSigningOut(true);
                        try {
                          await logOut();
                          setIsDropdownOpen(false);
                        } catch (error) {
                          console.error("Sign out error:", error);
                        } finally {
                          setIsSigningOut(false);
                        }
                      }}
                      disabled={isSigningOut}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 flex items-center transition-colors disabled:opacity-50"
                    >
                      {isSigningOut ? (
                        <>
                          <div className="w-4 h-4 mr-3">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                          </div>
                          Signing Out...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4 mr-3 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          Sign Out
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <button
            onClick={onLogin}
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
