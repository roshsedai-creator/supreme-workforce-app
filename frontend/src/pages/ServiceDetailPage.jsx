import React from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { CheckCircle, ArrowLeft, Phone, Mail } from 'lucide-react';
import { services, companyInfo } from '../data/mock';

const ServiceDetailPage = () => {
  const { slug } = useParams();
  const service = services.find(s => s.slug === slug);

  if (!service) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="pt-[106px] min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#703493] mb-4">Service Not Found</h1>
            <Link to="/services">
              <Button className="bg-[#703493] text-white hover:bg-[#5a2a76]">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Services
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Get other services for recommendations
  const otherServices = services.filter(s => s.id !== service.id).slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-[106px]">
        <div className="relative h-[400px]">
          <img 
            src={service.image} 
            alt={service.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#703493]/90 via-[#703493]/70 to-transparent"></div>
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4">
              <Link to="/services" className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Services
              </Link>
              <h1 className="text-white text-4xl md:text-5xl font-bold mb-4">{service.title}</h1>
              <p className="text-white/90 text-lg max-w-2xl">{service.description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Left Content */}
            <div className="lg:col-span-2">
              <h2 className="text-[#703493] text-2xl md:text-3xl font-bold mb-6">About This Service</h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                {service.fullDescription}
              </p>
              
              <h3 className="text-[#703493] text-xl font-bold mb-4">What's Included</h3>
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {service.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-[#D4B37A] flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <h3 className="text-[#703493] text-xl font-bold mb-4">Why Choose Supreme?</h3>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#D4B37A] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Trained and vetted professionals with industry certifications</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#D4B37A] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Flexible scheduling to meet your operational needs</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#D4B37A] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Quality assurance with regular inspections and reporting</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#D4B37A] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Eco-friendly cleaning products and sustainable practices</span>
                </li>
              </ul>
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-1">
              {/* Contact Card */}
              <div className="bg-[#703493] rounded-xl p-6 text-white mb-6">
                <h3 className="text-xl font-bold mb-4">Get a Free Quote</h3>
                <p className="text-white/80 mb-6">
                  Interested in this service? Contact us for a customised quote tailored to your needs.
                </p>
                <Link to="/quote">
                  <Button className="w-full bg-[#D4B37A] text-[#703493] hover:bg-white font-semibold py-6">
                    Request a Quote
                  </Button>
                </Link>
                <div className="mt-6 space-y-3">
                  <a href={`tel:${companyInfo.phone}`} className="flex items-center gap-3 text-white/90 hover:text-white">
                    <Phone className="w-5 h-5" />
                    {companyInfo.phone}
                  </a>
                  <a href={`mailto:${companyInfo.email}`} className="flex items-center gap-3 text-white/90 hover:text-white">
                    <Mail className="w-5 h-5" />
                    {companyInfo.email}
                  </a>
                </div>
              </div>

              {/* Stats Card */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-[#703493] text-lg font-bold mb-4">Our Track Record</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                    <span className="text-gray-600">Team Members</span>
                    <span className="text-[#703493] font-bold">500+</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                    <span className="text-gray-600">Satisfied Clients</span>
                    <span className="text-[#703493] font-bold">20+</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                    <span className="text-gray-600">Service Hours</span>
                    <span className="text-[#703493] font-bold">700+</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Availability</span>
                    <span className="text-[#703493] font-bold">24/7</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Other Services */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-[#703493] text-2xl md:text-3xl font-bold mb-8 text-center">Explore Our Other Services</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {otherServices.map((otherService) => (
              <Link key={otherService.id} to={`/services/${otherService.slug}`} className="group">
                <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={otherService.image} 
                      alt={otherService.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="text-[#703493] font-bold mb-2 group-hover:text-[#D4B37A] transition-colors">
                      {otherService.title}
                    </h3>
                    <p className="text-gray-600 text-sm">{otherService.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#703493]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-white text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            Let us customise a {service.title.toLowerCase()} solution that perfectly fits your requirements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/quote">
              <Button className="bg-[#D4B37A] text-[#703493] hover:bg-white rounded-md px-8 py-6 text-base font-semibold">
                Get a Quote
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-[#703493] rounded-md px-8 py-6 text-base font-semibold">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ServiceDetailPage;
