# Improvement loop log

Rounds run every 15 minutes. Each entry: what changed and why.

## Round 1 — 2026-11-25
- Scroll tour: the camera now aims at the summit's own height, so the visited summit sits mid-frame instead of off the top (was invisible on phones).
- Phones: each project card snaps to just below the map (scroll-snap proximity), and the camera switches a little earlier.
- Share card: `public/og.jpg` (1200×630, the map with a name plate), replacing a 404. Rendered by `scripts/shoot-og.cjs` from `/og` (not indexed, not in the sitemap).
- Posters: light/dark, phone/desktop stills of the sheet sit behind the canvas, so the first paint is the map, then the live render fades in over it.
