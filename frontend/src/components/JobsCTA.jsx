import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';

const JobsCTA = () => {
  return (
    <section className="py-16 bg-primary">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-white text-3xl md:text-4xl font-semibold mb-4">
          Check Out Our Latest Job Opportunities!
        </h2>
        <div className="w-24 h-1 bg-white mx-auto mb-8"></div>
        <Button 
          variant="outline"
          className="bg-white text-primary border-white hover:bg-white/90 rounded-full px-10 py-6 text-base font-medium"
        >
          View All Jobs
        </Button>
      </div>
    </section>
  );
};

export default JobsCTA;
