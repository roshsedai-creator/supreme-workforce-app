import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { services } from '../data/mock';

const Services = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-14 text-center">
          <span className="text-[#D4B37A] font-semibold uppercase tracking-widest text-sm">Our Expertise</span>
          <h2 className="text-[#703493] text-3xl md:text-4xl font-bold mt-3 mb-4">Premium Services</h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Comprehensive solutions tailored to meet the unique needs of your property, 
            delivered with unmatched professionalism and attention to detail.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service) => (
            <div 
              key={service.id}
              className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="relative overflow-hidden">
                <div 
                  className="h-[260px] bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url(${service.image})` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#703493]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="p-8">
                <h3 className="text-[#703493] text-xl font-bold mb-3">{service.title}</h3>
                <p className="text-gray-600 text-sm mb-5 leading-relaxed">{service.description}</p>
                <Link 
                  to={service.link}
                  className="inline-flex items-center gap-2 text-[#D4B37A] font-semibold text-sm hover:gap-3 transition-all"
                >
                  Learn More <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/services" className="inline-flex items-center gap-2 bg-[#703493] text-white px-8 py-4 rounded-md font-semibold hover:bg-[#5a2a76] transition-colors">
            View All Services <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Services;
