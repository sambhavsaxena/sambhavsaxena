# Phase 3 — build spec

The full page spec. Fill the placeholders from phase 1, then implement. Every item here
is checked by `verify.mjs` unless marked *(not machine-checked)*.

## Fill this in first

```
Name:              <WebsiteName>
Domain:            <website-name.com>
Main keyword:      <keyword>
Supporting:        <comma-separated>
Competitor:        <competitor.com>
FAQ questions:     <from Ahrefs related questions / People Also Ask>
Contact email:     outreach@mail.unchainedin.app
Creator:           Sambhav Saxena
```

Contact and creator are the owner's standing values — reuse them unless
the user says otherwise.

## Non-negotiable structure

- **Multi-page app, not an SPA.** One route per intent. Astro static output.
  Each page is its own indexable URL. `verify.mjs` warns below 4 pages.
- **Required pages:** `/`, `/about`, `/privacy`, `/terms`, `/contact`, plus
  `404.astro` and `500.astro`. All four legal pages linked from the homepage
  footer — visibly, not hidden.
- **Every page uses one shared `Layout.astro`** that takes `title` and
  `description` props. That is the only place head tags are written.
- **Minimum body height.** `body` gets `min-h-screen flex flex-col`, `main`
  gets `flex-1`. Without it a short page floats its footer into the middle —
  the specific bug that makes a thin page look broken.
- **Mobile responsive**, checked at 375px in a real browser. *(screenshot,
  not machine-checked)*

## Head tags — every page

`verify.mjs` fails the build if any of these are missing:

```astro
---
interface Props { title: string; description: string; }
const { title, description } = Astro.props;
const canonical = new URL(Astro.url.pathname, Astro.site).href;
const shouldNoindex = Astro.url.hostname.endsWith('.pages.dev');
---
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonical} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:url" content={canonical} />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="<WebsiteName>" />
<meta property="og:image" content="https://<domain>/og.png" />
{shouldNoindex && <meta name="robots" content="noindex, nofollow" />}
```

Budgets the audit enforces: `<title>` 15–65 chars, meta description 70–160
chars, exactly one `<h1>` per page, `alt` on every `<img>`.

## Spacing around dynamic values

Astro, like JSX, **deletes the newline-and-indent between text and an adjacent
`{expression}` or element.** Same line is safe; wrapping is not. Verified:

```astro
<p>reach out to {email}</p>          <!-- "reach out to hello@x.com"  correct -->

<p>reach out to
  {email}</p>                        <!-- "reach out tohello@x.com"   BROKEN -->

<p>
  Welcome to
  <strong>{name}</strong>
  today.
</p>                                 <!-- "Welcome toShrinkPDFtoday." BROKEN -->
```

This is nastier than an ordinary typo because the source *looks* right and the
bug appears only after something wraps the line — a formatter, an editor, or
you shortening a sentence. It shows up as `reach out
tooutreach@mail.unchainedin.app` in the rendered page.

Rules:

- **Keep the text and the `{expression}` on one line.** If the line is too
  long, break it somewhere that is not the seam.
- If it must wrap, carry the space inside the expression: `{` `` ` ${email}` ``
  `}`, or use an explicit `{' '}` on the seam.
- Adjacent inline elements produce no space either — `<span>Contact</span>`
  followed by `<span>{email}</span>` renders glued. Put the space in the text
  or use a `gap` on the flex parent.
- Same trap on the closing side: a `{value}` on its own line before more text
  eats the space after it too.

`verify.mjs` fails the build on this. It harvests every interpolated string
site-wide (`mailto:` targets, absolute `href`s, `og:site_name`) and checks that
each occurrence in visible text has a real boundary on both sides, plus a
generic rule for an English stop-word fused onto the front of an email
(`tooutreach@…`, `atsupport@…`) and a warning for `camelCase` fusions such as
`toShrink`. Inline elements are stripped without inserting a space so the check
sees what a reader sees, while block elements do get one — otherwise every
paragraph boundary would be a false positive.

## Homepage copy

- ~600 words of genuine prose about the tool. Main keyword in the `<title>`,
  the `<h1>`, and the first paragraph; supporting keywords worked in naturally
  under real `<h2>`/`<h3>` headings.
- Keyword density stays under 3% — `verify.mjs` flags stuffing above that.
- Write for the person who searched the keyword. Lead with the thing that
  makes you different from the competitor found in phase 1.

## FAQ + JSON-LD

Homepage FAQ section, 5+ questions, sourced from real queries. Render the
visible list **and** the structured data from one array so they can never
drift:

```astro
---
const faqs = [
  { q: '<question>', a: '<answer>' },
];
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};
---
{faqs.map((f) => <details><summary>{f.q}</summary><p>{f.a}</p></details>)}
<script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />
```

`set:html` is required — Astro escapes a normal `{}` expression and the
resulting JSON-LD will not parse. The audit parses every `ld+json` block and
fails on a syntax error.

## robots.txt + sitemap

`@astrojs/sitemap` emits **nothing** unless `site` is set in
`astro.config.mjs`. `scaffold.sh` sets it. The generated index is
`sitemap-index.xml` (not `sitemap.xml`), so `public/robots.txt` reads:

```
User-agent: *
Allow: /

Sitemap: https://<domain>/sitemap-index.xml
```

## Deduplicating pages.dev vs. the live domain

Cloudflare Pages serves the site on both `*.pages.dev` and the real domain —
duplicate content unless the preview host is deindexed. Two layers:

1. The `shouldNoindex` meta tag in the layout above.
2. `src/middleware.ts`, which adds the header (needs the Cloudflare adapter —
   in a pure static build the middleware runs at build time and the header
   does nothing):

```ts
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  if (context.url.hostname.endsWith(".pages.dev")) {
    response.headers.set("X-Robots-Tag", "noindex");
  }
  return response;
});
```

Verify after deploy with `curl -I <live-url>` — the live URL must **not**
carry `X-Robots-Tag: noindex`.

## Design

Use `DESIGN.md` (Vercel, installed by `scaffold.sh`) as the reference before
writing any UI, plus the `web-design-guidelines` and `tailwind-4-docs` skills.
Consult the `astro-docs` MCP rather than recalling Astro APIs.

Optional: theme toggle.

## Assets, done last

- Logo: https://logofa.st/
- Favicon: https://realfavicongenerator.net/ — download the pack, **delete the
  Astro default `favicon.svg`/`favicon.ico` first**, drop every generated file
  into `public/`, then paste the generator's head tags into `Layout.astro`.

Both are human steps; ask for the files, then wire them in.
