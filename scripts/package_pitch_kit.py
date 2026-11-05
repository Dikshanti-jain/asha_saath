"""Package only the synthetic, reviewed pitch artifacts; no app data or secrets."""
from pathlib import Path
from hashlib import sha256
from zipfile import ZipFile, ZIP_DEFLATED
import json
import posixpath
import re

ROOT = Path(__file__).resolve().parents[1]
PITCH = ROOT / "docs/pitch"
files = sorted(p for p in PITCH.iterdir()
               if p.is_file() and p.suffix.lower() in {".md", ".svg", ".png", ".html", ".json"})
required = {"01-FIVE_MINUTE_PITCH_HINGLISH.md", "02-EVIDENCE_AND_BENEFITS.md",
            "03-MIND_MAP_AND_NGO_OPERATIONS.md", "04-DEMO_AND_JUDGE_QA.md", "05-DELIVERY_AND_CLAIM_REVIEW.md",
            "ASHA_SAATH_MIND_MAP.svg", "ASHA_SAATH_MIND_MAP.png", "README.md",
            "mind-map.html", "pitch-checks.json", "mind-map-review.json"}
missing = required - {p.name for p in files}
if missing:
    raise SystemExit("Missing pitch artifacts: " + ", ".join(sorted(missing)))
archive = ROOT / "output/asha-saath-pitch-kit.zip"
prefix = "asha-saath-pitch/"
with ZipFile(archive, "w", ZIP_DEFLATED) as z:
    for p in files:
        if p.suffix.lower() == ".md":
            content = p.read_text(encoding="utf-8")
            content = content.replace("(../UI_REVIEW_2026-10-09.md)", "(evidence/UI_REVIEW_2026-10-09.md)")
            content = content.replace("(../UI_TRUST_REVIEW_2026-10-09.md)", "(evidence/UI_TRUST_REVIEW_2026-10-09.md)")
            content = content.replace("(../NGO_SUPPORT_REVIEW_2026-10-09.md)", "(evidence/NGO_SUPPORT_REVIEW_2026-10-09.md)")
            content = content.replace("(../FUNDING_AND_COMMUNICATION.md)", "(evidence/FUNDING_AND_COMMUNICATION.md)")
            if p.name == "README.md":
                content = content.replace("Download all these files together: [pitch kit ZIP](../../output/asha-saath-pitch-kit.zip).",
                                          "This is the extracted pitch kit. Application screenshots and verification notes are in the evidence folder.")
            z.writestr(prefix + p.name, content)
        else:
            z.write(p, prefix + p.name)
    review = (ROOT / "docs/UI_REVIEW_2026-10-09.md").read_text(encoding="utf-8")
    review = review.replace("../output/verification/ui-redesign-2026-10-09/", "screens/")
    review = review.replace("See [deployment instructions](../asha-saath-lovable/DEPLOYMENT.md).",
                            "Deployment instructions are in the separate website source package.")
    z.writestr(prefix + "evidence/UI_REVIEW_2026-10-09.md", review)
    trust_review = (ROOT / "docs/UI_TRUST_REVIEW_2026-10-09.md").read_text(encoding="utf-8")
    trust_review = trust_review.replace("../output/verification/ui-trust-2026-10-09/", "trust-screens/")
    z.writestr(prefix + "evidence/UI_TRUST_REVIEW_2026-10-09.md", trust_review)
    for p in sorted((ROOT / "output/verification/ui-trust-2026-10-09").iterdir()):
        if p.is_file() and p.suffix.lower() in {".png", ".json"}:
            z.write(p, prefix + "evidence/trust-screens/" + p.name)
    support_review = (ROOT / "docs/NGO_SUPPORT_REVIEW_2026-10-09.md").read_text(encoding="utf-8")
    support_review = support_review.replace("../output/verification/ngo-support-2026-10-09/", "support-screens/")
    support_review = support_review.replace("../output/verification/ngo-support-independent-2026-10-09/", "support-audit/")
    z.writestr(prefix + "evidence/NGO_SUPPORT_REVIEW_2026-10-09.md", support_review)
    support_contract = (ROOT / "docs/FUNDING_AND_COMMUNICATION.md").read_text(encoding="utf-8")
    support_contract = support_contract.replace("[build status](BUILD_STATUS.md) and [handoff](CONTEXT_HANDOFF.md)",
                                              "[support review](NGO_SUPPORT_REVIEW_2026-10-09.md)")
    z.writestr(prefix + "evidence/FUNDING_AND_COMMUNICATION.md", support_contract)
    for folder, target in [("ngo-support-2026-10-09", "support-screens"),
                           ("ngo-support-independent-2026-10-09", "support-audit")]:
        for p in sorted((ROOT / "output/verification" / folder).iterdir()):
            if p.is_file() and p.suffix.lower() in {".png", ".json"}:
                z.write(p, prefix + "evidence/" + target + "/" + p.name)
    screenshots = ROOT / "output/verification/ui-redesign-2026-10-09"
    for p in sorted(screenshots.iterdir()):
        if p.is_file() and p.suffix.lower() in {".jpg", ".json"}:
            z.write(p, prefix + "evidence/screens/" + p.name)
with ZipFile(archive) as z:
    if z.testzip():
        raise SystemExit("Pitch archive CRC failed")
    names = set(z.namelist())
    link_count = 0
    for name in names:
        if name.endswith(".md"):
            content = re.sub(r"```.*?```", "", z.read(name).decode("utf-8"), flags=re.S)
            for target in re.findall(r"!?\[[^\]]*\]\(([^)]+)\)", content):
                if target.startswith(("http:", "https:", "#", "mailto:")):
                    continue
                resolved = posixpath.normpath(posixpath.join(posixpath.dirname(name), target.split("#")[0]))
                if resolved not in names:
                    raise SystemExit(f"Broken archive link: {name} → {target}")
                link_count += 1
report = {"checked_date": "2026-10-09", "files": len(names), "pitch_files": len(files),
          "bytes": archive.stat().st_size, "sha256": sha256(archive.read_bytes()).hexdigest(),
          "crc": "passed", "portable_markdown_links": link_count,
          "scope": "Pitch documents, reviewed synthetic diagram and application evidence only"}
(ROOT / "output/pitch-packaging.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print(json.dumps(report, indent=2))
