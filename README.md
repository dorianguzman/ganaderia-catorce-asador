# Asador Callejero Catorce — Menu Digital

Customer-facing digital menu for **Asador Callejero Catorce**. Customers scan a QR code, browse the menu, build their order, and send it pre-filled via WhatsApp.

**Live:** [asador.ganaderiacatorce.com](https://asador.ganaderiacatorce.com)

## Features

- **Swipeable category worlds** — each menu section (Tacos, Quesadillas, Charolas, Especialidades, Bebidas, Postres, Salsas) is a character-hosted world with entrance animations
- **Ingredient picker** — Torta, Papa al Grill, and Chavindeca open a bottom-sheet picker to choose any taco ingredient
- **Multi-tier promos** — DP-optimal pricing across promo tiers (e.g. 2x$150, 3x$200) with savings display
- **Order types** — Dine-in or Takeaway with address input or GPS location sharing
- **WhatsApp checkout** — Builds a pre-filled WhatsApp message with the full order summary
- **Cart persistence** — Cart survives page refreshes via sessionStorage
- **GSAP animations** — Hero entrance, zone transitions, ScrollTrigger-driven reveals

## Tech Stack

- HTML5 / CSS3 / Vanilla JS (no frameworks)
- GSAP 3.12 + ScrollTrigger
- Static site on GitHub Pages
- Fonts: Orbitron, Josefin Sans, Inter

## Development

Source files are `css/styles.css` and `js/main.js`. After editing, minify before committing:

```bash
npx clean-css-cli -o css/styles.min.css css/styles.css
npx terser js/main.js -c -m -o js/main.min.js
```

Menu data lives in `data/menu.json`.

## License

Proprietary — Ganaderia Catorce
