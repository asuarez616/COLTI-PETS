from PIL import Image, ImageOps
from pathlib import Path
import json, sys, hashlib, os
root=Path(__file__).resolve().parent.parent
inventory=json.loads(Path(os.environ.get('COLTI_IMAGE_INVENTORY',root/'src/catalog/drive-inventory.json')).read_text(encoding='utf8'))
output=root/'public/catalog/drive'
output.mkdir(parents=True,exist_ok=True)
for item in inventory:
    if item['mimeType'] not in ('image/png','image/jpeg','image/webp'): continue
    source=root/'.asset-tools/drive-originals'/item['id']
    version=hashlib.sha256((item.get('md5Checksum') or item.get('modifiedTime') or 'initial').encode()).hexdigest()[:12]
    targets=[output/(item['id']+'-'+version+f'-{w}.webp') for w in (240,480,800)]
    if all(p.exists() and p.stat().st_mtime>=source.stat().st_mtime for p in targets): continue
    with Image.open(source) as original:
        image=ImageOps.exif_transpose(original).convert('RGB')
        for width,target in zip((240,480,800),targets):
            resized=image.resize((width,round(image.height*width/image.width)),Image.Resampling.LANCZOS)
            resized.save(str(target)+'.tmp','WEBP',quality=88,method=4)
            os.replace(str(target)+'.tmp',target)
print('Drive images prepared:',len(inventory))
