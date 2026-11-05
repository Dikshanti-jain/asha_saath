"""Render the completed research report to an accessible, linked PDF.

Long comparison rows become labelled entries in PDF; the editable Markdown
retains the full comparison tables. This keeps dense source evidence legible.
"""
from pathlib import Path
import re
import html
import json
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak,
    Table, TableStyle, HRFlowable, KeepTogether,
)
from reportlab.platypus.tableofcontents import TableOfContents

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'output/pdf/asha-ngo-full-report.pdf'
DEST.parent.mkdir(parents=True, exist_ok=True)
SOURCE = ROOT / 'asha-ngo-full-report.md'
assert SOURCE.exists(), 'Assemble the final report first.'
metrics = json.loads((ROOT / 'research/report-metrics.json').read_text())
assert not metrics['draft'] and not metrics['missing'], 'Final research must be complete.'

for name, filename in [('Body', 'segoeui.ttf'), ('BodyBold', 'segoeuib.ttf'), ('BodyItalic', 'segoeuii.ttf'), ('BodyBoldItalic', 'segoeuiz.ttf')]:
    pdfmetrics.registerFont(TTFont(name, 'C:/Windows/Fonts/' + filename))
pdfmetrics.registerFontFamily('Body', normal='Body', bold='BodyBold', italic='BodyItalic', boldItalic='BodyBoldItalic')
INK = colors.HexColor('#172A39')
TEAL = colors.HexColor('#126774')
MUTED = colors.HexColor('#546674')
LIGHT = colors.HexColor('#EAF2F4')
PAGE_W, PAGE_H = A4
LEFT, RIGHT, TOP, BOTTOM = 46, 46, 53, 45
WIDTH = PAGE_W - LEFT - RIGHT

styles = {
    'body': ParagraphStyle('BodyText', fontName='Body', fontSize=9.5, leading=13.4, textColor=INK, spaceAfter=7),
    'h1': ParagraphStyle('Chapter', fontName='BodyBold', fontSize=19, leading=24, textColor=TEAL, spaceAfter=16, spaceBefore=6, keepWithNext=True),
    'h2': ParagraphStyle('Section', fontName='BodyBold', fontSize=13, leading=17, textColor=INK, spaceAfter=8, spaceBefore=14, keepWithNext=True),
    'h3': ParagraphStyle('Subsection', fontName='BodyBold', fontSize=10.8, leading=15, textColor=TEAL, spaceAfter=7, spaceBefore=11, keepWithNext=True),
    'small': ParagraphStyle('SmallText', fontName='Body', fontSize=8.2, leading=11.1, textColor=MUTED, spaceAfter=5),
    'card': ParagraphStyle('CardTitle', fontName='BodyBold', fontSize=10.2, leading=14, textColor=TEAL, spaceBefore=10, spaceAfter=6, keepWithNext=True),
    'cell': ParagraphStyle('Cell', fontName='Body', fontSize=8.1, leading=11.1, textColor=INK),
    'cellhead': ParagraphStyle('CellHeader', fontName='BodyBold', fontSize=8.1, leading=11.1, textColor=colors.white),
    'code': ParagraphStyle('Code', fontName='Courier', fontSize=7.8, leading=11, textColor=INK, backColor=LIGHT, borderPadding=8, spaceAfter=8, wordWrap='CJK'),
    'cover': ParagraphStyle('Cover', fontName='BodyBold', fontSize=39, leading=46, textColor=TEAL, spaceAfter=14),
    'subtitle': ParagraphStyle('CoverSubtitle', fontName='Body', fontSize=18, leading=25, textColor=INK, spaceAfter=16),
}

def normalize(text):
    return text.translate(str.maketrans({'–':'-', '—':'-', '‑':'-', '−':'-', '“':'"', '”':'"', '‘':"'", '’':"'", '\u00a0':' ', '\u200b':''}))

