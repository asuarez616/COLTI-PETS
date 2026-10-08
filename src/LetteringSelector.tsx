import {fontDisplayOrder} from './catalog/fonts';
import {useRef,useState} from 'react';
import {FontSample,Modal} from './components';
import type {FontRecord,Locale} from './domain/model';
export default function LetteringSelector({fonts,number,name,locale,onConfirm}:{fonts:FontRecord[];number:number;name:string;locale:Locale;onConfirm:(number:number)=>void}){
 const [open,setOpen]=useState(false),[pending,setPending]=useState(number);
 const confirmed=fonts.find(f=>f.number===number),selected=fonts.find(f=>f.number===pending),es=locale==='es';
 const ordered=fonts.filter(f=>f.active).sort(fontDisplayOrder);
 const quickFonts=ordered.slice(0,3);if(confirmed&&!quickFonts.some(f=>f.number===number))quickFonts[2]=confirmed;
 const trigger=useRef<HTMLButtonElement>(null);
 const close=()=>setOpen(false);
 return <><div className="lettering-quick">{quickFonts.map(font=><button type="button" className={`lettering-card ${number===font.number?'selected':''}`} key={font.number} aria-pressed={number===font.number} aria-label={`${es?'Fuente':'Font'} ${String(font.display_position??font.number).padStart(2,'0')}`} onClick={()=>onConfirm(font.number)}><FontSample font={font} name={name} locale={locale} compact/></button>)}</div>
 <button ref={trigger} type="button" className="lettering-view-all" onClick={()=>{setPending(number);setOpen(true);}}>{es?'Ver todos los estilos de letra':'View all lettering styles'} →</button>
 {open&&<Modal className="lettering-dialog" labelledBy="lettering-heading" onClose={close} bare>
 <header className="lettering-header"><div><h2 id="lettering-heading">{es?'Elige tu estilo de letra':'Choose your lettering style'}</h2><p>{es?'Mira cómo se ve el nombre de tu mascota en cada estilo.':"See how your pet's name looks in every style."}</p></div><button type="button" className="lettering-close" onClick={close} aria-label={es?'Cerrar':'Close'}>×</button></header>
 <div className="lettering-scroll"><div className="lettering-grid">{fonts.filter(f=>f.active).sort(fontDisplayOrder).map(f=><button type="button" key={f.number} className={`lettering-card ${pending===f.number?'selected':''}`} aria-pressed={pending===f.number} aria-label={`${es?'Fuente':'Font'} ${String(f.display_position??f.number).padStart(2,'0')}`} onClick={()=>setPending(f.number)}><FontSample font={f} name={name} locale={locale} compact/></button>)}</div></div>
 <footer className="lettering-bar"><div className="lettering-selected"><div className="lettering-label">{es?'Seleccionada: Fuente':'Selected: Font'} {selected?String(selected.display_position??pending).padStart(2,'0'):'—'}</div>{selected&&<div className="lettering-preview"><FontSample font={selected} name={name} locale={locale} compact/></div>}</div><button type="button" className="primary" disabled={!selected} onClick={()=>{onConfirm(pending);close();}}>{es?'Usar este estilo':'Use this style'}</button></footer>
 </Modal>}</>;
}



