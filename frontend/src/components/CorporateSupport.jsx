import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Check } from 'lucide-react';
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
              alt="Corporate team meeting"
              className="w-full h-[400px] object-cover rounded-lg shadow-lg"
            />
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2">
            <h2 className="text-primary text-3xl md:text-4xl font-semibold mb-4">
              Corporate Service Support
            </h2>
            <p className="text-gray-600 mb-8">
              With a focus on compliance, internal training, and quality, we are now developing Corporate Operational Support.
            </p>
            
            {/* Services List */}
            <ul className="space-y-3 mb-8">
              {corporateServices.map((service, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-gray-700">{service}</span>
                </li>
              ))}
            </ul>

            <p className="text-gray-600 mb-8">
              We offer transparency, flexibility and compassion, with people at the heart of all we do.
            </p>

            <Button 
              className="bg-primary hover:bg-primary/90 text-white rounded-lg px-8 py-6 text-base font-medium"
            >
              Speak To Us
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CorporateSupport;
