import React from 'react';
import { partners } from '../data/mock';

const Partners = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-[#703493] text-3xl md:text-4xl font-bold text-center mb-4">
          From the Clients We Service
        </h2>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          We're proud to partner with some of Australia's most prestigious hospitality brands.
        </p>
        
        {/* Partners Grid with Logos */}
        <div className="flex flex-wrap justify-center items-center gap-10 md:gap-14">
          {partners.map((partner) => (
            <div 
              key={partner.id}
              className="flex items-center justify-center w-[180px] h-[100px] bg-white border border-gray-200 rounded-xl p-4 hover:border-[#D4B37A] hover:shadow-lg transition-all group"
            >
              <img 
                src={partner.logo} 
                alt={partner.name}
                className="max-h-[60px] max-w-[140px] object-contain grayscale group-hover:grayscale-0 transition-all"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <span className="text-gray-700 font-bold text-center hidden group-hover:text-[#703493]">
                {partner.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Partners;
