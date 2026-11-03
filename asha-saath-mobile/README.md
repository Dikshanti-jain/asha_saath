# ASHA Saath mobile — Android first

ASHA Saath has a separate Expo/React Native mobile client alongside the existing [TanStack website](../asha-saath-lovable/README.md). The mobile app uses native React Native views, Expo Router and the same Node/SQLite backend. A record saved by an authorized mobile account is visible to the appropriate website account after refresh; there is no second mobile database or separate set of cases.

This is an independent, government-style prototype with original branding. All people, tasks, NGOs, locations and money are fictional. It is not an official government app.

## What the app provides

- **ASHA:** saved visit plan, route order, visit outcomes, completed-visit document-help capture, named-NGO permission, cash-assistance requests, independent recipient confirmation and case messages.
- **Coordinator:** planning and unserved-task explanations, local NGO selection, request tracking, confirmation, dispute resolution, cancellation, closure and restricted funding reconciliation. CSV import remains in the companion website.
- **NGO:** currently authorized case projections, service availability, acceptance/decline, agreed help arrangements, delivery reports, own cash budget, approval/reservation and external-payment reports.
- **Shared:** Hindi/English interface, role account selection, server refresh/failure feedback, request histories and persisted unread/read status.

The default catalogue contains **24 fictional visit tasks, 23 distinct person references, two ASHA accounts and three fictional document-navigation service offers**. Several tasks may concern the same person. Cash assistance is a separate service-access extension with fresh recipient-specific permission.

The route map uses confirmed synthetic fixture points and a selectable numbered route/list. The default map is an illustrative SVG sketch; it has no real road directions, GPS, geocoding or inferred NGO office pins. The optional native map adapter is disabled by `extra.nativeMapsEnabled: false` pending its own configuration/device verification.

## Runtime and ports

Use Node 24 for the shared SQLite backend. The current mobile source uses Expo SDK 57, React Native 0.86 and React 19.2.3; preserve `package-lock.json` and install compatible packages with `npx expo install`. Version reference checked **9 October 2026**: [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/).

| Surface | Local address | Purpose |
|---|---|---|
| Companion website | `http://127.0.0.1:5173` | Existing web portal, including CSV import |
| Shared backend | `http://127.0.0.1:4318` | Persistent scoped API and SQLite |
| Mobile browser preview / API proxy | `http://127.0.0.1:5186` | Exported mobile UI and proxy to backend 4318 |
| Android emulator → proxy | `http://10.0.2.2:5186` | Emulator access to the computer’s local proxy |
| Physical Android → proxy | `http://YOUR_COMPUTER_LAN_IP:5186` | Phone access on the same trusted Wi-Fi |

`scripts/preview.mjs` serves the mobile web export and forwards `/api/*` to the loopback backend. Its default API target is `http://127.0.0.1:4318`. The backend stays on loopback while this optional proxy provides the LAN entry point. Environment overrides are `ASHA_API_TARGET` and `ASHA_MOBILE_PORT`.

## Start the website and shared backend

From the companion application directory, in one terminal:

```powershell
Set-Location C:\Users\GANPATI\OneDrive\Desktop\problem\asha-saath-lovable
npm ci
npm run dev:local
```

If the website/backend already runs, reuse it. Do not start another process on the same ports or reset its working database. Visit `http://127.0.0.1:4318/api/health` to check the API. The default persistent database belongs to the companion app at `backend/data/asha-saath.sqlite`.

## Install and open the mobile browser preview

In another terminal:

```powershell
Set-Location C:\Users\GANPATI\OneDrive\Desktop\problem\asha-saath-mobile
npm ci
Copy-Item -LiteralPath .env.example -Destination .env
npm run export:web
npm run preview
```

Copy `.env.example` only when creating your local configuration; preserve an existing `.env`. Open `http://127.0.0.1:5186`. On web, API requests use the preview’s same origin, so the native `EXPO_PUBLIC_API_URL` value does not redirect this browser preview to `10.0.2.2`.

Choose a fictional account. The mobile browser preview uses a separate bearer session held in page memory; refreshing the whole page requires selecting an account again. Records remain in SQLite. This is separate from the website’s cookie session, so both clients can stay open with different demo accounts.

## Run on an Android emulator

An emulator requires a configured Android SDK/emulator on your own machine. Keep the website/backend and mobile API proxy running, and put these public settings in `.env`:

```dotenv
EXPO_PUBLIC_API_URL=http://10.0.2.2:5186
EXPO_PUBLIC_WEBSITE_URL=http://10.0.2.2:5173
ASHA_ALLOW_LOCAL_HTTP=1
```

