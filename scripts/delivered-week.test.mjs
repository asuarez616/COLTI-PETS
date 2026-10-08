import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createTestDatabase} from './local-postgres.mjs';
test('actual delivery time, weekly boundaries, six-card summary and complete history',async()=>{
 const db=await createTestDatabase();
 try{
 const owner=randomUUID();await db.query('insert into auth.users values ($1)',[owner]);await db.query('insert into public.production_owner values(true,$1)',[owner]);
 const customer=(await db.query("insert into public.customers(owner_user_id,name,phone) values($1,'Week test','123456') returning id",[owner])).rows[0].id;
 const start=(await db.query("select date_trunc('week',current_timestamp at time zone 'America/Guayaquil') at time zone 'America/Guayaquil' as t")).rows[0].t;
 async function insert(n,status,at){return (await db.query("insert into public.orders(customer_id,owner_user_id,sequence_number,order_code,idempotency_key,request_hash,customer_snapshot,status,delivered_at,confirmed_at) values($1,$2,$3,$4,$5,'test','{\"name\":\"Week test\",\"phone\":\"123456\"}',$6,$7,current_timestamp-interval '90 days') returning *",[customer,owner,n,'WEEK-'+n,randomUUID(),status,at])).rows[0];}
 for(let n=1;n<=8;n++)await insert(n,'delivered',new Date(Date.parse(start)+(n-1)*1000).toISOString());
 await insert(9,'delivered',new Date(Date.parse(start)-1).toISOString());await insert(10,'delivered',new Date(Date.parse(start)+7*86400000).toISOString());await insert(11,'delivered',null);await insert(12,'cancelled',null);
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner]);await db.exec('set role authenticated');
 const summary=(await db.query('select public.admin_delivered_week() as x')).rows[0].x;assert.equal(summary.total,8);assert.equal(summary.orders.length,6);assert.deepEqual(summary.orders.map(o=>o.order_code),[8,7,6,5,4,3].map(n=>'WEEK-'+n));
 assert.equal((await db.query("select public.admin_orders('','delivered',0) as x")).rows[0].x.length,11);assert.equal((await db.query("select public.admin_orders('','cancelled',0) as x")).rows[0].x.length,1);
 assert.equal((await db.query("select public.admin_delivered_week('nothing') as x")).rows[0].x.total,0);
 await db.exec('reset role');const transitioning=await insert(13,'ready',null);
 await db.query("update public.orders set status='delivered' where id=$1",[transitioning.id]);const time=(await db.query('select delivered_at from public.orders where id=$1',[transitioning.id])).rows[0].delivered_at;assert.ok(time);
 await db.query("update public.orders set production_note='later',delivered_at=current_timestamp-interval '1 year' where id=$1",[transitioning.id]);assert.deepEqual((await db.query('select delivered_at from public.orders where id=$1',[transitioning.id])).rows[0].delivered_at,time);
 assert.equal((await db.query('select delivered_at from public.orders where order_code=$1',['WEEK-11'])).rows[0].delivered_at,null);
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[randomUUID()]);await db.exec('set role authenticated');await assert.rejects(()=>db.query('select public.admin_delivered_week()'),/OWNER_REQUIRED/);
 }finally{await db.close();}
});
