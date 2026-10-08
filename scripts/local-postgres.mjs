import {PGlite} from '@electric-sql/pglite';
import {readFile,readdir} from 'node:fs/promises';
export async function createTestDatabase({freshProject=false}={}){const db=new PGlite();try{
 await db.exec(`
 create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; create schema storage; create schema extensions;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth,storage,extensions to anon,authenticated,service_role;
 grant execute on function auth.uid() to anon,authenticated,service_role;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets,name text unique);
 alter table storage.objects enable row level security;
 grant select,insert,update,delete on storage.objects to anon,authenticated,service_role;
 -- pgcrypto digest stand-in using PostgreSQL's real built-in SHA-256.
 create function extensions.digest(t text,algo text) returns bytea language sql immutable as $$select sha256(convert_to(t,'UTF8'))$$;
 `);
 if(freshProject){await db.exec((await readFile(new URL('../audits/phase-24/fresh-project-bootstrap.sql',import.meta.url),'utf8')).replace('create extension if not exists pgcrypto with schema extensions;',''));await db.exec('grant all on all tables in schema public to service_role;');return db;}
 for(const file of (await readdir(new URL('../supabase/migrations/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort()){const sql=(await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8')).replace('create extension if not exists pgcrypto with schema extensions;','');await db.exec(sql);}
 await db.exec(await readFile(new URL('../supabase/seed.sql',import.meta.url),'utf8'));await db.exec(await readFile(new URL('../supabase/seed-fonts.sql',import.meta.url),'utf8'));
 await db.exec('grant all on all tables in schema public to service_role;');return db;}catch(e){await db.close();throw e;}}
