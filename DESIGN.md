---
name: BillXpress
description: Fast bill payment platform — one wallet for airtime, data, cable, betting, and electricity
colors:
  primary: "#7C3AED"
  secondary: "#64748B"
  accent: "#F97316"
  success: "#22C55E"
  warning: "#EAB308"
  error: "#EF4444"
  info: "#3B82F6"
  bg-page: "#FAFAFA"
  bg-card: "#FFFFFF"
  bg-sidebar: "#FFFFFF"
  text-primary: "#0F172A"
  text-secondary: "#475569"
  border: "#E2E8F0"
  gradient-start: "#7C3AED"
  gradient-end: "#2563EB"
typography:
  display:
    fontFamily: "Ginto, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Ginto, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  default: "1rem"
  modal: "1.5rem"
  sm: "0.75rem"
  lg: "0.5rem"
  full: "9999px"
spacing:
  page: "1rem"
  section: "1.5rem"
  card-gap: "1rem"
  card-padding: "1rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.default}"
    padding: "16px 24px"
  button-primary-hover:
    backgroundColor: "#9333EA"
    textColor: "#FFFFFF"
    rounded: "{rounded.default}"
    padding: "16px 24px"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.default}"
    padding: "16px 24px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.default}"
    padding: "12px 16px"
  input:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.default}"
    padding: "12px 16px"
  card:
    backgroundColor: "{colors.bg-card}"
    rounded: "{rounded.default}"
    padding: "{spacing.card-padding}"
---

# Design System: BillXpress

## 1. Overview

**Creative North Star: "The Clear Ledger"**

BillXpress is a financial dashboard that earns trust through clarity. Every screen puts the wallet balance front and centre — one number that represents every bill, every top-up, every transaction. The design is clean and airy with a confident purple anchor, avoiding the heavy corporate feel of traditional Nigerian banking apps. Page backgrounds use a barely-there warm off-white that keeps content legible without competing with it. Cards lift on interaction, rewarding exploration without getting in the way.

The system explicitly rejects: bank-app heaviness (no crowded card grids, no muted official tones), generic AI-sand defaults (no cream body backgrounds, no numbered section eyebrows, no gradient text), and over-designed navigation. Every element earns its place by making bill payment faster or clearer.

**Key Characteristics:**
- Purple-anchored, blue-accelerated brand gradient
- Generous rounded corners (1rem default) for a friendly, approachable feel
- Flat surfaces at rest; lifted on interaction with scale + shadow
- Bold, tactile buttons with responsive press states
- Mobile-first, touch-optimised layout with bottom navigation
- Complete dark mode with full palette inversion
- Self-hosted Ginto for display headings, Inter for body
- Service-category colour coding (blue for airtime, green for data, purple for TV, etc.)

## 2. Colors

The palette centres on a vibrant purple primary with a slate secondary anchor. A brand gradient (purple → blue) adds energy to CTAs and the logo. Semantic colours are reserved strictly for status and feedback.

### Primary
- **Royal Purple** (`#7C3AED`): The brand anchor. Used for primary buttons, active navigation items, the logo mark, and the theme-color meta tag. Appears on ≤15% of any given screen — its rarity is the point.
- **Gradient Blue** (`#2563EB`): The acceleration partner. Paired with primary in the brand gradient for CTAs, hero, and loading screens.

### Secondary
- **Slate** (`#64748B`): Form submit buttons, section headings, subtle interactive elements.

### Accent
- **Warm Orange** (`#F97316`): Highlights, callout accents, certain service categories.

### Neutral
- **Page Background** (`#FAFAFA` / dark: `#0F172A`): The canvas. Barely-there warm off-white in light mode; deep navy-slate in dark mode.
- **Card Background** (`#FFFFFF` / dark: `#1E293B`): Clean white cards on the light surface; muted slate-blue cards in dark mode.
- **Text Primary** (`#0F172A` / dark: `#F1F5F9`): High-emphasis content. Maintains 4.5:1+ contrast against all surface backgrounds.
- **Text Secondary** (`#475569` / dark: `#94A3B8`): Supporting text, metadata, captions.
- **Border** (`#E2E8F0` / dark: `#334155`): Delineates surfaces without calling attention.

