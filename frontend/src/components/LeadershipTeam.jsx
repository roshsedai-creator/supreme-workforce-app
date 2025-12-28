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
      name: "David Mitchell",
      role: "Training Manager",
      image: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
      description: "Develops comprehensive training programs that set industry standards for hospitality excellence."
    },
    {
      name: "Sarah Thompson",
      role: "Business Development Manager",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face&auto=format&q=80",
      description: "Drives strategic partnerships and expands Supreme's presence across Australia's hospitality sector."
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {teamMembers.map((member, index) => (
            <div 
              key={index} 
              className="group bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100"
            >
              {/* Image Container - Premium Styling */}
              <div className="relative h-80 overflow-hidden bg-gradient-to-br from-[#703493]/10 to-[#D4B37A]/10">
                {/* Decorative Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#703493] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#D4B37A] rounded-full translate-y-1/2 -translate-x-1/2"></div>
                </div>
                
                {/* Profile Image with Premium Frame */}
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <div className="relative">
                    {/* Outer Glow Ring */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#703493] to-[#D4B37A] rounded-full blur-md opacity-30 group-hover:opacity-50 transition-opacity duration-500 scale-105"></div>
                    
                    {/* Image Frame */}
                    <div className="relative w-56 h-56 rounded-full p-1 bg-gradient-to-br from-[#703493] to-[#D4B37A] shadow-2xl group-hover:scale-105 transition-transform duration-500">
                      <div className="w-full h-full rounded-full overflow-hidden bg-white p-1">
                        <img 
                          src={member.image} 
                          alt={member.name}
                          className="w-full h-full object-cover object-top rounded-full"
                        />
                      </div>
                    </div>
                    
                    {/* Role Badge */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#703493] to-[#8a4aad] text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                      {member.role.split(' ')[0]}
                    </div>
                  </div>
                </div>

                {/* Social Icons on Hover */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                  <button className="w-9 h-9 bg-white/95 rounded-full flex items-center justify-center text-[#703493] hover:bg-[#703493] hover:text-white transition-colors shadow-lg">
                    <Linkedin className="w-4 h-4" />
                  </button>
                  <button className="w-9 h-9 bg-white/95 rounded-full flex items-center justify-center text-[#703493] hover:bg-[#703493] hover:text-white transition-colors shadow-lg">
                    <Mail className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 text-center bg-white">
                <h3 className="text-[#703493] text-xl font-bold mb-1">{member.name}</h3>
                <p className="text-[#D4B37A] font-semibold text-sm uppercase tracking-wider mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{member.description}</p>
              </div>

              {/* Bottom Accent Line */}
              <div className="h-1.5 bg-gradient-to-r from-[#703493] via-[#D4B37A] to-[#703493] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LeadershipTeam;
