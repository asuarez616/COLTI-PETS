import {createTestDatabase} from './local-postgres.mjs';
import {buildDesigns} from './drive-catalog-core.mjs';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const config=JSON.parse(await readFile(new URL('../catalog-drive-sources.json',import.meta.url),'utf8'));
const db=await createTestDatabase();
const designs=buildDesigns(config.groups.map((g,i)=>({id:'sql-file'+i,name:'SQL-'+i+'.png',mimeType:'image/png',group:g.folderId})),config.groups);
try{
 await db.exec('set role anon');await assert.rejects(db.query('select public.sync_drive_catalog($1)',[JSON.stringify(designs)]));
 await db.exec('reset role; set role service_role');
 assert.equal((await db.query('select public.sync_drive_catalog($1) as n',[JSON.stringify(designs)])).rows[0].n,4);
 await db.exec('reset role');
 assert.equal((await db.query('select count(*)::int as n from public.design_compatibility where design_id=$1',[designs[0].id])).rows[0].n,12);
 assert.equal((await db.query('select count(*)::int as n from public.design_compatibility where design_id=$1',[designs[1].id])).rows[0].n,6);
 await db.exec('set role service_role');
 const bad=[{...designs[0],compatibility:[{size_code:'INVALID',width_cm:1}]}];
 await assert.rejects(db.query('select public.sync_drive_catalog($1)',[JSON.stringify(bad)]));
 await assert.rejects(db.query('select public.sync_drive_catalog($1)',['[]']));
 await db.exec('reset role');
 assert.equal((await db.query('select count(*)::int as n from public.design_compatibility where design_id=$1',[designs[0].id])).rows[0].n,12);
 await db.exec('set role service_role');
 await db.query('select public.sync_drive_catalog($1)',[JSON.stringify(designs.slice(0,1))]);
 await db.exec('reset role');
 assert.equal((await db.query('select active from public.designs where id=$1',[designs[1].id])).rows[0].active,false);
 console.log('Drive SQL verified: permissions, compatibility, rollback, removal and empty-sync protection.');
}finally{await db.close();}
