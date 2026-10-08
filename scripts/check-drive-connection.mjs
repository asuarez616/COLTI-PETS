// Read-only connection check. Never publishes assets or records a successful sync.
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {loadEnv} from 'vite';
import {spawn} from 'node:child_process';
import {encryptedDriveStore} from './drive-oauth-server.mjs';
import {listDriveImages,buildDesigns} from './drive-catalog-core.mjs';
const root=process.cwd(),env={...process.env,...loadEnv('production',root,'')};
const store=encryptedDriveStore(join(root,'.asset-tools/private/drive-oauth.json'),env.GOOGLE_OAUTH_TOKEN_KEY);
const saved=await store.read();
if(!saved?.refresh_token)throw Error('Drive is not connected');
let token=saved.access_token;
if(!token||saved.expires_at<Date.now()+60000){
 const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({client_id:env.GOOGLE_OAUTH_CLIENT_ID,client_secret:env.GOOGLE_OAUTH_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:saved.refresh_token}),signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error('Google token refresh failed: '+response.status);
 const refreshed=await response.json();token=refreshed.access_token;
 if(!token)throw Error('Google did not return an access token');
 await store.write({...saved,...refreshed,expires_at:Date.now()+refreshed.expires_in*1000});
}
const config=JSON.parse(await readFile('catalog-drive-sources.json','utf8'));
const request=async url=>{const response=await fetch(url,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(60000)});if(!response.ok)throw Error('Drive listing failed: '+response.status);return response.json();};
const groups=[...config.groups,config.hero];
const files=await listDriveImages(groups,request);
buildDesigns(files.filter(f=>f.group!==config.hero.folderId),config.groups);
for(const group of groups)console.log((group.type?group.type+' '+group.sizes.join('/'):'hero')+': '+files.filter(f=>f.group===group.folderId).length+' images');
console.log('Read-only Drive access verified. Publication credential configured: '+Boolean(env.SUPABASE_SERVICE_ROLE_KEY));
if(env.SUPABASE_SERVICE_ROLE_KEY){
 const {createClient}=await import('@supabase/supabase-js');
 const db=createClient(env.SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
 // The synchronizer needs its guarded RPC, not broad direct table access.
 const {error}=await db.rpc('sync_drive_catalog',{p_designs:[]});
 if(!error?.message.includes('Refusing an empty catalogue replacement'))throw Error('Server catalogue RPC unavailable: '+error?.code);
 const buckets=await db.storage.listBuckets();if(buckets.error)throw Error('Server storage access failed');
 console.log('Server database/storage access verified. Catalogue bucket present: '+buckets.data.some(b=>b.id==='catalog-images'));
}
if(process.argv.includes('--publish-hero')){
 const child=spawn(process.execPath,['scripts/sync-drive-catalog.mjs','--hero','--publish'],{env:{...process.env,...env,GOOGLE_DRIVE_ACCESS_TOKEN:token},stdio:'inherit',windowsHide:true});
 await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(Error('Hero publication failed')));});
}
