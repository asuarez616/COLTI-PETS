import {createTestDatabase} from './local-postgres.mjs';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
const db=await createTestDatabase();let checks=0;
const equal=(a,b)=>{assert.deepEqual(a,b);checks++;};
async function fails(sql,args=[]){await assert.rejects(()=>db.query(sql,args));checks++;}
const owner=randomUUID(),customer=randomUUID(),stranger=randomUUID();
async function user(id,role='authenticated'){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role '+role);}
try{
 for(const id of [owner,customer,stranger])await db.query('insert into auth.users values($1)',[id]);
 await db.query('insert into public.production_owner values(true,$1)',[owner]);
 const design='10000000-0000-4000-8000-000000000001';
 const item={id:randomUUID(),size_code:'XS',width_cm:1.5,design_id:design,collar_type:'plastic_buckle',tag_type:'hanging',tagShape:'bone',tagSize:'medium',tagWidthCm:2.7,tagHeightCm:4,pet_name:'Luna Bella',tag_phone:'+593 99 123 4567',extra_text:'',font_number:36,personalization_type:'none',personalization_notes:'',attachments:[]};
 const key=randomUUID(),draft=randomUUID(),args=[key,draft,JSON.stringify({name:'Ana Garcia',phone:'+593 99 123 4567'}),JSON.stringify([item,{...item,id:randomUUID(),pet_name:'Sol'}])];
 const confirm='select public.confirm_order($1,$2,$3::jsonb,$4::jsonb) as doc';
 await user(customer);let order=(await db.query(confirm,args)).rows[0].doc;
 equal((await db.query(confirm,args)).rows[0].doc.id,order.id);
 for(const id of [customer,stranger]){
 await user(id);
 await fails('select public.admin_orders()');await fails('select public.admin_order($1)',[order.id]);
 await fails('select public.admin_update_order($1,$2,$3,null)',[order.id,order.updated_at,'in_progress']);
 await fails('select public.admin_availability($1,0,false,0)',[design]);
 await fails("select public.admin_hero('[]'::jsonb,0)");
 await fails('update public.hero_configuration set revision=55');
 await fails('update public.catalog_availability set enabled=false');
 }
 await user(null,'anon');await fails('select public.admin_orders()');
 await user(owner);
 equal((await db.query('select public.admin_orders() as doc')).rows[0].doc.length,1);
 for(const search of [' colti-us ',' ANA   GARCIA ','123 4567','luna bella'])equal((await db.query('select public.admin_orders($1) as doc',[search])).rows[0].doc.length,1);
 equal((await db.query("select public.admin_orders('', 'ready') as doc")).rows[0].doc,[]);
 const detail=(await db.query('select public.admin_order($1) as doc',[order.id])).rows[0].doc;equal(detail.order.items.length,2);equal(detail.note,'');
 await fails('select public.admin_update_order($1,$2,$3,null)',[order.id,order.updated_at,'delivered']);
 const update=async(status,note=null)=>{const value=(await db.query('select public.admin_update_order($1,$2,$3,$4) as doc',[order.id,order.updated_at,status,note])).rows[0].doc;order=value.order;return value;};
 const stale=order.updated_at;equal((await update(null,'PRIVATE: cut strap')).note,'PRIVATE: cut strap');
 await fails('select public.admin_update_order($1,$2,null,$3)',[order.id,stale,'overwrite']);
 equal((await db.query('select public.admin_order($1) as doc',[order.id])).rows[0].doc.note,'PRIVATE: cut strap');
 for(const status of ['in_progress','ready','delivered'])equal((await update(status)).order.status,status);
 await fails('select public.admin_update_order($1,$2,$3,null)',[order.id,order.updated_at,'new']);
 await user(customer);equal(JSON.stringify((await db.query('select public.find_order($1) as doc',[key])).rows[0].doc).includes('PRIVATE:'),false);
 await user(owner);
 const availability=(await db.query('select public.admin_availability($1,1.5,false,0) as doc',[design])).rows[0].doc;equal(availability.revision,1);
 await fails('select public.admin_availability($1,1.5,true,0)',[design]);
 await fails('select public.admin_availability($1,9,true,0)',[design]);
 equal((await db.query('select public.admin_order($1) as doc',[order.id])).rows[0].doc.order.items[0].design.code,detail.order.items[0].design.code);
 await user(customer);await fails(confirm,[randomUUID(),...args.slice(1)]);equal((await db.query(confirm,args)).rows[0].doc.id,order.id);
 await user(owner);await db.query('select public.admin_availability($1,1.5,true,1)',[design]);
 await user(customer);const second=(await db.query(confirm,[randomUUID(),...args.slice(1)])).rows[0].doc;
 await user(owner);const cancelled=(await db.query('select public.admin_cancel_order($1,$2,$3) as doc',[second.id,second.updated_at,'Customer requested cancellation'])).rows[0].doc;equal(cancelled.order.status,'cancelled');equal((await db.query('select public.admin_orders() as doc')).rows[0].doc.length,2);
 await fails('select public.admin_update_order($1,$2,$3,null)',[second.id,cancelled.order.updated_at,'new']);
 equal(cancelled.cancellationReason,'Customer requested cancellation');equal(cancelled.order.cancellationReason,undefined);
 equal((await db.query("select public.admin_orders_filtered('',null,0,'2000-01-01','2100-01-01') as doc")).rows[0].doc.length,2);
 equal((await db.query("select public.admin_orders_filtered('',null,0,'2000-01-01','2001-01-01') as doc")).rows[0].doc.length,0);
 await fails("select public.admin_orders_filtered('',null,0,'2026-10-04','2026-10-03')");
 await user(customer);await fails('select public.admin_cancel_order($1,$2,$3)',[order.id,order.updated_at,'reason']);await fails('select public.admin_orders_filtered()');await user(owner);
 const images=[{id:'hero-b',active:true},{id:'hero-a',active:false}];
 equal((await db.query('select public.admin_hero($1::jsonb,0) as doc',[JSON.stringify(images)])).rows[0].doc,{revision:1,images});
 await fails('select public.admin_hero($1::jsonb,0)',[JSON.stringify(images)]);
 await fails('select public.admin_hero($1::jsonb,1)',[JSON.stringify([images[0],images[0]])]);
 await user(null,'anon');equal((await db.query('select images,revision from public.hero_configuration')).rows[0],{images,revision:1});
 console.log(`PASS: ${checks} Admin PostgreSQL checks — privacy, search, multi-collar, transitions, cancellation, notes, CAS, availability, historical snapshots, idempotency and hero.`);
}finally{await db.close();}
