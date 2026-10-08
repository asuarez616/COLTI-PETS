import {normalizeSvg} from './normalize-svg.mjs';
import {randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {join} from 'node:path';
import {createClient} from '@supabase/supabase-js';
export function validateUpload(body){
 if(!['catalog','hero','closure'].includes(body.target)||typeof body.name!=='string'||body.name.length>200||typeof body.data!=='string'||body.data.length>14000000||!body.data.length)throw Error('Invalid image');
 if(body.target==='catalog'&&(!/^[A-Z0-9][A-Z0-9_-]{0,39}$/.test(body.code)||!['woven','printed'].includes(body.type)||body.type==='woven'&&!['medium-large','small-medium','miniature'].includes(body.group)||typeof body.collection!=='string'||body.collection.length>80))throw Error('Check code, type and size group');
 return body;
}
function prepare(root,env,body){return new Promise((resolve,reject)=>{const p=spawn(env.PYTHON_BIN||'python',[join(root,'scripts/prepare-admin-upload.py')],{env,windowsHide:true,stdio:['pipe','pipe','ignore']});let output='';const timer=setTimeout(()=>{p.kill();reject(Error('Image processing timed out'));},30000);p.stdout.on('data',d=>{output+=d;if(output.length>30000000)p.kill();});p.once('error',()=>{clearTimeout(timer);reject(Error('Image processing unavailable'));});p.once('exit',code=>{clearTimeout(timer);try{if(code)throw Error('Invalid image. Use JPG, PNG or WebP up to 10 MB.');resolve(JSON.parse(output));}catch(e){reject(e);}});p.stdin.on('error',()=>{});p.stdin.end(JSON.stringify(body));});}
export function createAssetsMiddleware({root,origin,env,authorize}){
 const db=createClient(env.SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
 return async(req,res,next)=>{if(req.url!=='/api/admin/assets/upload')return next();const send=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
 try{
  if(req.method!=='POST'||req.headers.host!==new URL(origin).host||req.headers.origin!==origin||req.headers['sec-fetch-site']==='cross-site'||!await authorize(req))return send(403,{error:'Unauthorized'});
  if(!req.headers['content-type']?.startsWith('application/json'))return send(415,{error:'Use an image upload'});
  const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>14500000)return send(413,{error:'Image must be 10 MB or smaller'});chunks.push(chunk);}
  const body=validateUpload(JSON.parse(Buffer.concat(chunks).toString('utf8'))),id=randomUUID();
  const normalized=await normalizeSvg(root,env,body),prepared=await prepare(root,env,normalized),files=[];
  try{
   for(const v of prepared.variants){const file=(body.target==='hero'?'editorial/uploads/':body.target==='closure'?'closures/uploads/':'catalog/uploads/')+id+(normalized.normalizedIcon?'-a':'')+'-'+v.width+'.webp';const {error}=await db.storage.from('catalog-images').upload(file,Buffer.from(v.data,'base64'),{contentType:'image/webp',upsert:false,cacheControl:'31536000'});if(error)throw error;files.push({...v,file});}
   if(body.target==='closure')return send(200,{id,target:body.target,icon:files.at(-1).file});
   const asset=body.target==='hero'?{id,name:body.name,width:prepared.width,height:prepared.height,variants:files.map(({data,...v})=>v)}:{image:files.at(-1).file};
   const {error}=await db.rpc('register_admin_image',{p_id:id,p_target:body.target,p_metadata:{code:body.code,type:body.type,group:body.group,collection:body.collection},p_asset:asset});if(error)throw error;
   return send(200,{id,target:body.target,code:body.code});
  }catch(e){if(files.length)await db.storage.from('catalog-images').remove(files.map(v=>v.file));throw e;}
 }catch(e){const message=e.message||'';if(env.COLTI_UPLOAD_DIAGNOSTICS==='1')console.error('Upload failed:',e.code||'',message);send(400,{error:/duplicate key/.test(message)?'This design code already exists.':/Invalid image|Check code|processing|timed out/.test(message)?message:'Could not upload. Please retry.'});}
 };}
