# Asador Callejero Catorce — Menu Digital

## Overview

Customer-facing digital menu for the taqueria at `asador.ganaderiacatorce.com`. Customers scan a printed QR at the taqueria, browse the menu, build their order, choose dine-in or takeaway (with delivery address), and send it pre-filled via WhatsApp.

**Tagline:** "Del Asador, A Tu Corazon"
**Location:** Ciervo #40, La Pradera, QRO
**Hours:** Sabado 1PM-9PM, Domingo 12PM-8PM
**WhatsApp:** +52 446 106 0320

---

## Tech Stack

- **HTML5 / CSS3 / Vanilla JS** — no frameworks, fast loading on mobile
- **GSAP 3.12.5 + ScrollTrigger** — animations (same as ganaderiacatorce.com)
- **Static site** — deployed to GitHub Pages
- **Fonts:** Orbitron (headlines), Josefin Sans (accents), Inter (body) — local .ttf files
- **Menu data:** static `data/menu.json` (separate from gestion, can be wired up later)

---

## Current Architecture: Immersive "Meet the Crew" Redesign

### Concept
A **character-driven continuous scroll journey** where each menu category is a distinct "world" hosted by its personaje. No tab-toggling — all zones are always visible. The sticky nav acts as a scroll spy.

### Flow
Hero (characters rise to welcome you) → Order type (characters host each option) → Scroll through character zones → Salsas showcase → Send order

### Zone Color System
Each zone has a unique accent color used for the left-border on cards, divider glow, tab highlight, and character panel shadow:

| Zone | Accent | Glow |
|------|--------|------|
| Tacos | `#D4231A` (fire red) | Arracherita hosts |
| Quesadillas | `#F9A825` (golden cheese) | Chavindeca hosts |
| Charolas | `#BF360C` (deep ember) | Arracherita hosts |
| Especialidades | `#8D6E63` (earthy cowboy) | Papita hosts |
| Bebidas | `#558B2F` (refreshing green) | Choricito hosts |
| Postres | `#E91E63` (sweet pink) | Chavindeca hosts |

### Key Features Implemented
- [x] Hero: "CATORCE" letter-by-letter reveal, logo blur-in, characters rise from bottom
- [x] Hero: Character parallax — characters move down + fade on scroll
- [x] Zone system: Each category is a `.menu__zone` with character panel, quote, accent color
- [x] Alternating layout: Even zones have character on the right
- [x] Zone entrance animations: Character slides in, name/quote fade, title underline extends, items stagger
- [x] Scroll spy: Active tab updates on scroll, tab accent color changes per zone
- [x] Character wiggle: Zone character shakes when you add an item to cart
- [x] Premium cards: Full-width gradient cards for premium items (New York, Diezmillo charola, etc.)
- [x] `.has-items` glow on cards with items in cart
- [x] Order type: `.has-selection` dims unselected card
- [x] Salsas: Chavindeca hosts the section alongside the title
- [x] QR: Moved from footer to fixed top-right button → modal with download
- [x] Footer: Subtle `todos.jpg` watermark at 6% opacity
- [x] Sticky nav: `backdrop-filter: blur(12px)`, zone-aware accent color
- [x] Embers removed (cleaner look)

---

## File Structure

