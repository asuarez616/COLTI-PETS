import sys,json,base64,io
from PIL import Image,ImageOps
Image.MAX_IMAGE_PIXELS=32000000
import warnings
warnings.simplefilter('error',Image.DecompressionBombWarning)
body=json.loads(sys.stdin.read())
raw=base64.b64decode(body['data'],validate=True)
if not 0<len(raw)<=10485760: raise ValueError('Invalid image size')
with Image.open(io.BytesIO(raw)) as original:
 if original.format not in ('JPEG','PNG','WEBP'): raise ValueError('Unsupported image')
 if original.width*original.height>32000000: raise ValueError('Image too large')
 image=ImageOps.exif_transpose(original).convert('RGBA' if body['target']=='closure' else 'RGB')
 variants=[]
 for width in ([160,320] if body['target']=='closure' else [240,480,800] if body['target']=='catalog' else sorted(set([min(480,image.width),min(800,image.width),min(1600,image.width)]))):
  height=max(1,round(image.height*width/image.width))
  if height>12000: raise ValueError('Invalid aspect ratio')
  output=io.BytesIO();image.resize((width,height),Image.Resampling.LANCZOS).save(output,format='WEBP',quality=85)
  variants.append(dict(width=width,height=height,bytes=len(output.getvalue()),data=base64.b64encode(output.getvalue()).decode()))
 print(json.dumps(dict(width=image.width,height=image.height,variants=variants)))
