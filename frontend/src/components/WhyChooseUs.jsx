import React from 'react';
import { Shield, Users, Clock, Award, Sparkles, HeartHandshake } from 'lucide-react';

const WhyChooseUs = () => {
  const reasons = [
    {
      icon: Users,
      title: "Dedicated Teams",
      description: "Same trusted professionals for your property, building real relationships and understanding your unique needs.",
      color: "from-[#703493] to-[#5a2a76]"
    },
    {
      icon: Shield,
      title: "$20M Fully Insured",
      description: "Complete peace of mind with comprehensive public liability coverage protecting your property and guests.",
      color: "from-[#D4B37A] to-[#b8975f]"
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      description: "Round-the-clock support because hospitality never sleeps. We're there when you need us, always.",
      color: "from-[#703493] to-[#5a2a76]"
    },
    {
      icon: Award,
      title: "Industry Certified",
      description: "ISSA certified professionals trained to the highest international standards in hospitality cleaning.",
      color: "from-[#D4B37A] to-[#b8975f]"
    },
    {
      icon: Sparkles,
      title: "Premium Quality",
      description: "We use only commercial-grade, eco-friendly products that deliver exceptional results safely.",
      color: "from-[#703493] to-[#5a2a76]"
    },
    {
      icon: HeartHandshake,
      title: "True Partnership",
      description: "We don't just provide a service—we become an extension of your team, invested in your success.",
      color: "from-[#D4B37A] to-[#b8975f]"
    }
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-[#703493]/10 text-[#703493] rounded-full text-sm font-semibold mb-4">
            Why Supreme?
          </span>
          <h2 className="text-[#703493] text-3xl md:text-4xl lg:text-5xl font-bold">
            The Premium Difference
          </h2>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto text-lg">
            Discover why Australia's leading hospitality brands trust Supreme for their most important spaces.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reasons.map((reason, index) => (
            <div 
              key={index}
              className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100"
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${reason.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <reason.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-[#703493] text-xl font-bold mb-3">{reason.title}</h3>
              <p className="text-gray-600 leading-relaxed">{reason.description}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">Ready to experience the difference?</p>
          <a 
            href="/quote" 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#703493] to-[#D4B37A] text-white px-8 py-4 rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            Get Your Free Quote
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