```
ganaderia-catorce-asador/
├── index.html              # Single-page app
├── css/
│   ├── styles.css          # Source (development)
│   └── styles.min.css      # Minified (production)
├── js/
│   ├── main.js             # Source (development)
│   └── main.min.js         # Minified (production)
├── data/
│   └── menu.json           # Menu data (standalone)
├── assets/
│   ├── fonts/
│   │   ├── Orbitron-Variable.ttf
│   │   └── JosefinSans-Variable.ttf
│   ├── personajes/         # Character images
│   │   ├── arracherita.jpg
│   │   ├── choricito.jpg
│   │   ├── chavindeca.jpeg
│   │   ├── papita.jpg
│   │   └── todos.jpg       # Group shot
│   ├── ac-logo-transparent.png
│   ├── cow-pig.png
│   ├── favicon-32.png
│   ├── favicon-180.png
│   ├── salsas.png          # Placeholder — replace with Flux
│   ├── postres.png         # Placeholder — replace with Flux
│   ├── arrachera2.jpeg     # Source for Flux image-to-image
│   ├── chavindeca.jpeg     # Source for Flux image-to-image
│   └── papita.jpg          # Source for Flux image-to-image
│
│   ## Flux-generated assets (to be added):
│   ├── generated/
│   │   ├── hero-bg.webp         # Generated hero background
│   │   ├── zone-tacos.webp      # Arracherita grilling scene
│   │   ├── zone-quesadillas.webp # Chavindeca with quesadilla
│   │   ├── zone-charolas.webp   # Arracherita feast
│   │   ├── zone-especialidades.webp # Papita cowboy
│   │   ├── zone-bebidas.webp    # Choricito refreshment
│   │   ├── zone-postres.webp    # Sweet dessert scene
│   │   ├── order-dinein.webp    # Arracherita welcoming
│   │   ├── order-takeaway.webp  # Papita on scooter
│   │   ├── salsas-scene.webp    # Salsas showcase
│   │   ├── cart-empty.webp      # Sad characters
│   │   └── cart-celebration.webp # Celebration after order
├── CNAME
├── .gitignore
├── CLAUDE.md
└── PLAN.md
```

---

## Personajes (Characters)

| Character | Represents | File | Personality |
|-----------|-----------|------|-------------|
| **Arracherita** | Arrachera/Meats | arracherita.jpg | Grill master, bandana + apron + tongs |
| **Choricito** | Chorizo Argentino | choricito.jpg | Gaucho, beret + mate + poncho |
| **Chavindeca** | Chavindecas/Quesadillas | chavindeca.jpeg | Tortilla girl, sombrero + cape |
| **Papita** | Papa al Grill | papita.jpg | Cowboy potato, hat + meat + cheese |

---

## Flux Generation Guide

You run Flux. Below are the prompts, what source image to use (if image-to-image), and where to save the output. After generating, tell me the filename and I'll wire it into the site.

### Priority 1 — Zone Character Panels (image-to-image)
These replace the current small circular character images with richer, contextual scenes that fill the zone character panel (displayed at ~140px, but generate at 1024x1024 for quality).

**1. Tacos Zone — Arracherita Grilling**
- **Source:** `assets/personajes/arracherita.jpg`
- **Save as:** `assets/generated/zone-tacos.webp`
- **Flux prompt (image-to-image):**
> "Same arrachera character in leather apron and red bandana, proudly presenting three perfectly assembled tacos on a wooden board, steam rising, warm grill fire glow behind her, dramatic lighting, Pixar-style 3D, black background, high detail, square format"

**2. Quesadillas Zone — Chavindeca with Quesadilla**
- **Source:** `assets/personajes/chavindeca.jpeg`
- **Save as:** `assets/generated/zone-quesadillas.webp`
- **Flux prompt (image-to-image):**
> "Same tortilla girl character with sombrero hat holding a giant golden quesadilla with melted cheese stretching beautifully, proud warm expression, golden backlight, warm yellow-orange tones, Pixar-style 3D, black background, high detail, square format"

**3. Charolas Zone — Arracherita Feast**
- **Source:** `assets/personajes/arracherita.jpg`
- **Save as:** `assets/generated/zone-charolas.webp`
- **Flux prompt (image-to-image):**
> "Same arrachera character standing behind an enormous wooden charola overflowing with grilled meats, tortillas stacked high, lime wedges, bowls of salsa, arms spread wide presenting the feast, smoke rising, dramatic fire glow, Pixar-style 3D, dark background"

**4. Especialidades Zone — Papita Cowboy**
- **Source:** `assets/personajes/papita.jpg`
- **Save as:** `assets/generated/zone-especialidades.webp`
- **Flux prompt (image-to-image):**
> "Same cowboy potato character tipping hat, holding a loaded baked potato overflowing with cheese and meat in one hand, confident western hero pose, warm dusty sunset tones, Pixar-style 3D, dark background, square format"

