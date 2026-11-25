# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated, with one standing instruction: "bleeding edge, ultra performant", and the stack itself should be a reveal — something a visitor discovers late and can't quite believe works. TypeScript is preferred but not binding. Hosting: Vercel. Domain: tokala.dev. Everything lives in code; no external CMS or services.

Working recommendation (to confirm alongside the direction round): Astro 7 static output, MDX content collections, TypeScript, islands only where a post or the home page needs live interaction, WebGPU/WASM for the signature moments, Pagefind search, build-time OG images, RSS, sitemap, JSON-LD, cross-document view transitions and speculation rules.

## Users

1. Rohit himself — the site is first a place to publish and to keep a record of work.
2. Recruiters and hiring managers deciding, fast, whether he can take on a hard problem.
3. Engineers and builders who would read a weekly post about something he tried that week, and might want to collaborate.

## Product Purpose

A personal site and weekly engineering journal for Rohit Tokala, a Forward Deployed Engineer in AI at a global AEC (architecture, engineering, construction) firm. It shows what he has built, publishes interactive write-ups, and invites collaboration by email.

Success: within 30 seconds a visitor believes "whatever the problem is, this person will figure it out" — dependable, says yes to hard problems — and is in awe of the site itself. Then they read a post or email him.

## Positioning

He finds manual work inside a very large organisation (and its clients) that, in the agentic era, should not be done by hand any more, and he builds the agents that do it well. To other engineers: he picks a problem and hill-climbs it — latency, eval scores, fine-tune accuracy, multi-agent error rates — until the number moves and stays moved. Every claim on the site is a measured before → after, never an adjective.

## Operating Context

- Career: Data Engineer → Data & AI Engineer (July 2026) → Forward Deployed Engineer (October 2026), same firm.
- Works largely from his phone, directing agents, often overnight. Linux, Neovim/Zed, a home server ("t40").
- Writes one post a week: something built or tested that week, or a view on the landscape.
- Project details for work will be supplied by Rohit (dates, scope, visuals). The work section must be data-driven and easy to change.

## Capabilities and Constraints

- **Employer naming:** never name the employer's products or clients. Describe work generically (AI document intelligence, GIS capital planning, schedule management, sales intelligence, offline field inspection, ESG data collection). Whether the employer itself is named is undecided — default to "a global AEC firm".
- No code walkthroughs as the main event; visitors are not expected to read source.
- Blog interactivity: sliders that change a model, replayable agent traces, clickable charts, maps. Runnable code is not a priority.
- SEO is a requirement: canonical URLs, structured data, OG images, sitemap, RSS, fast first paint.

## Brand Commitments

- Voice: plain, direct, concrete nouns, no hype, no marketing gloss. His own words from past work: "no slop", "denoise", "no need of these blurbs, makes things too noisy".
- It must feel handmade and authentic — "every single decision with purpose and thought" — never the uncanny valley of AI-generated sites.
- Admired reference: Fluid Functionalism (spring motion, highlights that glide between items without layout shift) — attention to minute details nobody else would think to care about.
- Performance is a brand value: "quick, snappy", fewer dependencies.

## Evidence on Hand

Work (anonymise all names; figures from session records, confirm before publishing):
- AI document intelligence platform on a knowledge-graph backend (≈1 year, his longest): from chatbot to generating PM deliverables, filling pricing spreadsheets, decks; now interactive HTML decks. Cold load 8–27 s → 3.2 s; config probe 22 s → 1.5 s; tests 61 → 1,241; replay evals with blind LLM judges, branch beat production on 13 of 15 questions; large multi-document summaries from four failed turns to one 85–130 s turn.
- AI sales-intelligence tool: monthly, the three highest-value early/mid-game actions across all clients — who to bring, what to discuss, expected outcomes — from relationship, opportunity and past-bid data.
- GIS capital-programme planner: ~370 projects, schedule phasing with drag-to-reschedule, 2040 supply-demand scenario sliders, district liveability analytics. Map interaction 2,121 ms → 99 ms; search 2,200 → 512 ms; Gantt hover 984 → 312 ms.
- Offline-first field inspection PWA; contractor ESG data platform; land-suitability prototype.

Personal:
- Blurb desktop — his own agentic coding harness (Rust, GPUI): worktree-isolated sessions, tree-sitter + PageRank repo map (index ≈230 ms).
- Alaya — self-hosted library with spoiler-safe AI (facts stamped by position, never past your bookmark).
- FamForge — family tree with an Indian kinship-term engine.
- Vinu — Audiobookshelf Android client (public).
- Homelab t40: Hermes agent, book recommendation engine, automations.
- Excluded from the site: Forge. trot (trading lab) only as a story if ever.

Planned first posts: building an enterprise ontology from scratch (platform-agnostic, encoding business logic); multi-agent orchestration toward one output (concurrency, rate limits, collision handling); "To LoRA or not to LoRA" — when fine-tuning open weights beats context engineering and retrieval.

Absent, must not be fabricated: testimonials, client names, employer product names, follower counts.

## Product Principles

1. Prove, don't claim: every capability shown as a measured change or a working demo.
2. Dependable over flashy — but the craft itself should leave people in awe.
3. Remove before adding: denoise every screen until each element has a job.
4. Fast is a feature: the site's own performance is part of the argument.
5. Personal without being cute: his world (hikes, science fiction, cubing, Dubai, Hyderabad) informs the craft, never decorates it.

## Accessibility & Inclusion

WCAG 2.2 AA. Every interactive demo has a keyboard path and a reduced-motion rendition; content readable with JavaScript disabled.
