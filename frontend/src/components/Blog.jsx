import React from 'react';
import { Link } from 'react-router-dom';
import { blogPosts } from '../data/mock';
import { ArrowRight, Calendar } from 'lucide-react';

const Blog = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <span className="text-[#D4B37A] font-semibold uppercase tracking-widest text-sm">Latest News</span>
          <h2 className="text-[#703493] text-3xl md:text-4xl font-bold mt-3 mb-4">
            Insights & Updates
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Stay informed with the latest trends, best practices, and news from the hospitality services industry.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <article key={post.id} className="group bg-gray-50 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
              <Link to={`/blog/${post.id}`}>
                <div className="overflow-hidden">
                  <img 
                    src={post.image}
                    alt={post.title}
                    className="w-full h-[220px] object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
              </Link>
              <div className="p-6">
                <div className="flex items-center gap-2 text-[#D4B37A] text-sm font-medium mb-3">
                  <Calendar className="w-4 h-4" />
                  {post.date}
                </div>
                <Link to={`/blog/${post.id}`}>
                  <h3 className="text-gray-900 text-lg font-bold mb-3 group-hover:text-[#703493] transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                </Link>
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                  {post.excerpt}
                </p>
                <Link 
                  to={`/blog/${post.id}`}
                  className="inline-flex items-center gap-2 text-[#703493] font-semibold text-sm hover:text-[#D4B37A] transition-colors"
                >
                  Read Article <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link 
            to="/blog"
            className="inline-flex items-center gap-2 bg-[#703493] text-white px-8 py-4 rounded-md font-semibold hover:bg-[#5a2a76] transition-colors"
          >
            View All Articles <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Blog;
