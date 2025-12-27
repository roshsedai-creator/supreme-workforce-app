import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, ChevronDown, Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { companyInfo, navLinks } from '../data/mock';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'shadow-lg' : ''}`}>
      {/* Top Bar - Gold accent */}
      <div className="bg-[#D4B37A] py-2">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="hidden md:flex items-center gap-6">
            <a 
              href={`mailto:${companyInfo.email}`} 
              className="flex items-center gap-2 text-[#703493] text-sm font-medium hover:text-[#5a2a76] transition-colors"
            >
              <Mail className="w-4 h-4" />
              {companyInfo.email}
            </a>
            <a 
              href={`tel:${companyInfo.phone}`} 
              className="flex items-center gap-2 text-[#703493] text-sm font-medium hover:text-[#5a2a76] transition-colors"
            >
              <Phone className="w-4 h-4" />
              {companyInfo.phone}
            </a>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <Link to="/quote">
              <Button 
                className="bg-[#703493] text-white hover:bg-[#5a2a76] rounded-full px-6 h-8 text-sm font-semibold"
              >
                Get a Quote
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation - White background */}
      <div className="bg-white py-3 border-b border-gray-100">
        <div className="container mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <img 
              src={companyInfo.logo} 
              alt="Supreme Hospitality Services" 
              className="h-20 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="flex items-center gap-1 text-gray-700 px-4 py-2 text-sm font-medium hover:text-[#703493] transition-colors"
              >
                {link.label}
                {link.hasDropdown && <ChevronDown className="w-4 h-4" />}
              </Link>
            ))}
          </nav>

          {/* Contact Us Button */}
          <div className="hidden lg:flex items-center gap-3">
            <Link to="/contact">
              <Button 
                className="bg-[#703493] text-white hover:bg-[#5a2a76] rounded-full px-6 h-9 text-sm font-semibold"
              >
                Contact Us
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden text-[#703493] p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 mt-3">
            <div className="container mx-auto px-4 py-4">
              <nav className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="flex items-center justify-between text-gray-700 px-4 py-3 text-sm font-medium hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                    {link.hasDropdown && <ChevronDown className="w-4 h-4" />}
                  </Link>
                ))}
              </nav>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>
                  <Button 
                    className="w-full bg-[#703493] text-white hover:bg-[#5a2a76] rounded-full h-10 text-sm font-semibold"
                  >
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
