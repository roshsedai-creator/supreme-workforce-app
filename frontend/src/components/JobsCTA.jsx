import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';

const JobsCTA = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-[#703493] to-[#5a2a76]">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-[#D4B37A] font-semibold uppercase tracking-widest text-sm">Career Opportunities</span>
          <h2 className="text-white text-3xl md:text-4xl font-bold mt-3 mb-4">
            Build Your Future With Supreme
          </h2>
          <p className="text-white/80 mb-8 text-lg leading-relaxed">
            Join our growing team of hospitality professionals. We offer competitive benefits, comprehensive training, and genuine opportunities for career advancement across Australia.
          </p>
          <Link to="/careers">
            <Button 
              className="bg-[#D4B37A] text-[#703493] hover:bg-white rounded-full px-10 py-6 text-base font-semibold inline-flex items-center gap-2"
            >
              Explore Opportunities <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default JobsCTA;
