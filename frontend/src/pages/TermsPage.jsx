import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FileText, CheckSquare, AlertCircle, Scale } from 'lucide-react';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <section className="pt-[106px]">
        <div className="bg-[#703493] py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-white text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-white/80 text-lg">Last updated: January 2024</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <div className="bg-gray-50 p-6 rounded-xl mb-8">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-[#703493]" />
                <h2 className="text-[#703493] text-xl font-bold m-0">1. Agreement to Terms</h2>
              </div>
              <p className="text-gray-600 mb-0">
                By accessing or using Supreme Hospitality Services' website and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl mb-8">
              <div className="flex items-center gap-3 mb-4">
                <CheckSquare className="w-6 h-6 text-[#703493]" />
                <h2 className="text-[#703493] text-xl font-bold m-0">2. Services</h2>
              </div>
              <p className="text-gray-600 mb-4">Supreme Hospitality Services provides:</p>
              <ul className="text-gray-600 space-y-2 mb-0">
                <li>Hospitality housekeeping services</li>
                <li>Commercial cleaning services</li>
                <li>Facility management solutions</li>
                <li>Student accommodation cleaning</li>
                <li>Healthcare facility support</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Scale className="w-6 h-6 text-[#703493]" />
                <h2 className="text-[#703493] text-xl font-bold m-0">3. Client Responsibilities</h2>
              </div>
              <ul className="text-gray-600 space-y-2 mb-0">
                <li>Provide accurate information when requesting services</li>
                <li>Ensure safe access to service locations</li>
                <li>Comply with payment terms as agreed</li>
                <li>Communicate any special requirements or concerns</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl mb-8">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-[#703493]" />
                <h2 className="text-[#703493] text-xl font-bold m-0">4. Limitation of Liability</h2>
              </div>
              <p className="text-gray-600 mb-0">
                Supreme Hospitality Services shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our services. Our liability is limited to the fees paid for the specific services provided.
              </p>
            </div>

            <div className="border-t border-gray-200 pt-6 mt-8">
              <p className="text-gray-600">
                For questions about these terms, please contact us at <a href="mailto:info@supremehospitality.com.au" className="text-[#703493] font-semibold">info@supremehospitality.com.au</a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TermsPage;
