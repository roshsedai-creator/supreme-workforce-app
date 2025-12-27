import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { MapPin, Clock, Briefcase, ExternalLink } from 'lucide-react';
import { companyInfo } from '../data/mock';

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
    { title: "Career Growth", description: "Clear pathways for advancement and professional development" },
    { title: "Training Programs", description: "Comprehensive training to help you excel in your role" },
    { title: "Health & Wellbeing", description: "Programs designed to support your physical and mental health" },
    { title: "Work-Life Balance", description: "Flexible scheduling options to suit your lifestyle" }
  ];

  const handleApply = (jobTitle) => {
    // Open email with job application
    const subject = encodeURIComponent(`Job Application: ${jobTitle}`);
    const body = encodeURIComponent(`Hi Supreme Hospitality Services,\n\nI am interested in applying for the ${jobTitle} position.\n\nPlease find my details below:\n\nName: \nPhone: \nExperience: \n\nI have attached my resume for your review.\n\nThank you.`);
    window.location.href = `mailto:${companyInfo.email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-[106px]">
        <div className="bg-[#703493] py-20">
          <div className="container mx-auto px-4">
            <h1 className="text-white text-4xl md:text-5xl font-bold mb-4">Careers at Supreme</h1>
            <p className="text-white/80 text-lg max-w-2xl">
              Join our growing team of 500+ professionals and build a rewarding career in hospitality services.
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
                  <Button 
                    onClick={() => handleApply(job.title)}
                    className="bg-[#703493] text-white hover:bg-[#5a2a76] rounded-md px-6 whitespace-nowrap"
                  >
                    Apply Now
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* View All on Seek */}
          <div className="text-center mt-10">
            <a 
              href={companyInfo.seekUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#D4B37A] text-[#703493] px-8 py-4 rounded-md font-semibold hover:bg-[#c9a86c] transition-colors"
            >
              View All Positions on Seek <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#703493]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-white text-3xl md:text-4xl font-bold mb-4">Don't See the Right Role?</h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            We're always looking for talented individuals. Submit your resume and we'll be in touch when a suitable position opens.
          </p>
          <a href={`mailto:${companyInfo.email}?subject=General%20Application`}>
            <Button className="bg-[#D4B37A] text-[#703493] hover:bg-[#c9a86c] rounded-md px-8 py-6 text-base font-semibold">
              Submit Your Resume
            </Button>
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CareersPage;
