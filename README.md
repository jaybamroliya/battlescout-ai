# 🤖 BattleScout AI

**An AI scouting agent for robot combat.** Pick any two BattleBots heavyweights and BattleScout AI returns a data-driven matchup prediction, a scouting report, and the weapon-archetype "meta" behind it — enriched with **live public web data via [Bright Data](https://brightdata.com)**.

> Entry for the **#BattleBotsDev** Competition · *BattleBots Pro League Powered by Bright Data*

**🔗 Live demo:** https://jaybamroliya.github.io/battlescout-ai/
**🎥 Video walkthrough:** _[add your YouTube/LinkedIn/X links here]_

---

## Why this project

Every BattleBots stats project shows the same thing: a bar chart of past wins. BattleScout AI does something different — it answers the question fans actually argue about: **"who would win?"** — and it backs the answer with a transparent model *and* live web data.

The 2026 Pro League introduces **Orbitron, billed as the first fully AI-controlled combat robot**. So the signature demo is fitting: point an *AI scout* at the *AI robot* — `Orbitron vs Tombstone` — and see how autonomy stacks up against a former World Champion.

## What it does (3 tabs)

1. **⚔️ Scout a Matchup** — pick any two of 38 heavyweights and get a win probability, a stat comparison (career win rate / KO rate / experience), and a written **scouting report** (weapon matchup, track record, finishing power, path to victory).
   Model = weapon-archetype matchup matrix + career win rate + KO rate.
2. **🏆 Leaderboard** — all bots ranked, with a **Meta Score** column unique to BattleScout AI: each bot's average predicted win probability against the *entire field*. It rewards a strong weapon archetype, not just a padded record — e.g. **End Game ranks #1 by Meta Score even though Bite Force has a higher raw win rate.**
3. **📊 The Meta** — average win rate of each weapon archetype across all matchups. Headline finding: **vertical spinners rule the box (62.4%)**; control bots sit at the bottom — and this isn't a guess: **6 of the last 7 Giant Nut champions were spinners** (see [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md)).

All data is **researched and source-cited** with honest confidence labels (`official` / `cited` / `est`) — see [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md).

## 🌐 How Bright Data is used (the core of this entry)

BattleBots data lives on pages that actively block plain scrapers — the official site and fan wikis return anti-bot challenges (during development, a fan wiki even returned an HTTP 402 block to a normal request). That is exactly the problem **Bright Data's Web Unlocker** solves.

[`scraper/scrape.mjs`](scraper/scrape.mjs) sends each bot's page through the **Bright Data Web Unlocker API** (`POST https://api.brightdata.com/request`), which rotates IPs, solves challenges, and renders JavaScript so the pages return real HTML. The pipeline then parses each bot's **win-loss record** and merges it into the dataset:

```
data/bots.json ──(Bright Data Web Unlocker)──▶ data/bots.enriched.json ──▶ model ──▶ BattleScout AI
```

Bright Data is not decoration here — it is the only reason the live records and (roadmap) fan-sentiment data can be collected at all. Without it, these sources are unreachable.

**Proof:** running the pipeline against the BattleBots fan wiki, a plain fetch is **blocked (HTTP 403)** for every robot, while the **Bright Data Web Unlocker returns the full page (HTTP 200, 0.5–1 MB each)**. The full before/after table for all 37 robots is in [docs/bright-data-proof.md](docs/bright-data-proof.md), with raw HTML saved under `scraper/evidence/`.

### Structured extraction, not just fetching

Unlocking the page is only half of it — [`scraper/parse-specs.mjs`](scraper/parse-specs.mjs) then parses each robot's **portable-infobox fields (team, weapon, weight, power, drive)** out of that HTML and maps the weapon text onto the model's archetype. It cross-checks that against `data/bots.json` and **flags disagreements instead of hiding them**:

```bash
npm run specs     # 36/36 pages parsed -> docs/scraped-specs.md
```

Result: **27 archetypes confirmed** by the scraped weapon text, **8 flagged** — and the flagged ones are real ambiguities (Bombshell's interchangeable weapons, HyperShock's season-to-season changes, Whiplash's lifter+spinner hybrid), documented in [docs/scraped-specs.md](docs/scraped-specs.md).

Honest boundary: the wiki infobox has **no career win-loss field**, so records are *not* auto-scraped — they stay researched and source-cited ([docs/DATA_SOURCES.md](docs/DATA_SOURCES.md)). What the pipeline refreshes is the structured specs that drive the archetypes.

### Architecture: no backend, by design

| Layer | Where it runs | Network calls |
|---|---|---|
| **Web app** (`web/index.html`) | Entirely in the browser — static file, no server | **None.** The dataset is embedded, so the demo can't break at judging time |
| **Bright Data pipeline** (`scraper/scrape.mjs`) | On your machine, **offline / ahead of time** | `POST api.brightdata.com/request` per robot |
| **Analysis** (`analysis/analyze.mjs`) | Node, local | None |

Two deliberate reasons for this split:

1. **Reliability** — a static demo has nothing to keep running, so the live URL works forever (no cold starts, no expired hosting).
2. **Security** — the Bright Data API token stays in `scraper/.env` (git-ignored) and is **never shipped to the browser**. Calling the API client-side would publicly expose the token.

**Zero dependencies:** `package.json` has no `dependencies` — clone and run, no `npm install` required (Node 18+).

## 🚀 Run it locally (Node 18+, no other install)

```bash
# 1. Live demo (also deployable as a static site — see below)
npm run demo          # → http://localhost:8080

# 2. Analysis engine — computes the meta + featured matchups
npm run analyze       # → prints insights, writes docs/insights.md

# 3. Bright Data enrichment (dry-run works with no credentials)
npm run scrape:dry    # shows exactly what it will fetch
```

### Enable live scraping with Bright Data

```bash
# Claim competition credits: https://brdta.com/battlebotsdev  (promo code: BattleBotsDev)
cp scraper/.env.example scraper/.env     # then fill in your API token + zone
npm run scrape                            # enriches every bot with its live record
```

## 🌍 Deploy the live demo (free, ~2 minutes)

The demo is a single self-contained file — `web/index.html`. To satisfy the competition's **live demo** requirement:

1. Push this repo to GitHub.
2. **Settings → Pages → Deploy from branch → `main` / root** (or point Pages at `/web`).
3. Your live URL will be `https://<username>.github.io/<repo>/web/` — paste it at the top of this README and into the submission form.

## 🗂 Project structure

```
battlescout-ai/
├── web/index.html          # the live demo (self-contained, GitHub Pages ready)
├── scraper/scrape.mjs      # Bright Data Web Unlocker enrichment pipeline
├── analysis/analyze.mjs    # meta + matchup analysis engine
├── data/bots.json          # seed dataset (20 heavyweights)
├── docs/insights.md        # auto-generated insights
└── README.md
```

## 🧠 The model (transparent by design)

`P(A beats B) = sigmoid( 0.62 · archetypeEdge + 0.38 · reputationEdge )`

- **archetypeEdge** comes from a matchup matrix encoding observed BattleBots meta (e.g. vertical spinners edge horizontals ~58/42 because they self-right and deliver energy upward).
- **reputationEdge** is each bot's competitive-pedigree index.

Every factor is visible in the scouting report — no black box.

## 🛣 Roadmap

- Fan-sentiment layer: scrape Reddit / YouTube reactions via Bright Data and weight "hype vs. performance."
- Live season sync: auto-refresh records after each 2026 Pro League episode.

## 📄 License

MIT — see [LICENSE](LICENSE). Data points are public factual information; records/sentiment are collected via the user's own Bright Data account.

---

*Built for the **#BattleBotsDev** Competition.*
