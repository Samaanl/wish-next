import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkHtml from "remark-html";
import remarkGfm from "remark-gfm";
import { rehype } from "rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import readingTime from "reading-time";

const postsDirectory = path.join(process.cwd(), "content/blog");

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  thumbnail: string;
  author: string;
  category: string;
  tags: string[];
  content: string;
  readingTime: string;
  featured?: boolean;
}

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  thumbnail: string;
  author: string;
  category: string;
  tags: string[];
  readingTime: string;
  featured?: boolean;
}

// Ensure blog directory exists
function ensureBlogDirectory() {
  if (!fs.existsSync(postsDirectory)) {
    fs.mkdirSync(postsDirectory, { recursive: true });
  }
}

export function getAllPostSlugs(): string[] {
  ensureBlogDirectory();
  try {
    const fileNames = fs.readdirSync(postsDirectory);
    return fileNames
      .filter((name) => name.endsWith(".md"))
      .map((name) => name.replace(/\.md$/, ""));
  } catch (error) {
    console.error("Error reading blog directory:", error);
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  ensureBlogDirectory();
  const fullPath = path.join(postsDirectory, `${slug}.md`);

  try {
    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);

    // Process markdown content
    const processedContent = await remark()
      .use(remarkGfm)
      .use(remarkHtml, { sanitize: false })
      .process(content);

    // Apply syntax highlighting
    const highlightedContent = await rehype()
      .use(rehypeRaw)
      .use(rehypeHighlight)
      .process(processedContent.toString());

    // Calculate reading time
    const stats = readingTime(content);

    return {
      slug,
      title: data.title || "",
      description: data.description || "",
      date: data.date || "",
      thumbnail: data.thumbnail || "/blog-images/default-thumbnail.jpg",
      author: data.author || "Wish Generator Team",
      category: data.category || "General",
      tags: data.tags || [],
      content: highlightedContent.toString(),
      readingTime: stats.text,
      featured: data.featured || false,
    };
  } catch (error) {
    console.error(`Error reading post ${slug}:`, error);
    return null;
  }
}

export async function getAllPosts(): Promise<BlogPostMeta[]> {
  ensureBlogDirectory();
  const slugs = getAllPostSlugs();
  const posts: BlogPostMeta[] = [];

  for (const slug of slugs) {
    try {
      const fullPath = path.join(postsDirectory, `${slug}.md`);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data, content } = matter(fileContents);

      // Calculate reading time
      const stats = readingTime(content);

      posts.push({
        slug,
        title: data.title || "",
        description: data.description || "",
        date: data.date || "",
        thumbnail: data.thumbnail || "/blog-images/default-thumbnail.jpg",
        author: data.author || "Wish Generator Team",
        category: data.category || "General",
        tags: data.tags || [],
        readingTime: stats.text,
        featured: data.featured || false,
      });
    } catch (error) {
      console.error(`Error processing post ${slug}:`, error);
    }
  }

  // Sort posts by date (newest first)
  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function getFeaturedPosts(): Promise<BlogPostMeta[]> {
  const allPosts = await getAllPosts();
  return allPosts.filter((post) => post.featured);
}

export async function getPostsByCategory(
  category: string
): Promise<BlogPostMeta[]> {
  const allPosts = await getAllPosts();
  return allPosts.filter(
    (post) => post.category.toLowerCase() === category.toLowerCase()
  );
}

export async function getRelatedPosts(
  currentSlug: string,
  category: string,
  limit: number = 3
): Promise<BlogPostMeta[]> {
  const allPosts = await getAllPosts();
  const relatedPosts = allPosts
    .filter((post) => post.slug !== currentSlug)
    .filter((post) => post.category.toLowerCase() === category.toLowerCase())
    .slice(0, limit);

  // If not enough posts in the same category, fill with other posts
  if (relatedPosts.length < limit) {
    const otherPosts = allPosts
      .filter((post) => post.slug !== currentSlug)
      .filter(
        (post) => !relatedPosts.some((related) => related.slug === post.slug)
      )
      .slice(0, limit - relatedPosts.length);

    relatedPosts.push(...otherPosts);
  }

  return relatedPosts;
}

export function getAllCategories(): string[] {
  ensureBlogDirectory();
  const slugs = getAllPostSlugs();
  const categories = new Set<string>();

  for (const slug of slugs) {
    try {
      const fullPath = path.join(postsDirectory, `${slug}.md`);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data } = matter(fileContents);

      if (data.category) {
        categories.add(data.category);
      }
    } catch (error) {
      console.error(`Error processing category for ${slug}:`, error);
    }
  }

  return Array.from(categories).sort();
}

export function getAllTags(): string[] {
  ensureBlogDirectory();
  const slugs = getAllPostSlugs();
  const tags = new Set<string>();

  for (const slug of slugs) {
    try {
      const fullPath = path.join(postsDirectory, `${slug}.md`);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data } = matter(fileContents);

      if (data.tags && Array.isArray(data.tags)) {
        data.tags.forEach((tag: string) => tags.add(tag));
      }
    } catch (error) {
      console.error(`Error processing tags for ${slug}:`, error);
    }
  }

  return Array.from(tags).sort();
}
