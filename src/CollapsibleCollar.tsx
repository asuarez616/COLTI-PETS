import {useState,type ReactNode} from 'react';
import Reveal from './Reveal';
import {getCollarSummary} from './domain/presentation';
import {FontSample} from './components';
import {responsiveAsset} from './catalog/images';
import type {Item,Design,FontRecord,Locale,Order} from './domain/model';
export default function CollapsibleCollar({item,number,design,font,locale,initialOpen=false,actions,children}:{item:Item;number:number;design?:Design|Order['items'][number]['design'];font?:FontRecord;locale:Locale;initialOpen?:boolean;actions?:ReactNode;children:ReactNode}){
 const [open,setOpen]=useState(initialOpen),id=`collar-collapse-${item.id}`,asset=design?responsiveAsset(design.image,design.asset_version):undefined;
 return <section className="collar-collapse"><div className="collar-collapse-header"><button type="button" className="collar-collapse-toggle" id={`${id}-toggle`} aria-expanded={open} aria-controls={id} onClick={()=>setOpen(value=>!value)}><span className="collar-collapse-thumb">{design&&<img src={asset?.src||design.image} srcSet={asset?.srcSet} sizes="64px" width={64} height={64} alt="" loading="lazy"/>}</span><span className="collar-collapse-label"><small>COLLAR {number}</small>{font?<FontSample font={font} name={item.pet_name} locale={locale} compact/>:<strong>{item.pet_name}</strong>}<small>{design?.code} · {item.size_code} · {item.width_cm.toFixed(1)} cm · {getCollarSummary(item,locale).fastening}</small></span><span className="personality-chevron" aria-hidden="true"><svg viewBox="0 0 16 16" className={open?'is-open':undefined} fill="none" stroke="currentColor" strokeWidth="1.4"><path d="m4 6 4 4 4-4"/></svg></span></button>{actions}</div><Reveal open={open} id={id} labelledBy={`${id}-toggle`}>{children}</Reveal></section>;
}
