# Android-first mobile application

Version 1.3 · 9 October 2026. The user requested a separate Android-first app while retaining the website, and authorized USB installation/testing on their connected phone. The source is [asha-saath-mobile](../asha-saath-mobile/package.json); the companion website remains [asha-saath-lovable](../asha-saath-lovable/README.md). Both use the same Node/SQLite domain server. The local bundled release APK passed build/artifact checks, installed successfully and launched on the physical TECNO CL7k Android 16 arm64 device. Native session restoration, visit/help capture, cash permission/request, saved message, schematic map controls and NGO budget loading passed the stated checks below. Production release and full hardware workflow coverage are not claimed.

## Product scope

The mobile app uses React Native screens and Expo Router. It preserves the original ASHA Saath identity, navy public-service styling, a visible fictional-prototype label, English/Hindi controls, large actions and clear server-save/error feedback. It is a separate application source rather than a WebView wrapper around the website.

| Workspace | Available journey |
|---|---|
| ASHA | Read own saved visit order/time assumptions; record completed/unavailable/deferred/escalation outcomes; create a linked document-help need; give recipient-specific permission; request fictional cash support; independently record what the person received; use permitted case conversations. |
| Coordinator | Review either fictional ASHA's plan; generate/save the current demo-day plan or replan remaining work on the server; review each unserved reason; coordinate document referrals; confirm/resolve/close eligible cases; reconcile reported funding after withdrawal. |
| NGO | Review currently authorized own-organization requests; accept with transactional service-capacity reservation; record arrangement/delivery; edit and reconfirm own capacity; declare a fictional cash budget; approve/reserve/report payment; communicate in currently permitted cases. |

Document delivery, cash payment report and person confirmation remain separate facts. The server rejects attempts to close unconfirmed/disputed support. Clinical escalation uses the approved health pathway independently of NGO availability. The application never changes approved task priorities or due dates to make a route fit.

The default dataset remains 24 fictional tasks, two assigned ASHAs, three fictional providers and one document-navigation category. The cash extension records nonclinical access costs with separate named-NGO permission. See [funding and communication](FUNDING_AND_COMMUNICATION.md) for guards and states. A national partner network, actual NGO outreach and real household outcomes are not established.

## Current source structure

The inspected dependency set is Expo `~57.0.27`, React `19.2.3`, React Native `0.86.3`, Expo Router `~57.0.25`, TypeScript `~6.0.3`, SDK-compatible native maps/SVG/SecureStore and an npm lockfile. SDK compatibility was checked against the [versioned Expo SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/) on 9 October 2026.

```text
asha-saath-mobile/
├── package.json / package-lock.json     Exact mobile dependencies and commands
├── app.json                            Identity, Android package, platforms, scheme
├── app.config.ts                       CNG plugins; cleartext testing opt-in
├── eas.json                            Internal APK and production AAB profiles
├── AGENTS.md                           Versioned Expo / Router workflow instructions
├── assets/                             Original mobile brand/icon assets
├── src/
│   ├── app/
│   │   ├── _layout.tsx                 MobileProvider, AppShell and stack
│   │   ├── (tabs)/_layout.tsx          Role-appropriate bottom tabs
│   │   ├── (tabs)/index.tsx            Visits / coordinator desk / NGO requests
│   │   ├── (tabs)/needs.tsx            Linked document help and referral workflow
│   │   ├── (tabs)/funding.tsx          Fictional cash support workflow
│   │   ├── (tabs)/messages.tsx         Scoped case conversation
│   │   ├── (tabs)/more.tsx             Network, website, help and account controls
│   │   ├── visits.tsx                 Dedicated saved-plan route
│   │   ├── map.tsx                    Route-map entry
│   │   └── network.tsx                NGO catchment/capacity entry
│   ├── screens/
│   │   ├── VisitsScreen.tsx            Plan, visit result, unserved/recorded rows
│   │   ├── NeedsScreen.tsx             Capture, named permission and referral actions
│   │   ├── FundingScreen.tsx           Request, budget, reservation, report, receipt
│   │   ├── MessagesScreen.tsx          Case selection, messages, read status
│   │   ├── MapScreen.tsx               Current ordered route and list alternative
│   │   └── NetworkScreen.tsx           Exact listed catchments and own-NGO capacity
│   ├── components/
│   │   ├── AppShell.tsx / BrandMark.tsx Original bilingual public-service identity
│   │   ├── AccountPanel.tsx            Fictional account and server-origin controls
│   │   ├── ui.tsx                     Native labelled fields, notices, choices/actions
│   │   ├── MapSketch.tsx              Interactive SVG route without map keys
│   │   ├── MapCanvas.tsx / .web.tsx    Browser/schematic implementation
│   │   └── MapCanvas.native.tsx        Optional native MapView; disabled by default
│   └── lib/
│       ├── MobileContext.tsx          Server state, actor/session, version and feedback
│       ├── api.ts                     Validated origin, bearer transport, command envelope
│       ├── session-vault.ts           Native SecureStore / memory-only web credential
│       ├── types.ts                   Role-scoped mobile projections
│       ├── catalog.json              Frozen synthetic services/geographies/config
│       └── catalog.ts                Shared display helpers
├── scripts/sync-catalog.mjs            Sync approved fixtures; no real case export
├── scripts/preview.mjs                 Exported browser preview + loopback API proxy
└── tests/transport.test.mjs             Origin validation, transport and failure checks

asha-saath-lovable/backend/
├── server.mjs                          Cookie + native bearer session transport
├── policy.mjs / domain.ts              Same relationship and command authority
├── support.mjs                         Transactional cash and case-message rules
├── schema.sql                          Shared SQLite state, sessions and constraints
└── http.test.mjs                       Actual HTTP/SQLite regression tests
```

