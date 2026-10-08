import {spawn} from 'node:child_process';
import {join} from 'node:path';
import {Resvg} from '@resvg/resvg-js';
export async function normalizeSvg(root,env,body){
 let raw=Buffer.from(body.data,'base64');
 let source=raw.toString('utf8');
 if(/<!ENTITY|<!DOCTYPE[^>]*\[/i.test(source))throw Error('Invalid image: unsafe SVG');
 if(raw.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||raw[0]===255&&raw[1]===216||raw.toString('ascii',0,4)==='RIFF'&&raw.toString('ascii',8,12)==='WEBP')return {...body,normalizedIcon:false};
 source=source.replace(/<!DOCTYPE\s+svg\s+(?:PUBLIC\s+"[^"]*"\s+"[^"]*"|SYSTEM\s+"[^"]*")\s*>/ig,'').replace(/<!--[\s\S]*?-->/g,'');
 raw=Buffer.from(source);
 body={...body,data:raw.toString('base64')};
 if(/<!DOCTYPE|<!ENTITY/i.test(raw.toString('utf8')))throw Error('Invalid image: unsafe SVG');
 if(!/^\s*(?:<\?xml[^>]*>\s*)?<svg[\s>]/i.test(raw.toString('utf8')))return {...body,normalizedIcon:false};
 if(body.target!=='closure')throw Error('Invalid image: SVG is only supported for icons');
 const svg=await new Promise((resolve,reject)=>{const p=spawn(env.PYTHON_BIN||'python',[join(root,'scripts/sanitize-icon.py')],{windowsHide:true,stdio:['pipe','pipe','ignore']});let result='';const timer=setTimeout(()=>{p.kill();reject(Error('Invalid image: SVG processing timed out'));},5000);p.stdout.on('data',d=>result+=d);p.on('error',reject);p.on('exit',code=>{clearTimeout(timer);code?reject(Error('Invalid image: unsupported or unsafe SVG')):resolve(result)});p.stdin.on('error',()=>{});p.stdin.end(JSON.stringify(body));});
 const probe=new Resvg(svg,{font:{loadSystemFonts:false},fitTo:{mode:'width',value:320}});
 if(probe.imagesToResolve().length)throw Error('Invalid image: external resources');
 const box=probe.getBBox();if(!box||![box.x,box.y,box.width,box.height].every(Number.isFinite)||!box.width||!box.height)throw Error('Invalid image: empty icon');
 const pad=Math.max(box.width,box.height)*.08,side=Math.max(box.width,box.height)+2*pad;
 const geometry=svg.replace(/\s+stroke-width="[^"]*"/g,'');
 const rootPaint=geometry.match(/<svg\b([^>]*)>/)?.[1].match(/\b(?:fill|stroke|opacity|fill-opacity|stroke-opacity|fill-rule|stroke-linecap|stroke-linejoin|transform)="[^"]*"/g)?.join(' ')||'';
 const normalized=geometry.replace(/<svg\b[^>]*>/,`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" fill="#b8857e" stroke-width="${side*.01}" viewBox="${box.x+(box.width-side)/2} ${box.y+(box.height-side)/2} ${side} ${side}"><g ${rootPaint}>`).replace('</svg>','</g></svg>');
 const rendered=new Resvg(normalized,{font:{loadSystemFonts:false}}).render();
 if(!rendered.pixels.some((v,i)=>i%4===3&&v))throw Error('Invalid image: empty icon');
 const output=rendered.asPng();
 return {...body,normalizedIcon:true,data:output.toString('base64')};
}
