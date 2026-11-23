# Dizi Urdu — Native-Feeling Progressive Web App (PWA) Upgrade Plan

This plan outlines the complete upgrade of **Dizi Urdu** into an installable, native-feeling Progressive Web App powered by `vite-plugin-pwa`, preceded by a full restore-point snapshot of the current application state so you can safely roll back at any time.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following confirmed preferences guide this architecture. Please review and approve to begin implementation:
>
> 1. **Pre-Edit Restore Point**: Before modifying a single line of code, a clean checkpoint of the current working application state will be saved so you can revert to this exact pre-PWA version whenever you want.
> 2. **Static Icon & Splash Files Only**: All app icons (`/pwa-192x192.png`, `/pwa-512x512.png`, `/pwa-maskable-512x512.png`, `/apple-touch-icon.png`) and the standalone splash artwork (`/pwa-512x512.png`) will be managed strictly as static public assets—no Admin Panel upload controls will be added. Starter PNGs derived from your existing brand mark will be placed at these paths so everything passes installability immediately and you can drop in your custom artwork anytime.
> 3. **Per-Page Admin Panel Status Bar Controls**: A dedicated **PWA Status Bar** control group will be added in the Admin Panel letting you choose **Transparent**, **Black**, or **Hidden** independently for each view (Home, Show Detail / More Info, Video Player, Categories, Top 10, Search, Profile, and Login).
> 4. **Orientation Freedom + Fullscreen Auto-Landscape**: The manifest will leave browsing orientation unlocked so both portrait and your custom mobile landscape layouts work seamlessly, while entering fullscreen video playback will automatically lock the screen to landscape and unlock upon exit.
> 5. **Dual Install Surfaces**: Eligible users will see both a **custom-designed Install App popout** (shown non-intrusively after initial browsing dwell with persistent dismissal) and a dedicated **Install / Download App** option inside **App Settings** (automatically hidden once already installed).

---

## 1. Overview & Core Concept

The goal is to eliminate browser chrome and bridge the gap between web and native streaming apps on Android, iOS, and desktop while preserving every existing Dizi Urdu feature, visual layout, and Admin Panel capability.

- **Installable Standalone Shell**: Launches fullscreen without address bars or browser navigation chrome, backed by a Service Worker (`registerType: 'autoUpdate'`) that caches the app shell, catalog backup, fonts, and artwork for instant startup and seamless offline browsing.
- **Cinema-Grade Hardware Integration**: Video playback integrates Screen Orientation Lock, Screen Wake Lock, Lock-Screen MediaSession controls, Picture-in-Picture, and tactile haptic feedback for double-tap skipping.
- **OS-Native Entry Points & Polish**: Android home screen long-press shortcuts jump straight into Search or Watchlist; mobile sharing invokes the native OS Share Sheet with automatic fallback to the custom share modal; touch gestures and phone safe-area insets are tuned for notched and gesture-bar devices.

---

## 2. User Experience & Visual Design

### Visual System & Tokens
All new PWA surfaces inherit Dizi Urdu's dark cinema aesthetic without introducing clashing styles or decorative pill clutter:
- **Canvas & Surfaces**: Deep obsidian `#09090b` app shell and manifest background, pure `#000000` cinema black for detail/player status bar modes, and `#14151a` elevated modal surfaces with subtle `1px` `rgba(255,255,255,0.10)` hairlines.
- **Brand Accent**: Signature crimson `#e50914` for primary install CTAs, active progress, and offline status accents; clean high-contrast `#ffffff` and `#a1a1aa` text hierarchy.
- **Typography**: `Plus Jakarta Sans` for crisp UI headings and controls paired with `Montserrat` for brand display wordmarks.

### Touch Ergonomics & Viewport Discipline
- **Minimum Touch Hitboxes**: Every newly added button (Install popout actions, dismiss trigger, PiP toggle, Settings install row) meets the `44 × 44px` minimum touch target standard (`48px` height for primary CTAs).
- **Safe-Area Awareness**: Top headers, fixed/floating bottom navbars, the landscape left navigation rail, and floating popouts respect `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`, `env(safe-area-inset-left)`, and `env(safe-area-inset-right)` so notches and gesture bars never obscure controls.
- **Native Touch Feel**: Global CSS enables `overscroll-behavior-y: contain` (preventing unwanted browser pull-to-refresh bounce), `-webkit-tap-highlight-color: transparent`, and `user-select: none` across UI chrome while explicitly preserving `user-select: text` inside search inputs, login fields, and Admin Panel textareas.

### New & Upgraded Surfaces
1. **Standalone Branded Launch Splash Screen**:
   - Activates **strictly** when launched in installed standalone mode (`display-mode: standalone` or iOS `navigator.standalone`). Never interrupts normal browser visits.
   - Displays the static `/pwa-512x512.png` emblem centered on a `#09090b` canvas with a subtle crimson ambient aura, holding briefly for initial mount before smoothly fading out.
