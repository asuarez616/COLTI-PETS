import {readFile,writeFile,mkdir,rename,stat} from 'node:fs/promises';
import {createSign,createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve,join} from 'node:path';
import {buildDesigns,listDriveImages,assetId} from './drive-catalog-core.mjs';
async function synchronize(){
const root=fileURLToPath(new URL('../',import.meta.url));
const read=async p=>JSON.parse(await readFile(join(root,p),'utf8'));
const config=await read('catalog-drive-sources.json');
const hero=process.argv.includes('--hero');
const publish=process.argv.includes('--publish');
const inventoryPath=hero?'src/catalog/hero-drive-inventory.json':'src/catalog/drive-inventory.json';
const snapshot=process.argv.includes('--snapshot');
const dryRun=process.argv.includes('--dry-run');
let token=process.env.GOOGLE_DRIVE_ACCESS_TOKEN;
if(!snapshot&&!token){
 if(!process.env.GOOGLE_APPLICATION_CREDENTIALS)throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS to a read-only Drive service account JSON file (or GOOGLE_DRIVE_ACCESS_TOKEN).');
 const account=JSON.parse(await readFile(process.env.GOOGLE_APPLICATION_CREDENTIALS,'utf8'));
 const b=v=>Buffer.from(JSON.stringify(v)).toString('base64url');const now=Math.floor(Date.now()/1000);
 const payload=b({alg:'RS256',typ:'JWT'})+'.'+b({iss:account.client_email,scope:'https://www.googleapis.com/auth/drive.readonly',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600});
 const signature=createSign('RSA-SHA256').update(payload).sign(account.private_key,'base64url');
 const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:payload+'.'+signature})});
 if(!response.ok)throw new Error('Google authentication failed ('+response.status+')');token=(await response.json()).access_token;
}
const request=async(url,bytes=false)=>{
 const r=await fetch(url,{headers:token?{Authorization:'Bearer '+token}:{},signal:AbortSignal.timeout(60000)});
 if(!r.ok)throw new Error('Drive request failed ('+r.status+')');
 return bytes?Buffer.from(await r.arrayBuffer()):r.json();
};
const inventory=snapshot?await read(inventoryPath):await listDriveImages(hero?[config.hero]:config.groups,request);
if(hero&&!inventory.length)throw new Error('Hero folder has no supported images; existing hero preserved.');
const designs=hero?[]:buildDesigns(inventory,config.groups);
for(const g of hero?[]:config.groups)console.log(g.type+' '+g.sizes.join('/')+': '+designs.filter(d=>d.type===g.type&&d.compatibility.some(p=>p.size_code===g.sizes[0])).length+' designs');
if(dryRun)return;
const fingerprint=createHash('sha256').update(JSON.stringify(inventory.slice().sort((a,b)=>a.id.localeCompare(b.id)))).digest('hex');
const marker=hero?'.asset-tools/private/hero-published.json':'.asset-tools/private/catalog-published.json';
if(publish){let saved;try{saved=await read(marker);}catch{}if(saved?.fingerprint===fingerprint&&saved.version===3){console.log('Drive source checked; published assets unchanged.');return;}}
await mkdir(join(root,'.asset-tools/drive-originals'),{recursive:true});
let previous=[];try{previous=await read(inventoryPath);}catch{}
let downloads=[];if(snapshot)try{downloads=await read(hero?'.asset-tools/hero-downloads.json':'.asset-tools/drive-downloads.json');}catch{}
let completed=0;
async function download(item){
 const target=join(root,'.asset-tools/drive-originals',item.id);
 const old=previous.find(f=>f.id===item.id);
 const unchanged=snapshot||(item.md5Checksum?item.md5Checksum===old?.md5Checksum:item.modifiedTime&&item.modifiedTime===old?.modifiedTime);
 if(unchanged&&await stat(target).then(s=>s.size>0,()=>false))return;
 const url=snapshot?downloads.find(f=>f.id===item.id)?.url:`https://www.googleapis.com/drive/v3/files/${item.id}?alt=media&supportsAllDrives=true`;
 if(!url)throw new Error('Missing download reference');
 const bytes=await request(url,true);
 const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 const jpeg=bytes[0]===255&&bytes[1]===216;const webp=bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';
 if(!png&&!jpeg&&!webp)throw new Error('Drive returned a non-image for '+item.name);
 await writeFile(target+'.tmp',bytes);await rename(target+'.tmp',target);
 if(++completed%25===0)console.log('Downloaded '+completed+' images');
}
for(let i=0;i<inventory.length;i+=6)await Promise.all(inventory.slice(i,i+6).map(download));
// Keep the current catalogue intact if any download fails.
const staging=join(root,'.asset-tools',hero?'hero-inventory-staging.json':'catalog-inventory-staging.json');
const heroStaging=join(root,'.asset-tools/hero-manifest-staging.json');
await writeFile(staging,JSON.stringify(inventory,null,2)+'\n');
const python=process.env.PYTHON_BIN||'python';
const prepared=spawnSync(python,[join(root,hero?'scripts/prepare-hero-images.py':'scripts/prepare-drive-images.py')],{stdio:'inherit',cwd:root,env:{...process.env,COLTI_IMAGE_INVENTORY:staging,COLTI_HERO_MANIFEST:heroStaging}});
if(prepared.status!==0)throw new Error('Image preparation failed. Set PYTHON_BIN to Python with Pillow installed.');
const target=join(root,'src/catalog/drive-designs.json');
if(publish){
 const {SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY}=process.env;
 if(!SUPABASE_URL||!SUPABASE_SERVICE_ROLE_KEY)throw new Error('Publishing requires server-only Supabase credentials.');
 const {createClient}=await import('@supabase/supabase-js');const db=createClient(SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
 const heroManifest=hero?JSON.parse(await readFile(heroStaging,'utf8')):null;
 const paths=hero?heroManifest.flatMap(i=>i.variants.map(v=>v.file)):inventory.flatMap(f=>[240,480,800].map(w=>`catalog/drive/${assetId(f)}-${w}.webp`));
 for(let i=0;i<paths.length;i+=8)await Promise.all(paths.slice(i,i+8).map(async path=>{
  const bytes=await readFile(join(root,'public',path));const {error}=await db.storage.from('catalog-images').upload(path,bytes,{upsert:false,contentType:'image/webp',cacheControl:'31536000'});if(error&&!['Duplicate','The resource already exists'].includes(error.message))throw error;
 }));
 if(hero){
  const buckets=await db.storage.listBuckets();if(buckets.error)throw buckets.error;
  if(!buckets.data.some(b=>b.id==='site-content')){const created=await db.storage.createBucket('site-content',{public:true,allowedMimeTypes:['application/json'],fileSizeLimit:1048576});if(created.error)throw created.error;}
  const {error}=await db.storage.from('site-content').upload('hero-manifest.json',JSON.stringify(heroManifest),{upsert:true,contentType:'application/json',cacheControl:'0'});if(error)throw error;
 }
 else {const {error}=await db.rpc('sync_drive_catalog',{p_designs:designs});if(error)throw error;}
 await mkdir(join(root,'.asset-tools/private'),{recursive:true});await writeFile(join(root,marker),JSON.stringify({version:3,fingerprint}));
}
await writeFile(join(root,inventoryPath)+'.tmp',JSON.stringify(inventory,null,2)+'\n');await rename(join(root,inventoryPath)+'.tmp',join(root,inventoryPath));
if(!hero){await writeFile(target+'.tmp',JSON.stringify(designs,null,2)+'\n');await rename(target+'.tmp',target);}
else await rename(heroStaging,join(root,'src/catalog/hero-drive.json'));
console.log('Drive synchronized: '+(hero?inventory.length+' hero photos':designs.length+' designs'));
}
await synchronize();
