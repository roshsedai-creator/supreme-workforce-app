import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { companyInfo } from '../data/mock';

const QuotePage = () => {
  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    industry: '',
    numberOfRooms: '',
    servicesRequired: [],
    additionalInfo: ''
  });

  const industries = ['Hotels & Resorts', 'Commercial Buildings', 'Student Accommodation', 'Healthcare', 'Corporate Offices', 'Serviced Apartments', 'Other'];
  const serviceOptions = ['Daily Housekeeping', 'Commercial Cleaning', 'Deep Cleaning', 'Linen Services', 'Window Cleaning', 'Floor Care', 'Sanitization'];

  const handleServiceChange = (service) => {
    setFormData(prev => ({
      ...prev,
      servicesRequired: prev.servicesRequired.includes(service)
        ? prev.servicesRequired.filter(s => s !== service)
        : [...prev.servicesRequired, service]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create email content
    const subject = encodeURIComponent(`Quote Request from ${formData.businessName}`);
    const body = encodeURIComponent(
`New Quote Request from Supreme Hospitality Services website:

BUSINESS DETAILS
================
Business Name: ${formData.businessName}
Contact Name: ${formData.contactName}
Email: ${formData.email}
Phone: ${formData.phone}

SERVICE REQUIREMENTS
====================
Industry: ${formData.industry}
Number of Rooms/Areas: ${formData.numberOfRooms || 'Not specified'}
Services Required: ${formData.servicesRequired.join(', ') || 'Not specified'}

ADDITIONAL INFORMATION
======================
${formData.additionalInfo || 'None provided'}

---
This quote request was submitted via the Get a Quote form on the website.`
    );
    
    // Open email client
    window.location.href = `mailto:${companyInfo.email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <section className="pt-[106px]">
        <div className="bg-[#703493] py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-white text-4xl md:text-5xl font-bold mb-4">Get a Quote</h1>
            <p className="text-white/80 text-lg max-w-2xl">
              Tell us about your requirements and we'll provide a customised quote for your business.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Name *</label>
                <Input 
                  required
                  value={formData.businessName}
                  onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name *</label>
                <Input 
                  required
                  value={formData.contactName}
                  onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <Input 
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                <Input 
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Industry *</label>
                <select 
                  required
                  value={formData.industry}
                  onChange={(e) => setFormData({...formData, industry: e.target.value})}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                >
                  <option value="">Select Industry</option>
                  {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Rooms/Areas</label>
                <Input 
                  type="number"
                  value={formData.numberOfRooms}
                  onChange={(e) => setFormData({...formData, numberOfRooms: e.target.value})}
                  className="w-full"
                  placeholder="Approximate number"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Services Required *</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {serviceOptions.map(service => (
                  <label key={service} className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formData.servicesRequired.includes(service)}
                      onChange={() => handleServiceChange(service)}
                      className="w-4 h-4 text-[#703493]"
                    />
                    <span className="text-sm text-gray-700">{service}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Information</label>
              <Textarea 
                rows={4}
                value={formData.additionalInfo}
                onChange={(e) => setFormData({...formData, additionalInfo: e.target.value})}
                className="w-full"
                placeholder="Tell us more about your specific requirements..."
              />
            </div>

            <div className="mt-8">
              <Button type="submit" className="bg-[#703493] text-white hover:bg-[#5a2a76] rounded-md px-8 py-5 w-full md:w-auto">
                Submit Quote Request
              </Button>
              <p className="text-gray-500 text-sm mt-3">
                Clicking submit will open your email client to send this quote request to our team.
              </p>
            </div>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default QuotePage;
