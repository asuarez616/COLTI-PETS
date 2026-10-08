import {describe,it,expect} from 'vitest';
import {availableCatalog,configuredHero,nextStatuses,productionStatus,validHeroConfiguration,type HeroImage} from './admin';
import {fixtureDesigns} from '../data/fixtures';
describe('production transitions',()=>{
 it.each([['new',['in_progress','cancelled']],['in_progress',['new','ready','cancelled']],['ready',['in_progress','delivered','cancelled']],['finished',['in_progress','delivered','cancelled']],['delivered',[]],['cancelled',[]]] as const)('%s transitions',(status,next)=>expect(nextStatuses(status)).toEqual(next));
 it('normalizes historical finished without changing snapshots',()=>expect(productionStatus('finished')).toBe('ready'));
});
describe('availability is additional to compatibility',()=>{
 const design=fixtureDesigns[0];
 it('preserves existing rules by default',()=>expect(availableCatalog([design],[])).toEqual([design]));
 it('disables whole design',()=>expect(availableCatalog([design],[{designId:design.id,width:0,enabled:false,revision:1}])[0].active).toBe(false));
 it('filters one width without affecting others',()=>{const next=availableCatalog([design],[{designId:design.id,width:1.5,enabled:false,revision:1}])[0];expect(next.compatibility.every(c=>c.width_cm!==1.5)).toBe(true);expect(design.compatibility.length).toBeGreaterThan(next.compatibility.length);});
 it('cannot reactivate a missing source design',()=>expect(availableCatalog([{...design,active:false}],[{designId:design.id,width:0,enabled:true,revision:1}])[0].active).toBe(false));
});
describe('hero configuration',()=>{
 const source=['a','b','c'].map(id=>({id,name:id,width:800,height:1200,variants:[]})) as HeroImage[];
 it('keeps source order without overrides',()=>expect(configuredHero(source,{revision:0,images:[]})).toEqual(source));
 it('respects explicit order and keeps new sync images inactive',()=>expect(configuredHero(source,{revision:1,images:[{id:'b',active:true},{id:'a',active:false}]}).map(i=>i.id)).toEqual(['b']));
 it('omits removed source files without activating new files',()=>expect(configuredHero(source,{revision:1,images:[{id:'missing',active:true}]})).toEqual([]));
 it('permits all inactive',()=>expect(configuredHero(source,{revision:1,images:source.map(s=>({id:s.id,active:false}))})).toEqual([]));
 it('rejects duplicate image positions',()=>expect(validHeroConfiguration({revision:0,images:[{id:'a',active:true},{id:'a',active:false}]})).toBe(false));
});

describe('hierarchical size availability',()=>{
 const design={...fixtureDesigns[0],compatibility:[{size_code:'M',width_cm:2.5},{size_code:'ML',width_cm:2.5},{size_code:'ML',width_cm:3},{size_code:'L',width_cm:3}]};
 it('disables only the selected size and preserves width preferences on restore',()=>{
  const widths=[{designId:design.id,size:'ML',width:3,enabled:false,revision:1}];
  expect(availableCatalog([design],[...widths,{designId:design.id,size:'ML',width:0,enabled:false,revision:1}])[0].compatibility).toEqual([design.compatibility[0],design.compatibility[3]]);
  expect(availableCatalog([design],widths)[0].compatibility).toEqual(design.compatibility.filter(c=>!(c.size_code==='ML'&&c.width_cm===3)));
  expect(widths[0].enabled).toBe(false);
 });
 it('isolates a shared width between sizes and keeps whole-design settings independent',()=>{
  const overrides=[{designId:design.id,size:'M',width:2.5,enabled:false,revision:1}];
  const off=availableCatalog([design],[...overrides,{designId:design.id,width:0,enabled:false,revision:1}])[0];
  expect(off.active).toBe(false);expect(off.compatibility).toContainEqual({size_code:'ML',width_cm:2.5});
  expect(availableCatalog([design],overrides)[0].compatibility).not.toContainEqual({size_code:'M',width_cm:2.5});
 });
 it('retains legacy width preferences and never exposes invalid pairs or missing assets',()=>{
  const overrides=[{designId:design.id,width:2.5,enabled:false,revision:1},{designId:design.id,size:'ML',width:2.5,enabled:true,revision:1}];
  expect(availableCatalog([{...design,compatibility:[...design.compatibility,{size_code:'M',width_cm:3}]}],overrides)[0].compatibility).toEqual([design.compatibility[1],design.compatibility[2],design.compatibility[3]]);
  expect(availableCatalog([{...design,active:false}],overrides)[0].active).toBe(false);
 });
});
