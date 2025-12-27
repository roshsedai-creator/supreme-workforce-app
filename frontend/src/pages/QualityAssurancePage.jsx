import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Award, CheckCircle, Target, TrendingUp, Users, Star } from 'lucide-react';

const QualityAssurancePage = () => {
  const qualityPillars = [
    { icon: Target, title: "Consistent Standards", description: "Uniform quality across all locations and services" },
    { icon: CheckCircle, title: "Regular Audits", description: "Systematic quality checks and performance reviews" },
    { icon: Users, title: "Trained Teams", description: "Comprehensive training programs for all staff" },
    { icon: TrendingUp, title: "Continuous Improvement", description: "Ongoing refinement of processes and procedures" }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <section className="pt-[106px]">
        <div className="bg-[#703493] py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-white text-4xl md:text-5xl font-bold mb-4">Quality Assurance</h1>
            <p className="text-white/80 text-lg max-w-2xl">Our commitment to delivering excellence in every service we provide.</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Award className="w-16 h-16 text-[#D4B37A] mx-auto mb-4" />
              <h2 className="text-[#703493] text-3xl font-bold mb-4">Excellence is Our Standard</h2>
              <p className="text-gray-600">
                At Supreme Hospitality Services, quality isn't just a goal—it's embedded in everything we do. Our comprehensive quality assurance program ensures consistent, exceptional service delivery across all client sites.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {qualityPillars.map((pillar, index) => (
                <div key={index} className="bg-gray-50 p-6 rounded-xl">
                  <pillar.icon className="w-10 h-10 text-[#703493] mb-4" />
                  <h3 className="text-[#703493] text-xl font-bold mb-2">{pillar.title}</h3>
                  <p className="text-gray-600">{pillar.description}</p>
                </div>
              ))}
            </div>

            <div className="bg-[#703493] text-white p-8 rounded-xl">
              <h3 className="text-2xl font-bold mb-4">Our Quality Framework</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-[#D4B37A] mt-1" />
                  <div>
                    <h4 className="font-semibold">Pre-Service Planning</h4>
                    <p className="text-white/80">Detailed site assessments and customised service plans</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-[#D4B37A] mt-1" />
                  <div>
                    <h4 className="font-semibold">Ongoing Monitoring</h4>
                    <p className="text-white/80">Regular inspections and client feedback integration</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-[#D4B37A] mt-1" />
                  <div>
                    <h4 className="font-semibold">Performance Reporting</h4>
                    <p className="text-white/80">Transparent reporting and KPI tracking for clients</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default QualityAssurancePage;
