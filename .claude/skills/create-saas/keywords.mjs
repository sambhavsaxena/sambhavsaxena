#!/usr/bin/env node
// Free keyword + FAQ discovery from public search-autocomplete endpoints.
// No account, no API key, no quota. Use when the Ahrefs MCP is unavailable
// (it needs a Lite plan or higher) or to cross-check what Ahrefs returns.
//
//   node .claude/skills/create-saas/keywords.mjs "shrink pdf" [--json] [--slow]
//
// What it does NOT give you: search volume and keyword difficulty. Autocomplete
// is ranked by real query popularity, so ordering is a usable proxy for demand,
// but there are no numbers here. Do not invent any.

const argv = process.argv.slice(2);
const SEED = argv.filter((a) => !a.startsWith("--"))[0];
const JSON_OUT = argv.includes("--json");
const SLOW = argv.includes("--slow"); // 300ms between calls if you get rate-limited

if (!SEED) {
  console.error('usage: keywords.mjs "<seed keyword>" [--json] [--slow]');
  process.exit(2);
}

// Buyer-intent modifiers: the phrasings that mean "I want a tool right now",
// which is the traffic a microsaas can actually convert.
const SUFFIXES = ["", "free", "online", "online free", "tool", "app", "without", "best"];
const QUESTIONS = ["how to", "how do i", "what is", "why", "can i", "is it safe to", "best way to"];
const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function suggest(q) {
  const urls = [
    `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(q)}`,
    `https://duckduckgo.com/ac/?q=${encodeURIComponent(q)}&type=list`,
  ];
  const out = [];
  for (const u of urls) {
    try {
      const r = await fetch(u, { signal: AbortSignal.timeout(8000) });
      if (!r.ok) continue;
      const data = JSON.parse(await r.text());
      if (Array.isArray(data?.[1])) out.push(...data[1]);
    } catch {
      /* one endpoint failing is fine — the other usually answers */
    }
  }
  return out;
}

// Autocomplete returns results in popularity order. Score by how early a phrase
// shows up and how many expansions surface it: both are demand signals.
const scores = new Map();
function record(list, weight = 1) {
  list.forEach((phrase, i) => {
    const k = phrase.toLowerCase().trim();
    if (!k || k === SEED.toLowerCase()) return;
    scores.set(k, (scores.get(k) ?? 0) + weight * (1 / (i + 1)));
  });
}

const queries = [
  ...SUFFIXES.map((s) => (s ? `${SEED} ${s}` : SEED)),
  ...ALPHABET.map((c) => `${SEED} ${c}`),
];

for (const q of queries) {
  record(await suggest(q));
  if (SLOW) await sleep(300);
}

const faqs = new Map();
for (const p of QUESTIONS) {
  const list = await suggest(`${p} ${SEED}`);
  list.forEach((phrase, i) => {
    const k = phrase.toLowerCase().trim();
    if (!/^(how|what|why|can|is|does|do|are|should|which|where|when)\b/.test(k)) return;
    faqs.set(k, (faqs.get(k) ?? 0) + 1 / (i + 1));
  });
  if (SLOW) await sleep(300);
}

const rank = (m, n) =>
  [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);

const all = rank(scores, 60);
const commercial = all.filter((k) => /\b(free|online|tool|app|generator|converter|software)\b/.test(k));
const longTail = all.filter((k) => k.split(" ").length >= 4);
const questions = rank(faqs, 12);

if (JSON_OUT) {
  console.log(JSON.stringify({ seed: SEED, all, commercial, longTail, questions }, null, 2));
} else {
  const section = (t, xs) =>
    console.log(`\n## ${t} (${xs.length})\n` + xs.map((x) => `  ${x}`).join("\n"));
  console.log(`# autocomplete expansion for "${SEED}"`);
  console.log(`  source: Google + DuckDuckGo suggest — popularity-ordered, NO volume/KD`);
  section("Tool-intent phrasings — best microsaas targets", commercial);
  section("Long-tail (4+ words) — easiest to rank for a new site", longTail);
  section("Questions — use verbatim as FAQ entries + FAQPage JSON-LD", questions);
  section("Everything, ranked", all);
}
