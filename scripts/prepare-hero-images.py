from PIL import Image, ImageOps
from pathlib import Path
import json, hashlib, os
root=Path(__file__).resolve().parent.parent
inventory=json.loads(Path(os.environ.get('COLTI_IMAGE_INVENTORY',root/'src/catalog/hero-drive-inventory.json')).read_text(encoding='utf8'))
if not inventory: raise ValueError('Empty hero inventory; existing hero preserved')
output=root/'public/editorial/drive'
output.mkdir(parents=True,exist_ok=True)
photos=[]
approved=json.loads((root/'src/catalog/image-manifest.json').read_text(encoding='utf8'))
for item in sorted(inventory,key=lambda f:(f['name'].casefold(),f['id'])):
    source=root/'.asset-tools/drive-originals'/item['id']
    digest=hashlib.sha256(source.read_bytes()).hexdigest()[:12]
    local=root/'public/editorial'/Path(item['name']).name
    key='editorial/'+item['name']
    if key in approved and local.exists() and hashlib.sha256(local.read_bytes()).hexdigest()[:12]==digest:
        photos.append(dict(id=item['id'],name=item['name'],**approved[key]))
        continue
    with Image.open(source) as original:
        image=ImageOps.exif_transpose(original).convert('RGB')
        variants=[]
        for width in sorted(set([min(480,image.width),min(800,image.width),min(1600,image.width)])):
            height=round(image.height*width/image.width)
            name=item['id']+'-'+digest+'-'+str(width)+'.webp'
            target=output/name
            if not target.exists():
                image.resize((width,height),Image.Resampling.LANCZOS).save(str(target)+'.tmp','WEBP',quality=88,method=4)
                os.replace(str(target)+'.tmp',target)
            variants.append(dict(file='editorial/drive/'+name,width=width,height=height,bytes=target.stat().st_size))
        photos.append(dict(id=item['id'],name=item['name'],width=image.width,height=image.height,originalBytes=source.stat().st_size,variants=variants))
manifest=Path(os.environ.get('COLTI_HERO_MANIFEST',root/'src/catalog/hero-drive.json'))
temporary=manifest.with_suffix('.json.tmp')
temporary.write_text(json.dumps(photos,indent=2)+'\n',encoding='utf8')
os.replace(temporary,manifest)
print('Drive hero images prepared:',len(photos))
