import {createTestDatabase} from './local-postgres.mjs';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
// Runs actual application SQL in PostgreSQL/WASM, with auth/storage stand-ins.
// Does NOT replace hosted Supabase Auth, Storage/Edge, CORS or multi-connection tests.
const db=await createTestDatabase();let checks=0;
const yes=(v)=>{assert.ok(v);checks++;};const equal=(a,b)=>{assert.deepEqual(a,b);checks++;};
async function fails(sql,params=[]){await assert.rejects(()=>db.query(sql,params));checks++;}
const userA=randomUUID(),userB=randomUUID(),owner=randomUUID();
async function asUser(id,role='authenticated'){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role '+role);}
try{
 for(const u of [userA,userB,owner])await db.query('insert into auth.users values ($1)',[u]);
 await db.query('insert into public.production_owner values (true,$1)',[owner]);
 await db.exec('grant all on all tables in schema public to service_role;');
 equal((await db.query('select count(*)::integer as n from public.size_widths')).rows[0].n,12);
 equal((await db.query('select count(*)::integer as n from public.fonts')).rows[0].n,36);
 const key=randomUUID(),draft=randomUUID();
 const item={id:randomUUID(),size_code:'XS',width_cm:1.5,design_id:'10000000-0000-4000-8000-000000000001',collar_type:'plastic_buckle',tag_type:'hanging',tagShape:'bone',tagSize:'medium',tagWidthCm:2.7,tagHeightCm:4,pet_name:'Luna',tag_phone:'+593 99 123 4567',extra_text:'',font_number:36,personalization_type:'none',personalization_notes:'',attachments:[]};
 const customer={name:'Ana García',phone:'+593 99 123 4567'};
 const confirm='select public.confirm_order($1,$2,$3::jsonb,$4::jsonb) as doc';
 const args=(k=key,items=[item],c=customer)=>[k,draft,JSON.stringify(c),JSON.stringify(items)];
 await asUser(userA);
 const order=(await db.query(confirm,args())).rows[0].doc;
 equal([order.items[0].tagShape,order.items[0].tagSize,order.items[0].tagWidthCm,order.items[0].tagHeightCm],['bone','medium',2.7,4]);
 await fails(confirm,args(randomUUID(),[{...item,tagWidthCm:5}]));
 await fails(confirm,args(randomUUID(),[{...item,tagShape:'crown',tagSize:'large'}]));
 equal(order.order_code,'COLTI-US-0001');equal(order.items[0].font.state,'ready');equal(order.items[0].font.presentation.size,40);equal(order.customer_snapshot,customer);
 equal((await db.query(confirm,args())).rows[0].doc.id,order.id);
 await fails(confirm,args(key,[item],{...customer,name:'different'}));
 equal((await db.query('select * from public.orders')).rows,[]);
 await fails("update public.orders set status='finished' where id=$1",[order.id]);
 await fails('select public.order_document($1)',[order.id]);
 await fails('select public.production_orders()');
 await fails('select public.verify_attachment($1,$2,true)',[randomUUID(),userA]);
 const bad=randomUUID();await fails(confirm,args(bad,[item,{...item,id:randomUUID(),width_cm:3}]));
 equal((await db.query('select public.find_order($1) as doc',[bad])).rows[0].doc,null);
 await asUser(userB);equal((await db.query('select public.find_order($1) as doc',[key])).rows[0].doc,null);
 equal((await db.query('select * from public.customers')).rows,[]);
 await fails('select public.advance_order($1,$2,$3)',[order.id,'new',order.updated_at]);
 await fails("insert into storage.objects(bucket_id,name) values ('order-attachments',$1)",[userA+'/wrong']);
 await asUser(userA);
 const begin='select public.begin_attachment($1,$2,$3,$4,$5,$6) as a';
 await fails(begin,[draft,item.id,'too-big.png','image/png',10485761,'dog_photo']);
 await fails(begin,[draft,item.id,'legacy.png','image/png',100,'decoration']);
 await fails(begin,[draft,item.id,'luna.png','image/png',null,'dog_photo']);
 await fails('select public.confirm_order_transaction($1,$2,$3::jsonb,$4::jsonb)',args());
 await fails('select public.validate_order_item($1::jsonb)',[JSON.stringify(item)]);
 await db.exec('reset role');equal((await db.query("select public from storage.buckets where id='order-attachments'")).rows,[{public:false}]);await asUser(userA);
 const a=(await db.query(begin,[draft,item.id,'luna.png','image/png',100,'dog_photo'])).rows[0].a;
 await db.query("insert into storage.objects(bucket_id,name) values ('order-attachments',$1)",[a.object_path]);
 equal((await db.query('select * from storage.objects where name=$1',[a.object_path])).rows,[]); // pending unreadable
 await fails(confirm,args(randomUUID(),[{...item,personalization_type:'dog_photo',attachments:[{id:a.id}]}]));
 await asUser(userA,'service_role');await db.query('select public.verify_attachment($1,$2,true)',[a.id,userA]);
 await asUser(userB);equal((await db.query('select * from storage.objects where name=$1',[a.object_path])).rows,[]);equal((await db.query('select * from public.attachments where id=$1',[a.id])).rows,[]);
 await fails(confirm,args(randomUUID(),[{...item,personalization_type:'dog_photo',attachments:[{id:a.id}]}]));
 await asUser(userA);
 await fails(confirm,args(randomUUID(),[{...item,personalization_type:'drawing',attachments:[{id:a.id}]}]));
 await fails(confirm,args(randomUUID(),[{...item,personalization_type:'none',attachments:[{id:a.id}]}]));
 equal((await db.query('select status,order_item_id from public.attachments where id=$1',[a.id])).rows,[{status:'ready',order_item_id:null}]);
 await fails(confirm,args(randomUUID(),[{...item,id:randomUUID(),personalization_type:'dog_photo',attachments:[{id:a.id}]}]));
 const attached=(await db.query(confirm,args(randomUUID(),[{...item,personalization_type:'dog_photo',attachments:[{id:a.id}]}]))).rows[0].doc;
 equal(attached.items[0].attachments[0].status,'linked');
 await fails('select public.discard_attachment($1)',[a.id]);
 await fails('select public.claim_stale_attachment($1,now())',[a.id]);
 await asUser(owner);
 yes((await db.query('select public.is_owner() as v')).rows[0].v);
 equal((await db.query('select * from public.orders')).rows.length,2);
 equal((await db.query('select * from storage.objects where name=$1',[a.object_path])).rows.length,1);
 const inProgress=(await db.query('select public.advance_order($1,$2,$3) as doc',[order.id,'new',order.updated_at])).rows[0].doc;equal(inProgress.status,'in_progress');
 await fails('select public.advance_order($1,$2,$3)',[order.id,'new',order.updated_at]);
 const done=(await db.query('select public.advance_order($1,$2,$3) as doc',[order.id,'in_progress',inProgress.updated_at])).rows[0].doc;equal(done.status,'finished');
 await db.exec('reset role');await db.exec("select setval('public.order_sequence',9999)");await asUser(userA);
 equal((await db.query(confirm,args(randomUUID()))).rows[0].doc.order_code,'COLTI-US-10000');

 // A committed write whose response was lost is safely replayed with the same key.
 const lostKey=randomUUID();await assert.rejects(async()=>{await db.query(confirm,args(lostKey));throw new TypeError('Connection lost after commit');});checks++;
 const recovered=(await db.query('select public.find_order($1) doc',[lostKey])).rows[0].doc;
 equal((await db.query(confirm,args(lostKey))).rows[0].doc.id,recovered.id);
 await db.exec('reset role');equal((await db.query('select count(*)::integer n from public.orders where idempotency_key=$1',[lostKey])).rows[0].n,1);
 await db.query('update public.designs set active=false where id=$1',[item.design_id]);await asUser(userA);
 equal((await db.query(confirm,args(lostKey))).rows[0].doc.id,recovered.id); // inventory changes never invalidate cached retries
 await db.exec('reset role');await db.query('update public.designs set active=true where id=$1',[item.design_id]);await asUser(userA);
 // Structured data is validated and preserved, not silently discarded.
 const extras={selected:['address','health','neutered','family','phones','other'],address:'Miami',health:'Allergies',neutered:'Spayed',familyName:'Ana',familyPhone:'+1 555 111 2233',phones:'+49 175 646 1669',other:'Humberto Salvador'};
 const detailed={...item,personalization_type:'decoration',decorationIcon:'heart',informationIcons:['phone','address','email','neutered'],tagEmail:'hello@example.com',tagExtras:extras};
 const details=(await db.query(confirm,args(randomUUID(),[detailed]))).rows[0].doc.items[0];equal(details.tagExtras,extras);equal(details.informationIcons,detailed.informationIcons);equal(details.tagEmail,detailed.tagEmail);
 // Phase 24: reversible production stages, terminal history and atomic catalogue batches.
 for(const count of [1,5,10]){
  const payload=Array.from({length:count},(_,n)=>({...item,id:randomUUID(),pet_name:'Test '+n}));
  const document=(await db.query(confirm,args(randomUUID(),payload))).rows[0].doc;equal(document.items.length,count);
  await asUser(owner);
  const changeStatus=async(o,status)=>(await db.query('select public.admin_update_order($1,$2,$3,null) doc',[o.id,o.updated_at,status])).rows[0].doc.order;
  let current=await changeStatus(document,'in_progress');current=await changeStatus(current,'new');equal(current.status,'new');
  current=await changeStatus(current,'in_progress');current=await changeStatus(current,'ready');current=await changeStatus(current,'in_progress');equal(current.status,'in_progress');
  const cancelled=(await db.query('select public.admin_cancel_order($1,$2,$3) doc',[current.id,current.updated_at,count===1?'  Requested by customer  ':''])).rows[0].doc;
  equal(cancelled.order.status,'cancelled');equal(cancelled.cancellationReason,count===1?'Requested by customer':'');equal(cancelled.order.items.length,count);
  await fails('select public.admin_update_order($1,$2,$3,null)',[current.id,cancelled.order.updated_at,'new']);
  await asUser(userA);await fails('select public.admin_cancel_order($1,$2,$3)',[current.id,cancelled.order.updated_at,'private']);
 }
 const bulkChanges=[{designId:item.design_id,width:0,enabled:false,revision:0},{designId:item.design_id,width:1.5,enabled:false,revision:0}];
 await fails('select public.admin_availability_batch($1::jsonb)',[JSON.stringify(bulkChanges)]);
 await asUser(owner);
 const bulk=(await db.query('select public.admin_availability_batch($1::jsonb) changes',[JSON.stringify(bulkChanges)])).rows[0].changes;equal(bulk.length,2);equal(bulk.map(c=>c.revision),[1,1]);
 await fails('select public.admin_availability_batch($1::jsonb)',[JSON.stringify(bulkChanges.map((c,n)=>({...c,enabled:true,revision:n===0?1:0})))]);
 equal((await db.query('select public.admin_catalog() doc')).rows[0].doc.overrides.filter(c=>c.designId===item.design_id&&[0,1.5].includes(c.width)).map(c=>c.enabled),[false,false]);
 await db.query('select public.admin_availability_batch($1::jsonb)',[JSON.stringify(bulkChanges.map(c=>({...c,enabled:true,revision:1})))]);
 await fails('select public.admin_availability_batch($1::jsonb)',[JSON.stringify([bulkChanges[0],bulkChanges[0]])]);
 // Thermal shipping-label addresses are owner-only and use order timestamp locking.
 const shippingOrder=(await db.query(confirm,args(randomUUID()))).rows[0].doc;
 await asUser(owner);
 let readyShippingOrder=(await db.query('select public.admin_update_order($1,$2,$3,null) doc',[shippingOrder.id,shippingOrder.updated_at,'in_progress'])).rows[0].doc.order;
 readyShippingOrder=(await db.query('select public.admin_update_order($1,$2,$3,null) doc',[readyShippingOrder.id,readyShippingOrder.updated_at,'ready'])).rows[0].doc.order;
 equal((await db.query('select public.admin_order($1) doc',[readyShippingOrder.id])).rows[0].doc.order.shipping_address,null);
 const address={line1:'Av. República 123',line2:'',city:'Quito',region:'Pichincha',postalCode:'170135',country:'Ecuador'};
 await asUser(userA);await fails('select public.admin_save_shipping_address($1,$2,$3::jsonb)',[readyShippingOrder.id,readyShippingOrder.updated_at,JSON.stringify(address)]);
 await asUser(owner);
 const labeled=(await db.query('select public.admin_save_shipping_address($1,$2,$3::jsonb) doc',[readyShippingOrder.id,readyShippingOrder.updated_at,JSON.stringify(address)])).rows[0].doc;
 equal(labeled.shipping_address,address);
 await fails('select public.admin_save_shipping_address($1,$2,$3::jsonb)',[readyShippingOrder.id,readyShippingOrder.updated_at,JSON.stringify(address)]);
 await fails('select public.admin_save_shipping_address($1,$2,$3::jsonb)',[readyShippingOrder.id,labeled.updated_at,JSON.stringify({...address,line1:' '})]);
 console.log(`PASS: ${checks} PostgreSQL checks — migrations, seeds, transaction rollback, retry/conflict, RLS, uploads ownership, states, bulk availability, cancellation and 1/5/10-collar orders.`);
}finally{await db.close();}


