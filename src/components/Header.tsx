import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import CreditDisplay from "./CreditDisplay";

interface HeaderProps {
  onLogin: () => void;
  onBuyCredits: () => void;
  onCloseCreditSection?: () => void; // Add optional prop to close credit section
}

const Header: React.FC<HeaderProps> = ({
  onLogin,
  onBuyCredits,
  onCloseCreditSection,
}) => {
  const router = useRouter();
  const { currentUser, logOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Prevent body scroll when menu is open on mobile
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  const displayName =
    currentUser?.name || currentUser?.email?.split("@")[0] || "User";

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
    // Close credit section if it's open
    if (onCloseCreditSection) {
      onCloseCreditSection();
    }
    router.push("/");
  };

  const handleSignIn = () => {
    onLogin();
  };

  return (
    <>
      {" "}
      <header className="py-3 px-4 sm:py-4 sm:px-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm relative z-40">
        <div className="flex items-center">
          <button
            onClick={handleLogoClick}
            className="text-lg sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg px-2 py-1"
          >
            <span className="hidden sm:inline">Wish Generator</span>
            <span className="sm:hidden">Wish Gen</span>
          </button>
        </div>{" "}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {currentUser && !currentUser.isGuest ? (
            <>
              {" "}
              {/* Credits display - show simplified version on mobile */}
              <div className={`${isMenuOpen ? "hidden sm:block" : "block"}`}>
                <CreditDisplay onBuyCredits={onBuyCredits} />
              </div>
              {/* User Menu Button */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 touch-manipulation min-h-[44px]"
                  aria-expanded={isMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-xs sm:text-sm">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium hidden sm:inline text-sm">
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

                {/* Desktop Dropdown Menu */}
                <div
                  className={`absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hidden sm:block transition-all duration-200 transform origin-top-right ${
                    isMenuOpen
                      ? "opacity-100 scale-100 visible"
                      : "opacity-0 scale-95 invisible"
                  }`}
                  style={{ zIndex: 50 }}
                >
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
                  <div className="py-2">
                    {" "}
                    <button
                      type="button"
                      onClick={handleBuyCredits}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center transition-colors touch-manipulation min-h-[44px]"
                    >
                      <svg
                        className="w-5 h-5 mr-3 text-yellow-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Buy Credits
                    </button>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 flex items-center transition-colors disabled:opacity-50 touch-manipulation min-h-[44px]"
                    >
                      {isSigningOut ? (
                        <>
                          <div className="w-5 h-5 mr-3">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                          </div>
                          Signing Out...
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
                          Sign Out
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <button
              onClick={handleSignIn}
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 sm:px-4 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm touch-manipulation min-h-[44px]"
            >
              Sign In
            </button>
          )}
        </div>
      </header>{" "}
      {/* Mobile Slide-out Menu */}
      {isMenuOpen && currentUser && !currentUser.isGuest && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden"
            onClick={() => setIsMenuOpen(false)}
          />{" "}
          {/* Slide-out Panel */}
          <div
            className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-800 shadow-xl z-50 sm:hidden transform transition-transform duration-300 ease-in-out ${
              isMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {" "}
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Account
              </h3>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {/* User Info */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-lg">
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
            {/* Credits Display */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <CreditDisplay onBuyCredits={handleBuyCredits} />
            </div>
            {/* Menu Items */}
            <div className="p-4 space-y-2">
              {" "}
              <button
                type="button"
                onClick={handleBuyCredits}
                className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center transition-colors rounded-lg touch-manipulation min-h-[48px]"
              >
                <svg
                  className="w-5 h-5 mr-3 text-yellow-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-medium">Buy Credits</span>
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 flex items-center transition-colors rounded-lg disabled:opacity-50 touch-manipulation min-h-[48px]"
              >
                {isSigningOut ? (
                  <>
                    <div className="w-5 h-5 mr-3">
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
        </>
      )}
    </>
  );
};

export default Header;
