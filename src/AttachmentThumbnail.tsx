import {useEffect,useState} from 'react';
import {attachmentUrl} from './data/backend';
import type {Attachment,Locale} from './domain/model';
import {AttachmentLink} from './components';
export default function AttachmentThumbnail({attachment,locale}:{attachment:Attachment;locale:Locale}){
 const [url,setUrl]=useState('');
 useEffect(()=>{let active=true,owned='';attachmentUrl(attachment).then(value=>{owned=value;if(active)setUrl(value);else if(value.startsWith('blob:'))URL.revokeObjectURL(value);}).catch(()=>{});return()=>{active=false;if(owned.startsWith('blob:'))URL.revokeObjectURL(owned);};},[attachment.id,attachment.object_path]);
 return url?<img className="attachment-thumbnail" src={url} alt={attachment.original_filename}/>:<AttachmentLink a={attachment} locale={locale}/>;
}
