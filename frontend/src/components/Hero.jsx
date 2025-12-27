import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { heroImages } from '../data/mock';

const Hero = () => {
  return (
    <section className="relative pt-[130px]">
      {/* Main Hero */}
      <div 
        className="relative h-[550px] bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImages.main})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#703493]/80 to-[#703493]/40"></div>
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center">
          <h1 className="text-white text-5xl md:text-6xl font-bold mb-4 max-w-3xl leading-tight">
            Elevating Hospitality <span className="text-[#D4B37A]">Standards</span>
          </h1>
          <p className="text-white/90 text-lg mb-8 max-w-xl">
            Australia's trusted partner for premium housekeeping and facility management services.
          </p>
          <div className="flex gap-4">
            <Button 
              className="bg-[#D4B37A] hover:bg-[#c9a86c] text-[#703493] rounded-md px-8 py-6 text-base font-semibold"
            >
              Explore Our Services
            </Button>
            <Button 
              variant="outline"
              className="bg-transparent text-white border-white hover:bg-white hover:text-[#703493] rounded-md px-8 py-6 text-base font-medium"
            >
              Get in Touch
            </Button>
          </div>
        </div>
      </div>

      {/* Two Column CTA */}
      <div className="grid md:grid-cols-2">
        {/* Job Seeker */}
        <div 
          className="relative h-[350px] bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImages.jobSeeker})` }}
        >
          <div className="absolute inset-0 bg-[#703493]/70"></div>
          <div className="relative h-full flex flex-col items-center justify-center text-center p-8">
            <p className="text-[#D4B37A] text-sm tracking-wider uppercase mb-2 font-medium">Career Opportunities</p>
            <h2 className="text-white text-3xl md:text-4xl font-bold mb-6">Join Our Team</h2>
            <Button 
              className="bg-[#D4B37A] text-[#703493] hover:bg-[#c9a86c] rounded-full px-10 py-5 text-base font-semibold"
            >
              View Careers
            </Button>
          </div>
        </div>

        {/* Engage Services */}
        <div 
          className="relative h-[350px] bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImages.engageServices})` }}
        >
          <div className="absolute inset-0 bg-black/60"></div>
          <div className="relative h-full flex flex-col items-center justify-center text-center p-8">
            <p className="text-[#D4B37A] text-sm tracking-wider uppercase mb-2 font-medium">For Businesses</p>
            <h2 className="text-white text-3xl md:text-4xl font-bold mb-6">Partner With Us</h2>
            <Button 
              variant="outline"
              className="bg-white text-[#703493] border-white hover:bg-[#D4B37A] hover:border-[#D4B37A] rounded-full px-10 py-5 text-base font-semibold"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
