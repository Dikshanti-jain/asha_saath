"""Package the complete current local app, preserving its original import evidence.

Capture source bytes once so manifest hashes and ZIP entries describe the same
snapshot. Exclude private state, credentials, dependencies and generated output.
This validates archive contents/integrity, not the application's runtime tests.
"""
from datetime import datetime, timezone
from fnmatch import fnmatch
from hashlib import sha256
from pathlib import Path
import json
import os
import re
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "asha-saath-lovable"
OUTPUT = ROOT / "output"
MANIFEST = OUTPUT / "lovable-source-manifest.json"
ARCHIVE = OUTPUT / "asha-saath-website-source.zip"
CHECKSUM = OUTPUT / "asha-saath-website-source.zip.sha256"
REPORT = OUTPUT / "website-source-packaging.json"
SKIP_DIRS = {
    "node_modules", ".npm-cache", ".git", ".output", "dist", "dist-ssr",
    ".tanstack", ".nitro", ".wrangler", ".vinxi", "coverage", ".cache",
    "logs", "tmp", "temp", "test-results", "playwright-report",
}
PRIVATE_NAMES = {".npmrc", ".pypirc", ".netrc", ".git-credentials"}
PRIVATE_PATTERNS = (
    "*.sqlite*", "*.db", "*.db-wal", "*.db-shm", "*.log", "*.log.*",
    "*.pem", "*.key", "*.p12", "*.pfx", "*.keystore", "credentials*",
    "service-account*.json", "service_account*.json", "*-credentials.json",
)
REQUIRED = {
    "package.json", "package-lock.json", "bun.lock", "vite.config.ts",
    "src/components/SessionPanel.tsx", "src/lib/demo/store.ts",
    "src/lib/demo/csv.ts", "src/lib/demo/planner.ts", "src/lib/demo/time.ts",
    "src/lib/demo/fixtures.ts", "public/favicon.svg", "scripts/dev-local.mjs",
    "backend/server.mjs", "backend/policy.mjs", "backend/domain.ts",
    "backend/schema.sql", "backend/sync-domain.mjs", "backend/http.test.mjs",
}
SENSITIVE_CONTENT = (
    re.compile(rb"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    re.compile(rb"\b(?:sk-proj-|sk-ant-)[A-Za-z0-9_-]{24,}"),
    re.compile(rb"\bAKIA[0-9A-Z]{16}\b"),
    re.compile(rb"(?im)(?:SUPABASE_SERVICE_ROLE_KEY|AWS_SECRET_ACCESS_KEY|OPENAI_API_KEY)\s*[:=]\s*['\"][A-Za-z0-9_+/=-]{16,}['\"]"),
)


def skip_reason(relative, directory=False):
    parts = tuple(p.casefold() for p in relative.parts)
    if any(p in SKIP_DIRS for p in parts):
        return "dependency/cache/build/temporary output"
    if parts[:2] in {("backend", "data"), ("backend", "runtime")}:
        return "private database/session data or generated backend runtime"
    if any(p.startswith(("test-data-", "test-tmp-", ".test-data")) for p in parts):
        return "temporary test data"
    name = parts[-1]
    if name == ".env" or name.startswith(".env."):
        return "environment configuration/credentials"
    if name in PRIVATE_NAMES or any(fnmatch(name, pattern) for pattern in PRIVATE_PATTERNS):
        return "credential/database/log artifact"
    return None


def linked(path):
    return path.is_symlink() or getattr(path, "is_junction", lambda: False)()


def main():
    if not MANIFEST.is_file() or not SOURCE.is_dir():
        raise SystemExit("Import source/manifest missing; do not package an invented revision.")
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    # The current import manifest uses files; support the older key without
    # replacing either original inventory or the pinned imported commit.
    imported = manifest.get("files", manifest.get("downloaded_files"))
    if not isinstance(imported, list) or not manifest.get("commit_sha"):
        raise SystemExit("Import manifest needs its original file list and pinned commit.")
    base = SOURCE.resolve()
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
                    raise SystemExit("Directory resolves outside application source.")
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
                raise SystemExit("Source file resolves outside application source.")
            data = path.read_bytes()
            if any(pattern.search(data) for pattern in SENSITIVE_CONTENT):
                # Report only the path; never echo the matched credential.
                raise SystemExit("Credential-like content requires review before packaging: " + relative.as_posix())
            contents[relative.as_posix()] = data
    missing = REQUIRED.difference(contents)
    if missing:
        raise SystemExit("Runnable source inputs missing: " + ", ".join(sorted(missing)))
    inventory = [{"path": name, "bytes": len(data), "sha256": sha256(data).hexdigest()}
                 for name, data in sorted(contents.items())]
    inventory_bytes = json.dumps(inventory, sort_keys=True, separators=(",", ":")).encode("utf-8")
    packaging = {
        "packaged_at_utc": datetime.now(timezone.utc).isoformat(),
        "scope": "Current local source; imported revision plus local changes; runtime tests are separate evidence",
        "source_file_count": len(inventory),
        "source_bytes": sum(item["bytes"] for item in inventory),
        "inventory_sha256": sha256(inventory_bytes).hexdigest(),
        "current_files": inventory,
        "added_paths_since_import": sorted(set(contents).difference(imported)),
        "missing_import_paths": sorted(set(imported).difference(contents)),
        "excluded_entries": sorted(exclusions, key=lambda item: item["path"]),
        "archive": ARCHIVE.name,
        "archive_checksum_file": CHECKSUM.name,
        "integrity_report": REPORT.name,
        "runtime_note": "Node 24 backend regenerates backend/runtime from included TS sources automatically; SQLite is created at startup",
    }
    manifest["packaging"] = packaging
    manifest_bytes = (json.dumps(manifest, indent=2, ensure_ascii=False) + "\n").encode("utf-8")
    guide = (
        "# ASHA Saath website source package\n\n"
        "This archive contains the complete current local app and its pinned import/current SHA256 inventory.\n"
        "The imported commit is " + manifest["commit_sha"] + "; packaged bytes include local changes.\n\n"
        "Use Node 24 and npm. In asha-saath-lovable run `npm install`, then `npm run dev:local`.\n"
        "Open http://127.0.0.1:5173; the local API runs on 4318. No environment secrets are required for this synthetic demo.\n"
        "Backend runtime is regenerated from the included source at startup; a new synthetic SQLite DB is created automatically.\n"
        "Dependencies, databases/sessions, generated runtime/builds, logs and credentials are intentionally excluded.\n"
        "The specification ZIP supplies the parent project docs linked by application documentation; place those docs beside the app.\n"
        "Open fictional accounts are a demo facility, not verified production identity. Supabase is unconnected.\n"
        "Frontend build success does not deploy the Node SQLite API. See app README/BUILD_VERIFICATION for actual checks and limits.\n\n"
        "The external .zip.sha256 and website-source-packaging.json identify the complete ZIP.\n"
        "Per-source-file SHA256 values in lovable-source-manifest.json validate the packaged bytes; they are not runtime test results.\n"
    ).encode("utf-8")
    OUTPUT.mkdir(exist_ok=True)
    with zipfile.ZipFile(ARCHIVE, "w", zipfile.ZIP_DEFLATED) as z:
        for name, data in sorted(contents.items()):
            z.writestr("asha-saath-lovable/" + name, data)
        z.writestr("lovable-source-manifest.json", manifest_bytes)
        z.writestr("SOURCE_PACKAGE_README.md", guide)
    with zipfile.ZipFile(ARCHIVE, "r") as z:
        failure = z.testzip()
        if failure:
            raise SystemExit("Archive CRC failure: " + failure)
        for item in inventory:
            if sha256(z.read("asha-saath-lovable/" + item["path"])).hexdigest() != item["sha256"]:
                raise SystemExit("Archive/source SHA256 mismatch.")
        archive_entries = len(z.namelist())
    archive_hash = sha256(ARCHIVE.read_bytes()).hexdigest()
    MANIFEST.write_bytes(manifest_bytes)
    CHECKSUM.write_text(archive_hash + "  " + ARCHIVE.name + "\n", encoding="ascii")
    report = {
        "archive": ARCHIVE.name, "archive_bytes": ARCHIVE.stat().st_size,
        "archive_sha256": archive_hash, "archive_crc_verified": True,
        "source_hashes_verified": True, "archive_entries": archive_entries,
        "source_file_count": len(inventory), "source_revision": manifest["commit_sha"],
        "inventory_sha256": packaging["inventory_sha256"],
        "excluded_entry_count": len(exclusions), "checked_at_utc": packaging["packaged_at_utc"],
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
