# Surface brief: tokala.dev (home and site frame)

Scope: the home sheet, and the frame every other page inherits (routes, trip reports, hut, colophon, 404).
Visitor mode: Experience (home) / Read (trip reports, routes).
Audience: a stranger, recruiter or engineer who has never heard of Rohit. Job: be intrigued first, then go deeper only if they want to.
Chosen in a direction round on 2026-11-25 (Survey over Twenty and Redline). User steer: "flesh it out, make it next level"; harness is **yaah** (yet another agentic harness), never "Blurb"; don't lead with hyper-specific metrics (e.g. "2.1 s → 99 ms") — intrigue first, depth on interaction.

## Direction contract

THESIS: The site is a surveyed map sheet of terrain made from Rohit's own work. Every project is a summit named for the problem it solved, and its height is how far he moved it. Strangers read a beautiful map and a plain promise; the numbers are spot heights you only see when you get close. Refuses the dark dev portfolio, the project-card grid, the hero-metric row, and the "topographic lines" wallpaper texture.

OWN-WORLD: Swiss national map cartography after Eduard Imhof: map-white paper, hypsometric tints rising from valley sage through upland ochre to rock grey, oblique relief shading with aerial perspective, brown contours with labelled index lines, blue glacier contours on the highest summits, spot heights in tabular figures, widely spaced range lettering. Wayfinding is the yellow Wanderweg sign: arrow plates with destination and walking time; red/white/red only for hard routes. Links underline as red-dashed trails. Type: Signika (signage, labels, UI), Literata (reading, italic for water and annotation).

STORY: The visitor sees a range called ROHIT TOKALA and the line "Pick the hill. I'll find the way up." They learn he is a forward deployed engineer in AI who finds the work people still do by hand and builds agents that do it well. Scrolling descends into the range: three summits are visited in turn, each told as a problem in human words, then a route card offers the climb in detail. Trip reports (the weekly writing) are listed like a hut logbook. They act by opening a trip report or a route, or by writing to him.

FIRST VIEWPORT: Full-bleed live relief map at overview scale, the range name lettered across the ridge, summits labelled with problem names only (no figures). Left: the Wanderweg signpost (location plate "Dubai", then Routes, Trip reports, Hut, Contact with walking times). Bottom-right map margin: the legend box carrying the headline, the one-line role, scale bar, north arrow, and a margin note that the light is Dubai's light at this moment. Primary action: the signpost's Routes / Trip reports plates.

FORM: Code-led, position 1 on the ordered list. seed: none (unavailable) — the concept-seed launcher was blocked in this harness; the direction was chosen by the user from a three-card hand built by hand.

SIGNATURE INTERACTION + MOTION GRAMMAR: (1) The sun is Dubai's real solar position for the current minute; pointer takes over the sun while hovering and hands it back on leave. (2) Scroll-linked descent: the map stays pinned while the page scrolls, flying (smooth exponential camera, never jump) from overview to each featured summit and back out; at close range spot heights and route lines resolve in, the cartographic generalisation literally revealing depth. (3) Navigation between pages keeps the map alive (persisted canvas) and flies to the destination summit. Motion is camera motion only; content is visible at rest; reduced motion gets cuts instead of flights and a fixed NW light.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Information architecture
- `/` the sheet (home).
- `/routes/` and `/routes/[slug]` — work and side projects as route descriptions (data-driven content collection; Rohit will supply work details later). Each route: problem in human words → what was built → the climb (before/after, revealed in a profile) → grade (SAC T1–T6) → duration.
- `/reports/` and `/reports/[slug]` — weekly trip reports (blog). MDX with interactive figures; masthead elevation profile = reading progress; walking time + T grade.
- `/hut` — about Rohit, and (phase 2) the hut warden: an on-device open-weights model answering from the site's ontology.
- `/colophon` — the stack reveal.
- `404` — "This area has not been surveyed."

## Unresolved
- Stack reveal choice not answered explicitly; proceeding with the recommended on-device model as phase 2 (the Hut).
- Work route details (dates, scope, visuals) to come from Rohit; names stay generic.
- Whether the employer is named: default "a global engineering and construction firm".
