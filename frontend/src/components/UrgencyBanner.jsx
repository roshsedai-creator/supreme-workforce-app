import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, Users, Zap, ArrowRight } from 'lucide-react';

const UrgencyBanner = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });
  const [availableSlots, setAvailableSlots] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-6 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-10 bg-white/10"></div>

      <div className="container mx-auto px-4 relative">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left - Urgency Message */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg flex items-center gap-2">
                <span className="animate-pulse">🔥</span>
                High Demand Alert - Melbourne
              </p>
              <p className="text-white/90 text-sm flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Only {availableSlots} consultation slots left this week
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  CBD & Surrounds
                </span>
              </p>
            </div>
          </div>

          {/* Center - Countdown */}
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-white" />
            <span className="text-white/80 text-sm">Offer expires in:</span>
            <div className="flex gap-1">
              <div className="bg-white/20 px-3 py-1 rounded-lg">
                <span className="text-white font-mono font-bold text-lg">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
              </div>
              <span className="text-white font-bold">:</span>
              <div className="bg-white/20 px-3 py-1 rounded-lg">
                <span className="text-white font-mono font-bold text-lg">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
              </div>
              <span className="text-white font-bold">:</span>
              <div className="bg-white/20 px-3 py-1 rounded-lg">
                <span className="text-white font-mono font-bold text-lg">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          {/* Right - CTA */}
          <Link 
            to="/quote"
            className="flex items-center gap-2 bg-white text-red-600 px-6 py-3 rounded-full font-bold hover:bg-yellow-300 hover:scale-105 transition-all group whitespace-nowrap"
          >
            Claim Your Spot
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default UrgencyBanner;
