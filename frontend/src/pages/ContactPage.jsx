import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Phone, Mail, MapPin, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { companyInfo } from '../data/mock';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ContactPage = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await axios.post(`${BACKEND_URL}/api/contact`, formData);
      setSubmitted(true);
    } catch (err) {
      setError('Failed to submit enquiry. Please try again or email us directly.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <section className="pt-[106px]">
          <div className="bg-[#703493] py-20">
            <div className="container mx-auto px-4 text-center">
              <CheckCircle className="w-20 h-20 text-[#D4B37A] mx-auto mb-6" />
              <h1 className="text-white text-4xl md:text-5xl font-bold mb-4">Thank You!</h1>
              <p className="text-white/80 text-lg max-w-2xl mx-auto">
                Your enquiry has been received. Our team will contact you within 24 hours.
              </p>
            </div>
          </div>
          <div className="py-16 text-center">
            <Button onClick={() => window.location.href = '/'} className="bg-[#703493] text-white hover:bg-[#5a2a76] rounded-md px-8 py-5">
              Return to Home
            </Button>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <section className="pt-[106px]">
        <div className="bg-[#703493] py-20">
          <div className="container mx-auto px-4">
            <h1 className="text-white text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
            <p className="text-white/80 text-lg max-w-2xl">
              Get in touch with our team to discuss how we can support your business.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="bg-gray-50 rounded-xl p-8">
              <h2 className="text-[#703493] text-2xl font-bold mb-6">Send Us a Message</h2>
              {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <Input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <Input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <Input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <Input type="text" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                  <Textarea required rows={5} value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} />
                </div>
                <Button type="submit" disabled={loading} className="bg-[#703493] text-white hover:bg-[#5a2a76] rounded-md px-8 py-5 w-full">
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</> : 'Send Message'}
                </Button>
              </form>
            </div>

            <div>
              <h2 className="text-[#703493] text-2xl font-bold mb-6">Get in Touch</h2>
              <p className="text-gray-600 mb-8">Have a question or want to learn more about our services? Our team is here to help.</p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#D4B37A]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-[#703493]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Phone</h3>
                    <a href={`tel:${companyInfo.phone}`} className="text-gray-600 hover:text-[#703493]">{companyInfo.phone}</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#D4B37A]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-[#703493]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Email</h3>
                    <a href={`mailto:${companyInfo.email}`} className="text-gray-600 hover:text-[#703493]">{companyInfo.email}</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#D4B37A]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-[#703493]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Office</h3>
                    <p className="text-gray-600">{companyInfo.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#D4B37A]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-[#703493]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Business Hours</h3>
                    <p className="text-gray-600">Monday - Friday: 8:00 AM - 6:00 PM</p>
                    <p className="text-gray-600">24/7 Support Available</p>
                  </div>
                </div>
              </div>

              {/* Google Maps */}
              <div className="mt-8">
                <h3 className="font-bold text-gray-900 mb-4">Find Us</h3>
                <div className="rounded-xl overflow-hidden shadow-lg border-2 border-gray-100">
                  <iframe
                    title="Supreme Hospitality Location"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3151.835434509374!2d144.9537353!3d-37.8162789!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad65d4c2b349649%3A0xb6899234e561db11!2sMelbourne%20VIC%2C%20Australia!5e0!3m2!1sen!2s!4v1703721600000!5m2!1sen!2s"
                    width="100%"
                    height="250"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
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

export default ContactPage;
