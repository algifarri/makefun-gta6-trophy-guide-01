# makefun-gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/algifarri/makefun-gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/algifarri/makefun-gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Leonida Legend: an offline guide & tracker for all 55 GTA VI PS5 trophies — official names, descriptions and grades, own-words guides with cited sources, the one missable trophy flagged, a 9-stage platinum roadmap, localStorage checklist with export/import, kind filters and a spoiler mode.

## Run it

```sh
Built in one witnessed recording session with Muse (Muse Spark): web research on the published trophy list, a hand-written 55-trophy data file, a dependency-free static app, headless functional tests and real-render screenshots.
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=ajkq5baq&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>

## What this is

**Leonida Legend** — an offline, dependency-free static web app (open `app/index.html`, or `node serve.ts` then http://localhost:8080):

- All **55 PS5 trophies** with official name, description and grade (1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden on PSN), cross-checked between the published Exophase and PSNProfiles lists.
- A **guide for every trophy in our own words**, each naming its sources, with the target count where PlayStation tracks one.
- **One missable trophy flagged** (Positive Mental Attitude — the Chapter 1 balcony meditation), plus two save-watch warnings.
- A **9-stage roadmap to the platinum** rendered from the same data file.
- Checklist saved in the browser (localStorage), **export/import** as JSON, **filters** by kind (story, collectibles, activities, crime & robberies, partner, exploration, completion, missable — and an Online view that explains there are none), grade and search, and a **spoiler mode** that hides story trophies until earned.
- No Rockstar logo, artwork or game screenshots; the dusk-neon look is the app's own CSS. Fully offline: no network requests at runtime.

Run the entry the way the grader does:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # copies app/ + screenshots/, writes out/dossier.json
```
