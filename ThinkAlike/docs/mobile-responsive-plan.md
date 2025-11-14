# ThinkAlike Mobile Experience Plan

## Snapshot
- Goal: translate ThinkAlike's desktop-first lobby + game surfaces into a thumb-first flow inspired by Gartic Phone and other .io party titles while keeping the webcam-first identity.
- Sources: `src/App.tsx`, `src/components/GameComponent.tsx`, `src/components/*`, `src/styles/*.css`, template mobile drawer reference in `GamebuddiesTemplate/client/src/components/MobileChatDrawer.tsx`.

## Pain Points Worth Fixing
### Global Shell
- Desktop flex row in `src/App.tsx` simply stacks on mobile, pushing PlayerList/Chat below the fold and wasting the hero area reserved for the webcam strip.
- Right rail components (`PlayerList`, `ChatWindow`) never import their CSS variants and render full height even when closed, so there is no small-screen affordance (no drawer/minimize state).
- Webcam bar (`App.css`, `WebcamDisplay.tsx`) always takes ~220px height and only collapses with a tiny toggle; idle feeds and blank slots still consume space.

### Core Game Screens
- `TextModeInput` / `VoiceModeInput` rely on gigantic fixed typography (`game.css`), so keyboards hide CTAs and instructions spill off-screen.
- Word history is hidden (`hidden lg:block`) on the main canvas, forcing players to guess progress.
- Reveal/Victory screens use comparative layouts that assume >768px width, so stats and CTA buttons hop around as soon as Safari shrinks the viewport.

### Support Surfaces
- Home/Lobby shells keep marketing cards, room info, settings and player info all in a single column with little hierarchy, overwhelming narrow screens.
- Settings FAB + modal (`SettingsButton.css`, `SettingsModal.tsx`) ignore safe areas and chase the user's thumb—they sit at top-right and spawn centered pop-ups that collide with the webcam row.
- Multiple emoji glyphs render as `�` characters in `LivesDisplay`, `VoiceModeInput`, `VictoryScreen`, and `SettingsModal`, undermining polish on mobile chat-like contexts.

## Layout & Navigation Strategy
1. **Dual Shell**: build `DesktopShell` and `MobileShell` driven by `useDeviceType`. Desktop keeps existing flex row; mobile becomes single-column with stacked regions and a persistent bottom tab bar (Game, Video, Chat, Players) backed by the unused `.mobile-nav` styles.
2. **Drawer-based Sidebars**: promote the existing `.mobile-drawer` pattern plus `MobileChatDrawer` template into `src/components`. Chat and Player List live in swipeable sheets with unread badges rather than fixed panels.
3. **Webcam Redesign**: shrink the inline strip to a hero feed + horizontal carousel. Reserve full-screen popout for optional tap, auto-hide empty slots, and expose quick host controls via pill buttons.
4. **Safe-area & Height Guards**: standardize `min-height: 100dvh`, `padding-bottom: env(safe-area-inset-bottom)` inside `app-root`, and anchor floating controls near the bottom safe area.
5. **Performance Mode**: keep Wave/Floating backgrounds for desktop but reduce particle count or disable entirely on touch devices to avoid jank.

## Game Surface Improvements
- **HUD Bar**: move `LivesDisplay`, round counter, and room code to a sticky bar under the webcam. Render WordHistory as a tappable pill that expands into a sheet on mobile.
- **Input States**: use `clamp` typography and sticky CTA buttons so `TextModeInput`/`VoiceModeInput` remain visible when the keyboard opens. Add inline progress cues (e.g., timer chips, “opponent typing” microtext).
- **Reveal & Victory**: convert multi-column layouts into stacked cards with carousels for round history. Keep CTA buttons in a sticky footer and show celebratory animations sparingly on devices with `prefers-reduced-motion`.
- **Overlays**: give `RoundStartOverlay` a compact mobile variant (smaller numbers, optional “skip animation” link) and pause heavy effects on low-end devices.
- **Iconography**: replace raw emoji with Lucide icons or inline SVGs for hearts, trophies, votes, and settings to guarantee consistent rendering.

## Lobby, Meta, and Settings
- **Home Screen**: treat Create/Join as segmented controls, move streamer banner + trust copy below the form, and highlight the CTA with thumb-reachable spacing.
- **Lobby Cards**: adopt a swipeable player stack and floating "Share Link" pill that triggers the OS share sheet. Settings open as a full-height sheet to avoid modal stacking.
- **Settings FAB**: dock near the bottom-right safe area, expose haptics-friendly toggles, and ensure sliders respect mobile hit targets.

