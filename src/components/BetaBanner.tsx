"use client";

import { useState } from "react";

export function BetaBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-black text-white py-3 px-4 shadow-md">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex-1 mb-3 md:mb-0">
            <h2 className="text-lg font-bold text-white mb-1">
              Welcome to Mosaic by Mechifact <span className="bg-white text-[#ff0084] text-xs px-2 py-0.5 rounded-full ml-2 uppercase font-bold">Beta</span>
            </h2>
            <p className="text-sm md:text-base text-gray-300">
              A powerful tool for building AI-generated mosaics with precise control over the generation process.
              As we're in beta, you may encounter occasional issues while we improve the experience.
            </p>
          </div>
          <button 
            onClick={() => setIsVisible(false)}
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-md text-sm transition-colors flex-shrink-0"
            aria-label="Dismiss banner"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}