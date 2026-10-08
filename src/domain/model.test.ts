import {describe,it,expect} from 'vitest';
import {blankItem,changeSize,compatible,sizes,validPair,validPhone,validateItem} from './model';
import {fixtureDesigns,fixtureFonts} from '../data/fixtures';
import {addItem,editItem,removeItem,saveItem} from '../configurator/state';
import {blankDraft} from './model';
describe('canonical sizes and validation',()=>{
 it('keeps exact ranges, widths and weight references',()=>{expect(sizes.map(s=>[s.code,s.min,s.max,s.widths,s.weight])).toEqual([['2XS',17,25,[1],'1–2'],['XS',22,35,[1,1.5],'2–4'],['S',25,40,[1.5,2],'3–6'],['SM',30,45,[2],'6–12'],['M',32,50,[2.5],'12–18'],['ML',35,55,[2.5,3],'19–25'],['L',40,60,[3],'26–35'],['XL',44,65,[3],'36–45'],['2XL',47,70,[3],'>46']]);});
 it('rejects illegal pairs and unconfirmed weight logic',()=>{expect(validPair('XS',2)).toBe(false);expect(validPair('ML',3)).toBe(true);expect(validPair('2XL',3)).toBe(true);expect(validPair('unknown',1)).toBe(false);});
 it('validates phone strings without US-only restrictions',()=>{expect(validPhone('+593 99 123 4567')).toBe(true);expect(validPhone('+1 (555) 123-4567')).toBe(true);expect(validPhone('hello')).toBe(false);expect(validPhone('123')).toBe(false);});
 it('clears incompatible design while preserving independent fields',()=>{const designs=[{...fixtureDesigns[0],compatibility:[{size_code:'XS',width_cm:1}]}];const item={...blankItem(),size_code:'XS',width_cm:1,design_id:designs[0].id,pet_name:'Luna'};const changed=changeSize(item,'ML',designs);expect(changed.design_id).toBe('');expect(changed.pet_name).toBe('Luna');expect(changed.width_cm).toBe(0);expect(compatible({...designs[0],active:false},'XS',1)).toBe(false);});
 it('requires a reference for dog photo, not for none',()=>{const i={...blankItem(),size_code:'XS',width_cm:1,design_id:fixtureDesigns[0].id,pet_name:'Luna',tag_phone:'+593 99 123 4567',tagShape:'circle' as const,tagSize:'small',tagWidthCm:2.5,tagHeightCm:2.5};expect(validateItem(i,fixtureDesigns,fixtureFonts)).toEqual([]);expect(validateItem({...i,personalization_type:'dog_photo'},fixtureDesigns,fixtureFonts)).toContain('attachment');});
});
describe('multi-collar editing',()=>{
 it('preserves customer and sibling selections',()=>{const d=blankDraft();d.customer={name:'Ana',phone:'+593 99 123 4567'};d.current.pet_name='Luna';const first=saveItem(d);const second=addItem(first);second.current.pet_name='Sol';const both=saveItem(second);const edit=editItem(both,both.items[0]);edit.current.pet_name='Luna II';const saved=saveItem(edit);expect(saved.items.map(i=>i.pet_name)).toEqual(['Luna II','Sol']);expect(saved.customer).toEqual(d.customer);expect(removeItem(saved,saved.items[0].id).items[0].pet_name).toBe('Sol');expect(addItem(saved).current.tag_phone).toBe(d.customer.phone);});
});

