import React, { useState, useEffect } from 'react';

const PageLoader = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out after content loads
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => setIsLoading(false), 500);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoading) return null;

  return (
    <div className={`fixed inset-0 z-[200] bg-white flex items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      <div className="text-center">
        {/* Logo Animation */}
        <div className="relative mb-8">
          <div className="w-24 h-24 mx-auto relative">
            {/* Spinning ring */}
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-[#703493] border-r-[#D4B37A] rounded-full animate-spin"></div>
            
            {/* Center logo */}
            <div className="absolute inset-2 bg-gradient-to-br from-[#703493] to-[#D4B37A] rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">S</span>
            </div>
          </div>
        </div>
        
        {/* Loading text */}
        <h2 className="text-[#703493] text-xl font-semibold mb-2">Supreme Hospitality</h2>
        <p className="text-gray-500 text-sm">Loading excellence...</p>
        
        {/* Loading bar */}
        <div className="w-48 h-1 bg-gray-200 rounded-full mt-6 mx-auto overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#703493] to-[#D4B37A] rounded-full animate-loading-bar"></div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes loading-bar {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        .animate-loading-bar {
          animation: loading-bar 1.5s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
};

export default PageLoader;
