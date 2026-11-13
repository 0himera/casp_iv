"""Render the exported PDF and verify that slide text survived conversion."""
from pathlib import Path
import re
import pymupdf
from PIL import Image, ImageDraw
from pptx import Presentation
R=Path(__file__).resolve().parent
pdf=pymupdf.open(R/'Caspian-Transit.pdf'); ppt=Presentation(R/'Caspian-Transit.pptx')
assert len(pdf)==len(ppt.slides)==10
norm=lambda x: re.sub(r'\s+','',x).replace('\u00ad','').replace('→','')
thumbs=[]
for i,(page,slide) in enumerate(zip(pdf,ppt.slides),1):
 actual=norm(page.get_text())
 for sh in slide.shapes:
  if not sh.has_text_frame:continue
  for p in sh.text_frame.paragraphs:
   assert norm(p.text) in actual, (i,p.text)
 assert slide.notes_slide.notes_text_frame.text.strip()
 page.get_pixmap(matrix=pymupdf.Matrix(1.5,1.5),alpha=False).save(R/'preview'/f'{i:02d}.png')
 im=Image.open(R/'preview'/f'{i:02d}.png').convert('RGB');im.thumbnail((640,360));thumbs.append(im)
canvas=Image.new('RGB',(1320,2020),'#d2dce3');d=ImageDraw.Draw(canvas)
for i,im in enumerate(thumbs):
 x=10+(i%2)*660;y=10+(i//2)*400;canvas.paste(im,(x,y));d.text((x+4,y+367),f'{i+1:02d}',fill='#143c53')
canvas.save(R/'preview'/'overview.jpg',quality=90)
assert any('caspian.psychaos.art' in l.get('uri','') for l in pdf[-1].get_links())
print('10 slides: all text preserved; speaker notes present; demo hyperlink valid; previews rendered.')
