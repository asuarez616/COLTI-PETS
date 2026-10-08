import {getFirstStep,getNextStep,type StepId} from './steps';
import {blankDraft,blankItem,uuid,type Draft,type Item} from '../domain/model';
import {parseDraft} from '../domain/validation';
export const DRAFT_KEY='colti-draft-v1';
export function restore():Draft{try{const raw=sessionStorage.getItem(DRAFT_KEY);if(raw)return parseDraft(JSON.parse(raw) as unknown);}catch{try{sessionStorage.removeItem(DRAFT_KEY);}catch{/* storage unavailable */}}return blankDraft();}
export function saveItem(d:Draft):Draft{const exists=d.items.some(i=>i.id===d.current.id);return {...d,step:getNextStep({draft:{...d,step:'review'}}),editing:false,items:exists?d.items.map(i=>i.id===d.current.id?d.current:i):[...d.items,d.current],key:uuid()};}
export function editItem(d:Draft,item:Item,step:StepId=getFirstStep('collar')):Draft{return {...d,current:structuredClone(item),editing:true,step};}
export function addItem(d:Draft):Draft{return {...d,current:blankItem(d.customer.phone),editing:false,step:getFirstStep('collar')};}
export function removeItem(d:Draft,id:string):Draft{return {...d,items:d.items.filter(i=>i.id!==id),key:uuid()};}
