import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, getFeaturedPosts } from "@/utils/blogService";
import BlogCard from "@/components/BlogCard";

export const metadata: Metadata = {
  title: "Blog - Wish Generator",
  description:
    "Tips, ideas, and inspiration for creating the perfect wishes for every occasion.",
};

const BlogPage = async () => {
  const [allPosts, featuredPosts] = await Promise.all([
    getAllPosts(),
    getFeaturedPosts(),
  ]);

  const hasPosts = allPosts.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Wish Generator Blog
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Tips, inspiration, and guides for creating meaningful wishes for
            every special occasion.
          </p>
        </div>

        {hasPosts ? (
          <>
            {/* Featured Posts */}
            {featuredPosts.length > 0 && (
              <section className="mb-16">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                  Featured Articles
                </h2>
                <div className="grid lg:grid-cols-3 gap-8">
                  {featuredPosts.map((post, index) => (
                    <BlogCard
                      key={post.slug}
                      post={post}
                      featured={index === 0}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* All Posts */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                All Articles
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {allPosts.map((post) => (
                  <BlogCard key={post.slug} post={post} />
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            {/* Coming Soon Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 md:p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mb-8">
                <svg
                  className="h-10 w-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </div>

              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Blog Content Coming Soon!
              </h2>

              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                We're working on bringing you valuable content about wish
                writing, occasion planning, and tips for making every message
                special.
              </p>

              {/* Placeholder Blog Topics */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4">
                    🎂
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Birthday Wish Ideas
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Creative and heartfelt birthday message inspiration for all
                    ages.
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                    💕
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Anniversary Messages
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Romantic and meaningful anniversary wishes that touch the
                    heart.
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                    🎄
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Holiday Greetings
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Seasonal wishes for Christmas, New Year, and special
                    holidays.
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mb-4">
                    🎓
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Graduation Wishes
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Inspiring messages for academic achievements and new
                    beginnings.
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4">
                    👋
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Farewell Messages
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Thoughtful goodbye wishes for colleagues, friends, and loved
                    ones.
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900 rounded-lg flex items-center justify-center mb-4">
                    ✨
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Writing Tips
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Expert advice on crafting personalized and memorable
                    messages.
                  </p>
                </div>
              </div>

              {/* Call to Action */}
              <div className="mt-12 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Start Creating Amazing Wishes Today
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Don't wait for the blog - you can start creating beautiful,
                  personalized wishes right now!
                </p>
                <Link
                  href="/"
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Generate Your First Wish
                </Link>
              </div>
            </div>

            {/* Newsletter Signup Placeholder */}
            <div className="mt-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Stay Updated
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Be the first to know when we launch our blog with automated
                content and writing tips.
              </p>
              <div className="max-w-md mx-auto">
                <div className="flex">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                  <button className="px-6 py-3 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700 transition-colors">
                    Notify Me
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BlogPage;