2. **Custom-Designed Install App Popout**:
   - Slides in as an ergonomic bottom-sheet card on mobile (and compact corner card on desktop) using `#14151a` dark glass styling, the `/pwa-192x192.png` app badge, clear benefit copy (fullscreen streaming, instant launch, home screen shortcuts), a primary `#e50914` **Install App** CTA, and a clean dismiss button.
   - **Non-Intrusive Timing**: Never interrupts immediate arrival or active video playback—waits until the user has browsed briefly, stays suppressed if dismissed (saved in `localStorage`), and disappears permanently once installed.
   - **iOS Safari Guided Mode**: Because iOS Safari does not fire `beforeinstallprompt`, iOS users who are not yet in standalone mode receive a sleek 2-step visual guide inside the popout ("Tap Share → Add to Home Screen").
3. **App Settings — Install / Download App Row**:
   - Placed inside both the Mobile Android-style Settings list and the Desktop Settings modal.
   - Automatically hides when the app is already running in installed standalone mode.
   - Tapping triggers the native browser install prompt directly when available, or opens the custom Install Popout / iOS guide when native prompting is unavailable.
4. **Refined Dark Offline Banner**:
   - Upgrades the existing offline indicator into a sleek dark-glass cinema alert (`#14151a` with crisp `#e50914` offline dot and Wi-Fi-off icon) that informs users they are browsing cached content without blinding full-width glare or overlapping mobile navigation bars.

---

## 3. Key Product Decisions & Trade-Offs

### 1. Pre-Edit Restore Point Strategy
- **Decision**: Immediately upon your approval (before installing packages or modifying any project file), capture a verified local restore checkpoint of the workspace state.
- **Why**: Guarantees a zero-risk rollback path if you later want to undo the PWA upgrade or compare behavior against your pre-PWA build.

### 2. Static App Icons & Separate Maskable Safe-Zone Asset
- **Decision**: Provide four dedicated static PNG files in the public root: `/pwa-192x192.png` (`purpose: "any"`), `/pwa-512x512.png` (`purpose: "any"`), `/pwa-maskable-512x512.png` (`purpose: "maskable"` with 12–15% solid obsidian safe-zone padding), and `/apple-touch-icon.png` (180×180 PNG for iOS).
- **Why**: Android adaptive icons crop the outer ~20% into circles or squircles. Keeping `any` and `maskable` as separate assets prevents logo clipping on Android launchers while ensuring your splash screen and regular icons remain crisp and edge-to-edge. Whenever you create your own custom artwork, simply replace those exact PNG files.

### 3. Per-Page Admin Status Bar Modes (`Transparent` | `Black` | `Hidden`)
- **Decision**: Extend `AdminSettings` with a per-page status bar configuration map (`home`, `detail`, `player`, `categories`, `top10`, `search`, `profile`, `login`), defaulting to `transparent` on Home/Browse views and `black` on Show Detail and Video Player views.
- **How Each Mode Works on Mobile Web/PWA**:
  - **Transparent**: Sets `<meta name="theme-color" content="#09090b" />` with `apple-mobile-web-app-status-bar-style="black-translucent"` and allows hero backdrops/headers to bleed behind the top safe-area inset seamlessly.
  - **Black**: Dynamically switches `<meta name="theme-color" content="#000000" />` and renders a solid `#000000` top safe-area backing strip behind system status icons.
  - **Hidden**: Switches `<meta name="theme-color" content="#000000" />` and, where supported by the browser (e.g., Android Chrome standalone/fullscreen gestures), engages edge-to-edge immersive fullscreen behavior while clearing top chrome padding so content occupies the full display height.

### 4. Orientation Behavior & Hardware Playback APIs
- **Decision**: Keep manifest orientation unlocked (`any` / omitted) so portrait browsing and your custom mobile landscape layout both work naturally. Inside the HTML5/HLS video player:
  - **Auto-Landscape**: Lock `screen.orientation.lock('landscape')` on entering fullscreen and safely `screen.orientation.unlock()` on exiting fullscreen or closing the player (wrapped in silent try/catch for browsers like iOS Safari that disallow orientation locks).
  - **Screen Wake Lock**: Request `navigator.wakeLock.request('screen')` while video is actively playing, automatically re-acquire if the tab regains visibility while playing, and release immediately on pause, end, or player close.
  - **MediaSession API**: Populate lock-screen and notification artwork/title/episode metadata plus `play`, `pause`, `seekbackward` (-10s), `seekforward` (+10s), and `seekto` action handlers synchronized with live playback state.
  - **Picture-in-Picture (PiP)**: Enable PiP on the HTML5 video element (removing the blocking attribute) and show a clean PiP toggle button in player controls whenever `document.pictureInPictureEnabled` is true.
  - **Double-Tap Skip & Micro-Haptics**: Add mobile touch double-tap left (-10s) and right (+10s) video skip zones paired with a subtle `10ms` haptic pulse (`navigator.vibrate?.(10)`), and apply the same `10ms` haptic tick to watchlist bookmarking and mobile tab switches.

