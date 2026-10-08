import {getTagPreview} from './domain/presentation';
import TagFaces from './TagFaces';
import {selectNameDecoration,type NameDecoration} from './domain/personalization';
import {type ReactNode} from 'react';
import type {Item,Locale,FontRecord} from './domain/model';
const names=['none','heart','star','paw','bone','crown'];
export default function DecorationOptions({item,locale,onChange,icon,font}:{item:Item;locale:Locale;onChange:(p:Partial<Item>)=>void;icon:(k:string)=>ReactNode;font?:FontRecord}){
 const es=locale==='es';
 const labels:Record<string,string>=es?{user:'Nombre del contacto',phone:'Teléfono',neutered:'Esterilización',address:'Dirección',email:'Email',none:'Ninguna',heart:'Corazón',star:'Estrella',paw:'Huella',bone:'Hueso',crown:'Corona'}:{user:'Contact name',phone:'Phone',neutered:'Spayed / Neutered',address:'Address',email:'Email',none:'None',heart:'Heart',star:'Star',paw:'Paw',bone:'Bone',crown:'Crown'};
 const selected=[...new Set(getTagPreview({...item,personalization_type:'decoration'},locale).lines.map(line=>line.icon).filter((key):key is string=>!!key))];
 function change(name:NameDecoration|undefined){onChange(selectNameDecoration(item,name));}
 return <div><TagFaces item={item} locale={locale} icon={icon} font={font}/>
 <section className="decoration-group"><h3>{es?'Iconos de información':'Information icons'}</h3><p>{es?'Se añaden automáticamente según sus datos.':'Added automatically from your pet’s details.'}</p><div className="decoration-grid information-icon-grid">{selected.map(k=><div className="automatic-info-icon" key={k}>{icon(k)}<span>{labels[k]}</span></div>)}</div> </section><section className="decoration-group"><h3>{es?'Decoración del nombre':'Name decoration'}</h3><p>{es?'Agrega un pequeño detalle junto a su nombre.':'Add a little detail next to their name.'}</p><div className="decoration-grid">{names.map(k=><button type="button" key={k} aria-pressed={k==='none'?!item.decorationIcon:item.decorationIcon===k} className={(k==='none'?!item.decorationIcon:item.decorationIcon===k)?'selected':''} onClick={()=>change(k==='none'?undefined:k as NameDecoration)}>{k!=='none'&&icon(k)}<span>{labels[k]}</span></button>)}</div></section></div>;
}
