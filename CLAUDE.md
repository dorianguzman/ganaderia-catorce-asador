# Claude Code Instructions — Asador Callejero Catorce

## Git
- Do not add "Co-Authored-By" lines to commits
- Do NOT push unless the user explicitly says so

## Minification
After EVERY edit to CSS or JS source files, re-minify before committing:

```bash
npx clean-css-cli -o css/styles.min.css css/styles.css
npx terser js/main.js -c -m -o js/main.min.js
```

- `index.html` references the `.min.*` files — always keep them up to date
- Source files (`styles.css`, `main.js`) are kept for development
- Both source and minified files are committed to the repo

## Architecture
- Vanilla JS IIFE in `js/main.js` — no frameworks
- GSAP 3.12 + ScrollTrigger for animations; call `ScrollTrigger.refresh()` after any height change
- Cart state is a plain object keyed by item ID; persisted to `sessionStorage` via `saveCart()`/`restoreCart()`

## Menu Data (`data/menu.json`)
- `hasIngredients: true` — item opens an ingredient picker (Torta, Papa al Grill, Chavindeca)
- `nyPrice` — per-item New York override price (no promos apply to NY)
- `promos` array — multiple tiers `[{qty, price, label}]`; old single `promo` object is legacy
- Compound cart keys: `baseItemId--ingredientId` (e.g. `papa-grill--arrachera`)

## Promo Calculation
- `calculatePromoTotal(qty, item)` uses dynamic programming across all promo tiers
- New York entries are always `qty × nyPrice`, never enter promos
- Non-NY compound entries are grouped by `baseItemId` for promo calculation

## Project Notes
- All URLs use `asador.ganaderiacatorce.com`
- Site deploys to GitHub Pages
- Mobile-first design — test at 375px width first
- Menu data lives in `data/menu.json` (standalone, not wired to gestion API)
- Fonts are loaded from Google Fonts (Inter) and local .ttf files in `assets/fonts/` (Orbitron, Josefin Sans)
