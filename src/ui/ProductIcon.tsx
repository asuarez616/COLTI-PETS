import {closureIconUrl} from '../data/closuresBackend';
import {useEffect,useState} from 'react';
export function ProductIcon({path,className='',label=''}:{path:string;className?:string;label?:string}){
 const url=closureIconUrl(path);
 const normalized=/-a-\d+\.webp$/.test(path);
 const [cropped,setCropped]=useState<{source:string;image:string}|null>(null);
 useEffect(()=>{
  if(!normalized)return;
  let cancelled=false;const image=new Image();image.crossOrigin='anonymous';
  image.onload=()=>{try{
   const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
   const context=canvas.getContext('2d');if(!context)return;context.drawImage(image,0,0);
   const pixels=context.getImageData(0,0,canvas.width,canvas.height).data;
   let left=canvas.width,top=canvas.height,right=-1,bottom=-1;
   for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(pixels[(y*canvas.width+x)*4+3]>8){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
   if(right<left)return;
   const output=document.createElement('canvas');output.width=right-left+1;output.height=bottom-top+1;
   output.getContext('2d')?.drawImage(canvas,left,top,output.width,output.height,0,0,output.width,output.height);
   if(!cancelled)setCropped({source:url,image:output.toDataURL('image/png')});
  }catch{/* Keep the original icon if the image cannot be inspected. */}};
  image.src=url;return()=>{cancelled=true;};
 },[url,normalized]);
 const mask=cropped?.source===url?cropped.image:url;
 return normalized||/\.svg(?:[?#]|$)/i.test(url)?<span className={'product-icon '+className} data-icon-source={path} role={label?'img':undefined} aria-label={label||undefined} aria-hidden={!label||undefined} style={{maskImage:`url("${mask}")`,WebkitMaskImage:`url("${mask}")`}}/>:<img className={className} src={url} alt={label}/>;
}
