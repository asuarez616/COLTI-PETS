import {useEffect,useState} from 'react';
import type {Design,Locale} from '../domain/model';
import {responsiveAsset} from '../catalog/images';

const imageSizes='(min-width:1200px) 14vw, (min-width:801px) 24vw, (min-width:601px) 30vw, 45vw';
const pending=new Map<string,Promise<void>>();
export function preloadGalleryImage(design:Design){
 const asset=responsiveAsset(design.image,design.asset_version),src=asset?.src||design.image;
 if(pending.has(src))return pending.get(src)!;
 const image=new Image();image.decoding='async';image.sizes=imageSizes;if(asset?.srcSet)image.srcset=asset.srcSet;image.src=src;
 const task=image.decode().catch(()=>{pending.delete(src);});pending.set(src,task);return task;
}
export default function GalleryImage({design,locale}:{design:Design;locale:Locale}){
 const asset=responsiveAsset(design.image,design.asset_version),src=asset?.src||design.image;
 const [ready,setReady]=useState(''),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0);
 useEffect(()=>{setFailed(false);},[src]);
 return <span className={'gallery-image-frame'+(ready===src?' is-ready':'')}>
  {!failed&&<span className="gallery-image-skeleton" aria-hidden="true"/>}
  {failed?<span className="image-failed"><span>{design.code}</span><button type="button" onClick={e=>{e.stopPropagation();setFailed(false);setAttempt(n=>n+1);}}>↻ Retry / Reintentar</button></span>:<img key={src+attempt} className="design-image" src={src} srcSet={asset?.srcSet} sizes={imageSizes} width={asset?.width} height={asset?.height} alt={`${locale==='es'?'Collar COLTI, diseño':'COLTI collar, design'} ${design.code}`} loading="lazy" decoding="async" onLoad={async e=>{const image=e.currentTarget;try{await image.decode();}catch{/* A completed image can still be displayed. */}if(image.isConnected&&image.naturalWidth)setReady(src);}} onError={()=>setFailed(true)}/>}
 </span>;
}
