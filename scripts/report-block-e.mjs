import {readFile,writeFile} from 'node:fs/promises';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const before=await read('artifacts/block-e/performance-before.json'),after=await read('artifacts/block-e/performance-after.json');
const images=await read('src/catalog/image-manifest.json'),fonts=await read('src/catalog/font-manifest.json'),optimized=await read('src/catalog/font-assets.json');
const rows=[],sum=(values)=>values.reduce((a,b)=>a+b,0),file=(data,name)=>data.assets.find(f=>f.name==='dist/'+name)?.bytes||0;
function row(metric,a,b,unit='bytes'){rows.push({metric,before:a,after:b,difference:b-a,percent:a?(b-a)/a*100:0,unit});}
row('Lifestyle: five full-size files',sum(Object.entries(images).filter(([k])=>k.startsWith('editorial/')).map(([,v])=>v.originalBytes)),sum(Object.entries(images).filter(([k])=>k.startsWith('editorial/')).map(([,v])=>v.variants.at(-1).bytes)));
row('Catalogue: two full-size files',sum(Object.entries(images).filter(([k])=>k.startsWith('catalog/')).map(([,v])=>v.originalBytes)),sum(Object.entries(images).filter(([k])=>k.startsWith('catalog/')).map(([,v])=>v.variants.at(-1).bytes)));
row('UI fonts: Montserrat normal + italic',file(before,'fonts/Montserrat/Montserrat-VariableFont_wght.ttf')+file(before,'fonts/Montserrat/Montserrat-Italic-VariableFont_wght.ttf'),file(after,'fonts/Montserrat/Montserrat-VariableFont_wght.woff2')+file(after,'fonts/Montserrat/Montserrat-Italic-VariableFont_wght.woff2'));
const paths=fonts.map(f=>'fonts/plates/'+String(f.number).padStart(2,'0')+'.'+f.file.split('.').at(-1));
row('Plate fonts: 36 active sources',sum(paths.map(p=>file(before,p))),sum(paths.map(p=>file(after,optimized[p]||p))));
row('Active Martingale SVG',file(before,'icons/martingale.svg'),file(after,'icons/martingale.svg'));
row('Complete published dist',sum(before.assets.map(f=>f.bytes)),sum(after.assets.map(f=>f.bytes)));
for(let n=0;n<2;n++){const a=before.results[n],b=after.results[n],name=a.device;
 row(name+' initial resource bodies',sum(a.initial.resources.map(r=>r.bytes)),sum(b.initial.resources.map(r=>r.bytes)));
 row(name+' initial requests',a.initial.resources.length,b.initial.resources.length,'requests');
 row(name+' initial editorial images',a.initial.images.filter(i=>i.src.includes('/editorial/')).length,b.initial.images.filter(i=>i.src.includes('/editorial/')).length,'images');
 const aCatalog=a.catalog.resources.find(r=>r.url.includes('/catalog/')),bCatalog=b.catalog.resources.find(r=>r.url.includes('/catalog/'));row(name+' first catalogue thumbnail',aCatalog.bytes,bCatalog.bytes);
 row(name+' resource bodies through catalogue',sum(a.catalog.resources.map(r=>r.bytes)),sum(b.catalog.resources.map(r=>r.bytes)));
 row(name+' observed LCP',a.initial.metrics.lcp,b.initial.metrics.lcp,'ms');row(name+' observed CLS',a.initial.metrics.cls,b.initial.metrics.cls,'score');
}
for(const prefix of ['index-','react-','supabase-']){const find=d=>d.assets.filter(f=>f.name.endsWith('.js')&&f.name.split('/').at(-1).startsWith(prefix)).sort((a,b)=>a.bytes-b.bytes);row(prefix+' initial chunk',find(before)[0].bytes,find(after)[0].bytes);}
row('PDF chunk',before.assets.filter(f=>f.name.endsWith('.js')).sort((a,b)=>b.bytes-a.bytes)[0].bytes,after.assets.filter(f=>f.name.endsWith('.js')).sort((a,b)=>b.bytes-a.bytes)[0].bytes);
await writeFile('artifacts/block-e/comparison.json',JSON.stringify(rows,null,2));
const format=(n,unit)=>unit==='bytes'?(n/1000).toFixed(2)+' KB':unit==='score'?n.toFixed(6):n.toFixed(0)+' '+unit;
const markdown='| Métrica | Antes | Después | Diferencia |\n|---|---:|---:|---:|\n'+rows.map(r=>`| ${r.metric} | ${format(r.before,r.unit)} | ${format(r.after,r.unit)} | ${format(r.difference,r.unit)} (${r.percent.toFixed(1)}%) |`).join('\n');
await writeFile('artifacts/block-e/comparison.md',markdown+'\n');console.log(markdown);
