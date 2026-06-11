---
version: alpha
name: Imprint
description: An editorial education brand with a calm, nature-forward palette and oversized serif headlines.
colors:
  primary: "#20614c"
  primary-contrast: "#fafafa"
  secondary: "#171717"
  tertiary: "#fbee43"
  neutral: "#fafafa"
  surface: "#ffffff"
  on-surface: "#171717"
  muted: "#e5e7eb"
  error: "#d94b4b"
typography:
  headline-display:
    fontFamily: "Boogy Brut"
    fontSize: "72px"
    fontWeight: 400
    lineHeight: "74px"
    letterSpacing: "0px"
  headline-lg:
    fontFamily: "Boogy Brut"
    fontSize: "52px"
    fontWeight: 400
    lineHeight: "56px"
    letterSpacing: "0px"
  headline-md:
    fontFamily: "Theinhardt"
    fontSize: "38px"
    fontWeight: 400
    lineHeight: "46px"
    letterSpacing: "0px"
  headline-sm:
    fontFamily: "Theinhardt"
    fontSize: "28px"
    fontWeight: 400
    lineHeight: "34px"
    letterSpacing: "0px"
  body-lg:
    fontFamily: "Theinhardt"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: "28px"
    letterSpacing: "0px"
  body-md:
    fontFamily: "Theinhardt"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: "26px"
    letterSpacing: "0px"
  body-sm:
    fontFamily: "Theinhardt"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
    letterSpacing: "0px"
  label-lg:
    fontFamily: "Theinhardt"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: "24px"
    letterSpacing: "0px"
  label-md:
    fontFamily: "Theinhardt"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: "20px"
    letterSpacing: "0.02em"
  label-sm:
    fontFamily: "Theinhardt"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: "16px"
    letterSpacing: "0.04em"
  overline:
    fontFamily: "Theinhardt"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "16px"
    letterSpacing: "0.08em"
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 16px
  xl: 24px
  full: 9999px
spacing:
  xs: 8px
  sm: 24px
  md: 32px
  lg: 54px
  xl: 64px
  gutter: 40px
  section: 96px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-contrast}"
    typography: "{typography.body-md}"
    rounded: "{rounded.full}"
    padding: "13px 40px"
    height: "52px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.full}"
    padding: "13px 40px"
    height: "52px"
  button-link:
    backgroundColor: "transparent"
    textColor: "{colors.tertiary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.none}"
    padding: "0px"
  card:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.sm}"
    padding: "16px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.full}"
    padding: "13px 16px"
    height: "52px"
---
# Imprint

## Overview
Imprint feels like an editorial knowledge brand wrapped in a calm, nature-inspired visual system. The tone is intelligent and polished, but not sterile; it balances academic credibility with warmth and approachability. The layout is intentionally spacious, letting oversized type and illustrated cards breathe.

## Colors
- **Primary (#20614C):** A deep botanical green used for the main call-to-action, navigation accents, and grounded brand moments.
- **Secondary (#171717):** A near-black ink used for body copy, headings, and high-contrast text.
- **Tertiary (#FBEE43):** A bright, energetic yellow used sparingly for highlighted links and promotional emphasis.
- **Neutral (#FAFAFA):** A soft off-white used as the main page background and card fill.
- **Surface (#FFFFFF):** Pure white for panels and content surfaces.
- **On-surface (#171717):** The default text color on light surfaces.
- **Muted (#E5E7EB):** A subtle cool border tone for card edges and separation.
- **Error (#D94B4B):** Reserved for validation or destructive states.

## Typography
**Boogy Brut** (Fraunces fallback) for display headlines. **Theinhardt** (DM Sans fallback) for UI and body text.

## Layout
Wide, open composition with generous spacing on an 8px-based scale.

## Elevation & Depth
Intentionally flat. Depth from white cards against off-white background, subtle borders, and typographic hierarchy.

## Shapes
Cards use small radii; buttons and inputs are fully pill-shaped.

## Do's and Don'ts
- Do keep the page spacious and editorial.
- Do use display serif only for large moments.
- Do preserve the calm green-and-cream palette.
- Don't introduce gradients, heavy shadows, or glossy styling.
- Don't overuse the yellow accent.
