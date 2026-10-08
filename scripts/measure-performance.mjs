import {chromium} from '@playwright/test';
import {mkdir,writeFile,readdir,stat} from 'node:fs/promises';
const label=process.argv[2]||'after',base=process.env.COLTI_MEASURE_URL||'http://127.0.0.1:4173';
await mkdir('artifacts/block-e',{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),results=[];
for(const [device,width,height] of [['desktop',1440,900],['mobile',390,844]]){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1}),page=await context.newPage();
 const responses=[],failed=[];page.on('requestfailed',r=>failed.push(r.url()));
 page.on('response',r=>responses.push({url:r.url(),status:r.status()}));
 await page.addInitScript(()=>{window.metrics={lcp:0,cls:0};new PerformanceObserver(list=>{for(const e of list.getEntries())window.metrics.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.metrics.cls+=e.value;}).observe({type:'layout-shift',buffered:true});});
 await page.goto(base);await page.locator('h1').waitFor();await page.evaluate(()=>document.fonts.ready);
 if(device==='desktop')await page.locator('.editorial-carousel img.active').evaluate(async i=>{if(!i.complete)await i.decode();});
 // Two stable animation frames after paint; metrics are lab observations, not field CWV.
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const initial=await page.evaluate(()=>({metrics:window.metrics,resources:performance.getEntriesByType('resource').map(r=>({url:r.name,bytes:r.encodedBodySize,duration:r.duration})),images:[...document.images].filter(i=>i.currentSrc).map(i=>({src:i.currentSrc,width:i.getBoundingClientRect().width,naturalWidth:i.naturalWidth}))}));
 await page.getByRole('textbox').fill('Ana');await page.getByRole('button',{name:'Continue →',exact:true}).click();await page.getByRole('textbox').fill('+1 555 123 4567');await page.getByRole('button',{name:'Continue →',exact:true}).click();
 await page.getByRole('button',{name:/^M /}).click();await page.getByRole('button',{name:'Continue →',exact:true}).click();await page.getByRole('button',{name:'Continue →',exact:true}).click();
 await page.locator('.design-grid img').first().evaluate(async i=>{if(!i.complete)await i.decode();});
 const catalog=await page.evaluate(()=>({resources:performance.getEntriesByType('resource').map(r=>({url:r.name,bytes:r.encodedBodySize})),images:[...document.querySelectorAll('.design-grid img')].map(i=>({src:i.currentSrc,width:i.getBoundingClientRect().width,naturalWidth:i.naturalWidth}))}));
 results.push({device,initial,catalog,responses,failed});await context.close();
}
await browser.close();
async function files(path){let output=[];for(const entry of await readdir(path,{withFileTypes:true})){const name=path+'/'+entry.name;if(entry.isDirectory())output.push(...await files(name));else output.push({name,bytes:(await stat(name)).size});}return output;}
const assets=await files('dist');await writeFile(`artifacts/block-e/performance-${label}.json`,JSON.stringify({label,base,results,assets},null,2));
console.log(results.map(r=>({device:r.device,initialRequests:r.initial.resources.length,initialBytes:r.initial.resources.reduce((a,b)=>a+b.bytes,0),initialEditorial:r.initial.images.filter(i=>i.src.includes('/editorial/')).length,metrics:r.initial.metrics,catalog:r.catalog.images})));
