import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, TrendingUp, Clock, Users, DollarSign, ArrowRight, CheckCircle } from 'lucide-react';

const SavingsCalculator = () => {
  const [rooms, setRooms] = useState(50);
  const [currentCost, setCurrentCost] = useState(25);
  
  // Calculate potential savings (10% savings)
  const monthlyCleans = rooms * 30;
  const currentMonthly = monthlyCleans * currentCost;
  const supremeCost = currentCost * 0.90; // 10% savings
  const supremeMonthly = monthlyCleans * supremeCost;
  const monthlySavings = currentMonthly - supremeMonthly;
  const yearlySavings = monthlySavings * 12;
  const efficiencyGain = 20; // 20% efficiency gain

  return (
    <section className="py-20 bg-gradient-to-br from-[#703493] via-[#5a2a76] to-[#703493] relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-64 h-64 bg-[#D4B37A] rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4B37A]/20 text-[#D4B37A] rounded-full text-sm font-semibold mb-4">
            <Calculator className="w-4 h-4" />
            Interactive Tool
          </span>
          <h2 className="text-white text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            See Your Potential Savings
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            Discover how much you could save by partnering with Supreme. Adjust the sliders to match your property.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Calculator Controls */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h3 className="text-white text-xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#D4B37A]" />
              Customize Your Estimate
            </h3>
            
            {/* Rooms Slider */}
            <div className="mb-8">
              <div className="flex justify-between text-white mb-2">
                <label className="font-medium">Number of Rooms</label>
                <span className="text-[#D4B37A] font-bold text-xl">{rooms}</span>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                value={rooms}
                onChange={(e) => setRooms(parseInt(e.target.value))}
                className="w-full h-3 bg-white/20 rounded-full appearance-none cursor-pointer accent-[#D4B37A]"
              />
              <div className="flex justify-between text-white/50 text-sm mt-1">
                <span>10 rooms</span>
                <span>500 rooms</span>
              </div>
            </div>

            {/* Cost Per Clean Slider */}
            <div className="mb-8">
              <div className="flex justify-between text-white mb-2">
                <label className="font-medium">Current Cost Per Room Clean</label>
                <span className="text-[#D4B37A] font-bold text-xl">${currentCost}</span>
              </div>
              <input
                type="range"
                min="15"
                max="50"
                value={currentCost}
                onChange={(e) => setCurrentCost(parseInt(e.target.value))}
                className="w-full h-3 bg-white/20 rounded-full appearance-none cursor-pointer accent-[#D4B37A]"
              />
              <div className="flex justify-between text-white/50 text-sm mt-1">
                <span>$15</span>
                <span>$50</span>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-white/80">
                <CheckCircle className="w-5 h-5 text-[#D4B37A]" />
                <span>No hidden fees or surcharges</span>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <CheckCircle className="w-5 h-5 text-[#D4B37A]" />
                <span>Quality guarantee included</span>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <CheckCircle className="w-5 h-5 text-[#D4B37A]" />
                <span>Dedicated account manager</span>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {/* Savings Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-6 text-center transform hover:scale-105 transition-transform">
                <DollarSign className="w-8 h-8 text-[#703493] mx-auto mb-2" />
                <p className="text-gray-500 text-sm mb-1">Monthly Savings</p>
                <p className="text-[#703493] text-3xl font-bold">${monthlySavings.toLocaleString()}</p>
              </div>
              <div className="bg-[#D4B37A] rounded-2xl p-6 text-center transform hover:scale-105 transition-transform">
                <TrendingUp className="w-8 h-8 text-[#703493] mx-auto mb-2" />
                <p className="text-[#703493]/70 text-sm mb-1">Yearly Savings</p>
                <p className="text-[#703493] text-3xl font-bold">${yearlySavings.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20">
                <Clock className="w-8 h-8 text-[#D4B37A] mx-auto mb-2" />
                <p className="text-white/70 text-sm mb-1">Efficiency Gain</p>
                <p className="text-white text-3xl font-bold">+{efficiencyGain}%</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20">
                <Users className="w-8 h-8 text-[#D4B37A] mx-auto mb-2" />
                <p className="text-white/70 text-sm mb-1">Staff Retention</p>
                <p className="text-white text-3xl font-bold">99%</p>
              </div>
            </div>

            {/* CTA */}
            <Link 
              to="/quote"
              className="flex items-center justify-center gap-3 bg-white text-[#703493] px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all group w-full"
            >
              Get Your Custom Quote
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </Link>
            <p className="text-white/50 text-center text-sm">
              *Estimates based on industry averages. Actual savings may vary.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SavingsCalculator;
