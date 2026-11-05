"""Validate links, synthetic fixture contracts and prescribed colour pairings."""
import csv
import json
import re
from datetime import datetime, timedelta, timezone
from collections import Counter
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]

def unique_object(pairs):
    obj = {}
    for key, value in pairs:
        if key in obj:
            raise ValueError(f"Duplicate JSON key: {key}")
        obj[key] = value
    return obj

def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"), object_pairs_hook=unique_object)

def luminance(color):
    rgb = [int(color[i:i+2], 16)/255 for i in (1, 3, 5)]
    values = [v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in rgb]
    return sum(a*b for a, b in zip(values, (.2126, .7152, .0722)))

def main():
    errors, checks = [], {}
    files = [ROOT/n for n in ["START_HERE.md","README.md","PROJECT_CONTEXT.md","AGENTS.md","agent.md","SKILLS.md"]]
    for folder in ["docs","lovable","skills"]:
        files.extend((ROOT/folder).rglob("*.md"))
    link_count = 0
    for file in files:
        if not file.exists():
            errors.append(f"Missing {file.relative_to(ROOT)}")
            continue
        content = re.sub(r"```.*?```", "", file.read_text(encoding="utf-8"), flags=re.S)
        for match in re.finditer(r"!?\[[^\]]*\]\(([^)]+)\)", content):
            target = match[1].strip().split(" ")[0].strip("<>")
            if not target or target.startswith(("http:","https:","mailto:","#")):
                continue
            target = unquote(target.split("#")[0])
            if not (file.parent/target).exists():
                errors.append(f"Broken link in {file.relative_to(ROOT)}: {target}")
            link_count += 1
    checks["markdown_files"] = len(files)
    checks["local_links"] = link_count
    skill_files = list((ROOT/"skills").glob("*/SKILL.md"))
    for skill in skill_files:
        lines = skill.read_text(encoding="utf-8").splitlines()
        if len(lines) < 4 or lines[0] != "---" or lines[1] != "name: "+skill.parent.name or not lines[2].startswith("description: ") or lines[3] != "---":
            errors.append("Invalid simple skill frontmatter: "+str(skill.relative_to(ROOT)))
    checks["local_skill_frontmatter"] = len(skill_files)
    knowledge = (ROOT/"lovable/PROJECT_KNOWLEDGE.md").read_text(encoding="utf-8")
    checks["knowledge_characters"] = len(knowledge)
    if len(knowledge) > 10000:
        errors.append("Lovable knowledge exceeds 10,000 characters")
    config = read_json(ROOT/"fixtures/demo-config.json")
    offers = read_json(ROOT/"fixtures/demo-service-offers.json")
    read_json(ROOT/"fixtures/demo-scenarios.json")
    with (ROOT/"fixtures/demo-caseload.csv").open(encoding="utf-8", newline="") as f:
        rows = list(csv.DictReader(f))
    checks["synthetic_tasks"] = len(rows)
    if len(rows) != 24 or any(r["synthetic"] != "true" for r in rows):
        errors.append("Expected exactly 24 visibly synthetic tasks")
    ids = {(r["source_dataset_id"], r["source_task_id"]) for r in rows}
    if len(ids) != len(rows):
        errors.append("Duplicate task identity")
    staff = {s["id"] for s in config["staff"]}
    localities = {g["id"] for g in config["geographies"]}
    for row in rows:
        if row["staff_id"] not in staff or row["locality_id"] not in localities:
            errors.append("Invalid fixture staff/locality reference")
        if not -90 <= float(row["latitude"]) <= 90 or not -180 <= float(row["longitude"]) <= 180:
            errors.append("Invalid constructed coordinates")
    checks["distinct_patients"] = len({r["patient_id"] for r in rows})
    if len(offers["providers"]) != 3:
        errors.append("Expected three fictional offers")
    for provider in offers["providers"]:
        if "(fictional)" not in provider["name"] or provider["governmentEndorsement"]:
            errors.append("Provider needs fictional/no-endorsement label")
        if not set(provider["offer"]["catchments"]) <= localities:
            errors.append("Invalid service catchment")
        if provider["offer"]["category"] != config["supportCategory"]:
            errors.append("Service category inconsistency")
    tokens = read_json(ROOT/"design/tokens.json")
    contrasts = []
    for pair in tokens["contrastPairs"]:
        a, b = [luminance(tokens["colors"][pair[k]]) for k in ["foreground","background"]]
        ratio = (max(a,b)+.05)/(min(a,b)+.05)
        contrasts.append({"name": pair["name"], "ratio": round(ratio,2), "minimum": pair["minimum"]})
        if ratio < pair["minimum"]:
            errors.append(f"Insufficient contrast: {pair['name']}")
    checks["contrast_pairs"] = contrasts
    prd = (ROOT/"docs/PRD.md").read_text(encoding="utf-8")
    trace = (ROOT/"docs/TRACEABILITY.md").read_text(encoding="utf-8")
    for number in range(1,21):
        requirement = f"FR-{number:02}"
        if requirement not in prd or requirement not in trace:
            errors.append("Missing requirement trace: "+requirement)
    checked_date = datetime.now(timezone(timedelta(hours=5, minutes=30))).date().isoformat()
    result = {"checked_date": checked_date, "scope": "Documents/fixtures only; no app-runtime claim",
              "passed": not errors, "checks": checks, "errors": errors}
    out = ROOT/"output/spec-validation.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(result,indent=2),encoding="utf-8")
    print(json.dumps(result,indent=2))
    raise SystemExit(0 if not errors else 1)

if __name__ == "__main__":
    main()
