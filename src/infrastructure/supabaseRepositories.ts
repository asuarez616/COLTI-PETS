import {prepareAttachmentFile} from './attachmentFile';
import {localConfigurationEnabled,readLocalConfiguration} from './localConfiguration';
import {requestSignature} from '../application/confirmation';
import type {Repositories} from '../application/repositories';
import {parseAttachment,parseUploadTicket,parseDesign,parseDraft,parseFont,parseOrder,parseOrderList} from '../domain/validation';
import {confirmationPayload,orderItems} from '../domain/configuration';
import {createClient} from '@supabase/supabase-js';
import {fixtureDesigns,fixtureFonts} from '../data/fixtures';
import {driveDesigns} from '../catalog/drive';
import {availableCatalog} from '../domain/admin';
import {mirrorLocalOrders,localOrderMirrorEnabled,localOrderAttachmentUrl} from './localOrderMirror';
import {compatible,uuid,validateItem,validName,validPhone,type Attachment,type Design,type Draft,type FontRecord,type Order,type Status} from '../domain/model';
const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase=url&&key?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}):null;
export const mode=supabase?'live':import.meta.env.VITE_ALLOW_DEMO!=='false'?'demo':'unconfigured';
const demoKey='colti-demo-orders-v1';
// Reuse verified upload bytes for previews in this session, avoiding another storage round trip.
const uploadedPreviews=new Map<string,Blob>();
const localDesigns=driveDesigns.length?driveDesigns:fixtureDesigns;
// Keep previously saved local drafts valid after importing the Drive catalogue.
const localConfirmationDesigns=[...localDesigns,...fixtureDesigns.filter(d=>!localDesigns.some(current=>current.id===d.id))];
let demoQueue:Promise<void>=Promise.resolve();
let authPromise:Promise<void>|null=null;
async function session(){
 if(!supabase)throw new Error('SUPABASE_NOT_CONFIGURED');
 if(!authPromise)authPromise=(async()=>{
  const {data:{session},error}=await supabase!.auth.getSession();if(error)throw error;
  if(!session){const {error}=await supabase!.auth.signInAnonymously();if(error)throw error;}
 })().finally(()=>{authPromise=null;});
 await authPromise;
}
export function imageUrl(path:string,bucket='catalog-images'){
 if(/^https?:|^data:|^blob:|^\//.test(path))return path;
 return supabase?supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl:path;
}
function normalize(value:unknown):Order{const order=parseOrder(value);return {...order,items:order.items.map(i=>({...i,design:{...i.design,image:imageUrl(i.design.image)},font:{...i.font,asset_path:i.font.asset_path?imageUrl(i.font.asset_path,'font-assets'):null}}))};}
export async function loadCatalog():Promise<{designs:Design[];fonts:FontRecord[]}> {
 if(mode==='unconfigured')throw new Error('SUPABASE_NOT_CONFIGURED');
 if(!supabase)return {designs:localConfigurationEnabled?availableCatalog(localDesigns,(await readLocalConfiguration()).overrides):localDesigns,fonts:fixtureFonts};
 const [d,f]=await Promise.all([supabase.from('designs').select('*,design_compatibility(size_code,width_cm)').eq('active',true).eq('deleted',false).order('display_order'),supabase.from('fonts').select('*').eq('active',true).order('display_order')]);
 if(d.error)throw d.error;if(f.error)throw f.error;
 const collections=await supabase.from('catalog_categories').select('name,active,deleted');if(collections.error)throw collections.error;
 const inactiveCollections=new Set(collections.data.filter(c=>!c.deleted&&!c.active).map(c=>c.name.toLocaleLowerCase('es')));
 const availability=await supabase.from('catalog_availability').select('*');if(availability.error)throw availability.error;
 const sizeAvailability=await supabase.from('catalog_size_availability').select('*');if(sizeAvailability.error)throw sizeAvailability.error;
 return {designs:availableCatalog(d.data.filter(v=>v.type!=='printed'||!inactiveCollections.has((v.collection_override||v.source_collection||'Sin colección').toLocaleLowerCase('es'))).map(v=>parseDesign({...v,image:imageUrl(v.image_path),compatibility:v.design_compatibility})),[...availability.data.map(v=>({designId:v.design_id,width:Number(v.width),enabled:v.enabled,revision:v.revision})),...sizeAvailability.data.map(v=>({designId:v.design_id,size:v.size_code,width:Number(v.width),enabled:v.enabled,revision:v.revision}))]),fonts:f.data.map((v,index)=>parseFont({...v,display_position:index+1,asset_path:v.asset_path?imageUrl(v.asset_path,'font-assets'):null}))};
}
export async function findOrder(key:string):Promise<Order|null>{
 if(!supabase)return readDemo().find(o=>(o as Order &{key:string}).key===key)||null;
 await session();const {data,error}=await supabase.rpc('find_order',{p_key:key});if(error)throw error;return data?normalize(data):null;
}
export async function confirmOrder(input:Draft):Promise<Order>{
 const draft=parseDraft(input);
 if(!supabase){
  if(mode!=='demo')throw new Error('SUPABASE_NOT_CONFIGURED');
  const previous=demoQueue;let release!:()=>void;demoQueue=new Promise<void>(resolve=>{release=resolve;});await previous;try{
  const existing=await findOrder(draft.key);if(existing){const hash=(existing as Order &{requestHash?:string}).requestHash||await requestSignature({...draft,customer:existing.customer_snapshot,items:existing.items.map(i=>({...i,attachments:i.attachments.map(a=>({...a,status:'ready'}))}))});if(hash!==await requestSignature(draft))throw new Error('IDEMPOTENCY_CONFLICT');return existing;}
  if(!validName(draft.customer.name)||!validPhone(draft.customer.phone)||draft.items.length<1||draft.items.length>20||draft.items.some(i=>validateItem(i,localConfirmationDesigns,fixtureFonts).length))throw new Error('INVALID_ORDER');
  const currentCatalog=await loadCatalog();if(draft.items.some(i=>validateItem(i,currentCatalog.designs,fixtureFonts).length))throw new Error('INVALID_ORDER');
  const orders=readDemo();const order:Order & {key:string;requestHash:string}={id:uuid(),key:draft.key,requestHash:await requestSignature(draft),order_code:`DEMO-COLTI-US-${String(orders.length+1).padStart(4,'0')}`,status:'new',confirmed_at:new Date().toISOString(),updated_at:new Date().toISOString(),customer_snapshot:{...draft.customer},demo:true,items:orderItems(draft).map(i=>({...i,attachments:i.attachments.map(a=>({...a,status:'linked'})),design:{...localConfirmationDesigns.find(d=>d.id===i.design_id)!},font:{...fixtureFonts.find(f=>f.number===i.font_number)!}}))};
  sessionStorage.setItem(demoKey,JSON.stringify([order,...orders]));void mirrorLocalOrders([order,...orders],demoFile).catch(()=>{/* Local orders remain saved and retry on refresh. */});return order;
  }finally{release();}
 }
 await session();
 const {data,error}=await supabase.rpc('confirm_order',confirmationPayload(draft));
 if(error)throw error;return normalize(data);
}
function blobDb():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const r=indexedDB.open('colti-demo-files',1);r.onupgradeneeded=()=>r.result.createObjectStore('files');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function storeFile(id:string,file:Blob|null):Promise<void>{const db=await blobDb();try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction('files','readwrite');if(file)tx.objectStore('files').put(file,id);else tx.objectStore('files').delete(id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}finally{db.close();}}
async function demoFile(id:string):Promise<Blob>{const db=await blobDb();try{return await new Promise((resolve,reject)=>{const r=db.transaction('files').objectStore('files').get(id);r.onsuccess=()=>r.result?resolve(r.result):reject(new Error('FILE_UNAVAILABLE'));r.onerror=()=>reject(r.error);});}finally{db.close();}}
async function attachmentOperation(body:Record<string,unknown>){
 const token=(await supabase!.auth.getSession()).data.session?.access_token;
 const response=await fetch('/api/store/attachments',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(body)});
 if(response.status===404||response.status===405||!response.headers.get('content-type')?.includes('application/json'))return supabase!.functions.invoke('attachments',{body});
 const data=await response.json();return {data,error:response.ok?null:new Error(data.error||'UPLOAD_FAILED')};
}
export async function upload(file:File,draft:Draft,onState:(state:string)=>void):Promise<Attachment>{
 if(!['drawing','dog_photo'].includes(draft.current.personalization_type))throw new Error('INVALID_FILE');
 if(file.size===0||file.size>10485760||!['image/jpeg','image/png','image/webp','image/svg+xml'].includes(file.type)||draft.current.attachments.length>=1)throw new Error('INVALID_FILE');
 // SVG is rasterized to PNG for the existing private storage contract.
 file=await prepareAttachmentFile(file);
 onState('uploading');
 if(!supabase){
  if(mode!=='demo')throw new Error('SUPABASE_NOT_CONFIGURED');
  const id=uuid();await storeFile(id,file);return {id,original_filename:file.name,mime_type:file.type,byte_size:file.size,status:'ready',object_path:id,purpose:draft.current.personalization_type};
 }
 await session();let attachment:Pick<Attachment,'id'|'object_path'>|undefined;
 try{
  const {data,error}=await attachmentOperation({action:'begin',draftId:draft.draftId,itemId:draft.current.id,name:file.name,mime:file.type,size:file.size,purpose:draft.current.personalization_type});
  if(error||data?.error)throw error||new Error(data.error);attachment=parseUploadTicket(data);
  const result=await supabase.storage.from('order-attachments').upload(attachment.object_path,file,{contentType:file.type,upsert:false});if(result.error)throw result.error;
  const finish=await attachmentOperation({action:'finish',id:attachment.id});if(finish.error||finish.data?.error)throw finish.error||new Error(finish.data.error);const ready=parseAttachment(finish.data);uploadedPreviews.clear();uploadedPreviews.set(ready.id,file);return ready;
 }catch(e){if(attachment){try{await attachmentOperation({action:'discard',id:attachment.id});}catch{/* cleanup must not replace the upload error */}}throw e;}
}
export async function discard(a:Attachment){
 if(!supabase){await storeFile(a.id,null);return;}
 await session();const {data,error}=await attachmentOperation({action:'discard',id:a.id});if(error||data?.error)throw error||new Error(data.error);uploadedPreviews.delete(a.id);
}
export async function attachmentUrl(a:Attachment):Promise<string>{
 const preview=uploadedPreviews.get(a.id);if(preview)return URL.createObjectURL(preview);
 if(!supabase){try{return URL.createObjectURL(await demoFile(a.id));}catch(e){if(localOrderMirrorEnabled)return localOrderAttachmentUrl(a);throw e;}}
 const {data,error}=await supabase.storage.from('order-attachments').createSignedUrl(a.object_path,60);if(error)throw error;return data.signedUrl;
}
export function readDemo():Order[]{try{return parseOrderList(JSON.parse(sessionStorage.getItem(demoKey)||'[]') as unknown);}catch{return [];}}
export async function checkOwner(){if(!supabase)return false;const {data,error}=await supabase.rpc('is_owner');if(error)throw error;return !!data;}
export async function listOrders(status:Status|'',page:number):Promise<Order[]>{if(!supabase)throw new Error('SUPABASE_NOT_CONFIGURED');const {data,error}=await supabase.rpc('production_orders',{p_status:status||null,p_page:page});if(error)throw error;return parseOrderList(data).map(normalize);}
export async function advance(order:Order):Promise<Order>{if(!supabase)throw new Error('SUPABASE_NOT_CONFIGURED');const {data,error}=await supabase.rpc('advance_order',{p_id:order.id,p_expected:order.status,p_updated:order.updated_at});if(error)throw error;return normalize(data);}
export {compatible};

