import {createTestDatabase} from './local-postgres.mjs';import {randomUUID} from 'node:crypto';import assert from 'node:assert/strict';
const db=await createTestDatabase(),id=randomUUID(),hero=randomUUID();
try{
 await db.exec('set role authenticated');await assert.rejects(()=>db.query('select public.register_admin_image($1,$2,$3,$4)',[id,'catalog','{}','{}']));await db.exec('reset role;set role service_role');
 const metadata={code:'UPLOAD-TEST',type:'woven',group:'small-medium',collection:''},asset={image:'catalog/uploads/'+id+'-800.webp'};
 await db.query('select public.register_admin_image($1,$2,$3,$4)',[id,'catalog',metadata,asset]);await db.exec('reset role');const pairs=(await db.query('select size_code from public.design_compatibility where design_id=$1',[id])).rows;assert.deepEqual([...new Set(pairs.map(p=>p.size_code))].sort(),['S','SM']);assert.equal((await db.query('select enabled from public.catalog_availability where design_id=$1',[id])).rows[0].enabled,false);
 await db.exec('set role service_role');await assert.rejects(()=>db.query('select public.sync_drive_catalog($1)',[JSON.stringify([{id:randomUUID(),code:'UPLOAD-TEST'}])]));
 const h={id:hero,name:'Photo.jpg',width:800,height:1000,variants:[{file:'editorial/uploads/'+hero+'-800.webp',width:800,height:1000,bytes:200}]};await db.query('select public.register_admin_image($1,$2,$3,$4)',[hero,'hero',{},h]);
 await db.exec('reset role');const config=(await db.query('select images from public.hero_configuration')).rows[0].images;assert(config.some(i=>i.id===hero&&!i.active));
 await db.exec('set role anon');assert.equal((await db.query('select count(*) n from public.uploaded_hero_images')).rows[0].n,1);await assert.rejects(()=>db.query('delete from public.uploaded_hero_images'));
 console.log('PASS: server-only registration, valid sizes, hidden defaults, collision protection and public read-only hero.');
}finally{await db.close();}
