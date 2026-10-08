import {AdminError,availabilityKey,nextStatuses,validHeroConfiguration,type ProductionStatus,type ProductionDetail,type CatalogAvailability,type Availability,type HeroConfiguration,type HeroImage} from '../domain/admin';
import {sizes,validPair,type Order} from '../domain/model';
const validAvailability=(v:Availability)=>!!v.designId&&Number.isFinite(v.width)&&v.width>=0&&Number.isSafeInteger(v.revision)&&v.revision>=0&&typeof v.enabled==='boolean'&&(v.size===undefined||typeof v.size==='string'&&(v.width===0?sizes.some(s=>s.code===v.size):validPair(v.size,v.width)));
export interface OrderDateFilter {from?:string;to?:string}
export interface AdminRepository {
 authorized():Promise<boolean>;
 list(search:string,status:ProductionStatus|'',page:number,dates?:OrderDateFilter):Promise<Order[]>;
 deliveredWeek(search:string,dates?:OrderDateFilter):Promise<{orders:Order[];total:number}>;
 detail(id:string):Promise<ProductionDetail|null>;
 status(order:Order,next:ProductionStatus,reason?:string):Promise<ProductionDetail>;
 note(order:Order,note:string):Promise<ProductionDetail>;
 catalog():Promise<CatalogAvailability>;
 renameDesign?(id:string,previous:string,code:string):Promise<void>;
 deleteDesign?(id:string,version:string):Promise<void>;
 collection?(designId:string,name:string,revision:number):Promise<{collection_override:string|null;collection_revision:number}>;
 availability(change:Availability):Promise<Availability>;
 availabilityBatch(changes:Availability[]):Promise<Availability[]>;
 hero():Promise<HeroConfiguration>;
 saveHero(configuration:HeroConfiguration):Promise<HeroConfiguration>;
}
export interface HeroImageSource {load():HeroImage[]|Promise<HeroImage[]>}
export function createAdminApplication(repository:AdminRepository,source:HeroImageSource){
 async function run<T>(work:()=>Promise<T>):Promise<T>{
  try{if(!await repository.authorized())throw new AdminError('Unauthorized');return await work();}
  catch(e){if(e instanceof AdminError)throw e;const message=String((e as {message?:string})?.message||'');throw new AdminError(/OWNER_REQUIRED|permission denied|AUTH_REQUIRED/.test(message)?'Unauthorized':/STATE_CONFLICT/.test(message)?'Conflict':/INVALID_TRANSITION/.test(message)?'InvalidStatusTransition':/CATALOG_UNAVAILABLE/.test(message)?'CatalogUnavailable':'PersistenceError');}
 }
 return {
  authorized:repository.authorized,
  list:(search:string,status:ProductionStatus|'',page:number,dates?:OrderDateFilter)=>run(()=>{if(dates&&(Object.values(dates).some(v=>!Number.isFinite(Date.parse(v)))||dates.from&&dates.to&&dates.from>=dates.to))throw new AdminError('PersistenceError');return repository.list(search.trim().replace(/\s+/g,' '),status,Math.max(0,page),dates);}),
  deliveredWeek:(search:string,dates?:OrderDateFilter)=>run(()=>{if(dates&&(Object.values(dates).some(v=>!Number.isFinite(Date.parse(v)))||dates.from&&dates.to&&dates.from>=dates.to))throw new AdminError('PersistenceError');return repository.deliveredWeek(search.trim().replace(/\s+/g,' '),dates);}),
  detail:(id:string)=>run(async()=>{const detail=await repository.detail(id);if(!detail)throw new AdminError('OrderNotFound');return detail;}),
  status:(order:Order,next:ProductionStatus,reason='')=>run(()=>{if(!nextStatuses(order.status).includes(next))throw new AdminError('InvalidStatusTransition');if(reason.length>1000||reason&&next!=='cancelled')throw new AdminError('PersistenceError');return repository.status(order,next,reason.trim());}),
  note:(order:Order,note:string)=>run(()=>{if(note.length>4000)throw new AdminError('PersistenceError');return repository.note(order,note);}),
  catalog:()=>run(()=>repository.catalog()),
  renameDesign:(id:string,previous:string,code:string)=>run(()=>{const clean=code.trim().toUpperCase();if(!/^[A-Z0-9][A-Z0-9_-]{0,39}$/.test(clean)||!repository.renameDesign)throw new AdminError('PersistenceError');return repository.renameDesign(id,previous,clean);}),
  deleteDesign:(id:string,version:string)=>run(()=>{if(!id||!version||!repository.deleteDesign)throw new AdminError('PersistenceError');return repository.deleteDesign(id,version);}),
  collection:(designId:string,name:string,revision:number)=>run(()=>{const clean=name.trim().replace(/\s+/g,' ').normalize('NFC');if(!designId||clean.length>80||/[\x00-\x1f]/.test(clean)||!Number.isSafeInteger(revision)||revision<0||!repository.collection)throw new AdminError('PersistenceError');return repository.collection(designId,clean,revision);}),availability:(value:Availability)=>run(()=>{if(!validAvailability(value))throw new AdminError('PersistenceError');return repository.availability(value);}),
  availabilityBatch:(values:Availability[])=>run(()=>{if(!values.length||values.length>500||new Set(values.map(v=>availabilityKey(v))).size!==values.length||values.some(v=>!validAvailability(v)))throw new AdminError('PersistenceError');return repository.availabilityBatch(values);}),
  hero:()=>run(async()=>{const configuration=await repository.hero();if(!validHeroConfiguration(configuration))throw new AdminError('HeroConfigurationError');return {source:await source.load(),configuration};}),
  saveHero:(value:HeroConfiguration)=>run(()=>{if(!validHeroConfiguration(value))throw new AdminError('HeroConfigurationError');return repository.saveHero(value);})
 };
}
