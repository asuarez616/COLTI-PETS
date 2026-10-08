import {describe,it,expect} from 'vitest';

import {catalogGroups,printedCollection,categoryLabel} from './catalogGroups';

import {fixtureDesigns} from '../data/fixtures';

describe('catalog organization',()=>{
 it('capitalizes presentation without changing category keys',()=>{expect(categoryLabel('florales')).toBe('Florales');expect(categoryLabel('cartoons')).toBe('Cartoons');});

 it('groups by source compatibility without dropping disabled designs',()=>{const d={...fixtureDesigns[0],active:false,compatibility:[{size_code:'M',width_cm:2.5},{size_code:'SM',width_cm:2}]};const g=catalogGroups([d],'woven');expect(g.map(v=>v.designs.length)).toEqual([1,1,0]);});

 it('manual collection wins over new Drive folders',()=>{const d={...fixtureDesigns[0],type:'printed' as const,source_collection:'florales',collection_override:'Cartoons'};expect(printedCollection(d)).toBe('Cartoons');expect(catalogGroups([d],'printed')[0].label).toBe('Cartoons');});

});

