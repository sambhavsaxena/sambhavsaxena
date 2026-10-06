---
name: scaffold-expo
description: Scaffold a production-quality Expo (React Native + TypeScript + Expo Router + EAS) mobile app from a one-line or rough idea. Deeply analyzes the request, then interviews the user in focused rounds about backend/database, authentication, features, payments, maps/location, notifications, iOS/Android-specific features (widgets, Live Activities, App Clips, shortcuts), offline behavior, UX/design, analytics, CI/CD and release, writes an approved SPEC.md, scaffolds the project with a proven architecture, implements features one at a time with typecheck/lint/visual verification, and prepares EAS builds. Use when the user says "scaffold an expo app", "build me a mobile app", "create an iOS/Android app for X", "start a React Native project", "/scaffold-expo", or describes an app idea they want built for phones.
---

# scaffold-expo

Turns an app idea into a running, shippable Expo app. Two rules dominate:

1. **Ask before building.** A mobile app has dozens of decisions that are expensive to reverse (bundle ID, auth provider, database, payment rails, native modules). Interview first, write the spec, get approval, then code.
2. **Never trust training data for Expo APIs.** Expo ships breaking changes every SDK. Read the installed `expo` major version, then fetch `https://docs.expo.dev/versions/v<major>.0.0/` pages or `https://docs.expo.dev/llms.txt` (append `.md` to any docs URL for Markdown) before writing code that touches an Expo/EAS/RN API.

Reference files (read when the phase says so):

| File | Use |
|---|---|
| [references/discovery.md](references/discovery.md) | Full question bank, defaults, follow-up triggers |
| [references/architecture.md](references/architecture.md) | Folder layout and the code patterns every app gets |
| [references/features.md](references/features.md) | Library choice + setup notes per feature (auth, DB, payments, maps, widgets, …) |
| [references/ship.md](references/ship.md) | EAS profiles, OTA updates, store compliance, CI |
| [templates/](templates/) | Drop-in files: `SPEC.md`, `eas.json`, `launch.json`, query client, error type, UI state components |

## Phases

| # | Phase | Gate |
|---|---|---|
| 0 | Preflight + analyze the statement | Understanding summary written |
| 1 | Discovery interview (`AskUserQuestion`, rounds) | All blocking decisions answered or defaulted |
| 2 | Write `SPEC.md`, present it | **User approves** — do not scaffold before this |
| 3 | Scaffold base app + architecture | `tsc`, `lint`, `expo-doctor` clean; app boots |
| 4 | Build features one slice at a time | Each slice verified visually + committed |
| 5 | EAS setup, preview build, release prep | Store submission only with explicit approval |

---

## Phase 0 — preflight and analysis

