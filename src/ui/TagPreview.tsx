import {closureIconUrl} from '../data/closuresBackend';
import {getTagPreviewLayout,previewFaceStyle,informationTypography as info} from './tagPreviewConfig';
import {loadTagSilhouette} from './tagSilhouettes';
import {useEffect,useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import FittedLettering from '../FittedLettering';
import {fontText,fontPreviewScale} from '../catalog/fonts';
import {useLettering} from '../catalog/useLettering';
import type {FontRecord,Locale} from '../domain/model';
import type {getTagPreview} from '../domain/presentation';
type Preview=ReturnType<typeof getTagPreview>;
/** Fit actual rendered content in both dimensions. */
function Engraving({children}:{children:ReactNode}){
 const host=useRef<HTMLDivElement>(null),content=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>{
  const box=host.current,text=content.current;if(!box||!text)return;let active=true;
  const fit=()=>{
   if(!active||!box.clientWidth||!box.clientHeight)return;
   text.style.gap=`${info.gap}px`;
   const name=text.closest('.tag-face-preview')?.querySelector<HTMLElement>('.tag-face-name .lettering-fit-text');
   const nameSize=name?parseFloat(getComputedStyle(name).fontSize):46;
   const rows=[...text.querySelectorAll<HTMLElement>('.tag-face-line')];
   const nameHeight=text.querySelector<HTMLElement>('.tag-face-name')?.getBoundingClientRect().height||0;
   const room=Math.max(1,box.clientHeight-nameHeight-info.gap*rows.length);
   const baseSize=Math.max(info.minimum,Math.min(info.maximum,nameSize*info.nameRatio,room/Math.max(1,rows.length)/info.lineHeight));
   const compose=(size:number)=>{
    for(const row of rows){
     const unit=row.querySelector<HTMLElement>('.tag-info-unit'),value=row.querySelector<HTMLElement>('.tag-detail-text');if(!unit||!value)continue;
     const rowSize=size*(row.dataset.infoKey==='phone'||row.dataset.infoKey==='address'?1.05:1);
     unit.style.transform='none';unit.style.fontSize=`${rowSize}px`;
     const symbol=unit.querySelector<SVGElement>('svg');
     const available=Math.max(1,row.clientWidth-info.safety-(symbol?symbol.getBoundingClientRect().width+info.iconGap:0));
     value.style.transform='none';value.style.fontSize=`${rowSize}px`;value.style.whiteSpace='pre';value.style.width='auto';
     const width=value.getBoundingClientRect().width;
     let fontSize=rowSize,scale=Math.min(info.scaleMax,Math.max(info.scaleMin,available/Math.max(1,width)));
     if(width*info.scaleMin>available){fontSize=rowSize*available/(width*info.scaleMin);scale=info.scaleMin;}
     value.style.fontSize=`${fontSize}px`;value.style.transform=`scaleX(${scale})`;
     const visualWidth=value.getBoundingClientRect().width+(symbol?symbol.getBoundingClientRect().width+4:0);
     unit.style.marginLeft=`${Math.max(0,(row.clientWidth-info.safety-visualWidth)/2)}px`;
    }
    return text.scrollHeight<=box.clientHeight+.5;
   };
   let low:number=info.minimum,high=baseSize;
   if(!compose(high)){for(let n=0;n<8;n++){const mid=(low+high)/2;if(compose(mid))low=mid;else high=mid;}if(!compose(low)){text.style.gap='0px';compose(low);}}

  };
  fit();const observer=new ResizeObserver(fit);observer.observe(box);observer.observe(text);text.closest('.tag-face-preview')?.querySelectorAll('.tag-face-name').forEach(node=>observer.observe(node));document.fonts.ready.then(fit);document.fonts.addEventListener('loadingdone',fit);return ()=>{active=false;observer.disconnect();document.fonts.removeEventListener('loadingdone',fit);};
 },[children]);
 return <div className="tag-face-content fitted-tag-content" ref={host}><div className="tag-engraving" ref={content}>{children}</div></div>;
}
export default function TagPreview({data,locale,icon,font}:{data:Preview;locale:Locale;icon:(key:string)=>ReactNode;font?:FontRecord}){
 const es=locale==='es',{ref,family}=useLettering(font),[faces,setFaces]=useState({front:'',back:''}),[detailsPage,setDetailsPage]=useState(0);
 const base=getTagPreviewLayout(data.shape);const layout=data.customIcon&&data.dimensions?{...base,aspectRatio:data.dimensions.width+' / '+data.dimensions.height}:base;
 const previewLines=data.lines.flatMap(line=>line.value.split('\n').filter(value=>value.trim()).map((value,index)=>({...line,value,previewKey:line.key+'-'+index})));
 const linesPerPage=layout.maxLines;
 const slides=data.hanging?2:1,slide=Math.min(detailsPage,slides-1);
 const first=data.hanging?Math.max(0,slide-1)*linesPerPage:0;
 const prioritizedLines=!layout.prioritizeIcons?previewLines:[...previewLines].sort((a,b)=>Number(!!b.icon)-Number(!!a.icon));
 const visibleLines=prioritizedLines.slice(first,first+linesPerPage);
 useEffect(()=>{setDetailsPage(0);},[data.shape,data.lines.map(line=>line.key+line.value).join('|')]);
 useEffect(()=>{let active=true;if(data.customIcon){const url=closureIconUrl(data.customIcon);setFaces({front:url,back:url});return;}setFaces({front:'',back:''});Promise.all([loadTagSilhouette(layout.front.asset),loadTagSilhouette(layout.back.asset)]).then(([front,back])=>{if(active)setFaces({front,back});}).catch(()=>{});return()=>{active=false;};},[layout.front.asset,layout.back.asset,data.customIcon]);
 return <div className="tag-preview-container"><span ref={ref} className="tag-font-observer" aria-hidden="true"/><div className={`tag-face-preview ${data.hanging?'single-face':''}`} style={{maxWidth:layout.width}} aria-label={es?'Vista previa de la placa':'Tag preview'}>{(data.hanging?[slide===0?'front':'back']:['both']).map(side=><figure key={side}><div className={`original-tag-face original-tag-${data.shape} tag-side-${side}`} style={previewFaceStyle(layout,side)}><img src={(side==='back'?faces.back:faces.front)||undefined} alt={es?'Silueta de la placa seleccionada':'Selected tag silhouette'}/><Engraving>{side!=='back'&&<div className="tag-face-name"><FittedLettering wrapLongName leading={data.nameDecoration?icon(data.nameDecoration):undefined} scale={fontPreviewScale(font)} text={font?fontText(font,data.name):data.name} family={family} weight={font?.presentation?.weight||400} maximum={36} minimum={6} locale={locale}/></div>}{side!=='front'&&visibleLines.map(line=><div className="tag-face-line" data-info-key={line.key} key={line.previewKey}><span className="tag-info-unit">{line.icon&&icon(line.icon)}<span className="tag-detail-text">{line.value}</span></span></div>)}</Engraving></div></figure>)}</div>{data.hanging&&<div className="tag-preview-pages"><div><button type="button" disabled={slide===0} aria-label={es?'Ver frente':'View front'} onClick={()=>setDetailsPage(slide-1)}>←</button><span role="status">{slide===0?(es?'Frente · nombre':'Front · name'):(es?'Reverso · datos':'Back · details')}</span><button type="button" disabled={slide===slides-1} aria-label={es?'Ver reverso':'View back'} onClick={()=>setDetailsPage(slide+1)}>→</button></div></div>}<p className="tag-preview-disclaimer">{previewLines.length>linesPerPage?(es?'Solo una vista previa. El diseño final incluirá toda la información proporcionada.':'Preview only. The final design will include all the details you provided.'):(es?'Solo un ejemplo de distribución. El grabado final puede variar.':'Layout example only. Final engraving may vary.')}</p></div>;
}
