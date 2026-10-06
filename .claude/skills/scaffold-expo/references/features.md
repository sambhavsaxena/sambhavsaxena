# Feature integration guide

Per feature: what to use, which skill to load, and the traps. Package names drift; confirm each on `https://docs.expo.dev/versions/latest/sdk/<name>.md` or the vendor's Expo guide before installing. Install with `npx expo install <pkg>`. "Dev build" = needs a development build, not Expo Go.

Before integrating any third-party service, check `expo:expo-examples` for an official `with-<service>` example and follow it.

## Backend and data

| Choice | Packages | Notes |
|---|---|---|
| Supabase | `@supabase/supabase-js` | Follow Supabase's current Expo quickstart for session storage. Enable RLS on every table *before* shipping; write policies per role. Use the Supabase MCP to create tables, policies, edge functions and generate TS types (`supabase gen types`). Keep service-role key server-side only. |
| Firebase | `@react-native-firebase/app` + modules (dev build) or the JS SDK | Native SDK needs `google-services.json` / `GoogleService-Info.plist` via `app.json` (`android.googleServicesFile`, `ios.googleServicesFile`). Firestore security rules are mandatory. Firebase MCP: `npx -y firebase-tools@latest mcp`. |
| Convex | `convex` | Reactive queries replace TanStack Query for Convex data. |
| Own REST/GraphQL API | `fetch` (`expo/fetch` for streaming) + TanStack Query | Generate types from OpenAPI if available. Typed client + error mapping per architecture.md. |
| Local structured | `expo-sqlite` (+ Drizzle optional) | Migrations at startup; use for offline queues and large lists. |
| Small key-value | `@react-native-async-storage/async-storage` | Versioned keys (`app-thing-v1`), validated on read. |
| Secrets/tokens | `expo-secure-store` | Small values only; don't store large blobs. |
| Server logic in the app repo | Expo Router API routes + `expo:eas-hosting` | Runs on Cloudflare Workers runtime; secrets via EAS env. |

Skills: `expo:expo-data-fetching` (always), `expo:eas-hosting` (API routes).

**Offline**: persisted query cache (architecture.md) covers read-offline. For write-offline, queue mutations in SQLite, replay on reconnect (`onlineManager`), surface pending state in UI. Conflict rule must be in the spec.

## Authentication

| Method | Packages / approach |
|---|---|
| Email/password, magic link, email OTP | Backend's auth SDK (Supabase/Firebase/Clerk). Magic links need deep links (`scheme` + universal links). OTP avoids deep-link fragility. |
| Phone OTP | Backend SMS provider (Twilio/MessageBird via Supabase; Firebase Phone Auth). Costs money per SMS; add rate limits. |
| Google | `@react-native-google-signin/google-signin` (dev build, native) or `expo-auth-session` (browser flow). Needs iOS/Android/web client IDs and SHA-1 of the EAS keystore. |
| Apple | `expo-apple-authentication` (iOS). Required alongside other social logins on iOS. Set `ios.usesAppleSignIn: true`. |
| OAuth/OIDC (Auth0, Keycloak, enterprise) | `expo-auth-session` + `expo-web-browser` with PKCE. |
| Clerk | Clerk's Expo SDK (check current package name in Clerk docs). |
| Biometric unlock | `expo-local-authentication`; set `NSFaceIDUsageDescription`. Unlocks a token in SecureStore; not a replacement for server auth. |
| Passkeys | Provider support first (Clerk, Supabase roadmap); needs associated domains / asset links. |

Patterns: `SessionProvider` hydrates the session before hiding the splash; routes guarded with `Stack.Protected`; tokens refreshed by the SDK; 401 maps to an `unauthorized` error kind that signs out. In-app account deletion screen + backend endpoint is mandatory for store apps with sign-up.

Docs: `develop/authentication.md`, `router/advanced/authentication.md`, `router/advanced/protected.md`.

## Payments and monetization

