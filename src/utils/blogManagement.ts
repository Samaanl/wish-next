import fs from "fs";
import path from "path";
import { getAllPosts, getAllCategories, getAllTags } from "@/utils/blogService";

/**
 * Blog management utilities for automated content generation
 */

// Template for new blog posts
export const BLOG_POST_TEMPLATE = `---
title: "Your Blog Post Title Here"
description: "A compelling description that will appear in search results and social shares."
date: "${new Date().toISOString().split("T")[0]}"
thumbnail: "/blog-images/your-thumbnail.jpg"
author: "Your Name"
category: "General"
tags: ["tag1", "tag2", "tag3"]
featured: false
---

# Your Blog Post Title Here

Your engaging introduction paragraph goes here. This should hook the reader and give them a reason to continue reading.

![Descriptive alt text for your image](/blog-images/your-content-image.jpg)

## Main Section 1

Your content here...

### Subsection

More detailed content...

## Main Section 2

Continue your article...

## Conclusion

Wrap up your article with key takeaways and a call to action.

---

*Ready to create amazing wishes? Try our [Wish Generator](/) to put these tips into practice!*
`;

/**
 * Generate a new blog post with the given slug and title
 */
export async function generateBlogPost(
  slug: string,
  title: string,
  category: string = "General"
) {
  const contentDir = path.join(process.cwd(), "content/blog");
  const filePath = path.join(contentDir, `${slug}.md`);

  // Check if file already exists
  if (fs.existsSync(filePath)) {
    throw new Error(`Blog post with slug "${slug}" already exists`);
  }

  const template = BLOG_POST_TEMPLATE.replace(
    "Your Blog Post Title Here",
    title
  )
    .replace("your-thumbnail.jpg", `${slug}-thumbnail.jpg`)
    .replace("General", category);

  fs.writeFileSync(filePath, template, "utf8");

  return {
    slug,
    filePath,
    title,
    category,
  };
}

/**
 * Get blog statistics
 */
export async function getBlogStats() {
  const posts = await getAllPosts();
  const categories = getAllCategories();
  const tags = getAllTags();

  return {
    totalPosts: posts.length,
    featuredPosts: posts.filter((post) => post.featured).length,
    categories: categories.length,
    tags: tags.length,
    categoriesWithCounts: categories.map((category) => ({
      name: category,
      count: posts.filter((post) => post.category === category).length,
    })),
    tagsWithCounts: tags.map((tag) => ({
      name: tag,
      count: posts.filter((post) => post.tags.includes(tag)).length,
    })),
    recentPosts: posts.slice(0, 5),
  };
}

/**
 * Validate blog post structure
 */
export function validateBlogPost(content: string) {
  const issues: string[] = [];

  // Check for frontmatter
  if (!content.startsWith("---")) {
    issues.push("Missing frontmatter at the beginning of the file");
  }

  // Check for required frontmatter fields
  const requiredFields = [
    "title",
    "description",
    "date",
    "thumbnail",
    "author",
    "category",
  ];
  requiredFields.forEach((field) => {
    if (!content.includes(`${field}:`)) {
      issues.push(`Missing required frontmatter field: ${field}`);
    }
  });

  // Check for content after frontmatter
  const frontmatterEnd = content.indexOf("---", 3);
  if (frontmatterEnd === -1) {
    issues.push("Missing closing frontmatter delimiter (---)");
  } else {
    const mainContent = content.substring(frontmatterEnd + 3).trim();
    if (mainContent.length < 100) {
      issues.push("Content appears to be too short (less than 100 characters)");
    }
  }

  // Check for main heading
  if (!content.includes("# ")) {
    issues.push("Missing main heading (# )");
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Suggested blog post ideas based on wish generation categories
 */
export const BLOG_POST_IDEAS = [
  {
    title: "50 Creative Birthday Wishes for Every Age and Personality",
    slug: "creative-birthday-wishes-every-age",
    category: "Birthday Wishes",
    tags: ["birthday", "creative", "age-specific", "personality"],
    description:
      "From toddlers to grandparents, discover birthday wishes that match every personality type and age group.",
  },
  {
    title: "Wedding Anniversary Ideas: Messages for Every Milestone Year",
    slug: "wedding-anniversary-messages-milestone-years",
    category: "Anniversary",
    tags: ["wedding", "anniversary", "milestones", "marriage"],
    description:
      "Celebrate each year of marriage with specially crafted messages for every anniversary milestone.",
  },
  {
    title: "Holiday Greeting Etiquette: What to Say in Our Diverse World",
    slug: "holiday-greeting-etiquette-diverse-world",
    category: "Holiday Greetings",
    tags: ["holidays", "etiquette", "diversity", "inclusion"],
    description:
      "Navigate holiday greetings with sensitivity and inclusivity in our multicultural society.",
  },
  {
    title: "Graduation Wishes That Inspire the Next Chapter",
    slug: "graduation-wishes-inspire-next-chapter",
    category: "Graduation",
    tags: ["graduation", "inspiration", "achievement", "future"],
    description:
      "Celebrate academic achievements with messages that motivate and inspire future success.",
  },
  {
    title: "The Psychology of Meaningful Messages: Why Words Matter",
    slug: "psychology-meaningful-messages-words-matter",
    category: "Writing Tips",
    tags: ["psychology", "communication", "relationships", "impact"],
    description:
      "Explore the science behind why certain messages resonate deeply and create lasting emotional connections.",
  },
  {
    title:
      "Digital vs. Handwritten: Choosing the Right Medium for Your Message",
    slug: "digital-vs-handwritten-choosing-right-medium",
    category: "Writing Tips",
    tags: ["digital", "handwritten", "medium", "communication"],
    description:
      "Learn when to choose digital messages versus handwritten notes for maximum impact.",
  },
  {
    title: "Cultural Celebrations Around the World: Universal Messages of Joy",
    slug: "cultural-celebrations-universal-messages-joy",
    category: "Cultural",
    tags: ["culture", "global", "celebrations", "traditions"],
    description:
      "Discover how different cultures celebrate special occasions and find universal themes in human joy.",
  },
  {
    title:
      "Sympathy and Condolence Messages: Finding the Right Words in Difficult Times",
    slug: "sympathy-condolence-messages-difficult-times",
    category: "Sympathy",
    tags: ["sympathy", "condolence", "grief", "support"],
    description:
      "Navigate the delicate art of offering comfort through thoughtful sympathy messages.",
  },
];

/**
 * SEO optimization helpers for blog posts
 */
export function generateSEOTips(title: string, category: string) {
  return {
    suggestedMetaDescription: `Discover ${title.toLowerCase()} with our comprehensive guide. Perfect for ${category.toLowerCase()} occasions and creating meaningful connections.`,
    suggestedTags: [
      category.toLowerCase().replace(/\s+/g, "-"),
      "wishes",
      "messages",
      "greetings",
      "special-occasions",
    ],
    suggestedSlug: title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 60),
  };
}

export default {
  generateBlogPost,
  getBlogStats,
  validateBlogPost,
  BLOG_POST_IDEAS,
  generateSEOTips,
};
