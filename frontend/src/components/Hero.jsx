import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { heroImages } from '../data/mock';

const Hero = () => {
  return (
    <section className="relative">
      {/* Main Hero */}
      <div 
        className="relative h-[500px] bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImages.main})` }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center">
          <h1 className="text-white text-5xl md:text-6xl font-semibold italic mb-4">
            Premium Clean for Every Space
          </h1>
          <p className="text-white/90 text-lg mb-8 max-w-xl">
            Guaranteeing transparency and compliance within our industry.
          </p>
          <div>
            <Button 
              className="bg-primary hover:bg-primary/90 text-white rounded-lg px-8 py-6 text-base font-medium"
            >
              Find Out More
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
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="relative h-full flex flex-col items-center justify-center text-center p-8">
            <p className="text-white/80 text-sm tracking-wider mb-2">I Am a Job Seeker</p>
            <h2 className="text-white text-3xl md:text-4xl font-semibold mb-6">Looking for a Job</h2>
            <Button 
              variant="outline"
              className="bg-white text-primary border-white hover:bg-white/90 rounded-full px-10 py-5 text-base font-medium"
            >
              Jobs
            </Button>
          </div>
        </div>

        {/* Engage Services */}
        <div 
          className="relative h-[350px] bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImages.engageServices})` }}
        >
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="relative h-full flex flex-col items-center justify-center text-center p-8">
            <p className="text-white/80 text-sm tracking-wider mb-2">I Am Looking to Engage</p>
            <h2 className="text-white text-3xl md:text-4xl font-semibold mb-6">Housekeeping Services</h2>
            <Button 
              variant="outline"
              className="bg-white text-primary border-white hover:bg-white/90 rounded-full px-10 py-5 text-base font-medium"
            >
              Why Choose Us
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
