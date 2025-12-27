import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Shield, AlertTriangle, HardHat, FileCheck, Users, HeartPulse } from 'lucide-react';

const HealthSafetyPage = () => {
  const safetyPillars = [
    { icon: Shield, title: "Risk Management", description: "Proactive identification and mitigation of workplace hazards." },
    { icon: HardHat, title: "PPE Standards", description: "Proper personal protective equipment for all tasks." },
    { icon: FileCheck, title: "Compliance", description: "Full adherence to WHS regulations and industry standards." },
    { icon: Users, title: "Training", description: "Comprehensive safety training for all team members." },
    { icon: AlertTriangle, title: "Incident Reporting", description: "Robust reporting and investigation procedures." },
    { icon: HeartPulse, title: "Wellbeing", description: "Mental and physical health support programs." }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <section className="pt-[106px]">
        <div className="bg-[#703493] py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-white text-4xl md:text-5xl font-bold mb-4">Health & Safety</h1>
            <p className="text-white/80 text-lg max-w-2xl">Safety is our top priority. We're committed to protecting our people and the communities we serve.</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Shield className="w-16 h-16 text-[#D4B37A] mx-auto mb-4" />
              <h2 className="text-[#703493] text-3xl font-bold mb-4">Our Safety Commitment</h2>
              <p className="text-gray-600">
                At Supreme Hospitality Services, we believe that every person has the right to return home safely. Our comprehensive Work Health and Safety (WHS) program ensures the protection of our employees, clients, and the public.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {safetyPillars.map((pillar, index) => (
                <div key={index} className="bg-gray-50 p-6 rounded-xl hover:shadow-lg transition-shadow">
                  <pillar.icon className="w-10 h-10 text-[#703493] mb-4" />
                  <h3 className="text-[#703493] text-xl font-bold mb-2">{pillar.title}</h3>
                  <p className="text-gray-600">{pillar.description}</p>
                </div>
              ))}
            </div>

            <div className="bg-[#703493] text-white p-8 rounded-xl">
              <h3 className="text-2xl font-bold mb-4">Safety Statistics</h3>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-[#D4B37A] text-4xl font-bold">98%</div>
                  <p className="text-white/80 text-sm">Safety Compliance Rate</p>
                </div>
                <div>
                  <div className="text-[#D4B37A] text-4xl font-bold">500+</div>
                  <p className="text-white/80 text-sm">Safety Training Hours Monthly</p>
                </div>
                <div>
                  <div className="text-[#D4B37A] text-4xl font-bold">Zero</div>
                  <p className="text-white/80 text-sm">Tolerance for Unsafe Practices</p>
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

export default HealthSafetyPage;
