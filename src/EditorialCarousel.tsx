import {useSync} from './ui/useSync';
import {useEffect,useLayoutEffect,useState,useRef,type CSSProperties} from 'react';
import {responsiveAsset} from './catalog/images';
import {getHeroState} from './data/heroBackend';
import {configuredHero,type HeroConfiguration,type HeroImage} from './domain/admin';
import type {Locale} from './domain/model';
const photos=[
 {id:'1AIxnD8OIJ34qZ2rXEAvpCeWNCw3R0NMl',file:'0.png',desktopFocal:'50% 36%',tabletFocal:'42% 39%',en:'Boxer wearing a COLTI collar',es:'Bóxer con collar COLTI'},
 {id:'1nUWu4m0RU7S9p-A3Jvpsiri6m2BlENHr',file:'1.png',desktopFocal:'50% 38%',tabletFocal:'47% 40%',en:'Terrier wearing a COLTI collar',es:'Terrier con collar COLTI'},
 {id:'1CE2ISYjAHfxefq6QXPgHWUnm1bhUA1yE',file:'2.png',desktopFocal:'50% 36%',tabletFocal:'50% 38%',en:'White dog wearing a floral COLTI collar',es:'Perro blanco con collar floral COLTI'},
 {id:'1KxLL__cYWTP8Uq4w-tft1DjENfSWQ7-B',file:'3.png',desktopFocal:'50% 37%',tabletFocal:'50% 40%',en:'Chihuahua wearing a pink COLTI collar',es:'Chihuahua con collar rosado COLTI'},
 {id:'12xoCHP1FJNLHldzansMKYZuS-Cj6XcpS',file:'4.png',desktopFocal:'50% 40%',tabletFocal:'50% 43%',en:'Cat wearing a turquoise COLTI collar',es:'Gato con collar turquesa COLTI'},
];
export default function EditorialCarousel({locale,index:position}:{locale:Locale;index:number}){
 const [configuration,setConfiguration]=useState<HeroConfiguration|null>(null);
 const [heroPhotos,setHeroPhotos]=useState<HeroImage[]>([]);
 useSync('hero',async()=>{const state=await getHeroState();setHeroPhotos(state.source);setConfiguration(state.configuration);});
 const synced=(configuration?configuredHero(heroPhotos,configuration):[]).map((asset)=>({...photos.find(p=>p.id===asset.id)||{file:asset.name,focal:'50%',en:'Pet wearing a COLTI collar',es:'Mascota con collar COLTI'},asset}));
 const index=synced.length?position%synced.length:0;
 const panel=useRef<HTMLDivElement>(null),[width,setWidth]=useState<string|null>(null),[visited,setVisited]=useState<number[]>([index]);
 useEffect(()=>{setVisited(v=>v.includes(index)?v:[...v,index]);},[index]);
 const [visible,setVisible]=useState(()=>matchMedia('(min-width:601px)').matches);
 useEffect(()=>{const query=matchMedia('(min-width:601px)');const update=()=>setVisible(query.matches);query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
 useLayoutEffect(()=>{const element=panel.current;if(!element)return;const measure=()=>{const r=element.getBoundingClientRect();setWidth(Math.ceil(Math.max(r.width,r.height*.81))+'px');};measure();const observer=new ResizeObserver(measure);observer.observe(element);return()=>observer.disconnect();},[visible]);
 if(!visible)return null;
 return <div ref={panel} className="editorial-carousel" role="region" aria-roledescription="carousel" aria-label={locale==='es'?'Mascotas COLTI':'COLTI pets'}>
 {synced.map((photo,n)=>{const prefix=import.meta.env.BASE_URL,path=(file:string)=>/^https?:/.test(file)?file:prefix+file,asset={...photo.asset,src:path(photo.asset.variants.at(-1)!.file),srcSet:photo.asset.variants.map(v=>`${path(v.file)} ${v.width}w`).join(', ')},load=width!==null&&(visited.includes(n)||n===index||n===(index+1)%synced.length);return <img key={photo.asset.id} className={n===index?'active':''} style={{'--hero-desktop-focal':'desktopFocal' in photo?photo.desktopFocal:'50% 36%','--hero-tablet-portrait-focal':'tabletFocal' in photo?photo.tabletFocal:'50% 38%'} as CSSProperties} src={load?asset.src:undefined} srcSet={load?asset.srcSet:undefined} sizes={width||undefined} width={asset.width} height={asset.height} alt={photo[locale]} aria-hidden={n!==index} onError={event=>{const image=event.currentTarget;if(image.dataset.fallback)return;image.dataset.fallback='true';image.removeAttribute('srcset');image.src=responsiveAsset(import.meta.env.BASE_URL+'editorial/'+photos[(n+1)%photos.length].file)!.src;}} decoding="async" fetchPriority={n===index?'high':'low'} loading="eager"/>;})}
 <div className="editorial-tint" aria-hidden="true"/>
 <p className="eyebrow editorial-eyebrow">{locale==='es'?'PEQUEÑOS DETALLES. GRAN PERSONALIDAD.':'SMALL DETAILS. BIG PERSONALITY.'}</p>
 <div className="story-copy"><h2>{locale==='es'?'Su día a día.':'Their everyday.'}<br/><em>{locale==='es'?'Extraordinario.':'Made extraordinary.'}</em></h2><p>{locale==='es'?'Un diseño que cuenta su historia. Crea un collar tan único como tu mejor amigo.':'A design that tells their story. Create a collar as one of a kind as your best friend.'}</p></div>
 </div>;
}

