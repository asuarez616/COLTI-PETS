import sys, json, base64, io, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '.asset-tools'))
from fontTools.ttLib import TTFont
body = json.loads(sys.stdin.read())
raw = base64.b64decode(body['data'], validate=True)
extension = body['name'].rsplit('.', 1)[-1].lower()
if extension not in ('woff', 'woff2') or not 44 <= len(raw) <= 10485760:
    raise ValueError('Invalid font size or format')
if raw[:4] != (b'wOF2' if extension == 'woff2' else b'wOFF') or int.from_bytes(raw[8:12], 'big') != len(raw):
    raise ValueError('Invalid font signature')
if int.from_bytes(raw[16:20], 'big') > 33554432 or int.from_bytes(raw[12:14], 'big') > 200:
    raise ValueError('Font decompression limit exceeded')
font = TTFont(io.BytesIO(raw), lazy=False, checkChecksums=2)
if font.flavor != extension or 'cmap' not in font or 'name' not in font:
    raise ValueError('Unusable font')
font.ensureDecompiled()
if not font.getBestCmap():
    raise ValueError('Empty font')
font.save(io.BytesIO())
print(json.dumps({'valid': True, 'extension': extension}))
