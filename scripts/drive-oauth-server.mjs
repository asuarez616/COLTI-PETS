import {randomBytes,createCipheriv,createDecipheriv} from 'node:crypto';
import {readFile,writeFile,mkdir,rename,unlink} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {join,dirname} from 'node:path';
import {createDriveOAuth} from './drive-oauth-core.mjs';
export function encryptedDriveStore(path,encodedKey){
 const key=Buffer.from(encodedKey||'','base64');const configured=key.length===32;
 return {configured,async read(){let value;try{value=JSON.parse(await readFile(path,'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}if(!configured)throw Error('DriveNotConfigured');const decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(value.iv,'base64'));decipher.setAuthTag(Buffer.from(value.tag,'base64'));return JSON.parse(Buffer.concat([decipher.update(Buffer.from(value.data,'base64')),decipher.final()]).toString('utf8'));},async write(value){if(!configured)throw Error('DriveNotConfigured');const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);const data=Buffer.concat([cipher.update(JSON.stringify(value)),cipher.final()]);await mkdir(dirname(path),{recursive:true});await writeFile(path+'.tmp',JSON.stringify({iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:data.toString('base64')}),{mode:0o600});await rename(path+'.tmp',path);},async clear(){await unlink(path).catch(e=>{if(e.code!=='ENOENT')throw e;});}};
}
function execute(root,args,env){return new Promise((resolve,reject)=>{const child=spawn(process.execPath,args,{cwd:root,env,stdio:['ignore','ignore','pipe'],windowsHide:true});let diagnostic='';child.stderr.on('data',chunk=>{diagnostic=(diagnostic+chunk).slice(-12000);});const timeout=setTimeout(()=>child.kill(),1800000);child.once('error',()=>{clearTimeout(timeout);reject(Error('DriveSyncFailed'));});child.once('exit',code=>{clearTimeout(timeout);if(code===0)resolve();else{void writeFile(join(root,'.asset-tools/private/drive-last-failure.txt'),diagnostic||('Exit '+code)).catch(()=>{}).finally(()=>reject(Error('DriveSyncFailed')));}});});}
export function createDriveMiddleware({root,origin,env,authorize,production=false}){
 const store=encryptedDriveStore(join(root,'.asset-tools/private/drive-oauth.json'),env.GOOGLE_OAUTH_TOKEN_KEY);
 const oauth=createDriveOAuth({clientId:env.GOOGLE_OAUTH_CLIENT_ID,clientSecret:env.GOOGLE_OAUTH_CLIENT_SECRET,redirectUri:origin+'/api/admin/drive/callback',store,sync:async(target,token)=>{if(production&&(!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY))throw Error('DriveNotConfigured');const runEnv={...process.env,...env,GOOGLE_DRIVE_ACCESS_TOKEN:token};await execute(root,['scripts/sync-drive-catalog.mjs',...(target==='hero'?['--hero']:[]),...(production?['--publish']:[])],runEnv);}});

 function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
 return async(req,res,next)=>{
  const url=new URL(req.url,origin);if(!url.pathname.startsWith('/api/admin/drive/'))return next();
  res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');
  const action=url.pathname.slice('/api/admin/drive/'.length);
  try{
   if(req.headers.host!==new URL(origin).host)throw Error('Unauthorized');
   if(action==='callback'&&req.method==='GET'){
    const browser=req.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith('colti-drive-state='))?.slice('colti-drive-state='.length)||'';
    let query='drive=connected';try{await oauth.callback({state:url.searchParams.get('state'),code:url.searchParams.get('code'),error:url.searchParams.get('error'),browser});}catch(e){query='drive_error='+encodeURIComponent(e.message.startsWith('Drive')?e.message:'DriveSyncFailed');}
    res.setHeader('Set-Cookie','colti-drive-state=; HttpOnly; SameSite=Lax; Path=/api/admin/drive; Max-Age=0'+(origin.startsWith('https:')?'; Secure':''));res.writeHead(303,{Location:'/admin/catalog?'+query});return res.end();
   }
   if(req.headers.origin&&req.headers.origin!==origin)throw Error('Unauthorized');
   if(req.headers['sec-fetch-site']==='cross-site')throw Error('Unauthorized');
   if(!await authorize(req))throw Error('Unauthorized');
   if(action==='status'&&req.method==='GET')return json(res,200,await oauth.status());
   if(req.method!=='POST'||req.headers.origin!==origin||!req.headers['content-type']?.startsWith('application/json'))return json(res,405,{error:'Unauthorized'});
   let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>4096)throw Error('DriveSyncFailed');}const body=JSON.parse(raw||'{}');
   if(action==='connect'){const browser=randomBytes(32).toString('base64url');const result=oauth.connect(browser);res.setHeader('Set-Cookie','colti-drive-state='+browser+'; HttpOnly; SameSite=Lax; Path=/api/admin/drive; Max-Age=600'+(origin.startsWith('https:')?'; Secure':''));return json(res,200,result);}
   if(action==='disconnect'){await oauth.disconnect();return json(res,200,{ok:true});}
   if(action==='sync'){await oauth.synchronize(body.target);return json(res,200,{ok:true});}
   return json(res,404,{error:'DriveSyncFailed'});
  }catch(e){const error=['Unauthorized','DriveNotConfigured','DriveNotConnected','DriveReconnect','DriveBusy'].includes(e.message)?e.message:'DriveSyncFailed';json(res,error==='Unauthorized'?403:error==='DriveBusy'?409:400,{error});}
 };
}
