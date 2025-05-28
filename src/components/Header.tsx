import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import CreditDisplay from "./CreditDisplay";

interface HeaderProps {
  onLogin: () => void;
  onBuyCredits: () => void;
  onCloseCreditSection?: () => void;
  onViewSavedWishes?: () => void;
  onResetToStart?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onLogin,
  onBuyCredits,
  onCloseCreditSection,
  onViewSavedWishes,
  onResetToStart,
}) => {
  const router = useRouter();
  const { currentUser, logOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: Event) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("click", handleOutsideClick, true);
      document.addEventListener("touchend", handleOutsideClick, true);
    }

    return () => {
      document.removeEventListener("click", handleOutsideClick, true);
      document.removeEventListener("touchend", handleOutsideClick, true);
    };
  }, [isMenuOpen]);
  const displayName =
    currentUser?.name || currentUser?.email?.split("@")[0] || "User";

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleBuyCredits = () => {
    setIsMenuOpen(false);
    onBuyCredits();
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setIsMenuOpen(false);
    try {
      await logOut();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsSigningOut(false);
    }
  };
  const handleLogoClick = () => {
    // Close any open sections first
    if (onCloseCreditSection) {
      onCloseCreditSection();
    }

    // Reset the entire application to starting state
    if (onResetToStart) {
      onResetToStart();
    }

    // Navigate to home page
    router.push("/");
  };
  const handleSignIn = () => {
    onLogin();
  };

  return (
    <header className="py-3 px-4 sm:py-4 sm:px-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm relative z-40">
      <div className="flex items-center">
        <button
          onClick={handleLogoClick}
          className="text-lg sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg px-2 py-1"
        >
          AI Wish Generator
        </button>
      </div>{" "}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Credits Display - Always visible for all users */}
        <div>
          <CreditDisplay onBuyCredits={onBuyCredits} />
        </div>

        {currentUser && !currentUser.isGuest ? (
          <>
            {/* User Menu */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={handleMenuToggle}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] cursor-pointer"
                aria-expanded={isMenuOpen}
                aria-haspopup="true"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-xs sm:text-sm">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium hidden lg:inline text-sm">
                  {displayName}
                </span>
                <svg
                  className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-200 ${
                    isMenuOpen ? "rotate-180" : ""
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                  {" "}
                  {/* User Info */}
                  <div className="px-4 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-lg">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">
                          {displayName}
                        </p>
                        {currentUser?.email && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {currentUser.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>{" "}
                  {/* Menu Items */}
                  <div className="py-2">
                    {/* My Wishes Library - Available for all screen sizes */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        if (onViewSavedWishes) {
                          onViewSavedWishes();
                        }
                      }}
                      className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center transition-colors min-h-[48px] cursor-pointer"
                    >
                      <svg
                        className="w-5 h-5 mr-3 text-indigo-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                      <span className="font-medium">My Wishes Library</span>
                    </button>

                    {/* Divider */}
                    <div className="my-2 border-t border-gray-200 dark:border-gray-700"></div>

                    {/* Sign Out */}
                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 flex items-center transition-colors disabled:opacity-50 min-h-[48px] cursor-pointer"
                    >
                      {isSigningOut ? (
                        <>
                          <div className="w-5 h-5 mr-3 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                          </div>
                          <span className="font-medium">Signing Out...</span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-5 h-5 mr-3 text-gray-400"
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
                          <span className="font-medium">Sign Out</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <button
            onClick={handleSignIn}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-2 px-4 sm:px-6 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm min-h-[44px] shadow-sm"
          >
            Sign In
          </button>
        )}
      </div>{" "}
    </header>
  );
};

export default Header;
