import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';

const JobsCTA = () => {
  return (
    <section className="py-16 bg-[#703493]">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-white text-3xl md:text-4xl font-bold mb-4">
          Ready to Build Your Career With Us?
        </h2>
        <div className="w-24 h-1 bg-[#D4B37A] mx-auto mb-6"></div>
        <p className="text-white/80 mb-8 max-w-2xl mx-auto">
          Join a team that values excellence, integrity, and professional growth. 
          Discover exciting opportunities across Australia.
        </p>
        <Link to="/careers">
          <Button 
            className="bg-[#D4B37A] text-[#703493] hover:bg-[#c9a86c] rounded-full px-10 py-6 text-base font-semibold"
          >
            Explore Opportunities
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default JobsCTA;
