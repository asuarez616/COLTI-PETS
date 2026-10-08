import {useEffect,useState} from 'react';
import Reveal from './Reveal';
import type {Item,Locale} from './domain/model';
import {extrasFor,extraLabels,extraText,type ExtraCategory} from './domain/extras';
export default function TagExtraDetails({item,locale,onChange}:{item:Item;locale:Locale;onChange:(p:Partial<Item>)=>void}){
 const x=extrasFor(item),es=locale==='es';
 const [visited,setVisited]=useState<ExtraCategory[]>(x.selected);
 const order:ExtraCategory[]=['address','health','neutered','family','other'];
 const categories=order.filter(k=>[...visited,...x.selected].some(v=>(v==='phones'?'family':v)===k));
 const phones=(x.phones||'').split('\n');
 function changePhone(index:number,value:string){const next=[phones[0]||'',phones[1]||''];next[index]=value;change({phones:next.join('\n').trimEnd()});}
 const contactMode=x.selected.includes('phones')?'phones':'family';
 useEffect(()=>{setVisited(categories);},[x.selected.join(',')]);
 function change(p:Partial<typeof x>){const n={...x,...p};onChange({tagExtras:n,extra_text:extraText(n)});}
 return <div className="tag-extras"><div className="tag-extra-choices">{order.map(k=><button key={k} type="button" className={(x.selected.includes(k)||(k==='family'&&x.selected.includes('phones')))?'selected':''} aria-pressed={x.selected.includes(k)||(k==='family'&&x.selected.includes('phones'))} onClick={()=>change({selected:k==='family'?(x.selected.includes('family')||x.selected.includes('phones')?x.selected.filter(v=>v!=='family'&&v!=='phones'):[...x.selected,'family']):x.selected.includes(k)?x.selected.filter(v=>v!==k):[...x.selected,k]})}>{extraLabels[locale][k]}</button>)}</div>{categories.map(k=><Reveal key={k} open={x.selected.includes(k)||(k==='family'&&x.selected.includes('phones'))}><section className="tag-extra-fields"><h2>{extraLabels[locale][k]}</h2>
 {k==='address'&&<input aria-label={extraLabels[locale][k]} maxLength={300} value={x.address} onChange={e=>change({address:e.target.value})}/>}
 {k==='health'&&<textarea aria-label={extraLabels[locale][k]} rows={2} maxLength={500} placeholder={es?'Alergias, condiciones médicas, medicación…':'Allergies, medical conditions, medication…'} value={x.health} onChange={e=>change({health:e.target.value})}/>}
 {k==='neutered'&&<div className="tag-extra-choices">{['Spayed','Neutered'].map(v=><button key={v} type="button" aria-pressed={x.neutered===v} className={x.neutered===v?'selected':''} onClick={()=>change({neutered:x.neutered===v?'':v})}>{es?(v==='Spayed'?'Esterilizada':'Castrado'):v}</button>)}</div>}
 {k==='family'&&<><div className="tag-extra-choices">{(['phones','family'] as const).map(mode=><button type="button" key={mode} className={`contact-mode-option ${contactMode===mode?'selected':''}`} aria-pressed={contactMode===mode} onClick={()=>change({selected:[...x.selected.filter(v=>v!=='phones'&&v!=='family'),mode]})}>{mode==='phones'?(es?'Números adicionales':'Additional numbers'):(es?'Nombre y número':'Name and number')}</button>)}</div>{contactMode==='phones'?<div className="contact-fields">{[0,1].map(index=><label key={index}><span className="contact-number-label">{es?(index===0?'Número adicional 1':'Número adicional 2 (opcional)'):(index===0?'Additional number 1':'Additional number 2 (optional)')}</span><input type="tel" maxLength={32} value={phones[index]||''} onChange={e=>changePhone(index,e.target.value)}/></label>)}</div>:<div className="tag-family-fields contact-fields"><label>{es?'Nombre':'Name'}<input maxLength={100} value={x.familyName} onChange={e=>change({familyName:e.target.value})}/></label><label>{es?'Teléfono':'Phone'}<input type="tel" maxLength={32} value={x.familyPhone} onChange={e=>change({familyPhone:e.target.value})}/></label></div>}</>}
 {k==='other'&&<textarea aria-label={extraLabels[locale][k]} rows={2} maxLength={800} value={x.other} onChange={e=>change({other:e.target.value})}/>}


 </section></Reveal>)}</div>;
}