Routes use `/needs?id=<need-id>` for linked capture, matching the actual need-screen contract. Worker maps and plans contain only assigned tasks. Provider projection contains no household tasks or visit coordinates. A provider's network view describes listed catchments; missing current capacity is explicitly unavailable to that account rather than fabricated from fixture values.

## One database and two session transports

The website keeps its HttpOnly cookie transport. The mobile app posts a fixed fictional `actorId` to `/api/mobile/session`, receives a bearer credential, then sends `Authorization: Bearer …` to the existing `/api/state` and `/api/commands` endpoints. Both resolve server-owned account membership from the same hashed session table and apply the same policy, version guard, idempotency record and SQLite transaction. Native logout uses `/api/mobile/session/logout`.

The bearer header takes precedence over cookies. An invalid/expired explicitly supplied bearer cannot fall back to a valid browser cookie. Native session creation returns its credential with private/no-store headers; the server stores a hash rather than the returned raw token. Sessions expire after 12 real-clock hours. Open fixed demo account selection is not verified staff identity, production provisioning, password/OTP login or beneficiary authentication.

Native credentials use `expo-secure-store`; the browser preview holds its separate credential only in memory. The application does not write case records or bearer credentials to browser localStorage. Role data is held in memory and refreshed from the backend; sign-out/account change clears the old projection. Native account login restored after force-stop/relaunch on the authorized TECNO phone. This exercises ordinary SecureStore restoration, not corruption/reinstall/biometric-lockout/keystore-failure conditions.

The transport validates the server origin before sending a credential, rejects embedded credentials/paths/query/hash, requires HTTPS for public servers and allows HTTP only for specified local-testing hosts. Requests omit browser cookies, use no-store and time out after 15 seconds. Errors do not claim a confirmed save. Commands carry `expectedVersion` and an operation UUID; there is no offline command queue or automatic offline replay. After an uncertain network result, refresh the server state before manually repeating an action.

The backend remains authoritative for catchment, permission, appointment methods, request transitions, money/capacity holds and withdrawal. A client role tab or dropdown grants no additional authority. Neither mobile source nor public previews package the SQLite database, session records, clinical data or secrets.

## Route maps

Default `extra.nativeMapsEnabled` is **false** in both app configuration sources. Android and browser preview therefore use the interactive SVG route: numbered selection, zoom in/out, reset and a complete ordered-stop list. Route-version changes reset obsolete map selection. Map points require the existing `SYNTHETIC_CONFIRMED` flag and finite bounded coordinates. Missing positions remain in the list; they are not guessed.

Lines represent visit sequence, not a computed road route. Start/finish and visit points are fictional fixture positions. There is no location permission, live GPS, traffic measurement, geocoding or invented NGO office pin. Route time still uses the saved server speed/distance/break/buffer assumptions and exposes their limits.

