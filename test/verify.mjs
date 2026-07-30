// BattleScout AI — verification suite.  Run:  npm test
//
// Checks three things a reviewer would reasonably want proven:
//   1. the dataset is well-formed and every record carries a confidence label
//   2. the matchup model obeys its own invariants (symmetry, bounds, self-match = 50%)
//   3. the fight simulation is CALIBRATED to the model — i.e. simulating thousands of
//      fights reproduces the model's predicted win probability, so the animation on the
//      page is not decorative randomness with a different opinion.
//
// No dependencies, no network.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const db = JSON.parse(readFileSync(join(ROOT, "data", "bots.json"), "utf8"));
const bots = db.bots;

/* ---- model (must mirror web/index.html) ---- */
const ARCH = ["vertical_spinner","horizontal_spinner","drum_spinner","flipper","hammer_saw","control"];
const RAW = {
  "vertical_spinner|horizontal_spinner":0.58,"vertical_spinner|drum_spinner":0.53,
  "vertical_spinner|flipper":0.62,"vertical_spinner|hammer_saw":0.60,"vertical_spinner|control":0.60,
  "horizontal_spinner|drum_spinner":0.50,"horizontal_spinner|flipper":0.55,"horizontal_spinner|hammer_saw":0.52,
  "horizontal_spinner|control":0.45,"drum_spinner|flipper":0.55,"drum_spinner|hammer_saw":0.53,
  "drum_spinner|control":0.53,"flipper|hammer_saw":0.50,"flipper|control":0.52,"hammer_saw|control":0.50
};
const archProb = (a,b) => a===b?0.5:(RAW[a+"|"+b]??(RAW[b+"|"+a]!==undefined?1-RAW[b+"|"+a]:0.5));
const sigmoid = x => 1/(1+Math.exp(-x));
const winRate = b => (b.wins+b.losses)>0 ? b.wins/(b.wins+b.losses) : 0.5;
const predict = (A,B) => sigmoid(
  4.0*(winRate(A)-winRate(B)) + 1.2*(A.koRate-B.koRate) + 6.0*(archProb(A.archetype,B.archetype)-0.5)*0.5
);
const byId = id => bots.find(b => b.id === id);

/* ---- simulation (must mirror web/index.html) ---- */
function fightOnce(A, B, q) {
  const powA = 0.55+A.koRate, powB = 0.55+B.koRate;
  let hpA = 100, hpB = 100;
  for (let r=1; r<=3 && hpA>0 && hpB>0; r++)
    for (let x=0; x<3 && hpA>0 && hpB>0; x++) {
      const aLands = Math.random() < q;
      const dmg = (7 + Math.random()*15) * (aLands ? powA : powB);
      if (aLands) hpB = Math.max(0, hpB-dmg); else hpA = Math.max(0, hpA-dmg);
    }
  const koed = hpA<=0 || hpB<=0;
  return { winA: koed ? hpB<=0 : hpA>=hpB, koed };
}
// bisect for the exchange probability that reproduces the model's win probability
function calibratedEdge(A, B) {
  const target = predict(A,B), T = 1500;
  const rate = q => { let w=0; for (let i=0;i<T;i++) if (fightOnce(A,B,q).winA) w++; return w/T; };
  let lo = 0.02, hi = 0.98;
  for (let i=0;i<16;i++) { const m=(lo+hi)/2; if (rate(m) < target) lo = m; else hi = m; }
  return (lo+hi)/2;
}

/* ---- tiny test harness ---- */
let pass = 0, fail = 0;
const ok = (name, cond, detail="") => {
  if (cond) { pass++; console.log(`  ✅ ${name}${detail?` — ${detail}`:""}`); }
  else { fail++; console.log(`  ❌ ${name}${detail?` — ${detail}`:""}`); }
};

console.log("\n1. Dataset integrity");
ok("every bot has a unique id", new Set(bots.map(b=>b.id)).size === bots.length, `${bots.length} bots`);
ok("every archetype is a known archetype", bots.every(b=>ARCH.includes(b.archetype)));
ok("every record carries a confidence label",
   bots.every(b=>["official","cited","est","new"].includes(b.conf)),
   `official=${bots.filter(b=>b.conf==="official").length}, cited=${bots.filter(b=>b.conf==="cited").length}, est=${bots.filter(b=>b.conf==="est").length}, new=${bots.filter(b=>b.conf==="new").length}`);
ok("wins/losses are non-negative integers",
   bots.every(b=>Number.isInteger(b.wins)&&Number.isInteger(b.losses)&&b.wins>=0&&b.losses>=0));
ok("koRate is a probability (0–1)", bots.every(b=>b.koRate>=0&&b.koRate<=1));
ok("only the rookie has no fights",
   bots.filter(b=>b.wins+b.losses===0).every(b=>b.conf==="new"));
ok("required text fields present", bots.every(b=>b.name&&b.builder&&b.country&&b.weapon&&b.note));

console.log("\n2. Model invariants");
let symMax = 0, boundsOk = true;
for (const A of bots) for (const B of bots) {
  const p = predict(A,B);
  if (!(p>0 && p<1)) boundsOk = false;
  if (A.id !== B.id) symMax = Math.max(symMax, Math.abs(p + predict(B,A) - 1));
}
ok("probabilities strictly inside (0,1)", boundsOk);
ok("P(A beats B) + P(B beats A) = 1", symMax < 1e-9, `max deviation ${symMax.toExponential(1)}`);
ok("a bot against itself is exactly 50%", bots.every(b=>Math.abs(predict(b,b)-0.5)<1e-12));
const archMeta = ARCH.map(a=>{
  let s=0,n=0; for(const A of bots) for(const B of bots) if(A.id!==B.id && A.archetype===a){s+=predict(A,B);n++;}
  return {a, r:n?s/n:0.5};
}).sort((x,y)=>y.r-x.r);
ok("vertical spinners top the archetype meta", archMeta[0].a === "vertical_spinner",
   `${archMeta[0].a} at ${(archMeta[0].r*100).toFixed(1)}%`);

console.log("\n3. Simulation calibration (is the animation consistent with the model?)");
const N = 20000, TOL = 4.0;   // percentage points
const pairs = [["endgame","tombstone"],["orbitron","tombstone"],["biteforce","mammoth"],
               ["hydra","witchdoctor"],["uppercut","gruff"],["riptide","icewave"]];
let worst = 0;
for (const [x,y] of pairs) {
  const A = byId(x), B = byId(y);
  const q = calibratedEdge(A,B);
  let w = 0, ko = 0;
  for (let i=0;i<N;i++){ const t = fightOnce(A,B,q); if(t.winA)w++; if(t.koed)ko++; }
  const sim = w/N*100, model = predict(A,B)*100, gap = Math.abs(sim-model);
  worst = Math.max(worst, gap);
  ok(`${A.name} vs ${B.name}`, gap <= TOL,
     `model ${model.toFixed(1)}% · ${N.toLocaleString()} sims ${sim.toFixed(1)}% · gap ${gap.toFixed(1)}pp · ${(ko/N*100).toFixed(0)}% ended in KO`);
}
ok(`all pairs within ${TOL}pp of the model`, worst <= TOL, `worst gap ${worst.toFixed(1)}pp`);

console.log(`\n${fail===0?"✅ ALL PASSED":"❌ FAILURES"} — ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
