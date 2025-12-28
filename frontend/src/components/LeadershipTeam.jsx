import React from 'react';
import { Linkedin, Mail } from 'lucide-react';

const LeadershipTeam = () => {
  const teamMembers = [
    {
      name: "Roshan Sedai",
      role: "Managing Director",
      image: "https://customer-assets.emergentagent.com/job_ba775ead-be77-4cb2-bcbe-0984c2521f98/artifacts/pplkqmlh_5sTYwl7ElCDBJS58a5Pz.png",
      description: "Founder and visionary leader driving Supreme's mission to revolutionize hospitality services across Australia."
    },
    {
      name: "Ashish Poudel",
      role: "Operations Manager",
      image: "https://customer-assets.emergentagent.com/job_hosp-supreme/artifacts/453as5w2_file_00000000da4c7206898c266e3facce0f%20%281%29.png",
      description: "Ensures seamless day-to-day operations and exceptional service delivery across all client properties."
    },
    {
      name: "Happy Kafle",
      role: "Senior Operations Manager",
      image: "https://customer-assets.emergentagent.com/job_hosp-supreme/artifacts/4q36gvgh_file_00000000810c72069613d9ef46561cc6.png",
      description: "Leads strategic operations initiatives and oversees large-scale hospitality projects."
    },
    {
      name: "Alysha Moore",
      role: "Human Resources Manager",
      image: "https://customer-assets.emergentagent.com/job_hosp-supreme/artifacts/315opyua_file_000000006d607206b371b0b68dadc137.png",
      description: "Cultivates our people-first culture and ensures every team member thrives in the Supreme family."
    },
    {
      name: "Michael Chen",
      role: "Training Manager",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
      description: "Develops comprehensive training programs that set industry standards for hospitality excellence."
    },
    {
      name: "Sarah Thompson",
      role: "Business Development Manager",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face",
      description: "Drives strategic partnerships and expands Supreme's presence across Australia's hospitality sector."
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-[#D4B37A] font-semibold uppercase tracking-wider text-sm">Meet The Team</span>
          <h2 className="text-[#703493] text-3xl md:text-4xl font-bold mt-2 mb-4">
            Leadership That Inspires Excellence
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our dedicated leadership team brings together decades of hospitality expertise, united by a shared commitment to exceptional service and people-first values.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => (
            <div 
              key={index} 
              className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
            >
              {/* Image Container */}
              <div className="relative h-72 overflow-hidden">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#703493]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Social Icons on Hover */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                  <button className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center text-[#703493] hover:bg-[#D4B37A] hover:text-white transition-colors">
                    <Linkedin className="w-5 h-5" />
                  </button>
                  <button className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center text-[#703493] hover:bg-[#D4B37A] hover:text-white transition-colors">
                    <Mail className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 text-center">
                <h3 className="text-[#703493] text-xl font-bold mb-1">{member.name}</h3>
                <p className="text-[#D4B37A] font-semibold text-sm uppercase tracking-wider mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{member.description}</p>
              </div>

              {/* Bottom Accent Line */}
              <div className="h-1 bg-gradient-to-r from-[#703493] to-[#D4B37A] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LeadershipTeam;
