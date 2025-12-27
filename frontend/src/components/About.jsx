import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const About = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-[#D4B37A] font-semibold uppercase tracking-widest text-sm">Why Choose Supreme</span>
          <h2 className="text-[#703493] text-3xl md:text-4xl font-bold mt-3 mb-6">
            Setting the Benchmark in Hospitality Excellence
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-8">
            Since 2020, Supreme Hospitality Services has been delivering exceptional housekeeping and facility management solutions to Australia's most prestigious properties. Our commitment to quality, combined with our people-first approach, has made us the trusted partner for leading hotels, serviced apartments, and commercial facilities nationwide.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link 
              to="/about"
              className="inline-flex items-center gap-2 text-[#703493] font-semibold hover:text-[#D4B37A] transition-colors group"
            >
              Learn More About Us 
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/industries"
              className="inline-flex items-center gap-2 text-[#703493] font-semibold hover:text-[#D4B37A] transition-colors group"
            >
              Industries We Serve 
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