| Case | Use | Notes |
|---|---|---|
| Subscriptions / digital unlocks | RevenueCat `react-native-purchases` (+ `react-native-purchases-ui` paywalls) or `expo-iap` | Store IAP is required for digital goods. Dev build. Products configured in App Store Connect / Play Console first. Test with sandbox/test accounts. Entitlements checked server-side via webhooks for anything valuable. |
| Physical goods / services (global) | `@stripe/stripe-react-native` PaymentSheet | Config plugin with `merchantIdentifier`, `enableGooglePay`. Server creates PaymentIntent/ephemeral key (Supabase Edge Function / API route). Publishable key only in app. Stripe MCP: `https://mcp.stripe.com`. |
| India (UPI, cards, netbanking) | `react-native-razorpay` (dev build) | Order created server-side; verify signature server-side. Check current Expo config plugin support. |
| Marketplace payouts | Stripe Connect / Razorpay Route | KYC onboarding via hosted flow in `expo-web-browser`. |
| Ads | `react-native-google-mobile-ads` | ATT via `expo-tracking-transparency` on iOS; UMP consent in EEA/UK. |
| Store rating prompt | `expo-store-review` | Ask after a success moment, not on launch. |

Never put secret keys, price calculation, or entitlement decisions in the client.

## Maps and location

| Need | Use |
|---|---|
| Simple map with pins, native look | `expo-maps` (alpha): Apple Maps on iOS, Google Maps on Android (needs Google Cloud API key in `app.json`). Dev build. |
| Google Maps on both platforms, clustering, mature API | `react-native-maps` (configure API keys per docs). |
| Custom styles, offline tiles, navigation | Mapbox (`@rnmapbox/maps`), needs access token + config plugin. |
| Current location | `expo-location` foreground permission with a clear `NSLocationWhenInUseUsageDescription`. |
| Background tracking / geofencing | `expo-location` + `expo-task-manager`; iOS `UIBackgroundModes: location`, Android foreground service. Stores scrutinize this; justify it in review notes and a privacy policy. |
| Address autocomplete / routing | Server-side Places/Directions API calls (keep keys server-side or restrict them by bundle ID). |

## Notifications

- `expo-notifications` + Expo Push Service. Remote push needs a dev build (not Expo Go on Android since SDK 53).
- Needs `extra.eas.projectId`; Android FCM V1 service-account key uploaded to EAS credentials; iOS APNs key managed by EAS.
- Store the Expo push token per user/device in the backend; send from server (Edge Function / API) only.
- Ask permission after explaining value (priming screen), not at launch. Android 13+ needs runtime permission; create channels.
- Deep-link from notification tap via `data.url` + Expo Router.
- Local reminders: `scheduleNotificationAsync` works in Expo Go.
- Docs: `push-notifications/push-notifications-setup.md`.

## Media, camera, files

| Need | Package |
|---|---|
| Camera, QR/barcode | `expo-camera` (barcode scanning built in) |
| Pick photos/videos | `expo-image-picker` |
| Resize/compress before upload | `expo-image-manipulator` |
| Display images | `expo-image` (caching, blurhash placeholders) |
| Video playback | `expo-video` |
| Audio record/playback | `expo-audio` |
| Files / documents | `expo-document-picker`, `expo-file-system` |
| Save to gallery | `expo-media-library` |
| Share | `expo-sharing` (share files), RN `Share` (text/links) |
| Uploads | Signed upload URLs from backend; resumable for large files; show progress. |

Every permission gets a specific usage string in `app.json` plugin config.

## Realtime, chat, AI

- Realtime: Supabase Realtime channels / Firestore listeners / Convex; reconcile with TanStack Query cache (`setQueryData`) rather than parallel state.
- Chat at scale or with moderation: Stream Chat / Sendbird SDKs (check Expo support).
- AI: call the model from the backend (API route / Edge Function) and stream to the app with `expo/fetch`; never ship provider keys. Use the `claude-api` skill for Claude integration details.

## Device and system

