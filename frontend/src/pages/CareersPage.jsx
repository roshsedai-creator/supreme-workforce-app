import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { MapPin, Clock, Briefcase, Users, Heart, TrendingUp, Award, Coffee } from 'lucide-react';

const CareersPage = () => {
  const jobs = [
    { id: 1, title: "Housekeeping Attendant", location: "Melbourne, VIC", type: "Full-time", department: "Operations" },
    { id: 2, title: "Cleaning Supervisor", location: "Sydney, NSW", type: "Full-time", department: "Operations" },
    { id: 3, title: "Area Manager", location: "Brisbane, QLD", type: "Full-time", department: "Management" },
    { id: 4, title: "Commercial Cleaner", location: "Perth, WA", type: "Part-time", department: "Operations" },
    { id: 5, title: "Quality Assurance Officer", location: "Melbourne, VIC", type: "Full-time", department: "Quality" },
    { id: 6, title: "Training Coordinator", location: "Sydney, NSW", type: "Full-time", department: "HR" }
  ];

  const benefits = [
    { icon: TrendingUp, title: "Career Growth", description: "Clear pathways for advancement and professional development" },
    { icon: Award, title: "Training Programs", description: "Comprehensive training to help you excel in your role" },
    { icon: Heart, title: "Health & Wellbeing", description: "Programs designed to support your physical and mental health" },
    { icon: Coffee, title: "Work-Life Balance", description: "Flexible scheduling options to suit your lifestyle" }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-[106px]">
        <div className="bg-[#703493] py-20">
          <div className="container mx-auto px-4">
            <h1 className="text-white text-4xl md:text-5xl font-bold mb-4">Careers at Supreme</h1>
            <p className="text-white/80 text-lg max-w-2xl">
              Join our team of 4,000+ professionals and build a rewarding career in hospitality services.
            </p>
          </div>
        </div>
      </section>

      {/* Why Join Us */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-[#D4B37A] font-semibold uppercase tracking-wider text-sm">Why Join Us</span>
            <h2 className="text-[#703493] text-3xl md:text-4xl font-bold mt-2">Benefits of Working With Supreme</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center p-6 bg-gray-50 rounded-xl">
                <div className="w-14 h-14 bg-[#D4B37A]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-7 h-7 text-[#703493]" />
                </div>
                <h3 className="text-[#703493] text-lg font-bold mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Current Openings */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-[#D4B37A] font-semibold uppercase tracking-wider text-sm">Opportunities</span>
            <h2 className="text-[#703493] text-3xl md:text-4xl font-bold mt-2">Current Openings</h2>
          </div>
          <div className="max-w-4xl mx-auto space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-[#D4B37A] transition-all">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-[#703493] text-lg font-bold">{job.title}</h3>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" /> {job.type}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" /> {job.department}
                      </span>
                    </div>
                  </div>
                  <Button className="bg-[#703493] text-white hover:bg-[#5a2a76] rounded-md px-6 whitespace-nowrap">
                    Apply Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#D4B37A]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-[#703493] text-3xl md:text-4xl font-bold mb-4">Don't See the Right Role?</h2>
          <p className="text-[#703493]/80 mb-8 max-w-2xl mx-auto">
            We're always looking for talented individuals. Submit your resume and we'll be in touch when a suitable position opens.
          </p>
          <Button className="bg-[#703493] text-white hover:bg-[#5a2a76] rounded-md px-8 py-6 text-base font-semibold">
            Submit Your Resume
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CareersPage;
