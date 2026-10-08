import {createClient} from '@supabase/supabase-js';
import {readFile} from 'node:fs/promises';
import {extname} from 'node:path';
const {SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY}=process.env;
if(!SUPABASE_URL||!SUPABASE_SERVICE_ROLE_KEY)throw new Error('Set server-only SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY in your terminal.');
const c=createClient(SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const manifest=JSON.parse(await readFile(new URL('../src/catalog/font-manifest.json',import.meta.url),'utf8'));
for(const f of manifest){const ext=extname(f.file),name=String(f.number).padStart(2,'0')+ext;const bytes=await readFile(new URL('../public/fonts/plates/'+name,import.meta.url));const {error}=await c.storage.from('font-assets').upload('plates/'+name,bytes,{contentType:{'.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.otf':'font/otf'}[ext],upsert:false});if(error&&!['Duplicate','The resource already exists'].includes(error.message))throw error;console.log('Font asset ready: '+f.number);}
console.log('Run supabase/seed-fonts.sql after uploads succeed.');
