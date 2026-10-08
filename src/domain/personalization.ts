import type {Item,Personalization} from './model';
import {extrasFor} from './extras';
export const nameDecorations=['heart','star','paw','bone','crown'] as const;
export type NameDecoration=typeof nameDecorations[number];
export const informationIcons=['phone','neutered','address','email'] as const;
export type InformationIcon=typeof informationIcons[number];
export function getInformationIcons(item:Item):InformationIcon[]{
 const x=extrasFor(item);
 const values={phone:item.tag_phone,address:x.selected.includes('address')?x.address:'',neutered:x.selected.includes('neutered')?x.neutered:'',email:item.tagEmail||''};
 return informationIcons.filter(k=>values[k].trim());
}
/** Opening an accordion is deliberately absent from this domain API. */
export function selectPersonalization(item:Item,type:Personalization):Item{
 return {...item,personalization_type:type,decorationIcon:type==='none'?undefined:item.decorationIcon,
 informationIcons:type==='none'?[]:getInformationIcons(item),
 personalization_notes:type===item.personalization_type?item.personalization_notes:'',
 attachments:type==='drawing'||type==='dog_photo'?item.attachments.filter(a=>a.purpose===type):[]};
}
export function selectNameDecoration(item:Item,name:NameDecoration|undefined):Item{
 const media=item.personalization_type==='drawing'||item.personalization_type==='dog_photo';
 return {...selectPersonalization(item,media?item.personalization_type:'decoration'),decorationIcon:name};
}
export function validatePersonalization(item:Item):string[]{
 const errors:string[]=[];
 if(!['none','decoration','drawing','dog_photo'].includes(item.personalization_type)||item.personalization_notes.length>2000)errors.push('personalization');
 if(item.decorationIcon&&!nameDecorations.some(k=>k===item.decorationIcon))errors.push('personalization');
 if(item.personalization_type==='none'&&(item.decorationIcon||item.informationIcons?.length))errors.push('personalization');
 if(item.personalization_type==='decoration'&&!item.decorationIcon&&!getInformationIcons(item).length)errors.push('personalization');
 if(item.informationIcons?.some(k=>!informationIcons.some(v=>v===k)||!getInformationIcons(item).some(v=>v===k)))errors.push('personalization');
 if(['drawing','dog_photo'].includes(item.personalization_type)&&!item.attachments.length)errors.push('attachment');
 if(item.attachments.length>1||item.attachments.some(a=>a.purpose!==item.personalization_type||!['ready','linked'].includes(a.status)))errors.push('attachment');
 return [...new Set(errors)];
}
export const validPersonality=(item:Item)=>validatePersonalization(item).length===0;
