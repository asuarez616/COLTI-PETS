import {DesignImage,Modal} from './components';
import type {Design,Locale} from './domain/model';

export default function DesignPreview({design,locale,size,width,onClose,onSelect}:{design:Design;locale:Locale;size:string;width:number;onClose:()=>void;onSelect:()=>void}){
 const es=locale==='es';
 return <Modal className="design-preview" labelledBy="design-preview-title" onClose={onClose} bare>
  <button type="button" className="design-preview-close" aria-label={es?'Cerrar':'Close'} onClick={onClose}>×</button>
  <div className="design-preview-body">
   <div className="design-preview-image"><DesignImage design={design} large locale={locale}/></div>
   <div className="design-preview-info">
    <p className="eyebrow">{design.type==='printed'?(es?'DISEÑO ESTAMPADO':'PRINTED DESIGN'):(es?'DISEÑO TEJIDO':'WOVEN DESIGN')}</p>
    <h2 id="design-preview-title">{design.code}</h2>
    {size&&width>0&&<div className="design-preview-context"><p>{es?'Seleccionado para':'Selected for'}</p><strong>{size} · {width.toFixed(1)} cm</strong></div>}
  <div className="design-preview-action"><button type="button" className="primary" onClick={onSelect}>{es?'Seleccionar este diseño':'Select this design'}</button></div>
   </div>
  </div>

 </Modal>;
}


