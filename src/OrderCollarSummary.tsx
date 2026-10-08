import {getCollarDetailRows,getCollarSummary,getSummaryRows} from './domain/presentation';
import {DesignImage,FontSample} from './components';
import {Icon} from './PersonalityOptions';
import SummaryFacts from './SummaryFacts';
import AttachmentThumbnail from './AttachmentThumbnail';
import {translator} from './i18n';
import type {Design,FontRecord,Item,Locale,Order} from './domain/model';
export default function OrderCollarSummary({item,number,design,font,locale,busy=false,onEdit,onRemove,confirmation=false,insideCollapse=false,confirmedDetails=false}:{item:Item;number:number;design?:Design|Order['items'][number]['design'];font?:FontRecord;locale:Locale;busy?:boolean;onEdit?:()=>void;onRemove?:()=>void;confirmation?:boolean;insideCollapse?:boolean;confirmedDetails?:boolean}){
 const t=translator(locale),summary=getCollarSummary(item,locale),rows=getSummaryRows(item,locale,design?.code||'—');
 if(confirmedDetails){
  const detailRows=getCollarDetailRows(item,locale,design?.code||'—',{includePetName:false,includeEmptyExtra:false,includeNotesInTag:false});
  const personalizationValue=item.personalization_type==='decoration'&&item.decorationIcon?<span className="confirmation-decoration"><Icon kind={item.decorationIcon}/><span>{detailRows.personalization.value}</span></span>:detailRows.personalization.value;
  const letteringRows=[
   detailRows.font,
   {...detailRows.personalization,value:personalizationValue},
   ...(summary.notes.trim()?[{key:'notes',label:locale==='es'?'Instrucciones':'Instructions',value:summary.notes}]:[]),
   ...summary.attachments.map(a=>({key:a.id,label:t(a.purpose),value:<AttachmentThumbnail attachment={a} locale={locale}/> }))
  ];
  return <article className={`order-collar-summary confirmation-collar confirmed-detail ${insideCollapse?'inside-collapse':''}`} aria-label={`COLLAR ${number}`}>
   <div className="confirmation-detail-grid">
    <section className="confirmation-detail-collar" aria-label={t('collarSection')}>
     <h4>{t('collarSection')}</h4>
     {design&&<div className="order-collar-image"><DesignImage design={design} locale={locale}/></div>}
     <SummaryFacts rows={detailRows.collar}/>
    </section>
    <section className="confirmation-detail-tag" aria-label={t('tagSection')}>
     <h4>{t('tagSection')}</h4><SummaryFacts rows={detailRows.tag}/>
    </section>
    <section className="order-collar-lettering confirmation-detail-lettering" aria-label={t('letteringDesign')}>
     <h4>{t('letteringDesign')}</h4><SummaryFacts rows={letteringRows}/>
    </section>
   </div>
  </article>;
 }
 return <article className={`order-collar-summary ${confirmation?'confirmation-collar':''} ${confirmedDetails?'confirmed-detail':''}`} aria-labelledby={insideCollapse?undefined:`summary-${item.id}`} aria-label={insideCollapse?`COLLAR ${number}`:undefined}>
 {!insideCollapse&&<header className="order-collar-heading"><h2 id={`summary-${item.id}`}>COLLAR {number}</h2>{onEdit&&onRemove&&<div className="order-collar-actions"><button type="button" className="text-button" disabled={busy} onClick={onEdit} aria-label={`${t('edit')}: collar ${number}`}>{t('edit')}</button><button type="button" className="text-button order-collar-remove" disabled={busy} onClick={onRemove} aria-label={`${t('remove')}: collar ${number}`}>{t('remove')}</button></div>}</header>}
 <div className="order-collar-content"><div className="order-collar-product-row">{design&&!confirmedDetails&&<div className="order-collar-image"><DesignImage design={design} locale={locale}/></div>}<div className="order-collar-product-info">{!insideCollapse&&<h3 className="order-collar-name">{font?<FontSample font={font} name={item.pet_name} locale={locale} compact/>:summary.name}</h3>}<p className="order-collar-code">{design?.code||'—'}</p><p className="order-collar-specs">{summary.sizeWidth} · {summary.fastening}</p>{confirmation&&<section className="confirmation-product-facts" aria-label={t('collarSection')}><h4>{t('collarSection')}</h4><SummaryFacts rows={rows.collar}/></section>}</div></div>
 <section className="mobile-collar-facts" aria-label={t('collarSection')}><h4>{t('collarSection')}</h4><SummaryFacts rows={rows.collar}/></section>
 <div className="order-collar-tag-lettering"><section className="order-collar-tag" aria-label={t('tagSection')}><h4>{t('tagSection')}</h4><SummaryFacts rows={rows.tag.filter(row=>row.key!=='name')}/></section>
 <section className="order-collar-lettering" aria-label={t('letteringDesign')}><h4><span className="desktop-lettering-title">{locale==='es'?'TIPOGRAFÍA':'LETTERING'}</span><span className="mobile-lettering-title">{t('letteringDesign')}</span></h4><SummaryFacts rows={[
 {key:'font',label:locale==='es'?'Tipografía':t('fontLabel'),value:<><span>{String(item.font_number).padStart(2,'0')}</span></>},
 ...(item.decorationIcon?[{key:'decoration',label:t('decoration'),value:confirmation?<span className="confirmation-decoration"><Icon kind={item.decorationIcon}/><span>{t(item.decorationIcon)}</span></span>:t(item.decorationIcon)}]:[]),
 ...summary.attachments.map(a=>({key:a.id,label:t(a.purpose),value:<AttachmentThumbnail attachment={a} locale={locale}/>})),
 ...(summary.notes.trim()?[{key:'notes',label:locale==='es'?'Instrucciones':'Instructions',value:summary.notes}]:[])
 ]}/></section></div></div></article>;
}
