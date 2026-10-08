import {createClient} from '@supabase/supabase-js';
import {readFile} from 'node:fs/promises';
// Run only in your terminal, never embed a service secret in VITE_ variables.
const {SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY}=process.env;
if(!SUPABASE_URL||!SUPABASE_SERVICE_ROLE_KEY)throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in this terminal.');
const client=createClient(SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const manifest=JSON.parse(await readFile(new URL('../src/catalog/image-manifest.json',import.meta.url),'utf8'));
for(const name of ['CH-17-1.png','design-test-02.png']){
 const bytes=await readFile(new URL('../reference-assets/'+name,import.meta.url));
 const {error}=await client.storage.from('catalog-images').upload(name,bytes,{contentType:'image/png',upsert:false});
 if(error && !['Duplicate','The resource already exists'].includes(error.message))throw error;
 console.log('Catalogue asset ready: '+name);
 for(const variant of manifest['catalog/'+name].variants){const file=variant.file.split('/').at(-1),bytes=await readFile(new URL('../public/'+variant.file,import.meta.url));const {error}=await client.storage.from('catalog-images').upload(file,bytes,{contentType:'image/webp',upsert:false});if(error&&!['Duplicate','The resource already exists'].includes(error.message))throw error;}
 // Advertise variants only once every upload for this product succeeded.
 const {error:versionError}=await client.from('designs').update({asset_version:'responsive-v1'}).eq('image_path',name);if(versionError)throw versionError;
}
