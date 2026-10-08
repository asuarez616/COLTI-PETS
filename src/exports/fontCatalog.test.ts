import {it,expect} from 'vitest';
import {catalogFonts,catalogHeight,generateFontCatalog} from './fontCatalog';
import type {FontRecord} from '../domain/model';
const font=(number:number,active=true)=>({number,active,state:'ready',asset_path:'font.woff2',asset_version:'v1',label:'Style',css_family:null}) as FontRecord;
it('uses active Store styles in the same numerical order without renumbering',()=>{expect(catalogFonts([font(7),font(2,false),font(3)]).map(f=>f.number)).toEqual([3,7]);});
it('three-column rows fit fewer, 36 and 50+ styles without a fixed cutoff',()=>{for(const count of [1,20,36,41,54])expect(catalogHeight(count)).toBe(470+Math.ceil(count/3)*248);});
it('does not export a fallback for an unavailable font asset',async()=>{await expect(generateFontCatalog([{...font(1),asset_path:null}],'DAKOTA')).rejects.toThrow('Style 01 is not ready');});
it('reports an empty persisted catalog',async()=>{await expect(generateFontCatalog([font(1,false)],'TOYA')).rejects.toThrow('No active');});

it('uses managed display order when provided, preserving Store style labels',()=>{expect(catalogFonts([{...font(1),display_order:2},{...font(2),display_order:1}]).map(f=>f.number)).toEqual([2,1]);});
