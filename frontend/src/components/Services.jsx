import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { services } from '../data/mock';

const Services = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="text-[#703493] text-3xl md:text-4xl font-bold mb-4">What We Offer</h2>
          <div className="w-24 h-1 bg-[#D4B37A] mx-auto mb-6"></div>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Comprehensive cleaning and facility management solutions designed to exceed expectations 
            and create exceptional environments for guests, staff, and residents.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {services.map((service) => (
            <div 
              key={service.id}
              className="relative group overflow-hidden rounded-xl shadow-lg"
            >
              <div 
                className="h-[400px] bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ backgroundImage: `url(${service.image})` }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#703493]/90 via-[#703493]/50 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h3 className="text-white text-2xl font-bold mb-2">{service.title}</h3>
                <p className="text-white/80 text-sm mb-4">{service.description}</p>
                <Link 
                  to={service.link}
                  className="inline-flex items-center gap-2 text-[#D4B37A] font-semibold hover:gap-3 transition-all"
                >
                  Discover more <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
