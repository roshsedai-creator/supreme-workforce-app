import React from 'react';
import { TrendingUp, Clock, ThumbsUp, Award, Users, Building } from 'lucide-react';

const SuccessMetrics = () => {
  const metrics = [
    {
      icon: TrendingUp,
      value: "35%",
      label: "Average Cost Reduction",
      description: "Compared to in-house teams",
      color: "bg-green-500"
    },
    {
      icon: Clock,
      value: "2hrs",
      label: "Response Time",
      description: "For emergency requests",
      color: "bg-blue-500"
    },
    {
      icon: ThumbsUp,
      value: "99.2%",
      label: "Quality Score",
      description: "Average inspection rating",
      color: "bg-purple-500"
    },
    {
      icon: Award,
      value: "4.9/5",
      label: "Client Rating",
      description: "Based on 150+ reviews",
      color: "bg-yellow-500"
    }
  ];

  const achievements = [
    { icon: Building, number: "2.5M+", label: "Rooms Cleaned" },
    { icon: Users, number: "50K+", label: "Guests Served" },
    { icon: Clock, number: "150K+", label: "Service Hours" },
  ];

  return (
    <section className="py-20 bg-gray-50 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #703493 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-[#703493]/10 text-[#703493] rounded-full text-sm font-semibold mb-4">
            Proven Results
          </span>
          <h2 className="text-[#703493] text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Our Impact in Numbers
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We don't just promise results—we deliver them. Here's the measurable impact we've made for our clients.
          </p>
        </div>

        {/* Main Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {metrics.map((metric, index) => (
            <div 
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 group"
            >
              <div className={`w-14 h-14 ${metric.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <metric.icon className="w-7 h-7 text-white" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-1">{metric.value}</div>
              <div className="text-[#703493] font-semibold mb-1">{metric.label}</div>
              <div className="text-gray-500 text-sm">{metric.description}</div>
            </div>
          ))}
        </div>

        {/* Achievement Bar */}
        <div className="bg-gradient-to-r from-[#703493] to-[#D4B37A] rounded-2xl p-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {achievements.map((achievement, index) => (
              <div key={index} className="flex flex-col items-center">
                <achievement.icon className="w-10 h-10 text-white/80 mb-3" />
                <div className="text-white text-4xl md:text-5xl font-bold mb-1">{achievement.number}</div>
                <div className="text-white/80">{achievement.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Statement */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 text-lg">
            <span className="text-[#703493] font-semibold">Trusted by industry leaders</span> including Accor Hotels, Quest Apartments, Novotel, and 20+ other prestigious brands.
          </p>
        </div>
      </div>
    </section>
  );
};

export default SuccessMetrics;
