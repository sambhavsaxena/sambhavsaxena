# Discovery interview

Goal: every decision that is expensive to reverse is made by the user or explicitly defaulted, before code exists.

How to run it:

- Use `AskUserQuestion`. Max 4 questions per call, 2–4 options each (the user can always type "Other"). `header` ≤ 12 chars.
- First option = your recommendation for *this* app, labelled "(Recommended)", description says why.
- Skip a question when the statement already answers it. Rewrite options to fit the domain; the lists below are menus, not scripts.
- `multiSelect: true` for "which of these" lists. Split long lists across two questions (e.g. "Core features" and "Device features").
- After each round, restate decisions in one line each and carry them forward. Contradictions (e.g. "offline-first" + "realtime collaborative") get a follow-up.
- Stop asking when the remaining unknowns have safe defaults; list those defaults in the spec under **Assumptions**.

---

## Round 1 — product core

| Question | Typical options | Notes |
|---|---|---|
| Platforms | iOS + Android (Recommended) · iOS only · Android only · iOS + Android + web | Web adds CORS, SSR/static output and `.web.tsx` work. |
| Audience / region | Global · India · US · EU/UK | Region decides payment rails, phone auth, consent (GDPR/DPDP), localization, store pricing. |
| User roles | Single user type · Consumer + admin · Two-sided marketplace · Team/workspace (B2B) | Multi-role apps: one app with role-based routes vs separate apps. Default one app. |
| MVP target | Working prototype on my phone · Internal testers (TestFlight/APK) · Public store launch | Sets how much hardening, compliance and polish goes into v1. |

Follow-ups: existing backend/API? (URL + auth scheme, OpenAPI spec?) · existing web app to share code with? (`expo:expo-web-to-native`, `expo:expo-dom`) · Figma or brand assets?

## Round 2 — backend, database, authentication

**Backend / database**

| Option | When to recommend |
|---|---|
| Supabase (Postgres + Auth + Storage + Realtime + Edge Functions) | Default for most apps: relational data, RLS, realtime, generous free tier; Supabase MCP can create tables and policies. |
| Firebase (Firestore + Auth + FCM + Storage) | Heavy realtime/offline sync, Google ecosystem, already using Firebase. |
| Convex | Reactive TypeScript backend, realtime by default, small team wanting no SQL. |
| Own API (Node/Fastify, FastAPI, Go, Frappe, …) | Existing backend, complex business logic, compliance requirements. |
| Local only (expo-sqlite / AsyncStorage) | Single-user tools, offline utilities, no sync. |
| Expo Router API routes + EAS Hosting | Thin server logic colocated with the app (`expo:eas-hosting`). |

Follow-ups: offline requirement (none · read cache · full offline with sync) · file uploads (images, video, documents; size limits) · realtime needs (chat, live tracking, collaborative editing, presence) · search (simple filter · full-text · semantic/AI).

**Authentication**

| Question | Options |
|---|---|
| Is login needed? | Required before use · Optional (guest mode, login to save) · None |
| Methods (multiSelect) | Email + password · Magic link / email OTP · Phone OTP (SMS) · Google · Apple · Passkeys · Enterprise SSO (SAML/OIDC) |
| Provider | Same as backend (Supabase Auth / Firebase Auth) (Recommended) · Clerk · Better Auth · Auth0 / custom OIDC |
| Extras (multiSelect) | Biometric unlock (Face ID / fingerprint) · Email verification · 2FA · Account deletion in-app · Roles/permissions |

Must-tell: iOS apps that offer third-party social login generally must also offer Sign in with Apple (App Review 4.8). Apps with account creation must offer in-app account deletion (Apple 5.1.1(v), Google Play). Token storage uses `expo-secure-store`.

## Round 3 — features

Split into two multiSelect questions; tailor to the domain.

**Core features**: user profile · feed/list + detail · search + filters · create/edit content (forms) · media upload (photos/video) · chat/messaging · comments/reactions/social graph · bookings/calendar · cart + checkout · order/status tracking · ratings/reviews · favorites/bookmarks · AI features (chat, summarization, image) · admin/moderation tools.

**Device features**: push notifications · local notifications/reminders · camera/QR/barcode scan · location + maps · background location · contacts · calendar · files/document picker · audio record/playback · video playback · Bluetooth/NFC · health data (HealthKit/Health Connect) · haptics · biometrics · share sheet / share extension · deep links / universal links · offline mode.

Conditional follow-ups:

- **Maps/location**: provider (Apple Maps iOS + Google Maps Android via `expo-maps` (alpha) · `react-native-maps` (Google on both, mature) · Mapbox (custom styling, offline tiles)) · foreground only vs background tracking · geofencing · routing/ETA · clustering many markers.
- **Notifications**: transactional only vs marketing · Expo Push Service (Recommended) vs direct FCM/APNs vs OneSignal · rich (images/actions) · scheduled local reminders · in-app inbox.
- **Chat**: 1:1 vs groups · media messages · typing/read receipts · build on backend realtime vs Stream/Sendbird.
- **Media**: max size/duration · compression · CDN/image transforms.
- **AI**: provider, on-device vs server (never ship provider keys in the app; proxy through backend).

