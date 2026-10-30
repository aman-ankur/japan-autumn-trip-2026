# Japan Autumn Trip · 10-25 November 2026

A responsive, self-contained GitHub Pages guide for a confirmed 15-night Japan autumn trip for two.

## Included

- Confirmed 10-25 November day-by-day itinerary
- Confirmed flight timing and baggage allowance
- Six-stay accommodation booking sheet
- Confirmed rental car from Matsumoto, 12-20 November
- Final Gero-Magome-Kiso car loop through Hirayu, Takayama, Kawaguchiko and back to Matsumoto
- Public transport before and after the loop, with no duplicated car-replaced fares
- Foliage-aware, weather-flexible Fuji, Kamakura and Tokyo days
- Couple ground-trip budget calculations in INR
- Official planning and transport links

The page uses no framework, build step, tracking scripts or third-party image assets.

## Local preview

Open `index.html` directly, or serve this directory with any static web server.

## Publishing

GitHub Pages is configured to publish from the repository's `main` branch at the root directory.

## Private details

Booking names are encrypted in the page and revealed with the 🔒 button. Edit `private/index.source.html` (not committed), then rebuild:

    node tools/build-vault.mjs /path/to/passphrase-file
