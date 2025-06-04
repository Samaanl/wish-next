import React from "react";
import Link from "next/link";
import { BlogPostMeta } from "@/utils/blogService";
import BlogCard from "@/components/BlogCard";

interface RelatedPostsProps {
  posts: BlogPostMeta[];
  currentSlug: string;
}

const RelatedPosts: React.FC<RelatedPostsProps> = ({ posts, currentSlug }) => {
  const relatedPosts = posts
    .filter((post) => post.slug !== currentSlug)
    .slice(0, 3);

  if (relatedPosts.length === 0) {
    return null;
  }
  return (
    <section className="mt-12 py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Related Articles
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Discover more inspiration for your special occasions
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {relatedPosts.map((post) => (
            <div key={post.slug}>
              <BlogCard post={post} />
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/blog"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
            View All Articles
          </Link>
        </div>
      </div>
    </section>
  );
};

export default RelatedPosts;