| Feature | Package / note |
|---|---|
| Haptics | `expo-haptics` (light on selection, success/error on outcomes) |
| Deep links | `scheme` in `app.json`; universal links: `ios.associatedDomains` + AASA file, Android `intentFilters` with `autoVerify` + assetlinks.json |
| Background work | `expo-background-task` (periodic) + `expo-task-manager` |
| Contacts / calendar | `expo-contacts`, `expo-calendar` |
| Clipboard | `expo-clipboard` |
| Keep awake | `expo-keep-awake` |
| Screen capture block | `expo-screen-capture` (sensitive screens) |
| Age signals | `expo-age-range` (kids/teen compliance) |
| App integrity / attestation | `@expo/app-integrity` (alpha) |
| Bluetooth / NFC | `react-native-ble-plx`, `react-native-nfc-manager` (dev build, config plugins) |
| Health | HealthKit / Health Connect community libraries (dev build); heavy review scrutiny |
| Custom native code | `expo:expo-module` (Swift/Kotlin Expo module + config plugin) |

## Platform-specific

**iOS**

| Feature | How |
|---|---|
| Home-screen widgets, Live Activities, Dynamic Island | `expo-widgets` (iOS, built with `@expo/ui` components). Share data through an App Group. Fetch its docs page for setup. |
| App Clip | `expo:expo-app-clip` skill |
| Other extension targets (share extension, App Intents, notification service) | `@bacons/apple-targets` or a community config plugin; or `expo:expo-module` |
| Native controls (SwiftUI) | `@expo/ui` (`expo:expo-ui` skill): sheets, pickers, menus, toggles, forms |
| SF Symbols | `expo-symbols` |
| Liquid glass / blur | `expo-glass-effect`, `expo-blur` |
| Privacy manifest | `ios.privacyManifests` in `app.json` (docs: `guides/apple-privacy.md`) |

**Android**

| Feature | How |
|---|---|
| Home-screen widgets | `react-native-android-widget` (config plugin, widgets written in JSX) |
| Material 3 / Compose controls | `@expo/ui` Jetpack Compose components |
| Edge-to-edge, nav bar | Default in recent SDKs; `expo-navigation-bar`, `expo-system-ui` |
| Predictive back | `android.predictiveBackGestureEnabled` in `app.json` |
| App shortcuts | Community config plugin (e.g. quick actions library) |
| Adaptive + monochrome icons | `android.adaptiveIcon` (`foregroundImage`, `backgroundImage`, `monochromeImage`) |

## UX and design

- Skills: `expo:expo-native-ui` / `expo-native-ui` (HIG styling, semantic colors), `expo:expo-ui`, `expo:expo-design-system` (tokens, variants), `expo:expo-animation` (Reanimated, gestures), `ui-design`, `vercel-react-native-skills`, `building-react-native-apps:react-native-best-practices` (performance).
- Forms: `react-hook-form` + `zod`; `KeyboardAvoidingView` or `react-native-keyboard-controller`; correct `keyboardType`/`textContentType`/`autoComplete` for autofill.
- Lists: `@shopify/flash-list` for long lists; stable keys; memoized rows only if the compiler isn't enough.
- Bottom sheets / pickers: `@expo/ui` first.
- Animations: `react-native-reanimated` (+ worklets); respect Reduce Motion.
- i18n: `expo-localization` + `i18next`/`react-i18next` (or Lingui); `Intl` for numbers/dates/currency; RTL via `I18nManager`.
- Onboarding: permission priming screens before system prompts; skip button; remember completion in AsyncStorage.
- Empty states with a clear next action; skeletons or spinners per section, never a full-screen blocker for partial data.

## Observability

| Need | Package |
|---|---|
| Crash + error reporting | `@sentry/react-native` (Expo config plugin + source maps upload in EAS build) — Sentry MCP `https://mcp.sentry.dev/mcp`; or `expo-observe` (`expo:eas-observe`) |
| Product analytics | `posthog-react-native`, Firebase Analytics, Amplitude |
| OTA health | `expo:eas-update-insights` |
| Performance | `expo:eas-observe`, React Native DevTools, `building-react-native-apps:react-native-best-practices` |

Strip PII from events; respect ATT/consent.
