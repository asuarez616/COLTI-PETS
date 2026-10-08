import {useEffect,useRef,useState} from 'react';
import {loadFont} from './fonts';
import type {FontRecord} from '../domain/model';
/** Observe the rendered preview, never a label that may be display:none. */
export function useLettering(font?:FontRecord){
 const ref=useRef<HTMLSpanElement>(null),[visible,setVisible]=useState(false),[family,setFamily]=useState('Arial'),[failed,setFailed]=useState(false);
 useEffect(()=>{const node=ref.current;if(!node)return;const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setVisible(true);observer.disconnect();}},{rootMargin:'200px'});observer.observe(node);return()=>observer.disconnect();},[]);
 useEffect(()=>{let active=true;setFamily('Arial');setFailed(false);if(visible&&font)loadFont(font).then(value=>{if(active)setFamily(value);}).catch(()=>{if(active)setFailed(true);});return()=>{active=false;};},[visible,font?.number,font?.asset_path,font?.asset_version]);
 return {ref,family,failed,ready:family!=='Arial'};
}
