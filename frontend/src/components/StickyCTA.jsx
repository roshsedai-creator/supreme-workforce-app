import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Calendar, ArrowRight, X, Sparkles } from 'lucide-react';

const StickyCTA = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 600 && !isDismissed) {
        setIsVisible(true);
      } else if (window.scrollY <= 600) {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  if (!isVisible || isDismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 animate-slide-up">
      <div className="bg-gradient-to-r from-[#703493] via-[#5a2a76] to-[#703493] shadow-2xl border-t border-[#D4B37A]/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left - Offer */}
            <div className="hidden md:flex items-center gap-3">
              <div className="w-10 h-10 bg-[#D4B37A] rounded-full flex items-center justify-center animate-pulse">
                <Sparkles className="w-5 h-5 text-[#703493]" />
              </div>
              <div>
                <p className="text-white font-semibold">🎉 Limited Offer: Free Site Assessment</p>
                <p className="text-white/70 text-sm">Get a complimentary property evaluation worth $500</p>
              </div>
            </div>

            {/* Center - CTAs */}
            <div className="flex items-center gap-3 flex-1 md:flex-none justify-center">
              <a 
                href="tel:0392216236"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-full transition-all text-sm font-medium"
              >
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">03 9221 6236</span>
              </a>
              <Link 
                to="/quote"
                className="flex items-center gap-2 bg-[#D4B37A] hover:bg-[#c9a86c] text-[#703493] px-6 py-2.5 rounded-full transition-all text-sm font-bold group"
              >
                <Calendar className="w-4 h-4" />
                Get Free Quote
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Right - Close */}
            <button 
              onClick={() => setIsDismissed(true)}
              className="text-white/60 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default StickyCTA;
