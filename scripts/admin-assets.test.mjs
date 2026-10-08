import {test} from 'node:test';import assert from 'node:assert/strict';import {validateUpload} from './admin-assets-server.mjs';
import {spawnSync} from 'node:child_process';
test('decodes real images into responsive WebP and rejects disguised files',()=>{
 const python=process.env.PYTHON_BIN||'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
 const image=spawnSync(python,['-c',"from PIL import Image;import io,base64; b=io.BytesIO();Image.new('RGB',(100,100),'pink').save(b,format='PNG');print(base64.b64encode(b.getvalue()).decode())"],{encoding:'utf8'});
 assert.equal(image.status,0);
 const result=spawnSync(python,['scripts/prepare-admin-upload.py'],{input:JSON.stringify({target:'catalog',data:image.stdout.trim()}),encoding:'utf8'});
 assert.equal(result.status,0);const output=JSON.parse(result.stdout);assert.deepEqual(output.variants.map(v=>v.width),[240,480,800]);
 for(const v of output.variants)assert.equal(Buffer.from(v.data,'base64').toString('ascii',8,12),'WEBP');
 assert.notEqual(spawnSync(python,['scripts/prepare-admin-upload.py'],{input:JSON.stringify({target:'hero',data:Buffer.from('not an image').toString('base64')}),encoding:'utf8'}).status,0);
});
test('rejects unsafe/unsupported upload metadata',()=>{assert.throws(()=>validateUpload({}));assert.throws(()=>validateUpload({target:'catalog',name:'a.jpg',data:'a',code:'../unsafe',type:'woven',group:'miniature',collection:''}));assert.throws(()=>validateUpload({target:'catalog',name:'a.jpg',data:'a',code:'OK',type:'woven',group:'XXL',collection:''}));assert.equal(validateUpload({target:'hero',name:'a.jpg',data:'a'}).target,'hero');});
test('closure icon uploads preserve alpha and use bounded WebP variants',()=>{
 const python=process.env.PYTHON_BIN||'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
 const image=spawnSync(python,['-c',"from PIL import Image;import io,base64;b=io.BytesIO();Image.new('RGBA',(100,100),(0,0,0,0)).save(b,format='PNG');print(base64.b64encode(b.getvalue()).decode())"],{encoding:'utf8'});
 assert.equal(image.status,0);const body=validateUpload({target:'closure',name:'icon.png',data:image.stdout.trim()});
 const result=spawnSync(python,['scripts/prepare-admin-upload.py'],{input:JSON.stringify(body),encoding:'utf8'});assert.equal(result.status,0);const output=JSON.parse(result.stdout);assert.deepEqual(output.variants.map(v=>v.width),[160,320]);
 const alpha=spawnSync(python,['-c',"from PIL import Image;import sys,base64,io;print(Image.open(io.BytesIO(base64.b64decode(sys.stdin.read()))).convert('RGBA').getpixel((0,0))[3])"],{input:output.variants[0].data,encoding:'utf8'});assert.equal(alpha.stdout.trim(),'0');
});
