#!/usr/bin/env bash
# Scaffold a microsaas Astro project into the current directory.
#
#   bash .claude/skills/create-saas/scaffold.sh <project-name> <site-url>
#
# e.g. bash scaffold.sh shrinkpdf https://shrinkpdf.com
#
# Idempotent-ish: skips steps whose output already exists. Every command here
# was run and verified on macOS with node v24 / npm 11 / astro 7.
set -euo pipefail

NAME="${1:?usage: scaffold.sh <project-name> <site-url>}"
SITE="${2:?usage: scaffold.sh <project-name> <site-url>}"

step() { printf '\n\033[1m==> %s\033[0m\n' "$1"; }

# ---------------------------------------------------------------- 1. astro
if [ ! -f package.json ]; then
  step "Scaffolding Astro (minimal template)"
  npm create astro@latest . -- \
    --template minimal --install --no-git --skip-houston --yes
else
  step "package.json exists — skipping astro create"
fi

# ------------------------------------------------- 2. integrations + deps
step "Adding tailwind + sitemap integrations"
npx astro add tailwind sitemap --yes

# ------------------------------------------------------------ 3. site url
# @astrojs/sitemap emits nothing unless `site` is set.
step "Setting site: $SITE in astro.config.mjs"
node - "$SITE" <<'NODE'
import { readFileSync, writeFileSync } from 'node:fs';
const site = process.argv[2];
const f = 'astro.config.mjs';
let s = readFileSync(f, 'utf8');
if (!/\bsite:\s*['"]/.test(s)) {
  s = s.replace(/defineConfig\(\{/, `defineConfig({\n  site: '${site}',`);
  writeFileSync(f, s);
  console.log('  site set');
} else {
  s = s.replace(/\bsite:\s*['"][^'"]*['"]/, `site: '${site}'`);
  writeFileSync(f, s);
  console.log('  site updated');
}
NODE

# ------------------------------------------------- 4. design system + skills
if [ ! -f DESIGN.md ]; then
  step "Installing Vercel DESIGN.md"
  npx -y getdesign@latest add vercel
fi

step "Installing agent skills (web-design-guidelines, tailwind-4-docs)"
npx -y skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines
npx -y skills add Lombiq/Tailwind-Agent-Skills

# ------------------------------------------------------------ 5. MCP servers
# User scope so they survive into every project. ahrefs needs an interactive
# OAuth pass afterwards — see SKILL.md.
step "Registering MCP servers (user scope)"
claude mcp add --transport http astro-docs https://mcp.docs.astro.build/mcp -s user 2>/dev/null || true
claude mcp add --transport http ahrefs https://api.ahrefs.com/mcp/mcp -s user 2>/dev/null || true
claude mcp add --transport http instantdomainsearch \
  https://api.instantdomainsearch.com/mcp/streamable-http -s user 2>/dev/null || true
claude mcp list || true

# --------------------------------------------------------------- 6. layout
step "Creating directories"
mkdir -p src/layouts src/components src/pages public

# --------------------------------------------------------------- 7. robots
if [ ! -f public/robots.txt ]; then
  step "Writing public/robots.txt"
  cat > public/robots.txt <<EOF
User-agent: *
Allow: /

Sitemap: ${SITE%/}/sitemap-index.xml
EOF
fi

step "Scaffold complete"
cat <<EOF

  Project:  $NAME
  Site:     $SITE

  Next:
    1. Authenticate Ahrefs — run /mcp in an interactive Claude session,
       pick "ahrefs", complete the OAuth flow.
    2. Write the pages (see references/build-spec.md).
    3. Audit:  node .claude/skills/create-saas/verify.mjs --keyword "<main keyword>"
EOF
