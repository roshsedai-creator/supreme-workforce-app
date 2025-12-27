import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Users, Award, Shield, Heart, Target, Clock } from 'lucide-react';

const AboutPage = () => {
  const values = [
    { icon: Users, title: "People First", description: "Our team members are the heart of our business. We invest in their growth and wellbeing." },
    { icon: Award, title: "Excellence", description: "We strive for the highest standards in every service we deliver." },
    { icon: Shield, title: "Integrity", description: "Honesty and transparency guide all our business relationships." },
    { icon: Heart, title: "Care", description: "We genuinely care about our clients, their guests, and our communities." },
    { icon: Target, title: "Reliability", description: "Consistent, dependable service you can count on every time." },
    { icon: Clock, title: "Responsiveness", description: "Quick to act and adapt to meet your evolving needs." }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-[106px]">
        <div className="bg-[#703493] py-20">
          <div className="container mx-auto px-4">
            <h1 className="text-white text-4xl md:text-5xl font-bold mb-4">About Supreme</h1>
            <p className="text-white/80 text-lg max-w-2xl">
              Delivering excellence in hospitality services across Australia for over two decades.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-[#D4B37A] font-semibold uppercase tracking-wider text-sm">Our Story</span>
              <h2 className="text-[#703493] text-3xl md:text-4xl font-bold mb-6 mt-2">A Legacy of Service Excellence</h2>
              <p className="text-gray-600 mb-4">
                Supreme Hospitality Services was founded with a simple yet powerful vision: to revolutionize the way hospitality cleaning services are delivered in Australia.
              </p>
              <p className="text-gray-600 mb-4">
                Over the years, we've grown from a small team to a nationwide workforce of over 4,000 dedicated professionals, serving some of Australia's most prestigious hotels, commercial buildings, and educational institutions.
              </p>
              <p className="text-gray-600 mb-6">
                Our success is built on a foundation of trust, quality, and an unwavering commitment to exceeding expectations.
              </p>
              <Link to="/contact">
                <Button className="bg-[#703493] text-white hover:bg-[#5a2a76] rounded-md px-6 py-5">
                  Get in Touch
                </Button>
              </Link>
            </div>
            <div>
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80" 
                alt="Our Team"
                className="rounded-xl shadow-xl w-full h-[400px] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-[#D4B37A] font-semibold uppercase tracking-wider text-sm">Our Values</span>
            <h2 className="text-[#703493] text-3xl md:text-4xl font-bold mt-2">What Drives Us</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-[#703493]/10 rounded-lg flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-[#703493]" />
                </div>
                <h3 className="text-[#703493] text-xl font-bold mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#D4B37A]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-[#703493] text-3xl md:text-4xl font-bold mb-4">Ready to Experience the Supreme Difference?</h2>
          <p className="text-[#703493]/80 mb-8 max-w-2xl mx-auto">
            Let us show you why Australia's leading hospitality brands trust us with their most important spaces.
          </p>
          <Link to="/contact">
            <Button className="bg-[#703493] text-white hover:bg-[#5a2a76] rounded-md px-8 py-6 text-base font-semibold">
              Request a Consultation
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
