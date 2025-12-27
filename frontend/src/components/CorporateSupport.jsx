import React from 'react';
import { Button } from './ui/button';
import { corporateServices, heroImages } from '../data/mock';

const CorporateSupport = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <div className="order-2 lg:order-1">
            <img 
              src={heroImages.corporate}
              alt="Corporate team collaboration"
              className="w-full h-[400px] object-cover rounded-xl shadow-xl"
            />
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2">
            <span className="text-[#D4B37A] font-semibold uppercase tracking-wider text-sm">Enterprise Solutions</span>
            <h2 className="text-[#703493] text-3xl md:text-4xl font-bold mb-4 mt-2">
              Complete Facility Support
            </h2>
            <p className="text-gray-600 mb-8">
              We deliver tailored solutions that integrate seamlessly with your operations. 
              Our focus on quality, compliance, and continuous improvement ensures consistent excellence.
            </p>
            
            {/* Services List */}
            <ul className="space-y-3 mb-8">
              {corporateServices.map((service, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#D4B37A] rounded-full"></div>
                  <span className="text-gray-700">{service}</span>
                </li>
              ))}
            </ul>

            <p className="text-gray-600 mb-8 italic">
              We bring transparency, flexibility and dedication to every partnership.
            </p>

            <Button 
              className="bg-[#703493] hover:bg-[#5a2a76] text-white rounded-md px-8 py-6 text-base font-semibold"
            >
              Request a Consultation
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CorporateSupport;
