import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Users, Heart, Scale, Shield, Globe, Handshake } from 'lucide-react';

const WorkplacePolicyPage = () => {
  const policies = [
    { icon: Users, title: "Equal Opportunity", description: "We provide equal employment opportunities regardless of race, gender, age, religion, or background." },
    { icon: Heart, title: "Respect & Dignity", description: "Every team member is treated with respect and dignity in a harassment-free workplace." },
    { icon: Scale, title: "Fair Treatment", description: "Fair wages, reasonable working hours, and transparent employment conditions." },
    { icon: Shield, title: "Safe Environment", description: "A physically and psychologically safe workplace for all employees." },
    { icon: Globe, title: "Diversity & Inclusion", description: "We celebrate diversity and foster an inclusive culture where everyone belongs." },
    { icon: Handshake, title: "Open Communication", description: "Open dialogue between management and staff with clear grievance procedures." }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <section className="pt-[106px]">
        <div className="bg-[#703493] py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-white text-4xl md:text-5xl font-bold mb-4">Workplace Policy</h1>
            <p className="text-white/80 text-lg max-w-2xl">Creating a positive, inclusive, and supportive work environment for all.</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-[#703493] text-3xl font-bold mb-4">Our Workplace Commitment</h2>
              <p className="text-gray-600">
                At Supreme Hospitality Services, we believe our people are our greatest asset. We are committed to maintaining a workplace that values respect, fairness, and opportunity for all team members.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {policies.map((policy, index) => (
                <div key={index} className="bg-gray-50 p-6 rounded-xl hover:shadow-lg transition-shadow">
                  <policy.icon className="w-10 h-10 text-[#D4B37A] mb-4" />
                  <h3 className="text-[#703493] text-xl font-bold mb-2">{policy.title}</h3>
                  <p className="text-gray-600">{policy.description}</p>
                </div>
              ))}
            </div>

            <div className="bg-[#D4B37A]/20 p-8 rounded-xl border border-[#D4B37A]">
              <h3 className="text-[#703493] text-xl font-bold mb-4">Reporting Concerns</h3>
              <p className="text-gray-700 mb-4">
                We encourage all employees to report any workplace concerns or violations of this policy. Reports can be made confidentially through:
              </p>
              <ul className="text-gray-700 space-y-2">
                <li>• Direct supervisor or manager</li>
                <li>• Human Resources department</li>
                <li>• Confidential reporting hotline</li>
                <li>• Email: <a href="mailto:info@supremehospitality.com.au" className="text-[#703493] font-semibold">info@supremehospitality.com.au</a></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default WorkplacePolicyPage;
