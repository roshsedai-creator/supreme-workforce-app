import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import About from '../components/About';
import Services from '../components/Services';
import CorporateSupport from '../components/CorporateSupport';
import Stats from '../components/Stats';
import Partners from '../components/Partners';
import Testimonials from '../components/Testimonials';
import Blog from '../components/Blog';
import JobsCTA from '../components/JobsCTA';
import Footer from '../components/Footer';

const HomePage = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <About />
        <Services />
        <CorporateSupport />
        <Stats />
        <Partners />
        <Testimonials />
        <Blog />
        <JobsCTA />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
