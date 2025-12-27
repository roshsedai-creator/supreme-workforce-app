import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Linkedin, Instagram } from 'lucide-react';
import { Button } from './ui/button';
import { companyInfo, footerLinks } from '../data/mock';

const Footer = () => {
  return (
    <footer className="bg-gray-900">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo & Mission */}
          <div>
            <Link to="/" className="block mb-4">
              <img 
                src={companyInfo.logo} 
                alt="Supreme Hospitality Services" 
                className="h-16 w-auto object-contain"
              />
            </Link>
            <p className="text-gray-400 text-sm italic mb-6">
              "{companyInfo.mission}"
            </p>
            <Button 
              className="bg-[#D4B37A] hover:bg-[#c9a86c] text-[#703493] rounded-md px-6 py-4 text-sm font-semibold w-full"
            >
              Client Portal
            </Button>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {footerLinks.usefulLinks.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href}
                    className="text-gray-400 text-sm hover:text-[#D4B37A] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-bold mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.explore.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href}
                    className="text-gray-400 text-sm hover:text-[#D4B37A] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-white font-bold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href={`tel:${companyInfo.phone}`}
                  className="flex items-center gap-3 text-gray-400 text-sm hover:text-[#D4B37A] transition-colors"
                >
                  <Phone className="w-4 h-4 text-[#D4B37A]" />
                  {companyInfo.phone}
                </a>
              </li>
              <li>
                <a 
                  href={`mailto:${companyInfo.email}`}
                  className="flex items-center gap-3 text-gray-400 text-sm hover:text-[#D4B37A] transition-colors"
                >
                  <Mail className="w-4 h-4 text-[#D4B37A]" />
                  {companyInfo.email}
                </a>
              </li>
              <li className="flex items-start gap-3 text-gray-400 text-sm">
                <MapPin className="w-4 h-4 text-[#D4B37A] flex-shrink-0 mt-0.5" />
                {companyInfo.address}
              </li>
            </ul>

            <h3 className="text-white font-bold mt-6 mb-4">Connect With Us</h3>
            <div className="flex gap-3">
              <a 
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#D4B37A] text-[#703493] flex items-center justify-center hover:bg-[#703493] hover:text-white transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#D4B37A] text-[#703493] flex items-center justify-center hover:bg-[#703493] hover:text-white transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a 
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#D4B37A] text-[#703493] flex items-center justify-center hover:bg-[#703493] hover:text-white transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Acknowledgement */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <p className="text-gray-500 text-xs text-center max-w-4xl mx-auto">
            Supreme Hospitality Services acknowledges the Traditional Owners of Country. We pay our respects to the Aboriginal and Torres Strait Islander cultures, and to elders past and present, whose land we stand upon today.
          </p>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <p className="text-gray-500 text-xs text-center">
            © 2024 Supreme Hospitality Services. All Rights Reserved. | <Link to="/privacy" className="hover:text-[#D4B37A]">Privacy Policy</Link> | <Link to="/terms" className="hover:text-[#D4B37A]">Terms of Service</Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