### Semantic
- **Success Green** (`#22C55E`): Completed transactions, success toasts, green status badges.
- **Warning Yellow** (`#EAB308`): Pending status, rate-limit warnings.
- **Error Red** (`#EF4444`): Failed transactions, destructive actions, validation errors.
- **Info Blue** (`#3B82F6`): Informational toasts, loading states.

### Service Categories
Each service type gets a consistent 50-shade background and 600-shade icon/text colour: Airtime (blue), Data (green), TV Bills (purple), Electricity (yellow), Education (indigo), Airtime to Cash (orange), Betting (red).

### The One-Accent Rule
The primary purple accent appears on ≤15% of any given screen. Its rarity is the point — when a button is purple, it matters.

## 3. Typography

**Display Font:** Ginto (self-hosted via `@font-face`)
**Body Font:** Inter (system-ui fallback)

**Character:** A confident dual-system. Ginto brings editorial weight to headings — it's the voice that says "this is a serious financial tool." Inter handles the UI with clean neutrality, stepping back to let the data speak. The pairing signals trust without stuffiness.

### Hierarchy
- **Display** (700, `clamp(2rem, 5vw, 3.5rem)`, 1.1, `-0.02em`): Page-level hero headers only. Landing page "Pay your bills" headline.
- **Headline** (700, 1.25rem, 1.2): Dashboard page titles, modal titles. Uses Ginto.
- **Title** (600, 1rem, 1.3): Card headings, section titles. Uses Inter.
- **Body** (400, 0.875rem, 1.5): Primary reading text. Transaction details, descriptions. Max line length 65–75ch on prose pages.
- **Label** (500, 0.75rem, 1.4): Form labels, captions, metadata, timestamps.

### Named Rules
**The Ginto-Headline Rule.** Ginto is reserved for headings only. Never use Ginto for body text, buttons, or labels — its editorial weight belongs at the top of the hierarchy.

## 4. Elevation

BillXpress is flat by default. Depth is conveyed through interaction, not static shadows. Cards rest flush on the page surface until the user engages with them — hover lifts them with a subtle shadow and optional scale. This keeps the interface clean and reduces visual noise, especially important on a financially sensitive dashboard where clarity is paramount.

### Shadow Vocabulary
- **Card Rest** (`shadow-sm`): Minimal delineation between card and page surface.
- **Card Hover** (`shadow-lg → shadow-xl`): Transition on hover for interactive cards. Paired with `scale-[1.02]` on primary CTAs.
- **Modal** (`shadow-2xl`): Maximum elevation for overlays and dialogs.
- **Floating Action** (`shadow-md`): Mobile-only floating elements.
- **Brand Glow** (`shadow-lg shadow-primary/25`): Primary-tinted shadow on CTAs, reinforcing the brand colour.

### The Flat-by-Default Rule
Surfaces are flat at rest. Shadows appear only as a response to interaction (hover, focus). A card that never receives interaction never needs a shadow.

## 5. Components

### Buttons
- **Shape:** Generous rounded corners (1rem). Full-height hit area.
- **Primary (CTA):** Purple (`#7C3AED`) background, white text, 16px horizontal padding. On hover: scale to 1.02, deepen to purple-600 (`#9333EA`), lift shadow with primary tint. On active: scale to 0.98. The brand gradient variant (purple → blue) is reserved for landing-page CTAs and the registration success screen.
- **Secondary:** Slate (`#64748B`) background, white text. Used for form submissions and secondary actions.
- **Ghost/Outline:** Transparent background, `1px` border (`border-gray-300`), text-colour body. Used for "Back", "Cancel", and tertiary actions.
- **Destructive:** Red (`#EF4444`) background. Confirmation-only in modals.
- **Disabled:** 50% opacity, `cursor-not-allowed`. No hover effects.

