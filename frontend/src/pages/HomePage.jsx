import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Certifications from '../components/Certifications';
import About from '../components/About';
import Services from '../components/Services';
import WhyChooseUs from '../components/WhyChooseUs';
import SavingsCalculator from '../components/SavingsCalculator';
import CorporateSupport from '../components/CorporateSupport';
import SuccessMetrics from '../components/SuccessMetrics';
import PremiumStats from '../components/PremiumStats';
import Partners from '../components/Partners';
import Testimonials from '../components/Testimonials';
import BookSiteVisit from '../components/BookSiteVisit';
import PremiumCTA from '../components/PremiumCTA';
import Blog from '../components/Blog';
import JobsCTA from '../components/JobsCTA';
import Footer from '../components/Footer';
import Chatbot from '../components/Chatbot';
import ScrollProgress from '../components/ScrollProgress';
import PageLoader from '../components/PageLoader';
import SocialProof from '../components/SocialProof';

const HomePage = () => {
  return (
    <div className="min-h-screen">
      <PageLoader />
      <ScrollProgress />
      <Header />
      <main>
        <Hero />
        <Certifications />
        <About />
        <Services />
        <WhyChooseUs />
        <SavingsCalculator />
        <CorporateSupport />
        <SuccessMetrics />
        <Partners />
        <Testimonials />
        <BookSiteVisit />
        <PremiumCTA />
        <Blog />
        <JobsCTA />
      </main>
      <Footer />
      <Chatbot />
      <StickyCTA />
      <SocialProof />
    </div>
  );
};

export default HomePage;
