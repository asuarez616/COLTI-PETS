import {useEffect,useState} from 'react';
import type {Attachment,Snapshot} from '../domain/model';
import {getCollarSummary,getSummaryRows} from '../domain/presentation';
import {DesignImage,FontSample} from '../components';
import SummaryFacts from '../SummaryFacts';
import {attachmentUrl} from '../data/backend';
export function AdminCollar({item,number,compact=false}:{item:Snapshot;number:number;compact?:boolean}){
 const rows=getSummaryRows(item,'en',item.design.code),summary=getCollarSummary(item,'en');
 return <article className={'admin-collar'+(compact?' admin-collar-compact':'')} aria-label={'Collar '+number}>{!compact&&<><h3>COLLAR {number}</h3><div className="admin-collar-product"><DesignImage design={item.design} locale="en"/><div><h3><FontSample font={item.font} name={item.pet_name} locale="en" compact/></h3><SummaryFacts rows={rows.collar}/></div></div></>}<section><h4>TAG</h4><SummaryFacts rows={rows.tag.filter(r=>r.key!=='name')}/></section><section><h4>LETTERING &amp; DESIGN</h4><SummaryFacts rows={[{key:'font',label:'Font',value:item.font.label},...(item.decorationIcon?[{key:'decoration',label:'Decoration',value:item.decorationIcon}]:[]),...(summary.notes.trim()?[{key:'notes',label:'Instructions',value:summary.notes}]:[])]}/>{summary.attachments.map(a=><div key={a.id}><h4>{a.purpose==='drawing'?'Drawing':'Photo'}</h4><AdminAttachment attachment={a}/></div>)}</section></article>;
}
function AdminAttachment({attachment}:{attachment:Attachment}){
 const [url,setUrl]=useState(''),[state,setState]=useState('loading'),[attempt,setAttempt]=useState(0);
 useEffect(()=>{let live=true,owned='';setState('loading');setUrl('');attachmentUrl(attachment).then(value=>{owned=value;if(live){setUrl(value);setState('ready');}else if(value.startsWith('blob:'))URL.revokeObjectURL(value);}).catch(()=>{if(live)setState('failed');});return()=>{live=false;if(owned.startsWith('blob:'))URL.revokeObjectURL(owned);};},[attachment.id,attachment.object_path,attempt]);
 return <div>{state==='loading'?<p role="status">Loading reference…</p>:state==='failed'?<><p>Reference unavailable: {attachment.original_filename}</p><button onClick={()=>setAttempt(n=>n+1)}>Retry reference</button></>:<img src={url} alt={attachment.original_filename} className="admin-reference" onError={()=>setState('failed')}/>}</div>;
}
