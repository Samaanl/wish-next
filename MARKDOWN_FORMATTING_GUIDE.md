# Markdown Text Formatting Guide for Blog Posts

This guide shows you all the ways to format text in your blog posts.

## Basic Markdown Formatting

### Bold Text

```markdown
**This is bold text**
**This is also bold text**
```

**Result: Bold text**

### Italic Text

```markdown
_This is italic text_
_This is also italic text_
```

_Result: Italic text_

### Bold and Italic Combined

```markdown
**_This is bold and italic_**
**_This is also bold and italic_**
```

**_Result: Bold and italic text_**

### Strikethrough

```markdown
~~This text is crossed out~~
```

~~Result: Strikethrough text~~

## Font Sizes Using Headers

```markdown
# Largest heading (h1)

## Large heading (h2)

### Medium heading (h3)

#### Smaller heading (h4)

##### Small heading (h5)

###### Smallest heading (h6)
```

## HTML Styling in Markdown

### Custom Font Sizes

```markdown
<span style="font-size: 24px;">Large text</span>
<span style="font-size: 18px;">Medium text</span>
<span style="font-size: 14px;">Small text</span>
```

### Font Weights

```markdown
<span style="font-weight: 100;">Thin text</span>
<span style="font-weight: 300;">Light text</span>
<span style="font-weight: 400;">Normal text</span>
<span style="font-weight: 600;">Semi-bold text</span>
<span style="font-weight: 700;">Bold text</span>
<span style="font-weight: 900;">Extra bold text</span>
```

### Font Styles

```markdown
<span style="font-style: italic;">Italic text</span>
<span style="font-style: normal;">Normal text</span>
```

### Colors

```markdown
<span style="color: #ff6b6b;">Red text</span>
<span style="color: #4ecdc4;">Teal text</span>
<span style="color: #45b7d1;">Blue text</span>
<span style="color: #96ceb4;">Green text</span>
<span style="color: #feca57;">Yellow text</span>
```

### Combined Styling

```markdown
<span style="font-size: 20px; font-weight: bold; font-style: italic; color: #4338ca;">
Large bold italic blue text
</span>
```

## Custom CSS Classes (Available in Your Blog)

### Highlight Text

```markdown
<span class="blog-highlight">Gradient highlighted text</span>
```

### Quote Boxes

```markdown
<div class="blog-quote-box">
Beautiful quote with gradient background and white text
</div>
```

### Emphasis Boxes

```markdown
<span class="blog-emphasis">Important emphasized text</span>
```

### Large Text

```markdown
<span class="blog-large-text">Larger text for emphasis</span>
```

### Small Caps

```markdown
<span class="blog-small-caps">Small caps text style</span>
```

### Italic Bold with Color

```markdown
<span class="blog-italic-bold">Stylish italic bold text</span>
```

## Combining Tailwind CSS Classes

You can also use Tailwind CSS classes for styling:

```markdown
<span class="text-2xl font-bold text-purple-600">Purple large bold text</span>
<span class="text-lg font-semibold italic text-indigo-500">Indigo italic text</span>
<span class="text-sm font-light text-gray-600">Small light gray text</span>
```

## Background and Padding

### Custom Styled Boxes

```markdown
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            padding: 20px; 
            border-radius: 12px; 
            color: white; 
            font-size: 16px; 
            line-height: 1.6; 
            margin: 16px 0;">
Your beautifully styled content goes here
</div>
```

### Simple Background Colors

```markdown
<span style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px;">
Text with gray background
</span>
```

## Text Alignment

```markdown
<div style="text-align: center;">Centered text</div>
<div style="text-align: right;">Right-aligned text</div>
<div style="text-align: justify;">Justified text that spreads across the full width</div>
```

## Line Heights and Letter Spacing

```markdown
<span style="line-height: 2;">Text with double line height</span>
<span style="letter-spacing: 2px;">Text with letter spacing</span>
```

## Examples in Your Blog Context

### For Quotes

```markdown
<div class="blog-quote-box">
"The best birthday wishes come from the heart and create lasting memories."
</div>
```

### For Key Points

```markdown
<span class="blog-emphasis">Remember: Personalization is key!</span>
```

### For Section Headers

```markdown
## <span class="blog-highlight">Important Section Title</span>
```

### For Call-to-Actions

```markdown
<div style="background: #4338ca; color: white; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
<span style="font-size: 18px; font-weight: bold;">
Try our Wish Generator for instant personalized messages!
</span>
</div>
```

## Best Practices

1. **Don't overuse** - Too much styling can be distracting
2. **Be consistent** - Use similar styles for similar content types
3. **Consider accessibility** - Ensure good contrast for readability
4. **Mobile-friendly** - Test how your styled text looks on mobile devices
5. **Semantic meaning** - Use styling to enhance meaning, not just decoration

## Quick Reference

- **Bold**: `**text**` or `<span style="font-weight: bold;">text</span>`
- **Italic**: `*text*` or `<span style="font-style: italic;">text</span>`
- **Large**: `<span style="font-size: 20px;">text</span>`
- **Colored**: `<span style="color: #4338ca;">text</span>`
- **Custom class**: `<span class="blog-highlight">text</span>`
