# 📦 PIEWARE 2 — Installation Guide

Step-by-step instructions to install and use Pieware 2.

---

## FOR USERS (Students & Makers)

### Option 1 — Use Directly Online (Easiest, Recommended)

1. Open your browser (Chrome / Edge / Safari)
2. Go to: **https://haziq12-lgtm.github.io/pieware2/**
3. Done! No installation needed.

> 💡 **Install as an App (PWA)** — on your phone:
> 1. Open the link in Chrome
> 2. Tap the **⋮ menu** → **"Add to Home screen"** / **"Install app"**
> 3. The ⚡ Pieware 2 icon appears on your home screen — opens fullscreen like a native app
>
> On desktop (Chrome/Edge): click the **install icon** ⊕ in the address bar.

> 📴 **Offline use** — after your first visit, most features (Helper, Calculators, Dictionary, Templates) work even without internet. Live data (Shop, Feedback) needs a connection.

---

### Option 2 — Run Locally (Download)

1. Go to the repo: **https://github.com/haziq12-lgtm/pieware2**
2. Click the green **Code** button → **Download ZIP**
3. Extract the ZIP anywhere on your computer
4. Double-click **`index.html`** — it opens in your browser

> ⚠️ Note: running from a local file works, but PWA install & offline mode only activate on HTTPS (the online version). Everything else works identically.

---

### Option 3 — Run Locally with Git (Developers)

Requirements: [Git](https://git-scm.com/) installed.

```bash
git clone https://github.com/haziq12-lgtm/pieware2.git
cd pieware2
```

Then open `index.html` in your browser — or better, serve it:

```bash
# any one of these (pick what you have):
python -m http.server 8080
npx serve .
```

Open `http://localhost:8080` in your browser.

---

## 🧭 FIRST TIME USING THE APP

1. **Helper tab** — select your MCU board (e.g. *ESP32 DevKit V1*)
2. **Add components** (up to 5) — e.g. DHT11, OLED, Relay
3. Check the **Validation card** — 🟢 ok · 🟡 check first · 🔴 fix before wiring · ⚪ not verified
4. Review the **wiring table** — press **"Why?"** on any row to learn why that pin was chosen
5. Press **Generate Source Code** → **Download .ino** or **Copy**
6. Need parts? Press **📦 BOM** or the Cytron buy links
7. Stuck? Press **🤖 AI Prompt** to get help from ChatGPT with full project context

---

## ❓ TROUBLESHOOTING

| Problem | Solution |
|---|---|
| Site shows "Connecting to Firebase Cloud..." forever | Check your internet; refresh. Offline use still works for local features |
| Shop/Feedback empty | Firebase data needs internet — go online and refresh |
| Admin login fails | Admin access is restricted; see CONTRIBUTING.md |
| App looks outdated after an update | Hard refresh: `Ctrl+Shift+R` (the service worker cache refreshes on next visit) |
| "Add to Home screen" not showing | PWA install needs HTTPS — use the online link, not a local file |

---

## 🔗 LINKS

- **Live app:** https://haziq12-lgtm.github.io/pieware2/
- **Repository:** https://github.com/haziq12-lgtm/pieware2
- **Report issues / request components:** use the **Feedback** tab in the app
