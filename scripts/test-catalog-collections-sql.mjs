import {createTestDatabase} from './local-postgres.mjs';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
const db=await createTestDatabase(), owner=randomUUID(),customer=randomUUID();
try{
 for(const id of [owner,customer])await db.query('insert into auth.users values($1)',[id]);await db.query('insert into public.production_owner values(true,$1)',[owner]);
 const id=(await db.query("select id from public.designs where type='printed' limit 1")).rows[0].id;
 const user=async u=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[u]);await db.exec('set role authenticated');};
 const move=(name,rev)=>db.query('select public.admin_design_collection($1,$2,$3) doc',[id,name,rev]);
 await user(customer);await assert.rejects(()=>move('Cartoons',0));
 await user(owner);assert.equal((await move('Cartoons',0)).rows[0].doc.collection_revision,1);await assert.rejects(()=>move('Florales',0));await assert.rejects(()=>move('x'.repeat(81),1));
 await db.exec('reset role');const row=(await db.query('select * from public.designs where id=$1',[id])).rows[0];
 await db.exec('set role service_role');await db.query('select public.sync_drive_catalog($1)',[JSON.stringify([{id,code:row.code,type:'printed',image:'catalog/drive/test-800.webp',asset_version:'drive-v1:test',source_collection:'florales',compatibility:[{size_code:'M',width_cm:2.5}]}])]);
 await db.exec('reset role');const after=(await db.query('select * from public.designs where id=$1',[id])).rows[0];assert.equal(after.source_collection,'florales');assert.equal(after.collection_override,'Cartoons');assert.equal(after.collection_revision,1);
 await user(owner);assert.equal((await move('',1)).rows[0].doc.collection_override,null);
 console.log('PASS: owner authorization, revision conflicts, collection moves and Drive preservation.');
}finally{await db.close();}
