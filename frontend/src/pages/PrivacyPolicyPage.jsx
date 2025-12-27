import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Shield, Lock, Eye, Database, UserCheck, FileText } from 'lucide-react';

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <section className="pt-[106px]">
        <div className="bg-[#703493] py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-white text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-white/80 text-lg">Last updated: January 2024</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-8 h-8 text-[#703493]" />
              <h2 className="text-[#703493] text-2xl font-bold m-0">Our Commitment to Privacy</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Supreme Hospitality Services is committed to protecting your privacy and ensuring the security of your personal information. This policy outlines how we collect, use, and safeguard your data.
            </p>

            <div className="bg-gray-50 p-6 rounded-xl mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-6 h-6 text-[#D4B37A]" />
                <h3 className="text-[#703493] text-xl font-bold m-0">Information We Collect</h3>
              </div>
              <ul className="text-gray-600 space-y-2 mb-0">
                <li>Personal identification information (name, email, phone number)</li>
                <li>Business information for corporate clients</li>
                <li>Employment information for job applicants</li>
                <li>Website usage data and cookies</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="w-6 h-6 text-[#D4B37A]" />
                <h3 className="text-[#703493] text-xl font-bold m-0">How We Use Your Information</h3>
              </div>
              <ul className="text-gray-600 space-y-2 mb-0">
                <li>To provide and improve our services</li>
                <li>To communicate with you about enquiries and bookings</li>
                <li>To process job applications</li>
                <li>To send relevant updates and marketing communications (with consent)</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-6 h-6 text-[#D4B37A]" />
                <h3 className="text-[#703493] text-xl font-bold m-0">Data Security</h3>
              </div>
              <p className="text-gray-600 mb-0">
                We implement industry-standard security measures to protect your personal information from unauthorized access, disclosure, or misuse. Our systems are regularly reviewed and updated to maintain the highest level of security.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl mb-8">
              <div className="flex items-center gap-3 mb-4">
                <UserCheck className="w-6 h-6 text-[#D4B37A]" />
                <h3 className="text-[#703493] text-xl font-bold m-0">Your Rights</h3>
              </div>
              <ul className="text-gray-600 space-y-2 mb-0">
                <li>Access your personal information</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Opt-out of marketing communications</li>
              </ul>
            </div>

            <div className="border-t border-gray-200 pt-6 mt-8">
              <p className="text-gray-600">
                For privacy-related enquiries, please contact us at <a href="mailto:info@supremehospitality.com.au" className="text-[#703493] font-semibold">info@supremehospitality.com.au</a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage;
