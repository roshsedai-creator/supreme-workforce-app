import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Linkedin } from 'lucide-react';
import { Button } from './ui/button';
import { companyInfo, footerLinks } from '../data/mock';

const Footer = () => {
  return (
    <footer className="bg-gray-100">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo & Mission */}
          <div>
            <Link to="/" className="flex flex-col items-start mb-4">
              <div className="flex items-end">
                <span className="text-primary text-4xl font-light tracking-wider">shs</span>
                <div className="w-2 h-2 bg-primary rounded-full mb-6 ml-1"></div>
              </div>
              <span className="text-primary/80 text-xs tracking-wider">hospitality</span>
            </Link>
            <p className="text-gray-600 text-sm italic mb-6">
              "{companyInfo.mission}"
            </p>
            <Button 
              className="bg-primary hover:bg-primary/90 text-white rounded-lg px-8 py-5 text-base font-medium w-full"
            >
              Client Login
            </Button>
          </div>

          {/* Useful Links */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Useful Links</h3>
            <ul className="space-y-2">
              {footerLinks.usefulLinks.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href}
                    className="text-gray-600 text-sm hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Explore</h3>
            <ul className="space-y-2">
              {footerLinks.explore.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href}
                    className="text-gray-600 text-sm hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Contact Information</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href={`tel:${companyInfo.phone}`}
                  className="flex items-center gap-3 text-gray-600 text-sm hover:text-primary transition-colors"
                >
                  <Phone className="w-4 h-4 text-primary" />
                  {companyInfo.phone}
                </a>
              </li>
              <li>
                <a 
                  href={`mailto:${companyInfo.email}`}
                  className="flex items-center gap-3 text-gray-600 text-sm hover:text-primary transition-colors"
                >
                  <Mail className="w-4 h-4 text-primary" />
                  {companyInfo.email}
                </a>
              </li>
              <li className="flex items-start gap-3 text-gray-600 text-sm">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                {companyInfo.address}
              </li>
            </ul>

            <h3 className="text-gray-900 font-semibold mt-6 mb-4">Follow Us</h3>
            <div className="flex gap-3">
              <a 
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Acknowledgement */}
      <div className="border-t border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 justify-center mb-4">
            <div className="w-8 h-5 bg-red-600 rounded-sm flex items-center justify-center">
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            </div>
            <div className="w-8 h-5 rounded-sm overflow-hidden flex">
              <div className="w-1/2 bg-blue-900"></div>
              <div className="w-1/2 bg-cyan-400"></div>
            </div>
          </div>
          <p className="text-gray-500 text-xs text-center max-w-4xl mx-auto">
            Supreme Hospitality Services acknowledges the Traditional Owners of Country. We pay our respects to the Aboriginal and Torres Strait Islander cultures, and to elders past and present, whose land we stand upon today.
          </p>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <p className="text-gray-500 text-xs text-center">
            Supreme Hospitality Services | All Rights Reserved 2024 | <Link to="/privacy" className="hover:text-primary">Privacy Policy</Link> | <Link to="/sitemap" className="hover:text-primary">Site Map</Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
