#!/usr/bin/env node
// SEO + structure audit driver for a microsaas Astro site.
//
//   node .claude/skills/create-saas/verify.mjs [options]
//
//   --no-build          reuse the existing dist/ instead of rebuilding
//   --port <n>          preferred preview port (default 4321; auto-bumps if busy)
//   --keyword "<kw>"    main keyword; asserts it appears in title/h1/body
//   --dynamic "a,b"     extra interpolated strings to check for glued spacing
//   --serve             leave the preview server running and print the URL
//                       (for browser screenshots), then wait for Ctrl-C
//   --json              emit machine-readable results
//
// Zero dependencies. Exits 1 if any FAIL check trips.

import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import { join } from "node:path";

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n, d) => {
  const i = argv.indexOf(n);
  return i === -1 ? d : argv[i + 1];
};

const ROOT = process.cwd();
// The Cloudflare adapter splits the build into dist/client + dist/server;
// a plain static build puts everything straight in dist/.
const DIST = existsSync(join(ROOT, "dist", "client"))
  ? join(ROOT, "dist", "client")
  : join(ROOT, "dist");
const WANT_PORT = Number(opt("--port", "4321"));
const KEYWORD = opt("--keyword", null);
// Exact strings that get interpolated into copy. Collected site-wide from
// mailto:/href/og:site_name, plus anything the caller names explicitly.
const DYNAMIC = new Set(
  (opt("--dynamic", "") || "").split(",").map((x) => x.trim()).filter(Boolean),
);
let PORT = WANT_PORT;
let BASE = `http://localhost:${PORT}`;

const results = [];
const rec = (level, area, msg) => results.push({ level, area, msg });
const pass = (a, m) => rec("PASS", a, m);
const warn = (a, m) => rec("WARN", a, m);
const fail = (a, m) => rec("FAIL", a, m);

const LEGAL = ["about", "privacy", "terms", "contact"];

// ---------------------------------------------------------------- helpers

function sh(cmd, args, opts = {}) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, { cwd: ROOT, stdio: "inherit", ...opts });
    p.on("exit", (c) => (c === 0 ? res() : rej(new Error(`${cmd} exited ${c}`))));
    p.on("error", rej);
  });
}

// `astro preview`'s daemon registry is per project, so a stray preview from a
// *different* Astro project keeps its port and our `stop` cannot reach it.
// Bind-test each candidate and take the first genuinely free one.
function bindFree(port, host) {
  return new Promise((res) => {
    const srv = createServer();
    srv.once("error", () => res(false));
    srv.once("listening", () => srv.close(() => res(true)));
    srv.listen(port, host);
  });
}

// Must check BOTH stacks: a stray preview listening only on [::1] leaves
// 127.0.0.1 bindable, and `localhost` then resolves to the wrong server.
async function portFree(port) {
  for (const host of ["127.0.0.1", "::1"]) {
    if (!(await bindFree(port, host))) return false;
  }
  try {
    await fetch(`http://localhost:${port}/`, { signal: AbortSignal.timeout(1500) });
    return false; // something answered HTTP
  } catch {
    return true;
  }
}

async function pickPort(start) {
  for (let p = start; p < start + 25; p++) if (await portFree(p)) return p;
  throw new Error(`no free port in ${start}-${start + 24}`);
}

// Astro 7's `preview` registers a daemon; SIGTERM to the `npx` wrapper leaves
// the real server orphaned on the port. Always start with --background and
// shut down with `astro preview stop`.
async function startPreview(port) {
  await sh("npx", ["astro", "preview", "stop"], { stdio: "ignore" }).catch(() => {});
  await sh("npx", ["astro", "preview", "--background", "--port", String(port)], {
    stdio: "ignore",
  });
}

// Paranoia after the port dance: prove the server is serving OUR dist.
async function assertServingOwnBuild() {
  const localTitle = readFileSync(join(DIST, "index.html"), "utf8").match(rx.title)?.[1];
  const servedTitle = (await (await fetch(BASE + "/")).text()).match(rx.title)?.[1];
  if (localTitle !== servedTitle)
    throw new Error(
      `${BASE} is serving a different project ` +
        `(served <title> "${servedTitle}", local build "${localTitle}"). ` +
        `Another astro preview owns the port — free it or pass --port.`,
    );
}

async function stopPreview() {
  await sh("npx", ["astro", "preview", "stop"], { stdio: "ignore" }).catch(() => {});
}

