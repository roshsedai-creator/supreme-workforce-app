import React from 'react';
import { stats } from '../data/mock';

const Stats = () => {
  return (
    <section className="py-16 bg-primary">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-white text-5xl md:text-6xl font-bold mb-2">
                {stat.value}
              </div>
              <div className="w-16 h-0.5 bg-white/50 mx-auto mb-4"></div>
              <p className="text-white/90 text-sm font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
