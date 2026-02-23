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

## Project Notes
- All URLs use `asador.ganaderiacatorce.com`
- Site deploys to GitHub Pages
- Mobile-first design — test at 375px width first
- Menu data lives in `data/menu.json` (standalone, not wired to gestion API)
- Fonts are local .ttf files in `assets/fonts/`
