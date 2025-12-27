import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Users, Award, Shield, Heart, Target, Clock } from 'lucide-react';
import { companyInfo } from '../data/mock';

const AboutPage = () => {
  const values = [
    { icon: Users, title: "People First", description: "Our team members are the heart of our business. We invest in their growth and wellbeing." },
    { icon: Award, title: "Excellence", description: "We strive for the highest standards in every service we deliver." },
    { icon: Shield, title: "Integrity", description: "Honesty and transparency guide all our business relationships." },
    { icon: Heart, title: "Care", description: "We genuinely care about our clients, their guests, and our communities." },
    { icon: Target, title: "Reliability", description: "Consistent, dependable service you can count on every time." },
    { icon: Clock, title: "Responsiveness", description: "Quick to act and adapt to meet your evolving needs." }
  ];

  const milestones = [
    { year: "2020", title: "Founded", description: "Supreme Hospitality Services established in Melbourne" },
    { year: "2021", title: "Expansion", description: "Expanded operations to Sydney and Brisbane" },
    { year: "2022", title: "Growth", description: "Reached 2,000+ team members across Australia" },
    { year: "2023", title: "Innovation", description: "Launched industry-leading training programs" },
    { year: "2024", title: "Leadership", description: "Recognised as a leading hospitality services provider" }
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
              Delivering excellence in hospitality services across Australia since 2020.
            </p>
          </div>
        </div>
      </section>

      {/* Managing Director Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
              <div className="relative">
                <img 
                  src={companyInfo.mdPhoto}
                  alt="Managing Director"
                  className="w-[350px] h-[400px] object-cover rounded-xl shadow-2xl"
                />
                <div className="absolute -bottom-4 -right-4 bg-[#D4B37A] text-[#703493] px-6 py-3 rounded-lg shadow-lg">
                  <p className="font-bold">Founder & Managing Director</p>
                </div>
              </div>
            </div>
            <div>
              <span className="text-[#D4B37A] font-semibold uppercase tracking-wider text-sm">Leadership</span>
              <h2 className="text-[#703493] text-3xl md:text-4xl font-bold mb-6 mt-2">Meet Our Managing Director</h2>
              <p className="text-gray-600 mb-4">
                With a vision to transform the hospitality services industry in Australia, our Managing Director founded Supreme Hospitality Services in 2020. Starting with a small team of dedicated professionals in Melbourne, he built the company on the principles of excellence, integrity, and genuine care for both clients and employees.
              </p>
              <p className="text-gray-600 mb-4">
                Drawing from years of experience in the hospitality sector, he recognised the need for a service provider that could deliver consistent, high-quality outcomes while treating team members as valued partners rather than just employees. This people-first approach has been instrumental in Supreme's rapid growth and success.
              </p>
              <p className="text-gray-600 mb-6">
                Under his leadership, Supreme has grown from a local Melbourne operation to a nationwide presence with over 4,000 dedicated professionals serving some of Australia's most prestigious hospitality brands including Accor Group, Novotel, Ibis, Causeway Group, and Quest Apartments.
              </p>
              <blockquote className="border-l-4 border-[#D4B37A] pl-4 italic text-gray-700">
                "Our success is built on the foundation of our people. When you invest in your team, they invest in delivering exceptional service to your clients."
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-[#D4B37A] font-semibold uppercase tracking-wider text-sm">Our Journey</span>
            <h2 className="text-[#703493] text-3xl md:text-4xl font-bold mt-2">The Supreme Story</h2>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex gap-6 items-start">
                  <div className="flex-shrink-0 w-20 h-20 bg-[#703493] text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {milestone.year}
                  </div>
                  <div className="pt-2">
                    <h3 className="text-[#703493] text-xl font-bold">{milestone.title}</h3>
                    <p className="text-gray-600">{milestone.description}</p>
                  </div>
                </div>
              ))}
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
              Get in Touch
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