### 5. Service Worker Caching & Auto-Update Strategy
- **Decision**: Use `vite-plugin-pwa` with `registerType: 'autoUpdate'`, `devOptions: { enabled: true, type: 'module' }`, and explicit Workbox runtime caching rules alongside all existing Vite dev plugins (preserving `/api/database`, `/api/save-database`, and social share crawler middleware untouched).
- **Caching Strategy**:
  - **App Shell (JS, CSS, HTML, local icons)**: Precached at install for instant startup and offline navigation fallback.
  - **Catalog Data (`/api/database`, backup JSON)**: `NetworkFirst` with cache fallback so fresh Admin edits appear immediately when online, while the full catalog remains browsable offline.
  - **Fonts & Poster/Backdrop Artwork**: `CacheFirst` / `StaleWhileRevalidate` with bounded cache entry limits and expiration so thumbnails render instantaneously without bloating device storage.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        DIZI URDU PWA RUNTIME SHELL                         │
│                                                                            │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │  VitePWA & Workbox   │  │  Launch & Shortcuts  │  │  Install Engine  │  │
│  │  • Web App Manifest  │  │  • Standalone Check  │  │  • beforeinstall │  │
│  │  • Auto-Update SW    │  │  • AppSplashScreen   │  │  • appinstalled  │  │
│  │  • Shell Precache    │  │  • ?action=search    │  │  • iOS Detector  │  │
│  │  • Runtime Caches    │  │  • ?action=watchlist │  │  • Popout + Menu │  │
│  └──────────┬───────────┘  └──────────┬───────────┘  └────────┬─────────┘  │
│             │                         │                       │            │
│             └─────────────────────────┼───────────────────────┘            │
│                                       ▼                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                   APP ROUTING & ADMIN SETTINGS BUS                   │  │
│  │                                                                      │  │
│  │  Active Page State ──► Per-Page Status Bar Controller                │  │
│  │  (Home | Detail |      • Reads AdminSettings.pwaStatusBarConfig      │  │
│  │   Player | Search |    • Updates <meta name="theme-color">           │  │
│  │   Categories | Top10 | • Applies Transparent / Black / Hidden mode   │  │
│  │   Profile | Login)                                                   │  │
│  └──────────┬─────────────────────────┬───────────────────────┬─────────┘  │
│             │                         │                       │            │
│             ▼                         ▼                       ▼            │
│  ┌────────────────────┐   ┌───────────────────────┐   ┌─────────────────┐  │
│  │  Video Player APIs │   │  Native Mobile Polish │   │  Connectivity   │  │
│  │  • Orientation Lock│   │  • navigator.share    │   │  • online /     │  │
│  │  • Screen WakeLock │   │    + ShareModal fb    │   │    offline hook │  │
│  │  • MediaSession    │   │  • 10ms Haptics       │   │  • Dark Offline │  │
│  │  • Picture-in-Pic  │   │  • Safe-Area Insets   │   │    Alert Banner │  │
│  │  • 2x Tap Skip     │   │  • Overscroll Contain │   │                 │  │
│  └────────────────────┘   └───────────────────────┘   └─────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

### State & Interactive Handler Mapping

| Feature / Surface | State & Trigger Mechanism | Behavior & Fallback |
| :--- | :--- | :--- |
| **Manifest & Icons** | `VitePWA` plugin manifest (`id: "/"`, `start_url: "/"`, `scope: "/"`, `display: "standalone"`, `short_name: "DiziUrdu"`) + static PNG links in HTML head | Passes Chromium & iOS installability checks; separate padded maskable icon avoids Android launcher cropping |
| **Home Screen Shortcuts** | Android icon long-press opens `/?action=search` or `/?action=watchlist` | Boot URL effect detects `action` query param, opens Search view or Profile Watchlist directly, and cleans the URL |
| **Standalone Splash Screen** | `display-mode: standalone` media query + iOS `navigator.standalone` check | Renders `/pwa-512x512.png` overlay only in installed app mode and fades out cleanly after mount |
| **Per-Page Status Bar** | `AdminSettings.pwaStatusBarConfig` persisted in existing Admin database | React effect watches active page/modal state and applies `transparent`, `black`, or `hidden` status bar rules live |
| **Install Popout & Settings** | Shared `usePWAInstall` hook tracking deferred prompt, standalone state, iOS detection, and dismissal flag | Popout appears after non-intrusive dwell; Settings shows Install row; both auto-hide once installed |
| **Video Hardware APIs** | Fullscreen state, playing state, and `<video>` element ref inside `CustomPlayer` | Locks landscape in fullscreen (unlocks on exit), holds Wake Lock while playing, updates MediaSession metadata/controls, toggles PiP when supported |
| **Native OS Share** | Mobile share trigger checks `navigator.share` before opening modal | Launches native OS Share Sheet on mobile browsers; falls back smoothly to existing `ShareModal` + copy link on desktop or unsupported browsers |
| **Haptic Micro-Feedback** | Shared `triggerHaptic(10)` helper guarded by `navigator.vibrate` | Fires subtle `10ms` tick on bookmarking My List, switching mobile nav tabs, and double-tap seeking in player |
| **Offline Detection** | `online` / `offline` event hook paired with Workbox cached catalog & shell | Displays refined dark-theme offline banner respecting safe-area insets while keeping cached browsing intact |
