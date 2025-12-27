import React from 'react';
import { partners } from '../data/mock';

const Partners = () => {
  // Brand colors for partners without logos
  const brandColors = {
    "Ibis": { bg: "#E31837", text: "white" },
    "Causeway Group": { bg: "#2E5D4B", text: "white" }
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-[#703493] text-3xl md:text-4xl font-bold text-center mb-4">
          From the Clients We Service
        </h2>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          We're proud to partner with some of Australia's most prestigious hospitality brands.
        </p>
        
        {/* Partners Grid */}
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {partners.map((partner) => {
            if (partner.logo) {
              return (
                <div 
                  key={partner.id}
                  className="w-[180px] h-[90px] bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center p-4"
                >
                  <img 
                    src={partner.logo} 
                    alt={partner.name}
                    className="max-h-[70px] max-w-[150px] object-contain"
                  />
                </div>
              );
            } else {
              const colors = brandColors[partner.name] || { bg: "#703493", text: "white" };
              return (
                <div 
                  key={partner.id}
                  className="w-[180px] h-[90px] rounded-xl shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center p-4"
                  style={{ backgroundColor: colors.bg }}
                >
                  <span 
                    className="font-bold text-lg text-center leading-tight"
                    style={{ color: colors.text }}
                  >
                    {partner.name}
                  </span>
                </div>
              );
            }
          })}
        </div>
      </div>
    </section>
  );
};

export default Partners;
