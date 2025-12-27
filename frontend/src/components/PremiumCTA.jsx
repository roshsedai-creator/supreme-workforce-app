import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { ArrowRight, Play } from 'lucide-react';

const PremiumCTA = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="https://videos.pexels.com/video-files/6466246/6466246-uhd_2732_1440_25fps.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-[#703493]/95 via-[#703493]/85 to-[#703493]/75"></div>
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4">
        <div className="max-w-3xl">
          <span className="inline-block px-4 py-2 bg-[#D4B37A]/20 text-[#D4B37A] rounded-full text-sm font-semibold mb-6">
            ✨ Premium Hospitality Services
          </span>
          <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Elevate Your Guest Experience to
            <span className="text-[#D4B37A]"> New Heights</span>
          </h2>
          <p className="text-white/80 text-lg md:text-xl mb-8 leading-relaxed">
            Partner with Melbourne's most trusted hospitality services provider. We don't just clean—we create memorable experiences that keep your guests coming back.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/quote">
              <Button className="bg-[#D4B37A] text-[#703493] hover:bg-white rounded-full px-8 py-6 text-base font-semibold group">
                Get Your Free Quote
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="outline" className="bg-transparent text-white border-2 border-white/50 hover:bg-white hover:text-[#703493] rounded-full px-8 py-6 text-base font-semibold">
                <Play className="mr-2 w-5 h-5" />
                Our Story
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap gap-8">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <div className="w-10 h-10 rounded-full bg-[#D4B37A] border-2 border-white flex items-center justify-center text-white font-bold text-sm">A</div>
                <div className="w-10 h-10 rounded-full bg-[#5a2a76] border-2 border-white flex items-center justify-center text-white font-bold text-sm">N</div>
                <div className="w-10 h-10 rounded-full bg-[#D4B37A] border-2 border-white flex items-center justify-center text-white font-bold text-sm">Q</div>
                <div className="w-10 h-10 rounded-full bg-[#5a2a76] border-2 border-white flex items-center justify-center text-white font-bold text-sm">I</div>
              </div>
              <span className="text-white/80 text-sm">Trusted by 20+ brands</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="w-5 h-5 text-[#D4B37A]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-white/80 text-sm">5-Star Service</span>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-10 right-10 w-64 h-64 bg-[#D4B37A]/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 left-10 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
    </section>
  );
};

export default PremiumCTA;