The optional native implementation uses `react-native-maps` `1.27.2`. A packaged Android Google Map requires the Maps SDK and an appropriately restricted key/plugin configuration. Enable it only after configuring that build and verifying an installed binary; setting the boolean alone is insufficient. This requirement and Expo Go support were checked against [Expo SDK 57 maps documentation](https://docs.expo.dev/versions/v57.0.0/sdk/map-view/) on 9 October 2026. Native Google Maps rendering is unverified and is not needed for the default schematic.

## Local run and browser preview

Start the companion website/backend from `asha-saath-lovable/`:

```powershell
npm run dev:local
```

It serves [the website on 5173](http://127.0.0.1:5173) and the API on 4318, using the existing persistent database. From `asha-saath-mobile/`, restore/install the lockfile dependencies when needed, then run:

```powershell
npm ci
npm run typecheck
npm run lint
npm test
npm run export:web
npm run preview
```

The exported [mobile browser preview on 5186](http://127.0.0.1:5186) proxies `/api/` to the same local API. It is a browser review of React Native Web screens, not an Android-device test. It must be re-exported after source changes. `npm start` runs Expo development tooling; [Expo's start-development guide](https://docs.expo.dev/get-started/start-developing/) describes device/Expo Go setup. Expo Go QR/LAN operation was not used for the verified phone run; the bundled APK was installed over ADB/USB as recorded below.

The native development default API origin is `http://10.0.2.2:5186`, intended for an Android emulator reaching the laptop mobile API proxy; that proxy forwards to the loopback API on 4318. A physical Wi-Fi phone needs a reachable configured LAN/public origin. For the authorized USB demo, `adb reverse tcp:5186 tcp:5186` and `adb reverse tcp:5173 tcp:5173` allow the phone's configured `http://127.0.0.1:5186` API and `http://127.0.0.1:5173` website to reach laptop ports. `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_WEBSITE_URL` are build-time public configuration. The account panel accepts a new API origin and signs out before changing it; the companion website URL requires matching build-time configuration. No remote hosting endpoint currently exists.

The preview script binds loopback by default. Its explicit `--lan` option is available for a deliberate local-network test, but LAN/firewall/phone reachability has not been checked. The USB route retains loopback binding and depends on the active ADB reverse rules. Public deployment still requires the chosen Render/Railway origin and persistent backend arrangement; the phone app does not replace that server. The [mobile README](../asha-saath-mobile/README.md) has explicit emulator, Expo Go LAN and USB build/run steps.

## Native build preparation and remaining release work

Native directories follow [Expo Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/): configuration/plugins are the source of native settings. Do not manually maintain generated `android/`/`ios/` folders. The actual config disables Android backup and has no requested location permission. Public profiles disable cleartext HTTP; `ASHA_ALLOW_LOCAL_HTTP=1` is an explicit local-test build option.

The existing `eas.json` defines:

| Profile | Prepared output / network scope |
|---|---|
| `preview` | Internal Android APK; public API uses HTTPS and explicit `ASHA_ALLOW_LOCAL_HTTP=0`. |
| `local-demo` | Internal Android APK with local HTTP build opt-in. Intended only for fictional LAN/emulator tests. |
| `production` | Android App Bundle with explicit `ASHA_ALLOW_LOCAL_HTTP=0`; actual identity/data/hosting review remains required. |

After authenticating/configuring the intended Expo project, a future internal build uses `npx eas-cli@latest build -p android --profile preview`; a deliberate local demo uses `--profile local-demo`. These are prepared commands, not completed builds. [Expo's APK documentation](https://docs.expo.dev/build-reference/apk/) confirms the configured output/profile approach, checked 9 October 2026.

The earlier no-SDK limitation is superseded: an existing SDK was copied under workspace `.tooling/android-sdk/`, and an authorized TECNO Android 16 arm64 device is connected. Android CNG completed; the local build path uses `EXPO_PUBLIC_API_URL=http://127.0.0.1:5186`, `EXPO_PUBLIC_WEBSITE_URL=http://127.0.0.1:5173`, `ASHA_ALLOW_LOCAL_HTTP=1`, then `expo prebuild --platform android --no-install` and Gradle `assembleRelease -PreactNativeArchitectures=arm64-v8a`. This release variant bundles JavaScript/assets but uses the generated project's test/debug signing identity. It is an internal fictional demonstration binary, not a production-signed release.

The Windows native build uses verified same-drive junctions `C:\tmp\asha-saath-build` → workspace mobile source and `C:\tmp\asha-saath-sdk` → workspace SDK copy. The retry ran Gradle from `C:\tmp\asha-saath-build\android` with `ANDROID_HOME=C:\tmp\asha-saath-sdk`, preserving one actual source/SDK target. The initial Reanimated C++ build failed with SDK-bundled Ninja **1.10.2** on long object paths. The workspace SDK `cmake/3.22.1/bin/ninja.exe` was replaced with official **Ninja 1.13.2**, retaining `ninja-1.10.2.backup.exe`; the [official release ZIP](https://github.com/ninja-build/ninja/releases/tag/v1.13.2) SHA256 was verified as `07fc8261b42b20e71d1720b39068c2e14ffcee6396b76fb7a795fb460b78dc65`. The [Reanimated Windows guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/building-on-windows/) supports using a current Ninja/short paths for this error class. No New Architecture/dependency downgrade was used. The recovered Gradle build **succeeded in 7 minutes 21 seconds, 567 tasks**.

The verified [USB-demo APK](../output/asha-saath-android-usb-demo.apk) is **46,519,003 bytes**, SHA256 `05889b922a6b092de0af5b80a716f105cb3beab5af0e40619bcc06ea5d260922`. Artifact verification passed for package `org.ashasaath.demo`, version `1.0.0` / code `1`, minimum API `24`, target API `36`, `arm64-v8a`, bundled Hermes/assets, test signing certificate and local cleartext networking. Actual manifest inspection found network-state/normal foreground-service/wake-lock/boot and SecureStore biometric declarations, with **no GPS/location or storage permissions**. This is not an internet-only manifest claim; runtime prompts remain a separate device check.

`adb install -r` returned **Success**, and `org.ashasaath.demo` launched on the authorized TECNO CL7k Android 16 arm64 phone. The exact native checks below are distinct from artifact verification. USB API operation requires the laptop backend/proxy and reverse routes; the app has no embedded server. EAS project login is an alternative cloud-build requirement rather than a prerequisite for the local SDK path. No app-store publication is authorized here; Android-first is the target, with iPhone distribution/runtime outside this scope.

## Validation checkpoint

| Check | Actual evidence / limitation |
|---|---|
| Mobile TypeScript | Parent-reported full pass, including linked-need parameter and capacity-expiry fixes. |
| Mobile lint | Parent-reported whole-app pass. |
| Transport tests | Fresh `npm test`: **4/4 passed**, covering origin rejection before credential transmission, bearer/no-cookie/server denial and unconfirmed network failure. This supersedes the earlier three-test run. |
| Android/web JavaScript exports | Parent-reported passes. These are bundle/browser outputs, not installed-device evidence. |
| Expo Doctor | Parent-reported **21/21 passed**. |
| Android CNG | Completed native project generation. |
| Gradle release APK | **Build succeeded: 7m21s, 567 tasks** after the verified Ninja 1.13.2/short-path tooling recovery. |
| APK artifact verification | Passed identity/version/API/ABI/Hermes/test-certificate/network-policy inspection; artifact **46,519,003 bytes**, SHA256 recorded above. |
| USB installation / native launch | **ADB Success** and `org.ashasaath.demo` launched on TECNO CL7k, Android 16, arm64; physical display 1080×2436, density override 432. |
| Native session restoration | Account login restored after force-stop/relaunch. Ordinary restoration, not injected SecureStore/keystore failure testing. |
| Native visit/need/cash/message | Isolated TASK-005 completed → NEED-006 / REQ-006 preferences → exact linked cash selection → fresh Outreach A permission → FUND-007 ₹500 REQUESTED → fictional message saved/composer cleared. |
| Native route/budget | Stop 4 select/zoom/full-route reset passed; NGO A scoped budget loaded ₹24,500 available / ₹0 held / ₹500 used in stated isolated test state. |
| Native read-only persistence/isolation | [Device review PASS](../output/verification/mobile-device-2026-10-09/native-device-review.json), checked **02:32:56 UTC**; **8/8** exact visit/need/funding/grant/message persistence and working-database marker-isolation checks. |
| Backend HTTP/SQLite | Current root verification reported **19/19 passed**, including native sessions while retaining website cookie operation. |
| Independent native-bearer audit | [9/9 passed](../output/verification/mobile-app-2026-10-09/independent-http-audit.json), checked 9 October at 06:22:24 IST against disposable in-memory SQLite. Real working data was not changed. |
| Browser screens | Isolated port **5187** review: rural plan/two recorded visits; Hamlet C request stayed unresolved with no covered NGO; Village B **FUND-003 ₹500** approval/reservation → payment report → independent receipt → coordinator closure; closure retained after reload/reselection; saved messages/read status reviewed. Browser evidence, not installed-device execution. |

The independent audit exercised separate cash permission, own-NGO reservation, scoped exactly-once message replay/read receipts, payment/receipt dispute separation, confirmation/closure, withdrawal/reconciliation and worker assignment. It explicitly does not test Android hardware or SecureStore. Earlier website tests/screens retain their own dated scope; do not add their counts to mobile checks or call them mobile field trials.

The stated browser journey used an isolated synthetic database, preserving the live working website data. Screens are recorded under `output/verification/mobile-app-2026-10-09/`; examples include [uncovered NGO area](../output/verification/mobile-app-2026-10-09/no-ngo-coverage-390.png), [closed cash support after re-login](../output/verification/mobile-app-2026-10-09/funding-closed-relogin-390.png), [case messages](../output/verification/mobile-app-2026-10-09/messages-390.png), [route map](../output/verification/mobile-app-2026-10-09/map-390.png) and [Hindi worker](../output/verification/mobile-app-2026-10-09/worker-final-hindi-320.png). Exact geometry/font-scale and all native checks require their own recorded results; screenshots do not imply GPS or a live road map.

## Installed-device checkpoint

The phone's native English and final Hindi first Record actions were at **(89,1757)–(991,1892)**, above the bottom tab bar top **2252** on a 1080×2436 display with density override 432. Labels fit within the 1080-pixel screen width. This is one physical phone's layout evidence, not an all-device, all-page 200% or screen-reader audit.

The native UI changed the API origin to isolated proxy **5187**. It recorded TASK-005 completed with note `Native phone visit test - fictional`, created NEED-006 / REQ-006, saved preferences and opened cash support with that exact linked request selected. Outreach A fresh permission kept Send disabled until checked; the server saved FUND-007 ₹500 REQUESTED. Fictional message MSG-008 then saved for that case and the composer cleared. Native map stop 4 selection, zoom and full-route reset were inspected; native back returned to visits, and NGO A's own budget loaded the stated available/held/used totals. The phone was then restored to **http://127.0.0.1:5186 / rural ASHA** and successfully force-stopped/relaunched with that shared-backend account restored. It was left on the Hindi Today screen.

A read-only database check confirmed the native marker exists only in the isolated database, preserving the working website database. The complete NGO payment → independent receipt → coordinator closure journey passed through browser/HTTP; it was **not repeated end to end on the physical phone**. No clinical outcome, money transfer, real NGO contact, GPS/Google map or production identity was exercised.

The [native-device report](../output/verification/mobile-device-2026-10-09/native-device-review.json) records **PASS** for the stated synthetic smoke review and **8/8 read-only persistence/isolation checks**, dated 9 October at 02:32:56 UTC. Native visit, exact linked need/funding, named recipient grant and message persisted; native visit/funding/message markers were absent from the working database. No private session token or keystore was extracted. The report's limits are part of the result; this is not the complete native acceptance catalogue or a field trial.

Device evidence: [English worker](../output/verification/mobile-device-2026-10-09/native-worker-english.png), [final Hindi worker](../output/verification/mobile-device-2026-10-09/native-worker-hindi-final.png), [full route sketch](../output/verification/mobile-device-2026-10-09/native-map-full.png), [cash request saved](../output/verification/mobile-device-2026-10-09/native-funding-requested.png), [case message saved](../output/verification/mobile-device-2026-10-09/native-message-saved.png), [own NGO budget](../output/verification/mobile-device-2026-10-09/native-ngo-budget.png). Force-stop/relaunch confirmed ordinary native credential restoration; storage corruption, app reinstall, biometric lockout and keystore failure remain untested.

## Dependency advisory checkpoint

The current npm audit reports **29 advisories: 10 moderate and 19 high**. Initial inspection reviewed four advisory origins and queried published package versions; no compatible `braces`/`node-forge` patch within the current Expo dependency chain was established. This remains a dependency/release review item, not a claim of a reproduced case-data exploit or a production security pass. Do not apply `npm audit fix --force` when its proposed remediation downgrades Expo to SDK 44; preserve the SDK 57-compatible graph and review targeted updates against current upstream releases. Audit totals are dated local registry/lockfile evidence, not a permanent property of the app.

Exact remaining scope at this checkpoint: finalize evidence/packaging; expand physical-phone payment/receipt/closure, background/keyboard/back-navigation/all-page 200%/screen-reader and storage/network-failure checks where required; human Hindi review; dependency advisory remediation/release assessment; actual provider/clinical-rule/account arrangements; public hosting/restart persistence and production signing. Offline saving/synchronization, real payment transfer/custody, SMS/WhatsApp/email, live government/NGO APIs and production authentication remain absent.
