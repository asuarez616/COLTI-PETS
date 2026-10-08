import sys,json
from pathlib import Path
sys.path.insert(0,str(Path('.asset-tools').resolve()))
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import RecordingPen
manifest={}
sources=list(Path('public/fonts/Montserrat').glob('*.ttf'))
for f in json.loads(Path('src/catalog/font-manifest.json').read_text()):
 sources.append(Path('public/fonts/plates')/(str(f['number']).zfill(2)+'.'+f['file'].split('.')[-1]))
for p in sources:
 if p.suffix.lower() not in ['.ttf','.otf','.woff']:continue
 font=TTFont(p,recalcTimestamp=False);target=p.with_suffix('.woff2');font.flavor='woff2';font.save(target)
 check=TTFont(target)
 assert font.getBestCmap()==check.getBestCmap() and font['hmtx'].metrics==check['hmtx'].metrics
 original=font.getGlyphSet();compressed=check.getGlyphSet()
 for name in font.getGlyphOrder():
  a=RecordingPen();b=RecordingPen();original[name].draw(a);compressed[name].draw(b);assert a.value==b.value,(p,name)
 manifest[str(p.relative_to('public')).replace('\\','/')]=str(target.relative_to('public')).replace('\\','/')
Path('src/catalog/font-assets.json').write_text(json.dumps(manifest,indent=2)+'\n');print('WOFF2 verified:',len(manifest),'fonts; cmap, metrics and all outlines unchanged')
