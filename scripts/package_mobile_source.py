"""Package the separate mobile source without credentials or generated outputs.

Source bytes are captured once; the ZIP inventory describes that exact snapshot.
CRC, per-file hashes and an unchanged-current-source check verify integrity only,
not Android execution, APK signing, device behaviour or application tests.
Use --dry-run to inspect the safe inventory without writing any package files.
"""
import argparse
from datetime import datetime, timezone
from fnmatch import fnmatch
from hashlib import sha256
from pathlib import Path
import json
import os
import re
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "asha-saath-mobile"
OUTPUT = ROOT / "output"
ARCHIVE = OUTPUT / "asha-saath-mobile-source.zip"
CHECKSUM = OUTPUT / "asha-saath-mobile-source.zip.sha256"
REPORT = OUTPUT / "mobile-source-packaging.json"
SKIP_DIRS = {
    "node_modules", ".expo", ".git", ".claude", "dist", "dist-ssr",
    "android-bundle", "android", "ios", ".cache", ".npm-cache", ".yarn",
    "coverage", "build", "builds", "logs", "tmp", "temp", "test-results",
    "playwright-report", ".output", ".gradle", ".idea", "__pycache__",
}
PRIVATE_NAMES = {
    ".npmrc", ".pypirc", ".netrc", ".git-credentials", ".ds_store",
    "audit-current.json", "google-services.json", "googleservice-info.plist",
}
PRIVATE_PATTERNS = (
    "*.sqlite*", "*.db", "*.db-wal", "*.db-shm", "*.log", "*.log.*",
    "*.pem", "*.key", "*.p12", "*.pfx", "*.keystore", "*.jks",
    "*.apk", "*.aab", "*.dex", "*.hprof", "*.pyc", "*.tsbuildinfo",
    "*.tmp", "*.temp", "*.partial", "*.bak", "*~", "credentials*",
    "service-account*.json", "service_account*.json", "*-credentials.json",
)
REQUIRED = {
    "package.json", "package-lock.json", "app.json", "app.config.ts",
    "eas.json", "tsconfig.json", "eslint.config.js", ".env.example",
    "README.md", "AGENTS.md", "LICENSE", "src/app/_layout.tsx",
    "src/app/(tabs)/_layout.tsx", "src/app/(tabs)/index.tsx",
    "src/app/(tabs)/needs.tsx", "src/app/(tabs)/funding.tsx",
    "src/app/(tabs)/messages.tsx", "src/app/(tabs)/more.tsx",
    "src/app/visits.tsx", "src/app/map.tsx", "src/app/network.tsx",
    "src/lib/MobileContext.tsx", "src/lib/api.ts", "src/lib/session-vault.ts",
    "src/lib/types.ts", "src/lib/catalog.ts", "src/lib/catalog.json",
    "src/components/AppShell.tsx", "src/components/AccountPanel.tsx",
    "src/components/BrandMark.tsx", "src/components/ui.tsx",
    "src/components/MapSketch.tsx", "src/components/MapCanvas.tsx",
    "src/components/MapCanvas.native.tsx", "src/components/MapCanvas.web.tsx",
    "src/screens/VisitsScreen.tsx", "src/screens/NeedsScreen.tsx",
    "src/screens/FundingScreen.tsx", "src/screens/MessagesScreen.tsx",
    "src/screens/MapScreen.tsx", "src/screens/NetworkScreen.tsx",
    "scripts/preview.mjs", "scripts/sync-catalog.mjs",
    "tests/transport.test.mjs", "assets/icon.png", "assets/favicon.png",
    "assets/brand-mark.svg", "assets/android-icon-foreground.png",
    "assets/android-icon-background.png", "assets/android-icon-monochrome.png",
}
SENSITIVE_CONTENT = (
    re.compile(rb"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    re.compile(rb"\b(?:sk-proj-|sk-ant-)[A-Za-z0-9_-]{24,}"),
    re.compile(rb"\bAKIA[0-9A-Z]{16}\b"),
    re.compile(rb"(?im)(?:SUPABASE_SERVICE_ROLE_KEY|AWS_SECRET_ACCESS_KEY|OPENAI_API_KEY)\s*[:=]\s*['\"][A-Za-z0-9_+/=-]{16,}['\"]"),
)


def linked(path):
    return path.is_symlink() or getattr(path, "is_junction", lambda: False)()


def skip_reason(relative, directory=False):
    parts = tuple(part.casefold() for part in relative.parts)
    if any(part in SKIP_DIRS for part in parts):
        return "dependency/cache/generated native or build/temporary output"
    if any(part.startswith(("test-data-", "test-tmp-", ".test-data")) for part in parts):
        return "temporary test data"
    name = parts[-1]
    if (name == ".env" or name.startswith(".env.")) and name != ".env.example":
        return "private environment configuration; only .env.example is allowed"
    if name in PRIVATE_NAMES or any(fnmatch(name, pattern) for pattern in PRIVATE_PATTERNS):
        return "credential/database/log/audit or compiled artifact"
    return None


def collect_source():
    if not SOURCE.is_dir() or linked(SOURCE):
        raise SystemExit("Expected an unlinked existing mobile source directory.")
    base = SOURCE.resolve()
    if base.parent != ROOT.resolve():
        raise SystemExit("Mobile source resolves outside its intended workspace.")
    contents, exclusions = {}, []
    for current, directories, filenames in os.walk(SOURCE, topdown=True, followlinks=False):
        parent = Path(current)
        keep = []
        for name in sorted(directories):
            path = parent / name
            relative = path.relative_to(SOURCE)
            reason = "linked directory" if linked(path) else skip_reason(relative, True)
            if reason:
                exclusions.append({"path": relative.as_posix() + "/", "reason": reason})
            else:
                if not path.resolve().is_relative_to(base):
                    raise SystemExit("Directory resolves outside mobile source.")
                keep.append(name)
        directories[:] = keep
        for name in sorted(filenames):
            path = parent / name
            relative = path.relative_to(SOURCE)
            reason = "linked file" if linked(path) else skip_reason(relative)
            if reason:
                exclusions.append({"path": relative.as_posix(), "reason": reason})
                continue
            if not path.resolve().is_relative_to(base) or not path.is_file():
                raise SystemExit("Source file resolves outside mobile source.")
            data = path.read_bytes()
            if any(pattern.search(data) for pattern in SENSITIVE_CONTENT):
                # Never print the matched credential or source contents.
                raise SystemExit("Credential-like content requires review: " + relative.as_posix())
            contents[relative.as_posix()] = data
    missing = REQUIRED.difference(contents)
    if missing:
        raise SystemExit("Mobile source inputs missing: " + ", ".join(sorted(missing)))
    package = json.loads(contents["package.json"])
    if package.get("main") != "expo-router/entry":
        raise SystemExit("Unexpected mobile entry; inspect the actual Router configuration.")
    if "../asha-saath-lovable/README.md" not in contents["README.md"].decode("utf-8"):
        raise SystemExit("Mobile README must explain the required companion backend/website.")
    inventory = [
        {"path": name, "bytes": len(data), "sha256": sha256(data).hexdigest()}
        for name, data in sorted(contents.items())
    ]
    return contents, inventory, sorted(exclusions, key=lambda item: item["path"])


def inventory_hash(inventory):
    encoded = json.dumps(inventory, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return sha256(encoded).hexdigest()


def verify_current_source(inventory):
    contents, current_inventory, _ = collect_source()
    if inventory_hash(current_inventory) != inventory_hash(inventory):
        raise SystemExit("Mobile source changed while packaging; rerun after edits finish.")
    return len(contents)


def check_output_paths():
    if linked(OUTPUT):
        raise SystemExit("Package output directory must not be linked.")
    OUTPUT.mkdir(exist_ok=True)
    if OUTPUT.resolve().parent != ROOT.resolve():
        raise SystemExit("Package output resolves outside its intended workspace.")
    for path in (ARCHIVE, CHECKSUM, REPORT):
        if linked(path) or path.resolve().parent != OUTPUT.resolve():
            raise SystemExit("Package output file has an unsafe target.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="Inspect inventory only; write no package files")
    args = parser.parse_args()
    contents, inventory, exclusions = collect_source()
    summary = {
        "scope": "Separate Expo/React Native source; companion website/backend required; no APK or device claim",
        "source_file_count": len(inventory),
        "source_bytes": sum(item["bytes"] for item in inventory),
        "inventory_sha256": inventory_hash(inventory),
        "current_files": inventory,
        "excluded_entries": exclusions,
        "companion_requirement": "Extract the website source beside asha-saath-mobile; both use its Node/SQLite API. Parent docs come from the specification pack.",
    }
    if args.dry_run:
        print(json.dumps({"dry_run": True, **summary}, indent=2, ensure_ascii=False))
        return
    packaged_at = datetime.now(timezone.utc).isoformat()
    manifest = {"packaged_at_utc": packaged_at, **summary}
    manifest_bytes = (json.dumps(manifest, indent=2, ensure_ascii=False) + "\n").encode("utf-8")
    guide = (
        "# ASHA Saath mobile source package\n\n"
        "This archive contains the separate Android-first Expo/React Native application source.\n"
        "It is not an APK, signed binary, device test or publicly deployed application.\n\n"
        "The companion asha-saath-website-source.zip is required for the shared Node 24/SQLite backend.\n"
        "Extract its asha-saath-lovable directory beside asha-saath-mobile.\n"
        "The specification pack supplies the parent docs referenced by both READMEs.\n\n"
        "Start the website/backend with npm ci and npm run dev:local from asha-saath-lovable.\n"
        "Then in asha-saath-mobile use npm ci, npm run export:web and npm run preview.\n"
        "The website uses 5173; its API uses 4318; the default exported mobile preview uses 5186.\n"
        "Read the mobile README for Expo Go, emulator/LAN origins, local HTTP opt-in and EAS APK preparation.\n"
        "Do not overwrite an existing .env or reset a working backend database.\n\n"
        "Only .env.example public configuration is included. Native map keys are unconfigured; the route sketch is the default.\n"
        "Dependencies, caches, generated Android/iOS projects, APK/AAB/exports, logs, signing credentials and private state are excluded.\n"
        "All tasks, organizations, locations and cash amounts are fictional. Open demo accounts are not production identity.\n"
        "No real money transfer, offline save queue or live government/NGO connection is configured.\n\n"
        "mobile-source-manifest.json records every source file hash. The external .zip.sha256 and\n"
        "mobile-source-packaging.json identify the verified ZIP and current source snapshot.\n"
        "CRC/hash checks establish package integrity only; app checks are separate evidence.\n"
    ).encode("utf-8")
    check_output_paths()
    temporary_path = None
    try:
        with tempfile.NamedTemporaryFile(prefix="asha-mobile-package-", suffix=".partial", dir=OUTPUT, delete=False) as temporary:
            temporary_path = Path(temporary.name)
        if temporary_path.resolve().parent != OUTPUT.resolve() or not temporary_path.name.startswith("asha-mobile-package-"):
            raise SystemExit("Unsafe temporary package target.")
        with zipfile.ZipFile(temporary_path, "w", zipfile.ZIP_DEFLATED) as archive:
            for name, data in sorted(contents.items()):
                archive.writestr("asha-saath-mobile/" + name, data)
            archive.writestr("mobile-source-manifest.json", manifest_bytes)
            archive.writestr("MOBILE_SOURCE_PACKAGE_README.md", guide)
        with zipfile.ZipFile(temporary_path, "r") as archive:
            failure = archive.testzip()
            if failure:
                raise SystemExit("Mobile archive CRC failure: " + failure)
            for item in inventory:
                data = archive.read("asha-saath-mobile/" + item["path"])
                if len(data) != item["bytes"] or sha256(data).hexdigest() != item["sha256"]:
                    raise SystemExit("Mobile archive/source SHA256 mismatch.")
            if len(set(archive.namelist())) != len(archive.namelist()):
                raise SystemExit("Mobile archive contains duplicate entries.")
            archive_entries = len(archive.namelist())
        verify_current_source(inventory)
        archive_hash = sha256(temporary_path.read_bytes()).hexdigest()
        archive_bytes = temporary_path.stat().st_size
        os.replace(temporary_path, ARCHIVE)
        temporary_path = None
        CHECKSUM.write_text(archive_hash + "  " + ARCHIVE.name + "\n", encoding="ascii")
        report = {
            "checked_at_utc": packaged_at,
            "archive": ARCHIVE.name,
            "archive_bytes": archive_bytes,
            "archive_sha256": archive_hash,
            "archive_checksum_file": CHECKSUM.name,
            "archive_crc_verified": True,
            "source_hashes_verified": True,
            "current_source_hashes_verified": True,
            "archive_entries": archive_entries,
            **summary,
            "runtime_note": "Source integrity only. No Android device, SecureStore, APK signing or application runtime was tested by this packager.",
        }
        REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(json.dumps({key: value for key, value in report.items() if key not in {"current_files", "excluded_entries"}}, indent=2))
    finally:
        if temporary_path is not None and temporary_path.exists():
            if temporary_path.resolve().parent == OUTPUT.resolve() and temporary_path.name.startswith("asha-mobile-package-"):
                temporary_path.unlink()


if __name__ == "__main__":
    main()
