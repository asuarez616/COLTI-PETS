import {createHash} from 'node:crypto';
export const widths={ '2XS':[1],XS:[1,1.5],S:[1.5,2],SM:[2],M:[2.5],ML:[2.5,3],L:[3],XL:[3],'2XL':[3] };
export function assetId(file){return file.id+'-'+createHash('sha256').update(file.md5Checksum||file.modifiedTime||'initial').digest('hex').slice(0,12);}
export function designId(fileId){
 const h=createHash('sha256').update('colti-drive:'+fileId).digest('hex').slice(0,32).split('');h[12]='5';h[16]='8';
 const s=h.join('');return `${s.slice(0,8)}-${s.slice(8,12)}-${s.slice(12,16)}-${s.slice(16,20)}-${s.slice(20)}`;
}
export function buildDesigns(files,groups){
 const seen=new Set(),codes=new Set();return files.filter(f=>/^image\/(png|jpeg|webp)$/.test(f.mimeType)).map(f=>{
  if(seen.has(f.id))throw new Error('A Drive image belongs to multiple catalogue groups: '+f.id);seen.add(f.id);
  const group=groups.find(g=>g.folderId===f.group);if(!group)throw new Error('Unknown Drive folder');
  const code=f.name.replace(/\.(png|jpe?g|webp)$/i,'').toUpperCase();if(codes.has(code))throw new Error('Duplicate design code: '+code);codes.add(code);
  return {id:designId(f.id),code,type:group.type,source_collection:group.type==='printed'?(f.category||'').split('/').filter(Boolean).at(-1)||'Sin colección':'',image:`catalog/drive/${assetId(f)}-800.webp`,active:true,is_test_data:false,asset_version:'drive-v1:'+ (f.md5Checksum||f.modifiedTime||'initial'),compatibility:group.sizes.flatMap(size_code=>{if(!widths[size_code])throw new Error('Unknown size');return widths[size_code].map(width_cm=>({size_code,width_cm}));})};
 }).sort((a,b)=>a.code.localeCompare(b.code,undefined,{numeric:true})||a.id.localeCompare(b.id));
}
export async function listDriveImages(groups,request){
 const files=[];
 for(const group of groups){
  const visited=new Set();
  async function walk(folderId,category=''){
   if(visited.has(folderId))return;visited.add(folderId);let pageToken;
   do{
    const params=new URLSearchParams({q:`'${folderId}' in parents and trashed = false`,fields:'nextPageToken,files(id,name,mimeType,modifiedTime,md5Checksum)',pageSize:'1000',supportsAllDrives:'true',includeItemsFromAllDrives:'true'});
    if(pageToken)params.set('pageToken',pageToken);
    const data=await request('https://www.googleapis.com/drive/v3/files?'+params);
    if(!Array.isArray(data.files))throw new Error('Incomplete Drive listing');
    for(const f of data.files){if(f.mimeType==='application/vnd.google-apps.folder'&&group.recursive)await walk(f.id,category?category+'/'+f.name:f.name);else if(/^image\/(png|jpeg|webp)$/.test(f.mimeType))files.push({...f,group:group.folderId,category});}
    pageToken=data.nextPageToken;
   }while(pageToken);
  }
  await walk(group.folderId);
 }
 return files;
}
