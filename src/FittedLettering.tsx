import {useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import type {Locale} from './domain/model';
export default function FittedLettering({text,family,weight,maximum,locale,minimum=14,scale=1,leading,wrapLongName=false}:{text:string;family:string;weight:number;maximum:number;locale:Locale;minimum?:number;scale?:number;leading?:ReactNode;wrapLongName?:boolean}){
 const ornamental=/colti-font-(17|18)-/.test(family);
 const frame=useRef<HTMLSpanElement>(null),measure=useRef<HTMLSpanElement>(null);
 const [fit,setFit]=useState({size:maximum,overflow:false,wrap:false});
 useLayoutEffect(()=>{
  const host=frame.current,sample=measure.current;if(!host||!sample)return;
  let active=true;
  const update=()=>{
   let available=Math.max(0,host.clientWidth-4-(leading?26:0));if(!available)return;
   const max=Math.max(minimum,(Number.parseFloat(getComputedStyle(host).getPropertyValue('--lettering-max-size'))||maximum)*scale);
   if(ornamental)available=Math.max(0,available-max*.5);
   sample.style.fontSize=`${max}px`;
   const width=sample.getBoundingClientRect().width;
   let size=Math.min(max,Math.max(minimum,width?max*available/width:max));
      const wrap=(width*(size/max)>available+.5||(wrapLongName&&width>available*1.35))&&text.trim().includes(' ');
   let fittedWidth=width;
   if(wrap){
    fittedWidth=Math.max(...text.trim().split(/\s+/).map(word=>{sample.textContent=word;return sample.getBoundingClientRect().width;}));
    sample.textContent=text;
    size=Math.min(max,Math.max(minimum,fittedWidth?max*available/fittedWidth:max));
   }
   const overflow=fittedWidth*(size/max)>available+.5;
   if(active)setFit(previous=>Math.abs(previous.size-size)<.05&&previous.overflow===overflow&&previous.wrap===wrap?previous:{size,overflow,wrap});
  };
  const observer=new ResizeObserver(update);observer.observe(host);update();
  document.fonts.ready.then(()=>{if(active)update();});document.fonts.addEventListener('loadingdone',update);
  return()=>{active=false;observer.disconnect();document.fonts.removeEventListener('loadingdone',update);};
 },[text,family,weight,maximum,minimum,scale,ornamental,leading,wrapLongName]);
 return <span ref={frame} className={`font-sample fitted-lettering ${ornamental?'ornamental-lettering':''}`} style={{fontFamily:family,fontWeight:weight}} data-fit-overflow={fit.overflow}>
  <span ref={measure} className="lettering-measure" aria-hidden="true">{text}</span>
  <span className="lettering-fit-viewport" tabIndex={fit.overflow?0:undefined} aria-label={fit.overflow?text:undefined} style={{fontSize:ornamental?fit.size:undefined,overflowX:fit.overflow?'auto':'visible',whiteSpace:fit.wrap?'normal':'nowrap'}}>{leading&&<span className="lettering-inline-decoration">{leading}</span>}<span className="lettering-fit-text" style={{fontSize:fit.size,whiteSpace:fit.wrap?'normal':'pre'}}>{text}</span></span>
  {fit.overflow&&<small className="lettering-fit-warning">{locale==='es'?'Nombre largo: desliza para ver el preview completo.':'Long name: scroll to see the full preview.'}</small>}
 </span>;
}

