# <App name> — product spec

Status: draft | approved (<date>)
Expo SDK: <major> · Bundle ID / package: `com.<company>.<app>` (permanent after publishing)

## Summary

One paragraph: who it is for, the core loop, why it exists.

## Users and roles

| Role | Can do |
|---|---|
| | |

## Platforms

iOS / Android / web — minimum OS versions if relevant, tablet support yes/no.

## Screens

Numbered, with route paths (`src/app/...`) and the data each one reads/writes.

1. **<Screen>** — `src/app/(tabs)/(home)/index.tsx` — purpose; states (loading/error/empty/content)
2. …

Navigation: tabs (`NativeTabs`) / stacks / modals / sheets.

## Data model

Tables/collections with key fields, relations, ownership and access rule (RLS / security rules).

## Decisions

| Area | Choice | Why |
|---|---|---|
| Backend / database | | |
| Authentication | | |
| Data fetching / offline | TanStack Query + persisted cache | |
| Payments | | |
| Maps / location | | |
| Notifications | | |
| Platform extras (widgets, Live Activities, App Clip, shortcuts) | | |
| Design direction / theme | | |
| i18n / accessibility | | |
| Crash reporting / analytics | | |
| CI/CD / OTA | EAS Build + Update (+ Workflows) | |

## Integrations

| Service | Package | Native (dev build)? | Keys/config needed (names only) |
|---|---|---|---|
| | | | |

## Non-functional

- Offline behavior:
- Performance targets (lists, startup):
- Accessibility:
- Privacy / compliance (account deletion, consent, data safety, disclaimers):

## MVP (v1) checklist

- [ ] Navigation shell + theme
- [ ] …

## Later

- …

## Assumptions

Defaults applied without explicit confirmation.

## Risks and open questions

- …
