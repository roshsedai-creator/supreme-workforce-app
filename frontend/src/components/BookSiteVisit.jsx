import React, { useState } from 'react';
import { Calendar, MapPin, Clock, CheckCircle, Phone, ArrowRight, Sparkles } from 'lucide-react';

const BookSiteVisit = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    propertyType: '',
    preferredDate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.propertyType,
          message: `Site Visit Request - Preferred Date: ${formData.preferredDate}`
        })
      });
      
      if (response.ok) {
        setIsSuccess(true);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    "Free property assessment",
    "Custom service recommendations",
    "Transparent pricing breakdown",
    "No obligation consultation"
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Info */}
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4B37A]/20 text-[#703493] rounded-full text-sm font-semibold mb-4">
              <Sparkles className="w-4 h-4" />
              Free Consultation
            </span>
            <h2 className="text-[#703493] text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Book a Free Site Visit
            </h2>
            <p className="text-gray-600 text-lg mb-8">
              Let our experts visit your property and provide a tailored solution. No obligation, no pressure—just honest advice from industry professionals.
            </p>

            {/* Benefits */}
            <div className="space-y-4 mb-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Quick Contact */}
            <div className="bg-[#703493]/5 rounded-xl p-6">
              <p className="text-gray-600 mb-3">Prefer to talk? Call us directly:</p>
              <a 
                href="tel:0392216236"
                className="flex items-center gap-3 text-[#703493] text-2xl font-bold hover:text-[#D4B37A] transition-colors"
              >
                <Phone className="w-6 h-6" />
                03 9221 6236
              </a>
            </div>
          </div>

          {/* Right - Form */}
          <div className="bg-gradient-to-br from-[#703493] to-[#5a2a76] rounded-3xl p-8 shadow-2xl">
            {isSuccess ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-white text-2xl font-bold mb-3">Booking Received!</h3>
                <p className="text-white/80">
                  Our team will contact you within 2 hours to confirm your site visit.
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-white text-2xl font-bold mb-6 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-[#D4B37A]" />
                  Schedule Your Visit
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Your Name *"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#D4B37A]"
                  />
                  
                  <input
                    type="email"
                    placeholder="Email Address *"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#D4B37A]"
                  />
                  
                  <input
                    type="tel"
                    placeholder="Phone Number *"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#D4B37A]"
                  />
                  
                  <select
                    required
                    value={formData.propertyType}
                    onChange={(e) => setFormData({...formData, propertyType: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#D4B37A]"
                  >
                    <option value="" className="text-gray-800">Property Type *</option>
                    <option value="Hotel" className="text-gray-800">Hotel / Resort</option>
                    <option value="Serviced Apartments" className="text-gray-800">Serviced Apartments</option>
                    <option value="Student Accommodation" className="text-gray-800">Student Accommodation</option>
                    <option value="Commercial" className="text-gray-800">Commercial Building</option>
                    <option value="Healthcare" className="text-gray-800">Healthcare Facility</option>
                    <option value="Other" className="text-gray-800">Other</option>
                  </select>
                  
                  <input
                    type="date"
                    required
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({...formData, preferredDate: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#D4B37A]"
                  />
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#D4B37A] hover:bg-[#c9a86c] text-[#703493] py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all hover:scale-105 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      'Booking...'
                    ) : (
                      <>
                        Book Free Site Visit
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
                
                <p className="text-white/50 text-sm text-center mt-4">
                  🔒 Your information is secure and never shared
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookSiteVisit;
