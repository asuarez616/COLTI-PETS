import manifest from './image-manifest.json';
const assets=manifest as Record<string,{width:number;height:number;variants:{file:string;width:number;height:number;bytes:number}[]}>;
/** Remote variants are used only after the publishing script advertises their version. */
export function responsiveAsset(src:string,version?:string){
 if((version?.startsWith('drive-v1')||version==='admin-upload-v1')&&/\/catalog\/(drive|uploads)\/[\w-]+-800\.webp$/.test(src)){
  const suffix='?v='+encodeURIComponent(version);
  return {src:src+suffix,width:undefined,height:undefined,srcSet:[240,480,800].map(w=>`${src.replace(/-800\.webp$/,'-'+w+'.webp')}${suffix} ${w}w`).join(', ')};
 }
 const local=src.startsWith(import.meta.env.BASE_URL)&&!/^https?:/.test(src);
 if(!local&&version!=='responsive-v1')return undefined;
 const key=Object.keys(assets).find(k=>local?(src.endsWith('/'+k)||src===k):(k.startsWith('catalog/')&&src.endsWith('/'+k.split('/').at(-1))));
 if(!key)return undefined;
 const asset=assets[key],prefix=local?src.slice(0,-key.length):src.slice(0,src.lastIndexOf('/')+1);
 const path=(file:string)=>prefix+(local?file:file.split('/').at(-1));
 return {...asset,src:path(asset.variants.at(-1)!.file),srcSet:asset.variants.map(v=>`${path(v.file)} ${v.width}w`).join(', ')};
}
