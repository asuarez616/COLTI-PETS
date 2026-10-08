import ConfirmationCollars from './ConfirmationCollars';
import {exportOrder} from './exports/documents';
import {getCollarSummary} from './domain/presentation';
import type {StepId} from './configurator/steps';
import FittedLettering from './FittedLettering';
import {responsiveAsset} from './catalog/images';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {fontText,fontPreviewScale} from './catalog/fonts';
import {useLettering} from './catalog/useLettering';
import {attachmentUrl} from './data/backend';

import {translator,summaryLabels} from './i18n';
import type {Attachment,Design,FontRecord,Item,Locale,Order} from './domain/model';
export function DesignImage({design,large=false,locale='en'}:{design:Pick<Design,'image'|'code'> & Partial<Pick<Design,'asset_version'>>;large?:boolean;locale?:Locale}){
 const [failed,setFailed]=useState(false),[version,setVersion]=useState(0);
 const asset=responsiveAsset(design.image,design.asset_version);
 return failed?<div className="image-failed"><span>{design.code}</span><button type="button" onClick={()=>{setFailed(false);setVersion(v=>v+1);}}>↻ Retry / Reintentar</button></div>:<img key={version} className={large?'design-image large':'design-image'} src={asset?.src||design.image} srcSet={asset?.srcSet} sizes={large?'(min-width:1000px) 50vw, 90vw':'auto, (min-width:1200px) 28vw, (min-width:801px) 24vw, 45vw'} width={asset?.width} height={asset?.height} alt={`${locale==='es'?'Collar COLTI, diseño':'COLTI collar, design'} ${design.code}`} decoding="async" loading={large?'eager':'lazy'} onError={()=>setFailed(true)}/>;
}
export function Modal({children,onClose,label,labelledBy,className,bare=false}:{children:ReactNode;onClose:()=>void;label?:string;labelledBy?:string;className?:string;bare?:boolean}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const previous=document.activeElement as HTMLElement,overflow=document.body.style.overflow;document.body.style.overflow='hidden';ref.current?.showModal();return ()=>{ref.current?.close();document.body.style.overflow=overflow;if(previous?.isConnected)previous.focus();};},[]);
 return <dialog ref={ref} className={className} aria-label={label} aria-labelledby={labelledBy} aria-modal="true" onKeyDown={e=>{if(e.key!=='Tab')return;const controls=[...e.currentTarget.querySelectorAll<HTMLElement>('button,input,textarea,select,a[href],[tabindex]')].filter(n=>n.tabIndex>=0&&!n.hasAttribute('disabled')&&!n.closest('[inert]')&&n.getClientRects().length>0);const first=controls[0],last=controls.at(-1);if(!first){e.preventDefault();return;}if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>{bare?children:<div className="modal-body">{children}</div>}</dialog>;
}
export function FontSample({font,name,locale,compact=false}:{font:FontRecord;name:string;locale:Locale;compact?:boolean}){
 const t=translator(locale),{ref,family,failed,ready}=useLettering(font);
 return <><span className="font-number">{compact?String(font.display_position??font.number).padStart(2,'0'):<>{t('fontLabel')} {font.display_position??font.number}</>}</span><span ref={ref} className="lettering-renderer" style={{visibility:ready||failed?'visible':'hidden',...(font.presentation?.size?{['--lettering-max-size' as string]:`${font.presentation.size}px`}:{})}} data-font-number={font.number} data-presentation-size={font.presentation?.size||undefined}><FittedLettering scale={fontPreviewScale(font)} text={failed?(name||'COLTI'):fontText(font,name||'COLTI')} family={family} weight={font.presentation?.weight||400} maximum={font.presentation?.size||24} locale={locale}/></span>{(failed||font.state==='placeholder')&&<small>{font.state==='placeholder'?t('placeholder'):t('fontFailed')}</small>}</>;
}
export function AttachmentLink({a,locale}:{a:Attachment;locale:Locale}){
 const [busy,setBusy]=useState(false),[error,setError]=useState(false);const t=translator(locale);
 return <div className="attachment-link"><span>{a.original_filename}</span><button type="button" disabled={busy} onClick={async()=>{setBusy(true);setError(false);try{const url=await attachmentUrl(a);const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener';link.click();if(url.startsWith('blob:'))setTimeout(()=>URL.revokeObjectURL(url),60000);}catch{setError(true);}finally{setBusy(false);}}}>{busy?t('loading'):t('view')}</button>{error&&<span role="alert">{t('error')}</span>}</div>;
}
export function ItemCard({item,design,font,locale,onEdit}:{item:Item;design?:Design|Order['items'][number]['design'];font?:FontRecord;locale:Locale;onEdit?:(step:StepId)=>void}){
 const t=translator(locale),s=summaryLabels[locale],summary=getCollarSummary(item,locale);
 const row=(label:string,value:ReactNode,step:StepId)=><div key={label} className="detail-row"><dt>{label}</dt><dd>{value}{onEdit&&<button type="button" className="text-button" aria-label={`${t('edit')}: ${label}`} onClick={()=>onEdit(step)}>{t('edit')}</button>}</dd></div>;
 return <article className="item-card">{design&&<DesignImage design={design} locale={locale}/>}<div className="item-details"><h3>{item.pet_name||t('draft')}</h3><dl>
 {row(s.design,design?.code||'—','design')}{row(s.size,summary.sizeWidth,'size')}{row(s.collar,summary.fastening,'fastening')}{row(s.tag,[summary.tag.style,summary.tag.size].filter(Boolean).join(' · '),'tag-type')}{row(s.pet,summary.name,'pet-name')}{row(s.phone,summary.tag.phone,'tag-phone')}{summary.tag.extras.map(e=>row(e.label,e.value,'tag-details'))}{row(s.font,<><span>{String(font?.display_position??item.font_number).padStart(2,'0')}</span>{font&&<FontSample font={font} name={item.pet_name} locale={locale} compact/>}</>,'lettering')}{item.personalization_type!=='none'&&row(s.personalization,summary.personalization,'personalization')}{summary.notes&&row(s.notes,summary.notes,'personalization')}
 </dl>{summary.attachments.map(a=><AttachmentLink key={a.id} a={a} locale={locale}/>)}</div></article>;
}
export function Downloads({order,locale}:{order:Order;locale:Locale}){
 const t=translator(locale),[busy,setBusy]=useState(''),[error,setError]=useState(false);
 async function run(format:'pdf'|'jpg'){setBusy(format);setError(false);try{await exportOrder(order,locale,format);}catch{setError(true);}finally{setBusy('');}}
 return <div className="downloads"><div className="button-row">{(['pdf','jpg'] as const).map(f=><button key={f} disabled={!!busy} onClick={()=>run(f)}>{busy===f?t('pending'):`${t('download')} ${f.toUpperCase()} ↓`}</button>)}</div>{error&&<p role="alert" className="error">{t('exportError')}</p>}</div>;
}
export function OrderDetail({order,locale,production=false}:{order:Order;locale:Locale;production?:boolean}){
 const t=translator(locale);return <><div className="order-heading">{production?<p className="eyebrow">{t(order.status)}</p>:<h1 className="confirmation-title">{t('orderConfirmed')}</h1>}{production?<><h2>{order.order_code}</h2><p>{order.customer_snapshot.name} · {order.customer_snapshot.phone}</p><time>{new Date(order.confirmed_at).toLocaleString(locale)}</time>{order.demo&&<p className="local-demo-indicator">{t('localSaved')}</p>}</>:<><div className="confirmation-order-meta"><h2>{order.order_code}</h2></div><div className="confirmation-customer"><p className="eyebrow">{locale==='es'?'CLIENTE':'CUSTOMER'}</p><p>{order.customer_snapshot.name} · {order.customer_snapshot.phone}</p></div></>}</div>{production?order.items.map(i=><ItemCard key={i.id} item={i} design={i.design} font={i.font} locale={locale}/>):<><h2 className="confirmation-order-label">{locale==='es'?'TU PEDIDO':'YOUR ORDER'}</h2><ConfirmationCollars order={order} locale={locale}/></>}<Downloads order={order} locale={locale}/></>;
}




export function ConfirmationDate({order,locale}:{order:Order;locale:Locale}){
 const date=new Date(order.confirmed_at),language=locale==='es'?'es':'en-US';
 return <footer className="confirmation-date"><time dateTime={order.confirmed_at}>{date.toLocaleDateString(language,{year:'numeric',month:'long',day:'numeric'})} · {date.toLocaleTimeString(language,{hour:'numeric',minute:'2-digit',hour12:true})}</time></footer>;
}

