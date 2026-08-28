# PIEWARE 2 — CHANGELOG

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
