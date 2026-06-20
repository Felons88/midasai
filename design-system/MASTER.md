# MidasAI Design System - Master

**Generated:** June 19, 2026  
**Style:** Liquid Glass Dark Luxury  
**Inspiration:** Linear, Vercel, Raycast, Stripe, Arc, Notion

---

## Design Philosophy

Premium AI Marketplace with dark luxury aesthetics, liquid glass effects, OLED-optimized colors, bento grid layouts, and motion-driven interactions. Target audience: Developers, AI Engineers, Automation Agencies, Prompt Engineers.

---

## Color System

### Primary Palette
```css
--color-primary: #1C1917;      /* Deep charcoal/black */
--color-secondary: #44403C;    /* Warm gray */
--color-cta: #CA8A04;          /* Gold accent */
--color-background: #FAFAF9;    /* Light mode background */
--color-text: #0C0A09;         /* Near black */
```

### Extended Palette
```css
/* Dark Mode Backgrounds */
--bg-primary: #09090B;          /* Deepest black */
--bg-secondary: #18181B;       /* Surface */
--bg-tertiary: #27272A;        /* Elevated surface */
--bg-card: #1C1917;             /* Card background */
--bg-glass: rgba(28, 25, 23, 0.6); /* Glass overlay */

/* Light Mode Backgrounds */
--bg-primary-light: #FFFFFF;
--bg-secondary-light: #FAFAF9;
--bg-tertiary-light: #F5F5F7;
--bg-card-light: #FFFFFF;
--bg-glass-light: rgba(255, 255, 255, 0.8);

/* Text Colors */
--text-primary: #FAFAF9;        /* Primary text dark */
--text-secondary: #A1A1AA;      /* Muted text dark */
--text-tertiary: #71717A;       /* Subtle text dark */
--text-primary-light: #0C0A09;  /* Primary text light */
--text-secondary-light: #44403C; /* Muted text light */
--text-tertiary-light: #71717A;  /* Subtle text light */

/* Accent Colors */
--accent-gold: #CA8A04;
--accent-gold-light: #EAB308;
--accent-blue: #3B82F6;
--accent-purple: #8B5CF6;
--accent-green: #10B981;
--accent-red: #EF4444;

/* Borders */
--border-primary: rgba(255, 255, 255, 0.1);
--border-secondary: rgba(255, 255, 255, 0.05);
--border-light: rgba(0, 0, 0, 0.1);
```

---

## Typography

### Font Family
```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

--font-heading: 'DM Sans', sans-serif;
--font-body: 'DM Sans', sans-serif;
```

### Type Scale
```css
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
--text-5xl: 3rem;        /* 48px */
--text-6xl: 3.75rem;     /* 60px */
```

### Line Heights
```css
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

### Font Weights
```css
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

---

## Spacing System

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

---

## Border Radius

```css
--radius-sm: 0.375rem;   /* 6px */
--radius-md: 0.5rem;     /* 8px */
--radius-lg: 0.75rem;    /* 12px */
--radius-xl: 1rem;       /* 16px */
--radius-2xl: 1.25rem;   /* 20px */
--radius-3xl: 1.5rem;    /* 24px */
--radius-full: 9999px;
```

---

## Shadows

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
--shadow-glow: 0 0 40px rgba(202, 138, 4, 0.15);
--shadow-glow-blue: 0 0 40px rgba(59, 130, 246, 0.15);
```

---

## Glassmorphism

```css
.glass-card {
  background: rgba(28, 25, 23, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-card-light {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.1);
}
```

---

## Motion System

### Transitions
```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slower: 400ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slowest: 600ms cubic-bezier(0.4, 0, 0.2, 1);
```

### Animations
```css
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

---

## Component System

### Cards
```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  transition: all var(--transition-base);
}

.card:hover {
  border-color: var(--border-secondary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl);
}

.card-glass {
  background: var(--bg-glass);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-primary);
}
```

### Buttons
```css
.btn-primary {
  background: linear-gradient(135deg, #CA8A04 0%, #EAB308 100%);
  color: #0C0A09;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  font-weight: var(--font-semibold);
  transition: all var(--transition-base);
  cursor: pointer;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-glow);
}

.btn-secondary {
  background: transparent;
  border: 1px solid var(--border-primary);
  color: var(--text-primary);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  font-weight: var(--font-medium);
  transition: all var(--transition-base);
  cursor: pointer;
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-secondary);
}
```

### Inputs
```css
.input {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  color: var(--text-primary);
  transition: all var(--transition-base);
}

.input:focus {
  outline: none;
  border-color: var(--accent-gold);
  box-shadow: 0 0 0 3px rgba(202, 138, 4, 0.1);
}

.input::placeholder {
  color: var(--text-tertiary);
}
```

---

## Layout System

### Container
```css
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 var(--space-6);
}

.container-sm {
  max-width: 1024px;
  margin: 0 auto;
  padding: 0 var(--space-6);
}
```

### Bento Grid
```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}

.bento-item-1 { grid-column: span 1; grid-row: span 1; }
.bento-item-2 { grid-column: span 2; grid-row: span 1; }
.bento-item-3 { grid-column: span 2; grid-row: span 2; }
.bento-item-4 { grid-column: span 1; grid-row: span 2; }
```

---

## Visual Effects

### Noise Texture
```css
.noise-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  z-index: 9999;
}
```

### Spotlight
```css
.spotlight {
  position: absolute;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(202, 138, 4, 0.15) 0%, transparent 70%);
  pointer-events: none;
  filter: blur(80px);
}
```

### Ambient Glow
```css
.ambient-glow {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle at 20% 30%, rgba(202, 138, 4, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(59, 130, 246, 0.05) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}
```

---

## Page Patterns

### Landing Page
1. **Hero Section** - Large typography, ambient glow, floating elements
2. **Bento Grid Features** - Modular feature showcase with glass cards
3. **Social Proof** - Trusted by logos, testimonials
4. **CTA Section** - Strong call-to-action with gold accent
5. **Footer** - Minimal, dark

### Marketplace
1. **Search Bar** - Floating, glass effect
2. **Filter Sidebar** - Collapsible, glass panels
3. **Listing Grid** - Bento layout, hover elevation
4. **Listing Cards** - Glass cards, premium shadows

### Creator Dashboard
1. **Stats Overview** - Bento grid layout
2. **Charts** - Dark mode, gold accents
3. **Listings Table** - Glass rows, hover effects
4. **Quick Actions** - Floating action buttons

---

## Anti-Patterns to Avoid

- ❌ Generic blue gradients
- ❌ Default card styling
- ❌ Default buttons
- ❌ Generic hero sections
- ❌ Cheap animations (too fast, bouncy)
- ❌ Low contrast text
- ❌ Missing hover states
- ❌ No cursor-pointer on interactive elements
- ❌ Emojis as icons (use SVG: Heroicons/Lucide)
- ❌ Layout shift on hover
- ❌ Horizontal scroll on mobile

---

## Pre-Delivery Checklist

- [ ] No emojis as icons (use SVG: Heroicons/Lucide)
- [ ] cursor-pointer on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard nav
- [ ] prefers-reduced-motion respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
- [ ] Glass effects visible in both modes
- [ ] Premium shadows and glow effects
- [ ] Consistent spacing and typography
- [ ] All pages follow design system

---

## Implementation Priority

1. **Global Styles** - Tailwind config, global CSS
2. **Components** - Reusable UI components
3. **Layout Pages** - Landing, Marketplace, Dashboard
4. **Detail Pages** - Listing, Creator Profile
5. **Utility Pages** - Auth, Settings, Checkout
