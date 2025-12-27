import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Building2, Home, GraduationCap, Building, Stethoscope, UtensilsCrossed, CheckCircle, ArrowRight, Users } from 'lucide-react';
import { services } from '../data/mock';

const ServicesPage = () => {
  const allServices = [
    {
      icon: Building2,
      title: "Hotel & Resort Housekeeping",
      slug: "housekeeping",
      description: "Premium housekeeping solutions tailored to deliver exceptional guest experiences.",
      image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80",
      features: ["Daily room servicing", "Turndown service", "Deep cleaning programs", "Linen management", "Quality assurance"]
    },
    {
      icon: Users,
      title: "Labour Hire Solutions",
      slug: "labour-hire",
      description: "Flexible staffing solutions for hotels, events, and hospitality venues across Australia.",
      image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80",
      features: ["Trained hospitality staff", "Flexible arrangements", "Short & long term placements", "Event staffing", "Emergency cover"]
    },
    {
      icon: UtensilsCrossed,
      title: "Kitchen Stewarding Services",
      slug: "kitchen-stewarding",
      description: "Professional kitchen stewarding for hotels, restaurants, and commercial kitchens.",
      image: "https://images.pexels.com/photos/8113499/pexels-photo-8113499.jpeg?auto=compress&cs=tinysrgb&w=800",
      features: ["Dishwashing & pot wash", "Equipment cleaning", "Floor maintenance", "Waste management", "Hygiene compliance"]
    },
    {
      icon: Building,
      title: "Commercial Facility Cleaning",
      slug: "commercial-cleaning",
      description: "Professional cleaning for offices, retail spaces, and commercial buildings.",
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
      features: ["Office cleaning", "Retail space maintenance", "Window cleaning", "Floor care", "Sanitization services"]
    },
    {
      icon: GraduationCap,
      title: "Educational & Student Living",
      slug: "student-accommodation",
      description: "Specialised cleaning services for universities and student residences.",
      image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
      features: ["Common area cleaning", "Room turnovers", "Move-in/move-out cleans", "Periodic deep cleans", "Waste management"]
    },
    {
      icon: Stethoscope,
      title: "Healthcare Facility Support",
      slug: "healthcare",
      description: "Compliant cleaning solutions for aged care and healthcare environments.",
      image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80",
      features: ["Infection control", "Specialized equipment", "Trained staff", "Compliance reporting", "24/7 availability"]
    },
    {
      icon: Home,
      title: "Serviced Apartments",
      slug: "serviced-apartments",
      description: "Reliable housekeeping for serviced apartments and short-stay accommodation.",
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
      features: ["Guest turnovers", "Linen services", "Inventory management", "Maintenance reporting", "Flexible scheduling"]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-[106px]">
        <div className="bg-[#703493] py-20">
          <div className="container mx-auto px-4">
            <h1 className="text-white text-4xl md:text-5xl font-bold mb-4">Our Services</h1>
            <p className="text-white/80 text-lg max-w-2xl">
              Comprehensive cleaning and facility management solutions tailored to your industry.
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allServices.map((service, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:border-[#D4B37A] transition-all group">
                {/* Service Image */}
                <div className="h-48 overflow-hidden">
                  <img 
                    src={service.image} 
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <div className="w-12 h-12 bg-[#D4B37A]/20 rounded-xl flex items-center justify-center mb-4">
                    <service.icon className="w-6 h-6 text-[#703493]" />
                  </div>
                  <h3 className="text-[#703493] text-xl font-bold mb-3">{service.title}</h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <ul className="space-y-2 mb-6">
                    {service.features.slice(0, 3).map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-[#D4B37A]" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link 
                    to={`/services/${service.slug}`}
                    className="inline-flex items-center gap-2 text-[#703493] font-semibold hover:text-[#D4B37A] transition-colors"
                  >
                    Learn More <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-[#D4B37A] font-semibold uppercase tracking-wider text-sm">Why Choose Us</span>
            <h2 className="text-[#703493] text-3xl md:text-4xl font-bold mt-2">The Supreme Advantage</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center p-6">
              <div className="text-[#D4B37A] text-4xl font-bold mb-2">500+</div>
              <p className="text-gray-600">Trained Professionals</p>
            </div>
            <div className="text-center p-6">
              <div className="text-[#D4B37A] text-4xl font-bold mb-2">20+</div>
              <p className="text-gray-600">Satisfied Clients</p>
            </div>
            <div className="text-center p-6">
              <div className="text-[#D4B37A] text-4xl font-bold mb-2">24/7</div>
              <p className="text-gray-600">Support Available</p>
            </div>
            <div className="text-center p-6">
              <div className="text-[#D4B37A] text-4xl font-bold mb-2">100%</div>
              <p className="text-gray-600">Compliance Focused</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#703493]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-white text-3xl md:text-4xl font-bold mb-4">Need a Customised Solution?</h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            Our team will work with you to develop a service package that meets your specific requirements.
          </p>
          <Link to="/quote">
            <Button className="bg-[#D4B37A] text-[#703493] hover:bg-[#c9a86c] rounded-md px-8 py-6 text-base font-semibold">
              Request a Quote
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ServicesPage;
