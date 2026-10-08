import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const postcss=createRequire(import.meta.resolve('vite'))('postcss');
const files=['styles.css','editorial.css','interactions.css','accessibility.css','ui-corrections.css'];
const proposal=process.argv.includes('--proposal');
const before=files.map(n=>postcss.parse(fs.readFileSync('artifacts/phase-23-css-before/'+n,'utf8')));
const after=[postcss.parse(fs.readFileSync((proposal?'artifacts/phase-23-proposal':'src')+'/design-tokens.css','utf8')),...files.map(n=>postcss.parse(fs.readFileSync((proposal&&fs.existsSync('artifacts/phase-23-proposal/'+n)?'artifacts/phase-23-proposal':'src')+'/'+n,'utf8')))];
function selectors(value){let level=0,start=0,result=[];for(let i=0;i<value.length;i++){if(value[i]==='(')level++;if(value[i]===')')level--;if(value[i]===','&&!level){result.push(value.slice(start,i).trim());start=i+1;}}result.push(value.slice(start).trim());return result;}
function inventory(roots){const vars={},declarations=new Map(),media=[];for(const root of roots)root.walkRules(rule=>{if(rule.selector===':root')rule.walkDecls(d=>{if(d.prop.startsWith('--'))vars[d.prop]=d.value;});});
 const expand=value=>{for(let i=0;i<20;i++){const next=value.replace(/var\((--[\w-]+)\)/g,(all,k)=>vars[k]??all);if(next===value)break;value=next;}return value.replace(/\s+/g,' ').replace(/\s*,\s*/g,',').trim();};
 for(const root of roots){root.walkAtRules('media',a=>media.push(a.params));root.walkRules(rule=>{const parents=[];for(let p=rule.parent;p;p=p.parent)if(p.type==='atrule')parents.unshift('@'+p.name+' '+p.params);for(const selector of selectors(rule.selector))for(const d of rule.nodes||[]){if(d.type!=='decl'||selector===':root'&&d.prop.startsWith('--'))continue;const key=parents.join('|')+'|'+selector+'|'+d.prop;declarations.set(key,expand(d.value)+(d.important?' !important':''));}});}
 return {vars,declarations,media};}
const a=inventory(before),b=inventory(after),differences=[];
for(const key of new Set([...a.declarations.keys(),...b.declarations.keys()]))if(a.declarations.get(key)!==b.declarations.get(key))differences.push({key,before:a.declarations.get(key),after:b.declarations.get(key)});
assert.deepEqual(b.media,a.media,'Media queries and their order must remain unchanged');
const result={mode:proposal?'proposal':'applied',comparedDeclarations:a.declarations.size,differences,mediaQueries:a.media.length,tokenCount:Object.keys(b.vars).length};
fs.writeFileSync('artifacts/phase-23-css-equivalence'+(proposal?'-proposal':'')+'.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));assert.equal(differences.length,0,'CSS values changed');
