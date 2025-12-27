import React, { useState, useEffect } from 'react';
import { partners } from '../data/mock';

const Partners = () => {
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setScrollPosition((prev) => (prev + 1) % (partners.length * 180));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Double the partners array for infinite scroll effect
  const displayPartners = [...partners, ...partners];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-[#703493] text-3xl md:text-4xl font-bold text-center mb-4">
          Trusted By Industry Leaders
        </h2>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          We're proud to partner with some of Australia's most prestigious hospitality brands.
        </p>
        
        {/* Scrolling Partners */}
        <div className="overflow-hidden">
          <div 
            className="flex gap-8 transition-transform duration-100"
            style={{ transform: `translateX(-${scrollPosition}px)` }}
          >
            {displayPartners.map((partner, index) => (
              <div 
                key={`${partner.id}-${index}`}
                className="flex-shrink-0 w-[160px] h-[80px] bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#703493] hover:shadow-md transition-all"
              >
                <span className="text-gray-600 font-medium text-sm text-center px-2">
                  {partner.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center gap-2 mt-8">
          {partners.slice(0, 10).map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === 0 ? 'bg-[#703493]' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Partners;
