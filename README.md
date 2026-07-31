# 🤖 BattleScout AI

[![tests](https://github.com/jaybamroliya/battlescout-ai/actions/workflows/test.yml/badge.svg)](https://github.com/jaybamroliya/battlescout-ai/actions/workflows/test.yml)

**An AI scouting agent for robot combat.** Pick any two BattleBots heavyweights and BattleScout AI returns a data-driven matchup prediction, a scouting report, and the weapon-archetype "meta" behind it — enriched with **live public web data via [Bright Data](https://brightdata.com)**.

> Entry for the **#BattleBotsDev** Competition · *BattleBots Pro League Powered by Bright Data*

**🔗 Live demo — no signup, runs entirely in your browser:** https://jaybamroliya.github.io/battlescout-ai/

---

## Try it in 10 seconds (deep links)

| Link | What you'll see |
|---|---|
| [Orbitron vs Tombstone](https://jaybamroliya.github.io/battlescout-ai/web/index.html?view=scout&pair=orbitron-tombstone) | Prediction + full scouting report |
| [A finished simulated fight](https://jaybamroliya.github.io/battlescout-ai/web/index.html?view=scout&pair=orbitron-tombstone&sim=instant) | Round-by-round play-by-play with HP bars |
| [Ask: "Which weapon type dominates?"](https://jaybamroliya.github.io/battlescout-ai/web/index.html?ask=Which%20weapon%20type%20dominates%3F) | Plain-English query answered from the data |
| [Leaderboard, filtered to vertical spinners](https://jaybamroliya.github.io/battlescout-ai/web/index.html?view=board&q=vertical) | Meta Score ranking + search |

## Why this project

Every BattleBots stats project shows the same thing: a bar chart of past wins. BattleScout AI does something different — it answers the question fans actually argue about: **"who would win?"** — and it backs the answer with a transparent model *and* live web data.

The 2026 Pro League introduces **Orbitron, billed as the first fully AI-controlled combat robot**. So the signature demo is fitting: point an *AI scout* at the *AI robot* — `Orbitron vs Tombstone` — and see how autonomy stacks up against a former World Champion.

## What it does

1. **⚔️ Scout a Matchup** — pick any two of 37 heavyweights and get a win probability, a stat comparison (career win rate / KO rate / experience), and a written **scouting report** (weapon matchup, track record, finishing power, path to victory).
   Model = weapon-archetype matchup matrix + career win rate + KO rate.
   - **▶️ Simulate the fight** — a round-by-round exchange simulation driven by the *same* model: HP bars drain and a play-by-play prints ("Tombstone connects with the horizontal spinning bar — 19 damage"), ending in a KO or a judges' decision.
   - **🔊 Commentary** — optional spoken play-by-play using the browser's speech engine (no API key, no cost, works offline).
1. **🤖 Ask BattleScout** — ask in plain English: *"Who wins, End Game or Tombstone?"*, *"Who has the highest KO rate?"*, *"Which weapon type dominates?"*, *"Robots from Brazil"*, *"Tell me about Orbitron"*.
   Deliberately a **deterministic query engine over the dataset, not an LLM** — so it is fast, free, offline, and **cannot hallucinate**. Every answer cites where the number came from.
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

**Account usage for this project** (from the Bright Data dashboard, Web Unlocker zone `web_unlocker1`):

| Metric | Value |
|---|---|
| Web Unlocker API requests | **76** |
| Bandwidth pulled | **10.7 MB** |
| Pages unlocked | **36 / 37** |
| Cost | a few cents of the free competition credits (4,927 / 5,000 remaining) |

### Structured extraction, not just fetching

Unlocking the page is only half of it — [`scraper/parse-specs.mjs`](scraper/parse-specs.mjs) then parses each robot's **portable-infobox fields (team, weapon, weight, power, drive)** out of that HTML and maps the weapon text onto the model's archetype. It cross-checks that against `data/bots.json` and **flags disagreements instead of hiding them**:

```bash
npm run specs     # 36/36 pages parsed -> docs/scraped-specs.md
```

Result: **27 archetypes confirmed** by the scraped weapon text, **8 flagged** — and the flagged ones are real ambiguities (Bombshell's interchangeable weapons, HyperShock's season-to-season changes, Whiplash's lifter+spinner hybrid), documented in [docs/scraped-specs.md](docs/scraped-specs.md).

Honest boundary: the wiki infobox has **no career win-loss field**, so records are *not* auto-scraped — they stay researched and source-cited ([docs/DATA_SOURCES.md](docs/DATA_SOURCES.md)). What the pipeline refreshes is the structured specs that drive the archetypes.

### Verification suite (`npm test`)

The claims above are checked by code, not by assertion:

```bash
npm test     # 18 checks, no dependencies, no network
```

1. **Dataset integrity** — unique ids, known archetypes, **every record carries a confidence label**, `koRate` is a valid probability, only the rookie has zero fights.
2. **Model invariants** — probabilities strictly inside (0,1); `P(A beats B) + P(B beats A) = 1` (max deviation `2.2e-16`); a bot vs itself is exactly 50%.
3. **Simulation calibration** — the headline check. Nine exchanges *compound* an edge, so feeding the model probability straight into each exchange made a 30% underdog win only **7%** of fights. The simulation now **bisects for the exchange probability that reproduces the model's win probability**, and the test confirms it over 20,000 fights per matchup:

| Matchup | Model | 20,000 simulations | Gap |
|---|---|---|---|
| End Game vs Tombstone | 55.9% | 54.9% | 1.0pp |
| Orbitron vs Tombstone | 30.2% | 29.3% | 1.0pp |
| Bite Force vs Mammoth | 94.5% | 94.9% | 0.4pp |
| Uppercut vs Gruff | 90.2% | 90.1% | 0.1pp |

So the animated fight **cannot disagree with the prediction** — that consistency is enforced by a test, and the bug it caught is documented here rather than hidden.

### What's measured vs. what's modelled

Stated plainly, because the difference matters:

| Value | Nature | Source |
|---|---|---|
| Robot name, builder, country, weapon, weight | **Measured** | Public pages; weapon/team/weight re-scraped via Bright Data ([docs/scraped-specs.md](docs/scraped-specs.md)) |
| `403` vs `200` fetch results, request count, bytes | **Measured** | The pipeline's own run + the Bright Data dashboard ([docs/bright-data-proof.md](docs/bright-data-proof.md)) |
| Championship / finalist history | **Measured** | Wikipedia + official site ([docs/DATA_SOURCES.md](docs/DATA_SOURCES.md)) |
| Career win-loss | **Mixed, labelled per row** | `official` (battlebots.com profile) · `cited` (widely reported) · `est` (estimate) · `new` (no record yet) |
| KO % | **Estimated tendency** | Not an officially published stat — an indicative finishing tendency |
| Win probability, Meta Score, archetype meta % | **Model output** | Computed by the model in this repo — predictions, not historical fact |
| Fight simulation | **Stochastic simulation** | Same model + randomised exchanges; re-running gives different fights, like real ones |

Nothing in the UI presents a model output as a historical result, and every record carries its confidence label on the row itself.

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

## 🗂 Repository map — every file and why it exists

There is no dead weight here; each file below is either run by an npm script, served to the browser, or generated as evidence.

| Path | What it is | Why it's here |
|---|---|---|
| `web/index.html` | **The application.** All four tabs, the model, the fight simulation, the Ask engine — one self-contained file. | This *is* the live demo. Static, so GitHub Pages can serve it and it can't break at judging time. |
| `index.html` | 4-line redirect to `web/index.html`. | Lets the demo open at the clean URL `…github.io/battlescout-ai/`. |
| `data/bots.json` | Dataset of **37 heavyweights** — builder, country, weapon, archetype, record, KO tendency, honours, confidence label. | Single source of truth. Validated by `npm test`. |
| `scraper/scrape.mjs` | Bright Data **Web Unlocker** pipeline. Fetches each robot's page twice — plain vs. unlocked — and saves the raw HTML. | `npm run scrape`. Produces the 403→200 proof. |
| `scraper/parse-specs.mjs` | Parses the portable-infobox fields (team / weapon / weight / power / drive) out of the unlocked HTML and cross-checks archetypes. | `npm run specs`. Runs offline against saved HTML, so it costs nothing to re-verify. |
| `scraper/.env.example` | Template for `BRIGHTDATA_API_TOKEN` + zone. | Setup docs. The real `.env` is git-ignored — **no secret is ever committed**. |
| `analysis/analyze.mjs` | Computes the archetype meta and the Meta-Score leaderboard, writes `docs/insights.md`. | `npm run analyze`. |
| `test/verify.mjs` | 18 checks: dataset integrity, model invariants, simulation calibration. | `npm test`. This is what proves the claims in this README. |
| `.github/workflows/test.yml` | CI: runs `npm test`, `npm run analyze` and the Bright Data dry-run on every push. | The green **tests passing** badge at the top comes from here. |
| `docs/bright-data-proof.md` | Generated table: plain fetch vs. Bright Data, per robot. | Evidence for "Use of Bright Data" — reproducible, not a screenshot. |
| `docs/scraped-specs.md` | Generated table of the structured fields extracted from unlocked HTML, with the archetype cross-check. | Shows the unlocked data is actually *used*, not just fetched. |
| `docs/DATA_SOURCES.md` | Provenance: every source URL, the confidence scale, and corrections made during research. | So any number can be traced back. |
| `docs/insights.md` | Generated analysis output. | Artifact of `npm run analyze`. |
| `package.json` | Scripts and metadata. **No `dependencies`.** | Clone and run — no `npm install` needed. |
| `.gitignore` | Excludes `scraper/.env`, `node_modules/`, scraped HTML evidence, and local working notes. | Keeps secrets and bulk out of the repo. |
| `LICENSE` | MIT. | |
| `README.md` | This file. | |

### All commands

```bash
npm test          # 18 verification checks (no network, no credentials)
npm run demo      # serve the app at http://localhost:8080
npm run analyze   # recompute the meta + leaderboard -> docs/insights.md
npm run specs     # re-parse saved HTML -> docs/scraped-specs.md (no API calls)
npm run scrape:dry # show exactly what the pipeline would fetch (no credentials needed)
npm run scrape    # live Bright Data run (needs scraper/.env)
```

## 🧠 The model (transparent by design)

```
logit = 4.0 · Δ(career win rate)
      + 1.2 · Δ(KO tendency)
      + 3.0 · (archetypeEdge − 0.5)

P(A beats B) = sigmoid(logit)
```

- **Δ(career win rate)** — difference in each robot's win rate; the dominant term.
- **Δ(KO tendency)** — difference in finishing power, a smaller nudge.
- **archetypeEdge** — from a weapon matchup matrix encoding the observed meta (e.g. vertical spinners edge horizontals `0.58` because they self-right and drive energy downward). Symmetric by construction: `M[b][a] = 1 − M[a][b]`.

Properties enforced by `npm test`: probabilities stay strictly inside (0,1), `P(A beats B) + P(B beats A) = 1` (max deviation `2.2e-16`), and a robot against itself is exactly 50%. Every factor is spelled out in the scouting report — no black box.

## 🛣 Roadmap

- Fan-sentiment layer: scrape Reddit / YouTube reactions via Bright Data and weigh "hype vs. performance".
- Per-episode refresh of the **structured specs** through the same pipeline as the 2026 season airs. (Career win-loss can't be auto-scraped — those pages carry no such field — so records would stay researched and labelled.)

## 📄 License

MIT — see [LICENSE](LICENSE). Data points are public factual information; records/sentiment are collected via the user's own Bright Data account.

---

*Built for the **#BattleBotsDev** Competition.*
