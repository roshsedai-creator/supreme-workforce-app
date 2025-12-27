import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Leaf, Droplets, Recycle, Sun, TreePine, Factory } from 'lucide-react';

const SustainabilityPage = () => {
  const initiatives = [
    { icon: Leaf, title: "Eco-Friendly Products", description: "Using environmentally responsible cleaning products that are biodegradable and non-toxic." },
    { icon: Droplets, title: "Water Conservation", description: "Implementing water-saving practices and efficient cleaning methods." },
    { icon: Recycle, title: "Waste Reduction", description: "Minimizing waste through recycling programs and responsible disposal." },
    { icon: Sun, title: "Energy Efficiency", description: "Optimizing energy use in our operations and offices." },
    { icon: TreePine, title: "Carbon Footprint", description: "Working to reduce our environmental impact across all operations." },
    { icon: Factory, title: "Supply Chain", description: "Partnering with suppliers who share our commitment to sustainability." }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <section className="pt-[106px]">
        <div className="bg-[#703493] py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-white text-4xl md:text-5xl font-bold mb-4">Sustainability</h1>
            <p className="text-white/80 text-lg max-w-2xl">Our commitment to environmental responsibility and sustainable practices.</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Leaf className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-[#703493] text-3xl font-bold mb-4">Our Green Commitment</h2>
              <p className="text-gray-600">
                Supreme Hospitality Services is dedicated to minimizing our environmental impact while delivering exceptional service. We believe in sustainable practices that benefit our clients, communities, and the planet.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {initiatives.map((initiative, index) => (
                <div key={index} className="bg-gray-50 p-6 rounded-xl hover:shadow-lg transition-shadow">
                  <initiative.icon className="w-10 h-10 text-green-600 mb-4" />
                  <h3 className="text-[#703493] text-xl font-bold mb-2">{initiative.title}</h3>
                  <p className="text-gray-600">{initiative.description}</p>
                </div>
              ))}
            </div>

            <div className="bg-green-50 p-8 rounded-xl border border-green-200">
              <h3 className="text-[#703493] text-xl font-bold mb-4">Our 2025 Sustainability Goals</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  <span className="text-gray-700">Reduce plastic waste by 50%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  <span className="text-gray-700">100% eco-friendly cleaning products</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  <span className="text-gray-700">Carbon neutral operations by 2026</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SustainabilityPage;
