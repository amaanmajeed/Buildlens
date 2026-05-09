---
name: BuildLens AI
colors:
  surface: '#faf9fc'
  surface-dim: '#dad9dd'
  surface-bright: '#faf9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f7'
  surface-container: '#eeedf1'
  surface-container-high: '#e9e7eb'
  surface-container-highest: '#e3e2e6'
  on-surface: '#1a1c1e'
  on-surface-variant: '#43474e'
  inverse-surface: '#2f3033'
  inverse-on-surface: '#f1f0f4'
  outline: '#74777f'
  outline-variant: '#c4c6cf'
  surface-tint: '#455f87'
  primary: '#022448'
  on-primary: '#ffffff'
  primary-container: '#1e3a5f'
  on-primary-container: '#8aa4cf'
  inverse-primary: '#adc8f5'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#341f00'
  on-tertiary: '#ffffff'
  tertiary-container: '#503300'
  on-tertiary-container: '#c69b5f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#adc8f5'
  on-primary-fixed: '#001c3b'
  on-primary-fixed-variant: '#2d486d'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffddb2'
  tertiary-fixed-dim: '#edbf7f'
  on-tertiary-fixed: '#291800'
  on-tertiary-fixed-variant: '#60410c'
  background: '#faf9fc'
  on-background: '#1a1c1e'
  surface-variant: '#e3e2e6'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  stack-xs: 4px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
  stack-xl: 48px
---

## Brand & Style

The design system is engineered as an "Operational Intelligence" platform, specifically tailored for the high-stakes environment of heavy civil construction. The brand personality is clinical, authoritative, and stoic. It rejects the "black box" AI trope in favor of a transparent, high-performance tool that feels like an extension of a contractor's expertise.

The visual style is **Corporate / Modern** with a lean toward **Minimalism**. Every UI element must justify its existence through utility. The aesthetic prioritizes structural integrity—much like the projects the users manage—using precise alignment, generous structural spacing, and a restrained palette to reduce cognitive load during complex bidding cycles.

## Colors

The color strategy for this design system is built on a foundation of "Trust and Visibility." 

- **Primary Navy (#1E3A5F):** Reserved for primary actions, active states, and navigation headers. It represents the structural backbone of the application.
- **Background (#F4F7FA):** A cool, low-vibrancy grey-blue used to reduce eye strain during long working sessions.
- **Semantic Colors:** Success, Warning, and Error colors are used sparingly and exclusively for status communication. They should never be used for decorative purposes.
- **Typography:** Headlines use `neutral_slate_900` (Dark Charcoal) for maximum contrast, while secondary information uses `neutral_slate_700` (Slate) to establish hierarchy.

## Typography

This design system utilizes **Inter** for all primary interface elements to ensure maximum legibility at high data densities. 

The typographic scale is intentionally compact to allow for information-dense bidding tables and document previews. 
- **Hierarchy:** Use font weight (Semi-Bold vs Regular) rather than large jumps in font size to maintain a "technical manual" feel.
- **Data Display:** For numerical values in bidding sheets and technical specs, a monospaced alternative (JetBrains Mono) should be used to ensure column alignment and readability of complex figures.
- **Letter Spacing:** Headlines utilize slight negative tracking for a premium, tightened look, while labels use increased tracking for legibility at small sizes.

## Layout & Spacing

The layout philosophy follows a **Fixed-Fluid Hybrid Grid**. Sidebars and navigation panels are fixed width to provide a consistent "cockpit" experience, while the central workspace is fluid to accommodate wide data tables and multi-column bidding forms.

- **Grid:** A 12-column system is used for the main content area.
- **Rhythm:** An 8px linear scale governs all padding and margins, ensuring a predictable vertical rhythm.
- **Density:** While the outer margins are large (`32px`) to create a "premium" feel, internal component spacing is kept tight (`8px` - `16px`) to maximize the amount of actionable data visible on a single screen.
- **Breakpoints:**
  - Desktop: 1280px+
  - Tablet: 768px - 1279px (Sidebar collapses to icon-only)
  - Mobile: Under 768px (Single column flow, standard top-bar navigation)

## Elevation & Depth

Depth in the design system is communicated through **Tonal Layering** and **Subtle Shadows**, avoiding heavy gradients or skeuomorphism.

- **Surfaces:** The background uses the primary background color (`#F4F7FA`). Cards and "Work Surfaces" use White (`#FFFFFF`).
- **Borders:** Every card and interactive container must have a `1px` solid border using `neutral_slate_200`. This creates a sense of "Precision Engineering."
- **Shadows:** Use a single, highly-diffused ambient shadow for floating elements (e.g., Modals, Popovers). 
  - *Shadow Token:* `0px 4px 20px rgba(30, 58, 95, 0.08)`. The slight navy tint in the shadow ensures it feels integrated with the brand palette.
- **Active State:** Elements that are "raised" (like a dragged item) should use a slightly more pronounced shadow rather than a color change.

## Shapes

The shape language is **Soft and Professional**. This design system avoids fully sharp corners to remain approachable, but rejects overly rounded "bubbly" aesthetics to maintain an enterprise-grade tone.

- **Standard Elements:** Buttons, Input fields, and Tags use a `4px` (0.25rem) radius.
- **Containers:** Large cards and modals use an `8px` (0.5rem) radius.
- **Selection Indicators:** Active states in navigation or sidebars use a `4px` radius for the highlight background.

## Components

### Buttons
Primary buttons utilize the Primary Navy background with White text. Secondary buttons use a transparent background with a `neutral_slate_200` border. Ghost buttons are used for utility actions to keep the visual field clear.

### Data Grids
The core of the platform. Tables must feature:
- Sticky headers for long bid lists.
- Zebra striping using a 2% opacity of the Primary Navy.
- Inline status chips for "Pending," "Won," or "Flagged" bids.

### Command Bar (K-Menu)
A central "AI OS" feature. A floating search bar (Cmd+K) that allows users to jump between projects, run AI queries, or search technical specifications instantly. It should use a backdrop blur effect (20px) to appear as an overlay.

### Cards
White cards with `1px` slate borders. Card headers should be separated from content by a subtle horizontal rule. Icons within cards should be simple, 20px stroke-based line art in the Primary Navy.

### Input Fields
Inputs use a white background, `1px` slate border, and a `2px` Primary Navy focus ring. Error states change the border color to `Error (#EF4444)` and provide a small helper text below the field.

### AI Insights Panel
A specific component for BuildLens AI. This panel uses a very subtle vertical gradient (White to 5% Primary Navy) to distinguish "AI-generated" content from raw user data, ensuring the source of intelligence is always clear.