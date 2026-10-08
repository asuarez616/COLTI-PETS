import type {StepId} from './configurator/steps';
import {getCollarDetailRows} from './domain/presentation';
export {readablePhone} from './domain/presentation';
import {AttachmentLink,DesignImage,FontSample,Modal} from './components';
import FactList from './ui/FactList';
import ReviewSectionHeader from './ui/ReviewSectionHeader';
import {useEffect,useState,useId} from 'react';
import {attachmentUrl} from './data/backend';
import {translator} from './i18n';
import type {Attachment,Design,FontRecord,Item,Locale} from './domain/model';

function ReviewPhoto({attachment,locale}:{attachment:Attachment;locale:Locale}){
 const [url,setUrl]=useState(''),[open,setOpen]=useState(false),[failed,setFailed]=useState(false);
 useEffect(()=>{let active=true,owned='';setUrl('');setFailed(false);attachmentUrl(attachment).then(value=>{owned=value;if(active)setUrl(value);else if(value.startsWith('blob:'))URL.revokeObjectURL(value);}).catch(()=>{if(active)setFailed(true);});return()=>{active=false;if(owned.startsWith('blob:'))URL.revokeObjectURL(owned);};},[attachment]);
 const label=locale==='es'?'Ver imagen cargada':'View uploaded image';
 return <>{url?<button type="button" className="collar-review-photo" aria-label={label} onClick={()=>setOpen(true)}><img src={url} alt={attachment.original_filename}/></button>:failed?<AttachmentLink a={attachment} locale={locale}/>:<div className="collar-review-photo-loading" aria-label={translator(locale)('loading')}/>}{open&&<Modal label={label} onClose={()=>setOpen(false)}><button type="button" className="modal-close" onClick={()=>setOpen(false)}>{locale==='es'?'Cerrar':'Close'} ×</button><img className="collar-review-photo-expanded" src={url} alt={attachment.original_filename}/></Modal>}</>;
}

export default function CollarReview({item,design,font,locale,onEdit,showName=true}:{item:Item;design?:Design;font?:FontRecord;locale:Locale;onEdit?:(step:StepId)=>void;showName?:boolean}){
 const reviewId=useId(),collarHeading=reviewId+'-collar',tagHeading=reviewId+'-tag';
 const t=translator(locale),es=locale==='es',detailRows=getCollarDetailRows(item,locale,design?.code||'—',{includePetName:showName,fontNumber:font?.display_position??item.font_number});
 const letteringRows=[...(!showName?[detailRows.font]:[]),detailRows.personalization];
 return <div className="collar-review">
  <section aria-labelledby={collarHeading}>
   <ReviewSectionHeader id={collarHeading} title={es?'TU COLLAR':'YOUR COLLAR'} editLabel={es?'Editar collar':'Edit collar'} onEdit={onEdit} step="size"/>
   <div className="collar-review-product">
    {design&&<DesignImage design={design} locale={locale}/>}
    <div className="collar-review-configuration">
     <FactList rows={detailRows.collar} className="collar-review-facts" itemClassName="collar-review-detail"/>
     {onEdit&&<button type="button" className="collar-review-edit collar-review-body-edit" onClick={()=>onEdit('size')}>{es?'Editar collar':'Edit collar'}</button>}
    </div>
   </div>
  </section>
  <section aria-labelledby={tagHeading} className="collar-review-tag">
   <ReviewSectionHeader id={tagHeading} title={es?'TU PLACA':'YOUR TAG'} editLabel={es?'Editar placa':'Edit tag'} onEdit={onEdit} step="tag-type"/>
   <div className="collar-review-personalization">
    <div>
      <FactList rows={detailRows.tag} className="collar-review-facts" itemClassName="collar-review-detail"/>
      {detailRows.attachments.filter(a=>!['dog_photo','drawing'].includes(item.personalization_type)||a.purpose!==item.personalization_type).map(a=><AttachmentLink key={a.id} a={a} locale={locale}/>)}
    </div>
    <div className="collar-review-lettering-column"><div className="collar-review-lettering">
     <p className="collar-review-heading">{t('letteringDesign')}</p>
      <FactList rows={letteringRows} className="collar-review-personalization-summary" itemClassName="collar-review-detail" itemClassNameForRow={row=>row.key==='font'?'collar-review-detail order-review-font-detail':'collar-review-detail'}/>
     <div className="collar-review-lettering-content"><div className="collar-review-font-preview">{showName&&<p className="collar-review-font-label">{t('fontLabel')} {String(font?.display_position??item.font_number).padStart(2,'0')}</p>}
     {showName&&(font?<FontSample font={font} name={item.pet_name} locale={locale} compact/>:<p>{t('placeholder')}</p>)}</div>
     {['dog_photo','drawing'].includes(item.personalization_type)&&item.attachments.filter(a=>a.purpose===item.personalization_type).map(a=><ReviewPhoto key={a.id} attachment={a} locale={locale}/>)}</div>
    </div>
    {onEdit&&<button type="button" className="collar-review-edit collar-review-tag-edit collar-review-body-edit" onClick={()=>onEdit('tag-type')}>{es?'Editar placa':'Edit tag'}</button>}</div>
   </div>
  </section>
 </div>;
}





