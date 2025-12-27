import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { heroImages, heroVideos } from '../data/mock';
import { Play, Volume2, VolumeX } from 'lucide-react';

const Hero = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <section className="relative pt-[106px]">
      {/* Main Hero with Video Background */}
      <div className="relative h-[600px] overflow-hidden">
        {/* Video Background */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster={heroImages.main}
        >
          <source src={heroVideos.bedMaking} type="video/mp4" />
          {/* Fallback to image if video doesn't load */}
        </video>
        
        {/* Overlay - Subtle dark gradient to show video clearly */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>
        
        {/* Video Controls */}
        <div className="absolute bottom-6 right-6 flex gap-2 z-20">
          <button 
            onClick={togglePlay}
            className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
            ) : (
              <Play className="w-5 h-5" />
            )}
          </button>
          <button 
            onClick={toggleMute}
            className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
        
        {/* Content */}
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center z-10">
          <div className="max-w-3xl">
            <p className="text-[#D4B37A] text-sm md:text-base font-semibold uppercase tracking-widest mb-4">
              Australia's Premier Hospitality Partner
            </p>
            <h1 className="text-white text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Elevating Hospitality <br/><span className="text-[#D4B37A]">Standards</span>
            </h1>
            <p className="text-white/90 text-lg md:text-xl mb-8 max-w-xl leading-relaxed">
              Delivering exceptional housekeeping and facility management services that transform guest experiences across Australia's finest properties.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/services">
                <Button 
                  className="bg-[#D4B37A] hover:bg-[#c9a86c] text-[#703493] rounded-md px-8 py-6 text-base font-semibold w-full sm:w-auto"
                >
                  Explore Our Services
                </Button>
              </Link>
              <Link to="/contact">
                <Button 
                  variant="outline"
                  className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-[#703493] rounded-md px-8 py-6 text-base font-semibold w-full sm:w-auto"
                >
                  Get in Touch
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column CTA with Videos */}
      <div className="grid md:grid-cols-2">
        {/* Job Seeker - Team Working Video */}
        <div className="relative h-[350px] overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            poster={heroImages.jobSeeker}
          >
            <source src={heroVideos.teamWork} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-[#703493]/95 via-[#703493]/70 to-[#703493]/40"></div>
          <div className="relative h-full flex flex-col items-center justify-center text-center p-8">
            <p className="text-[#D4B37A] text-sm tracking-wider uppercase mb-3 font-semibold">Career Opportunities</p>
            <h2 className="text-white text-3xl md:text-4xl font-bold mb-4">Join Our Team</h2>
            <p className="text-white/90 text-sm mb-6 max-w-sm">Build a rewarding career with Australia's leading hospitality services provider</p>
            <Link to="/careers">
              <Button 
                className="bg-[#D4B37A] text-[#703493] hover:bg-white rounded-full px-10 py-5 text-base font-semibold"
              >
                View Opportunities
              </Button>
            </Link>
          </div>
        </div>

        {/* Engage Services - Hotel Lobby Video */}
        <div className="relative h-[350px] overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            poster={heroImages.engageServices}
          >
            <source src={heroVideos.hotelLobby} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30"></div>
          <div className="relative h-full flex flex-col items-center justify-center text-center p-8">
            <p className="text-[#D4B37A] text-sm tracking-wider uppercase mb-3 font-semibold">For Businesses</p>
            <h2 className="text-white text-3xl md:text-4xl font-bold mb-4">Partner With Us</h2>
            <p className="text-white/90 text-sm mb-6 max-w-sm">Discover tailored solutions for your hospitality or commercial facility</p>
            <Link to="/quote">
              <Button 
                className="bg-white text-[#703493] hover:bg-[#D4B37A] rounded-full px-10 py-5 text-base font-semibold"
              >
                Request a Quote
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
