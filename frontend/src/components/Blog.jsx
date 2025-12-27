import React from 'react';
import { Link } from 'react-router-dom';
import { blogPosts } from '../data/mock';

const Blog = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-primary text-3xl md:text-4xl font-semibold text-center mb-12">
          Read Our Blogs
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <article key={post.id} className="group cursor-pointer">
              <div className="overflow-hidden rounded-lg mb-4">
                <img 
                  src={post.image}
                  alt={post.title}
                  className="w-full h-[200px] object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <h3 className="text-gray-900 text-lg font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {post.title}
              </h3>
              <p className="text-gray-500 text-sm mb-3">
                By {post.author} • {post.date}
              </p>
              <p className="text-gray-600 text-sm line-clamp-3">
                {post.excerpt}
              </p>
            </article>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link 
            to="/blog"
            className="text-primary font-medium hover:underline"
          >
            Show More
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Blog;