**5. Bebidas Zone — Choricito Refreshing**
- **Source:** `assets/personajes/choricito.jpg`
- **Save as:** `assets/generated/zone-bebidas.webp`
- **Flux prompt (image-to-image):**
> "Same gaucho chorizo character raising a refreshing drink in a toast, cool green and blue tones, condensation droplets on the glass, relaxed happy expression, Pixar-style 3D, dark background, square format"

**6. Postres Zone — Chavindeca Sweet**
- **Source:** `assets/personajes/chavindeca.jpeg`
- **Save as:** `assets/generated/zone-postres.webp`
- **Flux prompt (image-to-image):**
> "Same tortilla girl character delicately holding a slice of tres leches cake on a plate, heart eyes, pink and warm tones, sparkles and sweetness in the air, Pixar-style 3D, dark background, square format"

---

### Priority 2 — Hero & Order Cards

**7. Hero Background**
- **Source:** `assets/personajes/todos.jpg`
- **Save as:** `assets/generated/hero-bg.webp`
- **Flux prompt (image-to-image):**
> "Same four animated food characters standing together at a dramatic smoking grill, power poses, arrachera with tongs creating sparks, gaucho chorizo raising mate, tortilla girl with cape flowing, cowboy potato tipping hat, fire and embers behind them, cinematic warm lighting, wide angle, Pixar-style 3D, dark smoky background"

**8. Order Card — Dine-In**
- **Source:** `assets/personajes/arracherita.jpg`
- **Save as:** `assets/generated/order-dinein.webp`
- **Flux prompt (image-to-image):**
> "Same arrachera character warmly gesturing toward a rustic wooden table set with plates, tortillas and salsas, welcoming smile, cozy taqueria interior with string lights and warm glow, inviting body language, Pixar-style 3D, portrait format, dark background edges"

**9. Order Card — Takeaway**
- **Source:** `assets/personajes/papita.jpg`
- **Save as:** `assets/generated/order-takeaway.webp`
- **Flux prompt (image-to-image):**
> "Same cowboy potato character riding a delivery motorcycle at speed, one hand on handlebar, other hand holding up a brown paper bag, motion blur background, determined fun expression, Pixar-style 3D, portrait format, dark background edges"

---

### Priority 3 — Section Enhancements

**10. Salsas Scene**
- **Source:** `assets/personajes/chavindeca.jpeg`
- **Save as:** `assets/generated/salsas-scene.webp`
- **Flux prompt (image-to-image):**
> "Same tortilla girl character presenting a row of colorful salsas in clay bowls, steam rising, chili peppers floating around, fiery warm tones, Pixar-style 3D, dark background, wide format"

**11. Empty Cart — Sad Characters**
- **Source:** `assets/personajes/todos.jpg`
- **Save as:** `assets/generated/cart-empty.webp`
- **Flux prompt (image-to-image):**
> "Same four food characters looking sad and hungry, empty plates in front of them, puppy-dog eyes, arrachera's tongs drooping, potato's hat tilted, pleading expressions, dark background with single spotlight, Pixar-style 3D comedy"

**12. Order Celebration**
- **Source:** `assets/personajes/todos.jpg`
- **Save as:** `assets/generated/cart-celebration.webp`
- **Flux prompt (image-to-image):**
> "Same four food characters erupting in celebration, confetti raining down, fire sparklers in background, arrachera raises tongs overhead, gaucho chorizo dances, potato throws hat in air, tortilla girl cheers, energy of a goal celebration, Pixar-style 3D, dark background"

---

### Priority 4 — Videos (image-to-video, optional polish)

These are nice-to-have. Generate if the stills look good and you want to add motion.

| Video | Source Still | Duration | Use |
|-------|-------------|----------|-----|
| Hero entrance | `hero-bg.webp` | 4s loop | Hero background (replaces static img) |
| Tacos zone | `zone-tacos.webp` | 3s loop | Character panel animation |
| Quesadillas zone | `zone-quesadillas.webp` | 3s loop | Character panel animation |
| Especialidades zone | `zone-especialidades.webp` | 3s loop | Cowboy entrance |
| Salsas reaction | `salsas-scene.webp` | 3s | Fire reaction animation |
| Order sent | `cart-celebration.webp` | 3s | Plays on WhatsApp send |

