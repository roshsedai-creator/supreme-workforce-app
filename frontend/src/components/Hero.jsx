import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { heroImages } from '../data/mock';

const Hero = () => {
  return (
    <section className="relative pt-[106px]">
      {/* Main Hero */}
      <div 
        className="relative h-[550px] bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImages.main})` }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center">
          <h1 className="text-white text-5xl md:text-6xl font-bold mb-4 max-w-3xl leading-tight">
            Elevating Hospitality <span className="text-[#D4B37A]">Standards</span>
          </h1>
          <p className="text-white/90 text-lg mb-8 max-w-xl">
            Australia's trusted partner for premium housekeeping and facility management services.
          </p>
          <div className="flex gap-4">
            <Link to="/services">
              <Button 
                className="bg-[#D4B37A] hover:bg-[#c9a86c] text-[#703493] rounded-md px-8 py-6 text-base font-semibold"
              >
                Explore Our Services
              </Button>
            </Link>
            <Link to="/contact">
              <Button 
                variant="outline"
                className="bg-transparent text-white border-white hover:bg-white hover:text-[#703493] rounded-md px-8 py-6 text-base font-medium"
              >
                Get in Touch
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Two Column CTA */}
      <div className="grid md:grid-cols-2">
        {/* Job Seeker */}
        <div 
          className="relative h-[320px] bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImages.jobSeeker})` }}
        >
          <div className="absolute inset-0 bg-[#703493]/80"></div>
          <div className="relative h-full flex flex-col items-center justify-center text-center p-8">
            <p className="text-[#D4B37A] text-sm tracking-wider uppercase mb-2 font-medium">Career Opportunities</p>
            <h2 className="text-white text-3xl md:text-4xl font-bold mb-6">Join Our Team</h2>
            <Link to="/careers">
              <Button 
                className="bg-[#D4B37A] text-[#703493] hover:bg-[#c9a86c] rounded-full px-10 py-5 text-base font-semibold"
              >
                View Careers
              </Button>
            </Link>
          </div>
        </div>

        {/* Engage Services */}
        <div 
          className="relative h-[320px] bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImages.engageServices})` }}
        >
          <div className="absolute inset-0 bg-black/70"></div>
          <div className="relative h-full flex flex-col items-center justify-center text-center p-8">
            <p className="text-[#D4B37A] text-sm tracking-wider uppercase mb-2 font-medium">For Businesses</p>
            <h2 className="text-white text-3xl md:text-4xl font-bold mb-6">Partner With Us</h2>
            <Link to="/services">
              <Button 
                className="bg-white text-[#703493] hover:bg-[#D4B37A] rounded-full px-10 py-5 text-base font-semibold"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
