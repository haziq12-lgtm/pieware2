# 🛠️ CONTRIBUTING — Pieware 2 Developer Setup

Guide for setting up a development environment and extending Pieware 2.

---

## 1. DEV SETUP

```bash
# clone
git clone https://github.com/haziq12-lgtm/pieware2.git
cd pieware2

# serve locally (any one):
python -m http.server 8080     # Python
npx serve .                    # Node
```

Open `http://localhost:8080`. No build step — plain HTML/CSS/JS.

> PWA/service worker only activates over **HTTPS or localhost**. Use a local server (not `file://`) when testing SW behaviour.

---

## 2. FILE STRUCTURE

```
pieware2/
├── index.html        # markup only (~670 lines)
├── style.css         # all styles (~1,180 lines) — gold/black theme
├── app.js            # all logic (~3,000 lines) — see map below
├── manifest.json     # PWA identity
├── sw.js             # service worker (offline cache)
└── icons/            # app icons (SVG)
```

### app.js section map (search for these markers)

| Section | What lives there |
|---|---|
| `AFFILIATE` | Affiliate tag config — all buy links read from here |
| `I18N` | Language dictionaries (en/id/tl) + `t()` helper |
| `MCU_SERIES` / `MCU_FAMILIES` | Board catalog & per-family pin templates |
| `COMPONENT_CATEGORIES` / `COMP_INDEX` | Component catalog (127 items) |
| `INPUT_ONLY_PINS` | Verified input-only pins per family |
| `buildWiring()` | Pin allocator + wiring rows/steps/warnings — **core function, many depend on it** |
| `validateProject()` | Honest validation rules (🟢🟡🔴⚪) |
| `generateCode()` | Arduino/Python code generator |
| `MINI_PROJECTS` | 62 mini project presets |
| `PRODUCTS / SHOP` | Firebase shop + Cytron catalog |
| `ADMIN LOGIN` | Firebase Auth config (`ADMIN_EMAIL`) |

---

## 3. FIREBASE SETUP (for your own deployment)

1. Create a project at https://console.firebase.google.com
2. Add a **Realtime Database** + enable **Email/Password** auth
3. Replace the `firebaseConfig` object at the top of `app.js` with yours
4. Set `ADMIN_EMAIL` (in app.js) to your admin account email
5. Publish security rules — principle: **public read** for catalog/content, **admin-only write** except order creation & feedback submission. Example:

```json
{
  "rules": {
    "announcements": { ".read": true, ".write": "auth != null && auth.token.email == 'YOUR_ADMIN_EMAIL'" },
    "about":         { ".read": true, ".write": "auth != null && auth.token.email == 'YOUR_ADMIN_EMAIL'" },
    "shopProducts":  { ".read": true, ".write": "auth != null && auth.token.email == 'YOUR_ADMIN_EMAIL'" },
    "gallery":       { ".read": true, ".write": true },
    "feedback": {
      ".read": true,
      "$fb": { ".write": "!data.exists()" }
    },
    "orders": {
      ".read": "auth != null && auth.token.email == 'YOUR_ADMIN_EMAIL'",
      "$order": { ".write": "auth != null && auth.token.email == 'YOUR_ADMIN_EMAIL' || !data.exists()" }
    }
  }
}
```

---

## 4. ADDING CONTENT

### Add a component
Find `COMPONENT_CATEGORIES` in `app.js`, add an entry:

```js
{ n: 'Component Name', k: 'kind', p: ['VCC', 'SIG', 'GND'], warn: 'optional caution' }
```

Kinds: `din dout dht us ana i2c spi uart servo stepper4 stepper2 motor rgb color multi* passive wifi lcd seg nrf`
- Optional `v: '3.3'` (verified voltage — enables strict compatibility checks)
- Optional `output: 'led|buzzer|servo|motor|relay|fan'` (enables simulation visuals)

### Add an MCU board
Add to `MCU_SERIES` under a series group: `['Board Name', 'familyKey']`.
If its pins differ from the family template, consider a new `MCU_FAMILIES` entry.

### Add a mini project
Add to `MINI_PROJECTS`: `['Project Name', 'Easy|Medium', 'MCU Name', ['Component 1', 'Component 2']]`
— component/MCU names must match the database exactly (there is a validation script pattern in the repo history).

---

## 5. DEPLOYMENT

Site auto-deploys on every push to `main` via **GitHub Pages**:
- Live: https://haziq12-lgtm.github.io/pieware2/
- Allow ~1 min after `git push`

Bump the version in the site footer + `CHANGELOG.md` with user-facing changes.

---

## 6. CONVENTIONS

- Keep `buildWiring()`'s return shape stable (`rows/steps/warnings`) — renderHelper, codegen, BOM, Copy Wiring and Share all consume it
- All dynamic content rendered into HTML must pass through `esc()`
- Never claim "safe/verified/compatible" without data — use the ⚪ "Unable to verify" status instead
- One logical change per commit; test in browser before pushing
- Validation honesty > feature count
