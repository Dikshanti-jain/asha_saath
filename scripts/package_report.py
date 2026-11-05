from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json

root=Path(__file__).resolve().parents[1]
notes=sorted((root/'research').glob('*.md'))
agent_notes=[p for p in notes if p.name[:2].isdigit() and 1<=int(p.name[:2])<=10]
assert len(agent_notes)==10
files=[root/'README-research-pack.md',root/'asha-ngo-decision-brief.md',root/'asha-ngo-full-report.md',root/'output/pdf/asha-ngo-full-report.pdf']+notes+[root/'research/report-metrics.json']
dest=root/'output/asha-ngo-research-pack.zip'
with ZipFile(dest,'w',ZIP_DEFLATED) as z:
    for p in files:
        assert p.is_file(),p
        z.write(p,p.relative_to(root).as_posix())
with ZipFile(dest) as z:
    assert z.testzip() is None
print(json.dumps({'zip':str(dest),'files':len(files),'bytes':dest.stat().st_size,'research_agent_notes':len(agent_notes)},indent=2))
