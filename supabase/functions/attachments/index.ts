import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import {attachmentError} from './errors.ts';
const url=Deno.env.get('SUPABASE_URL')!;
const publicKey=Deno.env.get('SUPABASE_ANON_KEY')!;
const service=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
const origins=(Deno.env.get('ALLOWED_ORIGINS')||'http://127.0.0.1:5173,http://localhost:5173').split(',');
function mime(bytes:Uint8Array) {
 if(bytes.length>=8 && bytes.slice(0,8).every((b,i)=>b===[137,80,78,71,13,10,26,10][i]))return 'image/png';
 if(bytes.length>=3 && bytes[0]===255 && bytes[1]===216 && bytes[2]===255)return 'image/jpeg';
 if(bytes.length>=12 && new TextDecoder().decode(bytes.slice(0,4))==='RIFF' && new TextDecoder().decode(bytes.slice(8,12))==='WEBP')return 'image/webp';
 return null;
}
Deno.serve(async req=>{
 const origin=req.headers.get('origin')||'';
 const headers={'Access-Control-Allow-Origin':origins.includes(origin)?origin:origins[0],'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin','Content-Type':'application/json'};
 const respond=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(origin && !origins.includes(origin))return respond({error:'ORIGIN_DENIED'},403);
 if(req.method==='OPTIONS')return new Response('ok',{headers});
 if(req.method!=='POST')return respond({error:'METHOD_NOT_ALLOWED'},405);
 try {
  const authorization=req.headers.get('authorization')||'';
  const token=authorization.replace(/^Bearer /,'');
  const {data:{user},error:authError}=await service.auth.getUser(token);
  if(authError || !user)return respond({error:'AUTH_REQUIRED'},401);
  const client=createClient(url,publicKey,{global:{headers:{Authorization:authorization}},auth:{persistSession:false}});
  const raw=await req.text(); if(raw.length>4096)return respond({error:'PAYLOAD_LIMIT'},413);
  const body=JSON.parse(raw);
  if(body.action==='begin'){
   const {data,error}=await client.rpc('begin_attachment',{p_draft:body.draftId,p_item:body.itemId,p_name:body.name,p_mime:body.mime,p_size:body.size,p_purpose:body.purpose});
   if(error)throw error;
   // Client uploads under RLS, with no service-role signed upload bypass.
   return respond(data);
  }
  const {data:a,error}=await service.from('attachments').select('*').eq('id',body.id).eq('owner_user_id',user.id).single();
  if(error || !a)return respond({error:'FILE_NOT_FOUND'},404);
  if(body.action==='discard'){
   const {data:path,error:e}=await client.rpc('discard_attachment',{p_id:a.id}); if(e)throw e;
   const {error:removeError}=await service.storage.from('order-attachments').remove([path]); if(removeError)throw removeError;
   return respond({ok:true});
  }
  if(body.action!=='finish' || a.status!=='pending')return respond({error:'INVALID_FILE_STATE'},409);
  const {data:blob,error:downloadError}=await service.storage.from('order-attachments').download(a.object_path);
  if(downloadError || !blob)throw new Error('UPLOAD_NOT_FOUND');
  const bytes=new Uint8Array(await blob.arrayBuffer());
  const valid=bytes.byteLength===Number(a.byte_size) && bytes.byteLength<=10485760 && mime(bytes)===a.mime_type;
  const {data:ready,error:verifyError}=await service.rpc('verify_attachment',{p_id:a.id,p_user:user.id,p_valid:valid}); if(verifyError)throw verifyError;
  if(!valid){await service.storage.from('order-attachments').remove([a.object_path]);return respond({error:'INVALID_FILE_CONTENT'},400);}
  return respond(ready);
 }catch(err){
  // No payload, phone, token, or image logging.
  const failure=attachmentError(err);return respond({error:failure.code},failure.status);
 }
});
