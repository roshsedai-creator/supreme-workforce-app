import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, ChevronDown, Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { companyInfo, navLinks } from '../data/mock';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-primary py-3">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a 
              href={`mailto:${companyInfo.email}`} 
              className="flex items-center gap-2 text-white text-sm hover:opacity-80 transition-opacity"
            >
              <Mail className="w-4 h-4" />
              {companyInfo.email}
            </a>
            <a 
              href={`tel:${companyInfo.phone}`} 
              className="flex items-center gap-2 text-white text-sm hover:opacity-80 transition-opacity"
            >
              <Phone className="w-4 h-4" />
              {companyInfo.phone}
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="bg-white text-primary border-white hover:bg-white/90 rounded-full px-6 h-9 text-sm font-medium"
            >
              Get a Quote
            </Button>
            <Button 
              variant="outline" 
              className="bg-white text-primary border-white hover:bg-white/90 rounded-full px-6 h-9 text-sm font-medium"
            >
              shs NZ
            </Button>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="bg-primary py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex flex-col items-center">
            <div className="flex items-end">
              <span className="text-white text-5xl font-light tracking-wider">shs</span>
              <div className="w-3 h-3 bg-white rounded-full mb-8 ml-1"></div>
            </div>
            <span className="text-white/90 text-xs tracking-widest mt-[-4px]">{companyInfo.tagline}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="flex items-center gap-1 text-white px-4 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
              >
                {link.label}
                {link.hasDropdown && <ChevronDown className="w-4 h-4" />}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center gap-2">
            <Button 
              variant="outline" 
              className="bg-white text-primary border-white hover:bg-white/90 rounded-full px-6 h-9 text-sm font-medium"
            >
              Login
            </Button>
            <span className="text-white/50">|</span>
            <Button 
              variant="outline" 
              className="bg-white text-primary border-white hover:bg-white/90 rounded-full px-6 h-9 text-sm font-medium"
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
          <div className="lg:hidden bg-primary border-t border-white/10 mt-4">
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
                  className="flex-1 bg-white text-primary border-white hover:bg-white/90 rounded-full h-10 text-sm font-medium"
                >
                  Login
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 bg-white text-primary border-white hover:bg-white/90 rounded-full h-10 text-sm font-medium"
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