async function waitForServer(url, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(url, { redirect: "manual" });
      if (r.status < 500) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

const rx = {
  title: /<title[^>]*>([\s\S]*?)<\/title>/i,
  h1: /<h1[\s>]/gi,
  img: /<img\b[^>]*>/gi,
  canonical: /<link[^>]+rel=["']canonical["'][^>]*>/i,
  viewport: /<meta[^>]+name=["']viewport["'][^>]*>/i,
  robotsMeta: /<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i,
  jsonld: /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  hrefs: /href=["'](\/[^"'#?]*)["']/gi,
};

const meta = (html, name) =>
  html.match(
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]*content=["']([^"']*)["']`, "i"),
  )?.[1] ??
  html.match(
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*name=["']${name}["']`, "i"),
  )?.[1] ??
  null;

const og = (html, prop) =>
  html.match(
    new RegExp(`<meta[^>]+property=["']${prop}["'][^>]*content=["']([^"']*)["']`, "i"),
  )?.[1] ??
  html.match(
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*property=["']${prop}["']`, "i"),
  )?.[1] ??
  null;

// Inline elements do not create a visual word break; block elements do.
// Strip them differently or the glued-text check either misses real bugs
// (inline replaced by a space) or invents them (blocks joined with nothing).
const INLINE =
  "a|span|strong|em|b|i|u|code|small|sup|sub|mark|abbr|time|label|kbd|q|cite|s|del|ins";

const visibleText = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(new RegExp(`</?(?:${INLINE})\\b[^>]*>`, "gi"), "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/[ \t]+/g, " ");

const stripTags = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

// Astro (like JSX) deletes the newline+indent between text and an adjacent
// {expression} or element, so wrapping a long line silently removes the space:
//
//   <p>reach out to        renders as   "reach out tooutreach@example.com"
//     {email}</p>
//
// Keep the expression on the same line as the text, or put the space inside
// the expression. These checks catch it in the rendered output, whatever the
// cause — hand-written, formatter-wrapped, or a glued flex/inline element.
// Harvest the exact interpolated strings from wherever the markup states them
// unambiguously: mailto/href attributes and og:site_name. Run over every page
// before auditing any, so an email that is a link on /contact is still ground
// truth for the plain-text mention on /about.
function collectDynamic(html) {
  for (const m of html.matchAll(/href=["']mailto:([^"'?]+)["']/gi)) DYNAMIC.add(m[1]);
  for (const m of html.matchAll(/href=["'](https?:\/\/[^"'\s]+)["']/gi)) DYNAMIC.add(m[1]);
  const site = og(html, "og:site_name");
  if (site && site.length > 2) DYNAMIC.add(site);
}

function checkGluedText(where, html) {
  const text = visibleText(html);

  for (const value of DYNAMIC) {
    let i = -1;
    while ((i = text.indexOf(value, i + 1)) !== -1) {
      const before = text[i - 1];
      const after = text[i + value.length];
      if (before && /[A-Za-z0-9]/.test(before))
        fail(where, `no space before "${value}" — rendered "…${text.slice(Math.max(0, i - 22), i + 12)}…"`);
      if (after && /[A-Za-z0-9]/.test(after))
        fail(where, `no space after "${value}" — rendered "…${text.slice(i, i + value.length + 18)}…"`);
    }
  }

  // Generic: a word running straight into a URL scheme.
  for (const m of text.matchAll(/[A-Za-z]{2,}(?=https?:\/\/)/g))
    fail(where, `text runs into a URL: "…${text.slice(Math.max(0, m.index - 18), m.index + 34)}…"`);

  // Generic: an email whose local part swallowed the preceding word. English
  // stop-words are what actually precede an address in copy ("reach out to",
  // "email us at"), so look for one fused onto the front of the local part.
  const GLUE = "to|at|via|on|by|is|via|and|or|our|the|use|mail|email|contact";
  for (const m of text.matchAll(
    new RegExp(`\\b(${GLUE})([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,})`, "gi"),
  ))
    fail(where, `no space between "${m[1]}" and "${m[2]}" — rendered "${m[0]}"`);

  // Two words fused at a case boundary — the usual look of a swallowed space.
  // Brand names are legitimately CamelCase, so this only warns.
  const seen = new Set();
  for (const m of text.matchAll(/\b[a-z]{2,}[A-Z][a-z]{2,}/g)) {
    if (seen.has(m[0]) || seen.size >= 5) continue;
    seen.add(m[0]);
    warn(where, `possible swallowed space: "${m[0]}" (ok if it is a brand name)`);
  }
}

// ------------------------------------------------------------- discovery

function sitemapPaths() {
  const index = join(DIST, "sitemap-index.xml");
  if (!existsSync(index)) return null;
  const files = [
    ...readFileSync(index, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g),
  ].map((m) => m[1]);
  const urls = [];
  for (const f of files) {
    const local = join(DIST, f.split("/").pop());
    if (!existsSync(local)) continue;
    for (const m of readFileSync(local, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)) {
      urls.push(new URL(m[1]).pathname);
    }
  }
  return [...new Set(urls)];
}

// ---------------------------------------------------------------- checks

function auditPage(path, html, { isHome }) {
  const where = `page ${path}`;

  const title = html.match(rx.title)?.[1]?.trim();
  if (!title) fail(where, "no <title>");
  else if (title.length < 15 || title.length > 65)
    warn(where, `title is ${title.length} chars (aim 15-65): "${title}"`);
  else pass(where, `title ok (${title.length} chars)`);

  const desc = meta(html, "description");
  if (!desc) fail(where, "no meta description");
  else if (desc.length < 70 || desc.length > 160)
    warn(where, `meta description is ${desc.length} chars (aim 70-160)`);
  else pass(where, `meta description ok (${desc.length} chars)`);

  if (!rx.canonical.test(html)) fail(where, "no canonical link");
  else pass(where, "canonical present");

  if (!rx.viewport.test(html)) fail(where, "no viewport meta (breaks mobile)");
  else pass(where, "viewport meta present");

  const ogMissing = [
    "og:title",
    "og:description",
    "og:url",
    "og:type",
    "og:site_name",
    "og:image",
  ].filter((p) => !og(html, p));
  if (ogMissing.length) fail(where, `missing OG tags: ${ogMissing.join(", ")}`);
  else pass(where, "all 6 OG tags present");

  const h1s = (html.match(rx.h1) || []).length;
  if (h1s !== 1) fail(where, `${h1s} <h1> tags (need exactly 1)`);
  else pass(where, "exactly one <h1>");

  const imgs = html.match(rx.img) || [];
  const noAlt = imgs.filter((t) => !/\balt=/.test(t));
  if (noAlt.length) fail(where, `${noAlt.length}/${imgs.length} <img> without alt`);
  else if (imgs.length) pass(where, `${imgs.length} <img> all have alt`);

  if (rx.robotsMeta.test(html))
    warn(where, "noindex robots meta is active on this host");

  checkGluedText(where, html);

  for (const l of LEGAL) {
    if (!new RegExp(`href=["']/${l}/?["']`).test(html))
      warn(where, `footer does not link /${l}`);
  }

  // JSON-LD must parse
  let faqCount = 0;
  for (const m of html.matchAll(rx.jsonld)) {
    try {
      const data = JSON.parse(m[1]);
      const nodes = Array.isArray(data) ? data : [data];
      for (const n of nodes) {
        if (n["@type"] === "FAQPage") faqCount += (n.mainEntity || []).length;
      }
    } catch (e) {
      fail(where, `JSON-LD does not parse: ${e.message}`);
    }
  }

  if (isHome) {
    if (faqCount === 0) fail(where, "no FAQPage JSON-LD on the homepage");
    else if (faqCount < 3) warn(where, `only ${faqCount} FAQ entries (aim 5+)`);
    else pass(where, `FAQPage JSON-LD with ${faqCount} questions`);

    const words = stripTags(html).split(" ").filter(Boolean).length;
    if (words < 600) warn(where, `homepage body is ${words} words (aim ~600)`);
    else pass(where, `homepage body is ${words} words`);

    if (KEYWORD) {
      const kw = KEYWORD.toLowerCase();
      const body = stripTags(html).toLowerCase();
      if (!title?.toLowerCase().includes(kw)) fail(where, `keyword "${KEYWORD}" not in <title>`);
      else pass(where, `keyword in <title>`);
      const density = (body.split(kw).length - 1) / Math.max(1, body.split(" ").length);
      if (density === 0) fail(where, `keyword "${KEYWORD}" absent from body`);
      else if (density > 0.03) warn(where, `keyword density ${(density * 100).toFixed(1)}% — stuffing`);
      else pass(where, `keyword density ${(density * 100).toFixed(2)}%`);
    }
  }

  return [...html.matchAll(rx.hrefs)].map((m) => m[1]);
}

function auditSiteFiles(paths) {
  const robots = join(DIST, "robots.txt");
  if (!existsSync(robots)) fail("site", "no dist/robots.txt");
  else {
    const t = readFileSync(robots, "utf8");
    if (!/sitemap:/i.test(t)) fail("site", "robots.txt does not link a Sitemap");
    else pass("site", "robots.txt links the sitemap");
  }

  if (!paths) fail("site", "no dist/sitemap-index.xml (set `site` in astro.config.mjs + add @astrojs/sitemap)");
  else pass("site", `sitemap lists ${paths.length} URLs`);

  if (!existsSync(join(DIST, "404.html"))) fail("site", "no 404 page");
  else pass("site", "404 page built");

  for (const l of LEGAL) {
    if (!existsSync(join(DIST, l, "index.html")) && !existsSync(join(DIST, `${l}.html`)))
      fail("site", `missing required page /${l}`);
  }
  if (LEGAL.every((l) => existsSync(join(DIST, l, "index.html")) || existsSync(join(DIST, `${l}.html`))))
    pass("site", "about / privacy / terms / contact all built");

  if (paths && paths.length < 4)
    warn("site", `only ${paths.length} pages — a multi-page app ranks better than one page`);
}

// ------------------------------------------------------------------ main

let server;
try {
  if (!flag("--no-build")) await sh("npm", ["run", "build"]);
  if (!existsSync(DIST)) throw new Error(`no dist/ at ${DIST} — run a build first`);

  const paths = sitemapPaths();
  auditSiteFiles(paths);

  PORT = await pickPort(WANT_PORT);
  BASE = `http://localhost:${PORT}`;
  if (PORT !== WANT_PORT)
    warn("driver", `port ${WANT_PORT} was busy — using ${PORT}`);
  await startPreview(PORT);
  server = true;
  if (!(await waitForServer(BASE)))
    throw new Error(`astro preview never came up on ${BASE}`);
  await assertServingOwnBuild();

  const toCheck = paths?.length ? paths : ["/"];
  const seen = new Set(toCheck);
  const linked = new Set();

  // Pass 1: fetch everything and harvest the interpolated strings site-wide.
  const pages = new Map();
  for (const p of toCheck) {
    const r = await fetch(BASE + p);
    if (!r.ok) {
      fail(`page ${p}`, `HTTP ${r.status}`);
      continue;
    }
    const html = await r.text();
    pages.set(p, html);
    collectDynamic(html);
  }

  // Pass 2: audit, now that checkGluedText knows every dynamic value.
  for (const [p, html] of pages) {
    for (const h of auditPage(p, html, { isHome: p === "/" })) linked.add(h);
  }

  for (const href of linked) {
    if (href.startsWith("//")) continue;
    const r = await fetch(BASE + href, { redirect: "follow" });
    if (!r.ok) fail("links", `internal link ${href} -> HTTP ${r.status}`);
  }
  if (!results.some((x) => x.area === "links" && x.level === "FAIL"))
    pass("links", `${linked.size} internal links all resolve`);

  const r404 = await fetch(BASE + "/definitely-not-a-real-page-xyz");
  if (r404.status !== 404) warn("site", `unknown path returned ${r404.status}, not 404`);
  else pass("site", "unknown paths return 404");

} catch (e) {
  fail("driver", e.message);
} finally {
  if (server && !flag("--serve")) await stopPreview();
}

if (flag("--serve"))
  console.log(`\n  preview still running at ${BASE}\n  stop it with: npx astro preview stop\n`);

const counts = { PASS: 0, WARN: 0, FAIL: 0 };
for (const r of results) counts[r.level]++;

if (flag("--json")) {
  console.log(JSON.stringify({ counts, results }, null, 2));
} else {
  const order = { FAIL: 0, WARN: 1, PASS: 2 };
  for (const r of results.sort((a, b) => order[a.level] - order[b.level])) {
    const mark = { PASS: "  ok  ", WARN: " warn ", FAIL: " FAIL " }[r.level];
    console.log(`${mark} ${r.area.padEnd(22)} ${r.msg}`);
  }
  console.log(`\n${counts.PASS} passed, ${counts.WARN} warnings, ${counts.FAIL} failed`);
}

process.exit(counts.FAIL > 0 ? 1 : 0);
