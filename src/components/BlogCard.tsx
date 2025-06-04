import Image from "next/image";
import Link from "next/link";
import { BlogPostMeta } from "@/utils/blogService";

interface BlogCardProps {
  post: BlogPostMeta;
  featured?: boolean;
  compact?: boolean;
}

const BlogCard: React.FC<BlogCardProps> = ({
  post,
  featured = false,
  compact = false,
}) => {
  return (
    <Link href={`/blog/${post.slug}`} className="block">
      <article className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 cursor-pointer h-full flex flex-col">
        {/* Featured badge */}
        {post.featured && (
          <div className="absolute top-4 left-4 z-10">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
              Featured
            </span>
          </div>
        )}{" "}
        {/* Thumbnail */}
        <div
          className={`relative overflow-hidden ${
            compact ? "h-32 md:h-36" : featured ? "h-64 lg:h-96" : "h-48"
          }`}
        >
          <Image
            src={post.thumbnail}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes={
              featured
                ? "(max-width: 768px) 100vw, 50vw"
                : "(max-width: 768px) 100vw, 33vw"
            }
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>{" "}
        {/* Content */}
        <div
          className={`${
            compact ? "p-3 md:p-4" : featured ? "p-4 lg:p-6" : "p-4"
          } flex flex-col flex-grow`}
        >
          {/* Category and reading time */}
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
              {post.category}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {post.readingTime}
            </span>
          </div>{" "}
          {/* Title */}
          <h2
            className={`font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 ${
              compact
                ? "text-sm md:text-base"
                : featured
                  ? "text-xl lg:text-2xl"
                  : "text-lg"
            }`}
          >
            {post.title}
          </h2>{" "}
          {/* Description */}
          <p
            className={`text-gray-600 dark:text-gray-300 ${
              compact ? "mb-2 line-clamp-1" : "mb-3 line-clamp-2"
            } flex-grow ${
              compact
                ? "text-xs md:text-sm"
                : featured
                  ? "text-base"
                  : "text-sm"
            }`}
          >
            {post.description}
          </p>{" "}
          {/* Meta information */}
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center space-x-2">
              <div
                className={`${compact ? "w-4 h-4" : "w-6 h-6"} bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center`}
              >
                <span
                  className={`text-white font-semibold ${compact ? "text-xs" : "text-xs"}`}
                >
                  {post.author.charAt(0)}
                </span>
              </div>
              <div>
                <p
                  className={`font-medium text-gray-900 dark:text-white ${compact ? "text-xs" : "text-xs"}`}
                >
                  {post.author}
                </p>
                {!compact && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(post.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </div>

            {!compact && (
              <div className="inline-flex items-center text-xs font-medium text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors">
                Read
                <svg
                  className="ml-1 w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            )}
          </div>{" "}
          {/* Tags */}
          {!compact && post.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {post.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="inline-block px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
};

export default BlogCard;
