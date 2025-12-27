import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { CheckCircle } from 'lucide-react';
import { corporateServices, heroImages } from '../data/mock';

const CorporateSupport = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <div className="order-2 lg:order-1 relative">
            <img 
              src={heroImages.corporate}
              alt="Professional corporate environment"
              className="w-full h-[450px] object-cover rounded-2xl shadow-2xl"
            />
            <div className="absolute -bottom-6 -right-6 bg-[#D4B37A] text-[#703493] p-6 rounded-xl shadow-xl hidden md:block">
              <div className="text-4xl font-bold">100%</div>
              <div className="text-sm font-semibold">Client Satisfaction</div>
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2">
            <span className="text-[#D4B37A] font-semibold uppercase tracking-widest text-sm">Comprehensive Solutions</span>
            <h2 className="text-[#703493] text-3xl md:text-4xl font-bold mb-6 mt-3">
              Tailored Facility Management
            </h2>
            <p className="text-gray-600 mb-8 text-lg leading-relaxed">
              We partner with businesses to deliver customised cleaning and facility management solutions that enhance productivity, create welcoming environments, and maintain the highest standards of hygiene and presentation.
            </p>
            
            {/* Services List */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {corporateServices.map((service, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#D4B37A] flex-shrink-0" />
                  <span className="text-gray-700 text-sm font-medium">{service}</span>
                </div>
              ))}
            </div>

            <Link to="/quote">
              <Button 
                className="bg-[#703493] hover:bg-[#5a2a76] text-white rounded-md px-8 py-6 text-base font-semibold"
              >
                Request a Consultation
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CorporateSupport;
