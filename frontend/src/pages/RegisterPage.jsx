import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { CheckCircle, Building2, Users } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [accountType, setAccountType] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    console.log('Registration:', { accountType, ...formData });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <section className="pt-[106px]">
          <div className="bg-[#703493] py-20">
            <div className="container mx-auto px-4 text-center">
              <CheckCircle className="w-20 h-20 text-[#D4B37A] mx-auto mb-6" />
              <h1 className="text-white text-4xl md:text-5xl font-bold mb-4">Registration Successful!</h1>
              <p className="text-white/80 text-lg max-w-2xl mx-auto">
                Thank you for registering. We've sent a confirmation email to {formData.email}. Our team will review your application and activate your account within 24 hours.
              </p>
            </div>
          </div>
          <div className="py-16 text-center">
            <Button onClick={() => navigate('/')} className="bg-[#703493] text-white hover:bg-[#5a2a76] rounded-md px-8 py-5">
              Return to Home
            </Button>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  if (!accountType) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <section className="pt-[106px]">
          <div className="bg-[#703493] py-16">
            <div className="container mx-auto px-4">
              <h1 className="text-white text-4xl md:text-5xl font-bold mb-4">Register</h1>
              <p className="text-white/80 text-lg">Create your account to access our services</p>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-[#703493] text-2xl font-bold text-center mb-8">Select Account Type</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <button 
                onClick={() => setAccountType('client')}
                className="bg-gray-50 border-2 border-gray-200 rounded-xl p-8 hover:border-[#D4B37A] hover:shadow-lg transition-all text-left"
              >
                <Building2 className="w-12 h-12 text-[#703493] mb-4" />
                <h3 className="text-xl font-bold text-[#703493] mb-2">Business / Client</h3>
                <p className="text-gray-600">Register as a business looking to engage our hospitality services</p>
              </button>
              <button 
                onClick={() => setAccountType('jobseeker')}
                className="bg-gray-50 border-2 border-gray-200 rounded-xl p-8 hover:border-[#D4B37A] hover:shadow-lg transition-all text-left"
              >
                <Users className="w-12 h-12 text-[#703493] mb-4" />
                <h3 className="text-xl font-bold text-[#703493] mb-2">Job Seeker</h3>
                <p className="text-gray-600">Register to apply for career opportunities at Supreme</p>
              </button>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <section className="pt-[106px]">
        <div className="bg-[#703493] py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-white text-4xl md:text-5xl font-bold mb-4">
              {accountType === 'client' ? 'Business Registration' : 'Job Seeker Registration'}
            </h1>
            <p className="text-white/80 text-lg">Complete the form below to create your account</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <button onClick={() => setAccountType('')} className="text-[#703493] mb-6 hover:underline">
            ← Back to account type selection
          </button>
          
          <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                <Input required value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                <Input required value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <Input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                <Input type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>
              {accountType === 'client' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                    <Input required value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                    <Input value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <Input type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                <Input type="password" required value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} />
              </div>
            </div>

            <div className="mt-8">
              <Button type="submit" className="bg-[#703493] text-white hover:bg-[#5a2a76] rounded-md px-8 py-5 w-full">
                Create Account
              </Button>
            </div>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RegisterPage;
