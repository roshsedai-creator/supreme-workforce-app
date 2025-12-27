import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Building2, GraduationCap, Stethoscope, Briefcase, Home, ShoppingBag } from 'lucide-react';

const IndustriesPage = () => {
  const industries = [
    {
      icon: Building2,
      title: "Hotels & Resorts",
      slug: "housekeeping",
      description: "Delivering exceptional guest experiences through premium housekeeping services for luxury hotels, boutique accommodations, and resort properties across Australia.",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
      features: ["24/7 housekeeping support", "Turndown services", "VIP room preparation", "Event support"]
    },
    {
      icon: GraduationCap,
      title: "Student Accommodation",
      slug: "student-accommodation",
      description: "Specialised cleaning solutions for universities, colleges, and student housing facilities ensuring clean, safe living environments for students.",
      image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
      features: ["Move-in/move-out cleans", "Common area maintenance", "Periodic deep cleaning", "Vacation turnovers"]
    },
    {
      icon: Stethoscope,
      title: "Healthcare & Aged Care",
      slug: "healthcare",
      description: "Compliant, specialised cleaning services for hospitals, aged care facilities, and medical centres with strict infection control protocols.",
      image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80",
      features: ["Infection control standards", "Specialised equipment", "Trained healthcare cleaners", "24/7 availability"]
    },
    {
      icon: Briefcase,
      title: "Corporate & Commercial",
      slug: "commercial-cleaning",
      description: "Professional office cleaning and facility management for corporate headquarters, commercial buildings, and business parks.",
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
      features: ["Daily office cleaning", "After-hours services", "Green cleaning options", "Flexible scheduling"]
    },
    {
      icon: Home,
      title: "Serviced Apartments",
      slug: "serviced-apartments",
      description: "Reliable housekeeping for serviced apartments and short-stay accommodation ensuring consistent quality for every guest.",
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
      features: ["Guest turnovers", "Linen management", "Inventory control", "Maintenance reporting"]
    },
    {
      icon: ShoppingBag,
      title: "Retail & Hospitality Venues",
      slug: "kitchen-stewarding",
      description: "Cleaning services for shopping centres, restaurants, entertainment venues, and public spaces including kitchen stewarding.",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
      features: ["High-traffic area cleaning", "Kitchen stewarding", "Floor maintenance", "Waste management"]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <section className="pt-[106px]">
        <div className="bg-[#703493] py-20">
          <div className="container mx-auto px-4">
            <h1 className="text-white text-4xl md:text-5xl font-bold mb-4">Industries We Serve</h1>
            <p className="text-white/80 text-lg max-w-2xl">
              Tailored cleaning and facility management solutions for diverse sectors across Australia.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="space-y-16">
            {industries.map((industry, index) => (
              <div key={index} className={`grid lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                  <img 
                    src={industry.image} 
                    alt={industry.title}
                    className="w-full h-[350px] object-cover rounded-xl shadow-lg"
                  />
                </div>
                <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-[#D4B37A]/20 rounded-lg flex items-center justify-center">
                      <industry.icon className="w-6 h-6 text-[#703493]" />
                    </div>
                    <h2 className="text-[#703493] text-2xl md:text-3xl font-bold">{industry.title}</h2>
                  </div>
                  <p className="text-gray-600 mb-6">{industry.description}</p>
                  <ul className="space-y-2 mb-6">
                    {industry.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-gray-700">
                        <div className="w-2 h-2 bg-[#D4B37A] rounded-full"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link to="/contact">
                    <Button className="bg-[#703493] text-white hover:bg-[#5a2a76] rounded-md px-6 py-4">
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#D4B37A]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-[#703493] text-3xl md:text-4xl font-bold mb-4">Ready to Partner With Us?</h2>
          <p className="text-[#703493]/80 mb-8 max-w-2xl mx-auto">
            Whatever your industry, we have the expertise and resources to deliver exceptional service.
          </p>
          <Link to="/quote">
            <Button className="bg-[#703493] text-white hover:bg-[#5a2a76] rounded-md px-8 py-6 text-base font-semibold">
              Request a Quote
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default IndustriesPage;
