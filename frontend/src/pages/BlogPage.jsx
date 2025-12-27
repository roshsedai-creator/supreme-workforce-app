import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { blogPosts } from '../data/mock';

const BlogPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-[106px]">
        <div className="bg-[#703493] py-20">
          <div className="container mx-auto px-4">
            <h1 className="text-white text-4xl md:text-5xl font-bold mb-4">Insights & Updates</h1>
            <p className="text-white/80 text-lg max-w-2xl">
              Stay informed with the latest news, trends, and best practices in hospitality services.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <article key={post.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-shadow">
                <img 
                  src={post.image}
                  alt={post.title}
                  className="w-full h-[200px] object-cover"
                />
                <div className="p-6">
                  <p className="text-[#D4B37A] text-sm font-medium mb-2">
                    {post.date}
                  </p>
                  <h3 className="text-gray-900 text-lg font-bold mb-3 hover:text-[#703493] transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {post.excerpt}
                  </p>
                  <span className="text-[#703493] font-semibold text-sm hover:text-[#D4B37A] transition-colors cursor-pointer">
                    Read Article →
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BlogPage;
