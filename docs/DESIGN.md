---
name: "Bhumi Drishti Design System"
version: "1.1.0"
author: "Bhumi Drishti Team"
license: "MIT"
system: "astryx-freedesignmd"
tokens:
  colors:
    primary:
      50: "#f0fdf4"
      100: "#dcfce7"
      200: "#bbf7d0"
      300: "#86efac"
      400: "#4ade80"
      500: "#1b4d3e" # Emerald Bengal Paddy (Primary Brand)
      600: "#166534"
      700: "#15803d"
      800: "#14532d"
      900: "#052e16"
    earth:
      50: "#fdfbf7"
      100: "#f7f1e6"
      200: "#ebdcc5"
      300: "#dcc19e"
      400: "#c79e6f"
      500: "#a97843" # Fertile Alluvial Silt
      600: "#88592d"
      700: "#6a4320"
      800: "#4d2e14"
      900: "#2a1708"
    gold:
      50: "#fffbeb"
      100: "#fef3c7"
      200: "#fde68a"
      300: "#fcd34d"
      400: "#fbbf24"
      500: "#d4a373" # Golden Harvest Grain
      600: "#b45309"
      700: "#92400e"
    danger:
      50: "#fef2f2"
      100: "#fee2e2"
      500: "#c84b31" # Terracotta Drought Warning
      700: "#b91c1c"
    monsoon:
      50: "#eff6ff"
      100: "#dbeafe"
      500: "#3a86c8" # Bengal Monsoon Waterlogging Risk
      700: "#1d4ed8"
    surface:
      canvas: "#f7f8f6"
      card: "#ffffff"
      card-muted: "#f0f2ee"
      border: "#d9ded6"
      border-strong: "#b8c2b3"
    text:
      primary: "#1c2826"
      secondary: "#4a5b56"
      muted: "#758a83"
      inverted: "#ffffff"
  typography:
    font-family:
      sans: "'Hind Siliguri', 'Tiro Bangla', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    sizes:
      xs: "0.75rem"
      sm: "0.875rem"
      base: "1rem"
      lg: "1.125rem"
      xl: "1.25rem"
      2xl: "1.5rem"
      3xl: "1.875rem"
      4xl: "2.25rem"
  radii:
    none: "0px"
    sm: "4px"
    md: "8px"
    lg: "12px"
    xl: "16px"
    pill: "9999px"
  shadows:
    sm: "0 1px 2px 0 rgba(28, 40, 38, 0.05)"
    md: "0 4px 6px -1px rgba(28, 40, 38, 0.08), 0 2px 4px -1px rgba(28, 40, 38, 0.04)"
    lg: "0 10px 15px -3px rgba(28, 40, 38, 0.10)"
    tactile: "0 4px 0 0 #143b2f" # Physical click feel for farmer buttons
  spacing:
    farmer-touch-min: "64px" # Minimum tap target for rural outdoor usage
---

# Bhumi Drishti Design Specification & Unslop Guidelines

## 1. Aesthetic Purpose & Identity
Bhumi Drishti is built for rural Bangladeshi smallholder farmers and agriculture field officers. Its visual identity reflects the authentic natural environment of Bangladesh: fertile alluvial silt, lush green Aman paddies, golden mustard/wheat harvests, and monsoon floodwaters.

## 2. "Unslop" Manifesto (Combating Generic AI Aesthetics)
Following `heydamir/unslop` principles:
- **NO Generic Purple Gradients / Neon Glows**: Banned. Agriculture software should look grounded, authoritative, and physically connected to the land.
- **NO Floating Glassmorphism**: Translucent glassy panels wash out under bright tropical sunlight. All surfaces must have solid, high-contrast backgrounds with clear, crisp boundary borders (`#d9ded6`).
- **NO Meaningless Decorative Emojis**: Use purposeful iconography (Lucide SVG icons) with clear semantic labels in Bangla.
- **Tactile Affordance**: Buttons must feel click-ready with real physical depth (`var(--shadow-tactile)`), subtle active depress animations (`translate-y-1`), and explicit active states.

## 3. Astryx Design System Harmony
Built on the principles of Meta's `astryx` design system:
- **CSS Custom Property Tokens**: All layout primitives consume semantic CSS variables (`--color-surface-card`, `--color-primary-500`, `--color-text-primary`).
- **Zero Lock-in Component Primitives**: Reusable, unstyled-under-the-hood primitives (`AstryxCard`, `AstryxButton`, `AstryxBadge`, `AstryxChip`, `AstryxModal`).
- **Light / Dark Field Contrast**: Tuned for maximum outdoor readability in high-glare field environments.

## 4. Farmer Mode vs. Officer Mode
- **Farmer Mode (সহজ মোড)**:
  - Big, tactile action buttons (64px minimum height).
  - Voice recording with live animated audio wave visualizer.
  - Camera preview with instant crop & symptom tags.
  - Traffic-light status badges: 🟢 ভালো (Good), 🟡 মাঝারি (Medium), 🔴 ঝুঁকিপূর্ণ (High Risk).
  - Single-click spoken audio readout.
- **Officer Mode (অফিসার মোড)**:
  - Information-dense layout.
  - Interactive Leaflet satellite NDVI overlay.
  - Quantitative feature weights and delta comparison table.
