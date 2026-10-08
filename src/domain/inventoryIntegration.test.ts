import {it,expect} from 'vitest';
import {initialTags,validateTags,selectConfiguredShape,validConfiguredTag,tagSnapshot,sorted,resolveAnti,type HangingModel} from './idTags';
import {blankItem} from './model';
import {parseItem} from './validation';
import {getTagPreview} from './presentation';
it('a user-created Hanging model survives the public item and preview boundary',()=>{
 const c=structuredClone(initialTags);const m:HangingModel={key:'custom_123456789abc',name_en:'New shape',name_es:'Nueva forma',icon:'closures/uploads/12345678-1234-1234-1234-123456789abc-a-320.webp',active:true,display_order:8,sizes:[{id:'small',name_en:'Small',name_es:'Pequeña',width:3,height:2,active:true}]};c.hanging.push(m);validateTags(c);
 const i=selectConfiguredShape(c,{...blankItem(),size_code:'M',width_cm:2.5},m.key as `custom_${string}`);expect(validConfiguredTag(c,i)).toBe(true);expect(parseItem(i).tagShape).toBe(m.key);expect(getTagPreview({...i,tag_snapshot:tagSnapshot(c,i)},'en').customIcon).toBe(m.icon);
 const before=structuredClone(i);m.active=false;m.deleted=true;expect(validConfiguredTag(c,i)).toBe(false);expect(sorted(c.hanging).some(v=>v.key===m.key)).toBe(false);expect(i).toEqual(before);
});
it('a new Anti-fall model resolves from a valid mapping and archival invalidates it',()=>{
 const c=structuredClone(initialTags);c.anti.push({key:'custom_abcdef012345',name_en:'New plate',name_es:'Nueva placa',icon:'/icons/id-tag-anti-fall.svg',active:true,display_order:8,width:6,height:3});c.mapping=c.mapping.map(v=>v.size==='L'?{...v,model:'custom_abcdef012345'}:v);validateTags(c);expect(resolveAnti(c,{size_code:'L',width_cm:3})?.key).toBe('custom_abcdef012345');c.anti.at(-1)!.active=false;c.anti.at(-1)!.deleted=true;expect(resolveAnti(c,{size_code:'L',width_cm:3})).toBeUndefined();expect(resolveAnti(c,{size_code:'2XS',width_cm:1})?.key).toBe('micro');
});