Then launch Metro:

```powershell
npx expo start --android
```

Alternatively, `npx expo start` opens the Expo development server; press `A` to open an available Android emulator. Use Expo Go compatible with SDK 57 or an appropriately configured native development build. The computer’s `127.0.0.1` is not the emulator’s host address. See [Expo development/device instructions](https://docs.expo.dev/get-started/start-developing/).

`npm run android` now runs `expo run:android`, which builds/installs a native app using a configured local SDK; it is different from opening an existing Expo Go with `expo start --android`.

## Run on a physical Android phone with Expo Go

The phone and computer need a network route to each other, usually the same trusted Wi-Fi. Replace the example IP below with the computer’s actual IPv4 LAN address. Do not use `127.0.0.1`, `localhost` or `10.0.2.2` for a physical phone.

1. Keep the companion website/backend running.
2. Stop an existing loopback mobile proxy, then start its LAN mode:

   ```powershell
   node scripts/preview.mjs --lan
   ```

3. Set `.env`:

   ```dotenv
   EXPO_PUBLIC_API_URL=http://192.168.1.20:5186
   EXPO_PUBLIC_WEBSITE_URL=http://192.168.1.20:5173
   ASHA_ALLOW_LOCAL_HTTP=1
   ```

4. Start the Expo server on LAN:

   ```powershell
   npx expo start --lan
   ```

5. Open a compatible Expo Go on Android and scan the displayed QR code. Select an account and test a refresh before saving.

Changing `EXPO_PUBLIC_*` values requires restarting/reloading Metro or rebuilding the export/native bundle. The **More → server address** control can also change the API origin; switching server ends the current mobile session before choosing a new account.

The website link additionally requires port 5173 to be reachable from the phone and the website development server to listen on the LAN. Setting `EXPO_PUBLIC_WEBSITE_URL` alone does not expose a loopback-only website. Keep access restricted to the local demonstration network. The mobile proxy’s LAN flag does not configure Windows Firewall automatically.

A Metro tunnel only tunnels the development bundle; it does not make the private backend/proxy reachable. If the venue isolates Wi-Fi clients, use a configured emulator or the separately deployed HTTPS backend.

## USB-connected Android: local bundled APK demonstration

The user authorized installation/testing on their USB-connected phone. The bundled APK **built, installed successfully and launched** as `org.ashasaath.demo` on the physical **TECNO CL7k, Android 16, arm64**. Native login restoration, visit/help capture, permission-gated cash request, case message, schematic map controls and NGO budget loading were exercised. A workspace SDK copy is available under `../.tooling/android-sdk/`. The exact native checks and their limits are recorded below; the completed phone checks do not imply production readiness.

For this USB demo, keep the companion backend and mobile proxy running on the laptop. The installed app connects to the laptop through Android reverse port forwarding. In this mode, the phone’s `127.0.0.1` intentionally reaches forwarded laptop ports:

```powershell
# Run from asha-saath-mobile; this path uses the discovered workspace SDK copy.
$ashaAdb = (Resolve-Path -LiteralPath ..\.tooling\android-sdk\platform-tools\adb.exe).Path
& $ashaAdb devices -l
& $ashaAdb reverse tcp:5186 tcp:5186
& $ashaAdb reverse tcp:5173 tcp:5173
& $ashaAdb reverse --list
```

If more than one device is connected, add `-s YOUR_DEVICE_SERIAL` before each `reverse`, `install` and device-specific command. Do not include the phone’s serial in public screenshots or packages. USB debugging must be enabled and this computer authorized on the phone. [Android’s ADB documentation](https://developer.android.com/tools/adb) describes device authorization and installation.

Build-time settings for a bundled USB demonstration:

```powershell
$env:EXPO_PUBLIC_API_URL = 'http://127.0.0.1:5186'
$env:EXPO_PUBLIC_WEBSITE_URL = 'http://127.0.0.1:5173'
$env:ASHA_ALLOW_LOCAL_HTTP = '1'
$env:ANDROID_HOME = 'C:\tmp\asha-saath-sdk'

# A compatible JDK must already be configured in JAVA_HOME/PATH.
npx expo prebuild --platform android --no-install
Push-Location C:\tmp\asha-saath-build\android
.\gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a
Pop-Location
```

Use the actual device ABI; this authorized phone reports arm64. CNG generates native files from config/plugins. Preserve app configuration as the source of truth, and do not manually maintain the generated native project. The `assembleRelease` variant bundles JavaScript/assets, so it can start without Metro. This local generated project currently uses **test/debug signing**, not a production signing identity. Do not publish that test-signed APK to Google Play.

This Windows build uses two existing, verified **same-drive directory junctions**: `C:\tmp\asha-saath-build` resolves to this mobile source and `C:\tmp\asha-saath-sdk` resolves to the workspace SDK copy. They shorten native build paths; they are not a second source checkout. Before reusing these commands on another machine, verify the junction targets or use your own equivalent short paths. Do not point them at another project or remove their real source/SDK targets.

The initial native build failed in the old SDK-bundled **Ninja 1.10.2** on long C++ object paths. The recovery replaced only the workspace SDK's `cmake/3.22.1/bin/ninja.exe` with **Ninja 1.13.2**, keeping `ninja-1.10.2.backup.exe`. The official Windows release ZIP was downloaded from [Ninja v1.13.2](https://github.com/ninja-build/ninja/releases/tag/v1.13.2) and its verified SHA256 is:

```text
07fc8261b42b20e71d1720b39068c2e14ffcee6396b76fb7a795fb460b78dc65
```

The [official Reanimated Windows build guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/building-on-windows/) recommends a newer Ninja and short project paths for this class of error. New Architecture and SDK-compatible dependencies remain enabled. The recovered Gradle build **succeeded in 7 minutes 21 seconds across 567 tasks**. The tooling ZIP/SDK copy is not bundled into application source packages.

The built [USB-demo APK](../output/asha-saath-android-usb-demo.apk) is **46,519,003 bytes**. Artifact verification passed: package `org.ashasaath.demo`, version `1.0.0` / code `1`, minimum Android API `24`, target API `36`, `arm64-v8a`, bundled Hermes JavaScript/assets, test signing certificate, and explicit local cleartext networking. SHA256:

```text
05889b922a6b092de0af5b80a716f105cb3beab5af0e40619bcc06ea5d260922
```

The generated APK manifest includes network state and normal foreground-service/wake-lock/boot declarations plus SecureStore biometric declarations; it has **no GPS/location or storage permission**. Do not describe this binary as internet-only. Artifact verification and the native checks below are separate evidence; not every OS permission/storage failure condition has been tested.

After a successful build, the expected APK is `android/app/build/outputs/apk/release/app-release.apk`. Installation is a separate step:

```powershell
& $ashaAdb install -r android\app\build\outputs\apk\release\app-release.apk
```

For a new device/build, open ASHA Saath, select a fictional account, confirm API refresh, then exercise visit/need/funding/message flows and relaunch/session restoration. Hindi, hardware back, keyboard, background/foreground and failure states need explicit checks; the results below apply to the stated phone/build only.

**The USB demo depends on the laptop backend, proxy and active ADB reverse routes.** The bundled app does not contain a server/database. Reconnect/reapply reverse routes after a phone reconnect/reboot as needed. To use the app without USB, choose a reachable LAN or reviewed HTTPS server in **More → server address**; this clears the old session before selecting another account. The companion website address is build-time configuration, so a USB build’s website button still needs port 5173 reversed or a rebuild with the intended website URL. Changes in JavaScript environment values require a new bundle/build; Android HTTP policy changes require regenerating/rebuilding the native binary.

## Prepare an installable APK

`eas.json` includes these build profiles:

| Profile | Android output | Network intent |
|---|---|---|
| `preview` | Internal-distribution APK | Hosted HTTPS API/website; explicit `ASHA_ALLOW_LOCAL_HTTP=0` |
| `local-demo` | Internal-distribution APK | Explicit local HTTP exception via `ASHA_ALLOW_LOCAL_HTTP=1` |
| `production` | Android App Bundle | Future reviewed HTTPS release; explicit `ASHA_ALLOW_LOCAL_HTTP=0` |

Before a hosted preview build, configure `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_WEBSITE_URL` with the actual reachable HTTPS origin in the selected EAS profile’s `env` or its EAS environment. Both can point at the shared deployed website gateway. For example, preserve the profile’s existing APK settings and add:

```json
"env": {
  "EXPO_PUBLIC_API_URL": "https://YOUR_DEPLOYED_HOST",
  "EXPO_PUBLIC_WEBSITE_URL": "https://YOUR_DEPLOYED_HOST",
  "ASHA_ALLOW_LOCAL_HTTP": "0"
}
```

These values are public configuration compiled into the client, not credentials. Do not add service keys, bearer tokens or records to `.env` or EAS profile values.

With your own Expo account and linked EAS project:

```powershell
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

For an internal LAN-only APK, choose `--profile local-demo` and configure its public URLs to the actual phone-reachable LAN host. `app.config.ts` enables Android cleartext traffic only for that explicit local-demo flag. Do not distribute a build containing a private LAN address as the public production app.

EAS signs/builds an APK separately from Metro’s JavaScript export. An `android-bundle/` export is **not an APK** and cannot be installed by tapping it. An AAB is intended for store distribution rather than direct device installation. See [official Expo APK configuration](https://docs.expo.dev/build-reference/apk/).

The earlier no-SDK checkpoint is superseded: the local test-signed bundled APK passed build/artifact checks and was installed/launched on the authorized phone. The native checks below passed; full payment/receipt/closure was exercised through browser/HTTP rather than repeated on hardware. EAS account/project linkage is required only for the cloud-build path; local Gradle used the configured SDK/JDK. Production signing, reviewed HTTPS hosting and release verification remain required. iPhone support/store publication was not requested or verified.

## Session, permissions and data boundaries

- Mobile sign-in selects one fixed fictional actor and receives a server-issued bearer credential. This is open demo account selection, not verified staff identity, password/OTP login or provider onboarding.
- Android SecureStore stores the session credential, API origin and expiry only. Visit tasks, clinical details, funding cases and message bodies are not stored there. Web uses memory rather than browser storage for the credential.
- Every command sends the current server version and an idempotency key. The backend authorizes the role, assignment, current recipient grant and transition before saving within its database transaction.
- Provider screens use only sanitized server projections. They do not construct a provider view from unrestricted staff data.
- NGO acceptance/reservation and budget decisions require the online backend. There is no offline save queue, downloaded case cache or background sync claim.
- Permission withdrawal ends current provider details, messages and actions. Person confirmation is distinct from the NGO’s delivery/payment report; coordinator closure requires the appropriate confirmation.
- Cash approval reserves a fictional declared budget. No transfer, wallet, donation custody, live funding gateway, bank/UPI collection or real NGO outreach is connected.

The existing [funding/message contract](../docs/FUNDING_AND_COMMUNICATION.md), [role permissions](../docs/ROLE_PERMISSIONS.md), [state machines](../docs/STATE_MACHINES.md) and [privacy constraints](../docs/SECURITY_PRIVACY.md) remain authoritative.

## Checks and source maintenance

Run from this directory:

```powershell
npm run typecheck
npm run lint
npm test
npx expo install --check
npm run export:web
npm run export:android
```

Run the real HTTP/SQLite regression suite from the companion application:

```powershell
Set-Location ..\asha-saath-lovable
npm run test:backend
```

Current recorded checks: **TypeScript passed, whole-app lint passed, transport tests 4/4, Expo Doctor 21/21, web export and Android JavaScript export passed, Android CNG completed, Gradle release APK build/artifact verification passed, ADB install succeeded and native launch passed**. Subsequent source changes require their appropriate reruns. Consult the workspace handoff/review for exact full-suite/export/browser/device results and their limits.

The isolated **React Native Web browser review on port 5187** exercised a rural plan and two recorded visits. A Hamlet C need remained unresolved because no listed NGO catchment served it. A Village B need produced **FUND-003, ₹500**: named permission → NGO approval and reservation → fictional payment report → independent person receipt → coordinator closure. Closure remained after page reload/account re-selection, and saved case messages/read status were reviewed. This disposable review did not reset the working website database. Screenshots are in `../output/verification/mobile-app-2026-10-09/`. These results establish the stated browser journey, not a physical Android device or live partner/payment trial.

Physical-device checks on the installed APK used a **1080×2436** TECNO CL7k display with density override **432**:

- SecureStore-backed account login restored after force-stop and relaunch. This checks ordinary restoration; it does not simulate OS storage corruption, reinstall, biometric lockout or keystore failure.
- English and final Hindi worker screens' first Record buttons had bounds **(89,1757)–(991,1892)** above the bottom tab bar beginning at **2252**. Labels fit within the 1080-pixel screen width. This is one-phone evidence, not an all-page 200% or screen-reader audit.
- Through the app UI, switched the API to isolated proxy **5187**. Recorded fictional **TASK-005 → COMPLETED** with note `Native phone visit test - fictional`, created **NEED-006 / REQ-006** and saved preferences.
- Opened cash assistance from that need and verified it selected **REQ-006** exactly. Named **Outreach A**, reviewed fresh permission, verified Send remained disabled until consent, then saved **FUND-007 ₹500, REQUESTED**.
- Sent fictional native message **MSG-008** for FUND-007; the saved message appeared and the composer cleared.
- Selected native map stop 4, zoomed in and reset to the full route. These are schematic map controls, not native Google Maps/GPS validation.
- Switched to NGO A and loaded its scoped budget: **₹24,500 available / ₹0 held / ₹500 used** in the stated isolated test state.

A read-only database check confirmed the native visit marker existed only in the isolated test database and did not enter the working website database. NGO payment/independent receipt/coordinator closure remains browser/HTTP evidence; that whole journey was **not repeated on the physical phone**. The phone was restored to the normal **http://127.0.0.1:5186 API / rural ASHA**, force-stopped/relaunched successfully with that account restored, and left on the Hindi Today screen. The working website data remained unchanged.

The [native device review](../output/verification/mobile-device-2026-10-09/native-device-review.json), checked **9 October 2026 at 02:32:56 UTC**, records **PASS** for the stated smoke review and **8/8 read-only persistence/isolation checks**. It confirms exact visit→need→funding→recipient-grant/message links and absence of native test markers from the working database. This is not a field trial or the complete native acceptance catalogue; no private token or keystore was extracted.

Device captures: [English worker](../output/verification/mobile-device-2026-10-09/native-worker-english.png), [final Hindi worker](../output/verification/mobile-device-2026-10-09/native-worker-hindi-final.png), [full schematic route](../output/verification/mobile-device-2026-10-09/native-map-full.png), [requested cash support](../output/verification/mobile-device-2026-10-09/native-funding-requested.png), [saved message](../output/verification/mobile-device-2026-10-09/native-message-saved.png) and [NGO budget](../output/verification/mobile-device-2026-10-09/native-ngo-budget.png). They contain fictional case data. Public hosting, production signing/identity, human Hindi review, all-page 200%/screen-reader and full device failure review, offline sync, real NGO/payment integrations and live household use remain future work.

The current npm audit reports **29 advisories: 10 moderate and 19 high**. Initial review examined four advisory origins and checked published versions; no compatible `braces`/`node-forge` patch within the existing Expo chain was established at this checkpoint. This is an unresolved dependency/release review item, not a demonstrated case-data exploit or a completed security clearance. Do not run `npm audit fix --force` if its proposed remediation downgrades the SDK to Expo 44; preserve SDK 57 compatibility and review targeted upstream-compatible updates. The counts are dated local audit results and may change with the registry/lockfile.

`npm run sync:catalog` recreates the synthetic mobile catalogue from the companion fixture source. Preserve immutable task identity `(source_dataset_id, source_task_id)` and server-approved planning priorities. Syncing a catalogue does not reset the live SQLite database or add real NGO integrations.

| Source location | Responsibility |
|---|---|
| `src/app/` | Expo Router routes and native navigation |
| `src/components/` | Government-style native components, account/shell and map adapters |
| `src/screens/` | Visits, needs, funding, messages, maps and NGO network |
| `src/lib/MobileContext.tsx` | Shared server state, command lifecycle and account boundaries |
| `src/lib/api.ts` | HTTP adapter, origin validation and command envelopes |
| `src/lib/session-vault.ts` | Native credential storage / web memory session |
| `src/lib/catalog.json` | Versioned fictional reference catalogue |
| `scripts/preview.mjs` | Local exported mobile preview and loopback API proxy |
| `app.config.ts`, `eas.json` | Native network/build profiles |

Do not package dependencies, runtime SQLite/WAL/session files, `.env`, signing credentials or generated device secrets. Native `android/` and `ios/` folders are generated through Expo; change configuration/plugins rather than hand-editing generated projects.

## Troubleshooting

- **Cannot reach server:** check API health, then the phone’s LAN/emulator address and port 5186. A save is not confirmed until the server responds successfully.
- **Website opens but mobile has no records:** select the intended mobile account and refresh. Role scope differs, and the mobile session is independent of the website session.
- **Whole-page reload signs web preview out:** expected; its bearer credential is memory-only. Select the account again; persisted case records remain.
- **Save reports stale version:** refresh/review the current case before retrying. Another client may have changed it; do not replay a stale approval automatically.
- **Android rejects local HTTP:** use the explicit internal `local-demo` build configuration or a hosted HTTPS server. Metro and a previously signed APK do not share native configuration changes automatically.
- **No NGO option for a need:** exact service catchment, capacity freshness, service expiry, prior attempts and contact preferences matter. An office in the locality does not imply service coverage; keep the need open for coordinator follow-up.

Real use still needs reviewed HTTPS hosting/data arrangements, verified identity, real partner agreements, clinically approved rules, device/accessibility testing and field validation. No real household impact, government integration or national NGO coverage has been demonstrated.
