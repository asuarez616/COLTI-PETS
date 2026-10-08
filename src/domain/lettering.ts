import type {FontRecord} from './model';
export interface LetteringCatalog {revision:number;fonts:FontRecord[]}
export function normalizeLettering(fonts:FontRecord[]){let position=0;return fonts.map((f,i)=>({...f,display_order:i+1,display_position:f.active&&!f.deleted?++position:undefined}));}
export function validateLettering(value:LetteringCatalog){
 if(!Number.isInteger(value.revision)||new Set(value.fonts.map(f=>f.id)).size!==value.fonts.length)throw Error('Invalid lettering catalog.');
 for(const f of value.fonts)if(!f.id||!f.label.trim()||f.label.length>200||f.state!=='ready'||!f.asset_path||!f.asset_version)throw Error('A name and valid font file are required.');
 return {...value,fonts:normalizeLettering(value.fonts)};
}
export async function validateFontFile(file:File){
 const extension=file.name.split('.').pop()?.toLowerCase();if(!['woff','woff2'].includes(extension||''))throw Error('Choose a WOFF or WOFF2 font.');
 if(file.size>10*1024*1024||file.size<44)throw Error('Choose a valid font up to 10 MB.');
 const buffer=await file.arrayBuffer(),bytes=new Uint8Array(buffer),signature=String.fromCharCode(...bytes.slice(0,4));
 if(signature!==(extension==='woff2'?'wOF2':'wOFF')||new DataView(buffer).getUint32(8)!==file.size)throw Error('The font file is invalid or corrupted.');
 try{await new FontFace('colti-upload-validation',buffer).load();}catch{throw Error('The font file cannot be loaded.');}
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',buffer)),b=>b.toString(16).padStart(2,'0')).join('');return {hash,extension,mime:extension==='woff2'?'font/woff2':'font/woff'};
}
