import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Certifications from '../components/Certifications';
import About from '../components/About';
import Services from '../components/Services';
import WhyChooseUs from '../components/WhyChooseUs';
import CorporateSupport from '../components/CorporateSupport';
import PremiumStats from '../components/PremiumStats';
import Partners from '../components/Partners';
import Testimonials from '../components/Testimonials';
import PremiumCTA from '../components/PremiumCTA';
import Blog from '../components/Blog';
import JobsCTA from '../components/JobsCTA';
import Footer from '../components/Footer';
import Chatbot from '../components/Chatbot';

const HomePage = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Certifications />
        <About />
        <Services />
        <WhyChooseUs />
        <CorporateSupport />
        <PremiumStats />
        <Partners />
        <Testimonials />
        <PremiumCTA />
        <Blog />
        <JobsCTA />
      </main>
      <Footer />
      <Chatbot />
    </div>
  );
};

export default HomePage;
