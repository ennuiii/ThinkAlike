# ThinkAlike - Unified Responsive Design Guide

**Version:** 2.0 (Merged Edition)
**Date:** 2025-11-14
**Platform:** ThinkAlike (2-Player Word-Sync Game)
**Viewport Range:** 280px (ultra-small edge case) → 3840px (4K displays)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Assessment](#current-state-assessment)
3. [Recommended Architecture](#recommended-architecture)
4. [Responsive Design Strategies](#responsive-design-strategies)
5. [Component Patterns](#component-patterns)
6. [ASCII Viewport Designs](#ascii-viewport-designs)
7. [Critical Fixes Required](#critical-fixes-required)
8. [Implementation Roadmap](#implementation-roadmap)
9. [Testing Matrix](#testing-matrix)
10. [Code Examples](#code-examples)

---

## Executive Summary

ThinkAlike is a real-time multiplayer word-sync game built with React, TypeScript, TailwindCSS, and WebRTC video integration. The game has a solid responsive foundation but requires strategic improvements to provide an optimal mobile-first experience.

### Key Findings

**Existing Strengths:**
- ✅ Mobile-first CSS architecture
- ✅ Comprehensive breakpoint system (480px, 768px, 1024px, 1366px, 1920px)
- ✅ Safe area inset support for notched devices
- ✅ Touch-optimized targets (44-48px minimum)
- ✅ Theme-aware design system (Neural Sync + Thought Bubble)
- ✅ WebRTC video chat integration

**Critical Issues Identified:**
- ❌ **Z-Index Chaos** - No centralized management (scattered values: 995-10000)
- ❌ **Mobile Space Crunch** - Game content gets only 25% of screen with always-visible sidebars
- ❌ **Navigation Gaps** - No persistent primary navigation on mobile; FABs alone insufficient
- ❌ **Webcam Inefficiency** - Always takes ~220px height; idle feeds waste vertical space
- ❌ **Emoji Rendering Bugs** - Multiple components render `�` characters on mobile
- ❌ **Keyboard Overlap** - CTAs hidden when keyboard opens on mobile
- ❌ **Fixed Positioning Conflicts** - Multiple fixed elements may overlap on small screens
- ❌ **Typography Overflow** - Large headings (3.5rem) break on ultra-small screens (<320px)
- ❌ **Tablet Gap** - Awkward sizing between 1024-1365px breakpoints
- ❌ **Inconsistent Spacing** - Mix of px literals, rem, and Tailwind units
- ❌ **Settings Collision** - Modals spawn centered and collide with webcam row

### Key Recommendation: Dual Shell + Hybrid Navigation

**The Problem:** Original mobile design cramped game content into ~25% of screen space, with no persistent primary navigation and scattered secondary actions.

**The Solution:** Implement a dual shell architecture with hybrid navigation:
- **Bottom Tab Bar** (primary navigation - always visible)
- **FAB Cluster** (secondary actions - Theme, Settings)
- **Hero Carousel Webcam** (swipeable, auto-hide empty slots)
- **Mobile Drawers** (Chat, Players accessed via tabs with badges)

**Result:** Game content now occupies **~75% of screen space** with clear, discoverable navigation.

```
BEFORE (Cramped):              AFTER (Game-First + Navigation):
[Webcam - 120px]              [Status bar - 44px]
[Game - 167px] ❌              [Game - 480px] ✅
[Sidebar - 320px]
                               [Bottom tabs: Game|Video|Chat|Players]
Game: 167/667 = 25%            [FABs: Theme, Settings]

                               Game: 480/667 = 72%
```

### Design Philosophy

This unified guide synthesizes two comprehensive approaches:
1. **RESPONSIVE-DESIGN-GUIDE.md** - Detailed documentation with comprehensive ASCII diagrams and testing matrices
2. **mobile-responsive-plan.md** - Modern patterns (dual shells, bottom tabs, Lucide icons, dvh units)

The result is a single, implementable standard for responsive ThinkAlike experiences from 280px→3840px.

---

## Current State Assessment

### CSS Architecture

```
client/src/
├── index.css                       # Tailwind base + utilities
├── App.css                         # Theme system + global layout
├── styles/
│   ├── responsive.css             # Mobile-first media queries
│   ├── mobile.css                 # Mobile-specific components
│   └── game.css                   # Game-specific styles
├── components/
│   ├── Home.tsx
│   ├── Lobby.tsx
│   ├── GameComponent.tsx
│   ├── WebcamDisplay.tsx          # 1917 lines - complex!
│   ├── ChatWindow.tsx
│   ├── PlayerList.tsx
│   ├── TextModeInput.tsx
│   ├── VoiceModeInput.tsx
│   ├── RevealScreen.tsx
│   ├── VictoryScreen.tsx
│   ├── GameOverScreen.tsx
│   └── [game screens & overlays]
```

### Current Breakpoints

| Breakpoint | Context | Font-Size | Use Case |
|-----------|---------|-----------|----------|
| ≤480px | Mobile Portrait | 14px | iPhone SE, small phones |
| 481-768px | Mobile Landscape | 15px | Landscape mode |
| 768-1023px | Tablet Portrait | 16px | iPad portrait |
| 1024-1365px | Tablet Landscape | 16px | iPad landscape, small laptops |
| 1366-1919px | Desktop | 16-17px | Standard HD displays |
| 1920px+ | Large Desktop | 18px | Retina, 4K displays |

### Z-Index Issues Found

```css
/* Values scattered across codebase - no centralization */
/* Multiple components compete at z-index 9999 causing conflicts */
--z-theme-toggle: 995;
--z-game-controls: 996;
--z-chat-mobile: 997;
--z-drawer: 998;
--z-webcam-toggle: 999;
--z-mobile-nav: 1000;
--z-round-start-overlay: 9999;    /* TOO HIGH! Blocks other overlays */
--z-mobile-toast: 10000;
--z-skip-link: 10001;
```

### Mobile Pain Points Analysis

**Global Shell Issues:**
- Desktop flex row in `src/App.tsx` simply stacks on mobile
- PlayerList/Chat never rendered in compact form; always full-height
- WebcamDisplay takes ~220px and only collapses with tiny toggle
- Idle webcam feeds and blank slots consume space even when not needed

**Game Screen Issues:**
- TextModeInput/VoiceModeInput use gigantic fixed typography (game.css)
- Keyboards hide CTAs and instructions spill off-screen
- Word history hidden on mobile (hidden lg:block) preventing progress tracking
- Reveal/Victory screens assume >768px width; stats and buttons hop around

**Icon & Emoji Issues:**
- LivesDisplay, VoiceModeInput, VictoryScreen, SettingsModal render emoji as `�`
- No cross-platform icon guarantee
- Undermines polish on mobile chat contexts

**Settings & Controls Issues:**
- SettingsButton FAB ignores safe areas
- SettingsModal spawns centered and collides with webcam row
- Multiple fixed elements fight for space

---

## Recommended Architecture

### 1. Dual Shell Strategy

Instead of a single responsive component tree, separate mobile and desktop shells:

```typescript
// useDeviceType hook
export const useDeviceType = () => {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) setDeviceType('mobile');
      else if (width < 1024) setDeviceType('tablet');
      else setDeviceType('desktop');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceType;
};

// In App.tsx
export default function App() {
  const deviceType = useDeviceType();

  return (
    <>
      {deviceType === 'mobile' && <MobileShell />}
      {deviceType === 'desktop' && <DesktopShell />}
    </>
  );
}
```

**Benefits:**
- Cleaner separation of concerns
- Easier to maintain distinct UX patterns
- No fighting with CSS media queries
- Easier to test mobile vs desktop flows

### 2. Hybrid Navigation System

**Mobile Navigation (Primary + Secondary):**
- **Bottom Tab Bar**: Game, Video, Chat, Players (primary navigation)
- **FAB Cluster**: Theme Toggle, Settings (secondary actions)
- **Drawers**: Chat and Players open as sheets from tabs

**Tablet Navigation:**
- Hybrid: Bottom tab bar + visible sidebar (300px)
- Video/Chat in drawers or sidebar depending on space

**Desktop Navigation:**
- Traditional layout: Webcam bar + sidebar visible
- Tab bar hidden (desktop has space for UI)
- FABs hidden (not needed)

### 3. Enhanced Breakpoint System

```css
/* Ultra-small (Edge cases) */
280px - 374px     → Ultra-compact layout, minimal chrome
                  → Min font: 14px
                  → Single-column, stacked components

/* Mobile Portrait (Primary mobile target) */
375px - 480px     → iPhone SE, iPhone 12/13/14 mini
                  → Base font: 14px
                  → Single column, game-first with tabs + FABs

/* Mobile Landscape / Small Tablet */
481px - 767px     → Mobile landscape, small tablets
                  → Base font: 15px
                  → Carousel webcam, hidden sidebars with tabs

/* Tablet Portrait */
768px - 1023px    → iPad Portrait, Android tablets
                  → Base font: 16px
                  → 2-column: game + sidebar visible
                  → Video/Chat in drawers or sidebar

/* Tablet Landscape / Small Desktop */
1024px - 1199px   → iPad Landscape, small laptops
                  → Base font: 16px
                  → 3-column layouts, increased spacing
                  → NEW BREAKPOINT (fills the gap!)

/* Desktop */
1200px - 1365px   → Standard desktop (1280x720, 1366x768)
                  → Base font: 16px
                  → Max-width containers, max spacing

/* Large Desktop */
1366px - 1919px   → Full HD (1920x1080)
                  → Base font: 17px
                  → Generous spacing, max-width: 1400px

/* Extra-Large Desktop */
1920px - 2559px   → Retina displays, 4K at 150% zoom
                  → Base font: 18px
                  → Max-width constraints

/* Ultra-Wide / 4K */
2560px+           → 4K displays, ultra-wide monitors
                  → Base font: 20px
                  → Center-aligned max-width containers
```

### 4. Modern Standards Adoption

**Dynamic Viewport Height (dvh):**
```css
/* Handles iOS Safari address bar collapse */
.app-root {
  min-height: 100dvh;  /* Instead of 100vh */
}
```

**Accessible Motion:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Performance Mode for Touch:**
```css
@media (hover: none) and (pointer: coarse) {
  /* Disable expensive animations on touch devices */
  .animated-background {
    animation: none;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  }
}
```

---

## 3.5. TailwindCSS Breakpoint Strategy

ThinkAlike uses TailwindCSS breakpoints aligned with responsive design:

```css
sm:  640px    /* Small tablets, landscape phones */
md:  768px    /* iPad portrait, tablets */
lg: 1024px    /* iPad landscape, small desktops */
xl: 1280px    /* Standard desktop (1280x720) */
2xl: 1536px   /* Large desktop, 4K at zoom */
```

**Enhancement:** Add intermediate 1200px breakpoint for better tablet transition:

```css
/* Custom breakpoint for tablet→desktop transition */
@media (min-width: 1200px) and (max-width: 1365px) {
  .right-sidebar { width: 350px; }
  .main-container { padding: 1.75rem; }
  .webcam-item { max-width: 150px; }
}
```

---

## 3.6. Safe Area & Touch Handling

### Safe Area Inset Implementation

For notched devices (iPhone X+, Android), use environment variables:

```css
:root {
  /* Safe areas for notched devices */
  --safe-bottom: max(1rem, env(safe-area-inset-bottom));
  --safe-left: max(1rem, env(safe-area-inset-left));
  --safe-right: max(1rem, env(safe-area-inset-right));
  --safe-top: max(1rem, env(safe-area-inset-top));
}

/* Example: Fixed bottom element with safe area */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding-bottom: var(--safe-bottom);
  /* Total height includes padding */
}

/* Example: FAB positioned for notched devices */
.fab-cluster {
  position: fixed;
  bottom: var(--safe-bottom);
  right: var(--safe-right);
}
```

### Viewport Height (dvh) for Mobile

iOS Safari's address bar collapse causes layout shift with `100vh`. Use `100dvh`:

```css
/* BEFORE - breaks on iOS */
.app-root { height: 100vh; }

/* AFTER - handles iOS address bar */
:root {
  --viewport-height: 100dvh;
  --viewport-width: 100dvw;
}

.app-root {
  min-height: 100dvh;
}

.fullscreen-overlay {
  position: fixed;
  inset: 0;
  height: 100dvh;
}
```

### Touch Target Optimization

All interactive elements must be at least 48px on touch devices:

```css
/* Base minimum */
button, a, [role="button"] {
  min-height: 44px;
  min-width: 44px;
}

/* Enhanced on touch devices */
@media (hover: none) and (pointer: coarse) {
  button, a, [role="button"] {
    min-height: 48px;
    min-width: 48px;
    padding: 12px 16px;
  }
}
```

---

## Responsive Design Strategies

### 1. Typography Scaling Strategy

Use CSS `clamp()` for fluid typography that scales smoothly across all viewports:

```css
:root {
  /* Fluid typography */
  --font-size-base: clamp(14px, 2vw, 16px);
  --font-size-h1: clamp(2rem, 5vw, 4rem);
  --font-size-h2: clamp(1.5rem, 3.5vw, 2.5rem);
  --font-size-h3: clamp(1.25rem, 2.5vw, 1.75rem);
  --font-size-input: clamp(1.25rem, 3vw, 2.5rem);

  /* Line heights */
  --line-height-tight: 1.2;
  --line-height-normal: 1.6;
  --line-height-relaxed: 1.8;
}

/* Apply to actual elements */
h1 {
  font-size: var(--font-size-h1);
  line-height: var(--line-height-tight);
}

.word-input {
  font-size: var(--font-size-input);
  padding: clamp(1rem, 3vw, 2rem);
}

/* Safeguard ultra-small screens */
@media (max-width: 320px) {
  h1 { font-size: 1.75rem !important; }
  .word-input { font-size: 1.125rem !important; }
  /* Prevent iOS zoom */
  input { font-size: 16px !important; }
}
```

**Benefits:**
- Scales smoothly without media query cliffs
- Automatically adjusts for device width
- Respects user browser zoom
- Prevents typography overflow

### 2. Z-Index Management System

Create centralized z-index constants file: `src/styles/z-index-constants.css`

```css
:root {
  /* Background layers */
  --z-background: -2;
  --z-background-grid: -1;

  /* Content layers */
  --z-content: 1;
  --z-webcam: 10;
  --z-game: 20;

  /* UI elements (Mobile FABs, buttons, toggles) */
  --z-theme-toggle: 995;
  --z-settings-fab: 996;
  --z-chat-drawer-backdrop: 997;
  --z-mobile-drawer: 998;
  --z-mobile-fab-cluster: 999;
  --z-mobile-nav: 1000;

  /* Critical overlays (countdown, modals) */
  --z-modal-backdrop: 9998;
  --z-round-start-overlay: 9999;
  --z-mobile-toast: 10000;

  /* Accessibility (always highest) */
  --z-skip-link: 10001;
}

/* Usage in components */
.round-start-overlay {
  z-index: var(--z-round-start-overlay);
}

.mobile-fab-cluster {
  z-index: var(--z-mobile-fab-cluster);
}

.mobile-drawer {
  z-index: var(--z-mobile-drawer);
}

.mobile-drawer-backdrop {
  z-index: calc(var(--z-mobile-drawer) - 1);
}
```

**Update all files to use these constants instead of hardcoded values.**

### 3. Spacing Scale Standardization

Replace scattered `20px`, `1rem`, `0.75rem` with consistent scale:

```css
:root {
  /* Spacing scale (4px units) */
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
  --spacing-xl: 2rem;      /* 32px */
  --spacing-2xl: 3rem;     /* 48px */
  --spacing-3xl: 4rem;     /* 64px */

  /* Safe areas for notched devices */
  --safe-bottom: max(var(--spacing-md), env(safe-area-inset-bottom));
  --safe-left: max(var(--spacing-md), env(safe-area-inset-left));
  --safe-right: max(var(--spacing-md), env(safe-area-inset-right));
  --safe-top: max(var(--spacing-md), env(safe-area-inset-top));
}

/* Usage */
.mobile-fab-cluster {
  position: fixed;
  bottom: var(--safe-bottom);
  right: var(--safe-right);
  gap: var(--spacing-sm);
}

.container {
  padding: var(--spacing-lg);
  max-width: 1200px;
}

.mobile-nav {
  padding-bottom: var(--safe-bottom);
}
```

### 4. Touch vs Mouse Optimizations

```css
/* Base touch targets */
button, a, .clickable {
  min-height: 44px;
  min-width: 44px;
}

/* Increase on actual touch devices */
@media (hover: none) and (pointer: coarse) {
  button, a, .clickable {
    min-height: 48px;
    min-width: 48px;
    padding: var(--spacing-md);
  }

  /* Remove hover effects (no mouse) */
  button:hover {
    transform: none !important;
    box-shadow: initial !important;
  }

  /* Add active (tap) feedback instead */
  button:active {
    transform: scale(0.95);
    opacity: 0.8;
    transition: transform 0.1s ease;
  }
}

/* Prevent iOS zoom on input focus */
@supports (-webkit-touch-callout: none) {
  input[type="text"],
  input[type="email"],
  textarea {
    font-size: 16px !important;
  }
}
```

### 5. Performance Optimizations

```css
/* Disable expensive animations on mobile */
@media (max-width: 768px) {
  .disable-mobile-animation {
    animation: none !important;
    transition: opacity 0.15s ease !important;
  }

  /* Reduce backdrop blur for performance */
  .mobile-no-blur {
    backdrop-filter: none !important;
    background: var(--panel-bg) !important;
  }

  /* Optimize scrolling */
  .mobile-scroll {
    -webkit-overflow-scrolling: touch;
    will-change: scroll-position;
  }
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Component Patterns

### 1. Navigation Components

#### Bottom Tab Bar Component

```typescript
// BottomTabBar.tsx
import { Gamepad2, Video, MessageSquare, Users } from 'lucide-react';

interface TabConfig {
  id: 'game' | 'video' | 'chat' | 'players';
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

export const BottomTabBar = ({
  activeTab,
  onTabChange,
  badges = {}
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  badges?: Record<string, number>;
}) => {
  const tabs: TabConfig[] = [
    { id: 'game', icon: <Gamepad2 />, label: 'Game' },
    { id: 'video', icon: <Video />, label: 'Video', badge: badges.video },
    { id: 'chat', icon: <MessageSquare />, label: 'Chat', badge: badges.chat },
    { id: 'players', icon: <Users />, label: 'Players', badge: badges.players }
  ];

  return (
    <div className="bottom-tab-bar">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
          aria-label={tab.label}
        >
          <div className="tab-icon">{tab.icon}</div>
          {tab.badge && <span className="badge">{tab.badge}</span>}
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};
```

```css
/* bottom-tab-bar.css */
.bottom-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--bg-card);
  border-top: 1px solid var(--panel-border);
  display: flex;
  justify-content: space-around;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: var(--z-mobile-nav);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  color: var(--text-muted);
  background: none;
  border: none;
  cursor: pointer;
  position: relative;
  transition: color 0.2s ease;
}

.tab-item.active {
  color: var(--primary);
}

.tab-icon {
  font-size: 1.5rem;
}

.tab-label {
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge {
  position: absolute;
  top: 4px;
  right: 8px;
  background: var(--danger);
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 0.625rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
```

#### FAB Cluster Component (Secondary Actions Only)

```typescript
// FABCluster.tsx
import { Sun, Settings } from 'lucide-react';

export const FABCluster = ({
  onThemeToggle,
  onSettings
}: {
  onThemeToggle: () => void;
  onSettings: () => void;
}) => {
  return (
    <div className="fab-cluster">
      <button
        className="fab"
        onClick={onThemeToggle}
        aria-label="Toggle theme"
        title="Toggle theme"
      >
        <Sun size={24} />
      </button>
      <button
        className="fab"
        onClick={onSettings}
        aria-label="Settings"
        title="Settings"
      >
        <Settings size={24} />
      </button>
    </div>
  );
};
```

```css
/* fab-cluster.css */
.fab-cluster {
  position: fixed;
  bottom: max(20px, env(safe-area-inset-bottom));
  right: max(20px, env(safe-area-inset-right));
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  z-index: var(--z-mobile-fab-cluster);
}

.fab {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.fab:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5);
}

.fab:active {
  transform: scale(0.95);
}
```

### 2. Webcam System

#### Hero Carousel (Mobile)

```typescript
// WebcamCarousel.tsx
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface WebcamCarouselProps {
  feeds: Array<{ id: string; name: string; stream?: MediaStream }>;
  onFullscreen?: () => void;
}

export const WebcamCarousel = ({ feeds, onFullscreen }: WebcamCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prev = () => setCurrentIndex((i) => (i - 1 + feeds.length) % feeds.length);
  const next = () => setCurrentIndex((i) => (i + 1) % feeds.length);

  // Filter out empty feeds
  const activeFeds = feeds.filter(f => f.stream);
  if (activeFeds.length === 0) return null;

  const current = activeFeds[currentIndex];

  return (
    <div className="webcam-carousel">
      <div className="carousel-dots">
        {activeFeds.map((_, idx) => (
          <div
            key={idx}
            className={`dot ${idx === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(idx)}
          />
        ))}
      </div>

      <div className="carousel-content" onClick={onFullscreen}>
        <video
          key={current.id}
          autoPlay
          muted
          playsInline
          className="carousel-video"
        />
        <span className="carousel-label">{current.name}</span>
      </div>

      {activeFeds.length > 1 && (
        <>
          <button className="carousel-nav prev" onClick={prev}>
            <ChevronLeft size={20} />
          </button>
          <button className="carousel-nav next" onClick={next}>
            <ChevronRight size={20} />
          </button>
        </>
      )}
    </div>
  );
};
```

```css
/* webcam-carousel.css */
.webcam-carousel {
  position: relative;
  width: 100%;
  max-width: 100%;
  aspect-ratio: 4/3;
  background: var(--bg-darker);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.carousel-content {
  position: relative;
  width: 100%;
  height: 100%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.carousel-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.carousel-label {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 4px;
}

.carousel-dots {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
  z-index: 10;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.2s ease;
}

.dot.active {
  background: white;
  width: 24px;
  border-radius: 4px;
}

.carousel-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
  z-index: 11;
}

.carousel-nav:hover {
  background: rgba(0, 0, 0, 0.7);
}

.carousel-nav.prev {
  left: 8px;
}

.carousel-nav.next {
  right: 8px;
}

/* Only show on mobile */
@media (min-width: 768px) {
  .webcam-carousel {
    display: none;
  }
}
```

#### Full Desktop Webcam Bar (Unchanged)

Desktop webcam bar remains as-is: full-width at top with grid layout.

### 3. Mobile Drawer Component

```typescript
// MobileDrawer.tsx
interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  position?: 'bottom' | 'right';
}

export const MobileDrawer = ({
  open,
  onClose,
  title,
  children,
  position = 'bottom'
}: MobileDrawerProps) => {
  return (
    <>
      {open && (
        <div className="drawer-backdrop" onClick={onClose} />
      )}
      <div className={`mobile-drawer ${position} ${open ? 'open' : ''}`}>
        <div className="drawer-handle" />
        <div className="drawer-header">
          <h3>{title}</h3>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        <div className="drawer-content">
          {children}
        </div>
      </div>
    </>
  );
};
```

```css
/* mobile-drawer.css */
.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: calc(var(--z-mobile-drawer) - 1);
  animation: fadeIn 0.2s ease;
}

.mobile-drawer {
  position: fixed;
  background: var(--bg-card);
  z-index: var(--z-mobile-drawer);
  transition: transform 0.3s ease;
}

/* Bottom drawer (webcam, etc.) */
.mobile-drawer.bottom {
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 40vh;
  border-radius: 20px 20px 0 0;
  transform: translateY(100%);
}

.mobile-drawer.bottom.open {
  transform: translateY(0);
}

/* Side drawer (players, chat) */
.mobile-drawer.right {
  top: 0;
  right: 0;
  bottom: 0;
  width: 85vw;
  max-width: 350px;
  transform: translateX(100%);
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.3);
}

.mobile-drawer.right.open {
  transform: translateX(0);
}

.drawer-handle {
  width: 40px;
  height: 4px;
  background: var(--text-muted);
  border-radius: 2px;
  margin: 12px auto;
  opacity: 0.5;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--panel-border);
  gap: var(--spacing-sm);
}

.drawer-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drawer-content {
  overflow-y: auto;
  max-height: calc(100% - 80px);
  -webkit-overflow-scrolling: touch;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### 4. Shell Components

#### MobileShell

```typescript
// MobileShell.tsx
import { useState, useEffect } from 'react';
import { BottomTabBar } from './BottomTabBar';
import { FABCluster } from './FABCluster';
import { GameComponent } from './GameComponent';
import { ChatWindow } from './ChatWindow';
import { PlayerList } from './PlayerList';
import { WebcamCarousel } from './WebcamCarousel';

export const MobileShell = ({ gameState, onReturn }) => {
  const [activeTab, setActiveTab] = useState<'game' | 'video' | 'chat' | 'players'>('game');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  // Auto-close drawers when game state changes
  useEffect(() => {
    setActiveTab('game');
  }, [gameState]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'game':
        return <GameComponent gameState={gameState} onReturn={onReturn} />;
      case 'video':
        return <WebcamCarousel feeds={gameState.players} />;
      case 'chat':
        return <ChatWindow messages={gameState.chat} />;
      case 'players':
        return <PlayerList players={gameState.players} />;
    }
  };

  return (
    <div className="mobile-shell">
      {/* Main content area */}
      <div className="shell-content" style={{ paddingBottom: '56px' }}>
        {renderTabContent()}
      </div>

      {/* Bottom navigation */}
      <BottomTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        badges={{
          video: gameState.players.length,
          chat: gameState.unreadMessages,
          players: gameState.players.length
        }}
      />

      {/* FABs for secondary actions */}
      <FABCluster
        onThemeToggle={() => setThemeOpen(!themeOpen)}
        onSettings={() => setSettingsOpen(!settingsOpen)}
      />

      {/* Settings modal */}
      {settingsOpen && (
        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
};
```

#### DesktopShell

```typescript
// DesktopShell.tsx
export const DesktopShell = ({ gameState, onReturn }) => {
  return (
    <div className="desktop-shell">
      {/* Webcam bar - full width */}
      <div className="webcam-bar">
        <WebcamDisplay feeds={gameState.players} />
      </div>

      {/* Main layout - 3 column */}
      <div className="shell-layout">
        <aside className="left-sidebar">
          <PlayerList players={gameState.players} />
        </aside>

        <main className="main-content">
          <GameComponent gameState={gameState} onReturn={onReturn} />
        </main>

        <aside className="right-sidebar">
          <ChatWindow messages={gameState.chat} />
        </aside>
      </div>
    </div>
  );
};
```

```css
/* desktop-shell.css */
.desktop-shell {
  display: flex;
  flex-direction: column;
  height: 100dvh;
}

.webcam-bar {
  flex-shrink: 0;
  height: 140px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--panel-border);
  padding: var(--spacing-md);
  overflow-x: auto;
}

.shell-layout {
  flex: 1;
  display: grid;
  grid-template-columns: 300px 1fr 384px;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  overflow-y: auto;
}

.left-sidebar,
.right-sidebar {
  height: fit-content;
}

.main-content {
  flex: 1;
}
```

---

## ASCII Viewport Designs

### Screen 1: HOME SCREEN

#### Mobile Portrait (375px)
```
┌─────────────────────────────────┐
│                                 │ 20px
│  ┌─────────────────────────┐   │
│  │  THINKALIKE             │   │ Logo + brand
│  │  Live Word Sync         │   │
│  └─────────────────────────┘   │
│                                 │
│  Team up with your brain twin,  │ Tagline
│  think in sync, trust your      │
│  instincts before time fades    │
│                                 │
│  ┌─────────────────────────┐   │
│  │ [CREATE] | [JOIN]       │   │ Segmented control
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Your Name               │   │
│  │ ┌────────────────────┐  │   │
│  │ │ Player nickname... │  │   │ Input
│  │ └────────────────────┘  │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Room Code (Join only)   │   │
│  │ ┌────────────────────┐  │   │
│  │ │ ABCD...            │  │   │
│  │ └────────────────────┘  │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │   CREATE ROOM  →        │   │ Primary CTA
│  └─────────────────────────┘   │
│                                 │
│  Streamer-friendly • No ads     │ Trust indicators
│  2-player sync challenge        │
│                                 │
└─────────────────────────────────┘
                            [Sun] [Cog] ← FABs (theme, settings)
```

#### Tablet Portrait (768px)
```
┌───────────────────────────────────────────────────────┐
│  [Sun]                                          [Cog]  │
│                                                       │
│              ┌─────────────────┐                      │
│              │  LIVE WORD SYNC │                      │
│              └─────────────────┘                      │
│                                                       │
│                   THINKALIKE                          │
│                   ▀▀▀▀▀▀▀▀▀▀▀▀                        │
│                                                       │
│       Team up with your brain twin, think in sync    │
│            and trust your instincts                   │
│                                                       │
│         ┌────────────────────────────────┐           │
│         │  [CREATE]   │   [JOIN]        │           │ Horizontal toggle
│         └────────────────────────────────┘           │
│                                                       │
│         ┌──────────────┐  ┌──────────────┐          │
│         │ Your Name    │  │ Room Code    │          │ Inline inputs
│         │ ┌──────────┐ │  │ ┌──────────┐ │          │
│         │ │          │ │  │ │          │ │          │
│         │ └──────────┘ │  │ └──────────┘ │          │
│         └──────────────┘  └──────────────┘          │
│                                                       │
│              ┌──────────────────┐                    │
│              │  [CREATE ROOM]   │                    │
│              └──────────────────┘                    │
│                                                       │
└───────────────────────────────────────────────────────┘
```

#### Desktop (1366px)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Sun]                                                                 [Cog] │
│                                                                             │
│                          ┌─────────────────┐                               │
│                          │  LIVE WORD SYNC │                               │
│                          └─────────────────┘                               │
│                                                                             │
│                              THINKALIKE                                     │
│                              ▀▀▀▀▀▀▀▀▀▀▀▀                                  │
│                                                                             │
│              Team up with your brain twin, think in perfect sync,          │
│                   and trust your instincts before the timer fades          │
│                                                                             │
│                    ┌────────────────────────────────┐                      │
│                    │  [CREATE]   │   [JOIN]        │                      │
│                    └────────────────────────────────┘                      │
│                                                                             │
│              ┌──────────────┐              ┌──────────────┐               │
│              │  Your Name   │              │  Room Code   │               │
│              │ ┌──────────┐ │              │ ┌──────────┐ │               │
│              │ │          │ │              │ │          │ │               │
│              │ └──────────┘ │              │ └──────────┘ │               │
│              └──────────────┘              └──────────────┘               │
│                                                                             │
│                         ┌──────────────────┐                               │
│                         │  [CREATE ROOM]   │                               │
│                         └──────────────────┘                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Screen 2: LOBBY SCREEN

#### Mobile Portrait (375px) - FAB + TABS
```
┌─────────────────────────────────┐
│  Room: ABCD  [Copy] [Share]     │ Sticky header
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐ │
│  │ ●────○────○  Hero Webcam │ │ Carousel with dots
│  │  [Player 1 feed]          │ │ Swipe to see P2
│  │   160×120                  │ │ Auto-hide if empty
│  └───────────────────────────┘ │
│      ↔ Swipe for Player 2      │
│                                 │
│  ┌─────────────────────────┐   │
│  │ ✓ Host: You             │   │ Status card
│  │   Waiting for 1 more... │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Ready Checklist:        │   │ Collapsible
│  │ ✓ 2 players needed      │   │
│  │ ○ Both ready            │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │   READY UP! ✓           │   │ Primary action
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ ▼ Settings              │   │ Accordion (host)
│  │   Timer: 60s            │   │
│  │   Lives: 5              │   │
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ [Gamepad] [Video] [Chat] [Users]│ Bottom tabs
│    Game      2      5      2    │ With badges
└─────────────────────────────────┘
                            [Sun] [Cog] ← FABs
```

#### Mobile - Players Tab Active
```
┌─────────────────────────────────┐
│  Players (2/2)         [Close]  │ Drawer header
│  ══════════════════════          │ Swipe handle
│                                 │
│  ┌─────────────────────────┐   │
│  │ 🟢 Player 1 (You)       │   │
│  │    HOST  ✓ Ready        │   │ Player card
│  │    [Promote] [Kick]     │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 🟢 Player 2             │   │
│  │    ✓ Ready              │   │ Player card
│  │    [Promote] [Kick]     │   │
│  └─────────────────────────┘   │
│                                 │
│  (Scrollable if more players)   │
│                                 │
│                                 │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ [Gamepad] [Video] [Chat] [Users]│ Tab bar
│    Game      2      5      ●    │ Users active
└─────────────────────────────────┘
```

#### Desktop (1366px)
```
┌────────────────────────────────────────────────────────────────────────────┐
│  [Sun]                                                                 [Cog]│
├────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────┐  ┌──────────────────────┐│
│ │              LOBBY SYNC                       │  │ ┌──────────────────┐ ││
│ │              THINKALIKE                       │  │ │ 🟢 Player 1      │ ││
│ │              ▀▀▀▀▀▀▀▀▀▀▀▀                    │  │ │    HOST  ✓ Ready │ ││
│ │                                               │  │ └──────────────────┘ ││
│ │       Think the same word. Stay in sync.     │  │ ┌──────────────────┐ ││
│ │                                               │  │ │ 🟢 Player 2      │ ││
│ │       ┌─────────────────────────────────┐    │  │ │    ✓ Ready       │ ││
│ │       │   Room Code: ABCD1234           │    │  │ └──────────────────┘ ││
│ │       │   (glowing, centered, 5xl)      │    │  ├──────────────────────┤│
│ │       │                                 │    │  │                      ││
│ │       │   Share this code with your     │    │  │  💬 Chat Window      ││
│ │       │   opponent!                     │    │  │  ──────────────      ││
│ │       │                                 │    │  │  [Messages here]     ││
│ │       │   [COPY JOIN LINK]              │    │  │                      ││
│ │       └─────────────────────────────────┘    │  │  [Message input]     ││
│ │                                               │  │                      ││
│ │       ┌─────────────────────────────────┐    │  └──────────────────────┘│
│ │       │  Players (2/2)  ✓               │    │                          │
│ │       │  ─────────────────────────────  │    │                          │
│ │       │  Player 1  Player 2             │    │                          │
│ │       │  (side by side cards)           │    │                          │
│ │       └─────────────────────────────────┘    │                          │
│ │                                               │                          │
│ │              [READY UP!]                      │                          │
│ │                                               │                          │
│ │            [🚀 START GAME!]                   │                          │
│ │                                               │                          │
│ │       ┌─────────────────────────────────┐    │                          │
│ │       │ ▼ Game Settings                 │    │                          │
│ │       │   Timer: 60s  |  Lives: 5       │    │                          │
│ │       │   Voice Mode: OFF               │    │                          │
│ │       └─────────────────────────────────┘    │                          │
│ │                                               │                          │
│ └──────────────────────────────────────────────┘  └──────────────────────┘│
└────────────────────────────────────────────────────────────────────────────┘
```

---

### Screen 3: ROUND PREP (3-2-1 COUNTDOWN)

#### All Viewports - Fullscreen Overlay
```
Mobile (375px):                      Desktop (1366px):
┌───────────────────┐               ┌──────────────────────────────────────┐
│                   │               │                                      │
│                   │               │                                      │
│                   │               │                                      │
│   ROUND 3         │               │               ROUND 3                │
│                   │               │                                      │
│                   │               │                                      │
│      ┌───┐        │               │                  ┌───┐               │
│      │   │        │               │                  │   │               │
│      │ 3 │        │               │                  │ 3 │               │
│      │   │        │               │                  │   │               │
│      └───┘        │               │                  └───┘               │
│   (6rem, pulsing) │               │           (8rem, pulsing glow)       │
│                   │               │                                      │
│  Get ready to     │               │         Get ready to think alike!    │
│  think alike!     │               │                                      │
│                   │               │                                      │
│                   │               │                                      │
└───────────────────┘               └──────────────────────────────────────┘

Properties:
  Position: fixed; inset: 0;
  Z-Index: var(--z-round-start-overlay) = 9999
  Background: rgba(10, 14, 39, 0.95)
  Backdrop: filter: blur(4px)
  Animation: Countdown 3 → 2 → 1 → GO!
  Respects: prefers-reduced-motion

Key Point: Z-INDEX MUST BE HIGHEST!
```

---

### Screen 4: GAME - TEXT MODE INPUT

#### Mobile Portrait (375px)
```
┌─────────────────────────────────┐
│ [Heart][Heart][Heart]  Round 3  │ Compact HUD
│ Lives: 3/5            [Return]  │
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐ │
│  │ ●────○  Carousel          │ │ Webcam mini
│  │  [P1]   (swipe for P2)    │ │ 100px height
│  └───────────────────────────┘ │
│                                 │
│         ┌─────┐                 │
│         │ 45s │                 │ Timer (70×70)
│         └─────┘                 │
│                                 │
│    THINK OF A WORD...           │ H2 clamp(1.5rem)
│                                 │
│  Type the same word as your     │ Instructions
│  opponent to win!               │
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │  Type your word...      │   │ Input field
│  │                         │   │ clamp(1.25-2rem)
│  └─────────────────────────┘   │
│                                 │
│                                 │
│  ┌─────────────────────────┐   │
│  │  SUBMIT WORD  →         │   │ Sticky CTA
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ [Gamepad] [Video] [Chat] [Users]│ Bottom tabs
│      ●       2      5      2    │ Game active
└─────────────────────────────────┘
                            [Sun] [Cog]
```

#### Mobile - After Submission
```
┌─────────────────────────────────┐
│ [Heart][Heart][Heart]  Round 3  │ HUD
│ Lives: 3/5            [Return]  │
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐ │
│  │ ●────○  Webcam carousel   │ │
│  │  [P1]                     │ │
│  └───────────────────────────┘ │
│                                 │
│         ┌─────┐                 │
│         │ 38s │                 │ Timer continues
│         └─────┘                 │
│                                 │
│       Your word:                │
│                                 │
│       SUNSET                    │ 2rem, glowing
│                                 │
│                                 │
│         ┌─────┐                 │
│         │  ⏳ │                 │ Spinner
│         └─────┘                 │
│                                 │
│   Waiting for Player 2...       │ Status text
│                                 │
│                                 │
│                                 │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ [Gamepad] [Video] [Chat] [Users]│
│      ●       2      5      2    │
└─────────────────────────────────┘
```

#### Desktop (1366px)
```
┌────────────────────────────────────────────────────────────────────────────┐
│ [Webcam bar - 140px height - 160x120 videos]                              │
├────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┬────────────────────────────┐ │
│ │  [H][H][H]   Round 3       [↩️]              │                            │ │
│ │  Lives (3/5)  Current   Return            │                            │ │
│ ├─────────────────────────────────────────────┤  [Players]               │ │
│ │                                             │                            │ │
│ │ ┌──────────────┐                           │  [Chat]                  │ │
│ │ │ R3: OCEAN    │  <- Word History (top-   │                            │ │
│ │ │ R2: SUNSET ✓ │      left, desktop only)│  Width: 384px             │ │
│ │ │ R1: BEACH ✗  │                           │                            │ │
│ │ └──────────────┘                           │                            │ │
│ │                                             │                            │ │
│ │                    ┌───────┐                │                            │ │
│ │                    │  45s  │                │                            │ │
│ │                    └───────┘                │                            │ │
│ │                  (120x120)                  │                            │ │
│ │                                             │                            │ │
│ │             THINK OF A WORD...              │                            │ │
│ │                                             │                            │ │
│ │       Type the same word as your opponent   │                            │ │
│ │                  to win!                    │                            │ │
│ │                                             │                            │ │
│ │          ┌────────────────────────────┐    │                            │ │
│ │          │                            │    │                            │ │
│ │          │   Type your word...        │    │                            │ │
│ │          │                            │    │                            │ │
│ │          └────────────────────────────┘    │                            │ │
│ │                  (2.5rem font)             │                            │ │
│ │                                             │                            │ │
│ │               [SUBMIT WORD]                 │                            │ │
│ │                                             │                            │ │
│ │                  Round 3                    │                            │ │
│ │                                             │                            │ │
│ └─────────────────────────────────────────────┴────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘
```

---

### Screen 5: GAME - VOICE MODE VOTING

#### Mobile Portrait (375px)
```
┌─────────────────────────────────┐
│ [Heart][Heart]  Round 2 [Return]│ HUD
│ Lives: 2/5                      │
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐ │
│  │ ●────○  Webcam            │ │
│  └───────────────────────────┘ │
│                                 │
│      DID YOU MATCH?             │ H2 (1.5rem)
│                                 │
│  Click below to vote on         │ Instructions
│  whether you said the same word │
│                                 │
│  ┌─────────────────────────┐   │
│  │         [Check]         │   │ Match button
│  │                         │   │ Green gradient
│  │    WE MATCHED!          │   │ Min 48px tap
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │          [X]            │   │ No match button
│  │                         │   │ Red gradient
│  │      NO MATCH           │   │ Min 48px tap
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│                                 │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ [Gamepad] [Video] [Chat] [Users]│
│      ●       2      5      2    │
└─────────────────────────────────┘
```

#### Desktop (1366px)
```
┌────────────────────────────────────────────────────────────────────────────┐
│ [Webcam bar - 140px]                                                       │
├────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┬────────────────────────────┐  │
│ │  [H][H]   Round 2              [↩️]      │                            │  │
│ ├──────────────────────────────────────────┤  [Players]                │  │
│ │                                          │                            │  │
│ │              DID YOU MATCH?              │  [Chat]                   │  │
│ │                                          │                            │  │
│ │           Click below to vote            │  Width: 384px             │  │
│ │                                          │                            │  │
│ │   ┌──────────────┐    ┌──────────────┐  │                            │  │
│ │   │      ✅       │    │      ❌       │  │                            │  │
│ │   │              │    │              │  │                            │  │
│ │   │ WE MATCHED!  │    │  NO MATCH    │  │                            │  │
│ │   │              │    │              │  │                            │  │
│ │   └──────────────┘    └──────────────┘  │                            │  │
│ │   (180px min-width, 2rem padding)      │                            │  │
│ │                                          │                            │  │
│ │                                          │                            │  │
│ └──────────────────────────────────────────┴────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

---

### Screen 6: REVEAL SCREEN - MATCH

#### Mobile Portrait (375px)
```
┌─────────────────────────────────┐
│ [Heart][Heart][Heart]  Round 3  │ HUD
│ Lives: 3/5            [Return]  │
├─────────────────────────────────┤
│                                 │
│    🎉 MIND MELD! 🎉            │ H1 (2rem)
│                                 │ Green glow
│  ┌─────────────────────────┐   │
│  │      Player 1           │   │
│  │  ┌─────────────────┐    │   │
│  │  │    SUNSET       │    │   │ 1.5rem
│  │  └─────────────────┘    │   │ Green border
│  └─────────────────────────┘   │
│                                 │
│             =                   │ Equals sign
│                                 │ (2rem)
│  ┌─────────────────────────┐   │
│  │      Player 2           │   │
│  │  ┌─────────────────┐    │   │
│  │  │    SUNSET       │    │   │
│  │  └─────────────────┘    │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ ✓ Perfect sync!         │   │ Success msg
│  │   Time taken: 23s       │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  TRY AGAIN (Round 4) → │   │ Next CTA
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ [Gamepad] [Video] [Chat] [Users]│
└─────────────────────────────────┘
```

#### Mobile - No Match
```
┌─────────────────────────────────┐
│ [Heart][Heart]  Round 4 [Return]│ Lost a heart
│ Lives: 2/5                      │
├─────────────────────────────────┤
│                                 │
│      ❌ Not Quite...            │ H1 (2rem)
│                                 │ Red glow
│  ┌─────────────────────────┐   │
│  │      Player 1           │   │
│  │  ┌─────────────────┐    │   │
│  │  │    OCEAN        │    │   │
│  │  └─────────────────┘    │   │ Red border
│  └─────────────────────────┘   │
│                                 │
│             ≠                   │ Not equals
│                                 │
│  ┌─────────────────────────┐   │
│  │      Player 2           │   │
│  │  ┌─────────────────┐    │   │
│  │  │    SUNSET       │    │   │
│  │  └─────────────────┘    │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ ✗ Not a match!          │   │ Failure msg
│  │   You lost a life!      │   │
│  │   Lives left: [H][H]    │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  TRY AGAIN (Round 5) → │   │ Next CTA
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ [Gamepad] [Video] [Chat] [Users]│
└─────────────────────────────────┘
```

#### Desktop (1366px)
```
┌────────────────────────────────────────────────────────────────────────────┐
│ [Webcam bar - 140px]                                                       │
├────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┬────────────────────────────┐  │
│ │  [H][H][H]   Round 3              [↩️]   │                            │  │
│ ├──────────────────────────────────────────┤  [Players]                │  │
│ │                                          │                            │  │
│ │           🎉 MIND MELD! 🎉              │  [Chat]                   │  │
│ │                                          │                            │  │
│ │  ┌────────────┐     =     ┌────────────┐│                            │  │
│ │  │  Player 1  │           │  Player 2  ││  Width: 384px             │  │
│ │  │            │           │            ││                            │  │
│ │  │ ┌────────┐ │           │ ┌────────┐ ││                            │  │
│ │  │ │ SUNSET │ │           │ │ SUNSET │ ││                            │  │
│ │  │ └────────┘ │           │ └────────┘ ││                            │  │
│ │  │  (2.5rem)  │           │  (2.5rem)  ││                            │  │
│ │  └────────────┘           └────────────┘│                            │  │
│ │       (Green border, pulsing glow)      │                            │  │
│ │                                          │                            │  │
│ │  ┌────────────────────────────────────┐ │                            │  │
│ │  │ You both thought of the same word! │ │                            │  │
│ │  │ Time taken: 23s                    │ │                            │  │
│ │  └────────────────────────────────────┘ │                            │  │
│ │                                          │                            │  │
│ │            [TRY AGAIN (Round 4)]         │                            │  │
│ │                                          │                            │  │
│ └──────────────────────────────────────────┴────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

---

### Screen 7: VICTORY SCREEN

#### Mobile Portrait (375px)
```
┌─────────────────────────────────┐
│              [Return]            │
├─────────────────────────────────┤
│                                 │
│          [Trophy]               │ Icon 4rem
│       (bouncing anim)           │
│                                 │
│        VICTORY!                 │ H1 (2.5rem)
│                                 │
│   You achieved MIND MELD!       │ H2 (1.125rem)
│                                 │
│  ┌─────────────────────────┐   │
│  │   The word was:         │   │
│  │                         │   │
│  │      SUNSET             │   │ 2rem, glow
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌───────────────────────┐     │ Stats (stacked)
│  │  Rounds Taken    3    │     │
│  └───────────────────────┘     │
│  ┌───────────────────────┐     │
│  │  Lives Left  [H]×4    │     │
│  └───────────────────────┘     │
│  ┌───────────────────────┐     │
│  │  Total Tries     5    │     │
│  └───────────────────────┘     │
│                                 │
│  ┌─────────────────────────┐   │
│  │ [List] Round History    │   │ Tappable pill
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  🎮 PLAY AGAIN →        │   │ Primary CTA
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ [Gamepad] [Video] [Chat] [Users]│
└─────────────────────────────────┘
```

#### Desktop (1366px)
```
┌────────────────────────────────────────────────────────────────────────────┐
│ [Webcam bar - 140px]                                                       │
├────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┬────────────────────────────┐  │
│ │                      [↩️]                 │                            │  │
│ ├──────────────────────────────────────────┤  [Players]                │  │
│ │                                          │                            │  │
│ │                    🏆                    │  [Chat]                   │  │
│ │              (120x120, bouncing)         │                            │  │
│ │                                          │  Width: 384px             │  │
│ │                 VICTORY!                 │                            │  │
│ │                                          │                            │  │
│ │         You achieved MIND MELD!          │                            │  │
│ │                                          │                            │  │
│ │  ┌────────────────────────────────────┐ │                            │  │
│ │  │        The word was:               │ │                            │  │
│ │  │                                    │ │                            │  │
│ │  │           SUNSET                   │ │                            │  │
│ │  │                                    │ │                            │  │
│ │  └────────────────────────────────────┘ │                            │  │
│ │          (3rem font, gradient glow)     │                            │  │
│ │                                          │                            │  │
│ │  ┌──────────┐ ┌──────────┐ ┌──────────┐│                            │  │
│ │  │ Rounds   │ │  Lives   │ │  Total   ││                            │  │
│ │  │  Taken   │ │Remaining │ │ Attempts ││                            │  │
│ │  │    3     │ │ [H]×4    │ │    5     ││                            │  │
│ │  └──────────┘ └──────────┘ └──────────┘│                            │  │
│ │       (Side-by-side stats, 3-column)    │                            │  │
│ │                                          │                            │  │
│ │  ┌────────────────────────────────────┐ │                            │  │
│ │  │       Round History                │ │                            │  │
│ │  │  R1: BEACH vs OCEAN       ✗       │ │                            │  │
│ │  │  R2: OCEAN vs TIDE        ✗       │ │                            │  │
│ │  │  R3: SUNSET vs SUNSET     ✓       │ │                            │  │
│ │  └────────────────────────────────────┘ │                            │  │
│ │                                          │                            │  │
│ │              🎮 [PLAY AGAIN]             │                            │  │
│ │                                          │                            │  │
│ │    Great teamwork! You synchronized!    │                            │  │
│ │                                          │                            │  │
│ └──────────────────────────────────────────┴────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

---

### Screen 8: GAME OVER SCREEN

#### Mobile Portrait (375px)
```
┌─────────────────────────────────┐
│              [Return]            │
├─────────────────────────────────┤
│                                 │
│       [BrokenHeart]             │ Icon 4rem
│       (heartbeat anim)          │
│                                 │
│       GAME OVER                 │ H1 (2rem)
│                                 │ Red glow
│      Out of Lives!              │ H2 (1.125rem)
│                                 │
│  ┌───────────────────────┐     │ Stats
│  │  Rounds Done     5    │     │
│  └───────────────────────┘     │
│  ┌───────────────────────┐     │
│  │  Total Tries     8    │     │
│  └───────────────────────┘     │
│  ┌───────────────────────┐     │
│  │  Matches         2    │     │
│  └───────────────────────┘     │
│                                 │
│  ┌─────────────────────────┐   │
│  │ [List] Your Attempts    │   │ Tappable pill
│  │  (expands to sheet)     │   │
│  └─────────────────────────┘   │
│                                 │
│  So close! You matched 2 times! │ Encouragement
│                                 │
│  ┌─────────────────────────┐   │
│  │  🔄 TRY AGAIN →         │   │ Primary CTA
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ [Gamepad] [Video] [Chat] [Users]│
└─────────────────────────────────┘
```

#### Desktop (1366px)
```
┌────────────────────────────────────────────────────────────────────────────┐
│ [Webcam bar - 140px]                                                       │
├────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┬────────────────────────────┐  │
│ │                      [↩️]                 │                            │  │
│ ├──────────────────────────────────────────┤  [Players]                │  │
│ │                                          │                            │  │
│ │                    💔                    │  [Chat]                   │  │
│ │              (6rem, heartbeat)           │                            │  │
│ │                                          │  Width: 384px             │  │
│ │                GAME OVER                 │                            │  │
│ │                                          │                            │  │
│ │              Out of Lives!               │                            │  │
│ │                                          │                            │  │
│ │  ┌──────────┐ ┌──────────┐ ┌──────────┐│                            │  │
│ │  │ Rounds   │ │  Total   │ │ Matches  ││                            │  │
│ │  │Completed │ │ Attempts │ │          ││                            │  │
│ │  │    5     │ │    8     │ │    2     ││                            │  │
│ │  └──────────┘ └──────────┘ └──────────┘│                            │  │
│ │       (3-column stats grid)             │                            │  │
│ │                                          │                            │  │
│ │  ┌────────────────────────────────────┐ │                            │  │
│ │  │        Your Attempts               │ │                            │  │
│ │  │  ────────────────────────────────  │ │                            │  │
│ │  │  #1: BEACH vs OCEAN       ✗ No   │ │                            │  │
│ │  │  #2: SUNSET vs SUNSET     ✓ Match│ │                            │  │
│ │  │  #3: WAVE vs TIDE         ✗ No   │ │                            │  │
│ │  │  #4: SAND vs SHORE        ✗ No   │ │                            │  │
│ │  │  #5: OCEAN vs OCEAN       ✓ Match│ │                            │  │
│ │  │  (max-height: 300px, scroll)      │ │                            │  │
│ │  └────────────────────────────────────┘ │                            │  │
│ │                                          │                            │  │
│ │    So close! You matched 2 times!       │                            │  │
│ │                                          │                            │  │
│ │              🔄 [TRY AGAIN]              │                            │  │
│ │                                          │                            │  │
│ └──────────────────────────────────────────┴────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

---

### Screen 9: CHAT TAB ACTIVE

#### Mobile Portrait - Drawer
```
┌─────────────────────────────────┐
│  Chat (5 unread)       [Close]  │ Drawer header
│  ══════════════════════          │ Swipe handle
│                                 │
│  ┌─────────────────────────┐   │
│  │ Player1: Hey!           │   │
│  │ 2:30 PM                 │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ You: Ready?             │   │
│  │ 2:31 PM                 │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ Player1: Let's go! 🎮   │   │
│  │ 2:31 PM                 │   │
│  └─────────────────────────┘   │
│                                 │
│  (Scrollable message list)      │
│                                 │
├─────────────────────────────────┤
│ [Emoji] Type message...  [Send] │ Input bar
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ [Gamepad] [Video] [Chat] [Users]│
│    Game      2      ●      2    │ Chat active
└─────────────────────────────────┘
```

---

### Screen 10: VIDEO TAB ACTIVE

#### Mobile Portrait - Fullscreen
```
┌─────────────────────────────────┐
│  Video Feeds              [Close]│ Full drawer
│  ══════════════════════          │
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │     Player 1 (You)      │   │
│  │      [Video feed]       │   │ Large feed
│  │        320×240          │   │
│  │                         │   │
│  │  [Mic] [Cam] [FullScr] │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │      Player 2           │   │
│  │      [Video feed]       │   │ Large feed
│  │        320×240          │   │
│  │                         │   │
│  │  [Mic] [Cam]            │   │
│  └─────────────────────────┘   │
│                                 │
│  (Scrollable if more players)   │
│                                 │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ [Gamepad] [Video] [Chat] [Users]│
│    Game      ●      5      2    │ Video active
└─────────────────────────────────┘
```

---

## Critical Fixes Required

### Priority 1: Z-Index Centralization ⚠️ CRITICAL

**Problem:** Z-index values scattered (995-10000) with conflicts and no centralized management.

**Solution:** Create `src/styles/z-index-constants.css` with centralized constants.

**Files to Update:**
- `RoundStartOverlay.tsx`
- `WebcamDisplay.tsx`
- `ChatWindow.css`
- `PlayerList.css`
- `responsive.css`
- `mobile.css`
- All fixed/modal/drawer components

**Impact:** Prevents overlay conflicts, ensures countdown always visible, enables hierarchy management.

### Priority 2: Dual Shell Architecture Implementation

**Problem:** No distinction between mobile and desktop UX patterns; CSS media queries insufficient.

**Solution:** Create separate MobileShell and DesktopShell components with useDeviceType hook.

**Files to Create:**
- `src/hooks/useDeviceType.ts`
- `src/components/MobileShell.tsx`
- `src/components/DesktopShell.tsx`

**Impact:** Cleaner mobile-first UX, easier maintenance, distinct patterns per device class.

### Priority 3: Bottom Tab Bar Navigation

**Problem:** No persistent primary navigation on mobile; FABs alone insufficient for discoverability.

**Solution:** Implement BottomTabBar with Game, Video, Chat, Players tabs + badges.

**Files to Create:**
- `src/components/BottomTabBar.tsx`
- `src/styles/bottom-tab-bar.css`

**Update:**
- `src/components/MobileShell.tsx` - integrate tab bar

**Impact:** Clear navigation, tab switching, badge system for unread counts.

### Priority 4: Hero Carousel Webcam (Mobile)

**Problem:** Webcam always takes 120-220px on mobile; wastes space with idle feeds.

**Solution:** Create swipeable carousel with auto-hide empty slots for mobile.

**Files to Create:**
- `src/components/WebcamCarousel.tsx`
- `src/styles/webcam-carousel.css`

**Update:**
- `MobileShell.tsx` - use carousel for mobile, full bar for desktop

**Impact:** Saves 120px of vertical space on mobile, more engaging UX.

### Priority 5: Emoji to Lucide Icon Migration

**Problem:** Multiple components render `�` characters on mobile (LivesDisplay, VictoryScreen, etc.).

**Solution:** Replace all emoji with Lucide icons (Heart, Trophy, CheckCircle, XCircle, etc.).

**Migration Table:**
| Emoji | Icon | Usage |
|-------|------|-------|
| ❤️ | Heart | Lives display |
| 🏆 | Trophy | Victory screen |
| ✅ | CheckCircle | Match indicator |
| ❌ | XCircle | No match indicator |
| 💔 | BrokenHeart | Game over |
| 📷 | Camera | Video FAB |
| 👥 | Users | Players FAB |
| 💬 | MessageSquare | Chat FAB |
| ⚙️ | Settings | Settings FAB |
| ☀️ | Sun | Theme toggle |

**Files to Update:**
- `LivesDisplay.tsx`
- `VictoryScreen.tsx`
- `GameOverScreen.tsx`
- `RevealScreen.tsx`
- `BottomTabBar.tsx`
- `FABCluster.tsx`
- `SettingsModal.tsx`
- All component CSS

**Impact:** Fixes rendering bugs, professional appearance, consistent cross-platform.

### Priority 6: dvh Units Adoption

**Problem:** iOS Safari address bar collapse causes layout shift with `100vh`.

**Solution:** Replace `vh` with `dvh` (dynamic viewport height) for dynamic sizing.

**Files to Update:**
- `App.tsx` - root height
- `MobileShell.tsx` - content height
- `mobile.css` - all viewport-relative measurements
- `responsive.css` - fullscreen overlays

**Code Pattern:**
```css
/* BEFORE */
.app-root { height: 100vh; }

/* AFTER */
.app-root { height: 100dvh; }
```

**Impact:** Fixes iOS Safari address bar issue, modern standard.

### Priority 7: Keyboard-Aware Layouts

**Problem:** Keyboards hide CTAs and instructions on mobile input screens.

**Solution:** Use sticky CTAs, responsive padding, and keyboard-aware scroll behavior.

**Files to Create:**
- `src/styles/keyboard-aware.css`

**Code Pattern:**
```css
/* Sticky CTA that stays above keyboard */
.cta-button {
  position: sticky;
  bottom: 0;
  padding-bottom: max(var(--spacing-md), env(safe-area-inset-bottom));
}

/* Responsive input padding */
.word-input {
  padding: clamp(1rem, 3vw, 2rem);
}
```

**Files to Update:**
- `TextModeInput.tsx`
- `VoiceModeInput.tsx`
- Game input screens CSS

**Impact:** CTAs accessible when keyboard visible, better mobile UX.

### Priority 8: Consistent Spacing Scale

**Problem:** Mix of `20px`, `1rem`, `0.75rem`, Tailwind units; no standards.

**Solution:** Use spacing variables (--spacing-xs through --spacing-3xl) everywhere.

**Files to Update:**
- All component CSS
- All component TSX (className usage)

**Impact:** Visual consistency, easier maintenance, design system adherence.

---

## Implementation Roadmap

### Phase 1: Foundation & Architecture (Week 1)

**Tasks:**
1. ✅ Create useDeviceType hook
2. ✅ Create z-index-constants.css with all values
3. ✅ Create spacing scale CSS variables
4. ✅ Build DesktopShell component
5. ✅ Build MobileShell component skeleton

**Deliverables:**
- Centralized z-index system
- Spacing scale defined
- Shell architecture in place
- Device type detection working

**Files to Create:**
- `src/hooks/useDeviceType.ts`
- `src/styles/z-index-constants.css`
- `src/styles/spacing-scale.css`
- `src/components/MobileShell.tsx`
- `src/components/DesktopShell.tsx`

### Phase 2: Navigation & Icons (Week 2)

**Tasks:**
1. ✅ Implement BottomTabBar component
2. ✅ Implement FAB cluster (secondary actions only)
3. ✅ Migrate emoji to Lucide icons
4. ✅ Add badge system for tabs
5. ✅ Wire up tab switching in MobileShell

**Deliverables:**
- Bottom tab bar working with badges
- FAB cluster for settings + theme
- All emoji replaced with icons
- Tab switching functional

**Files to Create:**
- `src/components/BottomTabBar.tsx`
- `src/styles/bottom-tab-bar.css`
- `src/components/FABCluster.tsx`
- `src/styles/fab-cluster.css`

**Files to Update:**
- All components with emoji (migration)
- `MobileShell.tsx` (integrate)

### Phase 3: Components & Mobile UX (Week 3)

**Tasks:**
1. ✅ Build WebcamCarousel component
2. ✅ Create MobileDrawer component
3. ✅ Implement swipe gestures
4. ✅ Add keyboard-aware layouts
5. ✅ Implement fluid typography with clamp()
6. ✅ Test dvh units

**Deliverables:**
- Hero carousel webcam working
- Mobile drawers for Chat/Players
- Keyboard doesn't hide CTAs
- Typography scales smoothly
- iOS Safari address bar handled

**Files to Create:**
- `src/components/WebcamCarousel.tsx`
- `src/styles/webcam-carousel.css`
- `src/components/MobileDrawer.tsx`
- `src/styles/mobile-drawer.css`
- `src/styles/keyboard-aware.css`
- `src/styles/typography-fluid.css`

**Files to Update:**
- `MobileShell.tsx` (integrate all)
- All responsive.css media queries (dvh)

### Phase 4: Testing & Polish (Week 4)

**Tasks:**
1. ✅ Cross-browser testing (Chrome, Safari, Firefox, Edge)
2. ✅ Real device testing (iOS, Android)
3. ✅ Lighthouse Performance + Accessibility
4. ✅ WebRTC cellular constraints testing
5. ✅ Cypress/Playwright flows
6. ✅ Documentation update

**Deliverables:**
- All devices tested
- Accessibility compliant
- Performance benchmarks documented
- Bug fixes implemented
- Documentation complete

**Testing Coverage:**
- iPhone SE/14/Pro Max (Portrait + Landscape)
- Pixel 6 (Portrait + Landscape)
- iPad Mini/Pro
- Desktop (1280p, 1920p, 2560p)
- WebRTC reconnection (4G throttle)
- Keyboard interaction (all input screens)

---

## Testing Matrix

### Devices to Test

| Device | Width | Height | Orientation | Priority |
|--------|-------|--------|-------------|----------|
| iPhone SE | 375px | 667px | Portrait | **Critical** |
| iPhone 12/13/14 | 390px | 844px | Portrait | **Critical** |
| iPhone 14 Pro Max | 430px | 932px | Portrait | High |
| iPhone Landscape | 844px | 390px | Landscape | High |
| Pixel 6 | 412px | 915px | Portrait | High |
| Pixel 6 Landscape | 915px | 412px | Landscape | High |
| iPad Mini | 768px | 1024px | Portrait | High |
| iPad | 810px | 1080px | Portrait | High |
| iPad Pro 11" | 834px | 1194px | Portrait | High |
| iPad Pro 12.9" | 1024px | 1366px | Landscape | High |
| Desktop 720p | 1280px | 720px | - | **Critical** |
| Desktop 1080p | 1920px | 1080px | - | **Critical** |
| Desktop 1440p | 2560px | 1440px | - | Medium |
| 4K Display | 3840px | 2160px | - | Medium |

### Test Scenarios Per Screen

#### Home Screen
- [ ] Theme toggle works and doesn't overlap with settings FAB
- [ ] Create vs Join mode toggle switches correctly
- [ ] Input fields render at proper size (16px min for iOS)
- [ ] Button tap areas are 44px+ minimum (48px on touch)
- [ ] Form reflows properly on ultra-small screens (280px)
- [ ] Tagline and CTA text readable at all sizes
- [ ] FABs positioned with safe-area-insets on mobile

#### Lobby Screen
- [ ] Bottom tab bar visible and functional
- [ ] Tabs show correct badges (players, chat count)
- [ ] Players tab opens drawer without breaking layout
- [ ] Chat tab opens drawer with swipe handle
- [ ] Video tab shows hero carousel with dots
- [ ] Carousel swipes between player feeds
- [ ] Auto-hide works for empty feeds
- [ ] Room code readable and copy button works
- [ ] Settings accordion opens/closes without layout shift
- [ ] Ready button accessible on all viewports

#### Round Prep (Countdown)
- [ ] Fullscreen overlay covers entire viewport
- [ ] Countdown numbers centered and large
- [ ] Z-index highest (not blocked by other overlays)
- [ ] Countdown animation smooth at 60fps
- [ ] Backdrop blur doesn't cause performance issues
- [ ] Respects prefers-reduced-motion
- [ ] Animation completes and transitions to game

#### Word Input (Text Mode)
- [ ] Webcam carousel visible (mobile) or bar (desktop)
- [ ] Timer visible and counting down
- [ ] Lives display readable
- [ ] Input field scales appropriately with text
- [ ] Keyboard doesn't hide CTA button
- [ ] Sticky CTA stays above keyboard
- [ ] Word history visible on desktop only
- [ ] Submit button accessible after typing
- [ ] Submitted word displays with glow effect
- [ ] Waiting spinner centers properly

#### Word Input (Voice Mode)
- [ ] Vote buttons are large enough (48px+ on touch)
- [ ] Match/No Match buttons clearly distinguish (color + icon)
- [ ] Dispute modal centers and is readable
- [ ] Vote comparison layout adapts to viewport
- [ ] Buttons respond to taps immediately (no 300ms delay)
- [ ] Active state feedback works (scale, color)

#### Reveal Screen
- [ ] Word comparison layout is clear
- [ ] Match indicator obvious (color + symbol)
- [ ] Lives remaining visible and updated
- [ ] Animations don't block content
- [ ] Confetti/heartbreak animation respects reduced-motion
- [ ] Next round button accessible
- [ ] Stats display correctly

#### Victory/Game Over Screens
- [ ] Trophy/heart animation bounces smoothly
- [ ] Stats grid adapts (column on mobile, grid on desktop)
- [ ] Round history scrolls if needed
- [ ] Play again button prominent
- [ ] Encouragement text readable
- [ ] No overflow on any viewport
- [ ] Icons render correctly (not emoji)

### Critical Test Cases

**FAB System (Mobile):**
- [ ] FABs positioned correctly with safe-area-insets
- [ ] Theme FAB toggles theme
- [ ] Settings FAB opens modal/sheet
- [ ] No overlap with bottom tab bar
- [ ] No overlap with other UI elements
- [ ] FAB animations smooth

**Tab Bar & Drawers:**
- [ ] Tabs switch content correctly
- [ ] Badges update in real-time
- [ ] Drawers open from tab taps
- [ ] Drawers close when backdrop tapped
- [ ] Drawers close with swipe-down
- [ ] Swipe handle visible and draggable
- [ ] Drawer content scrollable

**Webcam Carousel:**
- [ ] Carousel dots show position
- [ ] Swipe gesture works smoothly
- [ ] Auto-hide works (empty feeds disappear)
- [ ] Fullscreen popout on tap
- [ ] Video feeds render cleanly
- [ ] Performance acceptable (no jank)

**Typography Scaling:**
- [ ] Text doesn't overflow on 280px width
- [ ] Text scales smoothly across all viewports
- [ ] No iOS zoom on input focus (16px minimum)
- [ ] Headers remain readable at 4K (large font-size)
- [ ] clamp() functions work correctly

**Touch Interactions:**
- [ ] All buttons have 48px+ tap targets
- [ ] No hover effects on touch devices (@media hover: none)
- [ ] Active state feedback works on tap
- [ ] No 300ms delay on button taps
- [ ] Swipe gestures responsive
- [ ] Keyboard appears/disappears smoothly

**Icon Rendering:**
- [ ] Lucide icons render correctly (not emoji `�`)
- [ ] Icons scale appropriately
- [ ] Color contrast meets accessibility standards
- [ ] Icons visible in both light and dark modes

**Performance:**
- [ ] Page interactive within 3 seconds on 4G
- [ ] 60fps animations on mobile devices
- [ ] No jank during drawer open/close
- [ ] No layout shift on modal/drawer appearance
- [ ] Carousel smooth on low-end devices
- [ ] Lighthouse Performance score ≥85

**WebRTC:**
- [ ] Webcam feeds work on cellular (4G throttle)
- [ ] Reconnection works after network drop
- [ ] Video quality degrades gracefully on low bandwidth
- [ ] Microphone toggle works
- [ ] Camera toggle works

**Accessibility:**
- [ ] Screen reader announces tab labels
- [ ] Keyboard navigation works (tabs, modals)
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] Form labels associated with inputs
- [ ] Skip link accessible on all pages

---

## 9.1. Validation Checklist

### Pre-Implementation Review
- [ ] All team members reviewed this document
- [ ] Design system colors finalized (Neural Sync + Thought Bubble)
- [ ] Typography scale approved (clamp values)
- [ ] Icon set (Lucide) integrated into project
- [ ] TailwindCSS config includes custom breakpoint (1200px)

### Development Checkpoints

**Phase 1 Completion:**
- [ ] `useDeviceType` hook working (mobile/tablet/desktop)
- [ ] `z-index-constants.css` created with all values
- [ ] DesktopShell and MobileShell components scaffolded
- [ ] Layout context established

**Phase 2 Completion:**
- [ ] BottomTabBar component renders and switches tabs
- [ ] FAB cluster positioned with safe areas
- [ ] All emoji replaced with Lucide icons
- [ ] Tab badges update in real-time

**Phase 3 Completion:**
- [ ] WebcamCarousel swipes and auto-hides empty slots
- [ ] MobileDrawer opens/closes from tabs
- [ ] Sticky CTAs work above keyboard
- [ ] clamp() typography scales smoothly
- [ ] dvh units applied to fullscreen overlays

**Phase 4 Completion:**
- [ ] All devices tested manually
- [ ] Lighthouse Performance ≥85
- [ ] Lighthouse Accessibility ≥90
- [ ] No layout shift on modal/drawer appearance
- [ ] WebRTC works on 4G throttle
- [ ] All tests passing (Cypress/Playwright)

---

## 9.2. Accessibility & UX Standards

### Semantic HTML & ARIA

Use semantic elements and ARIA attributes correctly:

```html
<!-- ✓ GOOD -->
<nav className="bottom-tab-bar" aria-label="Main navigation">
  <button aria-current="page" aria-label="Game">Game</button>
  <button aria-label="Video chat">Video</button>
</nav>

<!-- ✗ WRONG -->
<div className="nav">
  <div onClick={...}>Game</div>
  <div onClick={...}>Video</div>
</div>
```

### Color Contrast

Ensure all text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large):

```css
/* Primary button text on gradient background */
.btn-primary {
  background: linear-gradient(135deg, #b18cff 0%, #5cf4ff 100%);
  color: #ffffff;  /* 6.2:1 contrast ratio */
}

/* Test with: webaim.org/resources/contrastchecker */
```

### Font Size Minimum

Never use less than 16px on mobile (prevents iOS zoom):

```css
/* ✗ WRONG */
.small-text { font-size: 12px; }

/* ✓ GOOD */
.small-text { font-size: clamp(14px, 2vw, 16px); }

/* Always 16px minimum on input focus */
input {
  font-size: 16px;
}
```

### Keyboard Navigation

All interactive elements must be keyboard accessible:

```typescript
// ✓ GOOD - Button is focusable
<button onClick={handleSubmit}>Submit</button>

// ✓ GOOD - Custom button with role
<div role="button" tabIndex={0} onKeyDown={handleKeypress}>
  Submit
</div>

// ✗ WRONG - Not focusable
<div onClick={handleSubmit}>Submit</div>
```

### Focus Indicators

Never remove focus outlines; make them visible:

```css
/* ✓ GOOD */
button:focus-visible {
  outline: 3px solid var(--primary);
  outline-offset: 2px;
}

/* ✗ WRONG */
button:focus {
  outline: none;  /* Don't do this! */
}
```

### Label Association

All form inputs must have associated labels:

```html
<!-- ✓ GOOD -->
<label htmlFor="word-input">Enter your word</label>
<input id="word-input" type="text" />

<!-- ✓ GOOD (implicit) -->
<label>
  Enter your word
  <input type="text" />
</label>

<!-- ✗ WRONG -->
<span>Enter your word</span>
<input type="text" />
```

---

## 9.3. Performance Optimization

### Mobile-First Performance Budget

Target metrics:

- **Largest Contentful Paint (LCP):** < 2.5s on 4G
- **First Input Delay (FID):** < 100ms
- **Cumulative Layout Shift (CLS):** < 0.1
- **Time to Interactive (TTI):** < 3.5s on 4G

### Animation Performance

Disable heavy animations on mobile:

```css
/* Desktop - enable effects */
@media (min-width: 1024px) {
  .background-animation {
    animation: floatingShapes 20s ease-in-out infinite;
  }
}

/* Mobile - disable effects */
@media (max-width: 1023px) {
  .background-animation {
    animation: none;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  }
}
```

### Lazy Loading

Load components and images only when needed:

```typescript
// Lazy load chat history
const ChatWindow = lazy(() => import('./ChatWindow'));

// Lazy load video feed on tab click
const [videoLoaded, setVideoLoaded] = useState(false);

const handleVideoTab = () => {
  setVideoLoaded(true);
  // Video component only renders when videoLoaded is true
};
```

### Image Optimization

Use responsive images with proper sizes:

```html
<!-- ✓ GOOD -->
<img
  src="/webcam-mobile.jpg"
  srcSet="/webcam-mobile.jpg 375w, /webcam-tablet.jpg 768w, /webcam-desktop.jpg 1280w"
  sizes="(max-width: 768px) 375px, (max-width: 1024px) 768px, 1280px"
  alt="Webcam feed of opponent"
/>

<!-- With picture element for different formats -->
<picture>
  <source srcSet="/image.webp" type="image/webp" />
  <source srcSet="/image.jpg" type="image/jpeg" />
  <img src="/image.jpg" alt="Description" />
</picture>
```

### Code Splitting

Split code by route and feature:

```typescript
// routes.tsx
import { lazy, Suspense } from 'react';

const Home = lazy(() => import('./pages/Home'));
const Lobby = lazy(() => import('./pages/Lobby'));
const Game = lazy(() => import('./pages/Game'));

export function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lobby/:roomId" element={<Lobby />} />
        <Route path="/game/:roomId" element={<Game />} />
      </Routes>
    </Suspense>
  );
}
```

### Network-Aware Loading

Use Network Information API:

```typescript
export const useNetworkType = () => {
  const [effectiveType, setEffectiveType] = useState('4g');

  useEffect(() => {
    const connection = (navigator as any).connection ||
                      (navigator as any).mozConnection ||
                      (navigator as any).webkitConnection;

    if (connection) {
      setEffectiveType(connection.effectiveType);
      connection.addEventListener('change', () => {
        setEffectiveType(connection.effectiveType);
      });
    }
  }, []);

  return effectiveType; // '4g', '3g', '2g', 'slow-2g'
};

// Usage
const networkType = useNetworkType();
const showHighQualityVideo = networkType === '4g';
```

---

## 9.4. Code Organization

### Folder Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── DesktopShell.tsx
│   │   ├── MobileShell.tsx
│   │   ├── BottomTabBar.tsx
│   │   ├── FABCluster.tsx
│   │   └── MobileDrawer.tsx
│   ├── game/
│   │   ├── GameComponent.tsx
│   │   ├── TextModeInput.tsx
│   │   ├── VoiceModeInput.tsx
│   │   ├── RevealScreen.tsx
│   │   ├── VictoryScreen.tsx
│   │   └── GameOverScreen.tsx
│   ├── media/
│   │   ├── WebcamDisplay.tsx
│   │   ├── WebcamCarousel.tsx
│   │   └── WebcamGrid.tsx
│   ├── chat/
│   │   ├── ChatWindow.tsx
│   │   └── MobileChatDrawer.tsx
│   ├── players/
│   │   ├── PlayerList.tsx
│   │   ├── PlayerCard.tsx
│   │   └── MobilePlayerDrawer.tsx
│   └── common/
│       ├── Button.tsx
│       ├── Modal.tsx
│       ├── Card.tsx
│       └── Loading.tsx
├── hooks/
│   ├── useDeviceType.ts
│   ├── useNetworkType.ts
│   ├── useWebRTC.ts
│   └── useKeyboardVisibility.ts
├── context/
│   ├── LayoutContext.tsx
│   ├── GameContext.tsx
│   └── SocketContext.tsx
├── styles/
│   ├── z-index-constants.css
│   ├── spacing-scale.css
│   ├── typography-fluid.css
│   ├── safe-area.css
│   ├── keyboard-aware.css
│   ├── responsive.css
│   ├── mobile.css
│   ├── animations.css
│   └── accessibility.css
├── utils/
│   ├── responsive.ts
│   ├── device.ts
│   └── webrtcMobileFixes.ts
└── App.tsx
```

---

## Code Examples

### 1. useDeviceType Hook

```typescript
// src/hooks/useDeviceType.ts
import { useState, useEffect } from 'react';

type DeviceType = 'mobile' | 'tablet' | 'desktop';

export const useDeviceType = (): DeviceType => {
  const [deviceType, setDeviceType] = useState<DeviceType>(() => {
    if (typeof window === 'undefined') return 'desktop';
    return window.innerWidth < 768 ? 'mobile' :
           window.innerWidth < 1024 ? 'tablet' :
           'desktop';
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const newType = width < 768 ? 'mobile' :
                      width < 1024 ? 'tablet' :
                      'desktop';
      setDeviceType(newType);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceType;
};
```

### 2. BottomTabBar Component (Complete)

Already documented above in Component Patterns section.

### 3. Lucide Icon Migration Example

```typescript
// BEFORE
export const LivesDisplay = ({ lives, maxLives }) => {
  return (
    <div className="lives-display">
      {Array.from({ length: lives }).map((_, i) => (
        <span key={i}>❤️</span>  {/* Renders as ? on mobile */}
      ))}
    </div>
  );
};

// AFTER
import { Heart } from 'lucide-react';

export const LivesDisplay = ({ lives, maxLives }) => {
  return (
    <div className="lives-display">
      {Array.from({ length: lives }).map((_, i) => (
        <Heart key={i} size={20} color="#ef4444" />
      ))}
    </div>
  );
};
```

### 4. dvh Units Usage

```css
/* In App.tsx root or index.css */

:root {
  /* Use dvh instead of vh for mobile viewport handling */
  --viewport-height: 100dvh;
  --viewport-width: 100dvw;
}

.app-root {
  min-height: 100dvh; /* Handles iOS Safari address bar */
}

.mobile-shell {
  height: 100dvh;
}

/* Fullscreen overlays */
.fullscreen-overlay {
  position: fixed;
  inset: 0;
  height: 100dvh; /* Or: var(--viewport-height) */
}
```

### 5. Keyboard-Aware Layout

```typescript
// TextModeInput.tsx with keyboard awareness
import { useState, useRef, useEffect } from 'react';

export const TextModeInput = ({ onSubmit, timer }) => {
  const [word, setWord] = useState('');
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleFocus = () => setKeyboardOpen(true);
    const handleBlur = () => setKeyboardOpen(false);

    const input = inputRef.current;
    if (input) {
      input.addEventListener('focus', handleFocus);
      input.addEventListener('blur', handleBlur);
      return () => {
        input.removeEventListener('focus', handleFocus);
        input.removeEventListener('blur', handleBlur);
      };
    }
  }, []);

  return (
    <div className={`text-mode-input ${keyboardOpen ? 'keyboard-open' : ''}`}>
      <div className="hud">
        <div className="lives">{/* Lives display */}</div>
        <div className="timer">{timer}s</div>
      </div>

      <div className="game-content">
        <h2>Think of a word...</h2>
        <p>Type the same word as your opponent to win!</p>

        <div className="input-wrapper">
          <input
            ref={inputRef}
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="Type your word..."
            className="word-input"
          />
        </div>
      </div>

      {/* Sticky CTA that stays above keyboard */}
      <button
        onClick={() => onSubmit(word)}
        className="cta-submit"
      >
        Submit Word →
      </button>
    </div>
  );
};
```

```css
/* keyboard-aware.css */
.text-mode-input {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  padding-bottom: env(safe-area-inset-bottom);
}

.game-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg);
}

.cta-submit {
  position: sticky;
  bottom: 0;
  /* Stays visible above keyboard */
  padding: var(--spacing-lg);
  padding-bottom: max(var(--spacing-lg), env(safe-area-inset-bottom));
  width: 100%;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  border: none;
  border-radius: 12px;
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
}

.cta-submit:active {
  transform: scale(0.98);
}

/* On keyboard open, reduce content padding */
.text-mode-input.keyboard-open .game-content {
  padding: var(--spacing-md);
}
```

### 6. prefers-reduced-motion Implementation

```css
/* Respect user's motion preferences */

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  /* Disable specific animations */
  .countdown-overlay {
    animation: none;
  }

  .trophy-bounce {
    animation: none;
  }

  .confetti {
    display: none;
  }

  /* Keep transitions for essential UI feedback */
  button {
    transition: color 0.01ms, background 0.01ms;
  }
}
```

---

## Conclusion

This unified responsive design guide combines comprehensive documentation with modern mobile-first patterns to transform ThinkAlike into a game that excels across all device types—from 280px smartphones to 4K displays.

**Key Achievements:**
- ✅ 72% game content on mobile (vs 25% originally)
- ✅ Clear, discoverable navigation (tabs + FABs)
- ✅ Engaging mobile UX (hero carousel, drawers)
- ✅ Modern standards (dvh, Lucide, prefers-reduced-motion)
- ✅ Accessible and performant
- ✅ 4-week implementation roadmap
- ✅ Comprehensive testing strategy

**Document Version:** 2.0 (Merged)
**Last Updated:** 2025-11-14
**Status:** Ready for Implementation
**Next Review:** After Phase 2 Completion
