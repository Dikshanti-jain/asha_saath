"""Package the reviewed specifications and their linked research; excludes app runtime/secrets."""
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
roots = ["START_HERE.md","README.md","PROJECT_CONTEXT.md","AGENTS.md","agent.md","SKILLS.md",
         "asha-ngo-decision-brief.md","asha-ngo-full-report.md","README-research-pack.md"]
files = [ROOT/name for name in roots]
for folder in ["docs","lovable","design","fixtures","skills","research"]:
    files += [p for p in (ROOT/folder).rglob("*") if p.is_file()]
files += [ROOT/"scripts"/n for n in ["validate_spec_pack.py","package_spec_pack.py","package_application_snapshot.py","verify_application_package.py","check_planner_snapshot.mjs","check_planner_properties.mjs","capture_design_references.cjs","render_pitch_mind_map.py","package_pitch_kit.py","package_mobile_source.py","README-spec-tools.md"]]
files += [ROOT/"output/spec-validation.json",ROOT/"output/pdf/asha-ngo-full-report.pdf"]
files += [ROOT/"output"/n for n in ["lovable-source-manifest.json","website-source-packaging.json","asha-saath-website-source.zip.sha256","mobile-source-packaging.json","asha-saath-mobile-source.zip.sha256","asha-saath-android-usb-demo.apk.sha256"]]
files += [ROOT/"output/verification/mobile-device-2026-10-09/verify-apk.py"]
# Reviewed synthetic evidence only: never bundle a running database or session files.
for folder in ["browser", "local-domain", "local-domain-fairness-fixed", "backend-independent-audit", "ui-redesign-2026-10-09", "ui-trust-2026-10-09", "ngo-support-2026-10-09", "ngo-support-independent-2026-10-09", "mobile-app-2026-10-09", "mobile-device-2026-10-09"]:
    location = ROOT / "output/verification" / folder
    files += [p for p in location.rglob("*") if p.is_file()
              and p.suffix.lower() in {".json", ".jpg", ".png", ".ts", ".mjs", ".sql"}
              and "runtime" not in p.relative_to(location).parts]
files += [ROOT/"output/verification/local-checks.json", ROOT/"output/pitch-packaging.json"]
missing = [str(p.relative_to(ROOT)) for p in files if not p.exists()]
if missing:
    raise SystemExit("Missing package input: "+", ".join(missing))
archive = ROOT/"output/asha-saath-spec-pack.zip"
with zipfile.ZipFile(archive,"w",zipfile.ZIP_DEFLATED) as z:
    for p in sorted(set(files)):
        z.write(p,p.relative_to(ROOT).as_posix())
with zipfile.ZipFile(archive,"r") as z:
    if z.testzip():
        raise SystemExit("Archive integrity check failed")
print(f"Packaged {len(set(files))} files: {archive.name} ({archive.stat().st_size:,} bytes)")
