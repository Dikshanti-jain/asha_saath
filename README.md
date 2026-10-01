# ASHA Saath

The working website is in [asha-saath-lovable](asha-saath-lovable/README.md). The separate Android-first native app is in [asha-saath-mobile](asha-saath-mobile/README.md). Both use the same Node 24 HTTP backend and persistent SQLite database. The website preserves the generated Lovable TanStack Start frontend; the mobile app uses Expo/React Native and Expo Router.

From this workspace, with Node 24 and npm available:

```powershell
Set-Location .\asha-saath-lovable
npm install
npm run dev:local
```

Open [ASHA Saath locally](http://127.0.0.1:5173). `dev:local` starts the frontend on 5173 and API on 4318. The default database is `asha-saath-lovable/backend/data/asha-saath.sqlite`; app records persist there across restarts. Dependencies are already installed in this workspace. Fresh source recipients need the install step.

Choose a fixed fictional account to try coordinator, ASHA or provider work. The server issues scoped sessions and validates actions; the open demo account selector does not verify a real staff identity. Use synthetic data only.

The [bundled Android USB demo APK](output/asha-saath-android-usb-demo.apk) is installed on the connected phone. Native visits/help/cash requests/messages/maps and login restoration were smoke-tested. It uses the running laptop backend via USB; production signing/public HTTPS hosting remain pending. [Mobile source ZIP](output/asha-saath-mobile-source.zip) contains the separate native source, and [device evidence](output/verification/mobile-device-2026-10-09/native-device-review.json) gives the tested scope.

The working local workflow has been checked through plan generation, visit completion, named-recipient consent, provider acceptance/arrangement/delivery, person confirmation and coordinator closure, including reload persistence. Cash requests, budget reservation, independent receipt and scoped messages are implemented. Current website checks passed: 31 Vitest tests, 19 actual HTTP/SQLite tests, TypeScript and Node production build. Mobile TypeScript, ESLint, four transport tests, Expo Doctor and JS exports passed. The earlier 11 planner regressions and nine planner properties remain separate historical evidence. See [BUILD_STATUS](docs/BUILD_STATUS.md), [mobile build and device status](docs/MOBILE_APP.md) and [handoff](docs/CONTEXT_HANDOFF.md) for exact evidence and limits.

The original [Lovable project](https://lovable.dev/projects/84ca52fd-1ccf-4574-ac3a-191a553287e0) is the source reference; local modifications are not claimed to be synced back. Supabase Cloud was provisioned but is unconnected. No public production deployment, real NGO integration, clinical approval, payment system or offline synchronization is claimed. The separate `asha-saath-app/` Sites fallback is unfinished and unpublished.

The specifications, fixtures and research start at [START_HERE.md](START_HERE.md). [Context handoff](docs/CONTEXT_HANDOFF.md) records production/pilot work beyond the completed local prototype. [Website source ZIP](output/asha-saath-website-source.zip) and [documentation ZIP](output/asha-saath-spec-pack.zip) exist; source packaging was CRC/hash-checked and its clean extracted backend started with 24 synthetic tasks. Packaging is refreshed after final document edits; the [packaging report](output/website-source-packaging.json) identifies the exact archived bytes.

Earlier market and ASHA research remains available through [README-research-pack.md](README-research-pack.md).
