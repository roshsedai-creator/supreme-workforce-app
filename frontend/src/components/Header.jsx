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
      {/* Top Bar */}
      <div className="bg-[#703493] py-3">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="hidden md:flex items-center gap-6">
            <a 
              href={`mailto:${companyInfo.email}`} 
              className="flex items-center gap-2 text-white text-sm hover:text-[#D4B37A] transition-colors"
            >
              <Mail className="w-4 h-4" />
              {companyInfo.email}
            </a>
            <a 
              href={`tel:${companyInfo.phone}`} 
              className="flex items-center gap-2 text-white text-sm hover:text-[#D4B37A] transition-colors"
            >
              <Phone className="w-4 h-4" />
              {companyInfo.phone}
            </a>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <Button 
              className="bg-[#D4B37A] text-[#703493] border-[#D4B37A] hover:bg-[#c9a86c] rounded-full px-6 h-9 text-sm font-semibold"
            >
              Get a Quote
            </Button>
            <Button 
              variant="outline"
              className="bg-transparent text-white border-white hover:bg-white/10 rounded-full px-6 h-9 text-sm font-medium"
            >
              NZ Site
            </Button>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="bg-[#703493] py-3 border-t border-white/10">
        <div className="container mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <img 
              src={companyInfo.logo} 
              alt="Supreme Hospitality Services" 
              className="h-16 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="flex items-center gap-1 text-white px-4 py-2 text-sm font-medium hover:text-[#D4B37A] transition-colors"
              >
                {link.label}
                {link.hasDropdown && <ChevronDown className="w-4 h-4" />}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Button 
              variant="outline" 
              className="bg-transparent text-white border-white hover:bg-white hover:text-[#703493] rounded-full px-6 h-9 text-sm font-medium transition-colors"
            >
              Login
            </Button>
            <Button 
              className="bg-[#D4B37A] text-[#703493] hover:bg-[#c9a86c] rounded-full px-6 h-9 text-sm font-semibold"
            >
              Register
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#703493] border-t border-white/10 mt-4">
            <div className="container mx-auto px-4 py-4">
              <nav className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="flex items-center justify-between text-white px-4 py-3 text-sm font-medium hover:bg-white/10 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                    {link.hasDropdown && <ChevronDown className="w-4 h-4" />}
                  </Link>
                ))}
              </nav>
              <div className="flex gap-3 mt-4 pt-4 border-t border-white/10">
                <Button 
                  variant="outline" 
                  className="flex-1 bg-transparent text-white border-white hover:bg-white hover:text-[#703493] rounded-full h-10 text-sm font-medium"
                >
                  Login
                </Button>
                <Button 
                  className="flex-1 bg-[#D4B37A] text-[#703493] hover:bg-[#c9a86c] rounded-full h-10 text-sm font-semibold"
                >
                  Register
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