def inline(text):
    text = normalize(text)
    # Preserve generated tags via placeholders before XML escaping.
    tokens = []
    def token(value):
        tokens.append(value)
        return f'ZZZINLINE{len(tokens)-1}ZZZ'
    def link(match):
        label, url = match.group(1), match.group(2)
        return token(f'<link href="{html.escape(url, quote=True)}" color="#126774">{html.escape(label)}</link>')
    text = re.sub(r'\[([^\]]+)\]\(([^\s)]+)\)', link, text)
    text = re.sub(r'`([^`]+)`', lambda m: token('<font name="Courier" size="8.4">' + html.escape(m.group(1)) + '</font>'), text)
    text = html.escape(text)
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)', r'<i>\1</i>', text)
    for i, value in enumerate(tokens):
        text = text.replace(f'ZZZINLINE{i}ZZZ', value)
    return text

class ResearchDoc(BaseDocTemplate):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.heading_counter = 0
    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph) and flowable.style.name == 'Chapter':
            title = flowable.getPlainText()
            key = 'chapter-' + str(self.heading_counter)
            self.heading_counter += 1
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(title, key, 0, False)
            self.notify('TOCEntry', (0, title, self.page, key))
    def beforeDocument(self):
        self.heading_counter = 0

def page_canvas(canvas, doc):
    canvas.saveState()
    if doc.page > 1:
        canvas.setFont('BodyBold', 7.2)
        canvas.setFillColor(TEAL)
        canvas.drawString(LEFT, PAGE_H - 28, 'ASHA SAATH  |  RESEARCH & PRODUCT DESIGN')
        canvas.setFont('Body', 7.2)
        canvas.setFillColor(MUTED)
        canvas.drawRightString(PAGE_W-RIGHT, PAGE_H - 28, '8 OCTOBER 2026')
        canvas.setStrokeColor(colors.HexColor('#D8E5E9'))
        canvas.line(LEFT, PAGE_H - 34, PAGE_W-RIGHT, PAGE_H - 34)
    canvas.setFont('Body', 7)
    canvas.setFillColor(MUTED)
    canvas.drawString(LEFT, 24, 'Desk research. Proposed features and simulated demonstration are labelled.')
    canvas.drawRightString(PAGE_W-RIGHT, 24, str(doc.page))
    canvas.restoreState()

doc = ResearchDoc(str(DEST), pagesize=A4, leftMargin=LEFT, rightMargin=RIGHT,
                  topMargin=TOP, bottomMargin=BOTTOM, title='ASHA + NGO Support: Full Research Report',
                  author='Hackathon research team', allowSplitting=1)
