import {useEffect,useState,type ReactNode} from 'react';
import Reveal from '../Reveal';
export function Accordion({children,className}:{children:ReactNode;className?:string}){return <div className={className}>{children}</div>;}
/** Open/closed belongs exclusively to this UI component, never to the domain selection. */
export function AccordionItem({id,heading,children,initialOpen=false,selected=false,disabled=false,closeToken=0,onOpen}:{id:string;heading:ReactNode;children:ReactNode;initialOpen?:boolean;selected?:boolean;disabled?:boolean;closeToken?:number;onOpen?:()=>void}){
 const [open,setOpen]=useState(initialOpen);
 useEffect(()=>{if(closeToken)setOpen(false);},[closeToken]);
 return <section className={`personality-option ${selected?'selected':''}`}><button type="button" disabled={disabled} className="personality-toggle" id={`personality-toggle-${id}`} aria-pressed={selected} aria-expanded={open} aria-controls={`personality-${id}`} onClick={()=>{if(!open)onOpen?.();setOpen(v=>!v);}}>{heading}<span className="personality-chevron" aria-hidden="true"><svg viewBox="0 0 16 16" className={open?'is-open':undefined} fill="none" stroke="currentColor" strokeWidth="1.4"><path d="m4 6 4 4 4-4"/></svg></span></button><Reveal open={open} id={`personality-${id}`} labelledBy={`personality-toggle-${id}`}><div className="personality-expanded">{children}</div></Reveal></section>;
}
