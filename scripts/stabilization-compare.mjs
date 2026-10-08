import {readdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root='artifacts/stabilization';
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const results=readdirSync(`${root}/before`).filter(n=>n.endsWith('.png')).map(name=>({name,before:hash(`${root}/before/${name}`),after:hash(`${root}/after/${name}`)}));
writeFileSync(`${root}/comparison.json`,JSON.stringify(results,null,2));
for(const result of results)console.log(`${result.name}: ${result.before===result.after?'identical':'changed'}`);
if(results.some(r=>r.before!==r.after))process.exitCode=1;