frame = Frame(LEFT, BOTTOM, WIDTH, PAGE_H-TOP-BOTTOM, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
doc.addPageTemplates(PageTemplate(id='Research', frames=[frame], onPage=page_canvas))
story = [Spacer(1, 58), Paragraph('ASHA Saath', styles['cover']),
         Paragraph('From a feasible visit plan<br/>to accountable local assistance', styles['subtitle']),
         HRFlowable(width='100%', color=TEAL, thickness=2), Spacer(1,22),
         Paragraph('FULL RESEARCH REPORT', styles['h3']),
         Paragraph('24 additional programmes  |  30 platforms/tools  |  10 research-agent assignments', styles['body']),
         Paragraph('India - research cut-off 8 October 2026<br/>Healthcare 03, Codefiesta 5.0', styles['body']),
         Spacer(1,18), Paragraph('Government-service navigation, participating NGOs, local catchments, consent, capacity, referral outcomes and a practical hackathon MVP.', styles['body']),
         Paragraph('Evidence-backed desk research and proposed design. No secured partnerships, live government integrations, guaranteed funding or measured clinical impact are claimed.', styles['small']),
         Spacer(1,14), Paragraph('For quick reading, use the companion Hinglish decision brief. Long comparison rows are shown as labelled entries in this PDF; the editable Markdown preserves the matrices.', styles['small']),
         PageBreak(), Paragraph('Navigation', styles['h1'])]
toc = TableOfContents()
toc.levelStyles = [ParagraphStyle('TOC', fontName='Body', fontSize=9.5, leading=14, leftIndent=0, firstLineIndent=0, spaceBefore=5, textColor=INK)]
story.append(toc)
story.append(PageBreak())

def render_table(lines):
    rows = [[cell.strip() for cell in line.strip().strip('|').split('|')] for line in lines]
    headers = rows[0]
    rows = [r for r in rows[1:] if not all(re.fullmatch(r'[:\- ]+', c or '-') for c in r)]
    cols = len(headers)
    assert all(len(r) == cols for r in rows), ('Malformed table', headers)
    dense = cols > 4 or any(len(cell) > 260 for row in rows for cell in row)
    if dense:
        for row in rows:
            numeric_id = re.fullmatch(r'\d+', re.sub(r'[*`\s]', '', row[0]))
            title = row[0] + '. ' + row[1] if numeric_id and len(row) > 1 else row[0]
            offset = 2 if numeric_id and len(row) > 1 else 1
            story.append(Paragraph(inline(title), styles['card']))
            for label, cell in zip(headers[offset:], row[offset:]):
                if cell:
                    story.append(Paragraph('<b>' + inline(label) + ':</b> ' + inline(cell), styles['body']))
            story.append(HRFlowable(width='100%', thickness=.4, color=colors.HexColor('#DAE6E9'), spaceBefore=4, spaceAfter=4))
    else:
        grid = [[Paragraph(inline(c), styles['cellhead']) for c in headers]]
        grid += [[Paragraph(inline(c), styles['cell']) for c in row] for row in rows]
        weights = [0.29,0.71] if cols == 2 else [1/cols] * cols
        table = Table(grid, colWidths=[WIDTH*w for w in weights], repeatRows=1, hAlign='LEFT')
        table.setStyle(TableStyle([
            ('BACKGROUND',(0,0),(-1,0),TEAL), ('VALIGN',(0,0),(-1,-1),'TOP'),
            ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,LIGHT]),
            ('LEFTPADDING',(0,0),(-1,-1),6), ('RIGHTPADDING',(0,0),(-1,-1),6),
            ('TOPPADDING',(0,0),(-1,-1),6), ('BOTTOMPADDING',(0,0),(-1,-1),6),
            ('LINEBELOW',(0,0),(-1,0),.5,colors.white),
        ]))
        story.extend([table,Spacer(1,10)])

lines = SOURCE.read_text(encoding='utf-8').splitlines()
i = 0
paragraph = []
def flush():
    if paragraph:
        story.append(Paragraph(inline(' '.join(paragraph)), styles['body']))
        paragraph.clear()
while i < len(lines):
    line = lines[i].strip()
    if i == 0 and line.startswith('# '):
        i += 1
        continue
    if not line:
        flush(); i += 1; continue
    if line.startswith('```'):
        flush(); i += 1; code = []
        while i < len(lines) and not lines[i].strip().startswith('```'):
            code.append(html.escape(normalize(lines[i])))
            i += 1
        story.append(Paragraph('<br/>'.join(code), styles['code']))
        i += 1; continue
    if line.startswith('|'):
        flush(); group = []
        while i < len(lines) and lines[i].strip().startswith('|'):
            group.append(lines[i].strip()); i += 1
        render_table(group); continue
    if re.fullmatch(r'-{3,}', line):
        flush(); i += 1; continue
    heading = re.match(r'^(#{1,6})\s+(.+)', line)
    if heading:
        flush(); level = len(heading.group(1)); title = heading.group(2)
        if level == 1:
            story.append(PageBreak())
        style = styles['h1' if level == 1 else 'h2' if level == 2 else 'h3']
        story.append(Paragraph(inline(title), style)); i += 1; continue
    if re.match(r'^[-*]\s', line) or re.match(r'^\d+\.\s', line):
        flush()
        if re.match(r'^[-*]\s', line):
            line = '• ' + line[2:]
        story.append(Paragraph(inline(line), styles['body'])); i += 1; continue
    if line.startswith('> '):
        flush(); story.append(Paragraph(inline(line[2:]), styles['body'])); i += 1; continue
    paragraph.append(line); i += 1
flush()
doc.multiBuild(story)
print(json.dumps({'pdf':str(DEST), 'bytes':DEST.stat().st_size, 'report_words':metrics['words']}))
