from pathlib import Path
from reportlab.pdfbase.ttfonts import TTFont
import re
import json

root = Path(__file__).resolve().parents[1]
path = root / ('asha-ngo-full-report.md' if (root / 'asha-ngo-full-report.md').exists() else 'asha-ngo-report-draft.md')
text = path.read_text(encoding='utf-8')
table = []
issues = []
tables = 0
for n,line in enumerate(text.splitlines()+[''],1):
    if line.strip().startswith('|'):
        table.append((n,line.strip().strip('|').split('|')))
    elif table:
        tables += 1
        width = len(table[0][1])
        for row_n,row in table:
            if len(row) != width:
                issues.append({'line':row_n,'expected':width,'actual':len(row)})
        table=[]
font = TTFont('CheckBody','C:/Windows/Fonts/segoeui.ttf')
unsupported = sorted({c for c in text if not c.isspace() and ord(c) not in font.face.charWidths})
print(json.dumps({'file':path.name,'tables':tables,'table_issues':issues,'unsupported_chars':unsupported},ensure_ascii=False,indent=2))
assert not issues
