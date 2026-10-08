import type {Attachment,CollarType,Customer,Draft,Item,TagType} from './model';
import type {TagShape} from './tags';
import type {TagExtras} from './extras';
import {getInformationIcons,type InformationIcon,type NameDecoration} from './personalization';

export interface TagConfiguration {
 snapshot?:Item['tag_snapshot'];type:TagType;shape?:TagShape;size?:string;widthCm?:number;heightCm?:number;
 petName:string;phone:string;extraText:string;extras?:TagExtras;email?:string;
}
export type PersonalizationConfiguration=
 |{type:'none';notes?:string}
 |{type:'decoration';nameDecoration?:NameDecoration;informationIcons:InformationIcon[];notes?:string}
 |{type:'drawing'|'dog_photo';instructions:string;attachments:Attachment[];nameDecoration?:NameDecoration;informationIcons:InformationIcon[]};
export interface CollarConfiguration {
 id:string;size:string;widthCm:number;designId:string;fastening:CollarType;
 tag:TagConfiguration;fontNumber:number;personalization:PersonalizationConfiguration;
}
export interface OrderConfiguration {customer:Customer;collars:CollarConfiguration[]}
export function getCollarConfiguration(i:Item):CollarConfiguration{
 const personalization:PersonalizationConfiguration=i.personalization_type==='none'?{type:'none',notes:i.personalization_notes||undefined}:i.personalization_type==='decoration'?{type:'decoration',nameDecoration:i.decorationIcon,informationIcons:getInformationIcons(i),notes:i.personalization_notes||undefined}:{type:i.personalization_type,instructions:i.personalization_notes,attachments:i.attachments,nameDecoration:i.decorationIcon,informationIcons:getInformationIcons(i)};
 return {id:i.id,size:i.size_code,widthCm:i.width_cm,designId:i.design_id,fastening:i.collar_type,fontNumber:i.font_number,
 tag:{snapshot:i.tag_snapshot,type:i.tag_type,shape:i.tagShape,size:i.tagSize,widthCm:i.tagWidthCm,heightCm:i.tagHeightCm,petName:i.pet_name,phone:i.tag_phone,extraText:i.extra_text,extras:i.tagExtras,email:i.tagEmail},personalization};
}
/** Compatibility adapter: existing SQL/snapshots keep their established field names. */
export function toItem(c:CollarConfiguration):Item{
 const p=c.personalization;
 return {id:c.id,size_code:c.size,width_cm:c.widthCm,design_id:c.designId,collar_type:c.fastening,font_number:c.fontNumber,
 tag_snapshot:c.tag.snapshot,tag_type:c.tag.type,tagShape:c.tag.shape,tagSize:c.tag.size,tagWidthCm:c.tag.widthCm,tagHeightCm:c.tag.heightCm,pet_name:c.tag.petName,tag_phone:c.tag.phone,extra_text:c.tag.extraText,tagExtras:c.tag.extras,tagEmail:c.tag.email,
 personalization_type:p.type,decorationIcon:p.type!=='none'?p.nameDecoration:undefined,informationIcons:p.type!=='none'?p.informationIcons:[],attachments:p.type==='drawing'||p.type==='dog_photo'?p.attachments:[],
 personalization_notes:p.type==='drawing'||p.type==='dog_photo'?p.instructions:p.type==='decoration'?p.notes||'':('notes' in p?p.notes:'')||''};
}
export function getOrderConfiguration(d:Pick<Draft,'customer'|'items'>):OrderConfiguration{return {customer:{...d.customer},collars:d.items.map(getCollarConfiguration)};}
export function orderItems(d:Pick<Draft,'customer'|'items'>):Item[]{return getOrderConfiguration(d).collars.map(toItem);}
export function confirmationPayload(d:Draft){return {p_key:d.key,p_draft:d.draftId,p_customer:{...d.customer},p_items:orderItems(d).map(i=>({...i,attachments:i.attachments.map(a=>({id:a.id}))}))};}
