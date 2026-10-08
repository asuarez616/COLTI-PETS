import {supabase,imageUrl} from './supabaseRepositories';
import {parseFont} from '../domain/validation';
import {validateFontFile,normalizeLettering,type LetteringCatalog} from '../domain/lettering';
import type {LetteringRepository} from '../application/lettering';
function decode(value:LetteringCatalog){return {...value,fonts:normalizeLettering(value.fonts.map(f=>parseFont({...f,asset_path:f.asset_path?imageUrl(f.asset_path,'font-assets'):null}))) };}
export const letteringRepository:LetteringRepository={
 async load(){if(!supabase)throw Error('Lettering management requires the connected Admin.');const {data,error}=await supabase.rpc('admin_lettering_catalog');if(error)throw error;return decode(data);},
 async save(value,files){if(!supabase)throw Error('Lettering management requires the connected Admin.');const fonts=[];
 for(const f of value.fonts){let next={...f};const file=files.get(f.id!);if(file){const valid=await validateFontFile(file),path='managed/'+valid.hash+'.'+valid.extension;
 const duplicate=value.fonts.find(v=>v.id!==f.id&&v.asset_hash===valid.hash&&!v.deleted);if(duplicate)throw Error('This font already exists: '+duplicate.label);
 const session=(await supabase.auth.getSession()).data.session;if(!session)throw Error('Sign in again to upload.');
 const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('Could not read font.'));reader.readAsDataURL(file);});
 const response=await fetch('/api/admin/fonts/upload',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({id:f.id,name:file.name,data})});
 const result=await response.json();if(!response.ok)throw Error(result.error||'Could not upload font.');if(result.hash!==valid.hash)throw Error('Font verification failed.');
 next={...next,asset_path:path,asset_hash:valid.hash,asset_version:valid.hash,css_family:'colti-'+f.id,state:'ready'};
 }else if(next.asset_path){const prefix=imageUrl('','font-assets');if(next.asset_path.startsWith(prefix))next.asset_path=next.asset_path.slice(prefix.length);}
 fonts.push(next);}
 const {data,error}=await supabase.rpc('admin_save_lettering',{p_revision:value.revision,p_fonts:fonts});if(error)throw error;return decode(data);
 }};
