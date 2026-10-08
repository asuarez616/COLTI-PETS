from PIL import Image
from pathlib import Path
import json,re,base64,io
manifest={}
for folder,widths in [('editorial',[480,800]),('catalog',[240,480,800])]:
 for p in sorted(Path('public',folder).glob('*.png')):
  image=Image.open(p).convert('RGB'); entries=[]
  for w in widths+[image.width]:
   h=round(image.height*w/image.width); resized=image if w==image.width else image.resize((w,h),Image.Resampling.LANCZOS)
   target=p.with_name(f'{p.stem}-{w}.webp');resized.save(target,'WEBP',lossless=True,method=6)
   if w==image.width: assert resized.tobytes()==Image.open(target).convert('RGB').tobytes()
   entries.append({'file':f'{folder}/{target.name}','width':w,'height':h,'bytes':target.stat().st_size})
  manifest[f'{folder}/{p.name}']={'width':image.width,'height':image.height,'originalBytes':p.stat().st_size,'variants':entries}
p=Path('public/icons/martingale.svg');svg=p.read_text();match=re.search(r'data:image/png;base64,([^\"]+)',svg)
if match:
 image=Image.open(io.BytesIO(base64.b64decode(match.group(1))));out=Path('public/icons/martingale-outline.webp');image.save(out,'WEBP',lossless=True,method=6)
 assert image.convert('RGB').tobytes()==Image.open(out).convert('RGB').tobytes()
 p.write_text(svg.replace(match.group(0),'martingale-outline.webp'))
Path('src/catalog/image-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({k:{'original':v['originalBytes'],'full':v['variants'][-1]['bytes'],'small':v['variants'][0]['bytes']} for k,v in manifest.items()},indent=2))
