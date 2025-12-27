import React from 'react';
import { Link } from 'react-router-dom';
import { blogPosts } from '../data/mock';

const Blog = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-[#703493] text-3xl md:text-4xl font-bold text-center mb-4">
          Insights & Updates
        </h2>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Stay informed with the latest news, trends, and best practices in hospitality services.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <article key={post.id} className="group cursor-pointer bg-gray-50 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
              <div className="overflow-hidden">
                <img 
                  src={post.image}
                  alt={post.title}
                  className="w-full h-[200px] object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="p-6">
                <p className="text-[#D4B37A] text-sm font-medium mb-2">
                  {post.date}
                </p>
                <h3 className="text-gray-900 text-lg font-bold mb-3 group-hover:text-[#703493] transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                  {post.excerpt}
                </p>
                <span className="text-[#703493] font-semibold text-sm hover:text-[#D4B37A] transition-colors">
                  Read Article →
                </span>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link 
            to="/blog"
            className="inline-block bg-[#703493] text-white px-8 py-3 rounded-md font-semibold hover:bg-[#5a2a76] transition-colors"
          >
            View All Articles
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Blog;
