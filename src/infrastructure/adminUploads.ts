import {supabase} from './supabaseRepositories';
export interface UploadMetadata {target:'catalog'|'hero'|'closure';code:string;type:'woven'|'printed';group:string;collection:string}
export async function uploadImage(file:File,metadata:UploadMetadata){
 const svg=metadata.target==='closure'&&/\.svg$/i.test(file.name);
 if(!svg&&!['image/jpeg','image/png','image/webp',...(metadata.target==='closure'?['image/svg+xml']:[])].includes(file.type)||file.size>10485760||!file.size)throw Error(metadata.target==='closure'?'Use SVG, JPG, PNG or WebP up to 10 MB.':'Use JPG, PNG or WebP up to 10 MB.');
 const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('Could not read the image.'));reader.readAsDataURL(file);});
 const session=supabase?(await supabase.auth.getSession()).data.session:null;if(!session)throw Error('Sign in again to upload.');
 const response=await fetch('/api/admin/assets/upload',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({...metadata,name:file.name,data})});
 const result=await response.json();if(!response.ok)throw Error(result.error||'Could not upload. Please retry.');return result as {id:string;target:string;code:string;icon?:string};
}
