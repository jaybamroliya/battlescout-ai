# ✅ #BattleBotsDev Submission Checklist

Work top to bottom. **Every box in Section 5 is mandatory — missing any one = disqualified.**

## 0. Confirm the deadline FIRST ⏰
- [ ] Open the submission form and confirm the exact closing date/time.
      The landing page indicated **July 31, 2026**; verify before assuming.
      Form: https://forms.gle/ASSkdTaMhpm5Lai36

## 1. Eligibility
- [ ] You are 18+.
- [ ] Not an employee/immediate family of Bright Data or BattleBots.
- [ ] OK with US-only travel for the prize.

## 2. Bright Data credits
- [ ] Claim credits: https://brdta.com/battlebotsdev  (or code `BattleBotsDev` in the billing/credits section).
- [ ] Create a **Web Unlocker** zone; copy the API token + zone name.
- [ ] `cp scraper/.env.example scraper/.env` and fill it in.
- [ ] `npm run scrape` succeeds and writes `data/bots.enriched.json` (real records enrich the demo).

## 3. Repository (Requirement 5.1)
- [ ] Push to a **public** GitHub repo.
- [ ] README present with: description, setup steps, and **how Bright Data is used** (already written).
- [ ] Repo is clean (no `.env` committed — `.gitignore` handles this).

## 4. Live demo (Requirement 5.2) — must work at judging time
- [ ] Enable **GitHub Pages** (Settings → Pages → main / root).
- [ ] Open the live URL in an incognito window to confirm it loads for the public.
- [ ] Paste the live URL at the top of the README.

## 5. Video (Requirement 5.3) — the make-or-break gate
- [ ] Record the ~90s walkthrough (script: `docs/VIDEO_SCRIPT.md`).
- [ ] Post on **at least two** platforms (YouTube + LinkedIn recommended; add X / Instagram / TikTok).
- [ ] **Every** post contains the exact hashtag **`#BattleBotsDev`** (case-sensitive).
- [ ] Video clearly shows: the live demo working + how Bright Data is used.

## 6. Form submission (Requirement 5.4)
- [ ] Submit: https://forms.gle/ASSkdTaMhpm5Lai36
- [ ] Include: repo URL, live demo URL, and **all** video post links.
- [ ] Double-check nothing is blank (incomplete = disqualified).

## 7. Final polish (scores extra points)
- [ ] Add 1–2 screenshots to the README.
- [ ] Verify `npm run analyze` and `npm run demo` both run from a fresh clone.

---

### Judging criteria — how this entry targets each
| Criterion | How we hit it |
|---|---|
| Creativity & Originality | AI *scouting agent* + "AI scout vs the AI robot Orbitron" angle — not another win-rate chart |
| Technical Execution | Working prediction model + reproducible pipeline + zero-setup live demo |
| Use of Bright Data | Web Unlocker API is the *only* way the live records are reachable — central, not cosmetic |
| Community Impact & Presentation | Tight video, multi-platform, shareable hook, clear story |
