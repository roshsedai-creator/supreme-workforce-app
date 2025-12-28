import React from 'react';
import { partners } from '../data/mock';

const ClientLogoCarousel = () => {
  // Double the partners array for seamless infinite scroll
  const allPartners = [...partners, ...partners];

  return (
    <section className="py-16 bg-gray-50 overflow-hidden">
      <div className="container mx-auto px-4 mb-10">
        <div className="text-center">
          <span className="text-[#D4B37A] font-semibold uppercase tracking-wider text-sm">Trusted By Industry Leaders</span>
          <h2 className="text-[#703493] text-2xl md:text-3xl font-bold mt-2">
            Our Valued Partners
          </h2>
        </div>
      </div>

      {/* Infinite Scroll Carousel */}
      <div className="relative">
        {/* Gradient Overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-gray-50 to-transparent z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-gray-50 to-transparent z-10"></div>

        {/* Scrolling Container */}
        <div className="flex animate-scroll">
          {allPartners.map((partner, index) => (
            <div 
              key={index}
              className="flex-shrink-0 mx-8 group"
            >
              <div className="w-40 h-24 bg-white rounded-xl shadow-md flex items-center justify-center p-4 group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                <img 
                  src={partner.logo} 
                  alt={partner.name}
                  className="max-w-full max-h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add custom CSS for animation */}
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 20s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};

export default ClientLogoCarousel;
