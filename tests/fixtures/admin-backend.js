// Served only by Playwright interception; never imported into production.
import {createAdminApplication} from '/src/application/admin.ts';
import {createDriveConnection} from '/src/application/driveConnection.ts';
import {driveHttpRepository} from '/src/infrastructure/driveConnection.ts';
import {fixtureFonts,fixtureDesigns} from '/src/data/fixtures.ts';
import {blankItem} from '/src/domain/model.ts';
import heroImages from '/src/catalog/hero-drive.json?import';
const design=fixtureDesigns[0],font=fixtureFonts.find(f=>f.number===9);
let data=JSON.parse(localStorage.getItem('test-admin-data')||'null')||{order:{id:'test-order',order_code:'COLTI-US-0024',status:'new',confirmed_at:'2026-10-03T12:00:00Z',updated_at:'2026-10-03T12:00:00Z',customer_snapshot:{name:'Ana Garcia',phone:'0984156889'},items:['Luna','Sol'].map((pet_name,n)=>({...blankItem(),id:'collar-'+n,size_code:'XS',width_cm:1.5,design_id:design.id,pet_name,tag_phone:'0984156889',font_number:9,tag_type:'anti_fall',design,font}))},note:''};
let overrides=JSON.parse(localStorage.getItem('test-admin-overrides')||'[]');
let hero=JSON.parse(localStorage.getItem('test-admin-hero')||'null')||{revision:0,images:[]};
const save=()=>localStorage.setItem('test-admin-data',JSON.stringify(data));
let collectionChanges=JSON.parse(localStorage.getItem('test-collections')||'{}');
const repo={authorized:async()=>true,
 list:async(search,status,page,dates={})=>{const text=[data.order.order_code,data.order.customer_snapshot.name,data.order.customer_snapshot.phone,...data.order.items.map(i=>i.pet_name)].join(' ').toLowerCase();return (!status||data.order.status===status)&&(!dates.from||Date.parse(data.order.confirmed_at)>=Date.parse(dates.from))&&(!dates.to||Date.parse(data.order.confirmed_at)<Date.parse(dates.to))&&text.includes(search.toLowerCase())?[data.order]:[];},
 deliveredWeek:async(search,dates)=>{const orders=data.order.status==='delivered'&&data.order.delivered_at?await repo.list(search,'delivered',0,dates):[];return {orders:orders.slice(0,6),total:orders.length};},
 detail:async id=>id===data.order.id?data:null,
 status:async(order,status,reason)=>{data={...data,...(status==='cancelled'?{cancellationReason:reason||''}:{}),order:{...data.order,status,...(status==='delivered'?{delivered_at:new Date().toISOString()}:{}),updated_at:new Date().toISOString()}};save();return data;},
 note:async(order,note)=>{data={...data,note,order:{...data.order,updated_at:new Date().toISOString()}};save();return data;},
 catalog:async()=>({designs:fixtureDesigns.map(d=>({...d,...collectionChanges[d.id]})),overrides}),
 collection:async(id,name,revision)=>{const result={collection_override:name,collection_revision:revision+1};collectionChanges[id]=result;localStorage.setItem('test-collections',JSON.stringify(collectionChanges));return result;},
 availability:async change=>{const value={...change,revision:change.revision+1};overrides=[...overrides.filter(v=>!(v.designId===value.designId&&v.width===value.width&&(v.size||'')===(value.size||''))),value];localStorage.setItem('test-admin-overrides',JSON.stringify(overrides));return value;},
 availabilityBatch:async changes=>{const saved=changes.map(c=>({...c,revision:c.revision+1}));overrides=[...overrides.filter(v=>!saved.some(c=>c.designId===v.designId&&c.width===v.width&&(c.size||'')===(v.size||''))),...saved];localStorage.setItem('test-admin-overrides',JSON.stringify(overrides));return saved;},
 hero:async()=>hero,
 saveHero:async value=>{hero={...value,revision:value.revision+1};localStorage.setItem('test-admin-hero',JSON.stringify(hero));return hero;}
};
export const admin=createAdminApplication(repo,{load:()=>heroImages});
export const driveConnection=createDriveConnection(driveHttpRepository,()=>repo.authorized());
export const mode='live';
export const adminAuth={subscribe:()=>()=>{},signIn:async()=>{},signOut:async()=>{}};

export const uploadImage=async(file,metadata)=>({id:'test-upload',...metadata});
