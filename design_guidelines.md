# FlowPulse Design Guidelines

## Design Approach
**System:** Custom dark-theme design with glassmorphism and gradient accents, optimized for a SaaS autonomous social media platform.

## Color System
- **Background:** Radial gradient from `#1f2937` to `#020617` (dark slate to near-black)
- **Glass surfaces:** `rgba(15,23,42,0.9)` to `rgba(15,23,42,0.6)` with 20px blur
- **Primary gradient:** Linear gradient from `#22c55e` (emerald) to `#3b82f6` (blue)
- **Accent colors:** Emerald-400, Sky-400/500, Fuchsia-400, Amber-400, Purple-500
- **Text:** Slate-100 (primary), Slate-300 (secondary), Slate-400 (tertiary)
- **Borders:** `rgba(148,163,184,0.18)` for glass, `rgba(51,65,85,0.9)` for inputs

## Typography
- **Font stack:** `system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif`
- **Hero headline:** 3xl/4xl/5xl (responsive), font-semibold, tracking-tight
- **Body text:** sm/base (responsive), slate-300
- **Small labels:** xs/[11px], uppercase tracking-[0.16em] for status indicators
- **CTAs:** sm/text-sm, font-semibold

## Spacing & Layout
- **Container:** max-w-6xl with px-4/6/8 responsive padding
- **Section padding:** pt-24 pb-20 for hero, standard vertical rhythm
- **Component gaps:** gap-2/3/4 for small elements, gap-8/10 for navigation/sections
- **Card padding:** p-3/4/5 (responsive)

## Components

### Navigation
- Fixed top bar with backdrop-blur(16px)
- Height: h-16
- Logo: 9x9 rounded gradient square with 2-letter monogram
- Links: text-sm slate-300, hover to white
- CTA: Gradient pill button with nested "60s setup" badge

### Hero Section
- Two-column grid (lg:grid-cols-[1.1fr_1fr])
- Left: Badge → Headline → Description → Feature chips → Dual CTAs → Social proof
- Right: Gradient-bordered live simulation card
- Background glow: 880px radial gradient positioned top-right

### Cards & Glass Effects
- **Glass card:** `linear-gradient(135deg, rgba(15,23,42,0.9), rgba(15,23,42,0.6))` with blur
- **Gradient border:** 1px wrapper with emerald→blue→rose gradient, inner dark background
- **Hover state:** translateY(-4px), enhanced shadow, border color shift
- **Shadow:** `0 20px 60px rgba(15,23,42,0.8)` for depth

### Buttons
- **Primary (gradient):** Emerald-to-blue gradient, dark text, rounded-full, hover brightness + lift + emerald glow shadow
- **Secondary:** Border-only (slate-600/80), rounded-full, hover bg-slate-900/80
- **Sizes:** px-4/5 py-2/2.5

### Badges & Pills
- **Badge pill:** Radial emerald/sky gradient background, rounded-full, border, text-xs
- **Status chip:** Dark background, colored border, 1.5x1.5 dot indicator
- **Toggle:** 8x4 pill with 3x3 knob, emerald background when active

### Form Inputs
- Background: `rgba(15,23,42,0.85)`
- Border: `rgba(51,65,85,0.9)`
- Focus: Blue border + glow, darker background

### Special Elements
- **Timeline line:** Linear gradient emerald→sky
- **Glow effects:** Radial gradients with sky/emerald at 0.18-0.35 opacity, blur(10px)
- **Pulse animation:** On live status dots
- **Scrollbar:** 4px thin, slate-400/40 thumb

## Interaction Patterns
- Smooth scroll behavior
- Transitions: 0.25s ease for transforms/shadows, 0.2s for inputs
- Hover elevations: -1px to -4px translateY
- Card hovers include background gradient shift

## Images
**Hero image:** Not used. Right column features an interactive live simulation card showing the platform's autonomous decision-making in real-time instead of static imagery.

## Layout Hierarchy
1. Fixed navigation (z-40)
2. Hero section with glow overlay (z-10 content, z-[-1] glow)
3. Feature sections below hero
4. All sections use max-w-6xl centered containers

## Accessibility
- Focus states with visible outlines
- Color contrast meets WCAG standards (light text on dark backgrounds)
- Smooth scroll for anchor navigation