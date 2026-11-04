from pathlib import Path
import re
import json
import argparse

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--draft', action='store_true')
args = parser.parse_args()

parts = [
    ('ASHA and the official problem statement', 'research/01-asha-ground-truth.md'),
    ('24 programmes - maternal, child and hospital care', 'research/02-maternal-child-schemes.md'),
    ('24 programmes - welfare, disability, adolescent and TB support', 'research/04-welfare-access-schemes.md'),
    ('24 programmes - public services and livelihoods', 'research/06-community-livelihood-schemes.md'),
    ('30 platforms - India-facing digital health', 'research/03-digital-health-platforms.md'),
    ('30 platforms - NGO discovery, funding and volunteering', 'research/05-ngo-network-platforms.md'),
    ('30 platforms - scheme access, CSR and crowdfunding', 'research/07-civic-funding-platforms.md'),
    ('30 platforms - close analogues and current tools', 'research/12-additional-platforms.md'),
    ('Network breakpoints and ten stakeholder perspectives', 'research/08-service-breakpoints.md'),
    ('Proposed solution and operating model', 'research/11-solution-design.md'),
    ('MVP architecture and acceptance criteria', 'research/09-architecture-mvp.md'),
    ('Independent audit and remaining validation', 'research/10-independent-audit.md'),
]

missing = [path for _, path in parts if not (ROOT / path).exists()]
if missing and not args.draft:
    raise SystemExit('Required notes missing: ' + ', '.join(missing))

def first_table_rows(path):
    text = (ROOT / path).read_text(encoding='utf-8')
    rows = []
    started = False
    for line in text.splitlines():
        if line.startswith('|'):
            started = True
            rows.append(line)
        elif started:
            break
    return max(0, len(rows) - 2)

scheme_paths = ['research/02-maternal-child-schemes.md', 'research/04-welfare-access-schemes.md', 'research/06-community-livelihood-schemes.md']
platform_paths = ['research/03-digital-health-platforms.md', 'research/05-ngo-network-platforms.md', 'research/07-civic-funding-platforms.md', 'research/12-additional-platforms.md']
schemes = sum(first_table_rows(p) for p in scheme_paths if (ROOT / p).exists())
platforms = sum(first_table_rows(p) for p in platform_paths if (ROOT / p).exists())
if not args.draft:
    assert schemes == 24, (schemes, 'scheme count')
    assert platforms == 30, (platforms, 'platform count')

front = '''# ASHA + NGO support: full research report

**ASHA Saath - a feasible visit plan and accountable local assistance**

Research cut-off: **8 October 2026, India**. Prepared for the team's chosen Healthcare 03 problem at Codefiesta 5.0.

## Read this first

The recommended product combines the required ASHA/ANM visit optimizer with one narrowly scoped assistance workflow. A visit produces a consented support need; the relevant public-service pathway is checked; a participating provider with the right catchment, eligibility and current capacity accepts or declines; delivery and beneficiary/worker confirmation are recorded; unresolved cases retain an owner and next action.

The proposal remains subject to local validation. No real NGO partnership, government production integration, money raised, clinical benefit, travel improvement or winning probability is claimed. A funded coordinator and real local service offers are prerequisites for a meaningful pilot.

The report catalogues **24 additional schemes/programmes** and **30 platforms/tools**. ASHA and the 2026 SSBSK operational framework are discussed separately, outside the additional 24 count. Related programmes, integrated systems, campaigns and overseas comparators are labelled; their beneficiaries and markets must not be added together. Shaishav is an officially described 2026 tool whose universal deployment was not verified.

Ten distinct research-agent assignments were used in batches: ASHA ground truth; maternal/child services; digital-health products; welfare/inclusion; NGO networks; public-service/livelihood programmes; civic access and financing; service handoffs and stakeholder perspectives; MVP engineering; and independent audit. The parent agent performed additional comparator research, synthesis and artifact preparation.

Evidence is distinguished as official documentation, provider-described capability, setting-specific research, design proposal or validation hypothesis. A feature missing from a public page is not automatically absent from the product. See the method note and the audit.

### Practical reading order

For a quick decision, read **asha-ngo-decision-brief.md**. In this full report, read the operating model, ten-perspective matrix and MVP before using the catalogue for programme-specific design. The original problem requirements and 2026 policy updates matter before implementation. All detailed source links remain inline and are also indexed at the end.

### Catalogue coverage

| Programme group | Eight additional entries |
|---|---|
| Maternal, child and hospital care | JSY; JSSK; PMMVY; PMSMA; SUMAN; Mission Indradhanush; UIP; PM-JAY |
| Welfare, disability, adolescent and TB support | NSAP; ADIP; Rashtriya Vayoshri Yojana; RBSK 2.0; RKSK; NMHP (including Tele-MANAS); NTEP; PM TB Mukt Bharat Abhiyaan / Ni-kshay Mitra |
| Public services and livelihoods | NHM Free Drugs; NHM Free Diagnostics; Ayushman Arogya Mandir; DAY-NRLM; NFSA/TPDS; Saksham Anganwadi and POSHAN 2.0; Jal Jeevan Mission; PMBJP / Jan Aushadhi |

| Platform group | Reviewed entries |
|---|---|
| Digital health - 8 | ANMOL; RCH Portal; U-WIN; AMRIT FLW; CommCare; eSanjeevani; ABDM ecosystem; Ni-kshay |
| NGO networks - 8 | NGO Darpan; GuideStar India; Give ecosystem; GlobalGiving; NGOBOX; Goodera; iVolunteer; ConnectFor |
| Access and financing - 8 | myScheme; UMANG; Rajasthan eMitra; CSR Exchange; National CSR data portal / CDM; Haqdarshak; Milaap; Ketto |
| Additional comparators - 6 | Khushi Baby CHIP; OpenSRP; Unite Us; Findhelp; Shaishav App; Poshan Tracker |

### Contents

'''
for i, (title, _) in enumerate(parts, 1):
    front += f'{i}. {title}\n'

method = (ROOT / 'research/00-research-method.md').read_text(encoding='utf-8')
out = front + '\n## Research method\n\n' + '\n'.join('##' + line[1:] if line.startswith('#') else line for line in method.splitlines()) + '\n'
for i, (title, path) in enumerate(parts, 1):
    out += f'\n---\n\n# Part {i}. {title}\n\n'
    if not (ROOT / path).exists():
        out += f'DRAFT: research contribution pending ({path}).\n'
        continue
    text = (ROOT / path).read_text(encoding='utf-8').strip()
    out += '\n'.join('#' + line if line.startswith('#') else line for line in text.splitlines()) + '\n'

links = {}
for label, url in re.findall(r'\[([^\]]+)\]\((https?://[^\s)]+)\)', out):
    links.setdefault(url, label)
out += '\n---\n\n# Primary-source and operator-document index\n\n'
out += 'URLs are indexed for navigation, not a count of independent studies. Several URLs refer to related official documents or different language/query versions. Sources retain the dates and evidence limits specified in the report.\n\n'
for i, (url, label) in enumerate(links.items(), 1):
    out += f'{i}. [{label}]({url})\n'

filename = 'asha-ngo-full-report.md' if not args.draft else 'asha-ngo-report-draft.md'
(ROOT / filename).write_text(out, encoding='utf-8')
metrics = {'draft': args.draft, 'scheme_rows': schemes, 'platform_rows': platforms, 'missing': missing, 'words': len(out.split()), 'source_urls': len(links), 'characters': len(out)}
(ROOT / 'research/report-metrics.json').write_text(json.dumps(metrics, indent=2), encoding='utf-8')
print(json.dumps(metrics, indent=2))
