import {isStepId,migrateLegacyStep} from '../configurator/steps';
import {validClosureKey,sizes,type Attachment,type Customer,type Design,type Draft,type FontRecord,type Item,type Order} from './model';
import {tagModels} from './tags';
import {nameDecorations,informationIcons} from './personalization';
export class InvalidData extends Error{constructor(){super('INVALID_DATA');}}
function ensure(value:unknown):asserts value{if(!value)throw new InvalidData();}
function record(v:unknown):Record<string,unknown>{ensure(v!==null&&typeof v==='object'&&!Array.isArray(v));return v as Record<string,unknown>;}
function text(v:unknown,max=2000):v is string{return typeof v==='string'&&v.length<=max;}
function number(v:unknown,min=0,max=Infinity):v is number{return typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;}
function oneOf(v:unknown,values:readonly string[]):boolean{return typeof v==='string'&&values.includes(v);}
const id=(v:unknown)=>text(v,200)&&v.length>0;
const email=(v:unknown)=>text(v,254)&&(v===''||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
export function parseCustomer(v:unknown):Customer{const x=record(v);ensure(text(x.name,200)&&text(x.phone,32));return {name:x.name,phone:x.phone};}
export function parseAttachment(v:unknown):Attachment{
 const x=record(v);ensure(id(x.id)&&text(x.original_filename,255)&&oneOf(x.mime_type,['image/jpeg','image/png','image/webp'])&&number(x.byte_size,1,10485760)&&Number.isInteger(x.byte_size)&&oneOf(x.status,['ready','linked'])&&id(x.object_path)&&oneOf(x.purpose,['drawing','dog_photo']));
 return {id:x.id,original_filename:x.original_filename,mime_type:x.mime_type,byte_size:x.byte_size,status:x.status,object_path:x.object_path,purpose:x.purpose} as Attachment;
}
export function parseUploadTicket(v:unknown):Pick<Attachment,'id'|'object_path'>{
 const x=record(v);ensure(x.status==='pending'||x.status==='ready');const a=parseAttachment({...x,status:'ready'});return {id:a.id,object_path:a.object_path};
}
export function parseItem(v:unknown):Item{
 const x={...record(v)};
 // PostgreSQL snapshots encode missing optional values as null.
 for(const k of ['tagShape','tagSize','tagWidthCm','tagHeightCm','tagExtras','decorationIcon','informationIcons','tagEmail'])if(x[k]===null)delete x[k];
 ensure(id(x.id)&&text(x.size_code,10)&&(x.size_code===''||sizes.some(s=>s.code===x.size_code))&&number(x.width_cm,0,3)&&text(x.design_id,200)&&validClosureKey(x.collar_type)&&oneOf(x.tag_type,['hanging','anti_fall'])&&text(x.pet_name,200)&&text(x.tag_phone,32)&&text(x.extra_text)&&number(x.font_number,1,2147483647)&&Number.isInteger(x.font_number)&&oneOf(x.personalization_type,['none','decoration','drawing','dog_photo'])&&text(x.personalization_notes)&&Array.isArray(x.attachments)&&x.attachments.length<=3);
 ensure(x.tagShape===undefined||tagModels.some(m=>m.shape===x.tagShape)||typeof x.tagShape==='string'&&/^custom_[a-f0-9]{12}$/.test(x.tagShape));ensure(x.tagSize===undefined||oneOf(x.tagSize,['small','medium','large','miniature']));ensure(x.tagWidthCm===undefined||number(x.tagWidthCm,0,20));ensure(x.tagHeightCm===undefined||number(x.tagHeightCm,0,20));
 ensure(x.decorationIcon===undefined||oneOf(x.decorationIcon,nameDecorations));ensure(x.informationIcons===undefined||(Array.isArray(x.informationIcons)&&x.informationIcons.length<=4&&new Set(x.informationIcons).size===x.informationIcons.length&&x.informationIcons.every(k=>oneOf(k,informationIcons))));ensure(x.tagEmail===undefined||email(x.tagEmail));
 let tagExtras:Item['tagExtras'];if(x.tagExtras!==undefined){const e=record(x.tagExtras);ensure(Array.isArray(e.selected)&&e.selected.length<=6&&new Set(e.selected).size===e.selected.length&&e.selected.every(k=>oneOf(k,['address','health','neutered','family','phones','other'])));for(const k of ['address','health','familyName','other'])ensure(text(e[k]));ensure(text(e.familyPhone,32)&&oneOf(e.neutered,['','Spayed','Neutered'])&&(e.phones===undefined||text(e.phones)));tagExtras={selected:e.selected,address:e.address,health:e.health,neutered:e.neutered,familyName:e.familyName,familyPhone:e.familyPhone,phones:e.phones,other:e.other} as Item['tagExtras'];}
 return {id:x.id,size_code:x.size_code,width_cm:x.width_cm,design_id:x.design_id,collar_type:x.collar_type,tag_type:x.tag_type,tagShape:x.tagShape,tagSize:x.tagSize,tagWidthCm:x.tagWidthCm,tagHeightCm:x.tagHeightCm,pet_name:x.pet_name,tag_phone:x.tag_phone,extra_text:x.extra_text,tagExtras,font_number:x.font_number,personalization_type:x.personalization_type,decorationIcon:x.decorationIcon,informationIcons:x.informationIcons,tagEmail:x.tagEmail,personalization_notes:x.personalization_notes,attachments:x.attachments.map(parseAttachment)} as Item;
}
export function parseDraft(v:unknown):Draft{
 const x=record(v);ensure(x.version===1||x.version===2||x.version===3);ensure(id(x.draftId)&&id(x.key)&&Array.isArray(x.items)&&x.items.length<=20&&(x.version===3?isStepId(x.step):number(x.step,0,16)&&Number.isInteger(x.step))&&typeof x.editing==='boolean');
 const items=x.items.map(parseItem);ensure(new Set(items.map(i=>i.id)).size===items.length);
 return {version:3,draftId:x.draftId,key:x.key,customer:parseCustomer(x.customer),items,current:parseItem(x.current),step:x.version===3?x.step:migrateLegacyStep(x.step as number),editing:x.editing} as Draft;
}
export function parseDesign(v:unknown):Design{
 const x=record(v);ensure(id(x.id)&&id(x.code)&&oneOf(x.type,['woven','printed'])&&id(x.image)&&typeof x.active==='boolean'&&typeof x.is_test_data==='boolean'&&text(x.asset_version,200)&&Array.isArray(x.compatibility));
 const compatibility=x.compatibility.map(v=>{const c=record(v);ensure(text(c.size_code,10)&&number(c.width_cm,0,3));return {size_code:c.size_code,width_cm:c.width_cm};});return {...x,compatibility} as unknown as Design;
}
export function parseFont(v:unknown):FontRecord{
 const x=record(v);ensure(number(x.number,1,2147483647)&&Number.isInteger(x.number)&&oneOf(x.state,['placeholder','ready'])&&text(x.label,200)&&(x.asset_path===null||text(x.asset_path,2000))&&(x.css_family===null||text(x.css_family,200))&&typeof x.active==='boolean'&&text(x.asset_version,200));
 if(x.presentation!==undefined&&x.presentation!==null){const p=record(x.presentation);ensure(p.size===undefined||number(p.size,1,500));ensure(p.weight===undefined||number(p.weight,1,1000));ensure(p.transform===undefined||text(p.transform,100));}
 return x as unknown as FontRecord;
}
export function parseOrder(v:unknown):Order{
 const x=record(v);ensure(id(x.id)&&id(x.order_code)&&oneOf(x.status,['new','in_progress','finished','ready','delivered','cancelled'])&&text(x.confirmed_at,100)&&Number.isFinite(Date.parse(x.confirmed_at))&&text(x.updated_at,100)&&Number.isFinite(Date.parse(x.updated_at))&&Array.isArray(x.items)&&x.items.length>=1&&x.items.length<=20);
 const items=x.items.map(v=>{const s=record(v);let closure_snapshot;if(s.closure_snapshot!==undefined){const c=record(s.closure_snapshot);ensure(c.key===s.collar_type&&text(c.name_en,100)&&text(c.name_es,100)&&text(c.icon,2000));closure_snapshot=c;}return {...parseItem(s),...(s.tag_snapshot?{tag_snapshot:s.tag_snapshot}:{}),...(closure_snapshot?{closure_snapshot}:{}),design:parseDesign({...record(s.design),compatibility:[]}),font:parseFont(s.font)};});
 let shipping_address:Order['shipping_address'];if(x.shipping_address!==undefined&&x.shipping_address!==null){const a=record(x.shipping_address);ensure(text(a.line1,120)&&text(a.line2,100)&&text(a.city,80)&&text(a.region,80)&&text(a.postalCode,16)&&text(a.country,80));shipping_address={line1:a.line1,line2:a.line2,city:a.city,region:a.region,postalCode:a.postalCode,country:a.country};}
 return {...x,customer_snapshot:parseCustomer(x.customer_snapshot),shipping_address,items} as unknown as Order;
}
export function parseOrderList(v:unknown):Order[]{ensure(Array.isArray(v));return v.map(parseOrder);}
