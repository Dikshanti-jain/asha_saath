from pathlib import Path
from pypdf import PdfReader
from PIL import Image, ImageOps, ImageDraw, ImageFont
import subprocess
import json
import pdfplumber

root = Path(__file__).resolve().parents[1]
path = root / 'output/pdf/asha-ngo-full-report.pdf'
scratch = root / 'tmp/pdfs'
scratch.mkdir(parents=True, exist_ok=True)
reader = PdfReader(str(path))
empty = [i+1 for i,p in enumerate(reader.pages) if len((p.extract_text() or '').strip()) < 40]
links = sum(len(p.get('/Annots') or []) for p in reader.pages)
out_of_page = []
body_overflow = []
with pdfplumber.open(path) as pdf:
    for i,page in enumerate(pdf.pages,1):
        for c in page.chars:
            if c['x0'] < -0.5 or c['x1'] > page.width + 0.5 or c['top'] < -0.5 or c['bottom'] > page.height + 0.5:
                out_of_page.append(i)
            if 48 < c['top'] < page.height-42 and (c['x0'] < 45 or c['x1'] > page.width-45):
                body_overflow.append(i)
diag = {'pages':len(reader.pages), 'annotation_count':links, 'empty_pages':empty,
        'out_of_page_characters_on':sorted(set(out_of_page)), 'body_margin_overflow_on':sorted(set(body_overflow)),
        'bytes':path.stat().st_size}
(scratch/'pdf-diagnostics.json').write_text(json.dumps(diag,indent=2))
print(json.dumps(diag,indent=2),flush=True)
assert not empty and not out_of_page and not body_overflow
poppler = Path('C:/Users/GANPATI/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe')
subprocess.run([str(poppler),'-r','65','-png',str(path),str(scratch/'page')],check=True,stdout=subprocess.DEVNULL)
pages = sorted(scratch.glob('page-*.png'),key=lambda p:int(p.stem.split('-')[-1]))
assert len(pages) == len(reader.pages)
font = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',13)
tile_w,tile_h,cols,rows,gap = 235,333,4,5,12
sheet_paths=[]
for start in range(0,len(pages),cols*rows):
    group=pages[start:start+cols*rows]
    sheet=Image.new('RGB',(cols*(tile_w+gap)+gap,rows*(tile_h+26+gap)+gap),'#e4ebee')
    draw=ImageDraw.Draw(sheet)
    for n,p in enumerate(group):
        im=Image.open(p).convert('RGB')
        im=ImageOps.contain(im,(tile_w,tile_h))
        x=gap+(n%cols)*(tile_w+gap); y=gap+(n//cols)*(tile_h+26+gap)
        sheet.paste(im,(x,y))
        draw.text((x,y+tile_h+3),f'Page {start+n+1}',fill='#243a48',font=font)
    dest=scratch/f'contact-{start//(cols*rows)+1:02}.png'
    sheet.save(dest); sheet_paths.append(str(dest))
print(json.dumps({'contact_sheets':sheet_paths,'rendered_pages':len(pages)},indent=2))
