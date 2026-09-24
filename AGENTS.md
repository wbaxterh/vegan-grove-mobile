# AGENTS.md

All coding agents working in this repository must follow this order:

1. Read `SOUL.md`.
2. Read `PRODUCT-PRINCIPLES-CHECKLIST.md`.
3. Then implement changes.

## Non-negotiables

- Privacy first. No new personal data without an entry in the data inventory. Profiles are never public. Nothing personal reaches logs or third parties.
- The principal comes from the session, never from a request body.
- Every list is filtered by visibility on the server.
- Use the shared design tokens. No new hex colors, no third-party fonts.
- Reliable over flashy. Smaller scope with tests beats larger scope without.
- Never commit secrets, `.env` files, `ios/`, `android/`, or infrastructure identifiers. `secretlint` runs on every commit; treat a finding as a stop.

## Before proposing completion

Run `npm run validate` and provide:

- What activist outcome improved.
- What privacy and trust checks were run.
- What metric or feedback signal should be monitored.

If uncertain, choose the smaller scope and ask for review.

## Commit and PR conventions

- Conventional commit subjects (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`).
- Squash merges into `main`. The `validate` check must be green.
- Copy the PR summary block from `PRODUCT-PRINCIPLES-CHECKLIST.md` into every PR.

## This repository

**Purpose.** The Vegan Grove iOS and Android app: Expo SDK 57, expo-router, TypeScript, zustand, TanStack Query, MapLibre. Targets the API in `vegan-grove-api` (surface mirrored in `src/constants/api.ts`).

**Expo has changed; do not trust training data.** Before touching an Expo, EAS, or React Native API, read the `expo` major in `package.json` and check `https://docs.expo.dev/versions/v<major>.0.0/` or `https://docs.expo.dev/llms.txt`. Add packages with `npx expo install <pkg>` so versions match the SDK. Run `npx expo-doctor` after dependency changes.

**Layout.** Routes in `app/` (every file is a screen, `_layout.tsx` files are navigators; keep non-route code out of it). Everything else in `src/`: `constants/`, `lib/api/`, `lib/stores/`, `lib/notifications/`, `lib/images/`, `theme/`, `components/`. `@/` resolves to `src/`.

**Run.** `npm ci`, `npx expo start --dev-client` after an EAS development build. Expo Go cannot load MapLibre.

**Validate.** `npm run validate` = `biome check` + `tsc --noEmit` + `scripts/check-prod-ready.sh`. Husky runs Biome and secretlint on staged files.

**Where things live.**
- Colors: `src/theme/tokens.ts` only. Components read `useTheme().colors`. No hex in components.
- API calls: `src/lib/api/*.ts` over `src/lib/api/client.ts`. Never call `fetch` from a screen.
- Session: `src/lib/stores/authStore.ts`; routing by auth state is in `AuthGate` (`app/_layout.tsx`).
- Push: `src/lib/notifications/index.ts`. The OS prompt only fires after the in-app soft-ask.
- Images that leave the device go through `src/lib/images/stripExif.ts` first.
- Native config: `app.config.ts` only. There is no `app.json`.

**Do not.**
- Do not create or edit `ios/` or `android/`. They are generated (CNG) and gitignored.
- Do not run `expo prebuild` or commit its output.
- Do not add analytics, crash reporters with PII, Google Maps, third-party fonts, or icon CDNs.
- Do not send device coordinates anywhere except as the map's bounding box query.
- Do not log tokens, emails, or request bodies.
- Do not put a hostname, IP, or dev machine name in `src/` or `app/`; `check-prod-ready.sh` fails the build.
