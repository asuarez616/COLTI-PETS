import {createClient} from '@supabase/supabase-js';
export function createStoreAttachmentsMiddleware({origin,env}){
 const service=createClient(env.SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 return async(req,res)=>{
  const send=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
  try{
   if(req.method!=='POST'||req.headers.host!==new URL(origin).host||req.headers.origin!==origin)return send(403,{error:'ORIGIN_DENIED'});
   const token=req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];if(!token)return send(401,{error:'AUTH_REQUIRED'});
   const auth=await service.auth.getUser(token);if(auth.error||!auth.data.user)return send(401,{error:'AUTH_REQUIRED'});
   let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>4096)return send(413,{error:'PAYLOAD_LIMIT'});chunks.push(chunk);}
   const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));
   const client=createClient(env.SUPABASE_URL,env.VITE_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:'Bearer '+token}}});
   if(body.action==='begin'){
    const result=await client.rpc('begin_attachment',{p_draft:body.draftId,p_item:body.itemId,p_name:body.name,p_mime:body.mime,p_size:body.size,p_purpose:body.purpose});if(result.error)throw result.error;return send(200,result.data);
   }
   const result=await client.from('attachments').select('*').eq('id',body.id).eq('owner_user_id',auth.data.user.id).single();if(result.error||!result.data)return send(404,{error:'FILE_NOT_FOUND'});const attachment=result.data;
   if(body.action==='discard'){
    const discarded=await client.rpc('discard_attachment',{p_id:attachment.id});if(discarded.error)throw discarded.error;
    const removed=await service.storage.from('order-attachments').remove([discarded.data]);if(removed.error)throw removed.error;return send(200,{ok:true});
   }
   if(body.action!=='finish'||attachment.status!=='pending')return send(409,{error:'INVALID_FILE_STATE'});
   // Only the signature is needed; Content-Range supplies the actual stored size.
   // Avoid downloading up to 10 MB back through the host after the browser upload.
   const objectUrl=env.SUPABASE_URL.replace(/\/$/,'')+'/storage/v1/object/authenticated/order-attachments/'+attachment.object_path.split('/').map(encodeURIComponent).join('/');
   const downloaded=await fetch(objectUrl,{headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,Range:'bytes=0-11'},signal:AbortSignal.timeout(15000)});
   if(!downloaded.ok)throw Error('UPLOAD_NOT_FOUND');
   const bytes=new Uint8Array(await downloaded.arrayBuffer());
   const storedSize=downloaded.status===206?Number(downloaded.headers.get('content-range')?.match(/\/(\d+)$/)?.[1]):bytes.length;
   const mime=bytes[0]===255&&bytes[1]===216&&bytes[2]===255?'image/jpeg':bytes.length>=8&&[137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b)?'image/png':new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP'?'image/webp':null;
   const valid=storedSize===Number(attachment.byte_size)&&storedSize>0&&storedSize<=10485760&&mime===attachment.mime_type;
   const verified=await service.rpc('verify_attachment',{p_id:attachment.id,p_user:auth.data.user.id,p_valid:valid});if(verified.error)throw verified.error;
   if(!valid){await service.storage.from('order-attachments').remove([attachment.object_path]);return send(400,{error:'INVALID_FILE_CONTENT'});}return send(200,verified.data);
  }catch(error){const message=String(error.message||'');send(/INVALID_|LIMIT/.test(message)?400:500,{error:/INVALID_|LIMIT|UPLOAD_NOT_FOUND|ATTACHMENT_STATE_CONFLICT/.test(message)?message:'UPLOAD_FAILED'});}
 };
}
