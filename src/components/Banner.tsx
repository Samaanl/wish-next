import React from "react";
import Image from "next/image";

export default function Banner() {
  return (
    <div className="relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-60 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 filter blur-3xl pointer-events-none"></div>

      <div className="flex flex-col items-center justify-center relative z-10 py-10">
        {/* Logo Icon */}
        <div className="relative mb-5">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 animate-pulse"></div>
          <div className="absolute inset-1 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center">
            <Image
              src="/sparkles.svg"
              alt="Sparkles"
              width={34}
              height={34}
              className="animate-glow"
            />
          </div>
          <div className="w-16 h-16 md:w-20 md:h-20 opacity-0"></div>{" "}
          {/* Spacer */}
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
          Wish Generator
        </h1>

        {/* Description */}
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-center leading-relaxed">
          Create beautifully written custom wishes for any occasion, perfectly
          tailored to your recipient with a touch of magic.
        </p>

        {/* Decoration stars */}
        <div className="absolute top-0 left-1/4 text-yellow-400 text-2xl animate-bounce opacity-70 pointer-events-none">
          ✦
        </div>
        <div
          className="absolute bottom-0 right-1/4 text-pink-400 text-xl animate-bounce opacity-70 pointer-events-none"
          style={{ animationDelay: "0.5s" }}
        >
          ✦
        </div>
      </div>
    </div>
  );
}
