import {describe,it,expect,vi,afterEach} from 'vitest';
import {blankDraft,blankItem} from './model';
import {parseDraft,parseItem,parseAttachment,parseOrder,parseFont} from './validation';
import {restore,DRAFT_KEY} from '../configurator/state';
import {fixtureFonts,fixtureDesigns} from '../data/fixtures';
afterEach(()=>vi.unstubAllGlobals());
describe('runtime draft validation',()=>{
 it('migrates v1 and strips temporary UI state',()=>{const d={...blankDraft(),version:1,step:0,modalOpen:true,current:{...blankItem(),accordionOpen:true}};const result=parseDraft(d);expect(result.version).toBe(3);expect(result).not.toHaveProperty('modalOpen');expect(result.current).not.toHaveProperty('accordionOpen');});
 it.each([null,{},[],{...blankDraft(),version:99},{...blankDraft(),current:{}},{...blankDraft(),step:'11'},{...blankDraft(),items:[{},{}]}])('rejects corrupt structure %#',v=>{expect(()=>parseDraft(v)).toThrow('INVALID_DATA');});
 it('removes corrupt persisted data and returns a valid draft',()=>{const removeItem=vi.fn();vi.stubGlobal('sessionStorage',{getItem:()=>'{broken',removeItem});const d=restore();expect(removeItem).toHaveBeenCalledWith(DRAFT_KEY);expect(parseDraft(d)).toEqual(d);});
 it('handles storage access denial safely',()=>{vi.stubGlobal('sessionStorage',{getItem:()=>{throw Error('denied');},removeItem:()=>{throw Error('denied');}});expect(restore().step).toBe('customer-name');});
 it('preserves independent collars and editing context',()=>{const d=blankDraft();d.items=[{...blankItem(),pet_name:'Lola'},{...blankItem(),pet_name:'Max'}];d.editing=true;d.step='personalization';const restored=parseDraft(JSON.parse(JSON.stringify(d)));expect(restored.items.map(i=>i.pet_name)).toEqual(['Lola','Max']);expect(restored.editing).toBe(true);expect(restored.step).toBe('personalization');});
 it.each([{tagExtras:{selected:['unknown']}},{tagEmail:'broken'},{informationIcons:['fake']},{decorationIcon:'fake'},{font_number:Infinity},{pet_name:'x'.repeat(201)}])('rejects invalid nested fields %#',patch=>{expect(()=>parseItem({...blankItem(),...patch})).toThrow();});
});
describe('external data boundaries',()=>{
 it('accepts SQL snapshots with null optional fields',()=>{const time=new Date().toISOString();const item={...blankItem(),tag_type:'anti_fall',tagShape:null,tagSize:null,tagWidthCm:null,tagHeightCm:null,tagExtras:null,decorationIcon:null,informationIcons:null,tagEmail:null,design:fixtureDesigns[0],font:fixtureFonts[0]};const order=parseOrder({id:'o',order_code:'COLTI-US-0001',status:'new',confirmed_at:time,updated_at:time,customer_snapshot:{name:'Ana',phone:'+1 555 123 4567'},items:[item]});expect(order.items[0].tagExtras).toBeUndefined();expect(order.items[0].design.code).toBe(fixtureDesigns[0].code);});
 it.each([0,10485761,NaN])('rejects invalid attachment size %s',byte_size=>{expect(()=>parseAttachment({id:'a',original_filename:'a.png',mime_type:'image/png',byte_size,status:'ready',object_path:'a',purpose:'dog_photo'})).toThrow();});
 it('rejects unsupported file status/type and malformed orders',()=>{expect(()=>parseAttachment({id:'a',status:'pending'})).toThrow();expect(()=>parseOrder({items:[]})).toThrow();});
 it('accepts the supplied font records',()=>{expect(fixtureFonts.map(parseFont)).toHaveLength(36);});
});
