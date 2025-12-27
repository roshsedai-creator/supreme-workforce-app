import React, { useState, useEffect, useRef } from 'react';
import { Phone, MessageCircle, X, Mail, Calendar } from 'lucide-react';

const FloatingContact = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Contact Options */}
      <div className={`absolute bottom-20 right-0 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <div className="bg-white rounded-2xl shadow-2xl p-4 min-w-[280px] border border-gray-100">
          <h4 className="text-[#703493] font-bold mb-4 text-lg">Get in Touch</h4>
          
          <a href="tel:0392216236" className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#703493]/5 transition-colors group">
            <div className="w-10 h-10 bg-[#703493] rounded-full flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Call Us Now</p>
              <p className="text-[#703493] font-semibold group-hover:text-[#D4B37A]">03 9221 6236</p>
            </div>
          </a>
          
          <a href="mailto:info@supremehospitality.com.au" className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#703493]/5 transition-colors group">
            <div className="w-10 h-10 bg-[#D4B37A] rounded-full flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Email Us</p>
              <p className="text-[#703493] font-semibold group-hover:text-[#D4B37A] text-sm">info@supremehospitality.com.au</p>
            </div>
          </a>
          
          <a href="/quote" className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#703493]/5 transition-colors group">
            <div className="w-10 h-10 bg-gradient-to-br from-[#703493] to-[#D4B37A] rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Free Consultation</p>
              <p className="text-[#703493] font-semibold group-hover:text-[#D4B37A]">Request a Quote</p>
            </div>
          </a>
        </div>
      </div>

      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          isOpen 
            ? 'bg-gray-800 rotate-0' 
            : 'bg-gradient-to-br from-[#703493] to-[#D4B37A] animate-pulse'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-7 h-7 text-white" />
        )}
      </button>
      
      {/* Ping animation */}
      {!isOpen && (
        <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full animate-ping"></span>
      )}
    </div>
  );
};

export default FloatingContact;
