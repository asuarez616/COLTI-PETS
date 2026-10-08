import {createTestDatabase} from './local-postgres.mjs';
import assert from 'node:assert/strict';
const db=await createTestDatabase({freshProject:true});try{
 assert.equal((await db.query('select count(*)::int as n from public.designs')).rows[0].n,264);
 assert.equal((await db.query('select count(*)::int as n from public.designs where is_test_data')).rows[0].n,0);
 assert.equal((await db.query('select count(*)::int as n from public.orders')).rows[0].n,0);
 assert.equal((await db.query("select count(*)::int as n from public.fonts where state='ready' and asset_path like '/fonts/plates/%'")).rows[0].n,36);
 assert.equal((await db.query("select count(*)::int as n from pg_publication_tables where pubname='supabase_realtime'")).rows[0].n,6);
 await db.exec('set role anon');assert.equal((await db.query('select count(*)::int as n from public.catalog_availability')).rows[0].n,0);
 await assert.rejects(()=>db.query('select public.admin_orders()'));await assert.rejects(()=>db.query('select * from public.orders'));await assert.rejects(()=>db.query("update public.hero_configuration set revision=1"));
 console.log('PASS: 9 fresh-project PostgreSQL checks — real catalogue, fonts, Realtime publication and private mutations.');
}finally{await db.close();}
