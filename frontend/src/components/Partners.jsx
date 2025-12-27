import React from 'react';
import { partners } from '../data/mock';

const Partners = () => {
  // Brand colors for each partner
  const brandColors = {
    "Accor Group": { bg: "#1A1F71", text: "white" },
    "Novotel": { bg: "#003580", text: "white" },
    "Ibis": { bg: "#E31837", text: "white" },
    "Causeway Group": { bg: "#2E5D4B", text: "white" },
    "Quest Apartments": { bg: "#00457C", text: "white" }
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
        
        {/* Partners Grid with Styled Logos */}
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8">
          {partners.map((partner) => {
            const colors = brandColors[partner.name] || { bg: "#703493", text: "white" };
            return (
              <div 
                key={partner.id}
                className="w-[200px] h-[100px] rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center p-4 cursor-pointer"
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
          })}
        </div>
      </div>
    </section>
  );
};

export default Partners;
