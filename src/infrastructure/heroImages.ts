import initialImages from '../catalog/hero-drive.json';
import type {HeroImage} from '../domain/admin';
import {supabase} from './supabaseRepositories';
export async function loadHeroImages():Promise<HeroImage[]>{
 if(!supabase)return initialImages;
 const {data}=supabase.storage.from('site-content').getPublicUrl('hero-manifest.json');
 const response=await fetch(data.publicUrl,{cache:'no-store',signal:AbortSignal.timeout(15000)});
 if(!response.ok&&response.status!==404)throw Error('Hero source unavailable');
 const extra=await supabase.from('uploaded_hero_images').select('asset').order('created_at');if(extra.error)throw Error('Hero uploads unavailable');
 const images:HeroImage[]=[...(response.status===404?initialImages:await response.json()),...(extra.data||[]).map(row=>row.asset)];
 if(!Array.isArray(images)||images.length>500||images.some(i=>typeof i.id!=='string'||typeof i.name!=='string'||!Number.isFinite(i.width)||i.width<=0||!Number.isFinite(i.height)||i.height<=0||!Array.isArray(i.variants)||!i.variants.length||i.variants.some(v=>!/^editorial\/[A-Za-z0-9_./-]+\.(webp|png|jpg)$/.test(v.file)||v.file.includes('..')||v.width<=0||v.height<=0)))throw Error('Invalid hero source');
 return images.map(i=>({...i,variants:i.variants.map(v=>({...v,file:supabase!.storage.from('catalog-images').getPublicUrl(v.file).data.publicUrl}))}));
}
