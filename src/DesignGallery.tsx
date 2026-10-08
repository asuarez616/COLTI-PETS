import {useEffect,useRef,useState} from 'react';
import type {Design,Locale} from './domain/model';
import {printedCollection} from './domain/catalogGroups';
import {responsiveAsset} from './catalog/images';
import GalleryImage,{preloadGalleryImage} from './ui/GalleryImage';

const colors=[
 {id:'red',en:'Red',es:'Rojo',hex:'#b84242'},
 {id:'orange',en:'Orange',es:'Naranja',hex:'#d78239'},
 {id:'yellow',en:'Yellow',es:'Amarillo',hex:'#dbbe46'},
 {id:'green',en:'Green',es:'Verde',hex:'#508967'},
 {id:'blue',en:'Blue',es:'Azul',hex:'#4874a5'},
 {id:'purple',en:'Purple',es:'Morado',hex:'#895596'},
 {id:'pink',en:'Pink',es:'Rosa',hex:'#d48bab'},
];
const cache=new Map<string,string[]>();
/** Read color families from the product image, never from its collection or code. */
async function imageColors(design:Design):Promise<string[]>{
 const key=design.image+'|'+design.asset_version;if(cache.has(key))return cache.get(key)!;
 const asset=responsiveAsset(design.image,design.asset_version);
 const src=asset?.srcSet?.split(', ')[0].split(' ')[0]||asset?.src||design.image;
 const image=new Image();image.crossOrigin='anonymous';image.src=src;let timer:ReturnType<typeof setTimeout>|undefined;try{await Promise.race([image.decode(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('IMAGE_COLOR_TIMEOUT')),10000);})]);}finally{if(timer)clearTimeout(timer);}
 const canvas=document.createElement('canvas');canvas.width=80;canvas.height=80;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)return [];
 ctx.drawImage(image,0,0,80,80);const pixels=ctx.getImageData(8,16,64,44).data;
 const counts=new Map<string,number>();let saturated=0;
 for(let i=0;i<pixels.length;i+=4){
  const r=pixels[i]/255,g=pixels[i+1]/255,b=pixels[i+2]/255,max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;
  if(delta<.12||max<.2||delta/max<.23)continue;
  let hue=(max===r?(g-b)/delta+(g<b?6:0):max===g?(b-r)/delta+2:(r-g)/delta+4)*60;
  const id=hue<18||hue>=345?'red':hue<45?'orange':hue<70?'yellow':hue<170?'green':hue<255?'blue':hue<295?'purple':'pink';
  counts.set(id,(counts.get(id)||0)+1);saturated++;
 }
 const result=[...counts].filter(([,n])=>n>=Math.max(12,saturated*.07)).map(([id])=>id);cache.set(key,result);return result;
}
export default function DesignGallery({designs,family,locale,selected,onSelect,onPreview}:{designs:Design[];family:string;locale:Locale;selected:string;onSelect:(id:string)=>void;onPreview:(design:Design)=>void}){
 const [collection,setCollection]=useState(''),[color,setColor]=useState(''),[palettes,setPalettes]=useState<Record<string,string[]>>({}),[loading,setLoading]=useState(false),[failed,setFailed]=useState(false);
 const es=locale==='es',identity=designs.map(d=>d.id+'|'+d.asset_version).join(',');
 useEffect(()=>{setCollection('');setColor('');},[family]);
 useEffect(()=>{let live=true;setLoading(true);setFailed(false);let index=0;const next:Record<string,string[]>={};
  async function worker(){while(index<designs.length){const design=designs[index++];try{next[design.id]=await imageColors(design);}catch{if(live)setFailed(true);}}}
  Promise.all(Array.from({length:Math.min(4,designs.length)},worker)).then(()=>{if(live){setPalettes(next);setLoading(false);}});return()=>{live=false;};
 },[identity]);
 const collections=[...new Set(designs.map(printedCollection))].sort((a,b)=>a.localeCompare(b,locale));
 const visible=designs.filter(d=>(!collection||printedCollection(d)===collection)&&(!color||palettes[d.id]?.includes(color)));
 const gallery=useRef<HTMLDivElement>(null),visibleIdentity=visible.map(d=>d.id+'|'+d.asset_version).join(',');
 useEffect(()=>{
  visible.slice(0,12).forEach(d=>void preloadGalleryImage(d));
  const root=gallery.current;if(!root)return;
  const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;const index=Number((entry.target as HTMLElement).dataset.galleryIndex);const design=visible[index];if(design)void preloadGalleryImage(design);observer.unobserve(entry.target);}}, {root,rootMargin:'100% 0px'});
  root.querySelectorAll('[data-gallery-index]').forEach(node=>observer.observe(node));return()=>observer.disconnect();
 },[visibleIdentity]);
 return <div className="store-design-browser">
  <div className="store-design-filters">
   {family==='printed'&&<label>{es?'Colección':'Collection'}<select aria-label={es?'Colección':'Collection'} value={collection} onChange={e=>setCollection(e.target.value)}><option value="">{es?'Todas las colecciones':'All collections'}</option>{collections.map(c=><option key={c}>{c}</option>)}</select></label>}
   <fieldset className="design-color-filters"><legend>{es?'Color':'Color'}</legend><div><button type="button" className={!color?'is-active':''} aria-pressed={!color} onClick={()=>setColor('')}>{es?'Todos':'All'}</button>{colors.map(c=><button type="button" key={c.id} disabled={loading||!Object.values(palettes).some(p=>p.includes(c.id))} aria-label={es?c.es:c.en} title={es?c.es:c.en} aria-pressed={color===c.id} className={color===c.id?'is-active':''} onClick={()=>setColor(c.id)}><span style={{background:c.hex}}/></button>)}<button type="button" className="design-clear-filters" style={{visibility:color||collection?'visible':'hidden'}} aria-hidden={!color&&!collection} disabled={!color&&!collection} tabIndex={color||collection?0:-1} onClick={()=>{setColor('');setCollection('');}}>{es?'Limpiar filtros':'Clear filters'}</button></div></fieldset>
  </div>

  {failed&&!loading&&<p className="muted">{es?'Algunas imágenes no permiten leer sus colores. Sigue disponible el catálogo completo.':'Some image colors could not be read. The full catalog is still available.'}</p>}
  <div ref={gallery} className="store-design-scroll" tabIndex={0} aria-label={es?'Diseños disponibles':'Available designs'}><div className="design-grid">{visible.map((d,index)=><div data-gallery-index={index} key={d.id} className={`design-card ${d.id===selected?'selected':''}`}><button type="button" className="image-button" onClick={()=>onPreview(d)} aria-label={`${es?'Ver':'View'} ${d.code}`}><GalleryImage design={d} locale={locale}/></button><div className="design-meta"><strong>{d.code}</strong><button type="button" aria-pressed={d.id===selected} onClick={()=>onSelect(d.id)}>{es?(d.id===selected?'Elegido':'Elegir'):(d.id===selected?'Selected':'Select')}</button></div></div>)}{!visible.length&&<p className="empty">{es?'No hay diseños para estos filtros.':'No designs match these filters.'}</p>}</div></div>
 </div>;
}
