import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      question: "What services does Supreme Hospitality provide?",
      answer: "We offer comprehensive hospitality services including Hotel & Resort Housekeeping, Commercial Cleaning, Facility Management, Labour Hire Solutions, Kitchen Stewarding, and specialized cleaning services. All services are tailored to meet your specific property needs."
    },
    {
      question: "How quickly can you start servicing our property?",
      answer: "We can typically begin services within 48-72 hours of contract signing. For urgent requirements, we offer emergency staffing solutions that can be deployed within 24 hours. Contact us for a rapid response assessment."
    },
    {
      question: "Are your staff trained and certified?",
      answer: "Yes, all our team members undergo rigorous training through our in-house academy. They are ISSA certified, hold valid working rights, and complete background checks. We also provide ongoing training to ensure the highest standards."
    },
    {
      question: "What areas do you service?",
      answer: "We currently service properties across Melbourne, Sydney, Brisbane, and surrounding areas. We're continuously expanding our reach across Australia. Contact us to check availability in your area."
    },
    {
      question: "How do you ensure quality and consistency?",
      answer: "We implement strict quality assurance protocols including regular inspections, client feedback systems, and dedicated account managers. Our ISO 9001 certified processes ensure consistent service delivery every time."
    },
    {
      question: "What is your pricing structure?",
      answer: "Our pricing is customized based on your property size, service requirements, and frequency. We offer competitive rates with no hidden fees. Request a free quote for a detailed breakdown tailored to your needs."
    },
    {
      question: "Do you provide eco-friendly cleaning options?",
      answer: "Absolutely! We're committed to sustainability. We use commercial-grade, eco-friendly products that are effective yet gentle on the environment. Green cleaning practices are standard across all our services."
    },
    {
      question: "What happens if we're not satisfied with the service?",
      answer: "Your satisfaction is our priority. We have a 100% satisfaction guarantee. If any issue arises, our team will address it immediately at no extra cost. We also conduct regular reviews to ensure ongoing quality."
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-[#D4B37A] font-semibold uppercase tracking-wider text-sm">Got Questions?</span>
          <h2 className="text-[#703493] text-3xl md:text-4xl font-bold mt-2 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about our services, processes, and how we can help your property shine.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className={`border-2 rounded-xl overflow-hidden transition-all duration-300 ${
                openIndex === index 
                  ? 'border-[#703493] shadow-lg' 
                  : 'border-gray-200 hover:border-[#D4B37A]'
              }`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-gray-50 transition-colors"
              >
                <span className={`font-semibold pr-4 ${
                  openIndex === index ? 'text-[#703493]' : 'text-gray-800'
                }`}>
                  {faq.question}
                </span>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  openIndex === index 
                    ? 'bg-[#703493] text-white rotate-180' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <ChevronDown className="w-5 h-5" />
                </div>
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ${
                openIndex === index ? 'max-h-96' : 'max-h-0'
              }`}>
                <div className="p-5 pt-0 text-gray-600 leading-relaxed border-t border-gray-100">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">Still have questions?</p>
          <a 
            href="/contact" 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#703493] to-[#8a4aad] text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            Contact Our Team
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
