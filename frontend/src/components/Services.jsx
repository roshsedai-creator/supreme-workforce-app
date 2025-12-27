import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { services } from '../data/mock';

const Services = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <h2 className="text-primary text-3xl md:text-4xl font-semibold mb-4">Services We Deliver</h2>
          <div className="w-24 h-1 bg-primary mb-6"></div>
          <p className="text-gray-600 max-w-3xl">
            We provide professional cleaning services across hospitality, commercial and residential environments, 
            delivering exceptional standards and reliable results for every property we support.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-3 gap-0">
          {services.map((service, index) => (
            <div 
              key={service.id}
              className="relative group overflow-hidden"
            >
              <div 
                className="h-[400px] bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ backgroundImage: `url(${service.image})` }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h3 className="text-white text-2xl font-semibold mb-2">{service.title}</h3>
                <p className="text-white/80 text-sm mb-4">{service.description}</p>
                <Link 
                  to={service.link}
                  className="inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all"
                >
                  Learn more <ArrowRight className="w-4 h-4" />
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
