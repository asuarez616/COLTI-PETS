import type {StepId} from '../configurator/steps';
import {validatePersonalization,type NameDecoration,type InformationIcon} from './personalization';
import {validTag} from './tags';
export type Locale = 'en' | 'es';
export type CollarType = 'plastic_buckle' | 'metal_buckle' | 'martingale' | `custom_${string}`;
export const validClosureKey=(value:unknown):value is CollarType=>typeof value==='string'&&/^(plastic_buckle|metal_buckle|martingale|custom_[a-f0-9]{20})$/.test(value);
export type TagType = 'hanging' | 'anti_fall';
export type Personalization = 'none' | 'decoration' | 'drawing' | 'dog_photo';
export type Status = 'new' | 'in_progress' | 'finished' | 'ready' | 'delivered' | 'cancelled';
export interface Size { code:string; min:number; max:number; widths:number[]; weight:string }
export const sizes:Size[] = [
 {code:'2XS',min:17,max:25,widths:[1],weight:'1–2'}, {code:'XS',min:22,max:35,widths:[1,1.5],weight:'2–4'},
 {code:'S',min:25,max:40,widths:[1.5,2],weight:'3–6'}, {code:'SM',min:30,max:45,widths:[2],weight:'6–12'},
 {code:'M',min:32,max:50,widths:[2.5],weight:'12–18'}, {code:'ML',min:35,max:55,widths:[2.5,3],weight:'19–25'},
 {code:'L',min:40,max:60,widths:[3],weight:'26–35'}, {code:'XL',min:44,max:65,widths:[3],weight:'36–45'},
 {code:'2XL',min:47,max:70,widths:[3],weight:'>46'}
];
export interface Design {source_collection?:string;collection_override?:string|null;collection_revision?:number;id:string;code:string;type:'woven'|'printed';image:string;active:boolean;is_test_data:boolean;asset_version:string;compatibility:{size_code:string;width_cm:number}[]}
export interface FontRecord {id?:string;deleted?:boolean;asset_hash?:string;display_position?:number;number:number;display_order?:number;state:'placeholder'|'ready';label:string;asset_path:string|null;css_family:string|null;active:boolean;asset_version:string;presentation?:{size?:number;weight?:number;transform?:string}}
export interface Attachment {id:string;original_filename:string;mime_type:string;byte_size:number;status:'ready'|'linked';object_path:string;purpose:Personalization}
export interface Item {tag_snapshot?:import('./idTags').TagSnapshot;id:string;size_code:string;width_cm:number;design_id:string;collar_type:CollarType;tag_type:TagType;tagShape?:import('./tags').TagShape;tagSize?:string;tagWidthCm?:number;tagHeightCm?:number;pet_name:string;tag_phone:string;extra_text:string;tagExtras?:import('./extras').TagExtras;font_number:number;personalization_type:Personalization;decorationIcon?:NameDecoration;informationIcons?:InformationIcon[];tagEmail?:string;personalization_notes:string;attachments:Attachment[]}
export interface ClosureSnapshot {key:CollarType;name_en:string;name_es:string;icon:string}
export interface Snapshot extends Item {closure_snapshot?:ClosureSnapshot;design:Omit<Design,'compatibility'>;font:FontRecord}
export interface Customer {name:string;phone:string}
export interface ShippingAddress {line1:string;line2:string;city:string;region:string;postalCode:string;country:string}
export interface Order {id:string;order_code:string;status:Status;confirmed_at:string;updated_at:string;customer_snapshot:Customer;shipping_address?:ShippingAddress|null;items:Snapshot[];demo?:boolean}
export interface Draft {version:3;draftId:string;key:string;customer:Customer;items:Item[];current:Item;step:StepId;editing:boolean}
export const uuid = () => crypto.randomUUID();
export const blankItem = (phone=''):Item => ({id:uuid(),size_code:'',width_cm:0,design_id:'',collar_type:'plastic_buckle',tag_type:'hanging',pet_name:'',tag_phone:phone,extra_text:'',font_number:1,personalization_type:'none',personalization_notes:'',attachments:[]});
export const blankDraft = ():Draft => ({version:3,draftId:uuid(),key:uuid(),customer:{name:'',phone:''},items:[],current:blankItem(),step:'customer-name',editing:false});
export const validPair = (size:string,width:number) => !!sizes.find(s=>s.code===size)?.widths.includes(width);
export const compatible = (d:Design,size:string,width:number) => d.active && d.compatibility.some(c=>c.size_code===size && Number(c.width_cm)===width);
export const validPhone = (v:string) => /^[+\d().\s-]{7,32}$/.test(v.trim()) && v.replace(/\D/g,'').length>=7;
export const validName = (v:string) => v.trim().length>0 && v.length<=200;
export function validateItem(i:Item,designs:Design[],fonts:FontRecord[],configuredTagValid=false):string[] {
 const e:string[]=[];
 if(!validPair(i.size_code,i.width_cm)) e.push('size');
 if(!designs.some(d=>d.id===i.design_id && compatible(d,i.size_code,i.width_cm))) e.push('design');
 if(!validClosureKey(i.collar_type))e.push('collar');
 if(!['hanging','anti_fall'].includes(i.tag_type))e.push('tag');
 if(!configuredTagValid&&!validTag(i))e.push('tag_selection');
 if(!validName(i.pet_name))e.push('pet_name');
 if(!validPhone(i.tag_phone))e.push('tag_phone');
 if(!fonts.some(f=>f.number===i.font_number && f.active))e.push('font');
 if(!['none','decoration','drawing','dog_photo'].includes(i.personalization_type) || i.personalization_notes.length>2000 || i.extra_text.length>2000)e.push('personalization');
 e.push(...validatePersonalization(i));
 if(i.attachments.length>1 || i.attachments.some(a=>!['ready','linked'].includes(a.status)))e.push('attachment');
 return [...new Set(e)];
}
export function changeSize(i:Item,code:string,designs:Design[]):Item {
 const s=sizes.find(s=>s.code===code); const width=s?.widths.includes(i.width_cm)?i.width_cm:s?.widths.length===1?s.widths[0]:0;
 return {...i,size_code:code,width_cm:width,design_id:designs.some(d=>d.id===i.design_id&&compatible(d,code,width))?i.design_id:''};
}
export const inches = (cm:number) => cm/2.54;
export const pounds = (kg:number) => kg*2.2046226218;

