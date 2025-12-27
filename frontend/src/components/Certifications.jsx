import React from 'react';
import { Shield, Award, CheckCircle, Star, Leaf, Clock } from 'lucide-react';

const Certifications = () => {
  const certifications = [
    {
      icon: Shield,
      title: "Fully Insured",
      description: "$20M Public Liability"
    },
    {
      icon: Award,
      title: "Industry Certified",
      description: "ISSA Certified Professionals"
    },
    {
      icon: CheckCircle,
      title: "Quality Assured",
      description: "ISO 9001 Standards"
    },
    {
      icon: Leaf,
      title: "Eco-Friendly",
      description: "Green Cleaning Practices"
    },
    {
      icon: Star,
      title: "5-Star Rated",
      description: "Client Satisfaction"
    },
    {
      icon: Clock,
      title: "24/7 Support",
      description: "Always Available"
    }
  ];

  return (
    <section className="py-8 bg-gradient-to-r from-[#703493] to-[#5a2a76] overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {certifications.map((cert, index) => (
            <div 
              key={index} 
              className="flex items-center gap-3 text-white/90 hover:text-white transition-colors"
            >
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <cert.icon className="w-5 h-5 text-[#D4B37A]" />
              </div>
              <div>
                <p className="font-semibold text-sm">{cert.title}</p>
                <p className="text-xs text-white/70">{cert.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Certifications;