export const repositories:Repositories={
 catalog:{load:loadCatalog},
 orders:{findByKey:findOrder,confirm:confirmOrder,isOwner:checkOwner,list:listOrders,readDemo,advance,getById:async id=>{if(!supabase)throw new Error('SUPABASE_NOT_CONFIGURED');const {data,error}=await supabase.rpc('production_order',{p_id:id});if(error)throw error;return data?normalize(data):null;}},
 attachments:{upload,discard,getUrl:attachmentUrl},
 auth:{signIn:async(email,password)=>{if(!supabase)throw new Error('SUPABASE_NOT_CONFIGURED');await supabase.auth.signOut();const {error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;},signOut:async()=>{if(!supabase)return;const {error}=await supabase.auth.signOut();if(error)throw error;},subscribe:listener=>{const subscription=supabase?.auth.onAuthStateChange(()=>{queueMicrotask(listener);});return ()=>subscription?.data.subscription.unsubscribe();}},
};
if(mode==='demo'&&localOrderMirrorEnabled){let syncing=false;const sync=async()=>{if(syncing)return;syncing=true;try{await mirrorLocalOrders(readDemo(),demoFile);}catch{/* Saved local orders retry when the panel is available. */}finally{syncing=false;}};void sync();setInterval(()=>{if(document.visibilityState==='visible')void sync();},15000);window.addEventListener('focus',()=>{void sync();});}
