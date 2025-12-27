import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Users, Award, Shield, Heart, Target, Clock, CheckCircle, Star, Handshake, Sparkles } from 'lucide-react';
import { companyInfo } from '../data/mock';

const AboutPage = () => {
  const values = [
    { icon: Heart, title: "People First", description: "Every team member is family. We celebrate their successes, support their challenges, and invest in their futures. When our people thrive, excellence follows naturally." },
    { icon: Award, title: "Unwavering Excellence", description: "Good enough is never enough. We hold ourselves to the highest standards because your guests deserve nothing less than perfection." },
    { icon: Shield, title: "Trust & Integrity", description: "Your property is your livelihood. We treat every space as if it were our own, with honesty and transparency in everything we do." },
    { icon: Handshake, title: "True Partnership", description: "We don't just provide a service—we become an extension of your team. Your success is our success, and we're committed to helping you achieve it." },
    { icon: Target, title: "Reliable Consistency", description: "Whether it's day one or day one thousand, you can count on the same exceptional quality. That's our promise." },
    { icon: Sparkles, title: "Continuous Improvement", description: "We're never satisfied with yesterday's standards. We constantly evolve, innovate, and raise the bar for what hospitality service can be." }
  ];

  const milestones = [
    { year: "2020", title: "A Dream Takes Shape", description: "Founded in Melbourne with just 12 passionate team members and a vision to revolutionise hospitality services in Australia." },
    { year: "2021", title: "Growing Together", description: "Expanded to Sydney and Brisbane, welcoming 200+ new team members into the Supreme family." },
    { year: "2022", title: "Building Trust", description: "Partnered with Accor Hotels and Quest Apartments, proving that quality service opens doors." },
    { year: "2023", title: "Investing in Our People", description: "Launched our comprehensive training academy, ensuring every team member has the skills to excel." },
    { year: "2024", title: "Leading the Industry", description: "Now 500+ strong, serving 20+ prestigious clients and delivering 700+ service hours—and we're just getting started." }
  ];

  const stats = [
    { number: "500+", label: "Dedicated Team Members", description: "Each one trained, valued, and committed to excellence" },
    { number: "20+", label: "Trusted Partners", description: "From boutique hotels to international chains" },
    { number: "700+", label: "Service Hours Delivered", description: "Every hour, consistently exceptional" },
    { number: "24/7", label: "Always Available", description: "Because hospitality never sleeps" }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-[106px]">
        <div className="relative bg-[#703493] py-24 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}}></div>
          </div>
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl">
              <span className="text-[#D4B37A] font-semibold uppercase tracking-wider text-sm">Our Story</span>
              <h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-6 mt-2">
                More Than a Service.<br/>
                <span className="text-[#D4B37A]">A Promise.</span>
              </h1>
              <p className="text-white/90 text-lg md:text-xl leading-relaxed">
                Behind every perfectly made bed, every spotless lobby, and every satisfied guest is a team of dedicated professionals who take pride in their craft. We're Supreme Hospitality Services, and we believe that exceptional service starts with exceptional people.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Why Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <span className="text-[#D4B37A] font-semibold uppercase tracking-wider text-sm">Why We Exist</span>
            <h2 className="text-[#703493] text-3xl md:text-4xl font-bold mt-2 mb-8">Because Every Guest Deserves to Feel Special</h2>
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              We understand that in hospitality, the small details make the biggest difference. The way a towel is folded. The fresh scent of a pristine room. The confidence of knowing every corner has been cared for. These moments don't just happen—they're created by people who genuinely care.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              That's why we built Supreme Hospitality Services on a simple belief: <strong className="text-[#703493]">when you take care of your people, they take care of everything else.</strong> Our team members aren't just employees—they're hospitality professionals who take immense pride in their work.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              When your guests walk into a room serviced by Supreme, they don't just see cleanliness—they feel welcome. They feel valued. They feel at home. And that's exactly how we want you to feel working with us.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-[#703493]">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-[#D4B37A] text-5xl md:text-6xl font-bold mb-2">{stat.number}</div>
                <div className="text-white text-lg font-semibold mb-1">{stat.label}</div>
                <div className="text-white/70 text-sm">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Managing Director Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
              <div className="relative">
                <img 
                  src={companyInfo.mdPhoto}
                  alt="Managing Director"
                  className="w-[350px] h-[450px] object-contain rounded-xl shadow-2xl bg-gray-100"
                />
                <div className="absolute -bottom-4 -right-4 bg-[#D4B37A] text-[#703493] px-6 py-3 rounded-lg shadow-lg">
                  <p className="font-bold">Founder & Managing Director</p>
                </div>
              </div>
            </div>
            <div>
              <span className="text-[#D4B37A] font-semibold uppercase tracking-wider text-sm">Leadership with Heart</span>
              <h2 className="text-[#703493] text-3xl md:text-4xl font-bold mb-6 mt-2">A Personal Message from Our Founder</h2>
              <p className="text-gray-700 mb-4 text-lg leading-relaxed">
                "When I started Supreme in 2020, many people thought I was crazy. 'Starting a hospitality business during uncertain times?' they said. But I saw something others didn't—I saw an opportunity to do things differently."
              </p>
              <p className="text-gray-700 mb-4 leading-relaxed">
                "For too long, I watched talented housekeepers and cleaning professionals being treated as replaceable. I saw the toll it took on service quality, on staff morale, on everything. I knew there had to be a better way."
              </p>
              <p className="text-gray-700 mb-4 leading-relaxed">
                "So I built Supreme on a radical idea: what if we treated every team member like the professional they are? What if we invested in their training, celebrated their achievements, and created genuine career paths? What if we built a company where people actually wanted to come to work?"
              </p>
              <p className="text-gray-700 mb-6 leading-relaxed">
                "The results speak for themselves. Our retention rates are industry-leading. Our clients—from Accor to Quest to boutique hotels—keep coming back. And most importantly, our team members are proud to wear the Supreme uniform."
              </p>
              <div className="bg-[#703493]/5 p-6 rounded-xl border-l-4 border-[#D4B37A]">
                <p className="italic text-[#703493] text-lg mb-4">
                  "Every property we service isn't just a contract—it's a relationship built on trust, respect, and a shared commitment to excellence. Thank you for considering Supreme. We won't let you down."
                </p>
                <p className="text-gray-600 font-semibold">— Managing Director, Supreme Hospitality Services</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Journey Timeline */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-[#D4B37A] font-semibold uppercase tracking-wider text-sm">Our Journey</span>
            <h2 className="text-[#703493] text-3xl md:text-4xl font-bold mt-2">From Humble Beginnings to Industry Leaders</h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">Every milestone represents not just growth, but lives changed—team members empowered, clients delighted, and standards raised.</p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex gap-6 items-start group">
                  <div className="flex-shrink-0 w-24 h-24 bg-gradient-to-br from-[#703493] to-[#5a2a76] text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg group-hover:scale-105 transition-transform">
                    {milestone.year}
                  </div>
                  <div className="pt-2 flex-1">
                    <h3 className="text-[#703493] text-xl font-bold mb-2">{milestone.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-[#D4B37A] font-semibold uppercase tracking-wider text-sm">Our Values</span>
            <h2 className="text-[#703493] text-3xl md:text-4xl font-bold mt-2">The Principles That Guide Everything We Do</h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">These aren't just words on a wall. They're commitments we make to every client, every team member, and every guest we serve.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-14 h-14 bg-gradient-to-br from-[#703493] to-[#5a2a76] rounded-xl flex items-center justify-center mb-5">
                  <value.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-[#703493] text-xl font-bold mb-3">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Sets Us Apart */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-[#D4B37A] font-semibold uppercase tracking-wider text-sm">The Supreme Difference</span>
              <h2 className="text-[#703493] text-3xl md:text-4xl font-bold mt-2 mb-6">Why Leading Brands Choose Supreme</h2>
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <CheckCircle className="w-6 h-6 text-[#D4B37A] flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-[#703493] font-semibold mb-1">Rigorous Training Programs</h4>
                    <p className="text-gray-600">Every team member completes our comprehensive training academy before they ever step foot in your property.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <CheckCircle className="w-6 h-6 text-[#D4B37A] flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-[#703493] font-semibold mb-1">Consistent Quality Assurance</h4>
                    <p className="text-gray-600">Regular inspections, feedback loops, and continuous improvement ensure standards never slip.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <CheckCircle className="w-6 h-6 text-[#D4B37A] flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-[#703493] font-semibold mb-1">Dedicated Account Management</h4>
                    <p className="text-gray-600">A single point of contact who knows your property, understands your needs, and is always available.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <CheckCircle className="w-6 h-6 text-[#D4B37A] flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-[#703493] font-semibold mb-1">Flexible, Scalable Solutions</h4>
                    <p className="text-gray-600">From daily housekeeping to event support, we adapt to your needs—not the other way around.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <CheckCircle className="w-6 h-6 text-[#D4B37A] flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-[#703493] font-semibold mb-1">Industry-Leading Retention</h4>
                    <p className="text-gray-600">Happy team members deliver better service. Our staff retention rates are among the highest in the industry.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#703493] rounded-2xl p-8 text-white">
              <Star className="w-12 h-12 text-[#D4B37A] mb-6" />
              <h3 className="text-2xl font-bold mb-4">Our Promise to You</h3>
              <p className="text-white/90 leading-relaxed mb-6">
                "We understand that choosing a hospitality services partner is a significant decision. Your reputation is on the line with every guest interaction, every room turnover, every detail."
              </p>
              <p className="text-white/90 leading-relaxed mb-6">
                "That's why we don't take your trust lightly. When you partner with Supreme, you're not just getting a service provider—you're getting a team that will treat your property with the same care and dedication as if it were our own."
              </p>
              <p className="text-white/90 leading-relaxed">
                "We may not be the cheapest option, but we are the best value. Because the cost of poor service—lost guests, damaged reputation, constant headaches—far outweighs the investment in getting it right."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-[#D4B37A] to-[#c9a86c]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-[#703493] text-3xl md:text-4xl font-bold mb-4">Ready to Experience the Supreme Difference?</h2>
          <p className="text-[#703493]/80 mb-8 max-w-2xl mx-auto text-lg">
            Let's start a conversation. No pressure, no obligations—just an honest discussion about how we can help elevate your property's service standards.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/quote">
              <Button className="bg-[#703493] text-white hover:bg-[#5a2a76] rounded-md px-8 py-6 text-base font-semibold">
                Request a Quote
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" className="bg-transparent text-[#703493] border-2 border-[#703493] hover:bg-[#703493] hover:text-white rounded-md px-8 py-6 text-base font-semibold">
                Get in Touch
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
