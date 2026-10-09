import {localConfigurationEnabled,readLocalConfiguration} from './localConfiguration';
import {createAdminApplication,type AdminRepository} from '../application/admin';
import {AdminError,type HeroConfiguration,type ProductionDetail} from '../domain/admin';
import {parseDesign,parseOrder,parseOrderList} from '../domain/validation';
import {supabase,checkOwner,imageUrl} from './supabaseRepositories';
import {loadHeroImages} from './heroImages';
function normalizeOrder(value:unknown){const order=parseOrder(value);return {...order,items:order.items.map(i=>({...i,design:{...i.design,image:imageUrl(i.design.image)},font:{...i.font,asset_path:i.font.asset_path?imageUrl(i.font.asset_path,'font-assets'):null}}))};}
async function detail(value:{order:unknown;note:string;cancellationReason?:string}):Promise<ProductionDetail>{if(typeof value.note!=='string'||value.note.length>4000||value.cancellationReason!==undefined&&(typeof value.cancellationReason!=='string'||value.cancellationReason.length>1000))throw new AdminError('PersistenceError');const order=normalizeOrder(value.order);let deliveredAt:string|undefined;if(order.status==='delivered'&&supabase){const {data}=await supabase.from('orders').select('delivered_at').eq('id',order.id).single();if(data?.delivered_at&&Number.isFinite(Date.parse(data.delivered_at)))deliveredAt=data.delivered_at;}return {order,note:value.note,cancellationReason:value.cancellationReason,deliveredAt};}
async function rpc(name:string,args?:Record<string,unknown>){if(!supabase)throw new Error('AUTH_REQUIRED');const {data,error}=await supabase.rpc(name,args);if(error)throw error;return data;}
export async function publicHeroConfiguration():Promise<HeroConfiguration>{if(!supabase)return localConfigurationEnabled?(await readLocalConfiguration()).hero:{revision:0,images:[]};const {data,error}=await supabase.from('hero_configuration').select('revision,images').single();if(error)throw error;return data;}
export const adminRepository:AdminRepository={
 authorized:async()=>{if(!supabase)return false;const {data,error}=await supabase.auth.getSession();if(error)throw error;if(!data.session||data.session.user.is_anonymous)return false;return checkOwner();},
 list:async(search,status,page,dates)=>parseOrderList(await rpc(dates?.from||dates?.to?'admin_orders_filtered':'admin_orders',{p_search:search,p_status:status||null,p_page:page,...(dates?.from||dates?.to?{p_from:dates.from||null,p_to:dates.to||null}:{})})).map(normalizeOrder),
 deliveredWeek:async(search,dates)=>{const data=await rpc('admin_delivered_week',{p_search:search,p_from:dates?.from||null,p_to:dates?.to||null});if(!Number.isSafeInteger(data.total)||data.total<0)throw new AdminError('PersistenceError');return {orders:parseOrderList(data.orders).map(normalizeOrder),total:data.total};},
 detail:async(id)=>{const data=await rpc('admin_order',{p_id:id});return data?detail(data):null;},
 status:async(order,next,reason)=>detail(await rpc(next==='cancelled'&&reason?'admin_cancel_order':'admin_update_order',{p_id:order.id,p_updated:order.updated_at,...(next==='cancelled'&&reason?{p_reason:reason}:{p_status:next})})),
 note:async(order,note)=>detail(await rpc('admin_update_order',{p_id:order.id,p_updated:order.updated_at,p_note:note})),
 shipping:async(order,address)=>{const value=await rpc('admin_save_shipping_address',{p_id:order.id,p_updated:order.updated_at,p_address:address});return normalizeOrder(value);},
 catalog:async()=>{const data=await rpc('admin_catalog');return {designs:data.designs.filter((d:Record<string,unknown>)=>!d.deleted).map((d:Record<string,unknown>)=>parseDesign({...d,image:imageUrl(String(d.image_path))})),overrides:data.overrides};},
 renameDesign:async(id,previous,code)=>{await rpc('admin_rename_design',{p_id:id,p_previous:previous,p_code:code});},
 deleteDesign:async(id,version)=>{await rpc('admin_delete_design',{p_id:id,p_version:version});},
 collection:async(designId,name,revision)=>rpc('admin_design_collection',{p_design:designId,p_name:name,p_revision:revision}),
 availability:async(change)=>rpc(change.size?'admin_size_availability':'admin_availability',{p_design:change.designId,p_width:change.width,p_enabled:change.enabled,p_revision:change.revision,...(change.size?{p_size:change.size}:{})}),
 availabilityBatch:async(changes)=>rpc('admin_availability_batch',{p_changes:changes}),
 hero:publicHeroConfiguration,
 saveHero:async(configuration)=>rpc('admin_hero',{p_images:configuration.images,p_revision:configuration.revision})
};
export const heroImageSource={load:loadHeroImages};
export const admin=createAdminApplication(adminRepository,heroImageSource);
