# Architecture

Distilled from a working Expo SDK 57 app (Expo Router + NativeTabs + TanStack Query + EAS). Adapt names to the domain; keep the shapes.

## Folder layout

```text
src/
  app/                          # routes only — every file is a screen, _layout.tsx = navigator
    _layout.tsx                 # providers, root Stack, root ErrorBoundary, splash
    (tabs)/
      _layout.tsx               # <AppTabs /> (NativeTabs on native, expo-router/ui tabs on web)
      (home)/_layout.tsx        # <TabStack title="Home" /> — each tab owns a native Stack
      (home)/index.tsx
      search/_layout.tsx
      search/index.tsx
    item/[id].tsx               # detail route pushed over tabs; validates params; own ErrorBoundary
    (auth)/sign-in.tsx          # auth group, guarded via Stack.Protected or redirects
  components/
    ui/                         # domain-agnostic: screen, card, query-section, state-views, segmented-control
    <domain>/                   # domain components: quote-row, order-card, …
    app-tabs.tsx / app-tabs.web.tsx   # platform split via file extension
  constants/theme.ts            # Colors (light/dark semantic tokens), Spacing, Fonts, layout constants
  hooks/                        # use-theme, use-color-scheme(.web), use-debounced-value, use-<domain>-data, providers
  lib/
    api/ (or <service>/)        # typed client + errors.ts (single error type with kind + isRetryable)
    <domain>/                   # normalize/parse raw responses, types.ts, pure helpers (dates, format)
    query/client.ts             # QueryClient, retry policy, persister, online/focus managers
    query/keys.ts               # query-key factory
  global.css                    # web font vars
scripts/                        # dev tooling (e.g. CORS proxy for web)
.claude/launch.json             # preview_start configs
.claude/settings.json           # enabledPlugins: expo@claude-plugins-official
```

Rules: non-route code never lives in `src/app/`. Path alias `@/*` to `./src/*`. Platform differences use `.ios.tsx` / `.android.tsx` / `.web.tsx` files, not `Platform.OS` branches spread through components.

## Root layout

```tsx
SplashScreen.preventAutoHideAsync();
wireQueryManagers();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <QueryProvider>                 {/* PersistQueryClientProvider on native, plain on web */}
        <SessionProvider>             {/* auth; then domain providers */}
          <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="item/[id]" options={{ title: '' }} />
          </Stack>
        </SessionProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}

/** Last-resort boundary for render errors anywhere in the app. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) { /* message + Retry */ }
```

- Persist only successful queries: `dehydrateOptions: { shouldDehydrateQuery: (q) => q.state.status === 'success' }`, `maxAge` 24 h, bump `buster` when cached shapes change.
- Each detail route also exports `ErrorBoundary` so a crash there doesn't take down the tabs.

## Navigation

- `NativeTabs` with `sf` + `md` icons; search tab uses `role="search"`. Import path depends on SDK: `expo-router/unstable-native-tabs` for SDK 55–57, `expo-router/native-tabs` for SDK 58+ (check the native-tabs docs page).
- `app-tabs.web.tsx` uses `Tabs`, `TabList`, `TabTrigger`, `TabSlot` from `expo-router/ui`.
- Each tab = route group with its own `_layout.tsx` returning a shared `TabStack` (native Stack, `headerLargeTitleEnabled` on iOS, no header shadow).
- Detail screens set titles and header buttons with `<Stack.Screen options={…} />` inside the screen.
- Validate dynamic params (`parseId`, `parseSymbol`) and render a proper "invalid" / "not found" state rather than crashing.
- Auth: `<Stack.Protected guard={!!session}>` around the signed-in group, sign-in route outside it (docs: `router/advanced/protected.md`). Show the splash until the session has hydrated so users never see a sign-in flash.

## Data layer

