import optimized from './font-assets.json';
import type {FontRecord} from '../domain/model';
const promises=new Map<string,Promise<string>>();
export function fontText(font:FontRecord,name:string){
 if(font.presentation?.transform==='uppercase')return name.toLocaleUpperCase();
 if(font.presentation?.transform==='channel')return name.trim().split(/\s+/).filter(Boolean).map(word=>word+(word.length>7?'{':word.length<=3?'}':']')).join(' ');
 return name;
}
export function loadFont(font:FontRecord):Promise<string>{
 if(font.state!=='ready'||!font.asset_path)return Promise.resolve('Arial');
 const id=`colti-font-${font.number}-${font.asset_version}`.replace(/[^a-zA-Z0-9-]/g,'-');
 if(!promises.has(id))promises.set(id,(async()=>{try{
  const path=font.asset_path!;
  const mapping=optimized as Record<string,string>,key=Object.keys(mapping).find(k=>path===import.meta.env.BASE_URL+k);
  const source=key?import.meta.env.BASE_URL+mapping[key]:path;
  const face=new FontFace(id,`url(${JSON.stringify(source)})`);await face.load();document.fonts.add(face);return id;
 }catch(e){promises.delete(id);throw e;}})());
 return promises.get(id)!;
}

export function fontPreviewScale(font?:FontRecord){return font?.number===17||font?.number===18?0.72:1;}

export function fontDisplayOrder(a:FontRecord,b:FontRecord){return (a.display_order??a.number)-(b.display_order??b.number)||a.number-b.number;}
