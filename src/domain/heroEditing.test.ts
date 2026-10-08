import {it,expect} from 'vitest';
import {mergeHeroSource,positionHero,toggleHero} from './heroEditing';
import type {HeroImage} from './admin';
const configuration={revision:3,images:[{id:'a',active:true},{id:'b',active:true},{id:'c',active:false}]};
it('new Drive photos stay inactive while active order is preserved',()=>{const source=['a','b','d'].map(id=>({id})) as HeroImage[];expect(mergeHeroSource(configuration,source)).toEqual({revision:3,images:[{id:'a',active:true},{id:'b',active:true},{id:'d',active:false}]});});
it('reactivation appends to the active sequence',()=>{const off=toggleHero(configuration,'a');expect(off.images.map(i=>i.id)).toEqual(['b','c','a']);expect(toggleHero(off,'a').images.map(i=>i.id)).toEqual(['b','a','c']);});
it('drag and keyboard positions reorder only active photos',()=>{expect(positionHero(configuration,'b',0).images.map(i=>i.id)).toEqual(['b','a','c']);expect(positionHero(configuration,'c',0)).toBe(configuration);});
it('deleted photos stay deleted after importing the same source again',()=>{const deleted={revision:4,images:[{id:'a',active:false,deleted:true}]};const source=[{id:'a'},{id:'b'}] as HeroImage[];expect(mergeHeroSource(deleted,source).images).toEqual([{id:'a',active:false,deleted:true},{id:'b',active:false}]);expect(mergeHeroSource(deleted,[]).images).toEqual(deleted.images);});
