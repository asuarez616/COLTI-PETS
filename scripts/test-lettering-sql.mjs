import {createTestDatabase} from './local-postgres.mjs';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
const db=await createTestDatabase();
try{const owner=randomUUID();await db.query('insert into auth.users values($1)',[owner]);await db.query('insert into public.production_owner values(true,$1)',[owner]);await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner]);await db.exec('set role authenticated');
const read=async()=>(await db.query('select public.admin_lettering_catalog() as value')).rows[0].value;
const initial=await read();assert.equal(initial.fonts.length,36);assert.equal(new Set(initial.fonts.map(f=>f.id)).size,36);
const original=initial.fonts[0],reversed=[...initial.fonts].reverse();
const save=async(revision,fonts)=>(await db.query('select public.admin_save_lettering($1,$2) as value',[revision,JSON.stringify(fonts)])).rows[0].value;
const reordered=await save(0,reversed);assert.equal(reordered.fonts[0].id,initial.fonts[35].id);assert.deepEqual(reordered.fonts.map(f=>f.display_order),Array.from({length:36},(_,i)=>i+1));assert.equal(reordered.fonts.find(f=>f.id===original.id).number,original.number);
await assert.rejects(()=>save(0,initial.fonts),/STATE_CONFLICT/);
const styled=await save(1,reordered.fonts.map(f=>f.id===original.id?{...f,presentation:{...f.presentation,size:52,transform:"uppercase"}}:f));
assert.equal(styled.fonts.find(f=>f.id===original.id).presentation.size,52);assert.equal(styled.fonts.find(f=>f.id===original.id).presentation.transform,"uppercase");
const archived=await save(2,styled.fonts.map(f=>f.id===original.id?{...f,active:false,deleted:true}:f));assert.equal(archived.fonts.length,35);
await db.exec('reset role');assert.equal((await db.query('select count(*)::integer n from public.fonts')).rows[0].n,36);
await db.exec('set role anon');await assert.rejects(()=>read());
console.log('PASS: lettering migration, 36 stable identities, normalized reorder, CAS conflicts, archival and owner-only management.');
}finally{await db.close();}
