# Data Sources & Honesty Notes

BattleScout AI is built on **researched, source-cited data** — not invented numbers. This document is the provenance trail.

## Sources
- **battlebots.com** — official per-robot profile pages (career/season stat tables). Source of the `official`-confidence records.
- **en.wikipedia.org/wiki/BattleBots** and per-season pages — World Championship (Giant Nut) history.
- **battlebots.fandom.com** — per-robot infoboxes and weapon/team details. *(Note: this wiki returns HTTP 402 to plain HTTP clients — a browser-grade scraper like Bright Data's Web Unlocker is required to read it, which is exactly what our pipeline uses.)*
- **businesswire.com/news/home/20260226772620** — the Feb 26, 2026 press release announcing "BattleBots Powered by Bright Data," the 24-robot Pro League, and **Orbitron** (the AI-controlled robot). Corroborated by AV Club and the Hacksmith Industries / DigiKey project page.

## Confidence labels (shown in the app)
| Label | Meaning |
|---|---|
| `official` | Win-loss taken from the robot's battlebots.com profile (point-in-time, televised matches). |
| `cited` | Widely reported figure (e.g. Bite Force 26-1), not verified against a primary table. |
| `est` | Estimate consistent with the robot's known standing. **Refresh to exact figures via `npm run scrape`.** |
| `new` | 2026 Pro League newcomer with no televised record yet (Orbitron). |

## Verified championship history (Giant Nut)
| Year | Champion | Archetype |
|---|---|---|
| 2015 | Bite Force | Vertical spinner |
| 2016 | Tombstone | Horizontal spinner |
| 2018 | Bite Force | Vertical spinner |
| 2019 | Bite Force | Vertical spinner |
| 2020 | End Game | Vertical spinner |
| 2021 | Tantrum | Vertical spinner |
| 2022 | SawBlaze | Hammer/saw |

**This is the evidence behind our headline insight:** 6 of the last 7 champions were spinners, and vertical spinners dominate — the model's meta ranking matches real results. *(No traditional Giant Nut world champion is asserted for 2023/2024, as it could not be verified.)*

## Corrections made during research (rigor over assumptions)
- **Icewave** builder → Marc DeVidts (not Meggiolaro).
- **Gruff** builder → Sam McAmis; classified as **control**, not a spinner.
- **HiJinx** builder → Offbeat Robotics / Jen Herchenroeder.
- **Black Dragon** builder → Team Uai!rrior / Gabriel Gomes.
- **Blip** and **Hydra** classified as **flippers** (not spinners).
- **Orbitron** confirmed real: Canada, Team Orbitron × Hacksmith Industries, twin vertical spinners driven by computer vision.

## Where the numbers are least certain
Precise *lifetime* win-loss totals are the least reliable data in combat robotics — official profiles are point-in-time and count only televised matches. That's the honest reason the Bright Data pipeline matters: it lets these records be **re-scraped and refreshed** rather than frozen.
