---
name: expo-claude-workflow
description: Workflow for building iOS/Android apps with Claude Code + Expo + React Native + TypeScript + Expo Router + EAS. Use when the user wants to build the initial first version (MVP) of an idea as a mobile app and keep iterating on it, or to start, scaffold, run, test, or ship a mobile app, set up the Expo Claude plugin, write a product spec for an app, or configure EAS builds.
---

# Expo + Claude Code mobile app workflow

Stack: Claude Code → Expo → React Native → TypeScript → Expo Router → EAS.
Default to Expo, not bare React Native. Native Swift/Kotlin code can be added to Expo projects later if needed.
Expo docs: https://docs.expo.dev/agents/claude/ (verify current details; Expo changes each SDK).

## 1. Setup

```bash
npm install -g @anthropic-ai/claude-code   # then run `claude` to authenticate
claude plugin install expo@claude-plugins-official
```

Plugin adds Expo skills and the Expo MCP server (docs, EAS workflows, logs, screenshots). Verify with `/mcp`. Plugin MCP may need OAuth authorization by the user.

## 2. Create the app

```bash
mkdir my-mobile-app && cd my-mobile-app && claude
```

Prompt:

```text
Create a new Expo React Native application in this directory using TypeScript and Expo Router.
Use the latest stable Expo SDK.
Set it up as a production-quality mobile application for both iOS and Android.
Do not start the development server yet.
```

`create-expo-app` generates `AGENTS.md` with Expo conventions; follow it. Always install packages with `npx expo install <pkg>` for SDK-compatible versions.

## 3. Run on a phone

```bash
npx expo start            # QR code: iPhone Camera, Android via Expo Go
npx expo start --tunnel   # if phone cannot connect
```

Fast Refresh shows Claude's changes live. Expo Go only has bundled native modules; others need a dev build (`npx expo run:ios|android` or `eas build --profile development`).

## 4. Build features incrementally

- Give a real spec, not a one-liner. Include: tech (Expo, RN, TS, Expo Router, backend e.g. Supabase / own Node or FastAPI / Firebase), numbered screens, core functionality, design direction (minimal, modern, mobile-first).
- Feature prompts list requirements and constraints: Expo-compatible libs, modular architecture, no unnecessary dependencies.
- Example: auth flow = email/password, Google login, persistent session, secure token storage (expo-secure-store), loading/error states, login/signup/forgot-password screens.
- After each feature: run `npx tsc --noEmit` and `npx expo lint`, fix errors.
- Then review for security issues, race conditions, poor RN practices; fix.

## 5. Test the real app

Use Expo MCP / simulator tools / screenshots to check UI: layout problems, overflow, inconsistent spacing, broken navigation, poor mobile UX. Fix what is found. Prefer this over blind code generation.

## 6. Ship with EAS

```bash
npm install --global eas-cli
eas login
eas build:configure
eas build --platform android
eas build --platform ios
```

Prompt: "Configure EAS Build: development, preview, production profiles; Android and iOS; do not submit to stores yet." Never submit to stores without explicit user approval.

## Architecture reference

```text
Claude Code → Expo + React Native → Android / iOS → EAS Build → Google Play / App Store
App → API → Postgres + Storage
```

## Iterating after v1

- v1 first: build the thinnest end-to-end slice (core screens + one backend path), run on phone, then add features one at a time.
- Keep a short `SPEC.md` / backlog in the repo; update it each iteration so later sessions have context.
- Commit per feature after tsc + lint pass; use `eas update` (OTA) for JS-only changes, new `eas build` only when native deps change.
