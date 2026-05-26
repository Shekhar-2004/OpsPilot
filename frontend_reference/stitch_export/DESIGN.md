---
name: Gilded Ivory Editorial
colors:
  surface: '#fbf9f5'
  surface-dim: '#dbdad6'
  surface-bright: '#fbf9f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3ef'
  surface-container: '#efeeea'
  surface-container-high: '#eae8e4'
  surface-container-highest: '#e4e2de'
  on-surface: '#1b1c1a'
  on-surface-variant: '#4e4540'
  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f0ed'
  outline: '#7f756f'
  outline-variant: '#d1c4bd'
  surface-tint: '#685c55'
  primary: '#170f0a'
  on-primary: '#ffffff'
  primary-container: '#2d241e'
  on-primary-container: '#988a82'
  inverse-primary: '#d3c3ba'
  secondary: '#735c00'
  on-secondary: '#ffffff'
  secondary-container: '#fed65b'
  on-secondary-container: '#745c00'
  tertiary: '#031508'
  on-tertiary: '#ffffff'
  tertiary-container: '#162a1b'
  on-tertiary-container: '#7c927e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#f0dfd6'
  primary-fixed-dim: '#d3c3ba'
  on-primary-fixed: '#221a14'
  on-primary-fixed-variant: '#4f453e'
  secondary-fixed: '#ffe088'
  secondary-fixed-dim: '#e9c349'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#d1e9d2'
  tertiary-fixed-dim: '#b5cdb6'
  on-tertiary-fixed: '#0c2011'
  on-tertiary-fixed-variant: '#374c3b'
  background: '#fbf9f5'
  on-background: '#1b1c1a'
  surface-variant: '#e4e2de'
typography:
  display-lg:
    fontFamily: Libre Caslon Text
    fontSize: 48px
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Libre Caslon Text
    fontSize: 36px
    fontWeight: '400'
    lineHeight: '1.2'
  headline-lg:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Libre Caslon Text
    fontSize: 24px
    fontWeight: '400'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  container-max: 1440px
---

## Brand & Style

This design system establishes a high-end, "Pinterest-esque" editorial aesthetic tailored for the B2B AI sector. It moves away from the cold, industrial tropes of technology and toward a philosophy of **Ornamental Restraint**. The goal is to evoke a sense of digital wellness and human-centric authorship.

The style is **Tactile Minimalism** with **Editorial** influences. It prioritizes generous whitespace (luxury), thin metallic rules (precision), and high-contrast typography (authority). The interface should feel like a premium printed journal—stable, intentional, and curated—rather than a flickering software dashboard. It targets executive decision-makers who value clarity, sophistication, and a calm working environment.

## Colors

The palette is anchored in **Gilded Ivory**, a warm and tactile range of neutrals that reduces eye strain and provides a premium "paper" feel.

- **Backgrounds:** The primary canvas uses *Bisque* (#F5F0E1) for a soft, matte look, while *Creamy White* (#FDFBF7) is reserved for elevated surface containers and cards to create subtle depth.
- **Typography:** *Espresso* (#2D241E) provides high-contrast legibility, replacing harsh pure blacks with a deep, organic tone.
- **Accents:** *Metallic Gold* (#D4AF37) is used sparingly for hairline rules, icons, and decorative ornaments. *Sage* (#8FA691) serves as a functional accent for "Active," "Synced," or "Success" states, maintaining the organic harmony.
- **Alarms:** *Muted Terracotta* (#C36A59) provides necessary urgency without breaking the sophisticated aesthetic.

## Typography

The typography strategy relies on a sharp juxtaposition between tradition and technology. 

**Libre Caslon Text** is the editorial voice, used for headlines and display moments. It should be typeset with tight letter-spacing in larger formats to emphasize its elegant, high-contrast serifs.

**Geist** provides the functional backbone. Its monolinear, technical precision balances the serif's warmth, ensuring that data-heavy AI outputs remain highly readable and "engineered."

Use uppercase labels with slight tracking for metadata and small headers to maintain a structured, categorized feel across the "Modern Masonry" layout.

## Layout & Spacing

The layout follows a **Modern Masonry / Bento Box** philosophy. Components are arranged in a structured but dynamic grid that allows for varying content heights, reminiscent of a high-end digital mood board.

- **Grid:** A 12-column fluid grid for desktop with 24px gutters.
- **Margins:** Generous outer margins (48px on desktop) ensure the content feels framed and intentional, not crowded.
- **Rhythm:** All spacing should be multiples of 8px. Use larger gaps (40px+) between major sections to reinforce the feeling of "luxury through whitespace."
- **Adaptation:** On mobile, the masonry stacks into a single-column flow, with margins reducing to 16px. Cards maintain their rounded integrity.

## Elevation & Depth

This design system avoids heavy shadows, instead using **Tonal Layers** and **Hairline Rules** to define hierarchy.

- **Surface Stacking:** The base layer is *Bisque*. Primary interactive cards and containers are *Creamy White*. This 1-step tonal shift creates depth without the need for artificial lighting effects.
- **Borders:** Use 1px solid borders in *Metallic Gold* (at 30-50% opacity) for primary containers. 
- **Subtle Depth:** Where elevation is strictly required for floating elements (like dropdowns), use a "Contact Shadow": a very soft, Espresso-tinted blur with 4% opacity, positioned slightly downward.
- **Glassmorphism:** Reserved only for persistent navigation bars, using a high-diffusion backdrop blur (20px) over the Creamy White surface at 80% opacity.

## Shapes

The shape language is defined by **Soft Geometricism**. 

All primary containers, cards, and input fields utilize a **16px to 24px corner radius**. This softness counteracts the sharp high-contrast serifs and the technical nature of AI, making the platform feel approachable and "organic."

Smaller components like buttons and tags use the 8px (base) or full pill-shape radius to distinguish them from the larger structural containers.

## Components

- **Cards:** The core of the Masonry layout. Use *Creamy White* backgrounds, 24px padding, and 1px *Gold* rules. Content inside should be vertically aligned with generous leading.
- **Buttons:** 
  - *Primary:* Espresso background with Creamy White text; 8px rounded corners.
  - *Secondary:* Ghost style with a 1px Gold border and Espresso text.
- **Input Fields:** Minimalist design. Use a bottom-border only (1px Gold) in a resting state, shifting to a full 1px border when focused. Label text should use the uppercase *Geist* label style.
- **Chips/Tags:** Use the *Sage* accent at 10% opacity for backgrounds with solid *Sage* text for "Active" states. Use *Bisque* for neutral metadata tags.
- **Dividers:** Use ultra-thin (0.5pt to 1pt) *Gold* lines. For editorial flair, dividers can occasionally feature a small geometric ornament (a diamond or dot) at the center.
- **AI Feedback:** AI-generated content should be highlighted by a subtle gradient border transitioning from *Gold* to *Sage*, signaling "Active Intelligence" in a sophisticated manner.