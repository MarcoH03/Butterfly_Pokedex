# 🦋 Mariposas de Cuba

A PWA field guide to the butterflies of Cuba.  
Pixel art Pokédex aesthetic. Works offline on iPhone after first load.

---

## Setup (first time only)

```bash
# 1. Install dependencies
npm install

# 2. Run for desktop browser only (HTTP, no PWA install)
npm run dev

# 3. Run over local WiFi with HTTPS (needed to install on iPhone)
npm run dev:host
```

When you run `dev:host`, the terminal will show something like:

```
  ➜  Local:    https://localhost:5173
  ➜  Network:  https://192.168.1.45:5173
```

Type the **Network** address into Safari on your iPhone.
Safari will warn "This connection is not private" — tap **Advanced → Visit Website**.
Once the app loads, tap the **Share button → Add to Home Screen**.
The app is now installed and cached for offline use. ✅

---

## Project structure

```
src/
├── App.jsx                  # Root: header + routing
├── main.jsx                 # React entry point
├── index.css                # Design system (pixel art tokens)
├── data/
│   └── butterflies_cuba.json  # Species database (207 entries)
├── hooks/
│   └── useButterflies.js    # All filter/search logic
├── pages/
│   ├── ListPage.jsx         # Main species list
│   └── DetailPage.jsx       # Detail view (3 tabs)
└── components/
    ├── ButterflyRow.jsx     # Single list row
    ├── FilterDrawer.jsx     # Slide-up filter panel
    └── PixelSprite.jsx      # Image with pixel-art placeholder
```

---

## Filling in the database

Each species in `butterflies_cuba.json` starts as `"data_quality": "placeholder"`.
As you research each species:

1. Fill in the fields (wingspan, colors, host plants, provinces, etc.)
2. Add images to `public/img/` following the naming convention:
   `001_battus_thumb.jpg`, `001_battus_adult_01.jpg`, etc.
3. Change `data_quality` to `"partial"` or `"complete"`

---

## Next phases

- [ ] Phase 3: Leaflet.js map with Cuba province shading (Tab 3)
- [ ] Phase 4: PWA icons, splash screen, offline testing
- [ ] Phase 5: Real photos and data for all species
