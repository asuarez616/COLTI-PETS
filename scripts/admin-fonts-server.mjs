import {spawn} from 'node:child_process';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
export function createFontsMiddleware({root,origin,env,authorize}){
 const legacyHashes=new Map();
 const db=createClient(env.SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
 return async(req,res,next)=>{if(req.url!=='/api/admin/fonts/upload')return next();const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 try{if(req.method!=='POST'||req.headers.origin!==origin||req.headers.host!==new URL(origin).host||!await authorize(req))return send(403,{error:'Unauthorized'});
 const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>14000000)return send(413,{error:'Choose a font up to 10 MB.'});chunks.push(chunk);}
 const body=JSON.parse(Buffer.concat(chunks).toString());if(typeof body.name!=='string'||body.name.length>200||typeof body.data!=='string'||!/^.*\.woff2?$/i.test(body.name))throw Error('Invalid font');
 await new Promise((resolve,reject)=>{const process=spawn(env.PYTHON_BIN||'python',[join(root,'scripts/validate-font-upload.py')],{env,windowsHide:true,stdio:['pipe','pipe','ignore']});const timer=setTimeout(()=>{process.kill();reject(Error('Font validation timed out'));},15000);process.once('error',()=>{clearTimeout(timer);reject(Error('Font validation unavailable'));});process.once('exit',code=>{clearTimeout(timer);code?reject(Error('Invalid or corrupted font')):resolve();});process.stdin.on('error',()=>{});process.stdin.end(JSON.stringify(body));});
 const bytes=Buffer.from(body.data,'base64'),hash=createHash('sha256').update(bytes).digest('hex'),extension=body.name.split('.').pop().toLowerCase(),path='managed/'+hash+'.'+extension;
 const ownerDb=createClient(env.SUPABASE_URL,env.VITE_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false},global:{headers:{Authorization:req.headers.authorization}}});const duplicate=await ownerDb.rpc('admin_lettering_catalog');if(duplicate.error)throw duplicate.error;if(duplicate.data.fonts.some(f=>f.asset_hash===hash&&f.id!==body.id))return send(409,{error:'This font already exists in Lettering.'});
 const legacy=duplicate.data.fonts.filter(f=>!f.asset_hash&&f.id!==body.id&&f.asset_path);
 for(let index=0;index<legacy.length;index+=4){const batch=legacy.slice(index,index+4);await Promise.all(batch.map(async font=>{const key=font.asset_path+'|'+font.asset_version;if(!legacyHashes.has(key)){const stored=await db.storage.from('font-assets').download(font.asset_path);if(stored.error)throw stored.error;legacyHashes.set(key,createHash('sha256').update(Buffer.from(await stored.data.arrayBuffer())).digest('hex'));}}));if(batch.some(font=>legacyHashes.get(font.asset_path+'|'+font.asset_version)===hash))return send(409,{error:'This font already exists in Lettering.'});}

 const result=await db.storage.from('font-assets').upload(path,bytes,{contentType:extension==='woff2'?'font/woff2':'font/woff',upsert:false,cacheControl:'31536000'});if(result.error&&!/already exists|duplicate/i.test(result.error.message))throw result.error;
 send(200,{path,hash});
 }catch(e){console.error('Font upload failed:',e.code||'',e.message);send(400,{error:/Invalid|validation|timed out/.test(e.message)?e.message:'Could not upload the font. Please retry.'});}
 };
}
