# Ship with EAS

Load `expo:eas-app-stores` (builds, signing, submit), `expo:eas-update` (OTA), `expo:eas-workflows` (CI), `expo:expo-dev-client` (dev builds / TestFlight internal). Run EAS CLI as `npx eas-cli@latest <cmd>` (or `bunx eas-cli` in bun projects).

## One-time setup (user runs interactive steps)

```bash
npx eas-cli@latest login
```

```bash
npx eas-cli@latest init
```

`init` writes `extra.eas.projectId` (and `owner`) into `app.json`; `expo-updates` and push notifications need it.

## Profiles (`templates/eas.json`)

| Profile | Output | Use |
|---|---|---|
| `development` | Dev client (iOS simulator build / Android APK) | Daily development with native modules |
| `preview` | Internal distribution: Android APK, iOS ad hoc | Testers via link/QR; channel `preview` |
| `production` | Android AAB, iOS App Store build | Stores; `autoIncrement`; channel `production` |

- `cli.appVersionSource: "remote"` lets EAS own build numbers.
- `runtimeVersion: { "policy": "appVersion" }` in `app.json`: bump `version` on every native change so old binaries don't receive incompatible OTA updates. Use `"fingerprint"` policy if the team prefers automatic detection.
- Env vars per environment: `eas env:create` (plain/sensitive/secret). `EXPO_PUBLIC_*` values are public in the bundle.

## Build

```bash
npx eas-cli@latest build --platform android --profile preview
```

```bash
npx eas-cli@latest build --platform ios --profile preview
```

- First Android build offers to generate a keystore; accept (EAS stores it). iOS needs an Apple Developer account; EAS manages certificates and provisioning; register test devices with `eas device:create`.
- Builds take ~10–20 min. Don't poll tightly; the user gets a URL/QR.
- Run a build on an emulator/simulator: `npx eas-cli@latest build:run --platform android --latest`.

## OTA updates

```bash
npx eas-cli@latest update --channel preview --message "describe the fix"
```

JS/asset changes only. New native module, config plugin, permission, or SDK upgrade = new build. Check rollout health with `expo:eas-update-insights`.

## Submit (only with explicit user approval)

```bash
npx eas-cli@latest build --platform android --profile production
```

```bash
npx eas-cli@latest submit --platform android --latest
```

- Google Play: developer account ($25 once). First release uploaded manually in Play Console; then `submit` with a service-account JSON key. Start on internal testing track.
- App Store: Apple Developer Program ($99/yr). `submit` uploads to App Store Connect / TestFlight; App Store Connect API key managed by EAS.

## CI/CD (EAS Workflows)

`.eas/workflows/*.yml` (`expo:eas-workflows`): typical set:
- PR: `tsc` + `lint` + preview update per branch (`eas update --branch pr-<n>`), optional Maestro E2E.
- main: fingerprint check, build if native changed, otherwise publish OTA to `preview`.
- tag/release: production build + submit (manual approval).

## Store compliance checklist

- [ ] Real app icon (iOS `.icon` / 1024 PNG, Android adaptive + monochrome) and splash; no template assets.
- [ ] `bundleIdentifier` / `package` final (cannot change after publish).
- [ ] Permission usage strings specific and honest; request permissions in context.
- [ ] Privacy policy URL + in-app link; terms if selling.
- [ ] In-app account deletion if accounts can be created.
- [ ] Sign in with Apple if other third-party logins exist (iOS).
- [ ] Digital goods via IAP; physical goods via Stripe/Razorpay etc.
- [ ] iOS privacy manifest (`ios.privacyManifests`) covers required-reason APIs used by the app and SDKs.
- [ ] Play Data safety form + App Store privacy nutrition labels match actual collection (analytics, crash, ads SDKs included).
- [ ] ATT prompt only if tracking across apps; consent (UMP/GDPR) where required.
- [ ] Regulated domains (finance, health, kids, gambling, crypto): disclaimers, declarations, age rating answered accurately. Finance data apps: data-source licensing and an "not investment advice" disclaimer.
- [ ] Demo account credentials prepared for App Review (user creates them; don't put them in the repo).
- [ ] Crash reporting live before public launch.

## Upgrades

`expo:expo-upgrade` for SDK bumps: `npx expo install expo@latest && npx expo install --fix && npx expo-doctor`, read the SDK changelog, rebuild dev clients.
