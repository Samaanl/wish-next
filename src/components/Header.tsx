import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import CreditDisplay from "./CreditDisplay";

interface HeaderProps {
  onLogin: () => void;
  onBuyCredits: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogin, onBuyCredits }) => {
  const { currentUser, logOut } = useAuth();

  return (
    <header className="py-4 px-6 flex justify-between items-center">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
          Wish Generator
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        {currentUser ? (
          <>
            <CreditDisplay onBuyCredits={onBuyCredits} />

            <div className="relative group">
              <button className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">
                <span>{currentUser.name}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                <button
                  onClick={onBuyCredits}
                  className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Buy Credits
                </button>

                <button
                  onClick={() => logOut()}
                  className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </>
        ) : (
          <button
            onClick={onLogin}
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
