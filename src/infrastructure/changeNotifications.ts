import type {ChangeRepository,SyncResource} from '../application/synchronization';
import {supabase} from './supabaseRepositories';
const base=import.meta.env.VITE_LOCAL_ADMIN_BRIDGE;
const tables:Record<SyncResource,string[]>={orders:['orders','order_items'],catalog:['fonts','catalog_categories','designs','design_compatibility','catalog_availability','catalog_size_availability'],hero:['hero_configuration','uploaded_hero_images'],closures:['closures'],'id-tags':['id_tag_configuration']};
export const changeNotifications:ChangeRepository={subscribe(resource,listener){
 if(supabase){const client=supabase,channel=client.channel('colti-'+resource+'-'+crypto.randomUUID());for(const table of tables[resource])channel.on('postgres_changes',{event:'*',schema:'public',table},()=>listener('changed'));channel.subscribe(state=>listener(state==='SUBSCRIBED'?'connected':'issue'));return()=>{void client.removeChannel(channel);};}
 if(base==='http://127.0.0.1:4174'&&location.hostname==='127.0.0.1'){const events=new EventSource(base+'/api/admin/local-orders/events');events.onopen=()=>listener('connected');events.onerror=()=>listener('issue');events.addEventListener('invalidate',event=>{try{const data=JSON.parse((event as MessageEvent).data);if(data.resource===resource)listener('changed');}catch{listener('issue');}});return()=>events.close();}
 return()=>{};
}};
