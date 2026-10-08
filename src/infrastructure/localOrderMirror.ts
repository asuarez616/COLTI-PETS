import type {Order,Attachment} from '../domain/model';
const base=import.meta.env.VITE_LOCAL_ADMIN_BRIDGE;
export const localOrderMirrorEnabled=!!base&&location.hostname==='127.0.0.1'&&base==='http://127.0.0.1:4174';
export async function mirrorLocalOrders(orders:Order[],getFile:(id:string)=>Promise<Blob>){
 if(!localOrderMirrorEnabled)return;
 const response=await fetch(base+'/api/admin/local-orders/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({orders})});if(!response.ok)throw Error('LOCAL_ADMIN_SYNC_FAILED');
 let incomplete=false;
 for(const attachment of orders.flatMap(o=>o.items.flatMap(i=>i.attachments))){try{
  const path=base+'/api/admin/local-orders/files/'+encodeURIComponent(attachment.id);
  if((await fetch(path)).ok)continue;
  const file=await getFile(attachment.id),upload=await fetch(path,{method:'POST',headers:{'Content-Type':attachment.mime_type},body:file});if(!upload.ok)throw Error('LOCAL_ADMIN_FILE_SYNC_FAILED');
 }catch{incomplete=true;}}
 if(incomplete)throw Error('LOCAL_ADMIN_FILE_SYNC_FAILED');
}
export function localOrderAttachmentUrl(attachment:Attachment){return base+'/api/admin/local-orders/files/'+encodeURIComponent(attachment.id);}
