import React, { ReactNode } from "react";

interface CardContainerProps {
  children: ReactNode;
  className?: string;
}

export default function CardContainer({
  children,
  className = "",
}: CardContainerProps) {
  return (
    <div
      className={`relative bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-xl 
                     border border-indigo-100 dark:border-indigo-900 
                     overflow-hidden transition-all duration-300 
                     hover:shadow-indigo-100/30 dark:hover:shadow-indigo-900/20 
                     ${className}`}
    >
      {/* Decorative corner dots */}
      <div className="absolute top-3 left-3 w-1.5 h-1.5 rounded-full bg-indigo-400/30 dark:bg-indigo-400/20"></div>
      <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-indigo-400/30 dark:bg-indigo-400/20"></div>
      <div className="absolute bottom-3 left-3 w-1.5 h-1.5 rounded-full bg-indigo-400/30 dark:bg-indigo-400/20"></div>
      <div className="absolute bottom-3 right-3 w-1.5 h-1.5 rounded-full bg-indigo-400/30 dark:bg-indigo-400/20"></div>

      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white to-indigo-50/30 dark:from-gray-800 dark:to-indigo-950/10 pointer-events-none"></div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
