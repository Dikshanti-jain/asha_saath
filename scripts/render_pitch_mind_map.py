"""Render a static, source-native ASHA Saath mind map and printable preview.

This contains no invented metrics, partners, locations or clinical rules.
Blue nodes describe the implemented synthetic app; amber nodes are proposals.
"""
from pathlib import Path
from html import escape
import argparse
import json
import re

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--diagram-only", action="store_true",
                    help="Regenerate SVG/HTML without updating the speech timing report")
args = parser.parse_args()

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "pitch"
OUT.mkdir(parents=True, exist_ok=True)
WIDTH, HEIGHT = 2200, 1690
nodes = [
    ("1. Feasible visit planning", "IMPLEMENTED · SYNTHETIC", [
        "CSV + immutable dataset/task identity",
        "Approved priority and due date first",
        "Deferral + availability window",
        "Shift, travel, breaks and buffer",
        "Numbered order + visible unserved reasons",
        "Forecast keeps original task deadlines",
    ], False),
    ("2. ASHA and health team", "IMPLEMENTED · SYNTHETIC", [
        "Next visit + clear mobile recording action",
        "Completed / absent / deferred outcome",
        "Health queue; approved pathway stays separate",
        "Short document-help need capture",
        "Official public-service pathway first",
        "Coordinator takes provider follow-up",
    ], False),
    ("3. Appropriate, consented support", "IMPLEMENTED · SYNTHETIC", [
        "Category + actual locality catchment",
        "Allowed mode, timing and available slots",
        "Named NGO + shared fields + permission",
        "Sequential document offer / new cash grant",
        "Scoped messages + saved read receipts",
        "Unread status; in-app communication only",
    ], False),
    ("4. Help and cash assistance", "IMPLEMENTED · SYNTHETIC", [
        "Document help: accept → reserve service slot",
        "Cash: person permits the named NGO",
        "NGO approves → reserves budget → reports",
        "Person confirms help / amount independently",
        "Coordinator closes confirmed service / cash",
        "External report ≠ app transfer or receipt",
    ], False),
    ("5. Trust and failure recovery", "IMPLEMENTED · SYNTHETIC", [
        "Declined / expired / no suitable offer",
        "Reason, current owner and next action",
        "Withdrawal ends NGO reads / message actions",
        "Disputed payment → resource reconciliation",
        "No NGO clinical details or household pins",
        "Transactions, scoped sessions and audit",
    ], False),
    ("6. Practical value and measurement", "CURRENT VISIBILITY + PROPOSED PILOT METRICS", [
        "ASHA: understandable daily work",
        "Family: assisted help and next-step visibility",
        "NGO: suitable requests within capacity",
        "Pilot: due completion by priority/locality",
        "Pilot: confirmed-help funnel + unresolved age",
        "Pilot: observed travel, workload and cost",
    ], False),
    ("7. Real NGO connection", "PROPOSED · NOT LIVE ONBOARDING", [
        "Find local candidates; agree participation",
        "Verify identity + actual service branch",
        "Darpan listing ≠ endorsement or capacity",
        "Declare village/hamlet or ward/settlement",
        "Check service, fees, hours and accessibility",
        "Test a referral; refresh dated availability",
    ], True),
    ("8. Pilot and real-world expansion", "PROPOSED · REAL FUNDING / EXPANSION", [
        "One PHC catchment, two ASHAs",
        "Funded coordinator + two-three NGO branches",
        "Eight weeks: prepare → baseline → use",
        "Real payments need an agreed external process",
        "Wider in-kind help after service design",
        "State/national aggregates after local pilots",
    ], True),
]
svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" viewBox="0 0 {WIDTH} {HEIGHT}" role="img" aria-labelledby="title desc">',
       '<title id="title">ASHA Saath: feasible visits to confirmed local help and cash assistance</title>',
       '<desc id="desc">Eight branches cover planning, ASHA and the separate approved health pathway, named-recipient support and saved case messages, document help and the synthetic cash permission-to-confirmation journey, recovery, visibility and proposed pilot metrics, real NGO onboarding and future expansion. Blue branches describe the synthetic prototype; amber branches are proposals. The application does not transfer money.</desc>',
       '<rect width="2200" height="1690" fill="#f5f7fa"/>',
       '<rect width="2200" height="8" fill="#f29d38"/>',
       '<style>text{font-family:Arial,"Nirmala UI",sans-serif;fill:#102a43} .title{font-size:44px;font-weight:700} .subtitle{font-size:25px;fill:#475569} .heading{font-size:28px;font-weight:700} .tag{font-size:17px;font-weight:700;letter-spacing:.6px} .body{font-size:23px} .foot{font-size:21px;fill:#475569}</style>',
       '<text x="60" y="68" class="title">ASHA Saath — the complete connection map</text>',
       '<text x="60" y="112" class="subtitle">Priority se visit. Permission se connection. Confirmation se completion.</text>',
       '<text x="1680" y="58" class="tag">9 OCTOBER 2026</text>',
       '<text x="1680" y="92" class="subtitle">Fictional demonstration</text>']

# All structural paths are drawn behind the labelled nodes.
for index in range(8):
    x = 60 if index < 4 else 1480
    y = 165 + (index % 4) * 350
    endx, endy = (720 if index < 4 else 1480), y + 148
    startx = 880 if index < 4 else 1320
    control = 800 if index < 4 else 1400
    svg.append(f'<path d="M {startx} 820 C {control} 820 {control} {endy} {endx} {endy}" fill="none" stroke="#9aaabc" stroke-width="2"/>')