## Round 4 — monetization and payments

| Question | Options |
|---|---|
| Revenue model | Free · Subscriptions · One-time unlock · Physical goods/services marketplace · Ads · Tips/donations |
| What is sold? | Digital content/features consumed in-app · Physical goods or real-world services · Both |
| Provider | depends, see below |

Rules to explain when relevant:

- **Digital goods/features on iOS/Android** must use store in-app purchase: RevenueCat (`react-native-purchases`) (Recommended: receipts, entitlements, paywalls, analytics) or `expo-iap`. External payment links are only allowed in specific regions/programs; check current store rules.
- **Physical goods / real-world services**: Stripe (`@stripe/stripe-react-native`, PaymentSheet, Apple Pay/Google Pay) — global; Razorpay (`react-native-razorpay`, UPI) — India; PayPal/Braintree; Adyen. Payment intents are created server-side only.
- **Marketplaces with payouts**: Stripe Connect / Razorpay Route; KYC onboarding flow.
- **Ads**: `react-native-google-mobile-ads` + ATT prompt (`expo-tracking-transparency`) + consent (UMP) in EU.

Follow-ups: currencies · taxes/invoices · refunds · free trial · paywall placement (onboarding vs feature gate) · promo codes.

## Round 5 — platform-specific

**iOS** (multiSelect): home-screen widgets (`expo-widgets`) · Live Activities / Dynamic Island (`expo-widgets`) · App Clip (`expo:expo-app-clip`) · App Intents/Siri Shortcuts · Share extension · Sign in with Apple · Apple Pay · HealthKit · iCloud/Keychain sharing · iPad layout.

**Android** (multiSelect): home-screen widgets (`react-native-android-widget`) · Material You dynamic color · App shortcuts · Predictive back · Google Pay · Health Connect · Foreground service (tracking, media) · Tablet/foldable layout · Edge-to-edge.

Follow-ups for widgets: which data, refresh frequency, sizes, tap deep link target, shared storage (App Group) with the app.

## Round 6 — UX and design

| Question | Options |
|---|---|
| Design direction | Native platform look (iOS HIG / Material) (Recommended) · Custom brand system · Minimal/neutral · Playful/illustrated |
| Navigation | Bottom tabs (NativeTabs) + stacks (Recommended) · Drawer · Single stack · Tabs + modal sheets |
| Theme | Light + dark following system (Recommended) · Light only · Dark only · User-selectable |
| Onboarding (multiSelect) | Intro carousel · Permission priming screens · Account setup wizard · None |
| Accessibility / i18n (multiSelect) | VoiceOver/TalkBack labels · Dynamic type · RTL languages · Multiple languages (which?) |
| Motion | Subtle native transitions (Recommended) · Rich animations (Reanimated, shared elements) · Minimal |

Ask for brand color, logo, app name, and Figma links if a custom system is chosen (`expo:expo-design-system`).

## Round 7 — ops, quality, release

| Question | Options |
|---|---|
| Crash + error reporting | Sentry (Recommended) · EAS Observe · Firebase Crashlytics · None for now |
| Product analytics | PostHog (Recommended) · Firebase Analytics · Amplitude/Mixpanel · None |
| CI/CD | EAS Workflows (Recommended) · GitHub Actions + EAS CLI · Manual |
| Environments | dev + preview + production (Recommended) · dev + production |
| OTA updates | expo-updates with channels (Recommended) · None |
| Testing | Unit (Jest + RNTL) · E2E (Maestro on EAS) · Manual only for MVP |
| Accounts ready? | Expo account · Apple Developer ($99/yr) · Google Play Console ($25 once) |

Also: app name, bundle ID/package (`com.company.app`, permanent), privacy policy URL, support email, target release date.

---

## Defaults (when the user says "use your defaults")

| Area | Default |
|---|---|
| Platforms | iOS + Android; web only if trivial |
| Backend | Supabase (Postgres + RLS + Storage + Realtime) |
| Auth | Supabase Auth, email OTP + Google + Apple; `expo-secure-store` session |
| Data fetching | TanStack Query + persisted cache + NetInfo/AppState managers |
| Local storage | AsyncStorage for small prefs; `expo-sqlite` for structured offline data |
| Navigation | NativeTabs + per-tab native Stack, large titles on iOS |
| UI | Expo Router native headers, `@expo/ui` for pickers/sheets/toggles, `expo-image`, `expo-symbols` |
| Theme | System light/dark with semantic tokens |
| Notifications | `expo-notifications` + Expo Push Service |
| Payments | None unless asked; digital → RevenueCat, physical → Stripe (Razorpay in India) |
| Maps | `expo-maps` if simple pins; `react-native-maps` if Google Maps on iOS or clustering is needed |
| Errors/analytics | Sentry; analytics off until asked |
| Release | EAS dev/preview/production + update channels; no store submit without approval |
