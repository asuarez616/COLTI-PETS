import {validPair,type Design,type Order,type Status} from './model';
export const productionStatuses=['new','in_progress','ready','delivered','cancelled'] as const;
export type ProductionStatus=typeof productionStatuses[number];
export const productionStatus=(status:Status):ProductionStatus=>status==='finished'?'ready':status;
export const statusLabel:Record<ProductionStatus,string>={new:'New',in_progress:'In progress',ready:'Ready',delivered:'Delivered',cancelled:'Cancelled'};
export function nextStatuses(status:Status):ProductionStatus[]{
 const next:Record<ProductionStatus,ProductionStatus[]>={new:['in_progress','cancelled'],in_progress:['new','ready','cancelled'],ready:['in_progress','delivered','cancelled'],delivered:[],cancelled:[]};
 return next[productionStatus(status)];
}
export type AdminErrorCode='Unauthorized'|'OrderNotFound'|'InvalidStatusTransition'|'CatalogUnavailable'|'HeroConfigurationError'|'DriveSyncError'|'PersistenceError'|'Conflict';
export class AdminError extends Error {constructor(public readonly code:AdminErrorCode){super(code);}}
export interface ProductionDetail {order:Order;note:string;cancellationReason?:string;deliveredAt?:string}
export interface Availability {designId:string;width:number;size?:string;enabled:boolean;revision:number}
export interface CatalogAvailability {designs:Design[];overrides:Availability[]}
export const availabilityKey=(a:Pick<Availability,'designId'|'width'|'size'>)=>a.designId+':'+(a.size||'')+':'+a.width;
export function availabilityEnabled(overrides:Availability[],designId:string,width:number,size=''):boolean {
 const exact=overrides.find(a=>a.designId===designId&&(a.size||'')===size&&a.width===width);
 return exact?.enabled??(size&&width>0?overrides.find(a=>a.designId===designId&&!a.size&&a.width===width)?.enabled:true)??true;
}
export function availableCatalog(designs:Design[],overrides:Availability[]):Design[]{return designs.map(d=>({...d,active:d.active&&availabilityEnabled(overrides,d.id,0),compatibility:d.compatibility.filter(c=>validPair(c.size_code,c.width_cm)&&availabilityEnabled(overrides,d.id,0,c.size_code)&&availabilityEnabled(overrides,d.id,c.width_cm,c.size_code))}));}
export interface HeroImage {id:string;name:string;width:number;height:number;variants:{file:string;width:number;height:number;bytes:number}[]}
export interface HeroConfiguration {revision:number;images:{id:string;active:boolean;deleted?:boolean}[]}
export function configuredHero(source:HeroImage[],configuration:HeroConfiguration):HeroImage[]{
 if(configuration.revision===0&&configuration.images.length===0)return source;
 return configuration.images.filter(i=>i.active&&!i.deleted).flatMap(i=>source.filter(s=>s.id===i.id));
}
export function validHeroConfiguration(value:HeroConfiguration):boolean {return Number.isSafeInteger(value.revision)&&value.revision>=0&&value.images.length<=500&&new Set(value.images.map(i=>i.id)).size===value.images.length&&value.images.every(i=>typeof i.id==='string'&&i.id.length>0&&i.id.length<=200&&typeof i.active==='boolean');}