1. **Typed client** (`lib/api/client.ts`): one place for base URL, headers, auth token, timeout (AbortController linked with the query's `signal`), JSON parsing, and mapping *every* failure to one error class.
2. **Error type** (`templates/src/lib/api/errors.ts`, client in `templates/src/lib/api/client.ts`): `kind` = `network | timeout | http | protocol | not_found | tool/server | aborted | unauthorized`, `status`, `isRetryable` getter (network, timeout, 5xx, 429), and `describeError(error)` for user-facing copy (platform-aware, e.g. CORS hint on web).
3. **Normalizers** (`lib/<domain>/parse.ts`): never trust server payloads. Coerce with helpers (`asRecord`, `toNumber`, `toText`, `compactMap`), drop invalid rows, recompute derived fields that the server gets wrong, and document every server quirk at the top of the module and in the README.
4. **Hooks** (`hooks/use-<domain>-data.ts`): one hook per query. Set `staleTime` per data volatility (live ~60 s, daily data ~30 min, rarely-changing hours). Use `placeholderData: keepPreviousData` for filters/pagination/search. Gate with `enabled`. Poll only when it matters: `refetchInterval: () => (isOpen() ? 60_000 : false)`.
5. **Fallback sources**: when a primary source fails, try the secondary and return `{ ...data, fallbackReason }` (type `WithFallback<T>`). Re-throw aborts. Give the primary one quick retry first. The UI shows the reason.
6. **Partial failure**: `Promise.allSettled` for independent sub-requests; only fail when all fail.
7. **Query keys** (`lib/query/keys.ts`): factory object; sort arrays inside keys so order doesn't create duplicates.
8. **QueryClient** (`templates/src/lib/query/client.ts`): retry predicate uses `isRetryable`, exponential backoff capped at 8 s, `gcTime` ≥ persist `maxAge`, `onlineManager` ← NetInfo, `focusManager` ← AppState (native only).
9. **Mutations**: `useMutation` with optimistic update + rollback for user-visible writes; invalidate by key prefix.

## Local state and persistence

- Small persisted user state (watchlist, preferences, onboarding done) = context provider that hydrates from AsyncStorage once, exposes `hydrated`, validates the parsed value (type guard, cap length), saves on change after hydration, and warns (not crashes) on storage errors. React 19 style: `use(Context)` and `<Context value={…}>`.
- Secrets/tokens: `expo-secure-store` only.
- Larger structured offline data: `expo-sqlite` (with Drizzle if a schema is helpful).
- Server state stays in TanStack Query; don't copy it into context.

## UI building blocks

- `Screen`: `ScrollView` with `contentInsetAdjustmentBehavior="automatic"`, `keyboardDismissMode="on-drag"`, `keyboardShouldPersistTaps="handled"`, pull-to-refresh (native only) driven by an async `onRefresh`, content centred to `MaxContentWidth`, bottom padding for the tab bar.
- `Card`: title/subtitle/action header, `borderCurve: 'continuous'`, themed background.
- `QuerySection<T>`: given a query result, renders loading, error+retry, offline-paused notice, empty (via `isEmpty`), or `children(data)`; a refetch error over cached data shows a warning notice instead of replacing content.
- `state-views`: `LoadingState`, `ErrorState`, `EmptyState`, `Notice` (info/warning/error tone, optional Retry), accessible roles (`progressbar`, `alert`).
- `SegmentedControl` (or `@expo/ui` native picker): `tablist`/`tab` roles with `selected` state.
- Lists with many rows: `FlashList` or `FlatList`, never `.map` inside `ScrollView` for unbounded data.
- Images: `expo-image` with placeholders and `contentFit`.
- Numbers in tables: `fontVariant: ['tabular-nums']`.

## Theme

`constants/theme.ts` exports `Colors.light` / `Colors.dark` with semantic tokens (`text`, `textSecondary`, `background`, `backgroundElement`, `backgroundSelected`, `border`, `accent`, `positive`, `negative`, `warning`, `warningBackground`, `errorBackground`), a `Spacing` scale (2, 4, 8, 16, 24, 32, 64), `Fonts` per platform (`system-ui`/`ui-rounded` on iOS, CSS vars on web), `BottomTabInset`, `MaxContentWidth`. `useTheme()` reads `useColorScheme()`; the web variant returns `'light'` until hydrated (static rendering). `ThemedText` has typed variants (`title`, `subtitle`, `small`, `smallBold`) and `themeColor`.

## Config conventions

- `app.json`: `experiments.typedRoutes`, `experiments.reactCompiler` (then skip manual `useMemo`/`useCallback` unless profiling says otherwise), `runtimeVersion.policy = appVersion`, `web.output = "static"`, permission strings per plugin.
- `tsconfig.json`: extends `expo/tsconfig.base`, `strict: true`, `@/*` alias.
- ESLint flat config with `eslint-config-expo/flat`.
- `.gitignore` keeps `/ios`, `/android`, `.env*.local`, keystores and `*.p8/*.p12/*.mobileprovision` out of git.
- Env: `EXPO_PUBLIC_*` only for non-secret config (API base URLs, publishable keys). `.env.example` documents each one.
- Web dev against servers without CORS: a tiny Node proxy (`scripts/cors-proxy.js`) + `EXPO_PUBLIC_*_URL` overrides + a `launch.json` entry; explain in README that phones don't need it.

## Docs to produce

- `README.md`: what the app does, screens, data sources, error handling and fallbacks, known server quirks + workarounds, run instructions (dev build vs Expo Go), web notes, EAS build/deploy, pre-ship checklist, checks command.
- `SPEC.md`: decisions, MVP checklist, backlog; updated each slice.
- Keep `AGENTS.md` from the template; append project-specific rules.
