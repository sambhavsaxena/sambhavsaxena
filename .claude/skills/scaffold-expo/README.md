# scaffold-expo

A Claude Code skill that turns an app idea into a production-quality Expo app (React Native, TypeScript, Expo Router, EAS).

It does not start coding straight away. First it analyzes the request and asks you about the decisions that are hard to change later: database and backend, authentication, features, payments, maps, notifications, iOS and Android extras (widgets, Live Activities, App Clips), UX, analytics and release. It then writes a `SPEC.md`, waits for your approval, and builds the app one feature at a time. Each feature is typechecked, linted and checked visually before it is committed.

The architecture comes from a working Expo SDK 57 app. It uses NativeTabs, per-tab native stacks, TanStack Query with a persisted offline cache, a typed error model with retry rules, four-state data sections (loading, error, empty, content), fallback data sources that the UI labels, and EAS profiles with update channels.

## Usage

```text
/scaffold-expo a habit tracker with streaks, reminders and a home-screen widget
```

The skill also triggers on prompts such as "build me a mobile app for …" or "create an iOS/Android app that …".

## Contents

```text
scaffold-expo/
  SKILL.md                    # phases, gates and rules
  references/
    discovery.md              # interview question bank, follow-ups and defaults
    architecture.md           # folder layout and code patterns
    features.md               # library choice and pitfalls for each feature
    ship.md                   # EAS profiles, OTA updates, store compliance, CI
  templates/
    SPEC.md  eas.json
    .claude/settings.json  .claude/launch.json
    src/app/_layout.tsx
    src/lib/api/{client,errors}.ts
    src/lib/query/{client,keys}.ts
    src/components/ui/{screen,card,query-section,state-views,segmented-control}.tsx
    src/constants/theme.ts
```

## Install the skill

Global install, available in every project:

```bash
git clone https://github.com/sambhavsaxena/sambhavsaxena.git /tmp/sambhavsaxena
```

```bash
cp -R /tmp/sambhavsaxena/.claude/skills/scaffold-expo ~/.claude/skills/
```

For a single project, copy the folder into that project's `.claude/skills/` instead.

## Prerequisites

| Tool | Install | Notes |
|---|---|---|
| Node.js LTS + npm | https://nodejs.org | `bun` also works |
| Claude Code | `curl -fsSL https://claude.ai/install.sh \| bash` | https://code.claude.com/docs |
| Expo account | https://expo.dev/signup | Needed for EAS and the Expo MCP server |
| EAS CLI | runs through `npx eas-cli@latest` | No global install needed |
| Apple Developer Program | https://developer.apple.com/programs/ | $99/yr. Needed for iOS device builds and the App Store |
| Google Play Console | https://play.google.com/console | $25 once. Needed for Play Store releases |
| Xcode / Android Studio | Optional | Only for local `npx expo run:*` builds. EAS builds in the cloud |

## Plugins and skills used

| Plugin / skill | Provides | Install |
|---|---|---|
| **expo** (official) | `expo:*` skills: overview, project structure, router, native UI, `@expo/ui`, data fetching, design system, animation, dev client, modules, app clip, DOM, examples, upgrade, plus `eas-*` skills for app stores, update, workflows, hosting, observe and simulator. Also registers the Expo MCP server | `claude plugin install expo@claude-plugins-official` ([docs](https://docs.expo.dev/skills.md)) |
| **building-react-native-apps** (Callstack) | `react-native-best-practices` (performance), `react-navigation`, `upgrading-react-native`, `create-react-native-library` | `claude plugin marketplace add callstackincubator/agent-skills`, then `claude plugin install building-react-native-apps@callstack-agent-skills` |
| **vercel-react-native-skills** | React Native and Expo performance, lists, animation and native module practices | `npx skills add vercel-labs/agent-skills` (pick `vercel-react-native-skills`) |
| **expo-native-ui** | Native-feeling screens: Apple HIG, semantic colors, SF Symbols | `npx skills add expo/skills` |
| **ui-design**, **code-style** | General UI/UX judgment and code-shape rules | `npx skills add frappe/skills` |
| **web-design-guidelines** | Accessibility and interface audit (web output) | `npx skills add vercel-labs/agent-skills` |
| **lean-build**, **verify-and-stop** (optional) | Scope control and completion checks | `claude plugin marketplace add JuliusBrussee/caveman`, then `claude plugin install caveman@caveman` |
| **find-skills** (optional) | Finds more skills when a feature needs one | `npx skills add vercel-labs/skills` |
| **claude-api** (built in) | Claude API details for AI features | Ships with Claude Code |

## MCP servers

Add a server with `claude mcp add --transport http <name> <url> -s user`. OAuth-gated servers must then be authorized by you, using `/mcp` inside Claude Code or `claude mcp login <name>`.

| Server | URL / command | Used for | Auth |
|---|---|---|---|
| **Expo** | `https://mcp.expo.dev/mcp` (registered by the expo plugin) | Expo docs search, `expo install` guidance, EAS builds and workflows, TestFlight crashes and feedback. With `expo-mcp` installed and `EXPO_UNSTABLE_MCP_SERVER=1 npx expo start`, it can also take simulator screenshots, tap the UI and open DevTools | OAuth (Expo account). [Docs](https://docs.expo.dev/mcp.md) |
| **Supabase** | `https://mcp.supabase.com/mcp` | Create projects, tables, RLS policies, edge functions; generate TypeScript types; read logs | OAuth. [Docs](https://supabase.com/docs/guides/getting-started/mcp) |
| **Firebase** (if chosen) | `claude mcp add firebase -- npx -y firebase-tools@latest mcp` | Firestore, Auth, rules, FCM | Firebase CLI login. [Docs](https://firebase.google.com/docs/ai-assistance/mcp-server) |
| **Stripe** (if chosen) | `https://mcp.stripe.com` | Products, prices, payment intents, docs | OAuth or restricted key. [Docs](https://docs.stripe.com/mcp) |
| **Sentry** (if chosen) | `https://mcp.sentry.dev/mcp` | Issues, releases, source maps | OAuth. [Docs](https://docs.sentry.io/product/sentry-mcp/) |
| **Figma** (optional) | `https://mcp.figma.com/mcp` | Read designs and tokens when you provide Figma files | OAuth. [Docs](https://help.figma.com/hc/en-us/articles/32132100833559) |

Example:

```bash
claude mcp add --transport http supabase https://mcp.supabase.com/mcp -s user
```

Vendor MCP URLs and auth flows change. If a command fails, check the linked docs.

## Claude desktop app tools

These are used when available. The skill works without them.

- **iOS Simulator tool**: builds, launches, screenshots and taps the app in a simulator for visual checks.
- **Browser pane** (`preview_start` with `.claude/launch.json`): previews the web build for layout and responsive checks.
- **Artifacts**: shares specs or design reviews as private pages.

## Notes

- The skill always reads the installed Expo SDK version and fetches the matching docs (`https://docs.expo.dev/llms.txt`) instead of relying on model memory, because Expo APIs change every SDK.
- It never asks for API keys or passwords. You add them to `.env.local`, EAS environment variables or the backend yourself.
- It never submits to the app stores without your explicit approval.
