import {createTestDatabase} from './local-postgres.mjs';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
const db=await createTestDatabase();const owner=randomUUID(),customer=randomUUID(),design='10000000-0000-4000-8000-000000000001';
const user=async id=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated');};
const available=async(size,width)=>(await db.query('select public.catalog_variant_available($1,$2,$3) ok',[design,size,width])).rows[0].ok;
const set=async(size,width,enabled,revision)=>(await db.query('select public.admin_size_availability($1,$2,$3,$4,$5) doc',[design,size,width,enabled,revision])).rows[0].doc;
try{
 for(const id of [owner,customer])await db.query('insert into auth.users values($1)',[id]);
 await db.query('insert into public.production_owner values(true,$1)',[owner]);
 await user(customer);await assert.rejects(()=>set('XS',0,false,0));
 await user(owner);await assert.rejects(()=>set('M',3,false,0));await assert.rejects(()=>set('XXXL',0,false,0));
 assert.equal(await available('XS',1.5),true);await set('XS',1.5,false,0);assert.equal(await available('XS',1.5),false);assert.equal(await available('S',1.5),true);
 await assert.rejects(()=>set('XS',1.5,true,0));
 await set('XS',0,false,0);assert.equal(await available('XS',1),false);
 await set('XS',0,true,1);assert.equal(await available('XS',1),true);assert.equal(await available('XS',1.5),false);
 await db.query('select public.admin_availability($1,0,false,0)',[design]);assert.equal(await available('S',1.5),false);
 await db.query('select public.admin_availability($1,0,true,1)',[design]);assert.equal(await available('S',1.5),true);assert.equal(await available('XS',1.5),false);
 const item={id:randomUUID(),size_code:'S',width_cm:1.5,design_id:design,collar_type:'plastic_buckle',tag_type:'hanging',tagShape:'bone',tagSize:'medium',tagWidthCm:2.7,tagHeightCm:4,pet_name:'Luna',tag_phone:'0984156889',extra_text:'',font_number:36,personalization_type:'none',personalization_notes:'',attachments:[]};
 const key=randomUUID(),draft=randomUUID(),args=[key,draft,JSON.stringify({name:'Ana',phone:'0984156889'}),JSON.stringify([item])];
 const confirm='select public.confirm_order($1,$2,$3::jsonb,$4::jsonb) doc';
 await user(customer);const original=(await db.query(confirm,args)).rows[0].doc;
 await user(owner);await set('S',0,false,0);
 await user(customer);assert.equal((await db.query(confirm,args)).rows[0].doc.id,original.id);await assert.rejects(()=>db.query(confirm,[randomUUID(),...args.slice(1)]));
 assert.deepEqual((await db.query('select public.find_order($1) doc',[key])).rows[0].doc.items,original.items);
 await user(owner);const state=(await db.query('select public.admin_catalog() doc')).rows[0].doc;
 assert(state.overrides.some(a=>a.size==='XS'&&a.width===1.5&&!a.enabled));
 console.log('PASS: hierarchy, valid master pairs, permission/CAS, restore, confirm rejection, idempotency, immutable historical snapshot.');
}finally{await db.close();}
