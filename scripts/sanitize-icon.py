"""Strict geometry-only SVG sanitizer. No links, styles, scripts or embedded content."""
import sys,json,base64,re,xml.etree.ElementTree as ET
body=json.load(sys.stdin);raw=base64.b64decode(body['data'],validate=True)
if len(raw)>524288 or re.search(br'<!DOCTYPE|<!ENTITY',raw,re.I): raise ValueError('Invalid SVG')
root=ET.fromstring(raw)
styles={}
for node in root.iter():
 if node.tag.split('}')[-1]=='style':
  css=node.text or ''
  if re.search(r'url\s*\(|@|javascript|https?:|data:',css,re.I):raise ValueError('Unsafe CSS')
  for selector,decl in re.findall(r'([^{}]+)\{([^{}]*)\}',css):
   if not re.fullmatch(r'\s*\.[\w-]+\s*',selector):raise ValueError('Unsupported CSS')
   styles[selector.strip()[1:]]=decl
for parent in root.iter():
 for child in list(parent):
  if child.tag.split('}')[-1] in {'defs','metadata','title','desc'}:parent.remove(child)
allowed={'svg','g','path','rect','circle','ellipse','line','polyline','polygon'}
attrs={'style','viewBox','width','height','x','y','x1','x2','y1','y2','cx','cy','r','rx','ry','d','points','transform','fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','fill-rule','clip-rule','opacity','fill-opacity','stroke-opacity','stroke-miterlimit','id','version','preserveAspectRatio'}
nodes=list(root.iter())
if len(nodes)>2000 or root.tag.split('}')[-1]!='svg': raise ValueError('Invalid SVG')
for node in nodes:
 tag=node.tag.split('}')[-1]
 if tag not in allowed or (node.text or '').strip():raise ValueError('Invalid SVG')
 node.tag=tag
 classes=node.attrib.pop('class','').split()
 inherited=';'.join(styles.get(c,'') for c in classes)
 if inherited:node.set('style',inherited+';'+node.attrib.get('style',''))
 node.attrib.pop('{http://www.w3.org/XML/1998/namespace}space',None)
 if 'style' in node.attrib:
  for declaration in node.attrib.pop('style').split(';'):
   if not declaration.strip():continue
   k,sep,v=declaration.partition(':')
   if k.strip() in {'shape-rendering','text-rendering','image-rendering','fill-rule','clip-rule'}:
    if k.strip() in {'fill-rule','clip-rule'}:node.set(k.strip(),v.strip())
    continue
   if not sep or k.strip() not in {'fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','opacity','fill-opacity','stroke-opacity'}:raise ValueError('Invalid SVG style')
   node.set(k.strip(),v.strip())
 for k,v in list(node.attrib.items()):
  if k not in attrs or len(v)>100000 or re.search(r'url\s*\(|javascript|https?:|data:|[<>]',v,re.I):raise ValueError('Invalid SVG')
  if k in ('fill','stroke') and v!='none':node.set(k,'#b8857e')
  if k in ('d','points','transform','viewBox','stroke-width') and not re.fullmatch(r'[a-zA-Z0-9.,+\- ()\s]+',v):raise ValueError('Invalid SVG')
root.set('fill','#b8857e')
root.set('xmlns','http://www.w3.org/2000/svg')
sys.stdout.write(ET.tostring(root,encoding='unicode'))