### Inputs / Fields
- **Shape:** 1rem rounded corners, 12px internal padding (vertical + horizontal).
- **Style:** Light border stroke (`#E2E8F0` or `border-gray-300`), white background. Focus: blue-500 ring (`#3B82F6`, 2px), border becomes transparent.
- **Error:** Red border (`#EF4444`), tinted red background (`bg-red-50`), error message below in red.
- **Dark mode:** Dark background (`bg-dark-900`), lighter text, same focus ring.
- **OTP/PIN fields:** Individual 3rem × 3.5rem boxes, centred bold text, same focus treatment.

### Cards / Containers
- **Corner Style:** 1rem radius (rounded-2xl).
- **Background:** White in light mode (`#FFFFFF`), slate-blue in dark mode (`#1E293B`).
- **Shadow Strategy:** `shadow-sm` at rest, `shadow-lg` on hover for interactive cards.
- **Border:** `1px solid #E2E8F0` (light) or `#334155` (dark) on certain card variants.
- **Internal Padding:** 1rem (16px) standard; 1.5rem (24px) on stats cards.

### Navigation
- **Desktop Sidebar:** Fixed left, 16rem (w-64). White background. Active items use primary-100 background with primary-700 text. Hover items use primary-50 background.
- **Mobile Bottom Nav:** Fixed bottom, 5 items, active state uses primary-600 text colour. Includes safe-area inset padding for notched devices.
- **Nav Item:** 0.75rem rounded corners, 12px vertical padding. Transitions background and colour on hover/active.

### Modals
- **Overlay:** Black at 50% opacity (`bg-black bg-opacity-50`), or dark (`bg-dark-900/80`) in dark mode.
- **Container:** 1.5rem corner radius (rounded-3xl), `shadow-2xl`. Max width 28rem (max-w-md).
- **Header:** Bottom border separator, close button top-right (icon-only, `rounded-lg` hover target).
- **Icon Area:** 4rem circle (rounded-full), coloured background matching semantic context (blue for funding, green for success, red for error).

### Chips / Status Badges
- **Style:** `rounded-full`, small padding (`px-2 py-0.5`), `text-xs font-medium`.
- **Completed:** Green background (`bg-green-100`), green text (`text-green-800`).
- **Pending:** Yellow background, yellow text.
- **Failed:** Red background, red text.

### Toasts
- **Container:** Fixed top-right, stacked vertically, max-width 24rem.
- **Style:** `rounded-xl`, 1px border in semantic colour, `shadow-lg`. Slide-up entrance animation.
- **Semantic variants:** success (green border, green tint bg), error (red), info (blue), warning (yellow).

### Signature Component: Wallet Card
- **Style:** Gradient background (`from-secondary to-gray-800`), white text, 1rem rounded corners, 1rem padding. Decorative translucent circles at 10% opacity overlay the background.
- **Content:** Balance in large display weight, currency label, action buttons (Fund, Withdraw) inline.

## 6. Do's and Don'ts

### Do:
- **Do** lead every screen with the wallet balance — it's the single source of truth.
- **Do** use Ginto for all display and headline text; Inter for everything else.
- **Do** keep primary purple to ≤15% of any screen. When a button is purple, it should be the most important action on that screen.
- **Do** use service-category colours consistently across both icons and text labels.
- **Do** use flat surfaces with subtle shadows only on interaction.
- **Do** use the brand gradient (purple → blue) sparingly — hero CTAs, logo, loading screen.
- **Do** scale primary buttons on hover (1.02) and press (0.98) for tactile feedback.
- **Do** include `prefers-reduced-motion: reduce` fallbacks for every animation.

### Don't:
- **Don't** look like traditional Nigerian banking apps — no heavy corporate gradients, no crowded card grids, no muted official tones.
- **Don't** use cream, sand, or beige body backgrounds (the "AI default" warm tint).
- **Don't** use gradient text (`background-clip: text`) — emphasis through weight or size only.
- **Don't** use numbered section markers (01 / 02 / 03) as decorative eyebrows.
- **Don't** use border-left or border-right as coloured stripes on cards.
- **Don't** use glassmorphism or blur effects on cards as a default style.
- **Don't** use Ginto for body text, labels, or buttons.
- **Don't** place two cards inside another card (nested cards are always wrong).
- **Don't** add numbered section markers as default scaffolding (01 · About / 02 · Process).
- **Don't** let text overflow its container — test headings at every breakpoint.
