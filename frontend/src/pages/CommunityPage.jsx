import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Heart, Users, Home, GraduationCap, Leaf, HandHeart } from 'lucide-react';

const CommunityPage = () => {
  const initiatives = [
    { 
      icon: HandHeart, 
      title: "Charity Partnerships", 
      description: "We partner with local charities to support those in need through donations, volunteering, and fundraising events.",
      image: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&q=80"
    },
    { 
      icon: GraduationCap, 
      title: "Youth Employment Program", 
      description: "Providing training and employment opportunities for young Australians entering the workforce.",
      image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&q=80"
    },
    { 
      icon: Home, 
      title: "Homelessness Support", 
      description: "Working with shelters and organizations to provide cleaning services and supplies to homeless shelters.",
      image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=600&q=80"
    },
    { 
      icon: Leaf, 
      title: "Environmental Initiatives", 
      description: "Community clean-up events and environmental education programs in local areas.",
      image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&q=80"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <section className="pt-[106px]">
        <div className="bg-[#703493] py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-white text-4xl md:text-5xl font-bold mb-4">Community Initiatives</h1>
            <p className="text-white/80 text-lg max-w-2xl">Making a positive impact in the communities where we live and work.</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Heart className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-[#703493] text-3xl font-bold mb-4">Giving Back</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                At Supreme Hospitality Services, we believe in the power of community. We're committed to making a positive difference through various initiatives that support and uplift those around us.
              </p>
            </div>

            <div className="space-y-12">
              {initiatives.map((initiative, index) => (
                <div key={index} className={`grid md:grid-cols-2 gap-8 items-center ${index % 2 === 1 ? '' : ''}`}>
                  <div className={index % 2 === 1 ? 'md:order-2' : ''}>
                    <img 
                      src={initiative.image} 
                      alt={initiative.title}
                      className="w-full h-[280px] object-cover rounded-xl shadow-lg"
                    />
                  </div>
                  <div className={index % 2 === 1 ? 'md:order-1' : ''}>
                    <div className="flex items-center gap-3 mb-4">
                      <initiative.icon className="w-10 h-10 text-[#D4B37A]" />
                      <h3 className="text-[#703493] text-2xl font-bold">{initiative.title}</h3>
                    </div>
                    <p className="text-gray-600 mb-4">{initiative.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 bg-[#D4B37A]/20 p-8 rounded-xl text-center border border-[#D4B37A]">
              <h3 className="text-[#703493] text-2xl font-bold mb-4">Get Involved</h3>
              <p className="text-gray-700 mb-6">
                Want to partner with us on community initiatives or learn more about our programs? We'd love to hear from you.
              </p>
              <Link to="/contact">
                <Button className="bg-[#703493] text-white hover:bg-[#5a2a76] rounded-md px-8 py-5">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CommunityPage;
