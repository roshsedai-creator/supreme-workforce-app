import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, Phone, ChevronDown, Menu, X, ArrowRight } from 'lucide-react';
import { companyInfo, navLinks } from '../data/mock';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActiveLink = (href) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'shadow-lg' : ''}`}>
      {/* Top Bar - Gold accent */}
      <div className="bg-gradient-to-r from-[#D4B37A] via-[#e8cc9a] to-[#D4B37A] py-2">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="hidden md:flex items-center gap-6">
            <a 
              href={`mailto:${companyInfo.email}`} 
              className="flex items-center gap-2 text-[#703493] text-sm font-medium hover:text-[#5a2a76] transition-all duration-300 hover:scale-105"
            >
              <Mail className="w-4 h-4" />
              {companyInfo.email}
            </a>
            <a 
              href={`tel:${companyInfo.phone}`} 
              className="flex items-center gap-2 text-[#703493] text-sm font-medium hover:text-[#5a2a76] transition-all duration-300 hover:scale-105"
            >
              <Phone className="w-4 h-4" />
              {companyInfo.phone}
            </a>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <Link to="/quote" className="group">
              <button className="premium-btn relative overflow-hidden flex items-center gap-2 bg-[#703493] text-white rounded-full px-6 py-2 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                <span>Get a Quote</span>
                <ArrowRight className="w-4 h-4 btn-arrow" />
              </button>
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
              className="h-20 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          {/* Desktop Navigation - Premium Style */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className={`nav-link-premium relative flex items-center gap-1 px-5 py-2.5 text-sm font-semibold transition-all duration-300 rounded-full group
                  ${isActiveLink(link.href) 
                    ? 'text-[#703493] bg-[#703493]/10' 
                    : 'text-gray-700 hover:text-[#703493]'
                  }`}
              >
                <span className="relative z-10">{link.label}</span>
                {link.hasDropdown && <ChevronDown className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" />}
                {/* Hover underline effect */}
                <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 bg-gradient-to-r from-[#703493] to-[#D4B37A] transition-all duration-300 rounded-full
                  ${isActiveLink(link.href) ? 'w-8' : 'w-0 group-hover:w-8'}`}
                />
              </Link>
            ))}
          </nav>

          {/* Contact Us Button - Premium */}
          <div className="hidden lg:flex items-center gap-3">
            <Link to="/contact" className="group">
              <button className="premium-btn relative overflow-hidden flex items-center gap-2 bg-gradient-to-r from-[#703493] to-[#8a4aad] text-white rounded-full px-7 py-2.5 text-sm font-semibold shadow-lg hover:shadow-[#703493]/30 hover:shadow-xl transition-all duration-300">
                <span>Contact Us</span>
                <ArrowRight className="w-4 h-4 btn-arrow transition-transform duration-300 group-hover:translate-x-1" />
              </button>
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
