import React from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { blogPosts } from '../data/mock';
import { ArrowLeft, Calendar, User, Share2, Facebook, Linkedin, Twitter } from 'lucide-react';

const BlogArticlePage = () => {
  const { id } = useParams();
  const article = blogPosts.find(post => post.id === parseInt(id)) || blogPosts[0];

  const relatedPosts = blogPosts.filter(post => post.id !== article.id).slice(0, 2);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <section className="pt-[106px]">
        <div className="bg-[#703493] py-16">
          <div className="container mx-auto px-4">
            <Link to="/blog" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4" /> Back to Insights
            </Link>
            <h1 className="text-white text-3xl md:text-4xl font-bold mb-4 max-w-4xl">{article.title}</h1>
            <div className="flex items-center gap-6 text-white/80">
              <span className="flex items-center gap-2">
                <User className="w-4 h-4" /> {article.author}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" /> {article.date}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <img 
              src={article.image}
              alt={article.title}
              className="w-full h-[400px] object-cover rounded-xl mb-8"
            />

            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                {article.excerpt}
              </p>
              
              <h2 className="text-[#703493] text-2xl font-bold mt-8 mb-4">Introduction</h2>
              <p className="text-gray-600 mb-4">
                In the fast-paced world of hospitality, maintaining exceptional standards while managing operational efficiency is a constant challenge. At Supreme Hospitality Services, we understand these challenges and have developed comprehensive solutions that address the unique needs of each industry we serve.
              </p>

              <h2 className="text-[#703493] text-2xl font-bold mt-8 mb-4">Key Insights</h2>
              <p className="text-gray-600 mb-4">
                Our approach focuses on three core pillars: quality, consistency, and people. By investing in our team members and providing them with the tools and training they need, we ensure that every service we deliver meets the highest standards.
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                <li>Comprehensive training programs for all team members</li>
                <li>Regular quality audits and feedback systems</li>
                <li>Investment in modern equipment and sustainable practices</li>
                <li>24/7 support for our clients across all locations</li>
              </ul>

              <h2 className="text-[#703493] text-2xl font-bold mt-8 mb-4">Looking Ahead</h2>
              <p className="text-gray-600 mb-4">
                As we continue to grow and evolve, our commitment to excellence remains unwavering. We're constantly exploring new ways to improve our services, adopt sustainable practices, and support both our clients and team members in achieving their goals.
              </p>

              <div className="bg-gray-50 p-6 rounded-xl mt-8">
                <p className="text-gray-700 italic">
                  "At Supreme, we believe that exceptional service starts with exceptional people. Our investment in training and development is what sets us apart in the industry."
                </p>
                <p className="text-[#703493] font-semibold mt-2">- Supreme Hospitality Services Leadership Team</p>
              </div>
            </div>

            {/* Share */}
            <div className="border-t border-gray-200 mt-10 pt-6">
              <div className="flex items-center gap-4">
                <span className="text-gray-600 font-medium flex items-center gap-2">
                  <Share2 className="w-4 h-4" /> Share this article:
                </span>
                <div className="flex gap-2">
                  <a href="#" className="w-10 h-10 bg-[#3b5998] text-white rounded-full flex items-center justify-center hover:opacity-80">
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a href="#" className="w-10 h-10 bg-[#0077b5] text-white rounded-full flex items-center justify-center hover:opacity-80">
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a href="#" className="w-10 h-10 bg-[#1da1f2] text-white rounded-full flex items-center justify-center hover:opacity-80">
                    <Twitter className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Articles */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-[#703493] text-2xl font-bold mb-8 text-center">Related Articles</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {relatedPosts.map((post) => (
              <Link key={post.id} to={`/blog/${post.id}`} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                <img src={post.image} alt={post.title} className="w-full h-[180px] object-cover" />
                <div className="p-6">
                  <p className="text-[#D4B37A] text-sm font-medium mb-2">{post.date}</p>
                  <h3 className="text-gray-900 font-bold hover:text-[#703493] transition-colors">{post.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BlogArticlePage;
