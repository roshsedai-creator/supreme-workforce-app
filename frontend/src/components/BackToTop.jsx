import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const toggleVisibility = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      
      setScrollProgress(progress);
      setIsVisible(scrollTop > 300);
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 z-40 group transition-all duration-500 ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-10 pointer-events-none'
      }`}
      aria-label="Back to top"
    >
      {/* Progress Ring */}
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 transform -rotate-90">
          {/* Background Circle */}
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="#e5e7eb"
            strokeWidth="3"
            fill="white"
            className="shadow-lg"
          />
          {/* Progress Circle */}
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="url(#gradient)"
            strokeWidth="3"
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 20}`}
            strokeDashoffset={`${2 * Math.PI * 20 * (1 - scrollProgress / 100)}`}
            className="transition-all duration-150"
          />
          {/* Gradient Definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#703493" />
              <stop offset="100%" stopColor="#D4B37A" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Arrow Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <ArrowUp className="w-5 h-5 text-[#703493] group-hover:text-[#D4B37A] transition-colors group-hover:-translate-y-1 transition-transform duration-300" />
        </div>
      </div>
      
      {/* Tooltip */}
      <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-[#703493] text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        Back to top
      </span>
    </button>
  );
};

export default BackToTop;
