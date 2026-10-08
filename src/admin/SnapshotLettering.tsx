import {useEffect,useState} from 'react';
import type {FontRecord} from '../domain/model';
import {loadFont,fontText,fontPreviewScale} from '../catalog/fonts';
import FittedLettering from '../FittedLettering';
export function SnapshotLettering({font,name,maximum=26}:{font:FontRecord;name:string;maximum?:number}){
 const identity=[font.number,font.asset_version,font.asset_path,font.css_family].join('|');
 const [loaded,setLoaded]=useState<{identity:string;family:string;failed:boolean}|null>(null);
 useEffect(()=>{let live=true;const hash=Array.from(identity).reduce((value,c)=>(Math.imul(value,31)+c.charCodeAt(0))>>>0,0).toString(16);
 if(font.state!=='ready'||!font.asset_path){setLoaded({identity,family:'',failed:true});return;}
 loadFont({...font,asset_version:font.asset_version+'-'+hash}).then(family=>{if(live)setLoaded({identity,family,failed:false});}).catch(()=>{if(live)setLoaded({identity,family:'',failed:true});});return()=>{live=false;};},[identity]);
 if(!loaded||loaded.identity!==identity)return <span className="admin-snapshot-lettering is-loading" aria-label="Loading lettering" aria-busy="true"/>;
 if(loaded.failed)return <span className="admin-snapshot-lettering is-error">{name}<small role="status">Lettering unavailable</small></span>;
 return <span className="admin-snapshot-lettering"><FittedLettering text={fontText(font,name)} family={loaded.family} weight={font.presentation?.weight||400} maximum={maximum} scale={fontPreviewScale(font)} locale="en"/></span>;
}
