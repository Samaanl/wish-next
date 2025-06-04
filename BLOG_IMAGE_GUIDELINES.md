# Blog Image Guidelines & Optimization Guide

## Image Resolution Recommendations

### Blog Thumbnails

- **Recommended Size**: 1200x630px (1.91:1 aspect ratio)
- **Format**: SVG (preferred) or PNG/JPG
- **Purpose**: Open Graph images, social media sharing, blog cards
- **File Size**: Keep under 1MB for optimal loading

### Content Images

- **Hero Images**: 1920x1080px (16:9 aspect ratio)
- **In-line Images**: 800x600px or 1200x800px
- **Format**: WebP (preferred), PNG for graphics, JPG for photos
- **Alt Text**: Always include descriptive alt text for accessibility

### Icon Images

- **Small Icons**: 64x64px or 128x128px
- **Large Icons**: 256x256px or 512x512px
- **Format**: SVG (preferred) or PNG

## Blog Card Optimizations

### Mobile-First Design

- **Card Height**: Optimized for mobile screens (reduced from 400px+ to ~280px)
- **Image Height**:
  - Featured cards: 48-56px on large screens, 48px on mobile
  - Regular cards: 40px height
- **Padding**: Reduced from 6-8px to 4-6px for more compact layout
- **Text Truncation**: Added line-clamp utilities for consistent heights

### Typography Scaling

- **Featured Cards**:
  - Title: xl to 2xl (down from 2xl to 3xl)
  - Description: base size (down from lg)
- **Regular Cards**:
  - Title: lg size (down from xl)
  - Description: sm size (down from base)
- **Meta Elements**: Reduced to xs and small sizes

### Grid Layout

- **Desktop**: Up to 4 columns (xl:grid-cols-4)
- **Tablet**: 2-3 columns
- **Mobile**: Single column
- **Gap**: Reduced from 8 to 6 for tighter layout

## Performance Optimizations

### Image Loading

- Use Next.js Image component with proper `sizes` prop
- Implement lazy loading for images below the fold
- Use `priority` prop for above-the-fold images

### Text Optimization

- Line clamping for consistent card heights
- Reduced font sizes for better information density
- Optimized spacing and padding

### Layout Efficiency

- Compact card design reduces scrolling
- Better information hierarchy
- Improved mobile experience

## File Naming Convention

### Blog Thumbnails

```
/public/blog-images/[slug].svg
/public/blog-images/[slug].png
```

### Content Images

```
/public/blog-images/content/[slug]/[image-name].[ext]
```

### Icons

```
/public/icons/[category]/[name].[ext]
```

## CSS Classes Added

### Line Clamp Utilities

- `.line-clamp-1`: Single line truncation
- `.line-clamp-2`: Two line truncation
- `.line-clamp-3`: Three line truncation

### Usage in Blog Cards

- Titles: `line-clamp-2` for consistent height
- Descriptions: `line-clamp-2` for preview text
- Author names: Single line display

## SEO Optimization

### Meta Tags

- Dynamic title and description generation
- Open Graph tags with proper image sizes
- Twitter Card optimization
- Canonical URLs for blog posts

### Image SEO

- Descriptive file names
- Alt text for all images
- Proper aspect ratios for social sharing
- Optimized file sizes for fast loading

## Mobile Experience

### Touch Targets

- Minimum 44px touch targets on mobile
- Proper spacing between interactive elements
- Optimized typography for small screens

### Layout Adaptations

- Single column on mobile
- Reduced padding and margins
- Compact card design
- Optimized image sizes

## Development Notes

### Component Structure

- BlogCard component optimized for performance
- RelatedPosts component with reduced spacing
- Responsive grid layouts throughout

### Future Improvements

- WebP image format support
- Progressive image loading
- Advanced image optimization
- Category-based image templates
