import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  getPostBySlug,
  getAllPostSlugs,
  getRelatedPosts,
} from "@/utils/blogService";
import RelatedPosts from "@/components/RelatedPosts";

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: `${post.title} | Message Create Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      images: [post.thumbnail],
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [post.thumbnail],
    },
  };
}

const BlogPostPage = async ({ params }: BlogPostPageProps) => {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(post.slug, post.category);

  return (
    <article className="min-h-screen bg-white dark:bg-gray-900">
      {" "}
      {/* Hero Section */}
      <div className="relative py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-6 sm:mb-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 overflow-x-auto">
              <li className="whitespace-nowrap">
                <Link
                  href="/"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  Home
                </Link>
              </li>
              <li className="whitespace-nowrap">/</li>
              <li className="whitespace-nowrap">
                <Link
                  href="/blog"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  Blog
                </Link>
              </li>
              <li className="whitespace-nowrap">/</li>
              <li className="text-gray-900 dark:text-white truncate">
                {post.title}
              </li>
            </ol>
          </nav>
          {/* Article Header */}
          <header className="mb-8 sm:mb-12">
            <div className="mb-4 sm:mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                {post.category}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 leading-tight">
              {post.title}
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 leading-relaxed">
              {post.description}
            </p>
            {/* Article Meta */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-6 border-t border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg font-semibold">
                    {post.author.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {post.author}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(post.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium">{post.readingTime}</span>
                <div className="flex flex-wrap gap-2">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </header>{" "}
          {/* Featured Image */}
          <div className="relative mb-8 sm:mb-12 rounded-lg sm:rounded-xl overflow-hidden shadow-lg">
            <Image
              src={post.thumbnail}
              alt={post.title}
              width={1200}
              height={600}
              className="w-full h-48 sm:h-64 lg:h-96 object-cover"
              priority
            />
          </div>
        </div>
      </div>{" "}
      {/* Article Content */}
      <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div
            className="prose prose-base sm:prose-lg prose-indigo dark:prose-invert max-w-none
                       prose-headings:text-gray-900 dark:prose-headings:text-white
                       prose-p:text-gray-700 dark:prose-p:text-gray-300
                       prose-strong:text-gray-900 dark:prose-strong:text-white
                       prose-a:text-indigo-600 dark:prose-a:text-indigo-400
                       prose-a:no-underline hover:prose-a:underline
                       prose-blockquote:border-indigo-500 dark:prose-blockquote:border-indigo-400
                       prose-blockquote:text-gray-800 dark:prose-blockquote:text-gray-200
                       prose-code:text-indigo-600 dark:prose-code:text-indigo-400
                       prose-code:bg-gray-100 dark:prose-code:bg-gray-800
                       prose-pre:bg-gray-900 dark:prose-pre:bg-gray-800
                       prose-img:rounded-lg prose-img:shadow-lg"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          {/* Article Footer */}
          <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-semibold">
                    {post.author.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {post.author}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Content Writer at Message Create
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link
                  href="/blog"
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center"
                >
                  ← Back to Blog
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 text-center"
                >
                  Try Message Create
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Related Posts */}
      <RelatedPosts posts={relatedPosts} currentSlug={post.slug} />
    </article>
  );
};

export default BlogPostPage;