for index, (title, tag, lines, future) in enumerate(nodes):
    x = 60 if index < 4 else 1480
    y = 165 + (index % 4) * 350
    accent = "#9a5a00" if future else "#1d4e89"
    surface = "#fff3dd" if future else "#eaf1f8"
    svg.extend([
        f'<rect x="{x}" y="{y}" width="660" height="296" rx="5" fill="#ffffff" stroke="#cbd5e1"/>',
        f'<rect x="{x}" y="{y}" width="660" height="74" rx="5" fill="{surface}"/>',
        f'<rect x="{x}" y="{y}" width="660" height="4" fill="{accent}"/>',
        f'<text x="{x+24}" y="{y+37}" class="heading">{escape(title)}</text>',
        f'<text x="{x+24}" y="{y+62}" class="tag" style="fill:{accent}">{escape(tag)}</text>',
    ])
    for lineindex, line in enumerate(lines):
        ly = y + 109 + lineindex * 31
        svg.append(f'<circle cx="{x+29}" cy="{ly-7}" r="3" fill="{accent}"/>')
        svg.append(f'<text x="{x+44}" y="{ly}" class="body">{escape(line)}</text>')

svg.extend([
    '<rect x="880" y="735" width="440" height="170" rx="8" fill="#102a43"/>',
    '<text x="1100" y="781" text-anchor="middle" style="fill:white;font-size:40px;font-weight:700">ASHA Saath</text>',
    '<text x="1100" y="820" text-anchor="middle" style="fill:white;font-size:26px">Visit → local support</text>',
    '<text x="1100" y="854" text-anchor="middle" style="fill:white;font-size:26px">→ person confirmation</text>',
    '<text x="1100" y="881" text-anchor="middle" style="fill:#cbd5e1;font-size:19px">People + process + software</text>',
    '<rect x="60" y="1550" width="25" height="25" fill="#1d4e89"/>',
    '<text x="99" y="1571" class="body">Blue: current workflow; pilot metrics labelled</text>',
    '<rect x="680" y="1550" width="25" height="25" fill="#9a5a00"/>',
    '<text x="719" y="1571" class="body">Amber: proposed real operations / future scope</text>',
    '<text x="60" y="1622" class="foot">Current: 24 fictional tasks · 3 document offers · cash ledger + case messages · no real NGO onboarding or money transfer</text>',
    '<text x="60" y="1658" class="foot">Software checks: 31 Vitest + 15 HTTP + 8 independent audit checks. Field impact and travel savings are not measured.</text>',
    '</svg>',
])
(OUT / "ASHA_SAATH_MIND_MAP.svg").write_text("\n".join(svg), encoding="utf-8")
html = '''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ASHA Saath pitch mind map</title>
<style>body{margin:0;background:#f5f7fa;font-family:Arial,sans-serif;color:#102a43}nav{padding:16px 24px;border-top:4px solid #f29d38;background:white;display:flex;gap:24px;flex-wrap:wrap;align-items:center}nav strong{margin-right:auto}a{color:#1d4e89}main{padding:16px}img{display:block;width:100%;height:auto}p{padding:0 24px 20px;color:#475569;line-height:1.6}@media print{nav,p{display:none}main{padding:0}@page{size:A3 landscape;margin:8mm}}</style>
</head><body><nav><strong>ASHA Saath · Pitch preparation</strong><a href="ASHA_SAATH_MIND_MAP.svg">Open full-size map</a><a href="01-FIVE_MINUTE_PITCH_HINGLISH.md">Speaking script</a><a href="03-MIND_MAP_AND_NGO_OPERATIONS.md">NGO operations</a></nav><main><img src="ASHA_SAATH_MIND_MAP.svg" alt="ASHA Saath's eight-branch map linking visit planning, worker actions, consented matching and case messages, person-confirmed document help and synthetic cash assistance, recovery, proposed pilot metrics and real NGO onboarding."></main><p>Current workflow uses fictional tasks, offers, budgets and cash reports. Case messages and read receipts are saved. Amber branches describe proposed work; pilot metrics remain proposed. No real partners, money transfers or measured field-impact percentages are claimed.</p></body></html>'''
(OUT / "mind-map.html").write_text(html, encoding="utf-8")
if args.diagram_only:
    print(json.dumps({"diagram": "ASHA_SAATH_MIND_MAP.svg", "preview": "mind-map.html",
                      "nodes": len(nodes), "speech_report_updated": False}, indent=2))
    raise SystemExit(0)
script = (OUT / "01-FIVE_MINUTE_PITCH_HINGLISH.md").read_text(encoding="utf-8")
parts = re.findall(r'<!-- speech -->(.*?)<!-- /speech -->', script, re.S)
counts = [len(re.findall(r'\S+', part)) for part in parts]
verification = {
    "checked_date": "2026-10-09",
    "spoken_words": sum(counts),
    "section_words": counts,
    "minutes_at_130_wpm": round(sum(counts)/130,2),
    "timing": "Estimated only; rehearse with pauses and screen cues",
    "mind_map": "ASHA_SAATH_MIND_MAP.svg",
    "nodes": len(nodes),
    "scope": "Speech timing and diagram artifacts; app verification recorded separately",
}
(OUT / "pitch-checks.json").write_text(json.dumps(verification, indent=2), encoding="utf-8")
print(json.dumps(verification, indent=2))
