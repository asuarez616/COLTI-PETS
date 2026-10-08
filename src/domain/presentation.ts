import {getCollarConfiguration,toItem,type CollarConfiguration} from './configuration';
import {extraEntries,extrasFor} from './extras';
import {tagDescription} from './tags';
import {getInformationIcons} from './personalization';
import {translator,type TextKey} from '../i18n';
import {summaryLabels} from '../i18n';
import type {Item,Locale,Order} from './model';
export function readablePhone(value:string){
 const compact=value.replace(/[\s().-]/g,'');
 const german=compact.match(/^\+49(\d{3})(\d{3,4})(\d{4})$/);
 if(german)return `+49 ${german[1]} ${german[2]} ${german[3]}`;
 const american=compact.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
 return american?`+1 ${american[1]} ${american[2]} ${american[3]}`:value;
}
const normalized=(value:Item|CollarConfiguration)=>'tag' in value?value:getCollarConfiguration(value);
export function getTagSummary(value:Item|CollarConfiguration,locale:Locale){
 const collar=normalized(value),item=toItem(collar),t=translator(locale),description=tagDescription(item,locale);
 const extras:{key:string;label:string;value:string}[]=extraEntries(item,locale).map(e=>({...e,value:e.key==='phones'?e.value.split('\n').map(readablePhone).join('\n'):e.value}));
 if(collar.tag.email?.trim())extras.push({key:'email',label:t('email'),value:collar.tag.email});
 return {type:collar.tag.type,shape:collar.tag.shape,style:description.style||t(item.tag_type),size:description.size,name:collar.tag.petName,phone:readablePhone(collar.tag.phone),extras,informationIcons:getInformationIcons(item)};
}
export function getCollarSummary(value:Item|CollarConfiguration,locale:Locale){
 const collar=normalized(value),item=toItem(collar),t=translator(locale);
 const generated=item.personalization_type==='decoration'?[item.decorationIcon?`Name decoration: ${item.decorationIcon}`:'',item.informationIcons?.length?`Information icons: ${item.informationIcons.join(', ')}`:'',item.tagEmail?`Email: ${item.tagEmail}`:'']:[];
 const notes=item.personalization_notes.split('\n').filter(line=>!generated.includes(line)).join('\n');
 return {id:collar.id,name:collar.tag.petName,designId:collar.designId,sizeWidth:`${collar.size} · ${collar.widthCm.toFixed(1)} cm`,fastening:('closure_snapshot' in value&&(value as import('./model').Snapshot).closure_snapshot?.[locale==='es'?'name_es':'name_en'])||t(collar.fastening as TextKey)||collar.fastening,tag:getTagSummary(collar,locale),fontNumber:collar.fontNumber,personalization:t(collar.personalization.type),notes,attachments:item.attachments};
}
export function getOrderPresentation(order:Order,locale:Locale){return {code:order.order_code,customer:{...order.customer_snapshot},collars:order.items.map(item=>({...getCollarSummary(item,locale),design:item.design,font:item.font}))};}
export function getSummaryRows(item:Item,locale:Locale,designCode:string){
 const summary=getCollarSummary(item,locale),labels=summaryLabels[locale],t=translator(locale);
 return {collar:[{key:'design',label:labels.design,value:designCode},{key:'size',label:labels.size,value:summary.sizeWidth},{key:'fastening',label:labels.collar,value:summary.fastening}],tag:[{key:'style',label:t('style'),value:[summary.tag.style,summary.tag.size].filter(Boolean).join('\n')},{key:'name',label:labels.pet,value:summary.name},{key:'phone',label:locale==='es'?'Teléfono':'Phone',value:summary.tag.phone},...summary.tag.extras]};
}
/** Shared read-only view model for the collar facts shown in review, confirmation and exports. */
export function getCollarDetailRows(item:Item,locale:Locale,designCode:string,{includePetName=true,includeEmptyExtra=true,includeNotesInTag=true,fontNumber=item.font_number}:{includePetName?:boolean;includeEmptyExtra?:boolean;includeNotesInTag?:boolean;fontNumber?:number}={}){
 const summary=getCollarSummary(item,locale),labels=summaryLabels[locale],t=translator(locale),extras=getReviewTagExtras(item,locale);
 const tag=[
  {key:'style',label:locale==='es'?'Estilo de placa':'Tag style',value:summary.tag.style},
  ...(summary.tag.size?[{key:'tag-size',label:locale==='es'?'Tamaño de placa':'Tag size',value:summary.tag.size}]:[]),
  ...(includePetName?[{key:'name',label:labels.pet,value:summary.name}]:[]),
  {key:'phone',label:locale==='es'?'Teléfono':'Phone',value:summary.tag.phone},
  ...extras,
  ...(includeEmptyExtra&&!extras.length?[{key:'extra',label:labels.extra,value:locale==='es'?'Sin texto adicional':'No extra text'}]:[]),
  ...(includeNotesInTag&&summary.notes.trim()?[{key:'notes',label:labels.notes,value:summary.notes}]:[])
 ];
 const personalization=getReviewPersonalizations(item,locale).join('\n')||t('none');
 return {collar:[{key:'design',label:labels.design,value:designCode},{key:'size',label:labels.size,value:summary.sizeWidth},{key:'fastening',label:labels.collar,value:summary.fastening}],tag,font:{key:'font',label:labels.font,value:String(fontNumber).padStart(2,'0')},personalization:{key:'personalization',label:labels.personalization,value:personalization},notes:summary.notes,attachments:summary.attachments};
}
/** Pure preview data: the renderer has no form or selection responsibilities. */
export function getTagPreview(value:Item|CollarConfiguration,locale:Locale){
 const collar=normalized(value),tag=getTagSummary(collar,locale);
 const extras=extrasFor(toItem(collar)),decorated=collar.personalization.type==='decoration';
 const lines=[{key:'phone',value:tag.phone,icon:tag.informationIcons.includes('phone')?'phone':undefined},...tag.extras.flatMap(e=>e.key==='family'?[{key:'family-name',value:extras.familyName,icon:decorated?'user':undefined},{key:'family-phone',value:readablePhone(extras.familyPhone),icon:decorated?'phone':undefined}]:[{key:e.key,value:e.value,icon:e.key==='phones'?(decorated?'phone':undefined):tag.informationIcons.find(k=>k===e.key)}])].filter(e=>e.value.trim());
 return {customIcon:collar.tag.snapshot?.model.key.startsWith('custom_')?collar.tag.snapshot.model.icon:undefined,dimensions:collar.tag.snapshot?{width:collar.tag.snapshot.width,height:collar.tag.snapshot.height}:undefined,hanging:tag.type==='hanging',shape:tag.type==='hanging'?(tag.shape||'circle'):'anti-fall',name:tag.name,nameDecoration:collar.personalization.type!=='none'?collar.personalization.nameDecoration:undefined,lines,informationIcons:tag.informationIcons};
}

/** Step 10 lists the same selected personalization options as Step 9. */
export function getReviewPersonalizations(item:Item,locale:Locale):string[]{
 const t=translator(locale),selected:string[]=[];
 if(item.personalization_type==='none')return selected;
 if(item.personalization_type==='decoration'||item.decorationIcon||item.informationIcons?.length){
  selected.push(item.decorationIcon?`${t('decoration')} · ${t(item.decorationIcon)}`:t('decoration'));
 }
 if(item.personalization_type==='drawing'||item.personalization_type==='dog_photo')selected.push(t(item.personalization_type));
 return selected;
}

/** Family contact shares two input views; Review includes all entered contact data. */
export function getReviewTagExtras(item:Item,locale:Locale){
 const entries=getTagSummary(item,locale).extras;
 const extras=extrasFor(item);
 if(!extras.selected.some(key=>key==='family'||key==='phones'))return entries;
 const contacts=extraEntries({...item,tagExtras:{...extras,selected:['family','phones']}},locale);
 const other=entries.filter(entry=>entry.key!=='family'&&entry.key!=='phones');
 return [...other,...contacts.map(entry=>({...entry,value:entry.key==='phones'?entry.value.split('\n').map(readablePhone).join('\n'):entry.value}))];
}