## Implementation Roadmap
1. **Shell Extraction** – create layout context + MobileShell, wire bottom nav, confirm safe-area padding.
2. **Drawers & Sheets** – import `MobileChatDrawer`, craft a PlayerList drawer, add unread badges and swipe gestures.
3. **Game Canvas Rewrite** – responsive HUD, sticky CTAs, WordHistory pill, reflow of Reveal/Victory states, accessible typography via CSS clamp.
4. **Meta Surfaces** – rebuild Home/Lobby/Settings with sheet patterns, fix emoji placeholders, add OS share + copy affordances.
5. **Perf & QA** – throttle animated backgrounds on touch devices, honor `prefers-reduced-motion`, and test on Chrome/Safari responsive emulators plus real iOS/Android for WebRTC + orientation quirks.

## Validation Checklist
- Manual smoke on iPhone SE/14 Pro, Pixel 6, iPad Mini landscape, and desktop Chrome.
- Lighthouse Performance + Accessibility runs per shell.
- WebRTC reconnection tests using cellular constraints (leveraging `utils/webrtcMobileFixes.ts`).
- Cypress/Playwright flows that cover chat drawer, player drawer, webcam hide/show, and text/voice submission with keyboards visible.

## ASCII Wireframes

### Home / Entry
```
Mobile Portrait (~390x844)
┌──────────────────────────────┐
│  ThinkAlike Logo + Tagline   │
│  ─────────────────────────   │
│  [ Create | Join ] toggle    │
│  ┌───────────────┐           │
│  │ Name Input    │           │
│  └───────────────┘           │
│  ┌───────────────┐           │
│  │ Room Code?    │ (Join)    │
│  └───────────────┘           │
│  [ Primary CTA ]             │
│  ---- Info Pills / Banner ---│
│  Streamer tip / trust text   │
│  Bottom safe area padding    │
└──────────────────────────────┘

Tablet Landscape (~1024x768)
┌───────────────────────────────────────────────┐
│     Hero copy        │  Form card             │
│  • USP chip row      │  ┌──────────────┐      │
│  • Visual doodle     │  │ Name field   │      │
│                      │  ├──────────────┤      │
│                      │  │ Room code    │      │
│                      │  └──────────────┘      │
│                      │  [Create/Join CTA]     │
│                      │  Secondary links       │
└───────────────────────────────────────────────┘
```

### Lobby
```
Mobile Portrait
┌──────────────────────────────┐
│ Sticky Header: room + share  │
├──────────────────────────────┤
│ Host status card             │
├──────────────────────────────┤
│ Ready checklist (accordion)  │
├──────────────────────────────┤
│ Action buttons (Ready/Start) │
└──────────────────────────────┘
Bottom Tabs
[Game] [Players] [Chat] [Video]

Players Drawer (slide-up)
┌─────────────── Sheet ───────┐
│ Handle                      │
│ Player cards (status, kick) │
│ Scrollable list             │
└─────────────────────────────┘

Desktop / Large Screen
┌─────────────┬───────────────┬────────────┐
│ Lobby Info  │ Player Grid   │ Chat panel │
│ Code/share  │ Ready states  │ (optional) │
│ Settings    │ Kick/Skip     │            │
└─────────────┴───────────────┴────────────┘
```

### In-Game Layout
```
Desktop (≥1280px)
┌─────────────────────────────────────────────────────────────┐
│ Webcam rail (full width, 2 rows if needed)                  │
├───────────────┬───────────────────────────────┬─────────────┤
│ Player List   │ Main game canvas              │ Chat window │
│ live badges   │ - HUD (lives, round)          │ messages    │
│ quick actions │ - Mode input / reveal screen  │ input area  │
└───────────────┴───────────────────────────────┴─────────────┘

Mobile Portrait
┌──────────────────────────────┐
│ Webcam hero tile + carousel  │
├──────────────────────────────┤
│ HUD chip row (lives/round)   │
├──────────────────────────────┤
│ Main canvas (text/voice UI)  │
│ • Sticky submit CTA          │
│ • Word history pill          │
├──────────────────────────────┤
│ Bottom nav (Game/Chat/etc.)  │
└──────────────────────────────┘

Chat Drawer (when tab tapped)
┌──────────────────────────────┐
│ Handle                       │
│ Chat header (unread badge)   │
│ Message list                 │
│ Input bar + emoji button     │
└──────────────────────────────┘

Mobile Landscape (side-by-side)
┌──────────────────────────────────────────────┐
│ Webcam minimized icon    HUD chips           │
├──────────────────────────────────────────────┤
│ Game canvas (left 70%)   │ Quick tabs (right)│
│                          │ - Chat mini panel │
│                          │ - Player summary  │
└──────────────────────────────┬───────────────┘
                               Bottom CTA strip
```

### Reveal / Victory Overlay (Mobile Portrait)
```
┌──────────────────────────────┐
│ Result badge (Mind Meld!)    │
│ Word comparison cards        │
│  ┌──────┐  VS  ┌──────┐      │
│  │ P1   │      │ P2   │      │
│  │ word │      │ word │      │
│ Stats cards (grid -> column) │
│ Sticky footer: [Next Round]  │
└──────────────────────────────┘
```
