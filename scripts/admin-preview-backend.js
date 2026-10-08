// Local-only review adapter. Loaded only by the loopback preview server.
import {createAdminApplication} from '/src/application/admin.ts';
import {createDriveConnection} from '/src/application/driveConnection.ts';
import {driveHttpRepository} from '/src/infrastructure/driveConnection.ts';

import {driveDesigns as fixtureDesigns} from '/src/catalog/drive.ts';

import heroImages from '/src/catalog/hero-drive.json?import';
async function localOrders(path='',body){const response=await fetch('/api/admin/local-orders'+path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},...(body?{body:JSON.stringify(body)}:{})});const data=await response.json();if(!response.ok)throw Error(data.error);return data;}
let overrides=JSON.parse(localStorage.getItem('colti-admin-preview-overrides')||'[]');
let hero=JSON.parse(localStorage.getItem('colti-admin-preview-hero')||'null')||{revision:0,images:[]};

let initialConfiguration;async function configuration(){if(!initialConfiguration)initialConfiguration=localOrders('/migrate-configuration',{overrides,hero}).catch(e=>{initialConfiguration=null;throw e;});await initialConfiguration;return localOrders('/configuration');}
const repo={authorized:async()=>true,
 list:async(search,status,page,dates)=>localOrders('?'+new URLSearchParams({search,status,page:String(page),...(dates||{})})),
 detail:async id=>localOrders('/'+encodeURIComponent(id)),
 status:async(order,status,reason)=>localOrders('/'+encodeURIComponent(order.id),{updated:order.updated_at,status,reason}),
 note:async(order,note)=>localOrders('/'+encodeURIComponent(order.id),{updated:order.updated_at,note}),
 catalog:async()=>({designs:fixtureDesigns,overrides:(await configuration()).overrides}),
 availability:async change=>{await configuration();return localOrders('/availability',{change});},
 availabilityBatch:async changes=>{await configuration();return localOrders('/availability-batch',{changes});},
 hero:async()=>(await configuration()).hero,
 saveHero:async configuration=>localOrders('/hero',{configuration})
};
export const admin=createAdminApplication(repo,{load:()=>heroImages});
export const driveConnection=createDriveConnection(driveHttpRepository,()=>repo.authorized());
export const mode='live';
export const adminAuth={subscribe:()=>()=>{},signIn:async()=>{},signOut:async()=>{location.href='/';}};
