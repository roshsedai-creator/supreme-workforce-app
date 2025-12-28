import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Certifications from '../components/Certifications';
import About from '../components/About';
import Services from '../components/Services';
import WhyChooseUs from '../components/WhyChooseUs';
import LeadershipTeam from '../components/LeadershipTeam';
import SavingsCalculator from '../components/SavingsCalculator';
import CorporateSupport from '../components/CorporateSupport';
import SuccessMetrics from '../components/SuccessMetrics';
import ClientLogoCarousel from '../components/ClientLogoCarousel';
import Testimonials from '../components/Testimonials';
import FAQ from '../components/FAQ';
import BookSiteVisit from '../components/BookSiteVisit';
import PremiumCTA from '../components/PremiumCTA';
import Blog from '../components/Blog';
import JobsCTA from '../components/JobsCTA';
import Footer from '../components/Footer';
import Chatbot from '../components/Chatbot';
import ScrollProgress from '../components/ScrollProgress';
import PageLoader from '../components/PageLoader';
import SocialProof from '../components/SocialProof';
import WhatsAppButton from '../components/WhatsAppButton';
import BackToTop from '../components/BackToTop';

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
        <LeadershipTeam />
        <SavingsCalculator />
        <CorporateSupport />
        <SuccessMetrics />
        <ClientLogoCarousel />
        <Testimonials />
        <FAQ />
        <BookSiteVisit />
        <PremiumCTA />
        <Blog />
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
