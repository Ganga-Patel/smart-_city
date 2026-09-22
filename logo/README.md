# Smart City Logos

This directory contains the separated, cleaned, and background-removed logos in both Dark and Light theme variants.
The slogan text ("SLOGAN HERE") has been cleanly removed from all assets.

---

## Asset Directory Overview

| File | Type | Theme Target | Dimensions | Background | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `logo-dark.png` | PNG | Dark Theme | 200 x 174 (proportional) | Transparent | Primary brand logo for dark UI headers / navbars |
| `logo-light.png` | PNG | Light Theme | 200 x 174 (proportional) | Transparent | Primary brand logo for light UI headers / navbars |
| `logo-dark-hd.png` | PNG | Dark Theme | 800 x 696 | Transparent | High-res / Retina 4x dark logo |
| `logo-light-hd.png` | PNG | Light Theme | 800 x 696 | Transparent | High-res / Retina 4x light logo |
| `logo-dark-square.png` | PNG | Dark Theme | 512 x 512 | Transparent | Centered square logo for app icons / favicons |
| `logo-light-square.png` | PNG | Light Theme | 512 x 512 | Transparent | Centered square logo for app icons / favicons |
| `logo-icon-dark.png` | PNG | Dark Theme | 512 x 512 | Transparent | City skyline emblem only (no text) |
| `logo-icon-light.png` | PNG | Light Theme | 512 x 512 | Transparent | City skyline emblem only (no text) |
| `logo-dark-cutout.png` | PNG | Dark Theme | 200 x 174 | Transparent | Modern monochrome silhouette cutout (100% white) |
| `logo-light-cutout.png` | PNG | Light Theme | 200 x 174 | Transparent | Modern monochrome silhouette cutout (dark slate) |
| `logo-dark-card.png` | PNG | Dark Theme | 316 x 316 | `#26323E` (Dark Slate) | Original dark background preserved, slogan removed |
| `logo-light-card.png` | PNG | Light Theme | 316 x 316 | `#FFFFFF` (Pure White) | Original white background preserved, slogan removed |
| `logo-dark.jpg` | JPEG | Dark Theme | 316 x 316 | `#26323E` | JPEG version with dark background |
| `logo-light.jpg` | JPEG | Light Theme | 316 x 316 | `#FFFFFF` | JPEG version with light background |
| `logo-dark.svg` | SVG | Dark Theme | Scalable Vector | Transparent | Scalable vector wrapper |
| `logo-light.svg` | SVG | Light Theme | Scalable Vector | Transparent | Scalable vector wrapper |

---

## Recommended Usage in HTML/CSS

### 1. In Navigation Bar / Header

```html
<!-- Dark Theme (default) -->
<img src="/logo/logo-dark.png" alt="Smart City Logo" class="h-10 w-auto object-contain">

<!-- Light Theme -->
<img src="/logo/logo-light.png" alt="Smart City Logo" class="h-10 w-auto object-contain">
```

### 2. Automatic Theme Switching via CSS / Tailwind

```html
<picture>
  <!-- Light mode -->
  <source srcset="/logo/logo-light.png" media="(prefers-color-scheme: light)">
  <!-- Dark mode default -->
  <img src="/logo/logo-dark.png" alt="Smart City Logo" class="h-10 w-auto">
</picture>
```

### 3. Favicon & App Icon

```html
<link rel="icon" type="image/png" href="/logo/logo-icon-dark.png">
<link rel="apple-touch-icon" href="/logo/logo-dark-square.png">
```
