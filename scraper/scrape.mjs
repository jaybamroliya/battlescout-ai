// BattleScout AI — Bright Data enrichment pipeline
// -------------------------------------------------
// Fetches public BattleBots web pages THROUGH Bright Data's Web Unlocker API
// (which handles anti-bot / JS-rendered pages that plain fetch cannot) and
// enriches data/bots.json with each bot's scraped record + a raw-HTML proof.
//
// Zero npm dependencies — uses Node's native fetch (Node 18+).
//
// Setup (one time):
//   1) Claim your credits:  https://brdta.com/battlebotsdev  (or code BattleBotsDev)
//   2) In the Bright Data dashboard, create a "Web Unlocker" zone.
//   3) Copy your API token + zone name into scraper/.env  (see .env.example)
//
// Run:
//   node scraper/scrape.mjs            # enrich all bots
//   node scraper/scrape.mjs --dry-run  # no API calls; show what it would do
//
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// --- tiny .env loader (no dependency) ---
function loadEnv() {
  const p = join(__dirname, ".env");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv();

const TOKEN = process.env.BRIGHTDATA_API_TOKEN;
const ZONE = process.env.BRIGHTDATA_ZONE || "web_unlocker1";
const DRY = process.argv.includes("--dry-run") || !TOKEN;

const BOTS_PATH = join(ROOT, "data", "bots.json");
const OUT_PATH = join(ROOT, "data", "bots.enriched.json");
const db = JSON.parse(readFileSync(BOTS_PATH, "utf8"));

// Build the target URL for each bot on the official site.
// (Slugs are a best-effort guess; adjust per real site structure.)
const targetUrl = (bot) =>
  `https://battlebots.com/robots/?q=${encodeURIComponent(bot.name)}`;

/**
 * Fetch a URL through Bright Data's Web Unlocker API.
 * Docs: POST https://api.brightdata.com/request  { zone, url, format }
 * The Unlocker rotates IPs, solves challenges, and renders JS so that
 * anti-bot pages (like fan wikis / official sites) return real HTML.
 */
async function brightDataFetch(url) {
  const res = await fetch("https://api.brightdata.com/request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ zone: ZONE, url, format: "raw" }),
  });
  if (!res.ok) throw new Error(`Bright Data ${res.status}: ${await res.text()}`);
  return res.text();
}

// Best-effort extraction of a win-loss record from raw HTML.
function parseRecord(html) {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const m = text.match(/(\d{1,3})\s*[-–]\s*(\d{1,3})\b/); // e.g. "12-4"
  if (m) return { wins: +m[1], losses: +m[2], source: "battlebots.com" };
  return null;
}

async function main() {
  console.log(`\n🤖 BattleScout AI — Bright Data enrichment`);
  console.log(`   Bots to enrich: ${db.bots.length}`);
  console.log(`   Zone: ${ZONE}`);

  if (DRY) {
    console.log(`\n⚠️  DRY RUN (no BRIGHTDATA_API_TOKEN found).`);
    console.log(`   This is exactly what runs once you add credentials:\n`);
    for (const b of db.bots.slice(0, 3))
      console.log(`   • POST api.brightdata.com/request  →  ${targetUrl(b)}`);
    console.log(`   ... (${db.bots.length} total)\n`);
    console.log(`   To go live:`);
    console.log(`   1) Claim credits:  https://brdta.com/battlebotsdev  (code: BattleBotsDev)`);
    console.log(`   2) Create a Web Unlocker zone in the dashboard`);
    console.log(`   3) cp scraper/.env.example scraper/.env  and fill in your token + zone`);
    console.log(`   4) node scraper/scrape.mjs\n`);
    return;
  }

  let ok = 0;
  for (const b of db.bots) {
    try {
      const html = await brightDataFetch(targetUrl(b));
      const rec = parseRecord(html);
      b.record = rec;
      b.scrape = { fetchedChars: html.length, ok: true };
      ok++;
      console.log(`   ✅ ${b.name}: ${rec ? `${rec.wins}-${rec.losses}` : "page fetched (no record parsed)"} [${html.length} chars]`);
    } catch (e) {
      b.scrape = { ok: false, error: String(e.message || e) };
      console.log(`   ❌ ${b.name}: ${e.message}`);
    }
  }
  db._meta.generatedBy = "brightdata-web-unlocker";
  writeFileSync(OUT_PATH, JSON.stringify(db, null, 2));
  console.log(`\n✅ Enriched ${ok}/${db.bots.length} bots → data/bots.enriched.json\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
