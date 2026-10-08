import {validConfiguredTag,tagTypeAvailable,type TagsConfig} from '../domain/idTags';
import {validClosure,type Closure} from '../domain/closures';
import {sizes,validName,validPhone,validPair,type Draft,type Design,type FontRecord} from '../domain/model';
import {getAvailableDesigns,validateCollar} from '../domain/rules';
import {validTag} from '../domain/tags';
import {validPersonality} from '../domain/personalization';
import type {TextKey} from '../i18n';

export const stepIds=['customer-name','customer-phone','size','width','design','fastening','tag-type','tag-shape','pet-name','tag-phone','tag-details','lettering','personalization','review','order-summary'] as const;
export type StepId=typeof stepIds[number];
export interface FlowContext {draft:Draft}
export interface StepContext extends FlowContext {designs:Design[];fonts:FontRecord[];catalogReady:boolean;closures?:Closure[];closuresReady?:boolean;tags?:TagsConfig|null;tagsReady?:boolean}
interface StepDefinition {id:StepId;title:TextKey;group:'customer'|'collar'|'order';progressKey?:string;isVisible:(c:FlowContext)=>boolean;validate:(c:StepContext)=>boolean;next?:(c:FlowContext)=>StepId;blockUntilValid?:boolean;requiresCatalog?:boolean}
const always=()=>true;
/** Navigation, conditional visibility, validation and progress share this ordered source. */
export const stepsConfig:readonly StepDefinition[]=[
 {id:'customer-name',title:'name',group:'customer',isVisible:always,validate:c=>validName(c.draft.customer.name)},
 {id:'customer-phone',title:'phone',group:'customer',isVisible:always,validate:c=>validPhone(c.draft.customer.phone),next:c=>c.draft.items.length?'order-summary':'size'},
 {id:'size',title:'size',group:'collar',isVisible:always,validate:c=>sizes.some(s=>s.code===c.draft.current.size_code)},
 {id:'width',title:'width',group:'collar',isVisible:c=>(sizes.find(s=>s.code===c.draft.current.size_code)?.widths.length||0)>1,validate:c=>validPair(c.draft.current.size_code,c.draft.current.width_cm)},
 {id:'design',title:'design',group:'collar',isVisible:always,requiresCatalog:true,validate:c=>getAvailableDesigns(c.designs,c.draft.current.size_code,c.draft.current.width_cm).some(d=>d.id===c.draft.current.design_id)},
 {id:'fastening',title:'collar',group:'collar',isVisible:always,blockUntilValid:true,validate:c=>c.closures?c.closuresReady!==false&&validClosure(c.draft.current,c.closures):['plastic_buckle','metal_buckle','martingale'].includes(c.draft.current.collar_type)},
 {id:'tag-type',title:'tag',group:'collar',progressKey:'tag',isVisible:always,blockUntilValid:true,validate:c=>c.tags!==undefined?!!c.tags&&tagTypeAvailable(c.tags,c.draft.current.tag_type,c.draft.current):['hanging','anti_fall'].includes(c.draft.current.tag_type)},
 {id:'tag-shape',title:'tag',group:'collar',progressKey:'tag',isVisible:c=>c.draft.current.tag_type==='hanging',blockUntilValid:true,validate:c=>c.tags!==undefined?!!c.tags&&validConfiguredTag(c.tags,c.draft.current):validTag(c.draft.current)},
 {id:'pet-name',title:'pet',group:'collar',isVisible:always,validate:c=>validName(c.draft.current.pet_name)},
 {id:'tag-phone',title:'tagphone',group:'collar',isVisible:always,validate:c=>validPhone(c.draft.current.tag_phone)},
 {id:'tag-details',title:'extra',group:'collar',isVisible:always,validate:always},
 {id:'lettering',title:'font',group:'collar',isVisible:always,requiresCatalog:true,validate:c=>c.fonts.some(f=>f.number===c.draft.current.font_number&&f.active)},
 {id:'personalization',title:'personalization',group:'collar',isVisible:always,blockUntilValid:true,validate:c=>validPersonality(c.draft.current)},
 {id:'review',title:'review',group:'collar',isVisible:always,requiresCatalog:true,validate:c=>validateCollar(c.draft.current,c.designs,c.fonts,c.tags).length===0&&(c.tags===undefined||!!c.tags&&validConfiguredTag(c.tags,c.draft.current))&&(!c.closures||c.closuresReady!==false&&validClosure(c.draft.current,c.closures))},
 {id:'order-summary',title:'order',group:'order',isVisible:always,requiresCatalog:true,validate:c=>validName(c.draft.customer.name)&&validPhone(c.draft.customer.phone)&&c.draft.items.length>0&&c.draft.items.length<=20&&c.draft.items.every(i=>!validateCollar(i,c.designs,c.fonts,c.tags).length&&(c.tags===undefined||!!c.tags&&validConfiguredTag(c.tags,i))&&(!c.closures||c.closuresReady!==false&&validClosure(i,c.closures)))},
];
export const isStepId=(v:unknown):v is StepId=>typeof v==='string'&&stepIds.includes(v as StepId);
export function getFirstStep(group:StepDefinition['group']):StepId{return stepsConfig.find(s=>s.group===group)!.id;}
export function getVisibleSteps(c:FlowContext){return stepsConfig.filter(s=>s.isVisible(c));}
export function getCurrentStep(c:FlowContext){const visible=getVisibleSteps(c);return visible.find(s=>s.id===c.draft.step)||visible.find(s=>stepIds.indexOf(s.id)>stepIds.indexOf(c.draft.step))||visible[visible.length-1];}
export function getNextStep(c:FlowContext):StepId{const current=getCurrentStep(c),visible=getVisibleSteps(c);return current.next?.(c)||visible[visible.indexOf(current)+1]?.id||current.id;}
export function getPreviousStep(c:FlowContext):StepId{const visible=getVisibleSteps(c),current=getCurrentStep(c);return visible[visible.indexOf(current)-1]?.id||current.id;}
export function canContinue(c:StepContext){const s=getCurrentStep(c);return (!s.requiresCatalog||c.catalogReady)&&s.validate(c);}
export function isContinueDisabled(c:StepContext){const s=getCurrentStep(c);return (!!s.requiresCatalog&&!c.catalogReady)||!!s.blockUntilValid&&!canContinue(c);}
export function getProgress(c:FlowContext){const current=getCurrentStep(c),visible=getVisibleSteps(c).filter(s=>s.group===current.group),keys=[...new Set(visible.map(s=>s.progressKey||s.id))],index=keys.indexOf(current.progressKey||current.id)+1;return {current:index,total:keys.length,percent:index/keys.length*100,group:current.group};}
/** Old notes/upload screens now belong to the personalization accordion. */
export function migrateLegacyStep(value:number):StepId{const map:StepId[]=['customer-name','customer-phone','size','width','design','fastening','tag-type','pet-name','tag-phone','tag-details','lettering','personalization','personalization','personalization','review','review','order-summary'];return map[value];}
