# PIEWARE 2 — CHANGELOG

**v2.4.1** — 24 September 2026 🔥 LIVE RELEASE
"UX & Accessibility Improvements"

## ✨ New Features
- **Physical Calibration Alerts System** — Automatic detection and display of calibration requirements for components requiring manual setup (trimpots, potentiometers, burn-in periods)
- **GitHub Pages Redirect** — Automatic redirect from legacy GitHub Pages to current Vercel deployment
- **Enhanced Component Database** — Added calibration flags and instructions for sensors, displays, motors, and drivers

## 🔧 Fixes
- **Redirect Compatibility** — Users accessing from GitHub Pages now automatically redirected to Vercel for consistent experience
- **Setup Guidance** — Specific calibration instructions now shown for components requiring physical adjustment

---

**v2.4.0** — 19 September 2026 🔥 LIVE RELEASE
"Major Feature Expansion"

## ✨ New Features
- **User Authentication** — Firebase Auth integration with sign up, sign in, and user accounts
- **Cloud Project Sync** — Automatic project synchronization across devices for logged-in users
- **Advanced Search** — Enhanced search across pages, products, user projects, and mini projects with categorized results
- **Export Formats** — New JSON and text export options for projects in addition to existing formats
- **Interactive Tutorial** — Welcome tutorial modal for first-time users with dismiss option
- **Enhanced Admin Dashboard** — Added review analytics, user activity metrics, and community project statistics
- **Community Project Attribution** — Enhanced community projects with author information and engagement metrics

## 🔧 Fixes
- **i18n Restoration** — Fixed internationalization feature now working properly across the app
- **Enhanced Error Handling** — Specific Firebase error messages for better user experience
- **Font Rotation** — Added Lobster Two and Noto Sans JP to hero font rotation system
- **Feedback Filters** — Added filtering by type (Feedback/Suggestion/Issue) to reviews

## ⚡ Performance
- **Loading States** — Added loading spinners and skeleton screens for better UX
- **DNS Prefetching** — Added DNS prefetch for external resources to improve load times
- **Resource Optimization** — Preloaded critical CSS and optimized script loading
- **Image Lazy Loading** — Product images now load lazily for better performance

## ♿ Accessibility
- **ARIA Labels** — Added comprehensive ARIA labels for screen readers
- **Keyboard Navigation** — Enhanced keyboard support with Escape key for modals and Enter key for navigation
- **Role Attributes** — Added proper role attributes for navigation and status elements
- **Focus Management** — Improved focus states and tab indexing throughout the app

## 🔒 Security
- **Input Validation** — Added email and password validation functions
- **Input Sanitization** — Implemented input sanitization to prevent XSS attacks
- **Error Handling** - Enhanced security through specific error messages

## 📦 Data
- **Components:** 127 · **Mini Projects:** 62 · **Community Projects:** Enhanced with author tracking

---

**v2.3.0** — 31 August 2026 🔥 LIVE RELEASE
"UI & Performance Enhancements"

## ✨ New Features
- **Hero animations** — 3 random display fonts per visit (Black Ops One / Alfa Slab One / Betania Patmos), staggered entrance, gold shimmer on title, glow pulse, typewriter subline with caret (reduced-motion safe)
- **About tab redesign** — Our Story (admin-editable via Firebase), Roadmap 3-column (In Progress/Planned/Future), Support & Feedback CTA buttons, Version History + changelog link, x2_Hzq signature line
- **Hero subline** — "Learn, Build & Understand Electronics Easily"

## 🔧 Fixes
- **CRITICAL FIX** — restore 7 functions lost in hub splice (openGuide, setPinOverride, toggleSchematic, wireColor, buildSchematicSVG, renderSchematic, closeGuide) — was crashing renderHelper, breaking pins/table/schematic

## ⚡ Performance
- Guard duplicate admin Firebase listeners
- Stop simulation interval on navigation away
- Remove expensive text-shadow animation

---

**v2.2.0** — 24 August 2026 🔥 LIVE RELEASE
"Deploy & PWA"

## ✨ New Features
- **Full PWA** — installable as an app (manifest, offline-first service worker, ⚡P2 SVG icons)
- **Offline mode** — app shell cached; Helper, Calculators & Dictionary work without internet
- **Live on GitHub Pages** — https://haziq12-lgtm.github.io/pieware2/
- **3-column footer** — brand, quick links & version info
- **Mini Project Ideas** — 62 student projects (searchable, Easy/Medium filter, one-click Load in Helper)
- **Output Simulation** 🎬 — animated LED/buzzer/servo/motor/relay/fan in the visualizer, integrated with validation
- **Output taxonomy** — 24 components tagged for simulation
- 4 new components: Light Bulb (5V), Strip Light LED, DC Fan 5V, Brushless DC Motor

## 🔧 Fixes
- Live demo code box is now scrollable
- Codegen: components without signal pins (buzzer/fan/bulb) now get a free GPIO instead of an invalid `+` pin

## 📦 Data
- Components: **127** · Mini projects: **62**

---

**v2.1.1** — 24 August 2026
Prior to small changes, users experience a small but noticeable delay in every interaction. Due to that, we have made a small change to the file
— All CSS code from <style> in index.html has been moved to an external style.css file. This reduces HTML file size and enables browser caching, making the site load faster.

**v2.1.0** — 23 August 2026
- Search & filter in dictionary
- Auto-save to localStorage
- Clear All button
- Copy wiring instructions
- Download .ino / .py
- Shareable project URL
- My Projects (save 20 projects)
- BOM Export (CSV)
- AI Prompt export
- Loading spinner
- Toast notifications
- Dark mode
- Keyboard shortcuts [ Ctrl+Shift+C (Generate Code), Ctrl+Shift+R (Reset), Ctrl+Shift+S (Share), Ctrl+K (Search) ]
- Advanced calculators (Voltage Divider, RC)
- Project Hub (9 resources)

**v2.0.5** — 15 July 2026
- Responsive layout for mobile
- Bug fixes for Firebase and wiring table

**v2.0.0** — 1 June 2026
- Pieware 2 Launch
- Pinout Visualizer, Code Generator, Hardware Store, Calculators, Feedback System