**Environment** (run, don't assume):

```bash
node -v && npm -v && git --version
npx expo --version 2>/dev/null; npx eas-cli@latest --version
claude plugin list 2>/dev/null | grep -i expo
```

- Expo plugin missing: tell the user to run `claude plugin install expo@claude-plugins-official`. It provides the `expo:*` skills and the Expo MCP server.
- MCP servers that need OAuth (Expo, Supabase, Stripe, …): you cannot authorize them. Tell the user to run `/mcp` (or `claude mcp login <name>`) and continue without them meanwhile.
- See [README.md](README.md) for the full list of skills/MCPs and install commands.

**Analyze the statement.** Before asking anything, extract and write down (in chat, briefly):

- **Core loop**: the one thing a user opens the app to do, in one sentence.
- **Users and roles**: consumer / business / admin / multi-sided marketplace (buyer + seller + courier…).
- **Implied features**: e.g. "food delivery" implies auth, addresses, maps, live order tracking, push, payments for physical goods, courier app or role, admin panel.
- **Implied constraints**: region (India implies UPI/Razorpay; EU implies GDPR consent), regulated domain (health, finance, kids, gambling), offline usage, real-time needs, data sensitivity.
- **Unknowns**: what you cannot infer. These drive Phase 1.
- **Existing assets**: existing backend/API, website, design files (Figma), brand. Check the current directory: an existing project means *extend*, not re-scaffold.

## Phase 1 — discovery interview

Read [references/discovery.md](references/discovery.md). Interview with `AskUserQuestion`:

- **Rounds, not a wall.** Max 4 questions per call, 2–4 options each; 4–7 rounds total. Order: product core, data/auth, features, monetization, platform-specific, UX, ops/release.
- **Skip what the statement answers.** Don't ask "do you need maps?" for a delivery app; ask which provider and whether background tracking is needed.
- **Recommend.** First option is your pick with "(Recommended)" and a one-line reason grounded in *their* app. Use `multiSelect: true` for feature lists.
- **Follow-ups are conditional.** Maps → provider + background location. Payments → digital vs physical goods (decides IAP vs Stripe/Razorpay). Chat → realtime backend. Widgets → which data on the widget.
- **Escape hatch.** Offer "Use your defaults for the rest" when the user seems impatient; then apply the defaults table in discovery.md and list what you assumed.
- **Never ask** for secrets, API keys, passwords or card numbers. Ask *which* provider; the user adds keys to `.env.local` / EAS secrets themselves.

## Phase 2 — spec and approval

Copy [templates/SPEC.md](templates/SPEC.md) to the project root (or to the intended directory if not yet created) and fill it: summary, users/roles, screens (numbered, with route paths), data model, integrations with chosen libraries, platform-specific features, non-functional (offline, a11y, i18n, perf), MVP slice vs later, risks/open questions, assumptions.

**Scope the MVP**: the thinnest end-to-end slice that proves the core loop on a real phone (core screens + one backend path + auth if required). Everything else goes to "Later".

Present a short summary and ask for approval. Do not run `create-expo-app` until approved. Changes requested: update the spec and re-confirm.

## Phase 3 — scaffold

Read [references/architecture.md](references/architecture.md) and load skills `expo:expo-overview`, `expo:expo-project-structure`, `expo:expo-router`.

1. `npx create-expo-app@latest <name>` (default template: TypeScript, Expo Router, `src/app`). Use `bunx`/`bun create expo` if the user prefers bun. Never `--template blank` unless asked.
2. Read the generated `AGENTS.md` and `package.json` (`expo` major) — they override anything here. Fetch the versioned docs index.
3. Configure `app.json`: `name`, `slug`, `scheme`, `ios.bundleIdentifier` and `android.package` (confirm with user: **permanent after publishing**), `userInterfaceStyle: "automatic"`, `experiments.typedRoutes` + `experiments.reactCompiler`, `runtimeVersion: { "policy": "appVersion" }`, plugins for each native feature with permission strings that explain *why*.
4. Lay out folders per architecture.md; replace the template demo with the spec's navigation skeleton (tabs/stack). Keep the template's `themed-text`, `themed-view`, `use-theme`, splash overlay if useful.
5. Install the base stack with `npx expo install` (never `npm install <pkg>` for RN/Expo packages): `@tanstack/react-query`, persistence (`@tanstack/react-query-persist-client`, `@tanstack/query-async-storage-persister`, `@react-native-async-storage/async-storage`), `@react-native-community/netinfo`, `expo-dev-client`, `expo-updates`, `expo-mcp --dev`. Add feature libraries only when their slice is built.
6. Copy the base layer from [templates/src/](templates/src/) into `src/`: `app/_layout.tsx` (providers + root ErrorBoundary), `lib/api/{client,errors}.ts`, `lib/query/{client,keys}.ts`, `components/ui/{screen,card,state-views,query-section,segmented-control}.tsx`, `constants/theme.ts`. Merge with the template's files rather than blindly overwriting; adapt copy and tokens to the app.
7. Project tooling: [templates/.claude/settings.json](templates/.claude/settings.json) (enables `expo@claude-plugins-official`), [templates/.claude/launch.json](templates/.claude/launch.json) (web preview + Metro with Expo MCP), `.env.example` listing every `EXPO_PUBLIC_*` var, `.vscode/extensions.json` (`expo.vscode-expo-tools`), `"typecheck": "tsc --noEmit"` script.
8. `git init` (if new), first commit after checks pass.

**Checks** (every phase from here on):

```bash
npx tsc --noEmit && npx expo lint && npx expo-doctor
```

## Phase 4 — build features, one slice at a time

For each item in the MVP list (then "Later" items if asked):

1. Read the matching section in [references/features.md](references/features.md) and load the listed skill(s) (`expo:*`, `building-react-native-apps:*`, `vercel-react-native-skills`, `expo-native-ui`, `ui-design`). Check `expo:expo-examples` for an official `with-*` example before integrating a third-party SDK.
2. Fetch the current docs page for every package touched. Install with `npx expo install`.
3. Implement following architecture.md: typed client in `lib/`, hooks wrapping `useQuery`/`useMutation`, screens composed from `Screen` + `QuerySection` with loading / error+retry / empty / content states, route params validated, route-level `ErrorBoundary`.
4. Native module added or `app.json` plugin changed: a new development build is needed (`npx expo run:ios|android` or `eas build --profile development`). Tell the user; Expo Go won't load it.
5. Run the checks. Then **verify visually** with what's available: the iOS Simulator tool (Claude desktop), Expo MCP local capabilities (`EXPO_UNSTABLE_MCP_SERVER=1 npx expo start` + `expo-mcp`), or the web preview (`preview_start` with launch.json) for layout. Check light + dark mode, small phone width, long text, empty and error states, keyboard overlap, safe areas.
6. Review the slice for security (secrets, auth guards, RLS), race conditions, and RN performance (lists, re-renders, images). Fix before moving on.
7. Commit with a conventional message; update `SPEC.md` checklist.

Order of slices for most apps: navigation shell → auth → core data read path → core write path → offline/persistence → notifications → payments → platform extras (widgets etc.) → analytics/crash reporting → polish (haptics, animations, empty-state art).

## Phase 5 — EAS and release

Read [references/ship.md](references/ship.md); load `expo:eas-app-stores`, `expo:eas-update`, `expo:eas-workflows` as needed.

- `npx eas-cli@latest login` and `init` are the user's to run if not logged in (interactive login). `eas.json` from [templates/eas.json](templates/eas.json): `development`, `preview` (internal, channel `preview`), `production` (`autoIncrement`, channel `production`), `appVersionSource: "remote"`.
- First build: `preview` Android APK for phones, or iOS internal (needs Apple Developer account). Builds take 10–20 min; don't poll in a tight loop.
- OTA: JS-only changes ship with `eas update --channel <ch>`; native changes need a new build and a `version` bump.
- **Never** run `eas submit`, publish to stores, or change store listings without explicit user approval in chat.
- Write the README "Build and deploy" section (profiles table, one-time setup, APK/TestFlight steps, OTA, store checklist) like the reference app does.

## Rules that always apply

- Configure native behavior only via `app.json`/config plugins. `ios/` and `android/` are generated (CNG) and gitignored; never hand-edit them.
- Prefer Expo modules and `@expo/ui` (SwiftUI/Jetpack Compose) over third-party libraries; fewest dependencies that do the job.
- Secrets never go in `EXPO_PUBLIC_*` (inlined into the bundle) or in git. Server-side keys live in the backend / EAS env vars / Supabase secrets.
- Every remote-data section has four states: loading, error with retry, empty, content. A failed refresh keeps old data and shows a non-blocking notice.
- If the app shows data from a fallback source (cache, end-of-day, offline), the UI says so.
- Accessibility: roles/labels on custom controls, 44pt touch targets, dynamic type tolerant layouts, contrast in both themes.
- Don't run dev servers with Bash in Claude desktop; use `preview_start` with `.claude/launch.json`.
- Run checks before saying anything is done. Report failures as-is.