**Video prompts:** Use the same scene description as the still, but add motion: "slight camera push-in, subtle smoke/fire movement, character breathing/blinking idle animation, seamless loop, 3-4 seconds"

---

## Integration: After You Generate

Once you've generated an asset:

1. **Save it** in `assets/generated/` with the filename from the guide above
2. **Tell me** which ones you generated
3. **I'll wire them in** — update `index.html`, `js/main.js` (ZONE_CONFIG character paths), and CSS as needed
4. **For videos:** I'll add `<video>` elements with poster fallback to the stills

### What changes per generated asset:
- **Zone character images** → Update `ZONE_CONFIG` in `main.js` (character path)
- **Hero background** → Update `<img>` src in `index.html` hero section
- **Order cards** → Update `<img>` src in order-type buttons
- **Salsas** → Update salsas section images
- **Empty cart / Celebration** → Update bottom sheet images
- **Videos** → Add video elements alongside/replacing images

---

## Domain Setup

1. Enable GitHub Pages on the `ganaderia-catorce-asador` repo (Settings > Pages > Deploy from branch: `main`)
2. In Cloudflare DNS for `ganaderiacatorce.com`:
   - Add CNAME record: `asador` → `dorianguzman.github.io`
   - Set Cloudflare proxy to DNS-only (gray cloud) so GitHub can issue SSL
3. Add `CNAME` file in this repo with `asador.ganaderiacatorce.com`
4. In GitHub Pages settings, set custom domain to `asador.ganaderiacatorce.com`

---

## QR Code

- Fixed button in top-right corner of the page
- Opens a modal with a large QR code (generated dynamically via QRCode.js)
- "Descargar" button downloads it as PNG for printing/sharing
- Colors: red (`#D4231A`) on white, suitable for print
- Intended for: table tents, stickers, physical menu printouts

---

## Feature: Location Sharing for "Para Llevar"

### Context
When a user selects "Para Llevar", they currently see 3 text fields (street, colonia, referencia). We add a second option: share live GPS location via the browser's Geolocation API, included as a Google Maps link in the WhatsApp message.

### UX Flow
1. User taps "Para Llevar"
2. Two toggle buttons appear: **"Escribir direccion"** | **"Compartir ubicacion"**
3. **Option A (Escribir):** Shows the existing 3 text fields (unchanged)
4. **Option B (Ubicacion):** Shows "Obtener ubicacion" button, then confirmation with Google Maps link + optional referencia field
5. WhatsApp message includes either typed address OR Google Maps coordinates link

### Files Modified

#### `index.html` (lines 89-102)
- Replace `#address-form` div contents with:
  - `.address-toggle` group (two buttons: "Escribir direccion" / "Compartir ubicacion")
  - `#address-fields` wrapper (existing 3 inputs)
  - `#location-share` wrapper with:
    - "Obtener ubicacion" button
    - Status/confirmation area (shows "Ubicacion obtenida" + map link)
    - Optional referencia input

#### `css/styles.css` (after line 507, before Menu section)
- `.address-toggle` — flex row of toggle buttons
- `.address-toggle__btn` — individual toggle button, active state with red accent
- `.location-share` — wrapper, hidden by default
- `.location-share__btn` — "Obtener ubicacion" button styled like order card
- `.location-share__status` — confirmation area with link
- `.location-share__link` — Google Maps anchor styling (orange accent)

#### `js/main.js`
- Add state: `addressMode = 'write'` and `locationCoords = null`
- Add toggle handler to switch between write/location modes (show/hide wrappers)
- Add geolocation button handler:
  - `navigator.geolocation.getCurrentPosition()`
  - On success: store coords, show confirmation with Google Maps link
  - On error: show friendly error message in Spanish
- Update `renderSheet()`: display location link when addressMode is 'location'
- Update `sendWhatsApp()`: if `addressMode === 'location'` and coords exist, include `Ubicacion: https://maps.google.com/?q=LAT,LNG` + optional referencia
- Update `updateSendButton()`: allow send when location coords obtained

### Post-edit
- Minify both files per CLAUDE.md instructions
