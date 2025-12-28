import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Certifications from '../components/Certifications';
import About from '../components/About';
import Services from '../components/Services';
import WhyChooseUs from '../components/WhyChooseUs';
import SuccessMetrics from '../components/SuccessMetrics';
import LeadershipTeam from '../components/LeadershipTeam';
import ClientLogoCarousel from '../components/ClientLogoCarousel';
import Testimonials from '../components/Testimonials';
import SavingsCalculator from '../components/SavingsCalculator';
import CorporateSupport from '../components/CorporateSupport';
import FAQ from '../components/FAQ';
import BookSiteVisit from '../components/BookSiteVisit';
import Blog from '../components/Blog';
import JobsCTA from '../components/JobsCTA';
import Footer from '../components/Footer';
import Chatbot from '../components/Chatbot';
import ScrollProgress from '../components/ScrollProgress';
import PageLoader from '../components/PageLoader';
import SocialProof from '../components/SocialProof';
import BackToTop from '../components/BackToTop';

const HomePage = () => {
  return (
    <div className="min-h-screen">
      <PageLoader />
      <ScrollProgress />
      <Header />
      <main>
        {/* Hero - First Impression */}
        <Hero />
        
        {/* Trust Signals - Certifications */}
        <Certifications />
        
        {/* About Us - Who We Are */}
        <About />
        
        {/* Services - What We Offer */}
        <Services />
        
        {/* Why Choose Us - Our Differentiators */}
        <WhyChooseUs />
        
        {/* Success Metrics - Proof of Results */}
        <SuccessMetrics />
        
        {/* Client Logos - Social Proof */}
        <ClientLogoCarousel />
        
        {/* Testimonials - Customer Stories */}
        <Testimonials />
        
        {/* Leadership Team - Meet the Experts */}
        <LeadershipTeam />
        
        {/* Savings Calculator - Value Proposition */}
        <SavingsCalculator />
        
        {/* Corporate Support - Partnership */}
        <CorporateSupport />
        
        {/* FAQ - Address Concerns */}
        <FAQ />
        
        {/* Book Site Visit - Conversion */}
        <BookSiteVisit />
        
        {/* Blog/Insights - Thought Leadership */}
        <Blog />
        
        {/* Careers CTA - Recruitment */}
        <JobsCTA />
      </main>
      <Footer />
      <Chatbot />
      <SocialProof />
      <WhatsAppButton />
      <BackToTop />
    </div>
  );
};

export default HomePage;
