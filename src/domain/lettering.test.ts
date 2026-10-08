import {it,expect} from 'vitest';
import {normalizeLettering,validateLettering} from './lettering';
import type {FontRecord} from './model';
const font=(number:number,active=true)=>({id:String(number),number,label:'Font',active,state:'ready',asset_path:'test.woff2',css_family:'test',asset_version:'v1'}) as FontRecord;
it('separates stable identity from contiguous active display labels',()=>{const fonts=normalizeLettering([font(36),font(5,false),font(2)]);expect(fonts.map(f=>f.number)).toEqual([36,5,2]);expect(fonts.map(f=>f.display_position)).toEqual([1,undefined,2]);});
it('rejects incomplete or duplicate font records before persistence',()=>{expect(()=>validateLettering({revision:0,fonts:[font(1),font(1)]})).toThrow();expect(()=>validateLettering({revision:0,fonts:[{...font(1),asset_path:null}]})).toThrow();});
